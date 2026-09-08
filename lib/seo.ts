import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';

/**
 * 페이지별 메타데이터 헬퍼.
 * 최종 도메인이 확정되지 않았으므로 NEXT_PUBLIC_SITE_URL 이 없으면
 * 절대 URL(canonical/OG url)을 만들지 않는다. (가짜 도메인 금지)
 */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
}): Metadata {
  const { title, description, path, noindex } = opts;
  const canonical = siteConfig.siteUrl ? new URL(path, siteConfig.siteUrl).toString() : undefined;

  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: 'website',
      siteName: siteConfig.brandName,
      title,
      description,
      locale: 'ko_KR',
      ...(canonical ? { url: canonical } : {}),
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}
