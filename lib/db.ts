/**
 * Supabase 연결 (HTTP)
 * ------------------------------------------------------------
 * 견적문의는 Supabase PostgreSQL 에 저장한다.
 *
 * Cloudflare Workers 는 Supabase 의 자체 인증기관 인증서를 검증할 수 없어
 * PostgreSQL 프로토콜(TCP/TLS)로 직접 접속하지 못한다. 그래서 supabase-js 로
 * Data API(PostgREST)와 Storage 를 HTTPS 로 호출한다.
 *
 * 필요한 환경변수
 *   SUPABASE_URL               예) https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  service_role 키 (서버 전용 · 절대 클라이언트에 노출 금지)
 *
 * 테이블·버킷은 supabase/schema.sql 을 SQL Editor 에서 1회 실행해 만든다.
 * 설정이 없으면 온라인 접수를 받지 않고 전화상담 안내로 대체한다.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** 첨부 이미지 버킷 (비공개) */
export const ATTACHMENT_BUCKET = 'quote-attachments';

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** 요청마다 가벼운 클라이언트를 만든다. (fetch 기반이라 커넥션 관리가 필요 없다) */
export function getSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 설정되지 않았습니다.');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

/** 연결 상태 점검 (관리자 화면에서 사용) */
export async function checkDatabase(): Promise<{ ok: boolean; detail?: string }> {
  if (!isDatabaseConfigured()) return { ok: false, detail: 'SUPABASE_URL 미설정' };
  try {
    const { error } = await getSupabase().from('quotes').select('id', { head: true, count: 'exact' });
    if (error) return { ok: false, detail: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : '알 수 없는 오류' };
  }
}
