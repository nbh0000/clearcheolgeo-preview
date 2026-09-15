import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { pageMetadata } from '@/lib/seo';

const cfg = siteConfig.support;

export const metadata: Metadata = pageMetadata({
  title: '철거지원금 안내 | 점포철거비 지원 상담',
  description:
    '폐업·폐업예정 소상공인을 위한 점포철거비 지원(희망리턴패키지 원스톱폐업지원) 안내. 지원 대상 확인 방법, 신청 절차, 준비서류를 철거 견적과 함께 안내합니다.',
  path: '/support',
});

/** 클리어철거의 역할 — 지원금 지급·승인 주체가 아님을 명확히 한다. */
const ourRole = [
  {
    title: '철거 견적 안내',
    body: '현장의 철거 범위와 반출 조건을 확인하여 견적을 안내합니다.',
  },
  {
    title: '지원 대상 확인 방법 안내',
    body: '공고에서 정한 대상 요건을 어디서 어떻게 확인하는지 안내합니다.',
  },
  {
    title: '신청 절차·준비서류 안내',
    body: '신청 순서와 일반적으로 요구되는 서류의 종류를 안내합니다.',
  },
];

const notOurRole = [
  '지원금을 지급하거나 지급을 대행하지 않습니다.',
  '지원 대상 여부와 지급액을 심사하거나 결정하지 않습니다.',
  '정부기관 또는 정부 지정업체가 아닙니다.',
];

const steps = [
  { title: '지원사업 공고 확인', who: '신청인', body: '신청 시점의 공식 공고에서 대상 요건, 접수 기간, 지원 한도를 먼저 확인합니다.' },
  { title: '철거 상담·견적', who: '클리어철거', body: '현장 상황을 확인해 철거 범위와 견적을 안내받습니다.' },
  { title: '신청 및 서류 준비', who: '신청인', body: '공식 신청처를 통해 신청하고, 공고에서 요구하는 서류를 준비합니다.' },
  { title: '철거 진행 및 증빙 정리', who: '클리어철거', body: '협의된 범위로 작업을 진행하고, 정산에 필요한 증빙 자료를 정리합니다.' },
];

