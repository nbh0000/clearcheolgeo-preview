import type { Metadata } from 'next';
import { readQuotes, type QuoteRecord } from '@/lib/storage';
import { checkDatabase, isDatabaseConfigured } from '@/lib/db';
import { isNotifyConfigured } from '@/lib/notify';
import { siteConfig } from '@/config/site';
import DeleteQuoteButton from '@/components/DeleteQuoteButton';

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

const OPTIONAL_LABEL: Record<string, string> = {
  usage: '업종/용도',
  area: '면적',
  areaUnit: '단위',
  preferredDate: '희망일',
  floor: '층수',
  elevator: '엘리베이터',
  vehicleAccess: '차량접근',
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
  const dbStatus = await checkDatabase();

  let records: QuoteRecord[] = [];
  let loadError: string | null = null;
  if (dbStatus.ok) {
    try {
      records = await readQuotes(200);
    } catch (err) {
      loadError = err instanceof Error ? err.message : '조회 중 오류가 발생했습니다.';
    }
  }

  return (
    <section className="section">
      <div className="container">
        <h1 className="display-sm">견적문의 접수 목록</h1>
        <p className="body-sm mt-sm">
          저장소: PostgreSQL · 연결 {dbStatus.ok ? '정상' : '오류'} · 알림 연결{' '}
          {isNotifyConfigured() ? '설정됨' : '미설정'}
          {dbStatus.ok ? ` · 최근 ${records.length}건` : ''}
        </p>
        <p className="caption mt-xs">
          이 화면은 검색엔진에 노출되지 않으며, 관리자 인증 없이는 접근할 수 없습니다. 개인정보가
          포함되어 있으므로 취급에 주의해 주세요.
        </p>

        {!isDatabaseConfigured() && (
          <div className="notice mt-lg" style={{ borderColor: 'var(--semantic-down)' }}>
            <p className="title-sm" style={{ color: 'var(--semantic-down)' }}>
              데이터베이스가 연결되지 않았습니다
            </p>
            <p className="mt-xs">
              환경변수 <strong>DATABASE_URL</strong> 이 설정되지 않아 온라인 견적문의 접수가
              중단되어 있습니다. 고객에게는 전화상담 안내가 표시되며, 접수는 저장되지 않습니다.
            </p>
          </div>
        )}

        {isDatabaseConfigured() && !dbStatus.ok && (
          <div className="notice mt-lg" style={{ borderColor: 'var(--semantic-down)' }}>
            <p className="title-sm" style={{ color: 'var(--semantic-down)' }}>
              데이터베이스에 연결하지 못했습니다
            </p>
            <p className="mt-xs">{dbStatus.detail}</p>
            <p className="mt-xs">
              접수가 저장되지 않는 상태입니다. DATABASE_URL 값과 DB 상태를 확인해 주세요.
            </p>
          </div>
        )}

        {loadError && (
          <div className="notice mt-lg" style={{ borderColor: 'var(--semantic-down)' }}>
            <p className="title-sm" style={{ color: 'var(--semantic-down)' }}>
              목록을 불러오지 못했습니다
            </p>
            <p className="mt-xs">{loadError}</p>
          </div>
        )}

        {dbStatus.ok && !loadError && records.length === 0 && (
          <div className="notice mt-lg">아직 접수된 문의가 없습니다.</div>
        )}

        {records.length > 0 && (
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
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const optional = Object.entries(r.optional ?? {}).filter(([, v]) => v);
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
                                {OPTIONAL_LABEL[k] ?? k}: {v}
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
                      <td>{NOTIFY_LABEL[r.notification.status] ?? r.notification.status}</td>
                      <td>
                        <DeleteQuoteButton quoteId={r.id} />
                      </td>
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
              접수 데이터는 외부 PostgreSQL 에 저장됩니다. 컨테이너를 재배포해도 유지되지만,
              <strong> DB 자동 백업이 켜져 있는지 반드시 확인</strong>해 주세요.
            </li>
            <li>
              첨부 사진도 DB 에 저장되므로 요금제의 저장공간을 함께 확인해 주세요. (사진 1장 최대{' '}
              {siteConfig.quote.maxFileSizeMb}MB · 접수당 최대 {siteConfig.quote.maxFiles}장)
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
