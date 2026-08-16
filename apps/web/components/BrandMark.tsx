import type { HTMLAttributes } from 'react';

type BrandMarkProps = {
  size?: number;
  alt?: string;
  className?: string;
} & HTMLAttributes<HTMLSpanElement>;

export function BrandMark({ size, alt = 'إيجابي للخدمات الجامعية', className = '', ...rest }: BrandMarkProps) {
  return (
    <span
      className={['inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-cream shadow-mark [&>img]:block [&>img]:h-[108%] [&>img]:w-[108%] [&>img]:object-cover [&>img]:object-center', className]
        .filter(Boolean)
        .join(' ')}
      style={size ? { width: size, height: size } : undefined}
      {...rest}
    >
      <img src="/logo.jpg" alt={alt} width={size || 128} height={size || 128} />
    </span>
  );
}
