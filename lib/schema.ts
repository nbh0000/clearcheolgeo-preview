/**
 * 견적문의 저장 스키마 (PostgreSQL)
 * ------------------------------------------------------------
 * 애플리케이션 시작 시 1회 실행되며, 여러 번 실행해도 안전하다(IF NOT EXISTS).
 * 테스트에서도 같은 SQL 을 사용해 스키마와 쿼리를 검증한다.
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS quotes (
  id                    TEXT PRIMARY KEY,
  received_at           TIMESTAMPTZ NOT NULL,
  type                  TEXT NOT NULL,
  type_label            TEXT NOT NULL,
  name                  TEXT NOT NULL,
  company               TEXT NOT NULL DEFAULT '',
  phone                 TEXT NOT NULL,
  address               TEXT NOT NULL,
  address_detail        TEXT NOT NULL DEFAULT '',
  message               TEXT NOT NULL,
  optional              JSONB NOT NULL DEFAULT '{}'::jsonb,
  consent_agreed        BOOLEAN NOT NULL,
  consent_version       TEXT NOT NULL,
  consent_agreed_at     TIMESTAMPTZ NOT NULL,
  ip_hash               TEXT NOT NULL DEFAULT '',
  user_agent            TEXT NOT NULL DEFAULT '',
  notification_channel  TEXT NOT NULL DEFAULT 'none',
  notification_status   TEXT NOT NULL DEFAULT 'not_configured',
  notification_detail   TEXT
);

CREATE INDEX IF NOT EXISTS quotes_received_at_idx ON quotes (received_at DESC);

CREATE TABLE IF NOT EXISTS quote_attachments (
  id             TEXT NOT NULL,
  quote_id       TEXT NOT NULL REFERENCES quotes (id) ON DELETE CASCADE,
  original_name  TEXT NOT NULL,
  mime_type      TEXT NOT NULL,
  byte_size      INTEGER NOT NULL,
  data           BYTEA NOT NULL,
  PRIMARY KEY (quote_id, id)
);

CREATE INDEX IF NOT EXISTS quote_attachments_quote_idx ON quote_attachments (quote_id);
`;

/** 접수 목록 조회 (최신순). 첨부는 메타데이터만 함께 가져온다(이미지 본문 제외). */
export const SELECT_QUOTES_SQL = `
SELECT
  q.*,
  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'id', a.id,
          'originalName', a.original_name,
          'mimeType', a.mime_type,
          'size', a.byte_size
        )
        ORDER BY a.id
      )
      FROM quote_attachments a
      WHERE a.quote_id = q.id
    ),
    '[]'::json
  ) AS attachments
FROM quotes q
ORDER BY q.received_at DESC
LIMIT $1
`;

export const INSERT_QUOTE_SQL = `
INSERT INTO quotes (
  id, received_at, type, type_label, name, company, phone,
  address, address_detail, message, optional,
  consent_agreed, consent_version, consent_agreed_at,
  ip_hash, user_agent,
  notification_channel, notification_status
) VALUES (
  $1, $2, $3, $4, $5, $6, $7,
  $8, $9, $10, $11,
  $12, $13, $14,
  $15, $16,
  $17, $18
)
`;

export const INSERT_ATTACHMENT_SQL = `
INSERT INTO quote_attachments (id, quote_id, original_name, mime_type, byte_size, data)
VALUES ($1, $2, $3, $4, $5, $6)
`;

export const SELECT_ATTACHMENT_SQL = `
SELECT mime_type, data
FROM quote_attachments
WHERE quote_id = $1 AND id = $2
`;

export const UPDATE_NOTIFICATION_SQL = `
UPDATE quotes
SET notification_channel = $2, notification_status = $3, notification_detail = $4
WHERE id = $1
`;
