import type { Metadata, Viewport } from 'next';
import './globals.css';
import './components.css';
import './home.css';
import './projects.css';
import './pages.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileCallBar from '@/components/MobileCallBar';
import QuickCta from '@/components/QuickCta';
import SupportPopup from '@/components/SupportPopup';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  // 최종 도메인 확정 후 NEXT_PUBLIC_SITE_URL 을 설정하면 절대 URL 이 적용된다.
  ...(siteConfig.siteUrl ? { metadataBase: new URL(siteConfig.siteUrl) } : {}),
  title: {
    default: '클리어철거 | 상가·인테리어철거 · 폐기물처리 상담',
    template: '%s | 클리어철거',
  },
  description: siteConfig.description,
  applicationName: siteConfig.brandName,
  formatDetection: { telephone: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ffffff',
};

/** 구조화 데이터 — 확인된 정보(상호·전화번호)만 포함한다. */
function organizationJsonLd() {
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.brandName,
    telephone: siteConfig.phone.display,
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: siteConfig.phone.intl,
        contactType: 'customer service',
        areaServed: 'KR',
        availableLanguage: ['ko'],
      },
    ],
  };
  if (siteConfig.siteUrl) data.url = siteConfig.siteUrl;
  if (siteConfig.business.legalName) data.legalName = siteConfig.business.legalName;
  if (siteConfig.business.address) data.address = siteConfig.business.address;
  return data;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* 한글을 지원하는 대체 글꼴 (Pretendard, SIL OFL 1.1) — DESIGN.md 의 Inter 계열 대체 */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600&display=swap"
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
      </head>
      <body>
        <a className="skip-link" href="#main">
          본문으로 건너뛰기
        </a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <QuickCta />
        <MobileCallBar />
        <SupportPopup />
      </body>
    </html>
  );
}
