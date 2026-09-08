/**
 * 저장 스키마·쿼리 검증
 * ------------------------------------------------------------
 * 실제 PostgreSQL 엔진(PGlite: PostgreSQL 을 WASM 으로 빌드한 것)에 대해
 * lib/schema.ts 의 SQL 을 그대로 실행하여 검증한다.
 *
 * 확인 항목
 *  - 스키마가 생성되고, 두 번 실행해도 안전한지
 *  - 접수 + 첨부가 한 트랜잭션으로 저장되는지
 *  - 실패 시 롤백되어 "반쯤 저장된" 기록이 남지 않는지
 *  - 첨부 이미지 바이트가 손상 없이 저장/조회되는지
 *  - 목록 조회가 최신순으로 첨부 메타데이터와 함께 나오는지
 *
 * 실행: npm run test:db
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

/** lib/schema.ts 는 TypeScript 파일이므로 SQL 문자열만 추출해 사용한다. */
function loadSql(name) {
  const src = readFileSync(new URL('../lib/schema.ts', import.meta.url), 'utf8');
  const match = src.match(new RegExp(`export const ${name} = \`([\\s\\S]*?)\``));
  if (!match) throw new Error(`${name} 을(를) lib/schema.ts 에서 찾지 못했습니다.`);
  return match[1];
}

const SCHEMA_SQL = loadSql('SCHEMA_SQL');
const INSERT_QUOTE_SQL = loadSql('INSERT_QUOTE_SQL');
const INSERT_ATTACHMENT_SQL = loadSql('INSERT_ATTACHMENT_SQL');
const SELECT_QUOTES_SQL = loadSql('SELECT_QUOTES_SQL');
const SELECT_ATTACHMENT_SQL = loadSql('SELECT_ATTACHMENT_SQL');
const UPDATE_NOTIFICATION_SQL = loadSql('UPDATE_NOTIFICATION_SQL');

const quoteParams = (id, receivedAt, overrides = {}) => {
  const v = {
    type: 'demolition',
    typeLabel: '철거',
    name: '홍길동',
    company: '',
    phone: '010-0000-0000',
    address: '서울특별시 테스트구 1',
    addressDetail: '2층',
    message: '내부철거 문의드립니다.',
    optional: { usage: '카페', area: '30', areaUnit: '평' },
    ...overrides,
  };
  return [
    id,
    receivedAt,
    v.type,
    v.typeLabel,
    v.name,
    v.company,
    v.phone,
    v.address,
    v.addressDetail,
    v.message,
    JSON.stringify(v.optional),
    true,
    '2026-09-01.v1',
    receivedAt,
    'iphash',
    'test-agent',
    'none',
    'not_configured',
  ];
};

async function freshDb() {
  const db = await PGlite.create();
  await db.exec(SCHEMA_SQL);
  return db;
}

test('스키마를 두 번 실행해도 오류가 없다 (IF NOT EXISTS)', async () => {
  const db = await freshDb();
  await db.exec(SCHEMA_SQL); // 재실행
  const res = await db.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name",
  );
  assert.deepEqual(
    res.rows.map((r) => r.table_name),
    ['quote_attachments', 'quotes'],
  );
});

test('접수와 첨부가 한 트랜잭션으로 저장된다', async () => {
  const db = await freshDb();
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );

  await db.exec('BEGIN');
  await db.query(INSERT_QUOTE_SQL, quoteParams('Q20260908-AAAAAA', '2026-09-08T01:00:00.000Z'));
  await db.query(INSERT_ATTACHMENT_SQL, [
    '01-deadbeef',
    'Q20260908-AAAAAA',
    'site.png',
    'image/png',
    png.length,
    png,
  ]);
  await db.exec('COMMIT');

  const quotes = await db.query('SELECT COUNT(*)::int AS c FROM quotes');
  const atts = await db.query('SELECT COUNT(*)::int AS c FROM quote_attachments');
  assert.equal(quotes.rows[0].c, 1);
  assert.equal(atts.rows[0].c, 1);
});

test('저장 중 실패하면 전부 롤백되어 반쯤 저장된 기록이 남지 않는다', async () => {
  const db = await freshDb();

  await db.exec('BEGIN');
  await db.query(INSERT_QUOTE_SQL, quoteParams('Q20260908-BBBBBB', '2026-09-08T01:00:00.000Z'));
  let failed = false;
  try {
    // 존재하지 않는 접수번호를 참조하는 첨부 → 외래키 위반
    await db.query(INSERT_ATTACHMENT_SQL, [
      '01-cafebabe',
      'Q20260908-NOEXIST',
      'x.png',
      'image/png',
      3,
      Buffer.from([1, 2, 3]),
    ]);
  } catch {
    failed = true;
    await db.exec('ROLLBACK');
  }

  assert.ok(failed, '외래키 위반이 발생해야 한다');
  const quotes = await db.query('SELECT COUNT(*)::int AS c FROM quotes');
  assert.equal(quotes.rows[0].c, 0, '롤백되어 접수 기록이 남지 않아야 한다');
});

