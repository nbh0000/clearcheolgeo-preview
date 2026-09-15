'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ProjectRecord } from '@/lib/projects';

type ExistingPhoto = { id: string; url: string };
type NewPhoto = { key: string; file: File; preview: string };

type Props = {
  /** 수정일 때 기존 사례. 없으면 새로 등록. */
  project?: ProjectRecord;
  limits: {
    maxPhotos: number;
    title: number;
    usage: number;
    region: number;
    scope: number;
    areaText: number;
    durationText: number;
    amountText: number;
    description: number;
  };
};

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.85;

/**
 * 브라우저에서 사진을 긴 변 1600px 이하 JPEG 로 줄인다.
 * 원본 그대로 올리면 수 MB 씩 되므로, 업로드와 페이지 로딩을 가볍게 하기 위해서다.
 * 줄이지 못하면(지원하지 않는 형식 등) 원본을 그대로 쓴다.
 */
async function shrinkImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
    if (!blob) return file;
    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

export default function ProjectForm({ project, limits }: Props) {
  const router = useRouter();
  const isEdit = Boolean(project);
  const [fields, setFields] = useState({
    title: project?.title ?? '',
    usage: project?.usage ?? '',
    region: project?.region ?? '',
    scope: project?.scope ?? '',
    areaText: project?.areaText ?? '',
    durationText: project?.durationText ?? '',
    amountText: project?.amountText ?? '',
    description: project?.description ?? '',
    published: project?.published ?? true,
  });
  const [existing, setExisting] = useState<ExistingPhoto[]>(
    (project?.photos ?? []).map((p) => ({ id: p.id, url: p.url })),
  );
  const [removed, setRemoved] = useState<string[]>([]);
  const [added, setAdded] = useState<NewPhoto[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const keptCount = existing.length - removed.length;
  const totalCount = keptCount + added.length;

  function set<K extends keyof typeof fields>(k: K, v: (typeof fields)[K]) {
    setFields((f) => ({ ...f, [k]: v }));
  }

  async function addFiles(list: FileList | File[]) {
    const files = Array.from(list).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;
    const room = limits.maxPhotos - totalCount;
    if (room <= 0) {
      setStatus(`사진은 최대 ${limits.maxPhotos}장까지 등록할 수 있습니다.`);
      return;
    }
    setStatus('사진 준비 중…');
    const picked = files.slice(0, room);
    const shrunk = await Promise.all(picked.map(shrinkImage));
    setAdded((cur) => [
      ...cur,
      ...shrunk.map((file, i) => ({
        key: `${Date.now()}-${i}-${file.name}`,
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);
    setStatus(files.length > room ? `${files.length - room}장은 개수 제한으로 제외했습니다.` : '');
  }

  function removeAdded(key: string) {
    setAdded((cur) => {
      const target = cur.find((p) => p.key === key);
      if (target) URL.revokeObjectURL(target.preview);
      return cur.filter((p) => p.key !== key);
    });
  }

  function toggleRemoved(id: string) {
    setRemoved((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  function move(kind: 'existing' | 'added', index: number, dir: -1 | 1) {
    if (kind === 'existing') {
      setExisting((cur) => {
        const next = [...cur];
        const j = index + dir;
        if (j < 0 || j >= next.length) return cur;
        [next[index], next[j]] = [next[j], next[index]];
        return next;
      });
    } else {
      setAdded((cur) => {
        const next = [...cur];
        const j = index + dir;
        if (j < 0 || j >= next.length) return cur;
        [next[index], next[j]] = [next[j], next[index]];
        return next;
      });
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErrors({});
    setStatus('저장 중…');
    try {
      const fd = new FormData();
      Object.entries(fields).forEach(([k, v]) => fd.append(k, String(v)));
      if (isEdit) {
        removed.forEach((id) => fd.append('removePhotoIds', id));
        existing.filter((p) => !removed.includes(p.id)).forEach((p) => fd.append('photoOrder', p.id));
      }
      added.forEach((p) => fd.append('photos', p.file, p.file.name));

      const res = await fetch(isEdit ? `/api/admin/projects/${project!.id}` : '/api/admin/projects', {
        method: isEdit ? 'PUT' : 'POST',
        body: fd,
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        errors?: Record<string, string>;
        id?: string;
      };
      if (!res.ok || !body.ok) {
        setErrors(body.errors ?? {});
        setStatus(body.message ?? '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
        return;
      }
      setStatus('저장했습니다.');
      router.push('/admin/projects');
      router.refresh();
    } catch {
      setStatus('네트워크 오류로 저장하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  const err = (k: string) => (errors[k] ? <span className="error-text">{errors[k]}</span> : null);

  return (
    <form className="pform" onSubmit={onSubmit} noValidate>
      <div className="pform-grid">
        <div className="field">
          <label className="label" htmlFor="pf-usage">
            업종 / 현장 <span className="req">*</span>
          </label>
          <input
            id="pf-usage"
            className="input"
            value={fields.usage}
            maxLength={limits.usage}
            placeholder="예: 사무실(지식산업센터), 피아노학원"
            onChange={(e) => set('usage', e.target.value)}
            aria-invalid={Boolean(errors.usage)}
          />
          {err('usage')}
        </div>
        <div className="field">
          <label className="label" htmlFor="pf-region">
            지역 <span className="req">*</span>
          </label>
          <input
            id="pf-region"
            className="input"
            value={fields.region}
            maxLength={limits.region}
            placeholder="예: 구로구 디지털단지"
            onChange={(e) => set('region', e.target.value)}
            aria-invalid={Boolean(errors.region)}
          />
          {err('region')}
          <span className="help">상세 주소는 적지 않습니다. 구·동 정도까지만 적어 주세요.</span>
        </div>
        <div className="field span-2">
          <label className="label" htmlFor="pf-scope">
            작업 내용 <span className="req">*</span>
          </label>
          <input
            id="pf-scope"
            className="input"
            value={fields.scope}
            maxLength={limits.scope}
            placeholder="예: 칸막이, 바닥, 천정 철거"
            onChange={(e) => set('scope', e.target.value)}
            aria-invalid={Boolean(errors.scope)}
          />
          {err('scope')}
        </div>
        <div className="field">
          <label className="label" htmlFor="pf-area">
            면적
          </label>
          <input
            id="pf-area"
            className="input"
            value={fields.areaText}
            maxLength={limits.areaText}
            placeholder="예: 60평"
            onChange={(e) => set('areaText', e.target.value)}
          />
          {err('areaText')}
        </div>
        <div className="field">
          <label className="label" htmlFor="pf-duration">
            작업 기간
          </label>
          <input
            id="pf-duration"
            className="input"
            value={fields.durationText}
            maxLength={limits.durationText}
            placeholder="예: 2일"
            onChange={(e) => set('durationText', e.target.value)}
          />
          {err('durationText')}
        </div>
        <div className="field">
          <label className="label" htmlFor="pf-amount">
            총 견적
          </label>
          <input
            id="pf-amount"
            className="input"
            value={fields.amountText}
            maxLength={limits.amountText}
            placeholder="예: 1,100만원"
            onChange={(e) => set('amountText', e.target.value)}
          />
          {err('amountText')}
        </div>
        <div className="field">
          <label className="label" htmlFor="pf-title">
            제목 (관리용, 선택)
          </label>
          <input
            id="pf-title"
            className="input"
            value={fields.title}
            maxLength={limits.title}
            placeholder="비워두면 지역 + 업종으로 표시"
            onChange={(e) => set('title', e.target.value)}
          />
          {err('title')}
        </div>
        <div className="field span-2">
          <label className="label" htmlFor="pf-desc">
            설명
          </label>
          <textarea
            id="pf-desc"
            className="textarea"
            value={fields.description}
            maxLength={limits.description}
            placeholder="현장 상황, 진행 과정, 고객 후기 등을 적어 주세요."
            onChange={(e) => set('description', e.target.value)}
          />
          {err('description')}
          <span className="help">
            {fields.description.length} / {limits.description}자
          </span>
        </div>

        <div className="field span-2">
          <span className="label">
            현장 사진 ({totalCount} / {limits.maxPhotos}장)
          </span>
          <label
            className="pform-dropzone"
            data-active={dragActive}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              void addFiles(e.dataTransfer.files);
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={(e) => {
                if (e.target.files) void addFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <strong>사진을 끌어다 놓거나 클릭해서 선택</strong>
            <span className="help">
              JPG · PNG · WEBP. 올릴 때 긴 변 {MAX_EDGE}px 로 자동 축소됩니다. 첫 번째 사진이 대표
              사진입니다.
            </span>
          </label>

          {(existing.length > 0 || added.length > 0) && (
            <div className="pform-photos">
              {existing.map((p, i) => (
                <div className="pform-photo" key={p.id} data-removed={removed.includes(p.id)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" />
                  <div className="pp-bar">
                    <span>
                      <button type="button" onClick={() => move('existing', i, -1)} aria-label="앞으로">
                        ←
                      </button>{' '}
                      <button type="button" onClick={() => move('existing', i, 1)} aria-label="뒤로">
                        →
                      </button>
                    </span>
                    <button type="button" onClick={() => toggleRemoved(p.id)}>
                      {removed.includes(p.id) ? '되돌리기' : '삭제'}
                    </button>
                  </div>
                </div>
              ))}
              {added.map((p, i) => (
                <div className="pform-photo" key={p.key}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.preview} alt="" />
                  <div className="pp-bar">
                    <span>
                      <button type="button" onClick={() => move('added', i, -1)} aria-label="앞으로">
                        ←
                      </button>{' '}
                      <button type="button" onClick={() => move('added', i, 1)} aria-label="뒤로">
                        →
                      </button>
                    </span>
                    <button type="button" onClick={() => removeAdded(p.key)}>
                      빼기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="field span-2">
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={fields.published}
              onChange={(e) => set('published', e.target.checked)}
            />
            <span>
              <strong>공개</strong> — 체크를 풀면 저장은 되지만 시공사례 페이지에는 표시되지 않습니다.
            </span>
          </label>
        </div>
      </div>

      <div className="pform-actions">
        <button type="submit" className="hm-btn hm-btn-dark" disabled={busy} aria-disabled={busy}>
          {busy ? '저장 중…' : isEdit ? '수정 저장' : '사례 등록'}
        </button>
        <a className="hm-btn hm-btn-line" href="/admin/projects">
          목록으로
        </a>
        {status && (
          <span className="pform-status" role="status">
            {status}
          </span>
        )}
      </div>
    </form>
  );
}
