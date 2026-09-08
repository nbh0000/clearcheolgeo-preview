import { NextResponse } from 'next/server';
import { siteConfig } from '@/config/site';
import { inquiryTypeLabel } from '@/content/inquiry';
import { validateQuote, hasErrors, type QuoteInput, type FieldErrors } from '@/lib/validate';
import { checkRateLimit, clientIpFrom } from '@/lib/ratelimit';
import { isNotifyConfigured, notifyNewQuote } from '@/lib/notify';
import {
  appendEvent,
  appendQuote,
  hashIp,
  newQuoteId,
  removeQuoteUploads,
  saveAttachment,
  sniffImageType,
  type QuoteRecord,
  type StoredAttachment,
} from '@/lib/storage';

// 파일시스템 저장을 사용하므로 Node.js 런타임이 필요하다.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_TOTAL_BYTES = 60 * 1024 * 1024; // 요청 전체 상한 (첨부 5장 × 10MB + 여유)

function str(form: FormData, key: string, max = 5000): string {
  const value = form.get(key);
  return typeof value === 'string' ? value.slice(0, max).trim() : '';
}

function fail(
  status: number,
  message: string,
  fieldErrors?: FieldErrors,
): NextResponse {
  return NextResponse.json({ ok: false, message, fieldErrors }, { status });
}

