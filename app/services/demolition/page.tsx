import type { Metadata } from 'next';
import { demolitionService as svc } from '@/content/services';
import { pageMetadata } from '@/lib/seo';
import CtaBand from '@/components/CtaBand';

export const metadata: Metadata = pageMetadata({
  title: '철거 | 상가철거 · 인테리어철거 · 원상복구',
  description:
    '상가·점포철거, 인테리어·부분철거, 사무실 내부철거, 원상복구 상담. 철거 범위와 반출 조건을 확인하여 견적과 일정을 안내합니다.',
  path: '/services/demolition',
});

export default function DemolitionPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">사업분야 · 철거</p>
          <h1 className="display-lg mt-sm">
            {svc.pageTitle[0]}
            <br />
            {svc.pageTitle[1]}
          </h1>
          <p className="lead mt-md measure">{svc.pageLead}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid grid-2">
            {svc.items.map((item, i) => (
              <article className="card" key={item.title}>
                <span className="icon-plate num">{String(i + 1).padStart(2, '0')}</span>
                <h2 className="title-lg mt-base">{item.title}</h2>
                {item.targets && (
                  <p className="body-sm mt-xs">
                    <strong style={{ color: 'var(--ink)' }}>대상 예시</strong> · {item.targets}
                  </p>
                )}
                <p className="body-md mt-sm">{item.body}</p>
              </article>
            ))}
          </div>

          <div className="notice mt-xl">
            <p className="title-sm">견적과 일정에 영향을 주는 조건</p>
            <p className="mt-xs">{svc.conditionNotice}</p>
          </div>

          <div className="notice mt-base">
            <p className="title-sm">{svc.outOfScope.title}</p>
            <p className="mt-xs">{svc.outOfScope.body}</p>
          </div>
        </div>
      </section>

      <CtaBand
        title={['철거 범위 확인부터', '견적과 일정까지 안내합니다.']}
        quoteLabel="철거 견적문의"
        inquiryType="demolition"
      />
    </>
  );
}
