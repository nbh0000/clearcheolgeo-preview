/**
 * 시공사례 데이터
 * ------------------------------------------------------------
 * 실제 사진과 공개 동의가 확보된 사례만 이 배열에 추가한다.
 * 배열이 비어 있거나 siteConfig.projects.enabled 가 false 이면
 * 메뉴와 메인 미리보기에서 시공사례 영역이 숨겨진다.
 *
 * isSample: true 인 항목은 개발용 테스트 데이터이며,
 * NEXT_PUBLIC_SHOW_SAMPLE_PROJECTS=1 인 개발 환경에서만 노출된다.
 */
import { siteConfig } from '@/config/site';

export type ProjectCategory = 'demolition' | 'waste' | 'both';

export const PROJECT_CATEGORIES: { value: ProjectCategory | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'demolition', label: '철거' },
  { value: 'waste', label: '폐기물처리' },
  { value: 'both', label: '철거 + 폐기물처리' },
];

export type ProjectPhoto = {
  /** /public 하위 경로 또는 외부 URL */
  src: string;
  alt: string;
};

export type Project = {
  slug: string;
  title: string;
  category: ProjectCategory;
  /** 공개 가능한 범위의 지역 표기 (상세 주소 금지) */
  region: string;
  /** 업종 또는 현장 용도 */
  usage: string;
  /** 작업 범위 */
  scope: string[];
  /** 제공된 경우에만 표기 */
  areaText?: string;
  durationText?: string;
  beforePhotos: ProjectPhoto[];
  afterPhotos: ProjectPhoto[];
  description: string;
  isSample?: boolean;
};

/** 실제 사례가 확보되면 이 배열에 추가한다. */
export const projects: Project[] = [];

const showSamples = process.env.NEXT_PUBLIC_SHOW_SAMPLE_PROJECTS === '1';

/** 공개 환경에 노출할 사례 목록. */
export function getPublishedProjects(): Project[] {
  if (!siteConfig.projects.enabled) return [];
  return projects.filter((p) => (p.isSample ? showSamples : true));
}

export function getProjectBySlug(slug: string): Project | undefined {
  return getPublishedProjects().find((p) => p.slug === slug);
}

/** 시공사례 메뉴/미리보기 노출 여부 */
export function hasPublishedProjects(): boolean {
  return getPublishedProjects().length > 0;
}
