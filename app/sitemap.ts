import type { MetadataRoute } from 'next';
import { siteConfig } from '@/config/site';
import { listProjects } from '@/lib/projects';
import { isDatabaseConfigured } from '@/lib/db';

/**
 * 사이트맵.
 * 최종 도메인(NEXT_PUBLIC_SITE_URL)이 설정되기 전에는 임의의 도메인을 만들지 않고
 * 빈 사이트맵을 반환한다. 도메인 확정 후 환경변수만 설정하면 자동으로 생성된다.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.siteUrl;
  if (!base) return [];

  const paths = ['/', '/services/demolition', '/services/waste', '/quote', '/privacy'];
  if (siteConfig.support.enabled) paths.push('/support');

  if (siteConfig.projects.enabled) {
    paths.push('/projects');
    if (isDatabaseConfigured()) {
      try {
        const { items } = await listProjects({ publishedOnly: true, limit: 200 });
        items.forEach((p) => paths.push(`/projects#${p.id}`));
      } catch {
        // DB 를 읽지 못해도 사이트맵 자체는 생성한다.
      }
    }
  }

  const now = new Date();
  return paths.map((path) => ({
    url: new URL(path, base).toString(),
    lastModified: now,
    changeFrequency: path === '/' ? 'weekly' : 'monthly',
    priority: path === '/' ? 1 : 0.7,
  }));
}
