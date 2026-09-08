import { siteConfig } from '@/config/site';
import { hasPublishedProjects } from '@/content/projects';

export type NavItem = {
  label: string;
  href: string;
  children?: { label: string; href: string; summary: string }[];
};

/** 상단 메인 메뉴 — 시공사례는 실제 자료가 등록될 때만 노출된다. */
export function getNavItems(): NavItem[] {
  const items: NavItem[] = [
    { label: '회사소개', href: '/about' },
    {
      label: '사업분야',
      href: '/services',
      children: [
        {
          label: '철거',
          href: '/services/demolition',
          summary: '상가·점포·사무실 내부철거와 원상복구',
        },
        {
          label: '폐기물처리',
          href: '/services/waste',
          summary: '사업장·상가·철거현장·가정 폐기물 상담',
        },
      ],
    },
  ];

  if (hasPublishedProjects()) {
    items.push({ label: '시공사례', href: '/projects' });
  }
  if (siteConfig.support.enabled) {
    items.push({ label: '철거지원금 안내', href: '/support' });
  }
  items.push({ label: '견적문의', href: '/quote' });

  return items;
}
