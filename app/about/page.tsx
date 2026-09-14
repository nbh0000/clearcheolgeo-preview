import Link from 'next/link';
import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { pageMetadata } from '@/lib/seo';
import Achievements from '@/components/Achievements';
import CtaBand from '@/components/CtaBand';

export const metadata: Metadata = pageMetadata({
  title: '회사소개',
  description:
    '클리어철거는 상가·인테리어 철거와 원상복구, 폐기물 정리를 함께 상담하고 진행하는 현장 중심의 전문 브랜드입니다. 명확한 견적, 체계적인 작업, 깔끔한 마무리를 기준으로 합니다.',
  path: '/about',
});

/** 본문 문단 (운영자 제공 원문) */
const paragraphs = [
  '철거는 단순히 부수는 일이 아닙니다. 현장의 구조와 작업 범위를 파악하고, 반출 동선과 일정까지 고려해 공간을 다음 단계로 준비하는 일입니다.',
  '클리어철거는 상가·인테리어 철거와 원상복구, 폐기물 정리를 함께 상담하고 진행하는 현장 중심의 전문 브랜드입니다. 필요한 작업은 무엇인지, 어디까지 진행해야 하는지, 견적은 어떤 기준으로 정해지는지 고객이 이해할 수 있도록 설명하는 것부터 시작합니다.',
  '현장마다 다른 조건에는 그에 맞는 작업이 필요합니다. 클리어철거는 철거 범위와 주변 환경, 반출 여건을 살피고 작업의 시작부터 마무리까지 이어지는 과정을 꼼꼼하게 준비합니다. 철거가 끝난 뒤 남는 정리의 부담까지 줄이는 것, 그것이 클리어철거가 생각하는 작업의 완성입니다.',
  '좋은 철거의 기준은 작업이 끝난 뒤 더 분명해집니다. 정리된 현장, 이해하기 쉬운 견적, 다시 맡길 수 있는 신뢰. 클리어철거는 이 세 가지를 기준으로 고객의 다음 시작을 함께 준비합니다.',
];

/** 강점 소개 (운영자 제공 원문) */
const strengths = [
  {
    title: '견적은 명확하게',
    body: '작업 범위와 현장 조건을 확인하고, 필요한 공정과 견적의 기준을 이해하기 쉽게 안내합니다.',
  },
  {
    title: '작업은 체계적으로',
    body: '철거 범위부터 반출 동선까지 현장 여건을 고려해 작업을 준비합니다.',
  },
  {
    title: '마무리는 깔끔하게',
    body: '철거와 폐기물 정리를 함께 상담해 고객이 여러 과정을 따로 챙겨야 하는 부담을 줄입니다.',
  },
];

/**
 * 실적·수상 강조 문단 — 운영자가 확인해 켠 항목만으로 문장을 만든다.
 * 둘 다 확인 전이면 문단 자체를 표시하지 않는다.
 */
function highlightParagraph(): string | null {
  const { projects, award } = siteConfig.achievements;
  const parts: string[] = [];
  if (projects.enabled) parts.push('10,000건 이상의 시공 경험');
  if (award.enabled) parts.push('5년 연속 고객만족도 1위 수상');
  if (parts.length === 0) return null;
  return `${parts.join('과 ')}. 클리어철거는 현장에서 축적한 노하우를 바탕으로 철거부터 폐기물 정리까지 완성도 높은 서비스를 제공합니다.`;
}

export default function AboutPage() {
  const highlight = highlightParagraph();

  return (
    <>
      {/* 제목 · 도입 */}
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">회사소개</p>
          <h1 className="display-lg mt-sm">
            <span className="line">철거는 정교하게.</span>
            <span className="line">마무리는 빈틈없이.</span>
          </h1>
          <p className="lead mt-md" style={{ maxWidth: '40ch' }}>
            <span className="line">잘 비워야, 다음이 제대로 시작됩니다.</span>
            <span className="line">클리어철거는 철거부터 폐기물 정리까지,</span>
            <span className="line">공간의 새로운 시작을 준비합니다.</span>
          </p>
        </div>
      </section>

      {/* 실적·수상 (확인된 항목만, 미확인 시 대체 문구) */}
      <Achievements tone="soft" />

      {/* 본문 */}
      <section className="section" aria-labelledby="about-body">
        <div className="container">
          <div className="grid grid-2" style={{ alignItems: 'start' }}>
            <div>
              <p className="eyebrow">클리어철거는</p>
              <h2 className="display-sm mt-sm" id="about-body">
                현장을 이해하고,
                <br />
                다음 단계를 준비합니다.
              </h2>
            </div>
            <div className="stack-lg">
              {paragraphs.map((p) => (
                <p className="body-md" key={p.slice(0, 20)}>
                  {p}
                </p>
              ))}
              {highlight && <p className="body-strong">{highlight}</p>}
            </div>
          </div>
        </div>
      </section>

      {/* 강점 소개 */}
      <section className="section band-soft" aria-labelledby="about-strengths">
        <div className="container">
          <p className="eyebrow">클리어철거의 기준</p>
          <h2 className="display-sm mt-sm" id="about-strengths">
            견적부터 마무리까지, 세 가지 기준
          </h2>
          <div className="grid grid-3 mt-xl">
            {strengths.map((item, i) => (
              <div className="card" key={item.title}>
                <span className="icon-plate num">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="title-lg mt-base">{item.title}</h3>
                <p className="body-md mt-sm">{item.body}</p>
              </div>
            ))}
          </div>
          <div className="btn-row mt-xl">
            <Link className="btn btn-secondary" href="/services/demolition">
              철거 서비스 보기
            </Link>
            <Link className="btn btn-secondary" href="/services/waste">
              폐기물처리 서비스 보기
            </Link>
          </div>
        </div>
      </section>

      {/* 마지막 강조 · 상담 */}
      <CtaBand
        title={['비워야 할 공간은 깔끔하게.', '새롭게 시작할 준비는 든든하게.', '클리어철거.']}
        body={`현장 상황을 알려주시면 확인이 필요한 항목부터 함께 정리해 드립니다. 대표 상담전화 ${siteConfig.phone.display}`}
      />
    </>
  );
}
