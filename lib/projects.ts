/**
 * 시공사례 저장·조회 (Supabase)
 * ------------------------------------------------------------
 * 사례 1건은 projects 테이블에, 사진은 공개 Storage 버킷(project-photos)에 저장하고
 * project_photos 에는 메타데이터만 남긴다. 사진은 공개 URL 로 바로 표시한다.
 *
 * 등록·수정·삭제는 관리자 인증(middleware.ts)을 통과한 API 에서만 호출한다.
 * 공개 페이지는 published = true 인 사례만 읽는다.
 */
import crypto from 'node:crypto';
import { getSupabase } from './db';

/** 시공사례 사진 버킷 (공개) */
export const PROJECT_BUCKET = 'project-photos';

export const PROJECT_LIMITS = {
  title: 80,
  usage: 40,
  region: 40,
  scope: 80,
  areaText: 30,
  durationText: 30,
  amountText: 40,
  description: 2000,
  maxPhotos: 12,
  maxPhotoBytes: 10 * 1024 * 1024,
} as const;

export type ProjectPhoto = {
  id: string;
  url: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
};

export type ProjectRecord = {
  id: string;
  createdAt: string;
  updatedAt: string;
  published: boolean;
  sortOrder: number;
  /** 관리용 제목 (비워두면 지역 + 업종으로 표시) */
  title: string;
  /** 업종/현장 (예: 사무실, 피아노학원) */
  usage: string;
  /** 지역 (예: 구로구 디지털단지) */
  region: string;
  /** 작업 내용 (예: 칸막이, 바닥, 천정 철거) */
  scope: string;
  /** 면적 (예: 60평) */
  areaText: string;
  /** 작업 기간 (예: 2일) */
  durationText: string;
  /** 총 견적 (예: 1,100만원) */
  amountText: string;
  description: string;
  photos: ProjectPhoto[];
};

export type ProjectInput = Pick<
  ProjectRecord,
  | 'title'
  | 'usage'
  | 'region'
  | 'scope'
  | 'areaText'
  | 'durationText'
  | 'amountText'
  | 'description'
  | 'published'
>;

export type PendingPhoto = {
  id: string;
  mimeType: string;
  data: Buffer;
  width: number | null;
  height: number | null;
};

/** 사례 식별자: P + KST 날짜 + 랜덤 6자리 (예: P20260915-K3F9QA) */
export function newProjectId(now = new Date()): string {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const ymd = kst.toISOString().slice(0, 10).replace(/-/g, '');
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(6);
  let suffix = '';
  for (const b of bytes) suffix += alphabet[b % alphabet.length];
  return `P${ymd}-${suffix}`;
}

