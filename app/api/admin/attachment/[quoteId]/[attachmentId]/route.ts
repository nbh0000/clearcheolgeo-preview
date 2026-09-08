import { NextResponse } from 'next/server';
import { readAttachment } from '@/lib/storage';

/**
 * 첨부파일 조회 — 관리자 인증(middleware.ts)을 통과한 요청만 접근할 수 있다.
 * public 디렉터리에 두지 않으므로 공개 URL 로는 노출되지 않는다.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ quoteId: string; attachmentId: string }> },
) {
  const { quoteId, attachmentId } = await params;
  const file = await readAttachment(quoteId, attachmentId);
  if (!file) {
    return NextResponse.json({ ok: false, message: 'Not found' }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.data), {
    status: 200,
    headers: {
      'Content-Type': file.mimeType,
      'Content-Disposition': `inline; filename="${attachmentId}"`,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
