/**
 * 견적문의 영구 저장
 * ------------------------------------------------------------
 * 서버 파일시스템에 append-only JSONL 로 저장한다.
 * (메모리 저장이 아니므로 서버 재시작 후에도 접수 기록이 유지된다.)
 *
 * 저장 위치: QUOTE_DATA_DIR 환경변수, 미설정 시 <프로젝트>/data
 *   - quotes.jsonl        : 접수 레코드 (1줄 = 1건)
 *   - uploads/<접수번호>/  : 첨부 이미지 (공개 URL 없음, 관리자 인증 후에만 조회)
 *
 * ※ 서버리스(예: Vercel)처럼 파일시스템이 휘발되는 환경에 배포할 경우
 *   이 모듈을 DB/오브젝트 스토리지 구현으로 교체해야 한다. README 참고.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export type StoredAttachment = {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  /** 저장 경로 (dataDir 기준 상대경로) */
  storedPath: string;
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
  /** 관리자 알림 발송 상태 — 저장 성공과 알림 성공을 분리해 기록한다. */
  notification: {
    channel: string;
    status: 'not_configured' | 'pending' | 'sent' | 'failed';
    detail?: string;
  };
};

export function getDataDir(): string {
  return process.env.QUOTE_DATA_DIR
    ? path.resolve(process.env.QUOTE_DATA_DIR)
    : path.join(process.cwd(), 'data');
}

const quotesFile = () => path.join(getDataDir(), 'quotes.jsonl');
const uploadsDir = () => path.join(getDataDir(), 'uploads');
const eventsFile = () => path.join(getDataDir(), 'events.jsonl');

/** 접수번호: Q + KST 날짜 + 랜덤 6자리 (예: Q20260907-K3F9QA) */
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

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function saveAttachment(
  quoteId: string,
  index: number,
  originalName: string,
  mimeType: string,
  data: Buffer,
): Promise<StoredAttachment> {
  const dir = path.join(uploadsDir(), quoteId);
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  const id = `${String(index + 1).padStart(2, '0')}-${crypto.randomBytes(4).toString('hex')}`;
  const filename = `${id}.${EXT_BY_MIME[mimeType] ?? 'bin'}`;
  await fs.writeFile(path.join(dir, filename), data, { mode: 0o600 });
  return {
    id,
    // 원본 파일명은 경로 문자를 제거해 기록만 한다 (저장 파일명으로 사용하지 않는다).
    originalName: originalName.replace(/[\\/\r\n]/g, '_').slice(0, 120),
    mimeType,
    size: data.length,
    storedPath: path.posix.join('uploads', quoteId, filename),
  };
}

/** 접수 실패 시 이미 저장된 첨부를 정리한다. */
export async function removeQuoteUploads(quoteId: string): Promise<void> {
  await fs.rm(path.join(uploadsDir(), quoteId), { recursive: true, force: true }).catch(() => {});
}

export async function appendQuote(record: QuoteRecord): Promise<void> {
  const dir = getDataDir();
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  const line = `${JSON.stringify(record)}\n`;
  const fh = await fs.open(quotesFile(), 'a', 0o600);
  try {
    await fh.appendFile(line, 'utf8');
    await fh.sync(); // 디스크에 확정된 뒤에만 성공으로 응답한다.
  } finally {
    await fh.close();
  }
}

/** 관리자 화면용 조회 (최신순). */
export async function readQuotes(limit = 200): Promise<QuoteRecord[]> {
  let raw: string;
  try {
    raw = await fs.readFile(quotesFile(), 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw err;
  }
  const records: QuoteRecord[] = [];
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try {
      records.push(JSON.parse(line) as QuoteRecord);
    } catch {
      // 손상된 줄은 건너뛴다 (append-only 특성상 나머지 기록은 유효).
    }
  }
  return records.reverse().slice(0, limit);
}

export async function readAttachment(
  quoteId: string,
  attachmentId: string,
): Promise<{ data: Buffer; mimeType: string } | null> {
  // 경로 조작 방지: 허용된 문자만 통과시킨다.
  if (!/^Q\d{8}-[A-Z0-9]{6}$/.test(quoteId)) return null;
  if (!/^\d{2}-[0-9a-f]{8}$/.test(attachmentId)) return null;

  const dir = path.join(uploadsDir(), quoteId);
  let files: string[];
  try {
    files = await fs.readdir(dir);
  } catch {
    return null;
  }
  const match = files.find((f) => f.startsWith(`${attachmentId}.`));
  if (!match) return null;

  const ext = match.split('.').pop() ?? '';
  const mimeType =
    Object.entries(EXT_BY_MIME).find(([, e]) => e === ext)?.[0] ?? 'application/octet-stream';
  const data = await fs.readFile(path.join(dir, match));
  return { data, mimeType };
}

/**
 * 알림 발송 결과 이벤트 로그.
 * 접수 레코드는 저장 즉시 확정되고, 알림 결과는 이 파일에 따로 기록한다.
 * (알림 실패가 접수 저장에 영향을 주지 않도록 분리)
 */
export type QuoteEvent = {
  quoteId: string;
  at: string;
  notification: QuoteRecord['notification'];
};

export async function appendEvent(event: QuoteEvent): Promise<void> {
  const dir = getDataDir();
  await fs.mkdir(dir, { recursive: true, mode: 0o700 });
  await fs.appendFile(eventsFile(), `${JSON.stringify(event)}\n`, { encoding: 'utf8', mode: 0o600 });
}

/** 접수번호별 최신 알림 상태. */
export async function readNotificationStatuses(): Promise<Map<string, QuoteEvent>> {
  const map = new Map<string, QuoteEvent>();
  let raw: string;
  try {
    raw = await fs.readFile(eventsFile(), 'utf8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return map;
    throw err;
  }
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try {
      const event = JSON.parse(line) as QuoteEvent;
      map.set(event.quoteId, event);
    } catch {
      /* 손상된 줄 무시 */
    }
  }
  return map;
}
