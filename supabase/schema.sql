-- 클리어철거 견적문의 저장 스키마 (Supabase)
-- Supabase 대시보드 → SQL Editor 에서 1회 실행한다. 여러 번 실행해도 안전하다.
--
-- 접근 방식: 서버(Cloudflare Workers)가 service_role 키로 Data API(PostgREST)와 Storage 를 호출한다.
-- 아래 테이블은 RLS 를 켜고 정책을 두지 않으므로 anon/authenticated 키로는 읽거나 쓸 수 없다.

CREATE TABLE IF NOT EXISTS public.quotes (
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

CREATE INDEX IF NOT EXISTS quotes_received_at_idx ON public.quotes (received_at DESC);

-- 첨부 이미지 본문은 Storage 버킷(quote-attachments)에 두고, 여기에는 메타데이터만 둔다.
CREATE TABLE IF NOT EXISTS public.quote_attachments (
  id             TEXT NOT NULL,
  quote_id       TEXT NOT NULL REFERENCES public.quotes (id) ON DELETE CASCADE,
  original_name  TEXT NOT NULL,
  mime_type      TEXT NOT NULL,
  byte_size      INTEGER NOT NULL,
  storage_path   TEXT NOT NULL,
  PRIMARY KEY (quote_id, id)
);

CREATE INDEX IF NOT EXISTS quote_attachments_quote_idx ON public.quote_attachments (quote_id);

-- 공개 키(anon)로는 접근 불가
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_attachments ENABLE ROW LEVEL SECURITY;

-- 첨부 이미지용 비공개 버킷 (공개 URL 없음, service_role 로만 접근)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('quote-attachments', 'quote-attachments', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 시공사례 (관리자 페이지에서 등록 · 공개 페이지에 표시)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id             TEXT PRIMARY KEY,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  published      BOOLEAN NOT NULL DEFAULT true,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  title          TEXT NOT NULL DEFAULT '',
  usage          TEXT NOT NULL DEFAULT '',
  region         TEXT NOT NULL DEFAULT '',
  scope          TEXT NOT NULL DEFAULT '',
  area_text      TEXT NOT NULL DEFAULT '',
  duration_text  TEXT NOT NULL DEFAULT '',
  amount_text    TEXT NOT NULL DEFAULT '',
  description    TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS projects_created_at_idx ON public.projects (created_at DESC);

-- 사진 본문은 공개 Storage 버킷(project-photos)에 두고, 여기에는 메타데이터만 둔다.
CREATE TABLE IF NOT EXISTS public.project_photos (
  id            TEXT NOT NULL,
  project_id    TEXT NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  storage_path  TEXT NOT NULL,
  mime_type     TEXT NOT NULL,
  byte_size     INTEGER NOT NULL,
  width         INTEGER,
  height        INTEGER,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (project_id, id)
);

CREATE INDEX IF NOT EXISTS project_photos_project_idx ON public.project_photos (project_id);

-- 테이블은 service_role 로만 읽고 쓴다 (공개 페이지도 서버에서 읽는다).
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;

-- 시공사례 사진용 공개 버킷 (누구나 URL 로 볼 수 있음 · 업로드는 service_role 만)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('project-photos', 'project-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;
