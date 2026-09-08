import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { isDatabaseConfigured } from '@/lib/db';
import { faqs } from '@/content/faq';
import { pageMetadata } from '@/lib/seo';
import Faq from '@/components/Faq';
import QuoteForm from './QuoteForm';

export const metadata: Metadata = pageMetadata({
  title: '견적문의',
  description:
    '철거·폐기물처리 견적문의. 현장 정보를 남겨주시면 작업 범위와 견적을 상담해 드립니다. 회원가입 없이 비공개로 접수됩니다.',
  path: '/quote',
});

// 저장소(DB)가 연결되지 않은 상태에서는 접수 폼 대신 전화상담 안내를 보여준다.
export const dynamic = 'force-dynamic';

export default async function QuotePage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">견적문의</p>
          <h1 className="display-lg mt-sm">
            현장 정보를 남겨주시면,
            <br />
            작업 범위와 견적을 상담해 드립니다.
          </h1>
          <p className="lead mt-md measure">
            정확한 견적은 작업 범위와 현장 조건을 확인한 후 안내합니다. 회원가입이나 로그인 없이
            문의하실 수 있습니다.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr)', maxWidth: '760px' }}>
            {siteConfig.quote.enabled && isDatabaseConfigured() ? (
              <QuoteForm initialType={params.type} />
            ) : (
              <div className="card">
                <h2 className="title-lg">현재는 전화로 상담을 받고 있습니다.</h2>
                <p className="body-md mt-sm">
                  온라인 견적문의 접수는 준비 중입니다. 아래 번호로 연락 주시면 현장 상황을 확인하고
                  작업 범위와 견적을 안내해 드리겠습니다.
                </p>
                <div className="btn-row mt-lg">
                  <a className="btn btn-primary btn-lg" href={siteConfig.phone.href}>
                    전화상담 <span className="num">{siteConfig.phone.display}</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section band-soft" aria-labelledby="quote-faq">
        <div className="container">
          <p className="eyebrow">자주 묻는 질문</p>
          <h2 className="display-sm mt-sm" id="quote-faq">
            문의 전에 확인하면 좋은 내용
          </h2>
          <div className="mt-xl">
            <Faq items={faqs} />
          </div>
        </div>
      </section>
    </>
  );
}
