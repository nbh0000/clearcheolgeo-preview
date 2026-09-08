import type { Metadata } from 'next';
import { wasteService as svc } from '@/content/services';
import { pageMetadata } from '@/lib/seo';
import CtaBand from '@/components/CtaBand';

export const metadata: Metadata = pageMetadata({
  title: '폐기물처리 | 사업장·상가·철거현장·가정 폐기물 상담',
  description:
    '공장·사업장, 상가·사무실, 철거 현장, 가정에서 발생하는 폐기물의 종류와 물량, 반출 조건을 확인하여 처리 가능 범위와 견적을 안내합니다.',
  path: '/services/waste',
});

export default function WastePage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">사업분야 · 폐기물처리</p>
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
          <div className="notice">
            <p>{svc.commonNotice}</p>
          </div>

          <p className="caption mt-lg">{svc.classificationNote}</p>

          <div className="grid grid-2 mt-base">
            {svc.items.map((item, i) => (
              <article className="card" key={item.title}>
                <span className="icon-plate num">{String(i + 1).padStart(2, '0')}</span>
                <h2 className="title-lg mt-base">{item.title}</h2>
                {item.targets && (
                  <p className="body-sm mt-xs">
                    <strong style={{ color: 'var(--ink)' }}>상담 대상 예시</strong> · {item.targets}
                  </p>
                )}
                <p className="body-md mt-sm">{item.body}</p>
              </article>
            ))}
          </div>

          <div className="notice mt-xl">
            <p className="title-sm">{svc.specialNotice.title}</p>
            <p className="mt-xs">{svc.specialNotice.body}</p>
          </div>
        </div>
      </section>

      <CtaBand
        title={['폐기물의 종류와 물량을', '알려주시면 확인해 드립니다.']}
        quoteLabel="폐기물처리 견적문의"
        inquiryType="waste"
      />
    </>
  );
}
