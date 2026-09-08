import Link from 'next/link';
import { siteConfig } from '@/config/site';

/**
 * 철거지원금 안내 배너 (메인).
 * 금액과 적용 조건·주의사항을 같은 영역에 함께 표시한다.
 */
export default function SupportBanner() {
  const cfg = siteConfig.support;
  if (!cfg.enabled) return null;

  return (
    <section className="section band-dark" aria-labelledby="support-banner-title">
      <div className="container">
        <div className="support-banner">
          <div>
            <p className="eyebrow" style={{ color: 'var(--on-dark-soft)' }}>
              {cfg.programName}
            </p>
            <h2 className="display-md mt-sm" id="support-banner-title">
              폐업을 준비 중이신가요?
            </h2>
            <p className="amount-line mt-base">
              점포철거비 <span className="amount num">최대 600만원</span> 지원 대상인지 확인하세요.
            </p>
            <p className="body-md mt-sm measure">
              철거 견적과 함께 지원 대상 확인 방법, 신청 절차와 준비서류를 안내합니다.
            </p>
            <div className="notice notice-dark mt-lg">
              {cfg.disclaimer.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>

          <div className="btn-row" style={{ flexDirection: 'column', minWidth: '240px' }}>
            <Link className="btn btn-primary btn-lg btn-block" href="/quote?type=support">
              철거지원금 상담하기
            </Link>
            <Link className="btn btn-outline-dark btn-block" href="/support">
              지원금 안내 자세히 보기
            </Link>
            <a className="btn btn-secondary-dark btn-block" href={siteConfig.phone.href}>
              전화상담 <span className="num">{siteConfig.phone.display}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
