/**
 * 견적문의 영구 저장 (Supabase)
 * ------------------------------------------------------------
 * 접수 1건은 quotes 테이블에, 첨부 이미지는 비공개 Storage 버킷에 저장하고
 * quote_attachments 에는 메타데이터만 남긴다.
 *
 * HTTP API 라 DB 트랜잭션을 쓸 수 없으므로 순서로 원자성을 보장한다.
 *  1) 첨부 업로드 → 2) 접수 행 저장 → 3) 첨부 메타 저장
 *  중간에 실패하면 이미 만든 것(업로드 파일·접수 행)을 지워 "반쯤 저장된" 기록을 남기지 않는다.
 *
 * 첨부 이미지는 공개 URL 이 없고, 관리자 인증을 통과한 요청만 조회할 수 있다.
 */
import crypto from 'node:crypto';
import { ATTACHMENT_BUCKET, getSupabase } from './db';


export type StoredAttachment = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
};

export type NotificationState = {
  channel: string;
  status: 'not_configured' | 'pending' | 'sent' | 'failed';
  detail?: string | null;
};

export type QuoteRecord = {
  /** 접수 식별자 (고객 안내용 접수번호) */
  id: string;
  /** 접수 시각 (ISO 8601, UTC) */
  receivedAt: string;
  type: string;
  typeLabel: string;
  name: string;
  company: string;
  phone: string;
  address: string;
  addressDetail: string;
  message: string;
  optional: {
    usage: string;
    area: string;
    areaUnit: string;
    preferredDate: string;
    floor: string;
    elevator: string;
    vehicleAccess: string;
  };
  attachments: StoredAttachment[];
  consent: {
    agreed: boolean;
    version: string;
    agreedAt: string;
  };
  meta: {
    /** 스팸 대응용 최소 정보만 남긴다. (원문 IP 대신 해시) */
    ipHash: string;
    userAgent: string;
  };
  /** 관리자 알림 발송 상태 — 저장 성공과 알림 성공을 구분해 기록한다. */
  notification: NotificationState;
};

/** 저장 직전의 첨부 (아직 DB 에 들어가지 않은 상태) */
export type PendingAttachment = {
  id: string;
  originalName: string;
  mimeType: string;
  data: Buffer;
};

/** 접수번호: Q + KST 날짜 + 랜덤 6자리 (예: Q20260908-K3F9QA) */
export function newQuoteId(now = new Date()): string {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const ymd = kst.toISOString().slice(0, 10).replace(/-/g, '');
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(6);
  let suffix = '';
  for (const b of bytes) suffix += alphabet[b % alphabet.length];
  return `Q${ymd}-${suffix}`;
}

export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT ?? 'clear-demolition-default-salt';
  return crypto.createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 16);
}

