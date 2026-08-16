'use client';

import { mediaSrc } from '@/lib/api';
import { useOptionalSiteSettings } from '@/lib/settings';
import { School } from 'lucide-react';

export function UniversityLogo({
  src,
  size = 48,
  className = '',
}: {
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const hideCatalogImages = useOptionalSiteSettings()?.hideCatalogImages;
  if (hideCatalogImages) return null;
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
      className={`inline-flex shrink-0 items-center justify-center rounded-2xl bg-ink-3 text-amber ${className}`}
    >
      <School size={Math.max(16, Math.round(size * 0.45))} strokeWidth={1.7} />
    </span>
  );
}
