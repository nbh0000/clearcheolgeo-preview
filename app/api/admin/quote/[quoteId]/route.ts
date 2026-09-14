import { NextResponse } from 'next/server';
import { deleteQuote } from '@/lib/storage';

/**
 * 접수 삭제 — 관리자 인증(middleware.ts)을 통과한 요청만 접근할 수 있다.
 * 접수 행과 첨부 파일·메타를 함께 삭제한다. (개인정보 파기)
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ quoteId: string }> },
) {
  const { quoteId } = await params;
  try {
    const ok = await deleteQuote(quoteId);
    if (!ok) {
      return NextResponse.json({ ok: false, message: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true, quoteId });
  } catch (err) {
    // 개인정보를 로그에 남기지 않는다 — 실패 사실과 접수번호만 기록한다.
    console.error(`[admin] 삭제 실패 quoteId=${quoteId}`, err instanceof Error ? err.message : err);
    return NextResponse.json(
      { ok: false, message: '삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 },
    );
  }
}