export default function SupportPage() {
  if (!cfg.enabled) notFound();
  const eligibility = cfg.eligibility;

  return (
    <>
      {/* 1. 지원사업 소개 */}
      <section className="sp-hero" aria-labelledby="sp-title">
        <div className="sp-wrap sp-hero-grid">
          <div>
            <p className="sp-org">
              <span className="sp-org-mark" aria-hidden="true" />
              소상공인시장진흥공단
            </p>
            <h1 className="sp-title" id="sp-title">
              희망리턴패키지 원스톱폐업 지원
            </h1>
            <p className="sp-lead">
              소상공인이 부득이 폐업에 이른 경우, 실패 부담을 최소화하기 위해
              <br />
              폐업에 필요한 정보·비용·각종 애로사항을 신속하게 지원하는 제도입니다.
            </p>
            <p className="sp-lead sp-lead-sub">
              그중 <strong>점포철거비 지원</strong>은 폐업 예정 점포의 철거 비용을 돕는 항목입니다.
              클리어철거에서 철거 견적과 함께 지원 대상 확인 방법, 신청 절차와 준비서류를
              안내합니다.
            </p>
            <div className="btn-row mt-lg">
              <Link className="hm-btn hm-btn-dark" href="/quote?type=support">
                지원금·철거 함께 상담하기
              </Link>
              <a className="hm-btn hm-btn-line" href={siteConfig.phone.href}>
                전화상담 <span className="num">{siteConfig.phone.display}</span>
              </a>
            </div>
          </div>

          <aside className="sp-amount-card">
            <span className="hm-label">{cfg.amountConditionText}</span>
            <p className="sp-amount">
              <span className="amt">
                최대 <span className="num">600</span>만원
              </span>
            </p>
            <ul className="sp-fine">
              {cfg.disclaimer.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <p className="sp-official">
              공식 신청처{' '}
              <a href={cfg.officialUrl} target="_blank" rel="noopener noreferrer">
                {cfg.officialUrlLabel} ↗
              </a>
            </p>
          </aside>
        </div>
      </section>

      {/* 2. 클리어철거의 역할 */}
      <section className="sp-section sp-soft" aria-labelledby="sp-role">
        <div className="sp-wrap">
          <div className="sp-head">
            <span className="hm-label">클리어철거의 역할</span>
            <h2 className="sp-h2" id="sp-role">
              철거 견적과 함께
              <br />
              확인 방법을 안내합니다.
            </h2>
            <p className="sp-lead">
              점포철거비 지원은 폐업 과정의 부담을 덜기 위한 정부 지원사업입니다. 지원 여부와
              지급액은 신청 당시의 공식 공고와 심사 결과에 따릅니다.
            </p>
          </div>
          <ol className="sp-cards">
            {ourRole.map((item, i) => (
              <li className="sp-card" key={item.title}>
                <span className="hm-idx">{String(i + 1).padStart(2, '0')}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 3. 지원 대상 확인 (다크) */}
      <section className="sp-section sp-dark" aria-labelledby="sp-check">
        <div className="sp-wrap">
          <div className="sp-head sp-head-center">
            <h2 className="sp-h2" id="sp-check">
              지원 대상 확인
            </h2>
            <p className="sp-lead">
              {eligibility.length > 0
                ? '아래 항목 중 하나라도 해당하면 지원이 어려울 수 있습니다. 최종 판단은 공식 공고와 심사 결과에 따릅니다.'
                : '지원 대상 요건은 신청 시점의 공식 공고에서 확인합니다. 상담 시 어디서 어떻게 확인하는지 함께 안내합니다.'}
            </p>
          </div>

          {eligibility.length > 0 && (
            <ul className="sp-check-list">
              {eligibility.map((item) => (
                <li className="sp-check-card" key={item.title}>
                  <h3>{item.title}</h3>
                  <ul>
                    {item.lines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}

          <div className="sp-check-note">
            <div>
              <h3>클리어철거가 하지 않는 일</h3>
              <ul>
                {notOurRole.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>안내 기준</h3>
              <p>{cfg.sourceNote}</p>
              <a className="sp-check-link" href={cfg.officialUrl} target="_blank" rel="noopener noreferrer">
                {cfg.officialUrlLabel} ↗
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 4. 진행 절차 */}
      <section className="sp-section" aria-labelledby="sp-steps">
        <div className="sp-wrap">
          <div className="sp-head sp-head-center">
            <span className="hm-label">진행 절차 안내</span>
            <h2 className="sp-h2" id="sp-steps">
              신청은 이런 순서로 진행됩니다.
            </h2>
          </div>
          <ol className="sp-steps">
            {steps.map((step, i) => (
              <li className="sp-step" key={step.title} data-us={step.who === '클리어철거'}>
                <span className="sp-step-num">
                  <b>{i + 1}</b>
                  <small>Step</small>
                </span>
                <h3>{step.title}</h3>
                <span className="sp-step-who">{step.who}</span>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
          <p className="caption sp-steps-note">
            세부 절차와 제출서류는 공고와 접수 방식에 따라 달라질 수 있습니다. 최신 기준은 공식
            신청처에서 확인해 주세요.
          </p>
        </div>
      </section>

      {/* 5. 안내 배너 */}
      <section className="sp-section sp-banner-wrap" aria-labelledby="sp-cta">
        <div className="sp-wrap">
          <div className="sp-banner">
            <div>
              <h2 className="sp-h2" id="sp-cta">
                지원 대상 확인과 철거 견적을
                <br />
                한 번의 상담으로 안내합니다.
              </h2>
              <p className="sp-lead">
                현장 상황을 알려주시면 철거 범위·견적과 함께 지원 대상 확인 방법, 신청 절차와
                준비서류를 안내합니다.
              </p>
              <div className="btn-row mt-lg">
                <Link className="hm-btn hm-btn-dark" href="/quote?type=support">
                  지원금·철거 함께 상담하기
                </Link>
                <a className="hm-btn hm-btn-line" href={siteConfig.phone.href}>
                  전화상담 <span className="num">{siteConfig.phone.display}</span>
                </a>
              </div>
            </div>
            <div className="sp-banner-amount" aria-hidden="true">
              <span>점포철거비</span>
              <strong>
                최대 <span className="num">600</span>만원
              </strong>
              <small>{cfg.amountConditionText}</small>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
