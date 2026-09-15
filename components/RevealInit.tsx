'use client';

import { useEffect } from 'react';

/**
 * 스크롤 등장 효과 초기화.
 * - data-reveal 속성이 있는 요소가 화면에 들어오면 data-reveal="in" 으로 바꾼다.
 * - JS 가 동작할 때만 html 에 js-reveal 클래스를 붙이므로, JS 없이도 내용은 그대로 보인다.
 * - 움직임 줄이기(prefers-reduced-motion) 설정이면 바로 표시한다.
 */
export default function RevealInit() {
  useEffect(() => {
    const root = document.documentElement;
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (els.length === 0) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || typeof IntersectionObserver === 'undefined') {
      els.forEach((el) => el.setAttribute('data-reveal', 'in'));
      return;
    }

    root.classList.add('js-reveal');
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-reveal', 'in');
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.1 },
    );
    els.forEach((el) => io.observe(el));

    return () => {
      io.disconnect();
      root.classList.remove('js-reveal');
    };
  }, []);

  return null;
}
