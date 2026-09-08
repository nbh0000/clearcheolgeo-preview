'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { siteConfig } from '@/config/site';
import { kstDateKey } from '@/lib/kst';

const SESSION_KEY = 'clear:support-popup:seen-session';
const TODAY_KEY = 'clear:support-popup:hide-until-date';

/**
 * 철거지원금 안내 팝업 (모달)
 * - 메인페이지에서만, 세션당 1회 노출
 * - "오늘 하루 보지 않기" 는 한국시간 날짜가 바뀔 때까지 유지
 * - 견적문의 페이지에서는 노출하지 않는다 (입력 방해 금지)
 * - ESC / 닫기 버튼 / 배경 클릭으로 닫히고, 닫은 뒤 원래 포커스로 복귀
 * - 팝업을 닫아도 상단 메뉴와 메인 배너로 다시 접근할 수 있다
 */
export default function SupportPopup() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const cfg = siteConfig.support;

  useEffect(() => {
    if (!cfg.enabled || !cfg.popup.enabled) return;
    if (pathname !== '/') return;

    let hideToday = false;
    let seenSession = false;
    try {
      hideToday = window.localStorage.getItem(TODAY_KEY) === kstDateKey();
      seenSession = window.sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      // 스토리지를 쓸 수 없는 환경(프라이빗 모드 등)에서는 노출하지 않는다.
      return;
    }
    if (hideToday || seenSession) return;

    const timer = window.setTimeout(() => {
      openerRef.current = document.activeElement as HTMLElement | null;
      try {
        window.sessionStorage.setItem(SESSION_KEY, '1');
      } catch {
        /* 무시 */
      }
      setOpen(true);
    }, cfg.popup.delayMs);

    return () => window.clearTimeout(timer);
  }, [pathname, cfg]);

  const close = useCallback(() => {
    setOpen(false);
    openerRef.current?.focus?.();
  }, []);

  const hideToday = useCallback(() => {
    try {
      window.localStorage.setItem(TODAY_KEY, kstDateKey());
    } catch {
      /* 무시 */
    }
    close();
  }, [close]);

  // 열려 있는 동안: 배경 스크롤 잠금 + ESC 닫기 + 포커스 트랩
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;

      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, close]);

  if (!open) return null;

  const goQuote = () => {
    close();
    router.push('/quote?type=support');
  };

  return (
    <div
      className="popup-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="support-popup-title"
        aria-describedby="support-popup-body"
        ref={dialogRef}
      >
        <button type="button" className="popup-close" onClick={close} ref={closeRef}>
          <span aria-hidden="true">✕</span>
          <span className="sr-only">팝업 닫기</span>
        </button>

        <p className="eyebrow">{cfg.popup.eyebrow}</p>
        <h2 className="display-sm mt-sm" id="support-popup-title">
          {cfg.popup.title[0]}
          <br />
          <span className="popup-amount">{cfg.popup.title[1]}</span>
        </h2>

        <p className="body-md mt-base" id="support-popup-body">
          {cfg.popup.body}
        </p>

        <div className="btn-row mt-lg">
          <button type="button" className="btn btn-primary btn-lg btn-block" onClick={goQuote}>
            {cfg.popup.primaryLabel}
          </button>
          <a className="btn btn-secondary btn-block" href={siteConfig.phone.href}>
            전화상담 <span className="num">{siteConfig.phone.display}</span>
          </a>
        </div>

        <p className="mt-base">
          <Link className="btn-tertiary" href="/support" onClick={close}>
            철거지원금 안내 자세히 보기 →
          </Link>
        </p>

        <div className="notice mt-base">
          {cfg.disclaimer.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>

        <div className="popup-footer">
          <button type="button" className="today-off" onClick={hideToday}>
            오늘 하루 보지 않기
          </button>
          <button type="button" className="close-text" onClick={close}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
