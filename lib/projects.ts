/**
 * 시공사례 저장·조회 (Supabase Storage)
 * ------------------------------------------------------------
 * 별도 테이블 없이 공개 Storage 버킷(project-photos) 하나만 쓴다.
 *  - 사진: <사례ID>/<사진ID>.jpg 로 저장하고 공개 URL 로 표시한다.
 *  - 목록·본문: _index/projects.json 한 파일에 모두 담는다. (관리자 1명이 고치는 규모라 충분하다)
 *  - 버킷이 없으면 처음 쓸 때 자동으로 만든다. → SQL 실행 등 별도 준비가 필요 없다.
 *
 * 등록·수정·삭제는 관리자 인증(middleware.ts)을 통과한 API 에서만 호출한다.
 * 공개 페이지는 published = true 인 사례만 읽는다.
 */
import crypto from 'node:crypto';
import { getSupabase } from './db';

/** 시공사례 버킷 (공개) */
export const PROJECT_BUCKET = 'project-photos';
const INDEX_PATH = '_index/projects.json';

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
  /** 화면 확인용 예시 데이터 여부 (content/sampleProjects.ts) */
  isSample?: boolean;
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

/** 인덱스 파일에 저장되는 형태 (URL 은 저장하지 않고 경로만 둔다) */
type StoredPhoto = {
  id: string;
  path: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
};
type StoredProject = Omit<ProjectRecord, 'photos' | 'isSample'> & { photos: StoredPhoto[] };

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

// ------------------------------------------------------------
// 저장소 (버킷 + 인덱스 파일)
// ------------------------------------------------------------

/** 버킷이 없으면 만든다. 이미 있으면 그대로 둔다. */
export async function ensureProjectBucket(): Promise<void> {
  const sb = getSupabase();
  const { data } = await sb.storage.getBucket(PROJECT_BUCKET);
  if (data) return;
  const { error } = await sb.storage.createBucket(PROJECT_BUCKET, {
    public: true,
    fileSizeLimit: PROJECT_LIMITS.maxPhotoBytes,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/json'],
  });
  // 동시에 두 번 만들려다 이미 생긴 경우는 무시한다.
  if (error && !/already exists/i.test(error.message)) {
    throw new Error(`시공사례 저장소를 만들지 못했습니다: ${error.message}`);
  }
}

function publicUrl(storagePath: string): string {
  return getSupabase().storage.from(PROJECT_BUCKET).getPublicUrl(storagePath).data.publicUrl;
}

async function readIndex(): Promise<StoredProject[]> {
  const sb = getSupabase();
  const { data, error } = await sb.storage.from(PROJECT_BUCKET).download(INDEX_PATH);
  if (error || !data) {
    // 아직 사례를 하나도 등록하지 않았거나 버킷이 없는 상태
    const msg = error?.message ?? '';
    if (/not found|does not exist|Bucket not found|Object not found/i.test(msg) || !error) return [];
    throw new Error(`시공사례 목록을 읽지 못했습니다: ${msg}`);
  }
  try {
    const parsed = JSON.parse(await data.text()) as { projects?: StoredProject[] };
    return Array.isArray(parsed.projects) ? parsed.projects : [];
  } catch {
    throw new Error('시공사례 목록 파일이 손상되었습니다.');
  }
}

async function writeIndex(projects: StoredProject[]): Promise<void> {
  const sb = getSupabase();
  const body = JSON.stringify({ version: 1, updatedAt: new Date().toISOString(), projects }, null, 2);
  const { error } = await sb.storage
    .from(PROJECT_BUCKET)
    .upload(INDEX_PATH, Buffer.from(body, 'utf8'), { contentType: 'application/json', upsert: true, cacheControl: '0' });
  if (error) throw new Error(`시공사례 목록을 저장하지 못했습니다: ${error.message}`);
}

function toRecord(p: StoredProject): ProjectRecord {
  return {
    ...p,
    photos: p.photos.map((ph) => ({
      id: ph.id,
      url: publicUrl(ph.path),
      mimeType: ph.mimeType,
      size: ph.size,
      width: ph.width,
      height: ph.height,
    })),
  };
}

function sortProjects(list: StoredProject[]): StoredProject[] {
  return [...list].sort((a, b) => b.sortOrder - a.sortOrder || b.createdAt.localeCompare(a.createdAt));
}

/** 사례 목록 (최신순). 공개 페이지는 publishedOnly = true 로 부른다. */
export async function listProjects(opts: {
  publishedOnly: boolean;
  limit?: number;
  offset?: number;
}): Promise<{ items: ProjectRecord[]; total: number }> {
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;
  let all = sortProjects(await readIndex());
  if (opts.publishedOnly) all = all.filter((p) => p.published);
  return { items: all.slice(offset, offset + limit).map(toRecord), total: all.length };
}

