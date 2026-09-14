'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/** 관리자 화면의 접수 삭제 버튼 — 확인 후 삭제하고 목록을 새로 고친다. */
export default function DeleteQuoteButton({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (!window.confirm(`접수 ${quoteId} 을(를) 삭제할까요?\n첨부 사진도 함께 삭제되며 되돌릴 수 없습니다.`)) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/quote/${quoteId}`, { method: 'DELETE' });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string };
      if (!res.ok || !body.ok) {
        window.alert(body.message ?? '삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.');
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className="btn btn-outline btn-delete"
      onClick={onClick}
      disabled={busy}
      aria-disabled={busy}
    >
      {busy ? '삭제 중…' : '삭제'}
    </button>
  );
}
