import { NextResponse } from 'next/server';
import { isDatabaseConfigured } from '@/lib/db';
import { deleteProject, getProject, updateProject } from '@/lib/projects';
import { parseProjectRequest } from '@/lib/projectsRequest';

/** 시공사례 수정·삭제 — 관리자 인증(middleware.ts)을 통과한 요청만 접근할 수 있다. */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Ctx) {
  const { id } = await params;
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, message: '데이터베이스가 설정되지 않았습니다.' }, { status: 503 });
  }
  try {
    const current = await getProject(id);
    if (!current) return NextResponse.json({ ok: false, message: 'Not found' }, { status: 404 });

    const parsed = await parseProjectRequest(request, current.photos.length);
    if (!parsed.ok) {
      return NextResponse.json({ ok: false, message: parsed.message, errors: parsed.errors }, { status: parsed.status });
    }
    const ok = await updateProject(id, parsed.input, parsed.photos, parsed.removePhotoIds, parsed.photoOrder);
    if (!ok) return NextResponse.json({ ok: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error(`[admin] 시공사례 수정 실패 id=${id}`, err instanceof Error ? err.message : err);
    return NextResponse.json(
      { ok: false, message: err instanceof Error ? err.message : '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  try {
    const ok = await deleteProject(id);
    if (!ok) return NextResponse.json({ ok: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error(`[admin] 시공사례 삭제 실패 id=${id}`, err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, message: '삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.' }, { status: 500 });
  }
}
