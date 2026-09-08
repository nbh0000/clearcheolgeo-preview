import Link from 'next/link';
import { siteConfig } from '@/config/site';

export default function NotFound() {
  return (
    <section className="section">
      <div className="container text-center">
        <p className="eyebrow">페이지를 찾을 수 없습니다</p>
        <h1 className="display-md mt-sm">요청하신 페이지가 없습니다.</h1>
        <p className="body-md mt-base">
          주소가 변경되었거나 아직 공개되지 않은 페이지일 수 있습니다.
        </p>
        <div className="btn-row mt-lg" style={{ justifyContent: 'center' }}>
          <Link className="btn btn-primary" href="/">
            메인으로
          </Link>
          <a className="btn btn-secondary" href={siteConfig.phone.href}>
            전화상담 <span className="num">{siteConfig.phone.display}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
