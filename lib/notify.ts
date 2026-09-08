/**
 * 관리자 알림 연결 지점
 * ------------------------------------------------------------
 * 실제 이메일/문자 발송 서비스는 아직 연결되어 있지 않다.
 * QUOTE_NOTIFY_WEBHOOK_URL 환경변수가 설정되면 해당 엔드포인트로
 * "새 접수 알림"만 POST 한다. (개인정보 본문은 보내지 않는다.)
 *
 * 저장 성공과 알림 성공은 분리해서 기록한다. 알림이 실패해도 접수는 유실되지 않는다.
 */
import type { QuoteRecord } from './storage';

export type NotifyResult = QuoteRecord['notification'];

export function isNotifyConfigured(): boolean {
  return Boolean(process.env.QUOTE_NOTIFY_WEBHOOK_URL);
}

export async function notifyNewQuote(
  record: Pick<QuoteRecord, 'id' | 'receivedAt' | 'typeLabel'> & { attachmentCount: number },
): Promise<NotifyResult> {
  const url = process.env.QUOTE_NOTIFY_WEBHOOK_URL;
  if (!url) {
    return { channel: 'none', status: 'not_configured' };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      // 이름·연락처·주소·문의내용은 전송하지 않는다. 상세 내용은 관리자 화면에서 확인.
      body: JSON.stringify({
        event: 'quote.received',
        quoteId: record.id,
        receivedAt: record.receivedAt,
        inquiryType: record.typeLabel,
        attachmentCount: record.attachmentCount,
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      return { channel: 'webhook', status: 'failed', detail: `HTTP ${res.status}` };
    }
    return { channel: 'webhook', status: 'sent' };
  } catch (err) {
    return {
      channel: 'webhook',
      status: 'failed',
      detail: err instanceof Error ? err.name : 'unknown error',
    };
  }
}
