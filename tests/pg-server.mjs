/**
 * 로컬 검증용 PostgreSQL 서버
 * ------------------------------------------------------------
 * PGlite(PostgreSQL WASM 빌드)를 TCP 포트로 노출해, 실제 배포와 동일하게
 * DATABASE_URL 로 접속되는 상태에서 접수 API 를 검증하기 위한 것이다.
 *
 * ※ 개발·테스트 전용이다. 운영에는 관리형 PostgreSQL(자동 백업 포함)을 사용한다.
 *
 * 실행: node tests/pg-server.mjs [포트] [데이터디렉터리]
 *   데이터디렉터리를 주면 디스크에 저장되어 서버를 껐다 켜도 데이터가 유지된다.
 */
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';

const port = Number(process.argv[2] ?? 55432);
const dataDir = process.argv[3];

const db = dataDir ? await PGlite.create({ dataDir }) : await PGlite.create();
const server = new PGLiteSocketServer({ db, port, host: '127.0.0.1' });
await server.start();

console.log(`[test-pg] 준비 완료: postgresql://postgres:postgres@127.0.0.1:${port}/postgres`);

const shutdown = async () => {
  await server.stop();
  await db.close();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
