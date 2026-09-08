import Link from 'next/link';
import type { Metadata } from 'next';
import { services } from '@/content/services';
import { pageMetadata } from '@/lib/seo';
import CtaBand from '@/components/CtaBand';

export const metadata: Metadata = pageMetadata({
  title: '사업분야',
  description:
    '클리어철거의 사업분야는 철거와 폐기물처리 두 가지입니다. 상가·점포·사무실 내부철거와 원상복구, 사업장·상가·철거현장·가정 폐기물 상담을 안내합니다.',
  path: '/services',
});

/** 사업분야 선택 화면 — 상단 메뉴에서 '사업분야'를 눌렀을 때 이동하는 페이지. */
export default function ServicesPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">사업분야</p>
          <h1 className="display-lg mt-sm">
            어떤 상담이 필요하신가요?
          </h1>
          <p className="lead mt-md measure">
            클리어철거의 사업분야는 철거와 폐기물처리 두 가지입니다. 필요한 분야를 선택하시면 상담
            범위와 확인 항목을 자세히 안내해 드립니다.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid grid-2">
            {services.map((service) => (
              <article className="card card-hover" key={service.slug}>
                <h2 className="title-lg">{service.cardTitle}</h2>
                <p className="body-md mt-sm">{service.cardBody}</p>
                <ul className="dot-list body-sm mt-base">
                  {service.items.map((item) => (
                    <li key={item.title}>
                      <strong style={{ color: 'var(--ink)' }}>{item.title}</strong>
                      {item.targets ? ` — ${item.targets}` : ''}
                    </li>
                  ))}
                </ul>
                <div className="btn-row mt-lg">
                  <Link className="btn btn-primary" href={service.href}>
                    {service.cardCta}
                  </Link>
                  <Link className="btn btn-secondary" href={`/quote?type=${service.slug}`}>
                    바로 견적문의
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        title={['철거와 폐기물처리를', '함께 상담할 수도 있습니다.']}
        body="한 현장에서 철거와 폐기물 반출이 함께 필요한 경우, 문의 유형에서 '철거 + 폐기물처리'를 선택해 주세요."
        quoteLabel="철거 + 폐기물처리 문의"
        inquiryType="both"
      />
    </>
  );
}
