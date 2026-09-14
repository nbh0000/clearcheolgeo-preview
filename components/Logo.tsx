import Link from 'next/link';
import { siteConfig } from '@/config/site';

/**
 * 클리어철거 로고
 * ------------------------------------------------------------
 * 제공된 로고 원본(벡터)에서 추출한 SVG 를 그대로 사용한다. (public/logo/)
 * - 원본 비율·색상·글자는 변경하지 않는다.
 * - 'stacked'    : 제공된 세로형 로고 그대로 (푸터)
 * - 'horizontal' : 제공된 심벌과 워드마크를 가로로 나란히 배치 (헤더 — 높이 64px 안에서 글자가 읽히도록)
 * - 어두운 배경에서는 제공된 흰색 버전(…-white.svg)을 사용한다.
 *
 * SVG 의 실제 크기 (pt) — 비율 계산용
 */
const SYMBOL = { w: 188.18, h: 173.07 };
const WORDMARK = { w: 190.1, h: 37.4 };
const STACKED = { w: 190.1, h: 228.8 };

type Props = {
  variant: 'horizontal' | 'stacked';
  /** 어두운 배경 위에 놓일 때 true → 흰색 버전 */
  onDark?: boolean;
  className?: string;
  /** 링크 없이 이미지만 필요할 때 */
  asImage?: boolean;
};

export default function Logo({ variant, onDark = false, className = '', asImage = false }: Props) {
  const suffix = onDark ? '-white' : '';
  const alt = siteConfig.brandName;

  const image =
    variant === 'stacked' ? (
      <img
        src={`/logo/clear-logo-stacked${suffix}.svg`}
        alt={alt}
        width={STACKED.w}
        height={STACKED.h}
        className="logo-stacked"
        decoding="async"
      />
    ) : (
      <span className="logo-horizontal" role="img" aria-label={alt}>
        <img
          src={`/logo/clear-symbol${suffix}.svg`}
          alt=""
          aria-hidden="true"
          width={SYMBOL.w}
          height={SYMBOL.h}
          className="logo-symbol"
          decoding="async"
        />
        <img
          src={`/logo/clear-wordmark${suffix}.svg`}
          alt=""
          aria-hidden="true"
          width={WORDMARK.w}
          height={WORDMARK.h}
          className="logo-wordmark"
          decoding="async"
        />
      </span>
    );

  if (asImage) return <span className={className}>{image}</span>;

  return (
    <Link href="/" className={`logo-link ${className}`.trim()} aria-label={`${alt} 홈으로`}>
      {image}
    </Link>
  );
}
