import Link from 'next/link';
import type { Metadata } from 'next';
import { isDatabaseConfigured } from '@/lib/db';
import { checkProjectsTable, listProjects, projectDisplayTitle, type ProjectRecord } from '@/lib/projects';
import DeleteProjectButton from '@/components/admin/DeleteProjectButton';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '시공사례 관리',
  robots: { index: false, follow: false },
};

function formatKst(iso: string): string {
  const d = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** 관리자 — 시공사례 목록 (등록·수정·삭제 진입점). Basic 인증은 middleware.ts 에서 처리. */
export default async function AdminProjectsPage() {
  const configured = isDatabaseConfigured();
  const table = configured ? await checkProjectsTable() : { ok: false, detail: 'SUPABASE_URL 미설정' };

  let items: ProjectRecord[] = [];
  let loadError: string | null = null;
  if (table.ok) {
    try {
      items = (await listProjects({ publishedOnly: false, limit: 200 })).items;
    } catch (err) {
      loadError = err instanceof Error ? err.message : '조회 중 오류가 발생했습니다.';
    }
  }

  return (
    <section className="section">
      <div className="container">
        <nav className="admin-nav" aria-label="관리자 메뉴">
          <a href="/admin">견적문의 접수</a>
          <a aria-current="page" href="/admin/projects">
            시공사례 관리
          </a>
        </nav>

        <div className="admin-head">
          <div>
            <h1 className="display-sm">시공사례 관리</h1>
            <p className="body-sm mt-sm">
              여기서 등록한 사례가 <a className="link-inline" href="/projects" target="_blank" rel="noreferrer">시공사례 페이지</a>
              에 최신순으로 표시됩니다. {table.ok ? `현재 ${items.length}건` : ''}
            </p>
          </div>
          {table.ok && (
            <Link className="hm-btn hm-btn-dark" href="/admin/projects/new">
              + 새 사례 등록
            </Link>
          )}
        </div>

        {!table.ok && (
          <div className="notice mt-lg" style={{ borderColor: 'var(--semantic-down)' }}>
            <p className="title-sm" style={{ color: 'var(--semantic-down)' }}>
              시공사례 저장소가 준비되지 않았습니다
            </p>
            <p className="mt-xs">{table.detail}</p>
            <p className="mt-xs">
              Supabase 연결(SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY)을 확인해 주세요. 저장소
              버킷은 연결만 되면 자동으로 만들어집니다.
            </p>
          </div>
        )}

        {loadError && (
          <div className="notice mt-lg" style={{ borderColor: 'var(--semantic-down)' }}>
            <p className="title-sm" style={{ color: 'var(--semantic-down)' }}>
              목록을 불러오지 못했습니다
            </p>
            <p className="mt-xs">{loadError}</p>
          </div>
        )}

        {table.ok && !loadError && items.length === 0 && (
          <div className="notice mt-lg">아직 등록된 사례가 없습니다. 오른쪽 위 버튼으로 첫 사례를 등록해 주세요.</div>
        )}

        {items.length > 0 && (
          <ul className="admin-projects">
            {items.map((p) => {
              const label = projectDisplayTitle(p);
              return (
                <li className="admin-project" key={p.id}>
                  <div className="admin-project-thumb">
                    {p.photos[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photos[0].url} alt="" loading="lazy" />
                    )}
                  </div>
                  <div>
                    <p className="title-sm">
                      {label}{' '}
                      {p.published ? (
                        <span className="admin-badge">공개</span>
                      ) : (
                        <span className="admin-badge admin-badge-off">비공개</span>
                      )}
                    </p>
                    <p className="admin-project-meta mt-xs">
                      {[p.scope, p.areaText, p.amountText && `총 견적 ${p.amountText}`].filter(Boolean).join(' · ')}
                    </p>
                    <p className="admin-project-meta">
                      사진 {p.photos.length}장 · 등록 {formatKst(p.createdAt)} · <span className="num">{p.id}</span>
                    </p>
                  </div>
                  <div className="admin-project-actions">
                    <Link className="btn btn-outline" href={`/admin/projects/${p.id}`}>
                      수정
                    </Link>
                    <DeleteProjectButton projectId={p.id} label={label} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
