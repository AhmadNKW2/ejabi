'use client';

import { SelectOption } from './Select';

export function MultiSelect({
  values,
  onChange,
  options,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  options: SelectOption[];
}) {
  function toggle(id: string) {
    onChange(values.includes(id) ? values.filter((x) => x !== id) : [...values, id]);
  }

  return (
    <div className="max-h-52 overflow-auto rounded-[10px] bg-ink-3 p-2">
      {options.length === 0 ? <p className="p-2 text-sm text-slate">لا توجد تخصصات</p> : null}
      {options.map((o) => {
        const checked = values.includes(o.value);
        return (
          <label
            key={o.value}
            className="mb-1 flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 hover:bg-ink-2"
          >
            <input
              type="checkbox"
              className="h-4 w-4 accent-amber"
              checked={checked}
              onChange={() => toggle(o.value)}
            />
            {o.icon}
            <span className="flex-1 text-sm">{o.label}</span>
          </label>
        );
      })}
    </div>
  );
}
