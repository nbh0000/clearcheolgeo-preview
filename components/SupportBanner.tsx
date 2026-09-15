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
    <section className="hm-section hm-dark hm-support" aria-labelledby="support-banner-title">
      <div className="container">
        <div className="hm-support-grid">
          <div>
            <span className="hm-label">{cfg.programName}</span>
            <h2 className="hm-support-title mt-md" id="support-banner-title">
              폐업 예정 점포의 철거비 지원
            </h2>
            <p className="hm-display hm-display-lg hm-support-amount">
              점포철거비
              <br />
              <span className="amt">
                최대 <span className="num">600</span>만원
              </span>
            </p>
            <p className="hm-support-lead mt-lg">
              지원요건에 해당하는지 상담 후 신청 절차와 준비서류를 안내드립니다.
            </p>
            <div className="hm-fine">
              {cfg.disclaimer.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>

          <div className="hm-support-actions">
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