test('첨부 이미지 바이트가 손상 없이 저장·조회된다', async () => {
  const db = await freshDb();
  const bytes = Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x10, 0x7f, 0x80, 0xfe]);

  await db.query(INSERT_QUOTE_SQL, quoteParams('Q20260908-CCCCCC', '2026-09-08T01:00:00.000Z'));
  await db.query(INSERT_ATTACHMENT_SQL, [
    '01-0badf00d',
    'Q20260908-CCCCCC',
    'photo.jpg',
    'image/jpeg',
    bytes.length,
    bytes,
  ]);

  const res = await db.query(SELECT_ATTACHMENT_SQL, ['Q20260908-CCCCCC', '01-0badf00d']);
  assert.equal(res.rows.length, 1);
  assert.equal(res.rows[0].mime_type, 'image/jpeg');
  assert.deepEqual(Buffer.from(res.rows[0].data), bytes);
});

test('다른 접수의 첨부 식별자로는 조회되지 않는다', async () => {
  const db = await freshDb();
  await db.query(INSERT_QUOTE_SQL, quoteParams('Q20260908-DDDDDD', '2026-09-08T01:00:00.000Z'));
  await db.query(INSERT_QUOTE_SQL, quoteParams('Q20260908-EEEEEE', '2026-09-08T02:00:00.000Z'));
  await db.query(INSERT_ATTACHMENT_SQL, [
    '01-11111111',
    'Q20260908-DDDDDD',
    'a.png',
    'image/png',
    3,
    Buffer.from([1, 2, 3]),
  ]);

  const wrong = await db.query(SELECT_ATTACHMENT_SQL, ['Q20260908-EEEEEE', '01-11111111']);
  assert.equal(wrong.rows.length, 0);
});

test('목록 조회는 최신순이며 첨부 메타데이터를 함께 반환한다 (이미지 본문 제외)', async () => {
  const db = await freshDb();
  await db.query(INSERT_QUOTE_SQL, quoteParams('Q20260908-OLD001', '2026-09-08T01:00:00.000Z'));
  await db.query(INSERT_QUOTE_SQL, quoteParams('Q20260908-NEW001', '2026-09-08T09:00:00.000Z'));
  await db.query(INSERT_ATTACHMENT_SQL, [
    '01-22222222',
    'Q20260908-NEW001',
    'front.png',
    'image/png',
    3,
    Buffer.from([1, 2, 3]),
  ]);

  const res = await db.query(SELECT_QUOTES_SQL, [10]);
  assert.equal(res.rows.length, 2);
  assert.equal(res.rows[0].id, 'Q20260908-NEW001', '최신 접수가 먼저 나와야 한다');
  assert.equal(res.rows[1].attachments.length, 0);

  const att = res.rows[0].attachments[0];
  assert.equal(att.originalName, 'front.png');
  assert.equal(att.mimeType, 'image/png');
  assert.equal(att.size, 3);
  assert.equal(att.data, undefined, '목록 조회에 이미지 본문이 포함되면 안 된다');
});

test('선택 입력 정보(JSONB)가 그대로 보존된다', async () => {
  const db = await freshDb();
  await db.query(
    INSERT_QUOTE_SQL,
    quoteParams('Q20260908-FFFFFF', '2026-09-08T01:00:00.000Z', {
      optional: { usage: '음식점', area: '25', areaUnit: '평', floor: '지상 1층' },
    }),
  );
  const res = await db.query(SELECT_QUOTES_SQL, [10]);
  assert.deepEqual(res.rows[0].optional, {
    usage: '음식점',
    area: '25',
    areaUnit: '평',
    floor: '지상 1층',
  });
});

test('알림 상태 갱신이 접수 내용에 영향을 주지 않는다', async () => {
  const db = await freshDb();
  await db.query(INSERT_QUOTE_SQL, quoteParams('Q20260908-GGGGGG', '2026-09-08T01:00:00.000Z'));
  await db.query(UPDATE_NOTIFICATION_SQL, ['Q20260908-GGGGGG', 'webhook', 'failed', 'HTTP 500']);

  const res = await db.query(SELECT_QUOTES_SQL, [10]);
  assert.equal(res.rows[0].notification_status, 'failed');
  assert.equal(res.rows[0].notification_detail, 'HTTP 500');
  assert.equal(res.rows[0].message, '내부철거 문의드립니다.', '접수 내용은 그대로여야 한다');
});

test('접수 삭제 시 첨부도 함께 삭제된다 (개인정보 파기)', async () => {
  const db = await freshDb();
  await db.query(INSERT_QUOTE_SQL, quoteParams('Q20260908-HHHHHH', '2026-09-08T01:00:00.000Z'));
  await db.query(INSERT_ATTACHMENT_SQL, [
    '01-33333333',
    'Q20260908-HHHHHH',
    'a.png',
    'image/png',
    3,
    Buffer.from([1, 2, 3]),
  ]);

  await db.query('DELETE FROM quotes WHERE id = $1', ['Q20260908-HHHHHH']);
  const atts = await db.query('SELECT COUNT(*)::int AS c FROM quote_attachments');
  assert.equal(atts.rows[0].c, 0);
});
