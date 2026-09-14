/**
 * Cloudflare Workers 진입점
 * ------------------------------------------------------------
 * OpenNext 가 생성한 워커(.open-next/worker.js)를 그대로 쓰되, 크론 트리거(scheduled)를 추가한다.
 *
 * 크론의 목적: Supabase 무료 플랜은 7일간 요청이 없으면 프로젝트가 일시정지된다.
 * 접수가 뜸한 기간에도 DB 가 멈추지 않도록 매일 한 번 아주 가벼운 조회를 보낸다.
 * (스케줄은 wrangler.jsonc 의 triggers.crons)
 */
import openNext from './.open-next/worker.js';

export { DOQueueHandler, DOShardedTagCache, BucketCachePurge } from './.open-next/worker.js';

type Env = {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
};

async function keepSupabaseAwake(env: Env): Promise<void> {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.warn('[cron] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 미설정 — 건너뜀');
    return;
  }
  const res = await fetch(`${url}/rest/v1/quotes?select=id&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  console.log(`[cron] supabase keep-alive: ${res.status}`);
}

export default {
  fetch: openNext.fetch,
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(keepSupabaseAwake(env));
  },
};
