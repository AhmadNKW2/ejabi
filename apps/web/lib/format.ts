export function formatUsd(value: number | null) {
  if (value == null) return 'تُحدد لاحقًا';
  return '$' + value.toLocaleString('en-US');
}

export function majorLabel(item: { major: { isCustom: boolean; labelAr: string }; customMajorLabel: string | null }) {
  return item.major.isCustom ? item.customMajorLabel || item.major.labelAr : item.major.labelAr;
}
