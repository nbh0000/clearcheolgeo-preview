import type { Metadata } from 'next';
import { PROJECT_LIMITS } from '@/lib/projects';
import ProjectForm from '@/components/admin/ProjectForm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '시공사례 등록',
  robots: { index: false, follow: false },
};

export default function AdminProjectNewPage() {
  return (
    <section className="section">
      <div className="container">
        <nav className="admin-nav" aria-label="관리자 메뉴">
          <a href="/admin">견적문의 접수</a>
          <a aria-current="page" href="/admin/projects">
            시공사례 관리
          </a>
        </nav>
        <h1 className="display-sm">새 시공사례 등록</h1>
        <p className="body-sm mt-sm">
          공개 동의를 받은 현장만 올려 주세요. 사진에 사람 얼굴이나 간판·상호가 보이면 가려서 올리는
          것이 좋습니다.
        </p>
        <div className="mt-xl">
          <ProjectForm limits={PROJECT_LIMITS} />
        </div>
      </div>
    </section>
  );
}
