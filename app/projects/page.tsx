import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PROJECT_CATEGORIES, getPublishedProjects } from '@/content/projects';
import { pageMetadata } from '@/lib/seo';
import CtaBand from '@/components/CtaBand';

export const metadata: Metadata = pageMetadata({
  title: '시공사례',
  description: '클리어철거가 실제로 진행한 철거·폐기물처리 현장 사례입니다.',
  path: '/projects',
});

/**
 * 시공사례 목록.
 * 공개 가능한 실제 사례가 없으면 페이지 자체를 노출하지 않는다(404).
 * 분류 필터는 쿼리스트링으로 동작하므로 JS 없이도 사용할 수 있다.
 */
export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const all = getPublishedProjects();
  if (all.length === 0) notFound();

  const { category } = await searchParams;
  const active = PROJECT_CATEGORIES.some((c) => c.value === category) ? category : 'all';
  const list = active === 'all' ? all : all.filter((p) => p.category === active);

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">시공사례</p>
          <h1 className="display-lg mt-sm">실제 진행한 현장</h1>
          <p className="lead mt-md measure">
            공개 동의를 받은 현장만 게시합니다. 현장 조건에 따라 작업 범위와 기간은 달라질 수
            있습니다.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <nav className="filter-row" aria-label="시공사례 분류">
            {PROJECT_CATEGORIES.map((c) => (
              <Link
                key={c.value}
                href={c.value === 'all' ? '/projects' : `/projects?category=${c.value}`}
                className={`btn ${active === c.value ? 'btn-primary' : 'btn-secondary'}`}
                aria-current={active === c.value ? 'page' : undefined}
              >
                {c.label}
              </Link>
            ))}
          </nav>

          {list.length === 0 ? (
            <div className="notice mt-lg">해당 분류의 사례가 아직 없습니다.</div>
          ) : (
            <div className="grid grid-3 mt-xl">
              {list.map((project) => (
                <article className="card card-hover" key={project.slug}>
                  {project.isSample && <span className="badge-pill">테스트 데이터</span>}
                  {project.afterPhotos[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={project.afterPhotos[0].src}
                      alt={project.afterPhotos[0].alt}
                      loading="lazy"
                      style={{ borderRadius: 'var(--r-lg)', marginBottom: 'var(--s-base)' }}
                    />
                  )}
                  <span className="badge-pill">{project.usage}</span>
                  <h2 className="title-md mt-sm">{project.title}</h2>
                  <p className="body-sm mt-xs">
                    {project.region} · {project.scope.join(', ')}
                  </p>
                  <p className="mt-base">
                    <Link className="btn-tertiary" href={`/projects/${project.slug}`}>
                      사례 자세히 보기 →
                    </Link>
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <CtaBand />
    </>
  );
}
