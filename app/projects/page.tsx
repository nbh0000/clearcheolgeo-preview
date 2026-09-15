import Link from 'next/link';
import type { Metadata } from 'next';
import { siteConfig } from '@/config/site';
import { isDatabaseConfigured } from '@/lib/db';
import { listProjects, projectDisplayTitle, type ProjectRecord } from '@/lib/projects';
import { pageMetadata } from '@/lib/seo';
import ProjectGallery from '@/components/ProjectGallery';
import { sampleProjects } from '@/content/sampleProjects';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = pageMetadata({
  title: '시공사례',
  description: '클리어철거가 실제로 진행한 철거·폐기물처리·원상복구 현장 사례입니다.',
  path: '/projects',
});

/**
 * 시공사례 목록 — 관리자 페이지에서 등록한 사례를 최신순으로 보여준다.
 * 사례마다 사진 여러 장, 태그(업종·지역·작업 내용·면적), 총 견적, 설명이 세로로 쌓인다.
 * "더보기"는 쿼리스트링(page)으로 동작하므로 JS 없이도 사용할 수 있다.
 */
export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const pageNum = Math.max(1, Number.parseInt(page ?? '1', 10) || 1);
  const pageSize = siteConfig.projects.pageSize;

  let items: ProjectRecord[] = [];
  let total = 0;
  let loadError: string | null = null;
  if (isDatabaseConfigured()) {
    try {
      // 1페이지부터 현재 페이지까지 한 번에 보여준다 ("더보기" 누적 방식)
      const res = await listProjects({ publishedOnly: true, limit: pageSize * pageNum, offset: 0 });
      items = res.items;
      total = res.total;
    } catch (err) {
      loadError = err instanceof Error ? err.message : '사례를 불러오지 못했습니다.';
    }
  }
  // 등록된 사례가 없고 예시 표시가 켜져 있으면(미리보기·개발용) 예시를 보여준다.
  if (items.length === 0 && process.env.NEXT_PUBLIC_SHOW_SAMPLE_PROJECTS === '1') {
    items = sampleProjects;
    total = sampleProjects.length;
    loadError = null;
  }
  const hasMore = items.length < total;

  return (
    <section className="pj-section" aria-labelledby="projects-title">
      <div className="pj-wrap">
        <header className="pj-head">
          <h1 className="hm-label" id="projects-title">
            시공사례
          </h1>
        </header>

        {loadError && <div className="notice pj-notice">사례를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.</div>}

        {!loadError && items.length === 0 && (
          <div className="notice pj-notice">아직 등록된 시공사례가 없습니다.</div>
        )}

        {items.length > 0 && (
          <ol className="pj-list">
            {items.map((p) => {
              const tags = [p.usage, p.region, p.scope, p.areaText].filter(Boolean);
              return (
                <li className="pj-item" key={p.id} id={p.id}>
                  <ProjectGallery
                    photos={p.photos.map((ph, i) => ({
                      url: ph.url,
                      alt: `${projectDisplayTitle(p)} 현장 사진 ${i + 1}`,
                      width: ph.width,
                      height: ph.height,
                    }))}
                  />
                  <ul className="pj-tags" aria-label="현장 정보">
                    {p.isSample && <li className="pj-tag-sample">예시</li>}
                    {tags.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                  <dl className="pj-facts">
                    {p.amountText && (
                      <div>
                        <dt>총 견적</dt>
                        <dd>{p.amountText}</dd>
                      </div>
                    )}
                    {p.durationText && (
                      <div>
                        <dt>작업 기간</dt>
                        <dd>{p.durationText}</dd>
                      </div>
                    )}
                  </dl>
                  {p.description && <p className="pj-desc">{p.description}</p>}
                </li>
              );
            })}
          </ol>
        )}

        {hasMore && (
          <p className="pj-more">
            <Link className="hm-btn hm-btn-line" href={`/projects?page=${pageNum + 1}`} scroll={false}>
              더보기
            </Link>
          </p>
        )}

        <div className="pj-cta">
          <p>비슷한 현장의 철거·폐기물처리 견적이 필요하다면</p>
          <div className="btn-row">
            <Link className="hm-btn hm-btn-dark" href="/quote">
              견적문의
            </Link>
            <a className="hm-btn hm-btn-line" href={siteConfig.phone.href}>
              전화상담 <span className="num">{siteConfig.phone.display}</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
