# Cloudflare Workers 배포 (무료 플랜)

> 목표: `www.clearcheolgeo.com` 으로 홈페이지 공개
> 구성: Cloudflare Workers(서버) + Supabase PostgreSQL(저장소) + 가비아 도메인

## 구조

- `@opennextjs/cloudflare` 어댑터로 Next.js 를 Workers 에서 실행한다. (`wrangler.jsonc`, `open-next.config.ts`)
- 접수 데이터는 Supabase PostgreSQL 에, 첨부 사진은 Supabase Storage(비공개 버킷 `quote-attachments`)에 저장한다.
- Workers 는 Supabase 의 자체 인증기관 TLS 인증서를 검증할 수 없어 PostgreSQL 프로토콜로 직접 접속하지 못한다.
  그래서 `lib/db.ts` 는 supabase-js 로 Data API / Storage 를 HTTPS 로 호출한다. (`pg` 미사용)
- 테이블·버킷은 `supabase/schema.sql` 을 Supabase **SQL Editor** 에서 1회 실행해 만든다.
  두 테이블은 RLS 가 켜져 있고 정책이 없어 anon 키로는 접근할 수 없다.
- 정적 파일은 Workers Assets 로 서빙된다.

## 명령

| 명령 | 설명 |
| --- | --- |
| `npm run cf:build` | Workers 용 빌드 (`.open-next/`) |
| `npm run cf:preview` | 빌드 후 로컬 Workers 런타임으로 미리보기 (`.dev.vars` 에 환경변수) |
| `npm run cf:deploy` | 빌드 후 배포 (`wrangler login` 필요) |

## 환경변수 (Workers → Settings → Variables and Secrets)

| 이름 | 종류 | 값 |
| --- | --- | --- |
| `SUPABASE_URL` | `wrangler.jsonc` 의 `vars` | `https://<ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Supabase → Project Settings → API keys → `service_role` |
| `ADMIN_USER` | Secret | 관리자 아이디 |
| `ADMIN_PASSWORD` | Secret | 관리자 비밀번호 (16자 이상) |
| `IP_HASH_SALT` | Secret | 임의의 긴 문자열 (변경 금지) |
| `NEXT_PUBLIC_SITE_URL` | `wrangler.jsonc` 의 `vars` | 빌드 시점에 반영 |

## GitHub 자동 배포 (Workers Builds)

Workers → clearcheolgeo → Settings → Build → GitHub 저장소 연결

| 항목 | 값 |
| --- | --- |
| Build command | `npm run cf:build` |
| Deploy command | `npx wrangler deploy` |
| Branch | `main` |

## 도메인

Workers → Settings → Domains & Routes → `www.clearcheolgeo.com` 추가.
도메인을 Cloudflare DNS 로 옮기면(가비아에서 네임서버 변경) 커스텀 도메인·HTTPS 가 자동 처리된다.

## 무료 플랜 제약

- 요청당 CPU 10ms, 워커 번들 3MB(gzip) — 현재 약 1MB
- 첨부 사진(최대 10MB×5)을 DB 에 저장하는 접수 요청은 실제 환경에서 확인 필요
