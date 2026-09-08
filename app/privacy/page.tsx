import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: '개인정보처리방침',
  description:
    '클리어철거 견적문의 접수 시 수집하는 개인정보의 항목, 이용 목적, 보유 기간과 정보주체의 권리를 안내합니다.',
  path: '/privacy',
});

const { privacy, phone, brandName } = siteConfig;

/** 실제 수집 항목(견적문의 폼 및 서버 저장 내용)과 일치하도록 작성한다. */
const sections: { title: string; body: React.ReactNode }[] = [
  {
    title: '1. 수집하는 개인정보 항목',
    body: (
      <>
        <p>
          <strong>필수 항목</strong> · {privacy.requiredItems}
        </p>
        <p className="mt-xs">
          <strong>선택 항목</strong> · {privacy.optionalItems}
        </p>
        <p className="mt-xs">
          <strong>접수 과정에서 자동으로 생성·기록되는 정보</strong> · 접수 일시, 접수번호, 동의
          기록(동의문 버전), 스팸 방지를 위한 접속 IP의 일방향 해시값과 브라우저 정보(User-Agent).
          접속 IP 원본은 저장하지 않습니다.
        </p>
      </>
    ),
  },
  {
    title: '2. 개인정보의 수집·이용 목적',
    body: (
      <p>
        철거 및 폐기물처리 견적 상담, 문의 내용 확인과 답변, 상담 이력 관리, 반복·자동 접수 등
        부정이용 방지를 위해 이용합니다. 마케팅·광고 목적으로는 이용하지 않습니다.
      </p>
    ),
  },
  {
    title: '3. 보유 및 이용 기간',
    body: (
      <>
        <p>{privacy.retentionPeriod}</p>
        <p className="mt-xs">
          동의를 철회하시거나 파기를 요청하시면 관계 법령에 따라 보존할 필요가 있는 경우를 제외하고
          지체 없이 파기합니다.
        </p>
      </>
    ),
  },
  {
    title: '4. 동의를 거부할 권리와 그에 따른 제한',
    body: (
      <p>
        개인정보 수집·이용 동의를 거부하실 수 있습니다. 다만 동의하지 않으시면 온라인 견적문의 접수가
        제한됩니다. 이 경우에도 대표 상담전화{' '}
        <a className="num link-inline" href={phone.href}>
          {phone.display}
        </a>
        로 상담하실 수 있습니다.
      </p>
    ),
  },
  {
    title: '5. 제3자 제공 및 처리위탁',
    body: (
      <p>
        수집한 개인정보를 제3자에게 제공하지 않습니다. 서비스 운영을 위해 처리위탁이 발생하는 경우
        위탁받는 자와 업무 내용을 본 방침에 공개하고 사전에 안내합니다.
      </p>
    ),
  },
  {
    title: '6. 정보주체의 권리와 행사 방법',
    body: (
      <p>
        정보주체는 언제든지 본인의 개인정보에 대한 열람, 정정, 삭제, 처리정지 및 동의 철회를 요청할
        수 있습니다. 요청은 대표 상담전화{' '}
        <a className="num link-inline" href={phone.href}>
          {phone.display}
        </a>
        로 접수해 주시면 지체 없이 처리합니다.
      </p>
    ),
  },
  {
    title: '7. 개인정보의 파기 절차 및 방법',
    body: (
      <p>
        보유 기간이 지나거나 처리 목적이 달성된 개인정보는 지체 없이 파기합니다. 전자적 파일 형태의
        정보는 복구할 수 없는 방법으로 삭제하고, 출력물이 있는 경우 분쇄 또는 소각합니다.
      </p>
    ),
  },
  {
    title: '8. 개인정보의 안전성 확보 조치',
    body: (
      <p>
        접수된 문의 내용은 공개 게시판이나 공개 API 로 노출되지 않으며, 관리자 인증을 거친 담당자만
        열람할 수 있습니다. 첨부하신 사진은 공개 주소로 제공되지 않고 관리자 인증 이후에만 조회할 수
        있도록 저장합니다. 접근 권한은 업무상 필요한 최소 인원으로 제한합니다.
      </p>
    ),
  },
  {
    title: '9. 개인정보 보호 문의',
    body: (
      <p>
        개인정보 처리에 관한 문의·불만·피해 구제는 아래로 연락해 주세요.
        <br />
        {privacy.controllerName} · 대표 상담전화{' '}
        <a className="num link-inline" href={phone.href}>
          {privacy.contactPhone}
        </a>
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">개인정보처리방침</p>
          <h1 className="display-md mt-sm">개인정보처리방침</h1>
          <p className="body-md mt-md measure">
            {brandName}는 견적문의 접수를 위해 아래와 같이 개인정보를 수집·이용합니다.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="measure">
            {sections.map((section) => (
              <div className="mt-xl" key={section.title}>
                <h2 className="title-lg">{section.title}</h2>
                <div className="body-md mt-sm">{section.body}</div>
              </div>
            ))}

            <div className="notice mt-xxl">
              <p>동의문 버전 · {privacy.consentVersion}</p>
              <p className="mt-xs">
                본 방침의 내용이 변경되는 경우 변경 사항을 본 페이지에 공지합니다.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
