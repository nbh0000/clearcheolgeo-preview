import Link from 'next/link';
import Logo from '@/components/Logo';
import { siteConfig } from '@/config/site';
import { hasPublishedProjects } from '@/content/projects';

/**
 * 푸터 — 사업자 정보는 config/site.ts 의 business 값이 채워졌을 때만 렌더링한다.
 * (확인되지 않은 항목은 화면에 표시하지 않는다.)
 */
export default function Footer() {
  const { business } = siteConfig;
  // 값이 있는 항목만 표시한다. PC 에서는 한 줄에 정돈되고, 좁은 화면에서는 항목 단위로 줄바꿈된다.
  const businessRows: { label: string; value: string; href?: string; numeric?: boolean }[] = [];
  if (business.legalName)
    businessRows.push({
      label: '상호명',
      value: `${business.legalName} (서비스명: ${siteConfig.brandName})`,
    });
  if (business.ceoName) businessRows.push({ label: '대표자', value: business.ceoName });
  if (business.registrationNumber)
    businessRows.push({ label: '사업자등록번호', value: business.registrationNumber, numeric: true });
  if (business.address) businessRows.push({ label: '주소', value: business.address });
  businessRows.push({
    label: '전화',
    value: siteConfig.phone.display,
    href: siteConfig.phone.href,
    numeric: true,
  });
  if (business.businessHours) businessRows.push({ label: '운영시간', value: business.businessHours });
  if (business.licenses.length)
    businessRows.push({ label: '허가·신고', value: business.licenses.join(' · ') });
  if (business.serviceAreas.length)
    businessRows.push({ label: '영업지역', value: business.serviceAreas.join(' · ') });

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <Logo variant="stacked" className="footer-logo" />
            <p className="body-sm mt-base">상가·인테리어철거 · 원상복구 · 폐기물처리 상담</p>
            <p className="caption-strong mt-base" style={{ color: 'var(--muted)' }}>
              대표 상담전화
            </p>
            <a className="footer-phone num" href={siteConfig.phone.href}>
              {siteConfig.phone.display}
            </a>
          </div>

          <div>
            <h3>바로가기</h3>
            <ul>
              <li>
                <Link href="/about">회사소개</Link>
              </li>
              <li>
                <Link href="/services/demolition">철거</Link>
              </li>
              <li>
                <Link href="/services/waste">폐기물처리</Link>
              </li>
              {hasPublishedProjects() && (
                <li>
                  <Link href="/projects">시공사례</Link>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h3>상담</h3>
            <ul>
              {siteConfig.support.enabled && (
                <li>
                  <Link href="/support">철거지원금 안내</Link>
                </li>
              )}
              <li>
                <Link href="/quote">견적문의</Link>
              </li>
              <li>
                <Link href="/privacy">개인정보처리방침</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="legal-band">
          <ul className="biz-list" aria-label="사업자 정보">
            {businessRows.map((row) => (
              <li className="biz-item" key={row.label}>
                <span className="biz-label">{row.label}</span>
                {row.href ? (
                  <a className={`biz-value${row.numeric ? ' num' : ''}`} href={row.href}>
                    {row.value}
                  </a>
                ) : (
                  <span className={`biz-value${row.numeric ? ' num' : ''}`}>{row.value}</span>
                )}
              </li>
            ))}
          </ul>
          <p className="copyright">{business.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
