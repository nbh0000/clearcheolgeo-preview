/**
 * 견적문의 입력 검증 — 클라이언트와 서버가 같은 규칙을 사용한다.
 * (클라이언트 검증은 편의 기능일 뿐이며, 실제 차단은 서버에서 다시 수행한다.)
 */
import { isInquiryType } from '@/content/inquiry';

export type QuoteInput = {
  type: string;
  name: string;
  company: string;
  phone: string;
  address: string;
  addressDetail: string;
  message: string;
  // 추가 정보 (선택)
  usage: string;
  area: string;
  areaUnit: string;
  preferredDate: string;
  floor: string;
  elevator: string;
  vehicleAccess: string;
  consent: boolean;
};

export type FieldErrors = Partial<Record<keyof QuoteInput, string>>;

export const AREA_UNITS = ['평', '㎡'] as const;
export const ELEVATOR_OPTIONS = ['', '있음', '없음', '확인 필요'] as const;
export const VEHICLE_OPTIONS = ['', '가능', '제한적', '불가', '확인 필요'] as const;

export const LIMITS = {
  name: 40,
  company: 60,
  phone: 20,
  address: 200,
  addressDetail: 100,
  message: 3000,
  usage: 60,
  area: 20,
  floor: 40,
} as const;

/** 휴대전화와 일반 전화번호를 모두 허용한다. (숫자 9~11자리, 하이픈/공백 허용) */
export function normalizePhone(raw: string): string {
  return raw.replace(/[^0-9+]/g, '');
}

export function isValidPhone(raw: string): boolean {
  const digits = raw.replace(/[^0-9]/g, '');
  if (raw.replace(/[\s()+.-]/g, '') !== digits) return false; // 허용 문자 외 포함
  return digits.length >= 9 && digits.length <= 11;
}

const isBlank = (v: string) => v.trim().length === 0;

export function validateQuote(input: QuoteInput): FieldErrors {
  const errors: FieldErrors = {};

  if (!isInquiryType(input.type)) {
    errors.type = '문의 유형을 선택해 주세요.';
  }

  if (isBlank(input.name)) {
    errors.name = '이름 또는 담당자명을 입력해 주세요.';
  } else if (input.name.trim().length > LIMITS.name) {
    errors.name = `이름은 ${LIMITS.name}자 이내로 입력해 주세요.`;
  }

  if (input.company.trim().length > LIMITS.company) {
    errors.company = `상호명은 ${LIMITS.company}자 이내로 입력해 주세요.`;
  }

  if (isBlank(input.phone)) {
    errors.phone = '연락처를 입력해 주세요.';
  } else if (!isValidPhone(input.phone)) {
    errors.phone = '연락처를 다시 확인해 주세요. (예: 010-1234-5678 또는 02-123-4567)';
  }

  if (isBlank(input.address)) {
    errors.address = '현장 주소를 입력해 주세요.';
  } else if (input.address.trim().length < 5) {
    errors.address = '현장 주소를 조금 더 자세히 입력해 주세요.';
  } else if (input.address.trim().length > LIMITS.address) {
    errors.address = `현장 주소는 ${LIMITS.address}자 이내로 입력해 주세요.`;
  }

  if (input.addressDetail.trim().length > LIMITS.addressDetail) {
    errors.addressDetail = `상세 주소는 ${LIMITS.addressDetail}자 이내로 입력해 주세요.`;
  }

  if (isBlank(input.message)) {
    errors.message = '문의사항을 입력해 주세요.';
  } else if (input.message.trim().length < 5) {
    errors.message = '문의 내용을 조금만 더 적어 주세요.';
  } else if (input.message.length > LIMITS.message) {
    errors.message = `문의사항은 ${LIMITS.message}자 이내로 입력해 주세요.`;
  }

  if (input.usage.trim().length > LIMITS.usage) {
    errors.usage = `업종/용도는 ${LIMITS.usage}자 이내로 입력해 주세요.`;
  }
  if (input.area.trim().length > LIMITS.area) {
    errors.area = '면적을 다시 확인해 주세요.';
  }
  if (input.area.trim() && !/^[0-9]{1,6}(\.[0-9]{1,2})?$/.test(input.area.trim())) {
    errors.area = '면적은 숫자로 입력해 주세요.';
  }
  if (input.areaUnit && !AREA_UNITS.includes(input.areaUnit as (typeof AREA_UNITS)[number])) {
    errors.areaUnit = '면적 단위를 확인해 주세요.';
  }
  if (input.preferredDate && !/^\d{4}-\d{2}-\d{2}$/.test(input.preferredDate)) {
    errors.preferredDate = '희망 작업일 형식을 확인해 주세요.';
  }
  if (input.floor.trim().length > LIMITS.floor) {
    errors.floor = `층수 정보는 ${LIMITS.floor}자 이내로 입력해 주세요.`;
  }
  if (
    input.elevator &&
    !ELEVATOR_OPTIONS.includes(input.elevator as (typeof ELEVATOR_OPTIONS)[number])
  ) {
    errors.elevator = '엘리베이터 항목을 확인해 주세요.';
  }
  if (
    input.vehicleAccess &&
    !VEHICLE_OPTIONS.includes(input.vehicleAccess as (typeof VEHICLE_OPTIONS)[number])
  ) {
    errors.vehicleAccess = '차량 접근 항목을 확인해 주세요.';
  }

  if (input.consent !== true) {
    errors.consent = '개인정보 수집·이용에 동의하셔야 온라인 접수가 가능합니다.';
  }

  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}

export const emptyQuoteInput: QuoteInput = {
  type: '',
  name: '',
  company: '',
  phone: '',
  address: '',
  addressDetail: '',
  message: '',
  usage: '',
  area: '',
  areaUnit: '평',
  preferredDate: '',
  floor: '',
  elevator: '',
  vehicleAccess: '',
  consent: false,
};
