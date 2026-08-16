'use client';

export function SearchField({
  value,
  onChange,
  placeholder = 'بحث...',
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`relative block w-full min-w-[220px] ${className}`}>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16.5 20 20.5" strokeLinecap="round" />
        </svg>
      </span>
      <input
        className="w-full pr-10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
