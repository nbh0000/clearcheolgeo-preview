import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // 접수 데이터가 오가는 경로는 색인 대상에서 제외한다.
        disallow: ['/admin', '/api/'],
      },
    ],
    ...(siteConfig.siteUrl
      ? { sitemap: new URL('/sitemap.xml', siteConfig.siteUrl).toString() }
      : {}),
  };
}
