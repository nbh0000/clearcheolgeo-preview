/** 견적문의 유형 — 폼 / 링크 / 서버 검증이 모두 이 목록을 공유한다. */
export const INQUIRY_TYPES = [
  { value: 'demolition', label: '철거' },
  { value: 'waste', label: '폐기물처리' },
  { value: 'both', label: '철거 + 폐기물처리' },
  { value: 'support', label: '철거지원금 상담' },
  { value: 'etc', label: '기타 문의' },
] as const;

export type InquiryTypeValue = (typeof INQUIRY_TYPES)[number]['value'];

export const INQUIRY_TYPE_VALUES = INQUIRY_TYPES.map((t) => t.value) as readonly string[];

export function inquiryTypeLabel(value: string): string {
  return INQUIRY_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function isInquiryType(value: unknown): value is InquiryTypeValue {
  return typeof value === 'string' && INQUIRY_TYPE_VALUES.includes(value);
}

/** 서비스 페이지 → 견적문의 이동 링크 (문의 유형 미리 선택) */
export function quoteHref(type?: InquiryTypeValue): string {
  return type ? `/quote?type=${type}` : '/quote';
}
