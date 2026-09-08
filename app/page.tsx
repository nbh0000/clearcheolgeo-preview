import Link from 'next/link';
import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { services } from '@/content/services';
import { principles, processSteps } from '@/content/home';
import { faqs } from '@/content/faq';
import { getPublishedProjects, hasPublishedProjects } from '@/content/projects';
import { pageMetadata } from '@/lib/seo';
import Faq from '@/components/Faq';
import SupportBanner from '@/components/SupportBanner';
import CtaBand from '@/components/CtaBand';

export const metadata: Metadata = pageMetadata({
  title: '클리어철거 | 상가·인테리어철거 · 폐기물처리 상담',
  description:
    '상가·점포·사무실의 인테리어철거와 원상복구, 사업장·가정 폐기물처리 상담. 현장 상황에 맞는 작업 범위와 견적을 안내합니다. 상담전화 010-8814-2234.',
  path: '/',
});

/** 히어로 우측 레이어드 카드 — 상담 시 확인하는 항목을 요약해 보여준다. */
function HeroCards() {
  const rows = [
    { k: '현장 종류', v: '상가 · 사무실 · 공장 · 가정' },
    { k: '작업 범위', v: '전체 · 부분 철거 / 원상복구' },
    { k: '반출 조건', v: '층수 · 엘리베이터 · 차량 접근' },
    { k: '폐기물', v: '종류 · 물량 · 배출 장소' },
  ];
  return (
    <div className="card-stack">
      <div className="card-dark">
        <p className="caption-strong" style={{ color: 'var(--on-dark-soft)' }}>
          상담 시 함께 확인하는 항목
        </p>
        <div className="mt-base">
          {rows.map((row) => (
            <div className="kv-row" key={row.k}>
              <span className="k">{row.k}</span>
              <span className="v">{row.v}</span>
            </div>
          ))}
        </div>
        <p className="caption mt-base" style={{ color: 'var(--muted-soft)' }}>
          확인된 조건에 따라 작업 범위와 견적을 안내합니다.
        </p>
      </div>
      <div className="stack-back">
        <p className="caption-strong" style={{ color: 'var(--on-dark-soft)' }}>
          철거 + 폐기물처리
        </p>
        <p className="title-sm mt-xs" style={{ color: 'var(--on-dark)' }}>
          한 번의 상담으로 함께 정리
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  const projects = getPublishedProjects().slice(0, 3);

  return (
    <>
      {/* 1. 메인 비주얼 */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="container hero-grid">
          <div>
            <p className="badge-pill badge-pill-dark">상가·인테리어철거 · 폐기물처리</p>
            <h1 className="display-mega mt-base" id="hero-title">
              철거부터 폐기물 정리까지,
              <br />한 번에 클리어.
            </h1>
            <p className="lead hero-lead mt-md">
              상가·인테리어철거, 원상복구, 폐기물처리 상담.
              <br />
              현장 상황에 맞는 작업 범위와 견적을 안내합니다.
            </p>
            <div className="btn-row mt-lg">
              <Link className="btn btn-primary btn-lg" href="/quote">
                견적문의
              </Link>
              <a className="btn btn-outline-dark btn-lg" href={siteConfig.phone.href}>
                전화상담 <span className="num">{siteConfig.phone.display}</span>
              </a>
            </div>
            <p className="caption mt-base">
              문의는 대표 상담전화{' '}
              <a className="num" href={siteConfig.phone.href} style={{ color: 'var(--on-dark)' }}>
                {siteConfig.phone.display}
              </a>{' '}
              또는 견적문의로 남겨주세요.
            </p>
          </div>
          <HeroCards />
        </div>
      </section>

      {/* 2. 사업분야 */}
      <section className="section" aria-labelledby="services-title">
        <div className="container">
          <p className="eyebrow">사업분야</p>
          <h2 className="display-sm mt-sm" id="services-title">
            철거와 폐기물처리, 두 가지를 상담합니다.
          </h2>

          <div className="grid grid-2 mt-xl">
            {services.map((service) => (
              <article className="card card-hover" key={service.slug}>
                <h3 className="title-lg">{service.cardTitle}</h3>
                <p className="body-md mt-sm">{service.cardBody}</p>
                <ul className="dot-list body-sm mt-base">
                  {service.items.map((item) => (
                    <li key={item.title}>{item.title}</li>
                  ))}
                </ul>
                <div className="btn-row mt-lg">
                  <Link className="btn btn-secondary" href={service.href}>
                    {service.cardCta}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* 3. 업무 원칙 */}
      <section className="section band-soft" aria-labelledby="principles-title">
        <div className="container">
          <p className="eyebrow">업무 원칙</p>
          <h2 className="display-sm mt-sm" id="principles-title">
            일은 확실하게, 설명은 명확하게,
            <br />
            마무리는 깔끔하게.
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
        </div>
      </section>

      {/* 4. 철거지원금 안내 배너 */}
      <SupportBanner />

      {/* 5. 시공사례 — 공개 가능한 실제 사례가 있을 때만 노출 */}
      {hasPublishedProjects() && projects.length > 0 && (
        <section className="section" aria-labelledby="projects-title">
          <div className="container">
            <p className="eyebrow">시공사례</p>
            <h2 className="display-sm mt-sm" id="projects-title">
              실제 진행한 현장
            </h2>
            <div className="grid grid-3 mt-xl">
              {projects.map((project) => (
                <article className="card" key={project.slug}>
                  <span className="badge-pill">{project.usage}</span>
                  <h3 className="title-md mt-sm">{project.title}</h3>
                  <p className="body-sm mt-xs">
                    {project.region} · {project.scope.join(', ')}
                  </p>
                  <p className="mt-base">
                    <Link className="btn-tertiary" href={`/projects/${project.slug}`}>
                      사례 자세히 보기 →
                    </Link>
                  </p>
                </article>
              ))}
            </div>
            <p className="mt-lg">
              <Link className="btn btn-secondary" href="/projects">
                시공사례 전체 보기
              </Link>
            </p>
          </div>
        </section>
      )}

      {/* 6. 상담 및 작업 진행 과정 */}
      <section className="section band-soft" aria-labelledby="process-title">
        <div className="container">
          <p className="eyebrow">진행 과정</p>
          <h2 className="display-sm mt-sm" id="process-title">
            상담접수부터 마무리 확인까지
          </h2>

          <ol className="grid grid-3 mt-xl">
            {processSteps.map((step) => (
              <li className="card" key={step.step}>
                <span className="step-num">{step.step}</span>
                <h3 className="title-md mt-xs">{step.title}</h3>
                <p className="body-sm mt-xs">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 7. 자주 묻는 질문 */}
      <section className="section" aria-labelledby="faq-title">
        <div className="container">
          <p className="eyebrow">자주 묻는 질문</p>
          <h2 className="display-sm mt-sm" id="faq-title">
            상담 전에 많이 묻는 내용
          </h2>
          <div className="mt-xl">
            <Faq items={faqs} />
          </div>
        </div>
      </section>

      {/* 8. 마지막 상담 유도 */}
      <CtaBand />
    </>
  );
}
