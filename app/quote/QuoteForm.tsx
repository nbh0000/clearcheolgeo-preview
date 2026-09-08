'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { siteConfig } from '@/config/site';
import { INQUIRY_TYPES, isInquiryType } from '@/content/inquiry';
import {
  AREA_UNITS,
  ELEVATOR_OPTIONS,
  VEHICLE_OPTIONS,
  emptyQuoteInput,
  validateQuote,
  hasErrors,
  type FieldErrors,
  type QuoteInput,
} from '@/lib/validate';

type Attachment = { file: File; previewUrl: string; key: string };

type SubmitState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'error'; message: string }
  | { status: 'success'; quoteId: string };

const { maxFiles, maxFileSizeMb, acceptedImageTypes, acceptedImageLabel } = siteConfig.quote;

declare global {
  interface Window {
    daum?: { Postcode: new (opts: Record<string, unknown>) => { open: () => void } };
  }
}

export default function QuoteForm({ initialType }: { initialType?: string }) {
  const [values, setValues] = useState<QuoteInput>(() => ({
    ...emptyQuoteInput,
    type: initialType && isInquiryType(initialType) ? initialType : '',
  }));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [fileError, setFileError] = useState<string | null>(null);
  const [files, setFiles] = useState<Attachment[]>([]);
  const [state, setState] = useState<SubmitState>({ status: 'idle' });
  const [addressSearchNote, setAddressSearchNote] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const loadedAt = useMemo(() => Date.now(), []);
  const honeypotRef = useRef<HTMLInputElement>(null);

  // 미리보기 URL 정리
  useEffect(() => {
    return () => {
      files.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = <K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const focusFirstError = (errs: FieldErrors) => {
    const first = Object.keys(errs)[0];
    if (!first || !formRef.current) return;
    const el = formRef.current.querySelector<HTMLElement>(`[name="${first}"]`);
    el?.focus();
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  const addFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setFileError(null);
    const accepted: Attachment[] = [];
    const rejected: string[] = [];

    for (const file of Array.from(list)) {
      if (files.length + accepted.length >= maxFiles) {
        rejected.push(`${file.name} (최대 ${maxFiles}장까지 첨부할 수 있습니다)`);
        continue;
      }
      if (!(acceptedImageTypes as readonly string[]).includes(file.type)) {
        rejected.push(`${file.name} (${acceptedImageLabel} 형식만 첨부할 수 있습니다)`);
        continue;
      }
      if (file.size > maxFileSizeMb * 1024 * 1024) {
        rejected.push(`${file.name} (파일당 최대 ${maxFileSizeMb}MB)`);
        continue;
      }
      accepted.push({
        file,
        previewUrl: URL.createObjectURL(file),
        key: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      });
    }

    if (accepted.length) setFiles((prev) => [...prev, ...accepted]);
    if (rejected.length) setFileError(`첨부하지 못한 파일: ${rejected.join(' / ')}`);
  };

  const removeFile = (key: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.key === key);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.key !== key);
    });
  };

  /** 주소 검색(선택 기능). 외부 스크립트 로드에 실패해도 직접 입력이 가능하다. */
  const openAddressSearch = () => {
    setAddressSearchNote(null);

    const run = () => {
      if (!window.daum?.Postcode) {
        setAddressSearchNote('주소 검색을 열 수 없습니다. 주소를 직접 입력해 주세요.');
        return;
      }
      new window.daum.Postcode({
        oncomplete: (data: { roadAddress?: string; jibunAddress?: string }) => {
          const picked = data.roadAddress || data.jibunAddress || '';
          if (picked) set('address', picked);
        },
      }).open();
    };

    if (window.daum?.Postcode) {
      run();
      return;
    }

    const src = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      existing.addEventListener('load', run, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = run;
    script.onerror = () => {
      setAddressSearchNote('주소 검색 기능을 불러오지 못했습니다. 주소를 직접 입력해 주세요.');
    };
    document.head.appendChild(script);
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (state.status === 'submitting') return; // 중복 클릭 방지

    const nextErrors = validateQuote(values);
    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      setState({ status: 'idle' });
      focusFirstError(nextErrors);
      return;
    }

    setErrors({});
    setState({ status: 'submitting' });

    const fd = new FormData();
    (Object.keys(values) as (keyof QuoteInput)[]).forEach((key) => {
      const value = values[key];
      fd.append(key, typeof value === 'boolean' ? String(value) : value);
    });
    fd.append('formLoadedAt', String(loadedAt));
    fd.append('website', honeypotRef.current?.value ?? '');
    files.forEach((f) => fd.append('attachments', f.file, f.file.name));

    try {
      const res = await fetch('/api/quote', { method: 'POST', body: fd });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        quoteId?: string;
        message?: string;
        fieldErrors?: FieldErrors;
      };

      if (!res.ok || !data.ok) {
        if (data.fieldErrors && Object.keys(data.fieldErrors).length > 0) {
          setErrors(data.fieldErrors);
          focusFirstError(data.fieldErrors);
        }
        setState({
          status: 'error',
          message:
            data.message ??
            '접수 처리 중 문제가 발생했습니다. 잠시 후 다시 시도하시거나 전화로 문의해 주세요.',
        });
        return;
      }

      setState({ status: 'success', quoteId: data.quoteId ?? '' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      // 작성 중인 내용은 그대로 유지한다.
      setState({
        status: 'error',
        message:
          '네트워크 오류로 접수하지 못했습니다. 작성하신 내용은 그대로 있습니다. 다시 시도하거나 전화로 문의해 주세요.',
      });
    }
  };

  useEffect(() => {
    if (state.status === 'error' || state.status === 'success') statusRef.current?.focus();
  }, [state.status]);

  if (state.status === 'success') {
    return (
      <div className="card" role="status" tabIndex={-1} ref={statusRef}>
        <p className="eyebrow success-text">접수 완료</p>
        <h2 className="title-lg mt-sm">견적문의가 접수되었습니다.</h2>
        <p className="body-md mt-sm">
          남겨주신 연락처로 상담을 안내해 드리겠습니다.
          <br />
          급한 문의는{' '}
          <a className="num link-inline" href={siteConfig.phone.href}>
            {siteConfig.phone.display}
          </a>
          로 연락해 주세요.
        </p>
        {state.quoteId && (
          <p className="body-sm mt-base">
            접수번호 <strong className="num">{state.quoteId}</strong>
          </p>
        )}
        <div className="btn-row mt-lg">
          <Link className="btn btn-secondary" href="/">
            메인으로
          </Link>
          <a className="btn btn-primary" href={siteConfig.phone.href}>
            전화상담 <span className="num">{siteConfig.phone.display}</span>
          </a>
        </div>
      </div>
    );
  }

  const submitting = state.status === 'submitting';

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate>
      {state.status === 'error' && (
        <div
          className="notice mt-base"
          role="alert"
          tabIndex={-1}
          ref={statusRef}
          style={{ borderColor: 'var(--semantic-down)' }}
        >
          <p className="title-sm" style={{ color: 'var(--semantic-down)' }}>
            접수하지 못했습니다
          </p>
          <p className="mt-xs">{state.message}</p>
        </div>
      )}

      {/* 스팸 방지용 숨김 필드 (사람에게는 보이지 않는다) */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
        <label htmlFor="website">웹사이트</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" ref={honeypotRef} />
      </div>

      <fieldset>
        <legend className="title-md">기본 정보</legend>

        <div className="field mt-base">
          <label className="label" htmlFor="type">
            문의 유형<span className="req">*</span>
          </label>
          <select
            id="type"
            name="type"
            className="select"
            value={values.type}
            onChange={(e) => set('type', e.target.value)}
            aria-invalid={errors.type ? 'true' : undefined}
            aria-describedby={errors.type ? 'type-error' : undefined}
            required
          >
            <option value="">선택해 주세요</option>
            {INQUIRY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {errors.type && (
            <span className="error-text" id="type-error">
              {errors.type}
            </span>
          )}
        </div>

        <div className="field">
          <label className="label" htmlFor="name">
            이름 / 담당자명<span className="req">*</span>
          </label>
          <input
            id="name"
            name="name"
            className="input"
            type="text"
            autoComplete="name"
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            aria-invalid={errors.name ? 'true' : undefined}
            aria-describedby={errors.name ? 'name-error' : undefined}
            required
          />
          {errors.name && (
            <span className="error-text" id="name-error">
              {errors.name}
            </span>
          )}
        </div>

        <div className="field">
          <label className="label" htmlFor="company">
            상호명
          </label>
          <input
            id="company"
            name="company"
            className="input"
            type="text"
            autoComplete="organization"
            value={values.company}
            onChange={(e) => set('company', e.target.value)}
            aria-describedby="company-help"
          />
          <span className="help" id="company-help">
            개인 고객은 입력하지 않으셔도 됩니다.
          </span>
          {errors.company && <span className="error-text">{errors.company}</span>}
        </div>

        <div className="field">
          <label className="label" htmlFor="phone">
            연락처<span className="req">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            className="input"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="010-1234-5678 또는 02-123-4567"
            value={values.phone}
            onChange={(e) => set('phone', e.target.value)}
            aria-invalid={errors.phone ? 'true' : undefined}
            aria-describedby={errors.phone ? 'phone-error' : 'phone-help'}
            required
          />
          {errors.phone ? (
            <span className="error-text" id="phone-error">
              {errors.phone}
            </span>
          ) : (
            <span className="help" id="phone-help">
              휴대전화와 일반 전화번호 모두 입력하실 수 있습니다.
            </span>
          )}
        </div>

        <div className="field">
          <label className="label" htmlFor="address">
            현장 주소<span className="req">*</span>
          </label>
          <div style={{ display: 'flex', gap: 'var(--s-xs)', flexWrap: 'wrap' }}>
            <input
              id="address"
              name="address"
              className="input"
              type="text"
              autoComplete="street-address"
              style={{ flex: '1 1 240px' }}
              value={values.address}
              onChange={(e) => set('address', e.target.value)}
              aria-invalid={errors.address ? 'true' : undefined}
              aria-describedby={errors.address ? 'address-error' : 'address-help'}
              required
            />
            <button type="button" className="btn btn-secondary" onClick={openAddressSearch}>
              주소 검색
            </button>
          </div>
          {errors.address ? (
            <span className="error-text" id="address-error">
              {errors.address}
            </span>
          ) : (
            <span className="help" id="address-help">
              철거 또는 폐기물처리가 필요한 현장의 주소를 입력해 주세요. 직접 입력도 가능합니다.
            </span>
          )}
          {addressSearchNote && <span className="error-text">{addressSearchNote}</span>}
        </div>

        <div className="field">
          <label className="label" htmlFor="addressDetail">
            상세 주소 · 층수 · 호실
          </label>
          <input
            id="addressDetail"
            name="addressDetail"
            className="input"
            type="text"
            value={values.addressDetail}
            onChange={(e) => set('addressDetail', e.target.value)}
          />
          {errors.addressDetail && <span className="error-text">{errors.addressDetail}</span>}
        </div>

        <div className="field">
          <label className="label" htmlFor="message">
            문의사항<span className="req">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            className="textarea"
            value={values.message}
            onChange={(e) => set('message', e.target.value)}
            aria-invalid={errors.message ? 'true' : undefined}
            aria-describedby={errors.message ? 'message-error' : 'message-help'}
            required
          />
          {errors.message ? (
            <span className="error-text" id="message-error">
              {errors.message}
            </span>
          ) : (
            <span className="help" id="message-help">
              철거할 공간, 처리할 폐기물의 종류와 대략적인 양, 희망 일정 등 알고 계신 내용을 적어
              주세요.
            </span>
          )}
        </div>
      </fieldset>

      {/* 추가 정보 (선택) */}
      <details className="disclosure mt-lg">
        <summary>추가 정보 입력 (선택)</summary>
        <div className="disclosure-body">
          <p className="caption">
            아래 항목은 선택 사항입니다. 알고 계신 내용만 적어 주셔도 상담에 도움이 됩니다.
          </p>

          <div className="field mt-base">
            <label className="label" htmlFor="usage">
              현장 업종 또는 용도
            </label>
            <input
              id="usage"
              name="usage"
              className="input"
              type="text"
              placeholder="예: 카페, 사무실, 창고"
              value={values.usage}
              onChange={(e) => set('usage', e.target.value)}
            />
            {errors.usage && <span className="error-text">{errors.usage}</span>}
          </div>

          <div className="field">
            <label className="label" htmlFor="area">
              대략적인 면적
            </label>
            <div style={{ display: 'flex', gap: 'var(--s-xs)' }}>
              <input
                id="area"
                name="area"
                className="input"
                type="text"
                inputMode="decimal"
                placeholder="예: 30"
                style={{ flex: '1 1 auto' }}
                value={values.area}
                onChange={(e) => set('area', e.target.value)}
              />
              <select
                className="select"
                name="areaUnit"
                aria-label="면적 단위"
                style={{ width: '110px', flex: 'none' }}
                value={values.areaUnit}
                onChange={(e) => set('areaUnit', e.target.value)}
              >
                {AREA_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            {errors.area && <span className="error-text">{errors.area}</span>}
          </div>

          <div className="field">
            <label className="label" htmlFor="preferredDate">
              희망 작업일
            </label>
            <input
              id="preferredDate"
              name="preferredDate"
              className="input"
              type="date"
              value={values.preferredDate}
              onChange={(e) => set('preferredDate', e.target.value)}
            />
            {errors.preferredDate && <span className="error-text">{errors.preferredDate}</span>}
          </div>

          <div className="field">
            <label className="label" htmlFor="floor">
              층수
            </label>
            <input
              id="floor"
              name="floor"
              className="input"
              type="text"
              placeholder="예: 지상 2층"
              value={values.floor}
              onChange={(e) => set('floor', e.target.value)}
            />
            {errors.floor && <span className="error-text">{errors.floor}</span>}
          </div>

          <div className="field">
            <label className="label" htmlFor="elevator">
              엘리베이터 여부
            </label>
            <select
              id="elevator"
              name="elevator"
              className="select"
              value={values.elevator}
              onChange={(e) => set('elevator', e.target.value)}
            >
              {ELEVATOR_OPTIONS.map((o) => (
                <option key={o || 'none'} value={o}>
                  {o || '선택 안 함'}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label" htmlFor="vehicleAccess">
              차량 접근 가능 여부
            </label>
            <select
              id="vehicleAccess"
              name="vehicleAccess"
              className="select"
              value={values.vehicleAccess}
              onChange={(e) => set('vehicleAccess', e.target.value)}
            >
              {VEHICLE_OPTIONS.map((o) => (
                <option key={o || 'none'} value={o}>
                  {o || '선택 안 함'}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="label" htmlFor="attachments">
              현장 사진
            </label>
            <input
              id="attachments"
              className="input"
              type="file"
              accept={acceptedImageTypes.join(',')}
              multiple
              style={{ paddingTop: '10px' }}
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = '';
              }}
              aria-describedby="attachments-help"
            />
            <span className="help" id="attachments-help">
              {acceptedImageLabel} 형식 · 최대 {maxFiles}장 · 파일당 최대 {maxFileSizeMb}MB. 첨부한
              사진은 상담 목적으로만 사용하며 공개되지 않습니다.
            </span>
            {fileError && <span className="error-text">{fileError}</span>}

            {files.length > 0 && (
              <ul className="file-list">
                {files.map((f) => (
                  <li className="file-item" key={f.key}>
                    {/* 사용자가 방금 선택한 로컬 이미지 미리보기 */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.previewUrl} alt={`첨부 이미지 미리보기: ${f.file.name}`} />
                    <button
                      type="button"
                      className="fi-remove"
                      onClick={() => removeFile(f.key)}
                      aria-label={`${f.file.name} 첨부 삭제`}
                    >
                      ✕
                    </button>
                    <span className="fi-name">{f.file.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </details>

      {/* 개인정보 수집·이용 동의 */}
      <div className="card card-soft mt-lg">
        <h3 className="title-md">개인정보 수집·이용 동의 (필수)</h3>
        <div className="body-sm mt-sm stack">
          <p>
            <strong>수집·이용 목적</strong> · 철거/폐기물처리 견적 상담, 문의 답변 및 상담 이력 관리
          </p>
          <p>
            <strong>필수 수집 항목</strong> · {siteConfig.privacy.requiredItems}
          </p>
          <p>
            <strong>선택 수집 항목</strong> · {siteConfig.privacy.optionalItems}
          </p>
          <p>
            <strong>보유 및 이용 기간</strong> · {siteConfig.privacy.retentionPeriod}
          </p>
          <p>
            동의를 거부하실 수 있으며, 거부하시는 경우 온라인 견적문의 접수가 제한됩니다. 이때에도
            대표 상담전화{' '}
            <a className="num link-inline" href={siteConfig.phone.href}>
              {siteConfig.phone.display}
            </a>
            로 상담하실 수 있습니다.
          </p>
          <p>
            <Link className="link-inline" href="/privacy" target="_blank">
              개인정보처리방침 보기
            </Link>
          </p>
        </div>

        <div className="checkbox-row mt-base">
          <input
            id="consent"
            name="consent"
            type="checkbox"
            checked={values.consent}
            onChange={(e) => set('consent', e.target.checked)}
            aria-invalid={errors.consent ? 'true' : undefined}
            aria-describedby={errors.consent ? 'consent-error' : undefined}
          />
          <label htmlFor="consent" className="body-sm" style={{ color: 'var(--ink)' }}>
            위 내용을 확인하였으며, 개인정보 수집·이용에 동의합니다. (필수)
          </label>
        </div>
        {errors.consent && (
          <span className="error-text" id="consent-error">
            {errors.consent}
          </span>
        )}
      </div>

      <div className="mt-lg">
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
          {submitting ? '접수 중입니다…' : '견적문의 접수하기'}
        </button>
        <p className="caption mt-sm text-center" aria-live="polite">
          {submitting
            ? '전송 중입니다. 창을 닫지 말고 잠시만 기다려 주세요.'
            : '접수 내용은 담당자만 확인하며, 공개 게시판에 노출되지 않습니다.'}
        </p>
      </div>
    </form>
  );
}
