/**
 * GitHub Pages 미리보기용 정적 빌드 준비 스크립트
 * ------------------------------------------------------------
 * GitHub Pages 는 정적 파일만 제공하므로, 서버 기능(관리자 화면, API, 미들웨어,
 * 견적 접수·시공사례 DB 조회)을 뺀 "화면 확인용" 사본을 만든다.
 *
 * 사용법: node scripts/static-preview.mjs <작업 디렉터리>
 *   - 작업 디렉터리 안의 파일을 직접 고치므로, 원본이 아닌 복사본(또는 CI 작업 공간)에서 실행한다.
 *   - PREVIEW_BASE_PATH 환경변수(예: /clearcheolgeo-preview)가 있으면
 *     /images/, /logo/ 로 시작하는 정적 자산 경로 앞에 붙인다. (GitHub Pages 프로젝트 사이트용)
 *
 * 이후 STATIC_PREVIEW=1 PREVIEW_BASE_PATH=... npx next build 를 실행하면 out/ 에 정적 파일이 생긴다.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? '.');
const base = process.env.PREVIEW_BASE_PATH ?? '';

if (!fs.existsSync(path.join(root, 'package.json'))) {
  console.error(`package.json 을 찾을 수 없습니다: ${root}`);
  process.exit(1);
}

const remove = (rel) => {
  const target = path.join(root, rel);
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
    console.log(`제거: ${rel}`);
  }
};

// 정적 사이트에서 동작할 수 없는 서버 전용 영역
remove('app/api');
remove('app/admin');
remove('components/admin');
remove('middleware.ts');
// 정적 내보내기에서 지원되지 않는 메타 라우트 (미리보기에는 필요 없다)
remove('app/robots.ts');
remove('app/sitemap.ts');
// 미리보기 사이트는 검색엔진에 색인되지 않도록 한다.
fs.mkdirSync(path.join(root, 'public'), { recursive: true });
fs.writeFileSync(path.join(root, 'public', 'robots.txt'), ['User-agent: *', 'Disallow: /', ''].join('\n'));

// 소스 파일 순회
function walk(dir, fn) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, fn);
    else fn(full);
  }
}

const exts = new Set(['.ts', '.tsx', '.css']);
let touched = 0;
for (const dir of ['app', 'components', 'lib', 'content', 'config']) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) continue;
  walk(abs, (file) => {
    if (!exts.has(path.extname(file))) return;
    const before = fs.readFileSync(file, 'utf8');
    let after = before;
    // 동적 렌더링 선언 → 정적으로 (DB 미설정 상태의 화면이 그대로 빌드된다)
    after = after.replace(/export const dynamic = 'force-dynamic';\r?\n/g, "export const dynamic = 'force-static';\n");
    after = after.replace(/export const runtime = 'nodejs';\r?\n/g, '');
    // 절대 경로 정적 자산에 basePath 를 붙인다 ("/images/…", '/logo/…', url(/images/…))
    if (base) after = after.replace(/(["'`(])\/(images|logo)\//g, `$1${base}/$2/`);
    if (after !== before) {
      fs.writeFileSync(file, after);
      touched += 1;
    }
  });
}
console.log(`수정한 파일: ${touched}개, basePath: "${base || '(없음)'}"`);
