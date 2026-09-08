import type { Metadata } from 'next';
import { readQuotes, readNotificationStatuses } from '@/lib/storage';
import { isNotifyConfigured } from '@/lib/notify';
import { siteConfig } from '@/config/site';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '접수 관리',
  robots: { index: false, follow: false },
};

const NOTIFY_LABEL: Record<string, string> = {
  not_configured: '알림 미연결',
  pending: '발송 대기',
  sent: '발송됨',
  failed: '발송 실패',
};

function formatKst(iso: string): string {
  const d = new Date(iso);
  const kst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${kst.getUTCFullYear()}-${pad(kst.getUTCMonth() + 1)}-${pad(kst.getUTCDate())} ${pad(
    kst.getUTCHours(),
  )}:${pad(kst.getUTCMinutes())}`;
}

/** 관리자 전용 접수 목록 (Basic 인증은 middleware.ts 에서 처리). */
export default async function AdminPage() {
  const [records, events] = await Promise.all([readQuotes(200), readNotificationStatuses()]);

  return (
    <section className="section">
      <div className="container">
        <h1 className="display-sm">견적문의 접수 목록</h1>
        <p className="body-sm mt-sm">
          최근 {records.length}건 · 저장 위치: 서버 데이터 디렉터리(quotes.jsonl) · 알림 연결{' '}
          {isNotifyConfigured() ? '설정됨' : '미설정'}
        </p>
        <p className="caption mt-xs">
          이 화면은 검색엔진에 노출되지 않으며, 관리자 인증 없이는 접근할 수 없습니다. 개인정보가
          포함되어 있으므로 취급에 주의해 주세요.
        </p>

        {records.length === 0 ? (
          <div className="notice mt-lg">아직 접수된 문의가 없습니다.</div>
        ) : (
          <div className="table-scroll mt-lg">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>접수번호</th>
                  <th>접수시각(KST)</th>
                  <th>유형</th>
                  <th>이름/상호</th>
                  <th>연락처</th>
                  <th>현장 주소</th>
                  <th>문의사항</th>
                  <th>추가 정보</th>
                  <th>첨부</th>
                  <th>동의</th>
                  <th>알림</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const notification = events.get(r.id)?.notification ?? r.notification;
                  const optional = Object.entries(r.optional).filter(([, v]) => v);
                  return (
                    <tr key={r.id}>
                      <td className="num">{r.id}</td>
                      <td>{formatKst(r.receivedAt)}</td>
                      <td>{r.typeLabel}</td>
                      <td>
                        {r.name}
                        {r.company ? ` / ${r.company}` : ''}
                      </td>
                      <td className="num">
                        <a href={`tel:${r.phone.replace(/[^0-9+]/g, '')}`}>{r.phone}</a>
                      </td>
                      <td>
                        {r.address}
                        {r.addressDetail ? ` ${r.addressDetail}` : ''}
                      </td>
                      <td style={{ whiteSpace: 'pre-wrap', minWidth: '240px' }}>{r.message}</td>
                      <td>
                        {optional.length === 0
                          ? '-'
                          : optional.map(([k, v]) => (
                              <div key={k}>
                                {k}: {v}
                              </div>
                            ))}
                      </td>
                      <td>
                        {r.attachments.length === 0
                          ? '-'
                          : r.attachments.map((a) => (
                              <div key={a.id}>
                                <a
                                  className="link-inline"
                                  href={`/api/admin/attachment/${r.id}/${a.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {a.originalName}
                                </a>
                              </div>
                            ))}
                      </td>
                      <td>
                        {r.consent.agreed ? '동의' : '미동의'}
                        <br />
                        <span className="caption">{r.consent.version}</span>
                      </td>
                      <td>{NOTIFY_LABEL[notification.status] ?? notification.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="notice mt-xl">
          <p className="title-sm">운영 안내</p>
          <ul className="dot-list mt-sm">
            <li>
              접수 데이터는 서버 파일시스템에 저장됩니다. 배포 환경이 파일시스템을 유지하지 않는
              경우(서버리스 등) DB 또는 오브젝트 스토리지 연동이 필요합니다.
            </li>
            <li>
              보유·이용 기간: {siteConfig.privacy.retentionPeriod} — 기간이 지난 기록은 운영자가
              파기해야 합니다.
            </li>
            <li>
              알림 연결(QUOTE_NOTIFY_WEBHOOK_URL)이 없으면 새 접수 알림이 발송되지 않습니다. 이
              화면에서 직접 확인해 주세요.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
