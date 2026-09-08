/**
 * 견적문의 접수 API 통합 테스트
 * ------------------------------------------------------------
 * 실행 방법:
 *   1) 서버 실행    : npm run build && npm run start   (또는 npm run dev)
 *   2) 테스트 실행  : npm test
 *
 * 환경변수
 *   BASE_URL       테스트 대상 주소 (기본 http://localhost:3000)
 *   ADMIN_USER / ADMIN_PASSWORD  관리자 인증 테스트용 (서버와 같은 값)
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

/** 최소 작성 시간(3초) 제한을 통과하도록 과거 시각을 넣는다. */
const oldEnough = () => String(Date.now() - 10_000);

function baseForm(overrides = {}) {
  const fd = new FormData();
  const values = {
    type: 'demolition',
    name: '테스트담당자',
    company: '테스트상호',
    phone: '010-0000-0000',
    address: '서울특별시 어딘가 123',
    addressDetail: '2층',
    message: '테스트 문의입니다. 내부철거 범위를 확인하고 싶습니다.',
    usage: '',
    area: '',
    areaUnit: '평',
    preferredDate: '',
    floor: '',
    elevator: '',
    vehicleAccess: '',
    consent: 'true',
    website: '',
    formLoadedAt: oldEnough(),
    ...overrides,
  };
  for (const [k, v] of Object.entries(values)) fd.append(k, v);
  return fd;
}

/**
 * 각 테스트가 서로의 요청 빈도 제한에 영향을 주지 않도록
 * 테스트마다 다른 클라이언트 IP(x-forwarded-for)를 사용한다.
 */
const post = (fd, ip = `203.0.113.${Math.floor(Math.random() * 250) + 1}`) =>
  fetch(`${BASE}/api/quote`, { method: 'POST', body: fd, headers: { 'x-forwarded-for': ip } });

test('필수 항목 누락 시 400 과 항목별 오류를 반환한다', async () => {
  const res = await post(baseForm({ name: '', phone: '', address: '', message: '' }));
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.ok(body.fieldErrors.name);
  assert.ok(body.fieldErrors.phone);
  assert.ok(body.fieldErrors.address);
  assert.ok(body.fieldErrors.message);
});

test('개인정보 동의가 없으면 서버에서 접수를 차단한다', async () => {
  const res = await post(baseForm({ consent: 'false' }));
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.ok(body.fieldErrors.consent, '동의 항목 오류가 있어야 한다');
});

test('잘못된 연락처 형식을 거부한다', async () => {
  const res = await post(baseForm({ phone: '전화번호없음' }));
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.ok(body.fieldErrors.phone);
});

test('허용되지 않은 문의 유형을 거부한다', async () => {
  const res = await post(baseForm({ type: '<script>' }));
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.ok(body.fieldErrors.type);
});

test('숨김 필드(허니팟)가 채워지면 거부한다', async () => {
  const res = await post(baseForm({ website: 'http://spam.example' }));
  assert.equal(res.status, 400);
});

test('이미지가 아닌 파일 첨부를 거부한다', async () => {
  const fd = baseForm();
  fd.append(
    'attachments',
    new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], 'fake.jpg', { type: 'image/jpeg' }),
    'fake.jpg',
  );
  const res = await post(fd);
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.message, /이미지/);
});

test('정상 입력은 접수번호와 함께 201 로 저장된다', async () => {
  const res = await post(baseForm({ message: '정상 접수 테스트입니다. 상가 내부철거 문의.' }));
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.match(body.quoteId, /^Q\d{8}-[A-Z0-9]{6}$/);
});

test('정상 이미지 첨부는 함께 접수된다', async () => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
  const fd = baseForm({ message: '사진 첨부 접수 테스트입니다.' });
  fd.append('attachments', new File([png], 'site.png', { type: 'image/png' }), 'site.png');
  const res = await post(fd);
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.ok, true);
});

test('접수 내용은 공개 API 로 조회할 수 없다', async () => {
  const res = await fetch(`${BASE}/api/quote`);
  assert.equal(res.status, 404);
});

test('관리자 화면은 인증 없이 접근할 수 없다', async () => {
  const res = await fetch(`${BASE}/admin`, { redirect: 'manual' });
  assert.ok(
    res.status === 401 || res.status === 503,
    `관리자 화면은 401(인증 요구) 또는 503(계정 미설정)이어야 한다 (실제: ${res.status})`,
  );
});

test('첨부파일 경로도 인증 없이 접근할 수 없다', async () => {
  const res = await fetch(`${BASE}/api/admin/attachment/Q20260101-ABCDEF/01-deadbeef`);
  assert.ok(res.status === 401 || res.status === 503, `실제: ${res.status}`);
});

test('반복 접수는 요청 빈도 제한으로 차단된다', async () => {
  let limited = false;
  for (let i = 0; i < 8; i += 1) {
    const res = await post(baseForm({ message: `연속 접수 테스트 ${i} 입니다.` }), '198.51.100.7');
    if (res.status === 429) {
      limited = true;
      break;
    }
  }
  assert.ok(limited, '연속 요청 시 429 가 반환되어야 한다');
});
