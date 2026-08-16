'use client';

import { flagUrl } from '@ejabi/shared';

export function Flag({ iso2, size = 22 }: { iso2?: string | null; size?: number }) {
  if (!iso2) return <span className="inline-block h-4 w-6 rounded bg-ink-3" />;
  return (
    <img
      src={flagUrl(iso2, size > 28 ? 80 : 40)}
      alt=""
      width={size}
      height={Math.round(size * 0.75)}
      className="inline-block rounded-sm object-cover shadow-sm"
    />
  );
}
