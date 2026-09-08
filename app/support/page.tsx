import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { pageMetadata } from '@/lib/seo';
import CtaBand from '@/components/CtaBand';

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
  {
    step: '01',
    title: '지원사업 공고 확인',
    body: '신청 시점의 공식 공고에서 대상 요건, 접수 기간, 지원 한도를 먼저 확인합니다.',
  },
  {
    step: '02',
    title: '철거 상담·견적',
    body: '현장 상황을 확인해 철거 범위와 견적을 안내받습니다.',
  },
  {
    step: '03',
    title: '신청 및 서류 준비',
    body: '공식 신청처를 통해 신청하고, 공고에서 요구하는 서류를 준비합니다.',
  },
  {
    step: '04',
    title: '철거 진행 및 증빙 정리',
    body: '협의된 범위로 작업을 진행하고, 정산에 필요한 증빙 자료를 정리합니다.',
  },
];

export default function SupportPage() {
  if (!cfg.enabled) notFound();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">{cfg.popup.eyebrow}</p>
          <h1 className="display-lg mt-sm">
            점포철거비,
            <br />
            <span style={{ color: 'var(--primary)' }}>{cfg.amountText}</span> 지원 대상인지
            확인하세요.
          </h1>
          <p className="lead mt-md measure">
            폐업을 준비 중이라면 철거비 지원제도를 먼저 확인해 보세요. 클리어철거에서 철거 견적과 함께
            지원 대상 확인 방법, 신청 절차와 준비서류를 안내합니다.
          </p>
          <div className="btn-row mt-lg">
            <Link className="btn btn-primary btn-lg" href="/quote?type=support">
              지원금·철거 함께 상담하기
            </Link>
            <a className="btn btn-outline btn-lg" href={siteConfig.phone.href}>
              전화상담 <span className="num">{siteConfig.phone.display}</span>
            </a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid grid-2">
            <div>
              <p className="eyebrow">지원사업 개요</p>
              <h2 className="display-sm mt-sm">{cfg.programName}</h2>
              <p className="amount-line mt-lg">
                {cfg.amountConditionText} <span className="amount num">최대 600만원</span>
              </p>
              <p className="body-md mt-sm">
                점포철거비 지원은 폐업 과정의 부담을 덜기 위한 정부 지원사업입니다. 지원 여부와
                지급액은 신청 당시의 공식 공고와 심사 결과에 따릅니다.
              </p>
              <p className="body-sm mt-base">
                공식 신청처:{' '}
                <a
                  className="link-inline"
                  href={cfg.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {cfg.officialUrlLabel}
                </a>
              </p>
            </div>

            <div className="notice">
              <p className="title-sm">반드시 확인해 주세요</p>
              <ul className="dot-list mt-sm">
                {cfg.disclaimer.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p className="mt-base caption">{cfg.sourceNote}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section band-soft" aria-labelledby="our-role">
        <div className="container">
          <p className="eyebrow">클리어철거의 역할</p>
          <h2 className="display-sm mt-sm" id="our-role">
            철거 견적과 함께 확인 방법을 안내합니다.
          </h2>

          <div className="grid grid-3 mt-xl">
            {ourRole.map((item) => (
              <div className="card" key={item.title}>
                <h3 className="title-md">{item.title}</h3>
                <p className="body-sm mt-xs">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="notice mt-lg">
            <p className="title-sm">클리어철거가 하지 않는 일</p>
            <ul className="dot-list mt-sm">
              {notOurRole.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="support-steps">
        <div className="container">
          <p className="eyebrow">진행 순서</p>
          <h2 className="display-sm mt-sm" id="support-steps">
            신청은 이런 순서로 진행됩니다.
          </h2>
          <ol className="grid grid-4 mt-xl">
            {steps.map((step) => (
              <li className="card" key={step.step}>
                <span className="step-num">{step.step}</span>
                <h3 className="title-md mt-xs">{step.title}</h3>
                <p className="body-sm mt-xs">{step.body}</p>
              </li>
            ))}
          </ol>
          <p className="caption mt-lg">
            세부 절차와 제출서류는 공고와 접수 방식에 따라 달라질 수 있습니다. 최신 기준은 공식
            신청처에서 확인해 주세요.
          </p>
        </div>
      </section>

      <CtaBand
        title={['지원 대상인지 확인하고,', '철거 견적도 함께 받아보세요.']}
        quoteLabel="지원금·철거 함께 상담하기"
        inquiryType="support"
      />
    </>
  );
}
