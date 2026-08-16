'use client';

import { mediaSrc } from '@/lib/api';

export function UniversityLogo({
  src,
  size = 48,
  className = '',
}: {
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const resolved = mediaSrc(src);
  const style = { width: size, height: size };
  if (resolved) {
    return (
      <img
        src={resolved}
        alt=""
        style={style}
        className={`shrink-0 rounded-2xl bg-ink-3 object-cover ${className}`}
      />
    );
  }
  return (
    <span
      style={style}
      className={`inline-flex shrink-0 items-center justify-center rounded-2xl bg-ink-3 text-lg ${className}`}
    >
      🏫
    </span>
  );
}
