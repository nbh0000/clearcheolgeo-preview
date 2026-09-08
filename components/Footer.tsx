import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { hasPublishedProjects } from '@/content/projects';

/**
 * 푸터 — 사업자 정보는 config/site.ts 의 business 값이 채워졌을 때만 렌더링한다.
 * (확인되지 않은 항목은 화면에 표시하지 않는다.)
 */
export default function Footer() {
  const { business } = siteConfig;
  const businessRows: { label: string; value: string }[] = [];
  if (business.legalName) businessRows.push({ label: '상호', value: business.legalName });
  if (business.ceoName) businessRows.push({ label: '대표자', value: business.ceoName });
  if (business.registrationNumber)
    businessRows.push({ label: '사업자등록번호', value: business.registrationNumber });
  if (business.address) businessRows.push({ label: '주소', value: business.address });
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
            <div className="wordmark">
              <span>클리어</span>
              <span className="wordmark-accent">철거</span>
            </div>
            <p className="body-sm mt-sm">상가·인테리어철거 · 원상복구 · 폐기물처리 상담</p>
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
          {businessRows.length > 0 && (
            <p>
              {businessRows.map((row, i) => (
                <span key={row.label}>
                  {i > 0 && ' · '}
                  {row.label} {row.value}
                </span>
              ))}
            </p>
          )}
          <p>
            © {new Date().getFullYear()} {siteConfig.brandName}. 문의는 대표 상담전화{' '}
            <a className="num" href={siteConfig.phone.href}>
              {siteConfig.phone.display}
            </a>{' '}
            또는 <Link href="/quote">견적문의</Link>로 남겨주세요.
          </p>
        </div>
      </div>
    </footer>
  );
}
