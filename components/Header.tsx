'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { siteConfig } from '@/config/site';
import { getNavItems } from '@/content/nav';

export default function Header() {
  const pathname = usePathname();
  const navItems = getNavItems();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const panelId = useId();

  // 경로가 바뀌면 열려 있던 메뉴를 닫는다.
  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
  }, [pathname]);

  // 모바일 시트가 열려 있는 동안 배경 스크롤 잠금
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  // 바깥 클릭 / ESC 로 드롭다운 닫기
  useEffect(() => {
    if (!openMenu) return;
    const onDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [openMenu]);

  const isCurrent = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="wordmark" aria-label={`${siteConfig.brandName} 홈으로`}>
          <span>클리어</span>
          <span className="wordmark-accent">철거</span>
        </Link>

        <nav className="nav-desktop" aria-label="주요 메뉴" ref={navRef}>
          {navItems.map((item) =>
            item.children ? (
              <div className="nav-item" key={item.href}>
                <button
                  type="button"
                  className="nav-trigger"
                  aria-expanded={openMenu === item.href}
                  aria-controls={`${panelId}-${item.label}`}
                  onClick={() => setOpenMenu(openMenu === item.href ? null : item.href)}
                >
                  {item.label}
                </button>
                {openMenu === item.href && (
                  <div className="nav-panel" id={`${panelId}-${item.label}`}>
                    <Link href={item.href}>
                      <span className="np-title">사업분야 전체 보기</span>
                      <span className="np-sum">철거·폐기물처리 안내를 한 화면에서 확인</span>
                    </Link>
                    {item.children.map((child) => (
                      <Link href={child.href} key={child.href}>
                        <span className="np-title">{child.label}</span>
                        <span className="np-sum">{child.summary}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Link
                href={item.href}
                key={item.href}
                aria-current={isCurrent(item.href) ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="header-actions">
          <a className="header-phone" href={siteConfig.phone.href}>
            <span className="hp-label">전화상담</span>
            <span className="hp-num num">{siteConfig.phone.display}</span>
          </a>
          <Link className="btn btn-primary" href="/quote">
            견적문의
          </Link>
        </div>

        <button
          type="button"
          className="menu-toggle"
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          <span className="bars" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          {mobileOpen ? '닫기' : '메뉴'}
        </button>
      </div>

      {mobileOpen && (
        <div className="mobile-sheet" id="mobile-menu">
          <div className="container">
            <ul>
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                  {item.children && (
                    <div className="sub">
                      {item.children.map((child) => (
                        <Link href={child.href} key={child.href}>
                          — {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <div className="btn-row mt-lg">
              <a className="btn btn-secondary btn-block" href={siteConfig.phone.href}>
                전화상담 <span className="num">{siteConfig.phone.display}</span>
              </a>
              <Link className="btn btn-primary btn-block" href="/quote">
                견적문의
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
