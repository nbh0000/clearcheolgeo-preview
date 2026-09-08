/**
 * 견적문의 영구 저장 (PostgreSQL)
 * ------------------------------------------------------------
 * 접수 1건과 첨부 이미지를 **하나의 트랜잭션**으로 저장한다.
 * 중간에 실패하면 전부 롤백되므로 "일부만 저장된" 상태가 남지 않는다.
 *
 * 첨부 이미지는 DB(BYTEA)에 저장한다.
 *  - 공개 URL 이 존재하지 않고, 관리자 인증을 통과한 요청만 조회할 수 있다.
 *  - 사진 용량이 그대로 DB 용량이므로 요금제 저장공간을 함께 확인해야 한다. (README 참고)
 */
import crypto from 'node:crypto';
import { ensureSchema, getPool } from './db';
import {
  INSERT_ATTACHMENT_SQL,
  INSERT_QUOTE_SQL,
  SELECT_ATTACHMENT_SQL,
  SELECT_QUOTES_SQL,
  UPDATE_NOTIFICATION_SQL,
} from './schema';

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
 * 접수 저장 — 접수 1건 + 첨부 전체를 한 트랜잭션으로 커밋한다.
 * 커밋이 끝난 뒤에만 성공으로 응답해야 한다.
 */
export async function saveQuote(
  record: Omit<QuoteRecord, 'attachments'>,
  attachments: PendingAttachment[],
): Promise<void> {
  await ensureSchema();
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await client.query(INSERT_QUOTE_SQL, [
      record.id,
      record.receivedAt,
      record.type,
      record.typeLabel,
      record.name,
      record.company,
      record.phone,
      record.address,
      record.addressDetail,
      record.message,
      JSON.stringify(record.optional),
      record.consent.agreed,
      record.consent.version,
      record.consent.agreedAt,
      record.meta.ipHash,
      record.meta.userAgent,
      record.notification.channel,
      record.notification.status,
    ]);

    for (const att of attachments) {
      await client.query(INSERT_ATTACHMENT_SQL, [
        att.id,
        record.id,
        safeFileName(att.originalName),
        att.mimeType,
        att.data.length,
        att.data,
      ]);
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/** 알림 발송 결과 기록 — 접수 저장과 분리되어 있어 실패해도 접수는 남는다. */
export async function updateNotification(
  quoteId: string,
  notification: NotificationState,
): Promise<void> {
  await ensureSchema();
  await getPool().query(UPDATE_NOTIFICATION_SQL, [
    quoteId,
    notification.channel,
    notification.status,
    notification.detail ?? null,
  ]);
}

type QuoteRow = {
  id: string;
  received_at: Date;
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
  consent_agreed_at: Date;
  ip_hash: string;
  user_agent: string;
  notification_channel: string;
  notification_status: NotificationState['status'];
  notification_detail: string | null;
  attachments: StoredAttachment[];
};

function toRecord(row: QuoteRow): QuoteRecord {
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
    attachments: row.attachments ?? [],
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

/** 관리자 화면용 조회 (최신순) */
export async function readQuotes(limit = 200): Promise<QuoteRecord[]> {
  await ensureSchema();
  const res = await getPool().query<QuoteRow>(SELECT_QUOTES_SQL, [limit]);
  return res.rows.map(toRecord);
}

/** 첨부 이미지 조회 — 관리자 인증을 통과한 요청에서만 호출된다. */
export async function readAttachment(
  quoteId: string,
  attachmentId: string,
): Promise<{ data: Buffer; mimeType: string } | null> {
  // 형식이 맞지 않으면 조회하지 않는다.
  if (!/^Q\d{8}-[A-Z0-9]{6}$/.test(quoteId)) return null;
  if (!/^\d{2}-[0-9a-f]{8}$/.test(attachmentId)) return null;

  await ensureSchema();
  const res = await getPool().query<{ mime_type: string; data: Buffer }>(SELECT_ATTACHMENT_SQL, [
    quoteId,
    attachmentId,
  ]);
  const row = res.rows[0];
  if (!row) return null;
  return { data: row.data, mimeType: row.mime_type };
}
