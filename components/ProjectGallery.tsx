'use client';

import { useCallback, useEffect, useState } from 'react';

type Photo = { url: string; alt: string; width: number | null; height: number | null };

/**
 * 시공사례 사진 — 가로로 나열된 썸네일. 클릭하면 크게 보기(라이트박스)가 열린다.
 * 키보드(←/→/Esc)와 화면 탭으로 넘길 수 있다. JS 없이도 썸네일은 그대로 보인다.
 */
export default function ProjectGallery({ photos }: { photos: Photo[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const count = photos.length;

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback(
    (d: number) => setOpen((cur) => (cur === null ? cur : (cur + d + count) % count)),
    [count],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close, step]);

  if (count === 0) return null;

  const visible = photos.slice(0, 4);
  const extra = count - visible.length;

  return (
    <>
      <ul className="pj-photos" data-count={visible.length}>
        {visible.map((ph, i) => (
          <li key={ph.url}>
            <button type="button" className="pj-thumb" onClick={() => setOpen(i)} aria-label={`${ph.alt} 크게 보기`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ph.url} alt={ph.alt} loading="lazy" decoding="async" />
              {i === visible.length - 1 && extra > 0 && <span className="pj-thumb-more">+{extra}</span>}
            </button>
          </li>
        ))}
      </ul>

      {open !== null && (
        <div className="pj-lightbox" role="dialog" aria-modal="true" aria-label="사진 크게 보기" onClick={close}>
          <button type="button" className="pj-lb-close" onClick={close} aria-label="닫기">
            ×
          </button>
          {count > 1 && (
            <button
              type="button"
              className="pj-lb-nav pj-lb-prev"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
              aria-label="이전 사진"
            >
              ‹
            </button>
          )}
          <figure className="pj-lb-figure" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photos[open].url} alt={photos[open].alt} />
            <figcaption>
              {open + 1} / {count}
            </figcaption>
          </figure>
          {count > 1 && (
            <button
              type="button"
              className="pj-lb-nav pj-lb-next"
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
              aria-label="다음 사진"
            >
              ›
            </button>
          )}
        </div>
      )}
    </>
  );
}
