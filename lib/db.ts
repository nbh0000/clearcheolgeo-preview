/**
 * PostgreSQL 연결
 * ------------------------------------------------------------
 * 견적문의는 반드시 외부 PostgreSQL 에 저장한다.
 *
 * 배경: 클라우드타입은 디스크 마운트를 지원하지 않아 컨테이너에 파일로 저장하면
 * 재시작·재배포 시 사라진다. 따라서 파일 저장 방식은 사용하지 않는다.
 *
 * 필요한 환경변수: DATABASE_URL
 *   예) postgresql://사용자:비밀번호@호스트:5432/DB이름
 *
 * DATABASE_URL 이 없으면 온라인 접수를 받지 않고 전화상담 안내로 대체한다.
 * (저장되지 않는데 접수된 것처럼 보이게 하지 않는다.)
 */
import { Pool } from 'pg';
import { SCHEMA_SQL } from './schema';

/** 개발 중 핫리로드에서 커넥션이 계속 늘어나지 않도록 전역에 보관한다. */
const globalForDb = globalThis as unknown as {
  __clearPool?: Pool;
  __clearSchemaReady?: Promise<void>;
};

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

/**
 * SSL 설정
 * - URL 에 sslmode 가 명시되어 있으면 pg 가 알아서 처리하도록 둔다.
 * - 사설망/로컬 주소면 SSL 을 쓰지 않는다.
 * - 그 외(외부 관리형 DB)는 SSL 을 사용하고 인증서를 검증한다.
 * - 제공자가 자체 서명 인증서를 쓰는 경우에만 DATABASE_SSL_INSECURE=1 로 검증을 완화한다.
 *   (중간자 공격에 취약해지므로 꼭 필요한 경우에만 사용)
 */
function sslConfig(url: string) {
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

export function getPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL 이 설정되지 않았습니다.');
  }

  if (!globalForDb.__clearPool) {
    globalForDb.__clearPool = new Pool({
      connectionString: url,
      ssl: sslConfig(url),
      max: Number(process.env.DATABASE_POOL_MAX ?? 5),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
    // 연결 오류로 프로세스가 죽지 않도록 한다. 개인정보는 로그에 남기지 않는다.
    globalForDb.__clearPool.on('error', (err) => {
      console.error('[db] 유휴 커넥션 오류:', err.message);
    });
  }

  return globalForDb.__clearPool;
}

/** 테이블 생성 (프로세스당 1회, 여러 번 호출해도 안전) */
export function ensureSchema(): Promise<void> {
  if (!globalForDb.__clearSchemaReady) {
    globalForDb.__clearSchemaReady = getPool()
      .query(SCHEMA_SQL)
      .then(() => undefined)
      .catch((err) => {
        // 실패 시 다음 요청에서 다시 시도할 수 있도록 캐시를 비운다.
        globalForDb.__clearSchemaReady = undefined;
        throw err;
      });
  }
  return globalForDb.__clearSchemaReady;
}

/** 연결 상태 점검 (관리자 화면에서 사용) */
export async function checkDatabase(): Promise<{ ok: boolean; detail?: string }> {
  if (!isDatabaseConfigured()) return { ok: false, detail: 'DATABASE_URL 미설정' };
  try {
    await ensureSchema();
    await getPool().query('SELECT 1');
    return { ok: true };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : '알 수 없는 오류' };
  }
}
