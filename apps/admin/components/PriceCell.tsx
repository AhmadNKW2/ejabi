'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';

export function money(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return '—';
  return `$${value.toLocaleString('en-US')}`;
}

export function PriceCell({
  cost,
  offered,
  busy,
  onSave,
  onRemove,
}: {
  cost: number | null | undefined;
  offered: boolean;
  busy?: boolean;
  onSave: (value: number) => Promise<void>;
  onRemove?: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const skipBlur = useRef(false);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  async function commit(e?: FormEvent) {
    e?.preventDefault();
    if (!draft.trim()) {
      setEditing(false);
      setError(false);
      return;
    }
    const n = Number(draft);
    if (Number.isNaN(n) || n < 0) {
      setError(true);
      return;
    }
    if (offered && cost != null && n === cost) {
      setEditing(false);
      return;
    }
    setError(false);
    await onSave(n);
    setEditing(false);
  }

  if (editing) {
    return (
      <form onSubmit={commit} className="flex items-center justify-center">
        <input
          ref={inputRef}
          type="number"
          inputMode="decimal"
          min={0}
          placeholder="0"
          className={`h-11 w-[8rem] text-center ${error ? 'border-danger' : ''}`}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setError(false);
          }}
          onBlur={() => {
            if (skipBlur.current) {
              skipBlur.current = false;
              return;
            }
            commit();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              skipBlur.current = true;
              setEditing(false);
              setError(false);
            }
          }}
        />
      </form>
    );
  }

  if (cost != null) {
    return (
      <div className="inline-flex items-center overflow-hidden rounded-xl bg-amber/10">
        {onRemove ? (
          <button
            type="button"
            disabled={busy}
            className="flex h-11 w-10 shrink-0 items-center justify-center bg-danger text-lg font-bold leading-none text-paper hover:bg-[#b85a42] disabled:opacity-50"
            title="إيقاف هذه المرحلة"
            aria-label="إيقاف هذه المرحلة"
            onClick={() => onRemove()}
          >
            ×
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setDraft(String(cost));
            setEditing(true);
          }}
          className="min-h-11 min-w-[7rem] px-3 py-2 font-cairo text-sm font-black text-amber hover:bg-amber/15"
        >
          {money(cost)}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        setDraft('');
        setEditing(true);
      }}
      className="min-h-11 min-w-[8rem] rounded-xl border-0 bg-ink-3/60 px-3 py-2 font-cairo text-sm font-black text-slate hover:bg-ink-3 hover:text-amber"
    >
      تفعيل
    </button>
  );
}