/** 이미지 매직바이트 검사 — 확장자/선언 MIME 만 믿지 않는다. */
export function sniffImageType(buf: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

/** 첨부 식별자 (조회 경로에 쓰이므로 형식을 고정한다) */
export function newAttachmentId(index: number): string {
  return `${String(index + 1).padStart(2, '0')}-${crypto.randomBytes(4).toString('hex')}`;
}

/** 원본 파일명은 기록용으로만 보관한다. (저장 경로로 사용하지 않는다) */
export function safeFileName(name: string): string {
  return name.replace(/[\\/\r\n]/g, '_').slice(0, 120);
}

/**
 * 접수 저장 — 첨부 업로드 → 접수 행 → 첨부 메타 순서로 저장한다.
 * 어느 단계든 실패하면 앞서 만든 것을 정리한 뒤 오류를 던진다. 성공 후에만 접수 완료로 응답해야 한다.
 */
export async function saveQuote(
  record: Omit<QuoteRecord, 'attachments'>,
  attachments: PendingAttachment[],
): Promise<void> {
  const sb = getSupabase();
  const uploaded: string[] = [];

  const cleanup = async () => {
    if (uploaded.length) {
      await sb.storage.from(ATTACHMENT_BUCKET).remove(uploaded).catch(() => {});
    }
    await sb.from('quotes').delete().eq('id', record.id).then(() => undefined, () => {});
  };

  try {
    // 1) 첨부 업로드
    for (const att of attachments) {
      const path = `${record.id}/${att.id}`;
      const { error } = await sb.storage
        .from(ATTACHMENT_BUCKET)
        .upload(path, att.data, { contentType: att.mimeType, upsert: false });
      if (error) throw new Error(`첨부 업로드 실패: ${error.message}`);
      uploaded.push(path);
    }

    // 2) 접수 행
    const { error: quoteError } = await sb.from('quotes').insert({
      id: record.id,
      received_at: record.receivedAt,
      type: record.type,
      type_label: record.typeLabel,
      name: record.name,
      company: record.company,
      phone: record.phone,
      address: record.address,
      address_detail: record.addressDetail,
      message: record.message,
      optional: record.optional,
      consent_agreed: record.consent.agreed,
      consent_version: record.consent.version,
      consent_agreed_at: record.consent.agreedAt,
      ip_hash: record.meta.ipHash,
      user_agent: record.meta.userAgent,
      notification_channel: record.notification.channel,
      notification_status: record.notification.status,
    });
    if (quoteError) throw new Error(`접수 저장 실패: ${quoteError.message}`);

    // 3) 첨부 메타
    if (attachments.length) {
      const { error: attError } = await sb.from('quote_attachments').insert(
        attachments.map((att) => ({
          id: att.id,
          quote_id: record.id,
          original_name: safeFileName(att.originalName),
          mime_type: att.mimeType,
          byte_size: att.data.length,
          storage_path: `${record.id}/${att.id}`,
        })),
      );
      if (attError) throw new Error(`첨부 정보 저장 실패: ${attError.message}`);
    }
  } catch (err) {
    await cleanup();
    throw err;
  }
}

/** 알림 발송 결과 기록 — 접수 저장과 분리되어 있어 실패해도 접수는 남는다. */
export async function updateNotification(
  quoteId: string,
  notification: NotificationState,
): Promise<void> {
  const { error } = await getSupabase()
    .from('quotes')
    .update({
      notification_channel: notification.channel,
      notification_status: notification.status,
      notification_detail: notification.detail ?? null,
    })
    .eq('id', quoteId);
  if (error) throw new Error(error.message);
}

type AttachmentRow = {
  id: string;
  original_name: string;
  mime_type: string;
  byte_size: number;
};

type QuoteRow = {
  id: string;
  received_at: string;
  type: string;
  type_label: string;
  name: string;
  company: string;
  phone: string;
  address: string;
  address_detail: string;
  message: string;
  optional: QuoteRecord['optional'];
  consent_agreed: boolean;
  consent_version: string;
  consent_agreed_at: string;
  ip_hash: string;
  user_agent: string;
  notification_channel: string;
  notification_status: NotificationState['status'];
  notification_detail: string | null;
  quote_attachments: AttachmentRow[] | null;
};

function toRecord(row: QuoteRow): QuoteRecord {
  const attachments = [...(row.quote_attachments ?? [])]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((a) => ({
      id: a.id,
      originalName: a.original_name,
      mimeType: a.mime_type,
      size: a.byte_size,
    }));
  return {
    id: row.id,
    receivedAt: new Date(row.received_at).toISOString(),
    type: row.type,
    typeLabel: row.type_label,
    name: row.name,
    company: row.company,
    phone: row.phone,
    address: row.address,
    addressDetail: row.address_detail,
    message: row.message,
    optional: row.optional,
    attachments,
    consent: {
      agreed: row.consent_agreed,
      version: row.consent_version,
      agreedAt: new Date(row.consent_agreed_at).toISOString(),
    },
    meta: { ipHash: row.ip_hash, userAgent: row.user_agent },
    notification: {
      channel: row.notification_channel,
      status: row.notification_status,
      detail: row.notification_detail,
    },
  };
}

/** 관리자 화면용 조회 (최신순). 첨부는 메타데이터만 함께 가져온다(이미지 본문 제외). */
export async function readQuotes(limit = 200): Promise<QuoteRecord[]> {
  const { data, error } = await getSupabase()
    .from('quotes')
    .select('*, quote_attachments(id, original_name, mime_type, byte_size)')
    .order('received_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as QuoteRow[]).map(toRecord);
}

/** 첨부 이미지 조회 — 관리자 인증을 통과한 요청에서만 호출된다. */
export async function readAttachment(
  quoteId: string,
  attachmentId: string,
): Promise<{ data: Buffer; mimeType: string } | null> {
  // 형식이 맞지 않으면 조회하지 않는다.
  if (!/^Q\d{8}-[A-Z0-9]{6}$/.test(quoteId)) return null;
  if (!/^\d{2}-[0-9a-f]{8}$/.test(attachmentId)) return null;

  const sb = getSupabase();
  const { data: row, error } = await sb
    .from('quote_attachments')
    .select('mime_type, storage_path')
    .eq('quote_id', quoteId)
    .eq('id', attachmentId)
    .maybeSingle<{ mime_type: string; storage_path: string }>();
  if (error) throw new Error(error.message);
  if (!row) return null;

  const { data: blob, error: dlError } = await sb.storage
    .from(ATTACHMENT_BUCKET)
    .download(row.storage_path);
  if (dlError || !blob) return null;
  return { data: Buffer.from(await blob.arrayBuffer()), mimeType: row.mime_type };
}
