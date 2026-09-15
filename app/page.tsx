import Link from 'next/link';
import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { pageMetadata } from '@/lib/seo';
import { services } from '@/content/services';
import { aboutIntro, strengths } from '@/content/about';
import RevealInit from '@/components/RevealInit';
import SupportBanner from '@/components/SupportBanner';
import Logo from '@/components/Logo';

export const metadata: Metadata = pageMetadata({
  title: '클리어철거 | 상가·인테리어철거 · 폐기물처리 상담',
  description: `상가·점포·사무실의 인테리어철거와 원상복구, 사업장·가정 폐기물처리 상담. 현장 상황에 맞는 작업 범위와 견적을 안내합니다. 상담전화 ${siteConfig.phone.display}.`,
  path: '/',
});

/** 문장 안의 키워드(철거·폐기물처리·원상복구)를 강조 표시한다. */
function emphasize(text: string) {
  const words = [...aboutIntro.keywords].sort((x, y) => y.length - x.length);
  const re = new RegExp(`(${words.join('|')})`, 'g');
  return text.split(re).map((part, i) =>
    (words as readonly string[]).includes(part) ? <em key={i}>{part}</em> : <span key={i}>{part}</span>,
  );
}

/** 히어로 우측 레이어드 카드 — 상담 시 확인하는 항목을 요약해 보여준다. */
function HeroCards() {
  const rows = [
    { k: '현장 종류', v: '상가 · 사무실 · 공장 · 가정' },
    { k: '작업 범위', v: '전체 · 부분 철거 / 원상복구' },
    { k: '반출 조건', v: '층수 · 엘리베이터 · 차량 접근' },
    { k: '폐기물', v: '종류 · 물량 · 배출 장소' },
  ];
  return (
    <div className="card-dark hero-card">
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
      {/* 하단 안내 — 별도 카드로 겹쳐 두지 않고 같은 카드 안에서 구분선으로 정리 */}
      <div className="hero-card-note">
        <p className="caption-strong" style={{ color: 'var(--on-dark-soft)' }}>
          철거와 폐기물 정리
        </p>
        <p className="title-sm mt-xs" style={{ color: 'var(--on-dark)' }}>
          한 번의 상담으로 함께 안내합니다.
        </p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      {/* 1. 메인 비주얼 */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="container hero-grid">
          <div>
            <p className="badge-pill badge-pill-dark">상가·인테리어철거 · 폐기물처리</p>
            <h1 className="display-mega hero-title mt-base" id="hero-title">
              <span className="hero-line">철거부터</span>
              <span className="hero-line">폐기물 정리까지,</span>
              <span className="hero-line">한 번에 클리어</span>
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

      {/* 2. 회사소개 — 왼쪽 카드(로고 + 세 가지 기준) · 오른쪽 소개 */}
      <section className="hm-section hm-light" id="about" aria-labelledby="about-title">
        <div className="hm-wrap">
          <div className="hm-about">
            <aside className="hm-about-card" data-reveal>
              <div className="hm-about-logo">
                <Logo variant="stacked" asImage />
              </div>
              <ol className="hm-about-list">
                {strengths.map((item, i) => (
                  <li key={item.title} data-reveal style={{ '--d': `${200 + i * 120}ms` } as React.CSSProperties}>
                    <span className="hm-about-icon" aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </aside>

            <div className="hm-about-body">
              <span className="hm-label" data-reveal>
                회사소개
              </span>
              <h2 className="hm-about-title" id="about-title" data-reveal style={{ '--d': '80ms' } as React.CSSProperties}>
                {aboutIntro.title.map((line) => (
                  <span className="l" key={line}>
                    {emphasize(line)}
                  </span>
                ))}
              </h2>
              <p className="hm-about-lead" data-reveal style={{ '--d': '160ms' } as React.CSSProperties}>
                {aboutIntro.lead.map((line) => (
                  <span className="l" key={line}>
                    {emphasize(line)}
                  </span>
                ))}
              </p>
              <div className="hm-about-cta" data-reveal style={{ '--d': '240ms' } as React.CSSProperties}>
                <Link className="hm-btn hm-btn-line" href="/quote">
                  견적문의
                </Link>
              </div>
              <p className="hm-about-point" data-reveal style={{ '--d': '320ms' } as React.CSSProperties}>
                {aboutIntro.bodyTitle.join(' ')}
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 2-1. 철거지원금 안내 */}
      <SupportBanner />

      {/* 3. 사업분야 (사업분야 페이지 내용) */}
      <section className="hm-section" id="services" aria-labelledby="services-title">
        <div className="hm-wrap">
          <div className="hm-grid hm-intro">
            <div className="hm-col-7" data-reveal>
              <span className="hm-label">사업분야</span>
              <h2 className="hm-title" id="services-title">
                어떤 상담이 필요하신가요?
              </h2>
            </div>
            <p className="hm-col-4 hm-col-end hm-lead" data-reveal style={{ '--d': '120ms' } as React.CSSProperties}>
              클리어철거의 사업분야는 철거와 폐기물처리 두 가지입니다. 필요한 분야를 선택하시면 상담
              범위와 확인 항목을 자세히 안내해 드립니다.
            </p>
          </div>

          {/* 두 분야 패널 */}
          <div className="hm-panels">
            {services.map((service, i) => (
              <article
                className="hm-panel"
                key={service.slug}
                data-reveal
                style={{ '--d': `${i * 120}ms` } as React.CSSProperties}
              >
                <div className="hm-panel-head">
                  <span className="hm-idx">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{service.cardTitle}</h3>
                  <p>{service.cardBody}</p>
                </div>
                <ul className="hm-items">
                  {service.items.map((item) => (
                    <li key={item.title}>
                      <strong>{item.title}</strong>
                      {item.targets && <span>{item.targets}</span>}
                    </li>
                  ))}
                </ul>
                <div className="hm-panel-actions">
                  <Link className="hm-btn hm-btn-dark" href={service.href}>
                    {service.cardCta}
                  </Link>
                  <Link className="hm-btn hm-btn-line" href={`/quote?type=${service.slug}`}>
                    바로 견적문의
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <RevealInit />
    </>
  );
}
