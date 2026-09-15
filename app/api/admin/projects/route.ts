import { NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/db';
import { createProject } from '@/lib/projects';
import { parseProjectRequest } from '@/lib/projectsRequest';

/** 시공사례 등록 — 관리자 인증(middleware.ts)을 통과한 요청만 접근할 수 있다. */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, message: '데이터베이스가 설정되지 않았습니다.' }, { status: 503 });
  }
  const parsed = await parseProjectRequest(request);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, message: parsed.message, errors: parsed.errors }, { status: parsed.status });
  }
  try {
    const id = await createProject(parsed.input, parsed.photos);
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error('[admin] 시공사례 등록 실패', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 },
    );
  }
}
