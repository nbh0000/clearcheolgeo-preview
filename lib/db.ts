/**
 * PostgreSQL 연결
 * ------------------------------------------------------------
 * 견적문의는 반드시 외부 PostgreSQL 에 저장한다.
 *
 * 연결 정보 우선순위
 *   1. Cloudflare Hyperdrive 바인딩 (`HYPERDRIVE`) — 운영(Cloudflare Workers)
 *   2. 환경변수 `DATABASE_URL` — 로컬 개발·테스트·기타 Node.js 호스팅
 *
 * Cloudflare Workers 는 요청 간에 소켓을 공유할 수 없으므로
 * 프로세스 전역 커넥션 풀 대신 **요청마다 클라이언트를 열고 닫는다.**
 * (Hyperdrive 가 실제 풀링을 담당한다)
 *
 * 연결 정보가 없으면 온라인 접수를 받지 않고 전화상담 안내로 대체한다.
 * (저장되지 않는데 접수된 것처럼 보이게 하지 않는다.)
 */
import { Client } from 'pg';
import { SCHEMA_SQL } from './schema';

type HyperdriveBinding = { connectionString: string };

/** Cloudflare 환경에서만 바인딩을 읽는다. 그 외 환경에서는 undefined. */
function hyperdrive(): HyperdriveBinding | undefined {
  try {
    // 정적 import 를 피해 Node.js 전용 실행(테스트 등)에서도 문제없이 동작하게 한다.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getCloudflareContext } = require('@opennextjs/cloudflare') as typeof import('@opennextjs/cloudflare');
    const env = getCloudflareContext().env as { HYPERDRIVE?: HyperdriveBinding };
    return env.HYPERDRIVE?.connectionString ? env.HYPERDRIVE : undefined;
  } catch {
    return undefined;
  }
}

function connectionString(): string | undefined {
  return hyperdrive()?.connectionString || process.env.DATABASE_URL || undefined;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(connectionString());
}

/**
 * SSL 설정
 * - Hyperdrive 경유 시 Workers↔Hyperdrive 구간은 Cloudflare 내부망이므로 SSL 을 쓰지 않는다.
 * - URL 에 sslmode 가 명시되어 있으면 pg 가 알아서 처리하도록 둔다.
 * - 사설망/로컬 주소면 SSL 을 쓰지 않는다.
 * - 그 외(외부 관리형 DB)는 SSL 을 사용하고 인증서를 검증한다.
 * - 제공자가 자체 서명 인증서를 쓰는 경우에만 DATABASE_SSL_INSECURE=1 로 검증을 완화한다.
 */
function sslConfig(url: string, viaHyperdrive: boolean) {
  if (viaHyperdrive) return false;
  if (/[?&]sslmode=/.test(url)) return undefined;

  let host = '';
  try {
    host = new URL(url).hostname;
  } catch {
    host = '';
  }

  const isLocal =
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host.endsWith('.internal') ||
    host.endsWith('.svc') ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host);

  if (isLocal) return false;

  return process.env.DATABASE_SSL_INSECURE === '1'
    ? { rejectUnauthorized: false }
    : { rejectUnauthorized: true };
}

/** 스키마 생성 여부 (프로세스/격리환경당 1회). 실패하면 다음 요청에서 다시 시도한다. */
const globalForDb = globalThis as unknown as { __clearSchemaReady?: boolean };

/**
 * 연결을 열고 fn 을 실행한 뒤 반드시 닫는다.
 * 테이블은 첫 호출 시 자동 생성한다 (CREATE TABLE IF NOT EXISTS).
 */
export async function withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const hd = hyperdrive();
  const url = hd?.connectionString || process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL(또는 HYPERDRIVE 바인딩)이 설정되지 않았습니다.');
  }

  const client = new Client({
    connectionString: url,
    ssl: sslConfig(url, Boolean(hd)),
    connectionTimeoutMillis: 10_000,
  });
  await client.connect();
  try {
    if (!globalForDb.__clearSchemaReady) {
      await client.query(SCHEMA_SQL);
      globalForDb.__clearSchemaReady = true;
    }
    return await fn(client);
  } finally {
    // 연결 오류로 프로세스가 죽지 않도록 한다. 개인정보는 로그에 남기지 않는다.
    await client.end().catch((err: Error) => console.error('[db] 연결 종료 오류:', err.message));
  }
}

/** 연결 상태 점검 (관리자 화면에서 사용) */
export async function checkDatabase(): Promise<{ ok: boolean; detail?: string }> {
  if (!isDatabaseConfigured()) return { ok: false, detail: 'DATABASE_URL 미설정' };
  try {
    await withClient((c) => c.query('SELECT 1'));
    return { ok: true };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : '알 수 없는 오류' };
  }
}
