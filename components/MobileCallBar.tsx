'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { siteConfig } from '@/config/site';

/**
 * 모바일 하단 고정 상담바.
 * - body 에 하단 여백을 확보해 본문 마지막 요소를 가리지 않게 한다.
 * - 입력 중(가상 키보드 노출)에는 숨겨서 입력창·제출 버튼을 가리지 않게 한다.
 * - 안전영역(safe-area-inset-bottom)은 CSS 에서 처리한다.
 */
export default function MobileCallBar() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    document.body.dataset.mobileBar = 'on';
    return () => {
      delete document.body.dataset.mobileBar;
    };
  }, []);

  useEffect(() => {
    const isTextEntry = (el: EventTarget | null) =>
      el instanceof HTMLElement &&
      (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

    const onFocusIn = (e: FocusEvent) => {
      if (isTextEntry(e.target)) setHidden(true);
    };
    const onFocusOut = () => {
      // 다음 포커스 대상이 정해진 뒤 판단한다.
      window.setTimeout(() => {
        if (!isTextEntry(document.activeElement)) setHidden(false);
      }, 60);
    };

    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  return (
    <nav className="mobile-bar" data-hidden={hidden} aria-label="빠른 상담">
      <a className="mb-call" href={siteConfig.phone.href}>
        <span className="mb-label">전화상담</span>
        <span className="mb-num num">{siteConfig.phone.display}</span>
      </a>
      <Link className="mb-quote" href="/quote">
        견적문의
      </Link>
    </nav>
  );
}
