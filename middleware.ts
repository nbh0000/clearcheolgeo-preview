import { NextResponse, type NextRequest } from 'next/server';

/**
 * 관리자 영역 접근 제한 (HTTP Basic 인증).
 * ADMIN_USER / ADMIN_PASSWORD 환경변수가 설정된 경우에만 접근할 수 있다.
 * 미설정 시에는 누구도 접수 내용을 볼 수 없도록 503 으로 차단한다.
 */
export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};

function unauthorized() {
  return new NextResponse('인증이 필요합니다.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="clear-admin", charset="UTF-8"',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

/** 길이 노출을 줄이기 위한 상수 시간 비교 */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function middleware(request: NextRequest) {
  const user = process.env.ADMIN_USER;
  const password = process.env.ADMIN_PASSWORD;

  if (!user || !password) {
    return new NextResponse(
      '관리자 계정이 설정되지 않았습니다. 서버 환경변수 ADMIN_USER / ADMIN_PASSWORD 를 설정해 주세요.',
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
    );
  }

  const header = request.headers.get('authorization');
  if (!header?.startsWith('Basic ')) return unauthorized();

  let decoded = '';
  try {
    decoded = atob(header.slice(6));
  } catch {
    return unauthorized();
  }

  const sep = decoded.indexOf(':');
  if (sep < 0) return unauthorized();

  const givenUser = decoded.slice(0, sep);
  const givenPassword = decoded.slice(sep + 1);
  if (!safeEqual(givenUser, user) || !safeEqual(givenPassword, password)) {
    return unauthorized();
  }

  return NextResponse.next();
}
