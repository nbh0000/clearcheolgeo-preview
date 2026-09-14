/**
 * 저장 스키마 검증
 * ------------------------------------------------------------
 * 실제 PostgreSQL 엔진(PGlite: PostgreSQL 을 WASM 으로 빌드한 것)에 대해
 * supabase/schema.sql 을 그대로 실행하여 검증한다.
 * (Storage 버킷 생성문은 Supabase 전용 스키마라서 제외한다)
 *
 * 확인 항목
 *  - 스키마가 생성되고, 두 번 실행해도 안전한지
 *  - 접수 + 첨부 메타데이터가 저장되고 최신순으로 조회되는지
 *  - 선택 입력(JSONB)이 보존되는지
 *  - 접수 삭제 시 첨부 메타도 함께 삭제되는지 (ON DELETE CASCADE)
 *  - RLS 가 켜져 있는지 (공개 키로 접근 불가)
 *
 * 실행: npm run test:db
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const SCHEMA_SQL = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8')
  .split(/;\s*\n/)
  .filter((stmt) => stmt.trim() && !/storage\.buckets/.test(stmt))
  .map((stmt) => `${stmt};`)
  .join('\n');

const INSERT_QUOTE_SQL = `
INSERT INTO quotes (
  id, received_at, type, type_label, name, company, phone,
  address, address_detail, message, optional,
  consent_agreed, consent_version, consent_agreed_at,
  ip_hash, user_agent, notification_channel, notification_status
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`;

const INSERT_ATTACHMENT_SQL = `
INSERT INTO quote_attachments (id, quote_id, original_name, mime_type, byte_size, storage_path)
VALUES ($1, $2, $3, $4, $5, $6)`;

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

test('두 테이블 모두 RLS 가 켜져 있다 (공개 키로 접근 불가)', async () => {
  const db = await freshDb();
  const res = await db.query(
    "SELECT relname, relrowsecurity FROM pg_class WHERE relname IN ('quotes','quote_attachments') ORDER BY relname",
  );
  assert.deepEqual(
    res.rows.map((r) => [r.relname, r.relrowsecurity]),
    [
      ['quote_attachments', true],
      ['quotes', true],
    ],
  );
});

test('접수와 첨부 메타데이터가 저장되고 최신순으로 조회된다', async () => {
  const db = await freshDb();
  await db.query(INSERT_QUOTE_SQL, quoteParams('Q20260908-OLD001', '2026-09-08T01:00:00.000Z'));
  await db.query(INSERT_QUOTE_SQL, quoteParams('Q20260908-NEW001', '2026-09-08T09:00:00.000Z'));
  await db.query(INSERT_ATTACHMENT_SQL, [
    '01-deadbeef',
    'Q20260908-NEW001',
    '현장.png',
    'image/png',
    68,
    'Q20260908-NEW001/01-deadbeef',
  ]);

  const res = await db.query('SELECT id FROM quotes ORDER BY received_at DESC');
  assert.deepEqual(
    res.rows.map((r) => r.id),
    ['Q20260908-NEW001', 'Q20260908-OLD001'],
  );

  const att = await db.query(
    'SELECT id, storage_path, byte_size FROM quote_attachments WHERE quote_id = $1',
    ['Q20260908-NEW001'],
  );
  assert.equal(att.rows.length, 1);
  assert.equal(att.rows[0].storage_path, 'Q20260908-NEW001/01-deadbeef');
  assert.equal(att.rows[0].byte_size, 68);
});

test('선택 입력 정보(JSONB)가 그대로 보존된다', async () => {
  const db = await freshDb();
  await db.query(INSERT_QUOTE_SQL, quoteParams('Q20260908-BBBBBB', '2026-09-08T01:00:00.000Z'));
  const res = await db.query('SELECT optional FROM quotes WHERE id = $1', ['Q20260908-BBBBBB']);
  assert.deepEqual(res.rows[0].optional, { usage: '카페', area: '30', areaUnit: '평' });
});

test('접수 삭제 시 첨부 메타도 함께 삭제된다 (개인정보 파기)', async () => {
  const db = await freshDb();
  await db.query(INSERT_QUOTE_SQL, quoteParams('Q20260908-CCCCCC', '2026-09-08T01:00:00.000Z'));
  await db.query(INSERT_ATTACHMENT_SQL, [
    '01-0badf00d',
    'Q20260908-CCCCCC',
    'a.jpg',
    'image/jpeg',
    3,
    'Q20260908-CCCCCC/01-0badf00d',
  ]);
  await db.query('DELETE FROM quotes WHERE id = $1', ['Q20260908-CCCCCC']);
  const res = await db.query('SELECT count(*)::int AS n FROM quote_attachments');
  assert.equal(res.rows[0].n, 0);
});

test('존재하지 않는 접수에는 첨부를 붙일 수 없다 (외래키)', async () => {
  const db = await freshDb();
  await assert.rejects(
    db.query(INSERT_ATTACHMENT_SQL, ['01-11111111', 'Q20260908-NOPE01', 'x.png', 'image/png', 1, 'x']),
  );
});