export function newPhotoId(): string {
  return `${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
}

export function isProjectId(id: string): boolean {
  return /^P\d{8}-[A-Z0-9]{6}$/.test(id);
}

function isPhotoId(id: string): boolean {
  return /^[0-9a-z]+-[0-9a-f]{8}$/.test(id);
}

/** 표시용 제목 — 제목이 비어 있으면 지역·업종으로 만든다. */
export function projectDisplayTitle(p: Pick<ProjectRecord, 'title' | 'region' | 'usage'>): string {
  if (p.title.trim()) return p.title.trim();
  return [p.region, p.usage].filter(Boolean).join(' ') || '시공사례';
}

/** 입력값 정리 + 검증. 오류가 있으면 필드별 메시지를 돌려준다. */
export function validateProjectInput(raw: Record<string, unknown>): {
  value: ProjectInput;
  errors: Partial<Record<keyof ProjectInput, string>>;
} {
  const str = (k: string) => (typeof raw[k] === 'string' ? (raw[k] as string).trim() : '');
  const value: ProjectInput = {
    title: str('title'),
    usage: str('usage'),
    region: str('region'),
    scope: str('scope'),
    areaText: str('areaText'),
    durationText: str('durationText'),
    amountText: str('amountText'),
    description: str('description'),
    published: raw.published === true || raw.published === 'true' || raw.published === 'on',
  };
  const errors: Partial<Record<keyof ProjectInput, string>> = {};
  const L = PROJECT_LIMITS;
  if (value.title.length > L.title) errors.title = `제목은 ${L.title}자 이내로 입력해 주세요.`;
  if (!value.usage) errors.usage = '업종/현장을 입력해 주세요.';
  else if (value.usage.length > L.usage) errors.usage = `업종/현장은 ${L.usage}자 이내로 입력해 주세요.`;
  if (!value.region) errors.region = '지역을 입력해 주세요.';
  else if (value.region.length > L.region) errors.region = `지역은 ${L.region}자 이내로 입력해 주세요.`;
  if (!value.scope) errors.scope = '작업 내용을 입력해 주세요.';
  else if (value.scope.length > L.scope) errors.scope = `작업 내용은 ${L.scope}자 이내로 입력해 주세요.`;
  if (value.areaText.length > L.areaText) errors.areaText = `면적은 ${L.areaText}자 이내로 입력해 주세요.`;
  if (value.durationText.length > L.durationText)
    errors.durationText = `작업 기간은 ${L.durationText}자 이내로 입력해 주세요.`;
  if (value.amountText.length > L.amountText)
    errors.amountText = `총 견적은 ${L.amountText}자 이내로 입력해 주세요.`;
  if (value.description.length > L.description)
    errors.description = `설명은 ${L.description}자 이내로 입력해 주세요.`;
  return { value, errors };
}

type PhotoRow = {
  id: string;
  storage_path: string;
  mime_type: string;
  byte_size: number;
  width: number | null;
  height: number | null;
  sort_order: number;
};

type ProjectRow = {
  id: string;
  created_at: string;
  updated_at: string;
  published: boolean;
  sort_order: number;
  title: string;
  usage: string;
  region: string;
  scope: string;
  area_text: string;
  duration_text: string;
  amount_text: string;
  description: string;
  project_photos: PhotoRow[] | null;
};

const SELECT = '*, project_photos(id, storage_path, mime_type, byte_size, width, height, sort_order)';

function publicUrl(storagePath: string): string {
  return getSupabase().storage.from(PROJECT_BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

function toRecord(row: ProjectRow): ProjectRecord {
  const photos = [...(row.project_photos ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id))
    .map((ph) => ({
      id: ph.id,
      url: publicUrl(ph.storage_path),
      mimeType: ph.mime_type,
      size: ph.byte_size,
      width: ph.width,
      height: ph.height,
    }));
  return {
    id: row.id,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
    published: row.published,
    sortOrder: row.sort_order,
    title: row.title,
    usage: row.usage,
    region: row.region,
    scope: row.scope,
    areaText: row.area_text,
    durationText: row.duration_text,
    amountText: row.amount_text,
    description: row.description,
    photos,
  };
}

/** 사례 목록 (최신순). 공개 페이지는 publishedOnly = true 로 부른다. */
export async function listProjects(opts: {
  publishedOnly: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ items: ProjectRecord[]; total: number }> {
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;
  let q = getSupabase()
    .from('projects')
    .select(SELECT, { count: 'exact' })
    .order('sort_order', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (opts.publishedOnly) q = q.eq('published', true);
  const { data, error, count } = await q;
  if (error) throw new Error(error.message);
  return { items: (data as ProjectRow[]).map(toRecord), total: count ?? 0 };
}

export async function getProject(id: string): Promise<ProjectRecord | null> {
  if (!isProjectId(id)) return null;
  const { data, error } = await getSupabase().from('projects').select(SELECT).eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toRecord(data as ProjectRow) : null;
}

/** 시공사례 테이블이 준비됐는지 확인 (관리자 화면 안내용) */
export async function checkProjectsTable(): Promise<{ ok: boolean; detail?: string }> {
  try {
    const { error } = await getSupabase().from('projects').select('id', { head: true, count: 'exact' });
    if (error) return { ok: false, detail: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : '알 수 없는 오류' };
  }
}

async function uploadPhotos(projectId: string, photos: PendingPhoto[], startOrder: number) {
  const sb = getSupabase();
  const uploaded: string[] = [];
  try {
    for (const ph of photos) {
      const ext = ph.mimeType === 'image/png' ? 'png' : ph.mimeType === 'image/webp' ? 'webp' : 'jpg';
      const path = `${projectId}/${ph.id}.${ext}`;
      const { error } = await sb.storage
        .from(PROJECT_BUCKET)
        .upload(path, ph.data, { contentType: ph.mimeType, upsert: false, cacheControl: '31536000' });
      if (error) throw new Error(`사진 업로드 실패: ${error.message}`);
      uploaded.push(path);
    }
    if (photos.length) {
      const { error } = await sb.from('project_photos').insert(
        photos.map((ph, i) => ({
          id: ph.id,
          project_id: projectId,
          storage_path: uploaded[i],
          mime_type: ph.mimeType,
          byte_size: ph.data.length,
          width: ph.width,
          height: ph.height,
          sort_order: startOrder + i,
        })),
      );
      if (error) throw new Error(`사진 정보 저장 실패: ${error.message}`);
    }
  } catch (err) {
    if (uploaded.length) await sb.storage.from(PROJECT_BUCKET).remove(uploaded).catch(() => {});
    throw err;
  }
}

/** 사례 등록 — 행 저장 → 사진 업로드·메타 저장. 실패하면 만든 것을 정리한다. */
export async function createProject(input: ProjectInput, photos: PendingPhoto[]): Promise<string> {
  const sb = getSupabase();
  const id = newProjectId();
  const { error } = await sb.from('projects').insert({
    id,
    published: input.published,
    title: input.title,
    usage: input.usage,
    region: input.region,
    scope: input.scope,
    area_text: input.areaText,
    duration_text: input.durationText,
    amount_text: input.amountText,
    description: input.description,
  });
  if (error) throw new Error(`사례 저장 실패: ${error.message}`);
  try {
    await uploadPhotos(id, photos, 0);
  } catch (err) {
    await sb.from('projects').delete().eq('id', id).then(() => undefined, () => {});
    throw err;
  }
  return id;
}

/** 사례 수정 — 본문 갱신, 선택한 사진 삭제, 새 사진 추가, 순서 반영. */
export async function updateProject(
  id: string,
  input: ProjectInput,
  newPhotos: PendingPhoto[],
  removePhotoIds: string[],
  photoOrder: string[],
): Promise<boolean> {
  if (!isProjectId(id)) return false;
  const sb = getSupabase();
  const current = await getProject(id);
  if (!current) return false;

  const { error } = await sb
    .from('projects')
    .update({
      published: input.published,
      title: input.title,
      usage: input.usage,
      region: input.region,
      scope: input.scope,
      area_text: input.areaText,
      duration_text: input.durationText,
      amount_text: input.amountText,
      description: input.description,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw new Error(`사례 수정 실패: ${error.message}`);

  // 사진 삭제
  const removable = removePhotoIds.filter((pid) => isPhotoId(pid) && current.photos.some((p) => p.id === pid));
  if (removable.length) {
    const { data: rows, error: qErr } = await sb
      .from('project_photos')
      .select('storage_path')
      .eq('project_id', id)
      .in('id', removable);
    if (qErr) throw new Error(qErr.message);
    const paths = (rows ?? []).map((r) => r.storage_path as string);
    if (paths.length) await sb.storage.from(PROJECT_BUCKET).remove(paths).catch(() => {});
    const { error: dErr } = await sb.from('project_photos').delete().eq('project_id', id).in('id', removable);
    if (dErr) throw new Error(dErr.message);
  }

  // 남은 사진 순서
  const remaining = current.photos.filter((p) => !removable.includes(p.id)).map((p) => p.id);
  const ordered = [...photoOrder.filter((pid) => remaining.includes(pid)), ...remaining.filter((pid) => !photoOrder.includes(pid))];
  for (let i = 0; i < ordered.length; i += 1) {
    await sb.from('project_photos').update({ sort_order: i }).eq('project_id', id).eq('id', ordered[i]);
  }

  // 새 사진
  await uploadPhotos(id, newPhotos, ordered.length);
  return true;
}

/** 사례 삭제 — 사진 파일을 지우고 행을 지운다(메타는 CASCADE). */
export async function deleteProject(id: string): Promise<boolean> {
  if (!isProjectId(id)) return false;
  const sb = getSupabase();
  const { data: rows, error } = await sb.from('project_photos').select('storage_path').eq('project_id', id);
  if (error) throw new Error(error.message);
  const paths = (rows ?? []).map((r) => r.storage_path as string);
  if (paths.length) {
    const { error: rmError } = await sb.storage.from(PROJECT_BUCKET).remove(paths);
    if (rmError) throw new Error(`사진 삭제 실패: ${rmError.message}`);
  }
  const { data: deleted, error: delError } = await sb.from('projects').delete().eq('id', id).select('id');
  if (delError) throw new Error(delError.message);
  return (deleted ?? []).length > 0;
}
