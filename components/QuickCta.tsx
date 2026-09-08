import Link from 'next/link';
import { siteConfig } from '@/config/site';

/**
 * PC 우측 하단 고정 상담 버튼.
 * 본문을 가리지 않도록 폭을 좁게 유지하고, 전화번호는 헤더·푸터·본문에서 항상 확인할 수 있다.
 * (모바일에서는 하단 고정 상담바가 이 역할을 대신한다.)
 */
export default function QuickCta() {
  return (
    <aside className="quick-cta" aria-label="빠른 상담">
      <a
        className="qc-btn qc-call"
        href={siteConfig.phone.href}
        aria-label={`전화상담 ${siteConfig.phone.display}`}
      >
        <span className="qc-icon" aria-hidden="true">
          ☎
        </span>
        전화상담
      </a>
      <Link className="qc-btn qc-quote" href="/quote">
        <span className="qc-icon" aria-hidden="true">
          ✎
        </span>
        견적문의
      </Link>
    </aside>
  );
}
