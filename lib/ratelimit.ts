/**
 * 요청 빈도 제한 (기본 스팸 방지)
 * ------------------------------------------------------------
 * 프로세스 메모리 기반의 간단한 슬라이딩 윈도우 카운터다.
 * 접수 데이터가 아니라 "차단 카운터"만 메모리에 두므로 재시작 시 초기화되어도 무방하다.
 * 다중 인스턴스로 확장할 경우 Redis 등 공유 저장소 구현으로 교체해야 한다. (README 참고)
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 10 * 60 * 1000; // 10분
const MAX_REQUESTS = 5; // 동일 IP 10분당 5건

export type RateLimitResult = { allowed: boolean; retryAfterSec: number };

export function checkRateLimit(key: string, now = Date.now()): RateLimitResult {
  // 오래된 항목 정리 (메모리 누수 방지)
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSec: 0 };
  }

  if (bucket.count >= MAX_REQUESTS) {
    return { allowed: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSec: 0 };
}

/** 테스트용 초기화 */
export function _resetRateLimit(): void {
  buckets.clear();
}

/**
 * 프록시 뒤에서도 동작하도록 클라이언트 IP 를 추정한다.
 *
 * ⚠ 운영 주의: x-forwarded-for 는 클라이언트가 위조할 수 있다.
 * 반드시 이 헤더를 프록시(nginx, 로드밸런서, Vercel 등)가 덮어쓰는 구성으로 배포해야
 * 요청 빈도 제한이 우회되지 않는다.
 */
export function clientIpFrom(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return headers.get('x-real-ip') ?? 'unknown';
}
