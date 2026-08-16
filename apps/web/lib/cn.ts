export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

export const inputClass =
  'w-full rounded-xl border border-amber-dim bg-ink-3 px-[15px] py-2.5 font-tajawal text-sm text-paper outline-none placeholder:text-slate focus:border-amber disabled:opacity-70';

export const labelClass = 'mb-1.5 block text-[13px] text-slate';

export const btnPrimary =
  'cursor-pointer rounded-[9px] border border-transparent bg-amber px-[22px] py-3 font-cairo text-[14.5px] font-bold text-ink transition duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35';

export const btnGhost =
  'cursor-pointer rounded-[9px] border-0 bg-ink-3 px-[22px] py-3 font-cairo text-[14.5px] font-bold text-paper transition duration-150 hover:bg-white/[0.08] active:scale-[0.97]';
