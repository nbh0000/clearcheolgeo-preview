/**
 * 시공사례 예시 데이터 (화면 확인용)
 * ------------------------------------------------------------
 * 실제 현장이 아닌 예시다. NEXT_PUBLIC_SHOW_SAMPLE_PROJECTS=1 일 때,
 * DB 에 등록된 사례가 하나도 없는 경우에만 "예시" 표시와 함께 보여준다.
 * 운영 환경에서는 이 변수를 설정하지 않는다.
 */
import type { ProjectRecord } from '@/lib/projects';

const photo = (id: string, file: string): ProjectRecord['photos'][number] => ({
  id,
  url: `/images/samples/${file}`,
  mimeType: 'image/jpeg',
  size: 0,
  width: 1200,
  height: 900,
});

const base = {
  createdAt: '2026-08-01T00:00:00.000Z',
  updatedAt: '2026-08-01T00:00:00.000Z',
  published: true,
  sortOrder: 0,
  isSample: true as const,
};

export const sampleProjects: ProjectRecord[] = [
  {
    ...base,
    id: 'P20260801-SAMPL1',
    title: '',
    usage: '카페',
    region: '시흥시 정왕동',
    scope: '내부 인테리어 철거, 원상복구',
    areaText: '25평',
    durationText: '2일',
    amountText: '380만원',
    description:
      '폐업 예정 카페의 카운터·천장 마감·벽 타일을 철거하고 원상복구 조건에 맞춰 정리한 현장입니다. 건물 이용 시간 제한이 있어 오전에 반출을 마치도록 일정을 조정했습니다.',
    photos: [photo('s1-1', 'cafe-1.jpg'), photo('s1-2', 'cafe-2.jpg'), photo('s1-3', 'cafe-3.jpg')],
  },
  {
    ...base,
    id: 'P20260801-SAMPL2',
    title: '',
    usage: '사무실',
    region: '안산시 단원구',
    scope: '칸막이·천장·바닥 철거',
    areaText: '60평',
    durationText: '3일',
    amountText: '920만원',
    description:
      '사무실 이전에 따른 내부 철거입니다. 유리 칸막이와 경량 천장, 카펫 타일을 걷어내고 바닥까지 정리했습니다. 엘리베이터 사용 시간에 맞춰 반출 동선을 미리 협의했습니다.',
    photos: [photo('s2-1', 'office-1.jpg'), photo('s2-2', 'office-2.jpg'), photo('s2-3', 'office-3.jpg')],
  },
  {
    ...base,
    id: 'P20260801-SAMPL3',
    title: '',
    usage: '음식점',
    region: '부천시 원미구',
    scope: '주방 설비 철거, 폐기물 반출',
    areaText: '35평',
    durationText: '2일',
    amountText: '560만원',
    description:
      '폐업 음식점의 주방 후드·조리대·타일을 철거하고 발생한 폐기물을 함께 반출한 현장입니다. 철거와 폐기물처리를 한 번에 상담해 별도 업체를 부르는 번거로움을 줄였습니다.',
    photos: [
      photo('s3-1', 'restaurant-1.jpg'),
      photo('s3-2', 'restaurant-2.jpg'),
      photo('s3-3', 'restaurant-3.jpg'),
    ],
  },
];
