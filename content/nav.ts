import { siteConfig } from '@/config/site';

export type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string; summary: string }[];
};

/** 상단 메인 메뉴 — 시공사례는 실제 자료가 등록될 때만 노출된다. */
export function getNavItems(): NavItem[] {
  // 회사소개·사업분야는 메인 페이지 섹션으로 합쳐져 상단 메뉴에서 뺐다.
  const items: NavItem[] = [];

  if (siteConfig.projects.enabled) {
    items.push({ label: '시공사례', href: '/projects' });
  }
  if (siteConfig.support.enabled) {
    items.push({ label: '철거지원금 안내', href: '/support' });
  }
  items.push({ label: '견적문의', href: '/quote' });

  return items;
}
