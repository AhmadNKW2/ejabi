'use client';

export function NumberInput({
  value,
  onChange,
  min,
  step,
  required,
  className,
}: {
  value: string | number;
  onChange: (v: string) => void;
  min?: number;
  step?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      className={`[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${className || ''}`}
      min={min}
      step={step}
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
