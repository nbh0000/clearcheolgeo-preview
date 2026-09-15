/**
 * 시공사례 등록/수정 요청(multipart) 파싱 — API 라우트가 공유한다.
 * 사진은 매직바이트로 형식을 확인하고, 개수·용량을 제한한다.
 */
import { sniffImageType } from './storage';
import { PROJECT_LIMITS, newPhotoId, validateProjectInput, type PendingPhoto, type ProjectInput } from './projects';

export type ParsedProjectRequest =
  | { ok: true; input: ProjectInput; photos: PendingPhoto[]; removePhotoIds: string[]; photoOrder: string[] }
  | { ok: false; status: number; message: string; errors?: Record<string, string> };

export async function parseProjectRequest(request: Request, existingPhotoCount = 0): Promise<ParsedProjectRequest> {
  let fd: FormData;
  try {
    fd = await request.formData();
  } catch {
    return { ok: false, status: 400, message: '요청을 처리하지 못했습니다. 다시 시도해 주세요.' };
  }

  const raw: Record<string, unknown> = {};
  for (const key of ['title', 'usage', 'region', 'scope', 'areaText', 'durationText', 'amountText', 'description', 'published']) {
    const v = fd.get(key);
    if (typeof v === 'string') raw[key] = v;
  }
  const { value, errors } = validateProjectInput(raw);
  if (Object.keys(errors).length) {
    return { ok: false, status: 400, message: '입력 내용을 다시 확인해 주세요.', errors };
  }

  const removePhotoIds = fd.getAll('removePhotoIds').filter((v): v is string => typeof v === 'string');
  const photoOrder = fd.getAll('photoOrder').filter((v): v is string => typeof v === 'string');

  const files = fd.getAll('photos').filter((v): v is File => v instanceof File && v.size > 0);
  const keep = Math.max(0, existingPhotoCount - removePhotoIds.length);
  if (keep + files.length > PROJECT_LIMITS.maxPhotos) {
    return { ok: false, status: 400, message: `사진은 최대 ${PROJECT_LIMITS.maxPhotos}장까지 등록할 수 있습니다.` };
  }

  const photos: PendingPhoto[] = [];
  for (const file of files) {
    if (file.size > PROJECT_LIMITS.maxPhotoBytes) {
      return { ok: false, status: 413, message: `사진 1장은 ${PROJECT_LIMITS.maxPhotoBytes / 1024 / 1024}MB 이하여야 합니다.` };
    }
    const data = Buffer.from(await file.arrayBuffer());
    const mimeType = sniffImageType(data);
    if (!mimeType) {
      return { ok: false, status: 400, message: 'JPG · PNG · WEBP 형식의 사진만 올릴 수 있습니다.' };
    }
    photos.push({ id: newPhotoId(), mimeType, data, width: null, height: null });
  }

  return { ok: true, input: value, photos, removePhotoIds, photoOrder };
}
