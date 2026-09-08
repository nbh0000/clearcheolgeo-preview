import Link from 'next/link';
import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { services } from '@/content/services';
import { principles, processSteps } from '@/content/home';
import { pageMetadata } from '@/lib/seo';
import CtaBand from '@/components/CtaBand';

export const metadata: Metadata = pageMetadata({
  title: '회사소개',
  description:
    '클리어철거는 상가·인테리어철거와 원상복구, 폐기물처리 상담을 제공하는 현장 중심의 브랜드입니다. 작업 범위와 진행 절차를 명확히 안내합니다.',
  path: '/about',
});

export default function AboutPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">회사소개</p>
          <h1 className="display-lg mt-sm">
            철거의 시작부터,
            <br />
            정리의 마무리까지.
          </h1>
        </div>
      </section>

      {/* ① 브랜드 소개 */}
      <section className="section">
        <div className="container">
          <div className="grid grid-2">
            <div>
              <h2 className="display-sm">현장 중심의 철거·정리 브랜드</h2>
            </div>
            <div className="stack">
              <p className="body-md">
                클리어철거는 상가·인테리어철거와 원상복구, 폐기물처리 상담을 제공하는 현장 중심의
                브랜드입니다.
              </p>
              <p className="body-md">
                매장을 정리하거나 새로운 공간을 준비할 때, 고객이 먼저 확인해야 할 작업 범위와 진행
                절차를 명확히 안내하고자 합니다.
              </p>
              <p className="body-md">
                현장 상황을 확인하고 필요한 작업을 협의하며, 견적부터 마무리까지 이해하기 쉬운 설명을
                지향합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ② 두 가지 사업분야 */}
      <section className="section band-soft" aria-labelledby="about-services">
        <div className="container">
          <p className="eyebrow">사업분야</p>
          <h2 className="display-sm mt-sm" id="about-services">
            철거와 폐기물처리
          </h2>
          <div className="grid grid-2 mt-xl">
            {services.map((service) => (
              <article className="card" key={service.slug}>
                <h3 className="title-lg">{service.cardTitle}</h3>
                <p className="body-md mt-sm">{service.cardBody}</p>
                <p className="mt-base">
                  <Link className="btn-tertiary" href={service.href}>
                    {service.cardCta} →
                  </Link>
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ③ 업무 원칙 */}
      <section className="section" aria-labelledby="about-principles">
        <div className="container">
          <p className="eyebrow">업무 원칙</p>
          <h2 className="display-sm mt-sm" id="about-principles">
            일은 확실하게, 설명은 명확하게, 마무리는 깔끔하게.
          </h2>
          <div className="grid grid-4 mt-xl">
            {principles.map((item, i) => (
              <div className="card" key={item.title}>
                <span className="icon-plate num">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="title-md mt-base">{item.title}</h3>
                <p className="body-sm mt-xs">{item.body}</p>
              </div>
            ))}
          </div>
          <p className="caption mt-lg">
            위 원칙은 홈페이지 운영 원칙 초안입니다. 실제 운영 방식과 다른 내용이 있으면 수정할 수
            있습니다.
          </p>
        </div>
      </section>

      {/* ④ 상담 및 작업 진행 과정 */}
      <section className="section band-soft" aria-labelledby="about-process">
        <div className="container">
          <p className="eyebrow">진행 과정</p>
          <h2 className="display-sm mt-sm" id="about-process">
            상담접수부터 마무리 확인까지
          </h2>
          <ol className="mt-xl stack-lg">
            {processSteps.map((step) => (
              <li className="card step-row" key={step.step}>
                <span className="icon-plate num">{step.step}</span>
                <div>
                  <h3 className="title-md">{step.title}</h3>
                  <p className="body-sm mt-xs">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ⑤ 전화상담과 견적문의 */}
      <CtaBand
        title={['철거와 정리, 어디부터 물어봐야 할지', '모르셔도 괜찮습니다.']}
        body={`현장 상황을 알려주시면 확인이 필요한 항목부터 함께 정리해 드립니다. 대표 상담전화 ${siteConfig.phone.display}`}
      />
    </>
  );
}
