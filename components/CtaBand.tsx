import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { quoteHref } from '@/content/inquiry';
import type { InquiryTypeValue } from '@/content/inquiry';

type Props = {
  title?: string[];
  body?: string;
  quoteLabel?: string;
  inquiryType?: InquiryTypeValue;
  tone?: 'dark' | 'light';
};

/** 페이지 마지막 상담 유도 영역 (전화 / 견적문의). */
export default function CtaBand({
  title = ['현장 상황을 알려주세요.', '필요한 작업부터 함께 정리하겠습니다.'],
  body,
  quoteLabel = '견적문의',
  inquiryType,
  tone = 'dark',
}: Props) {
  const dark = tone === 'dark';
  return (
    <section className={`section ${dark ? 'band-dark' : 'band-soft'}`} aria-labelledby="cta-title">
      <div className="container text-center">
        <h2 className="display-md mx-auto" id="cta-title" style={{ maxWidth: '22ch' }}>
          {title.map((line, i) => (
            <span key={line}>
              {i > 0 && <br />}
              {line}
            </span>
          ))}
        </h2>
        {body && (
          <p className="body-md mt-base mx-auto measure">{body}</p>
        )}
        <div className="btn-row mt-lg" style={{ justifyContent: 'center' }}>
          <Link className="btn btn-primary btn-lg" href={quoteHref(inquiryType)}>
            {quoteLabel}
          </Link>
          <a
            className={`btn btn-lg ${dark ? 'btn-outline-dark' : 'btn-outline'}`}
            href={siteConfig.phone.href}
          >
            전화상담 <span className="num">{siteConfig.phone.display}</span>
          </a>
        </div>
      </div>
    </section>
  );
}
