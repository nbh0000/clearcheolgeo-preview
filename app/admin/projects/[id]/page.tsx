import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PROJECT_LIMITS, getProject, projectDisplayTitle } from '@/lib/projects';
import ProjectForm from '@/components/admin/ProjectForm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '시공사례 수정',
  robots: { index: false, follow: false },
};

export default async function AdminProjectEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return (
    <section className="section">
      <div className="container">
        <nav className="admin-nav" aria-label="관리자 메뉴">
          <a href="/admin">견적문의 접수</a>
          <a aria-current="page" href="/admin/projects">
            시공사례 관리
          </a>
        </nav>
        <h1 className="display-sm">사례 수정 — {projectDisplayTitle(project)}</h1>
        <p className="body-sm mt-sm num">{project.id}</p>
        <div className="mt-xl">
          <ProjectForm project={project} limits={PROJECT_LIMITS} />
        </div>
      </div>
    </section>
  );
}
