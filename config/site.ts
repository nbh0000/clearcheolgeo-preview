/**
 * 사이트 공통 설정 (단일 관리 지점)
 * ------------------------------------------------------------
 * 상호 / 전화번호 / 지원금 문구 / 사업자 정보 / 기능 on-off 는
 * 모두 이 파일 한 곳에서만 수정한다. 페이지·컴포넌트는 이 값을 참조한다.
 */

/** 대표 상담전화 — 표기용 / 링크용 값을 한 번만 정의한다. */
const PHONE_DISPLAY = '010-5892-2234';
const PHONE_HREF = 'tel:01058922234';

/** 아직 확인되지 않은 운영정보는 null 로 둔다. null 이면 화면에 렌더링하지 않는다. */
export type MaybeText = string | null;

export const siteConfig = {
  /** 브랜드명(사이트 표기). 사업자등록상 상호와는 구분해서 관리한다. */
  brandName: '클리어철거',
  tagline: '철거부터 폐기물 정리까지, 한 번에 클리어.',
  description:
    '상가·인테리어철거, 원상복구, 폐기물처리 상담. 현장 상황에 맞는 작업 범위와 견적을 안내합니다.',

  phone: {
    display: PHONE_DISPLAY,
    href: PHONE_HREF,
    /** 국제 표기 (구조화 데이터용) */
    intl: '+82-10-5892-2234',
    /** 운영시간은 확인되지 않았으므로 null. 값이 들어오면 헤더/푸터에 자동 노출된다. */
    hours: null as MaybeText,
  },

  /**
   * 최종 도메인이 확정되지 않았다.
   * 배포 시 NEXT_PUBLIC_SITE_URL 을 실제 도메인으로 설정하면
   * canonical / sitemap / OG 메타에 반영된다. 미설정 시 상대경로만 사용한다.
   */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,

  /**
   * 사업자등록 정보 — 운영자가 제공한 값만 넣는다. (2026-09-14 확인)
   * null 인 항목은 푸터에 표시되지 않는다. 임의의 값을 넣지 말 것.
   */
  business: {
    legalName: '티에스 컴퍼니' as MaybeText, // 사업자등록상 상호
    legalNameEn: 'TS COMPANY', // 저작권 표기용 영문 상호
    ceoName: '조호식' as MaybeText, // 대표자명
    address: '경기도 시흥시 대야동 비둘기공원3길 10, 1층' as MaybeText, // 사업장 주소
    registrationNumber: '761-74-00595' as MaybeText, // 사업자등록번호
    licenses: [] as string[], // 확인된 허가·신고 정보 (미제공)
    serviceAreas: [] as string[], // 확정된 영업지역 (미제공)
    businessHours: null as MaybeText, // 운영시간 (미제공)
    /** 푸터 저작권 문구 — 연도는 고정 표기(운영자 지정) */
    copyright: 'COPYRIGHT © 2026 TS COMPANY (클리어철거) ALL RIGHTS RESERVED.',
  },

  /**
   * 실적·수상 강조 문구 — 운영자가 근거를 확인한 항목만 enabled: true 로 켠다.
   * (근거 없이 켜지 말 것. 확인 전에는 대체 문구(fallback)가 표시된다.)
   */
  achievements: {
    /** 누적 시공 실적 */
    projects: {
      /** 운영자 확인 후 true */
      enabled: false,
      value: '10,000건+',
      label: '누적 시공 실적',
      /** 집계 기준·기간 등 보조 설명 (확인되면 입력, 없으면 null) */
      note: null as MaybeText,
    },
    /** 고객만족도 수상 */
    award: {
      /** 운영자 확인 후 true */
      enabled: false,
      value: '5년 연속',
      label: '고객만족도 1위 수상',
      /** 주관기관 · 수상 부문 · 기간 (확인되면 입력, 없으면 null) */
      note: null as MaybeText,
    },
    /** 두 항목 모두 확인 전일 때 실적 영역에 대신 표시하는 문구 */
    fallback: ['철거부터 폐기물 정리까지', '현장에 맞춘 작업, 깔끔한 마무리'],
  },

  /** 철거지원금 안내 — 팝업과 /support 페이지가 이 값을 공유한다. */
  support: {
    /** false 로 두면 팝업·배너·메뉴가 모두 숨겨진다. */
    enabled: true,
    programName: '희망리턴패키지 원스톱폐업지원 – 점포철거비 지원',
    /** 콘텐츠가 근거로 삼은 사업연도. */
    referenceYear: 2026,
    amountText: '최대 600만원',
    amountConditionText: '지원요건 충족 시',
    officialUrl: 'https://www.sbiz24.kr/',
    officialUrlLabel: '소상공인 원스톱 지원플랫폼 (sbiz24.kr)',
    /** 금액 표기가 나오는 모든 화면에 함께 노출되는 주의사항. */
    disclaimer: [
      '최대 600만원은 지원요건을 충족하는 경우의 한도입니다.',
      '실제 지원 여부와 금액은 신청 당시 공고, 심사 결과와 예산 등에 따라 달라집니다.',
      '클리어철거는 정부기관이 아니며, 지원금 지급을 보장하지 않습니다.',
    ],
    /**
     * 지원 대상 자가진단 항목 — 공식 공고에서 확인한 "지원 제외" 조건을 넣는다.
     * 비어 있으면 안내 페이지에서 자가진단 카드 대신 공식 공고 확인 안내만 표시된다.
     * 예) { title: '자가 건물 및 무상 임차', lines: ['임대차 계약이 아닌, 자가 소유 건물에서 사업장을 운영하는 경우'] }
     */
    eligibility: [] as { title: string; lines: string[] }[],
    /** 콘텐츠 기준 시점 안내 (배포 전 최신 공고 재확인 필요). */
    sourceNote:
      '본 안내는 2026년 사업 안내를 바탕으로 작성한 참고 자료입니다. 접수 여부·예산·세부 요건은 신청 시점의 공식 공고를 확인해 주세요.',
    popup: {
      enabled: true,
      /** 메인 진입 후 팝업 노출까지의 지연(ms). */
      delayMs: 1500,
      eyebrow: '폐업·폐업예정 소상공인 안내',
      title: ['점포철거비 지원,', '요건 충족 시 최대 600만원'],
      body: '폐업 예정 점포라면 철거비 지원제도 대상일 수 있습니다. 클리어철거에서 철거 견적과 함께 지원 대상 확인 방법, 신청 절차와 준비서류를 안내합니다.',
      primaryLabel: '지원금·철거 함께 상담하기',
    },
  },

  /** 견적문의 접수 기능 */
  quote: {
    /**
     * 저장소가 준비되지 않았거나 개인정보 운영정보 확인 전이라면 false 로 둔다.
     * false 이면 폼 대신 전화상담 안내가 표시되고, 서버 API 도 접수를 거부한다.
     */
    enabled: true,
    maxFiles: 5,
    maxFileSizeMb: 10,
    acceptedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
    acceptedImageLabel: 'JPG · PNG · WEBP',
  },

  /** 개인정보 수집·이용 동의 (운영자 확인 필요 값) */
  privacy: {
    /** 동의문 버전 — 문구를 고치면 반드시 올린다. 접수 기록에 함께 저장된다. */
    consentVersion: '2026-09-01.v1',
    /** 보유·이용기간. 운영자 확인 후 조정 가능한 설정값. */
    retentionPeriod: '상담 종료 후 1년 (동의 철회 또는 목적 달성 시 지체 없이 파기)',
    /** 처리주체 표기 (사업자등록상 상호 + 서비스명) */
    controllerName: '티에스 컴퍼니 (클리어철거)',
    contactPhone: PHONE_DISPLAY,
    requiredItems: '이름/담당자명, 연락처, 현장 주소, 문의사항',
    optionalItems:
      '상호명, 상세주소·층수·호실, 현장 업종/용도, 면적, 희망 작업일, 엘리베이터·차량 접근 여부, 현장 사진',
  },

  /** 시공사례 — 관리자 페이지(/admin/projects)에서 등록한 사례를 /projects 에 표시한다. */
  projects: {
    /** false 로 두면 메뉴·푸터에서 시공사례 링크를 숨긴다. (페이지 자체는 남는다) */
    enabled: true,
    /** 목록 페이지에서 한 번에 보여줄 개수 */
    pageSize: 10,
  },
} as const;

export type SiteConfig = typeof siteConfig;