export async function getProject(id: string): Promise<ProjectRecord | null> {
  if (!isProjectId(id)) return null;
  const found = (await readIndex()).find((p) => p.id === id);
  return found ? toRecord(found) : null;
}

/** 저장소가 준비됐는지 확인 (관리자 화면 안내용). 없으면 만들어 본다. */
export async function checkProjectsTable(): Promise<{ ok: boolean; detail?: string }> {
  try {
    await ensureProjectBucket();
    await readIndex();
    return { ok: true };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : '알 수 없는 오류' };
  }
}

async function uploadPhotos(projectId: string, photos: PendingPhoto[]): Promise<StoredPhoto[]> {
  const sb = getSupabase();
  const stored: StoredPhoto[] = [];
  try {
    for (const ph of photos) {
      const ext = ph.mimeType === 'image/png' ? 'png' : ph.mimeType === 'image/webp' ? 'webp' : 'jpg';
      const path = `${projectId}/${ph.id}.${ext}`;
      const { error } = await sb.storage
        .from(PROJECT_BUCKET)
        .upload(path, ph.data, { contentType: ph.mimeType, upsert: false, cacheControl: '31536000' });
      if (error) throw new Error(`사진 업로드 실패: ${error.message}`);
      stored.push({ id: ph.id, path, mimeType: ph.mimeType, size: ph.data.length, width: ph.width, height: ph.height });
    }
    return stored;
  } catch (err) {
    if (stored.length) await sb.storage.from(PROJECT_BUCKET).remove(stored.map((s) => s.path)).catch(() => {});
    throw err;
  }
}

/** 사례 등록 — 버킷 준비 → 사진 업로드 → 인덱스에 추가. 실패하면 올린 사진을 정리한다. */
export async function createProject(input: ProjectInput, photos: PendingPhoto[]): Promise<string> {
  await ensureProjectBucket();
  const id = newProjectId();
  const now = new Date().toISOString();
  const stored = await uploadPhotos(id, photos);
  try {
    const list = await readIndex();
    list.push({
      id,
      createdAt: now,
      updatedAt: now,
      published: input.published,
      sortOrder: 0,
      title: input.title,
      usage: input.usage,
      region: input.region,
      scope: input.scope,
      areaText: input.areaText,
      durationText: input.durationText,
      amountText: input.amountText,
      description: input.description,
      photos: stored,
    });
    await writeIndex(list);
  } catch (err) {
    if (stored.length) await getSupabase().storage.from(PROJECT_BUCKET).remove(stored.map((s) => s.path)).catch(() => {});
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
  await ensureProjectBucket();
  const list = await readIndex();
  const idx = list.findIndex((p) => p.id === id);
  if (idx < 0) return false;
  const current = list[idx];

  const removable = removePhotoIds.filter((pid) => isPhotoId(pid) && current.photos.some((p) => p.id === pid));
  const remaining = current.photos.filter((p) => !removable.includes(p.id));
  const ordered = [
    ...photoOrder.map((pid) => remaining.find((p) => p.id === pid)).filter((p): p is StoredPhoto => Boolean(p)),
    ...remaining.filter((p) => !photoOrder.includes(p.id)),
  ];
  const added = await uploadPhotos(id, newPhotos);

  list[idx] = {
    ...current,
    published: input.published,
    title: input.title,
    usage: input.usage,
    region: input.region,
    scope: input.scope,
    areaText: input.areaText,
    durationText: input.durationText,
    amountText: input.amountText,
    description: input.description,
    updatedAt: new Date().toISOString(),
    photos: [...ordered, ...added],
  };
  await writeIndex(list);

  // 인덱스 저장이 끝난 뒤에 삭제할 사진 파일을 지운다 (실패해도 목록에는 영향 없음).
  const removePaths = current.photos.filter((p) => removable.includes(p.id)).map((p) => p.path);
  if (removePaths.length) await getSupabase().storage.from(PROJECT_BUCKET).remove(removePaths).catch(() => {});
  return true;
}

/** 사례 삭제 — 인덱스에서 빼고 사진 파일을 지운다. */
export async function deleteProject(id: string): Promise<boolean> {
  if (!isProjectId(id)) return false;
  const list = await readIndex();
  const idx = list.findIndex((p) => p.id === id);
  if (idx < 0) return false;
  const [removed] = list.splice(idx, 1);
  await writeIndex(list);
  const paths = removed.photos.map((p) => p.path);
  if (paths.length) await getSupabase().storage.from(PROJECT_BUCKET).remove(paths).catch(() => {});
  return true;
}
