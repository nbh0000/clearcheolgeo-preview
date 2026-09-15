import Link from 'next/link';
import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { pageMetadata } from '@/lib/seo';
import { services } from '@/content/services';
import { aboutIntro, strengths } from '@/content/about';
import RevealInit from '@/components/RevealInit';
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

export default function HomePage() {
  const support = siteConfig.support;
  return (
    <>
      {/* 1. 메인 비주얼 */}
      <section className="hm-hero hm-dark" aria-labelledby="hero-title">
        <div className="hm-hero-bg" aria-hidden="true" />
        <div className="container hm-hero-inner">
          {/* 화면에는 사진만 보이고, 제목은 검색엔진·스크린리더용으로만 남긴다 */}
          <h1 className="sr-only" id="hero-title">
            {siteConfig.tagline}
          </h1>

          {/* 왼쪽 한 덩어리: 철거지원금 안내 + 버튼 */}
          <div className="hm-hero-block">
            {support.enabled && (
              <div className="hm-hero-support" aria-label="철거지원금 안내">
                <span className="hm-kicker">{support.programName}</span>
                <p className="hm-support-amount mt-lg">
                  <span className="amt-label">점포철거비</span>
                  <span className="amt">
                    최대 <span className="num">600</span>만원
                  </span>
                </p>
                <ul className="hm-fine">
                  {support.disclaimer.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="hm-hero-cta">
              <Link className="hm-btn hm-btn-solid" href="/quote?type=support">
                철거지원금 상담하기
              </Link>
              <Link className="hm-btn hm-btn-ghost" href="/support">
                지원금 안내 자세히 보기
              </Link>
              <a className="hm-hero-phone" href={siteConfig.phone.href}>
                <span className="lbl">전화상담</span>
                <span className="num">{siteConfig.phone.display}</span>
              </a>
            </div>

            <p className="hm-hero-scope" aria-label="상담 범위">
              <span>상가·인테리어철거</span>
              <span className="dot" aria-hidden="true">
                ·
              </span>
              <span>원상복구</span>
              <span className="dot" aria-hidden="true">
                ·
              </span>
              <span>폐기물처리</span>
            </p>
          </div>
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
