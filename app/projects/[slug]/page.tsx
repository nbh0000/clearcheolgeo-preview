import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getProjectBySlug, getPublishedProjects } from '@/content/projects';
import { pageMetadata } from '@/lib/seo';
import CtaBand from '@/components/CtaBand';

export async function generateStaticParams() {
  return getPublishedProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return { title: '시공사례', robots: { index: false, follow: false } };

  return pageMetadata({
    title: `${project.title} | 시공사례`,
    description: `${project.region} ${project.usage} · ${project.scope.join(', ')} 작업 사례입니다.`,
    path: `/projects/${project.slug}`,
  });
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const facts: { label: string; value: string }[] = [
    { label: '작업 분류', value: project.scope.join(', ') },
    { label: '지역', value: project.region },
    { label: '업종/용도', value: project.usage },
  ];
  if (project.areaText) facts.push({ label: '면적', value: project.areaText });
  if (project.durationText) facts.push({ label: '작업 기간', value: project.durationText });

  const pairCount = Math.max(project.beforePhotos.length, project.afterPhotos.length);

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <p className="eyebrow">
            <Link href="/projects">시공사례</Link>
          </p>
          <h1 className="display-md mt-sm">{project.title}</h1>
          {project.isSample && <p className="badge-pill mt-base">테스트 데이터</p>}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid grid-2">
            <div>
              <h2 className="title-lg">현장 설명</h2>
              <p className="body-md mt-sm">{project.description}</p>
            </div>
            <dl className="card">
              {facts.map((fact) => (
                <div
                  key={fact.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 'var(--s-base)',
                    padding: 'var(--s-sm) 0',
                    borderBottom: '1px solid var(--hairline-soft)',
                  }}
                >
                  <dt className="body-sm">{fact.label}</dt>
                  <dd className="title-sm" style={{ margin: 0, textAlign: 'right' }}>
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <h2 className="title-lg mt-xxl">작업 전 · 후</h2>
          <div className="stack-lg mt-base">
            {Array.from({ length: pairCount }).map((_, i) => (
              <div className="ba-grid" key={i}>
                {project.beforePhotos[i] && (
                  <figure className="ba-figure">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={project.beforePhotos[i].src}
                      alt={project.beforePhotos[i].alt}
                      loading="lazy"
                    />
                    <figcaption>작업 전</figcaption>
                  </figure>
                )}
                {project.afterPhotos[i] && (
                  <figure className="ba-figure">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={project.afterPhotos[i].src}
                      alt={project.afterPhotos[i].alt}
                      loading="lazy"
                    />
                    <figcaption>작업 후</figcaption>
                  </figure>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