export async function POST(request: Request) {
  // 0) 접수 기능이 꺼져 있으면 서버에서도 접수를 받지 않는다.
  if (!siteConfig.quote.enabled) {
    return fail(
      503,
      `현재 온라인 접수가 준비 중입니다. 대표 상담전화 ${siteConfig.phone.display}로 문의해 주세요.`,
    );
  }

  // 1) 요청 빈도 제한
  const ip = clientIpFrom(request.headers);
  const ipHash = hashIp(ip);
  const limit = checkRateLimit(ipHash);
  if (!limit.allowed) {
    return NextResponse.json(
      {
        ok: false,
        message: `문의가 너무 자주 접수되었습니다. 잠시 후 다시 시도하시거나 ${siteConfig.phone.display}로 전화해 주세요.`,
      },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } },
    );
  }

  const contentLength = Number(request.headers.get('content-length') ?? '0');
  if (contentLength > MAX_TOTAL_BYTES) {
    return fail(413, '첨부파일 용량이 너무 큽니다. 사진 수를 줄여 다시 시도해 주세요.');
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, '요청을 처리하지 못했습니다. 다시 시도해 주세요.');
  }

  // 2) 기본 스팸 방지 — 숨김 필드 + 최소 작성 시간
  if (str(form, 'website')) {
    return fail(400, '요청을 처리하지 못했습니다.');
  }
  const loadedAt = Number(str(form, 'formLoadedAt'));
  if (Number.isFinite(loadedAt) && loadedAt > 0 && Date.now() - loadedAt < 3000) {
    return fail(400, '입력 내용을 다시 확인한 뒤 접수해 주세요.');
  }

  // 3) 서버 측 입력 검증 (클라이언트 검증과 동일 규칙)
  const input: QuoteInput = {
    type: str(form, 'type', 40),
    name: str(form, 'name', 100),
    company: str(form, 'company', 100),
    phone: str(form, 'phone', 40),
    address: str(form, 'address', 300),
    addressDetail: str(form, 'addressDetail', 200),
    message: str(form, 'message', 4000),
    usage: str(form, 'usage', 100),
    area: str(form, 'area', 40),
    areaUnit: str(form, 'areaUnit', 10),
    preferredDate: str(form, 'preferredDate', 20),
    floor: str(form, 'floor', 60),
    elevator: str(form, 'elevator', 20),
    vehicleAccess: str(form, 'vehicleAccess', 20),
    consent: str(form, 'consent', 10) === 'true',
  };

  const fieldErrors = validateQuote(input);
  if (hasErrors(fieldErrors)) {
    // 동의하지 않은 문의는 서버에서도 저장하지 않는다.
    return fail(400, '입력하신 내용을 다시 확인해 주세요.', fieldErrors);
  }

  // 4) 첨부파일 검증 (개수 / 용량 / 실제 이미지 여부)
  const uploads = form.getAll('attachments').filter((f): f is File => f instanceof File && f.size > 0);
  if (uploads.length > siteConfig.quote.maxFiles) {
    return fail(400, `사진은 최대 ${siteConfig.quote.maxFiles}장까지 첨부할 수 있습니다.`);
  }

  const quoteId = newQuoteId();
  const attachments: StoredAttachment[] = [];

  try {
    for (const [index, file] of uploads.entries()) {
      if (file.size > siteConfig.quote.maxFileSizeMb * 1024 * 1024) {
        await removeQuoteUploads(quoteId);
        return fail(400, `파일당 최대 ${siteConfig.quote.maxFileSizeMb}MB까지 첨부할 수 있습니다.`);
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const sniffed = sniffImageType(buffer);
      if (!sniffed) {
        await removeQuoteUploads(quoteId);
        return fail(
          400,
          `${siteConfig.quote.acceptedImageLabel} 형식의 이미지 파일만 첨부할 수 있습니다.`,
        );
      }
      attachments.push(await saveAttachment(quoteId, index, file.name, sniffed, buffer));
    }
  } catch {
    await removeQuoteUploads(quoteId);
    return fail(500, '첨부파일을 저장하지 못했습니다. 사진 없이 접수하시거나 전화로 문의해 주세요.');
  }

  // 5) 저장 (여기까지 성공해야만 접수 완료로 응답한다)
  const now = new Date();
  const notifyConfigured = isNotifyConfigured();
  const record: QuoteRecord = {
    id: quoteId,
    receivedAt: now.toISOString(),
    type: input.type,
    typeLabel: inquiryTypeLabel(input.type),
    name: input.name,
    company: input.company,
    phone: input.phone,
    address: input.address,
    addressDetail: input.addressDetail,
    message: input.message,
    optional: {
      usage: input.usage,
      area: input.area,
      areaUnit: input.area ? input.areaUnit : '',
      preferredDate: input.preferredDate,
      floor: input.floor,
      elevator: input.elevator,
      vehicleAccess: input.vehicleAccess,
    },
    attachments,
    consent: {
      agreed: true,
      version: siteConfig.privacy.consentVersion,
      agreedAt: now.toISOString(),
    },
    meta: {
      ipHash,
      userAgent: (request.headers.get('user-agent') ?? '').slice(0, 200),
    },
    notification: notifyConfigured
      ? { channel: 'webhook', status: 'pending' }
      : { channel: 'none', status: 'not_configured' },
  };

  try {
    await appendQuote(record);
  } catch (err) {
    await removeQuoteUploads(quoteId);
    // 개인정보를 로그에 남기지 않는다 — 실패 사실과 접수번호만 기록한다.
    console.error(`[quote] 저장 실패 quoteId=${quoteId}`, err instanceof Error ? err.message : err);
    return fail(
      500,
      `접수를 저장하지 못했습니다. 죄송하지만 ${siteConfig.phone.display}로 전화해 주시면 바로 상담해 드리겠습니다.`,
    );
  }

  // 6) 관리자 알림 — 실패해도 접수는 유지된다. 결과는 이벤트 로그에 따로 남긴다.
  if (notifyConfigured) {
    const result = await notifyNewQuote({
      id: record.id,
      receivedAt: record.receivedAt,
      typeLabel: record.typeLabel,
      attachmentCount: attachments.length,
    });
    await appendEvent({ quoteId, at: new Date().toISOString(), notification: result }).catch(() => {
      /* 이벤트 로그 실패는 접수 결과에 영향을 주지 않는다 */
    });
    if (result.status === 'failed') {
      console.warn(`[quote] 알림 발송 실패 quoteId=${quoteId} detail=${result.detail ?? ''}`);
    }
  }

  return NextResponse.json({ ok: true, quoteId }, { status: 201 });
}

export async function GET() {
  // 접수 내용은 공개 API 로 조회할 수 없다.
  return NextResponse.json({ ok: false, message: 'Not found' }, { status: 404 });
}
