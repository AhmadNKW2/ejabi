'use client';

import { ApplicationChoiceDto, countryIsoFromLabelAr, flagUrl } from '@ejabi/shared';

function money(value: number | null) {
  return value == null ? '—' : `$${value.toLocaleString('en-US')}`;
}

function yearsLabel(n: number) {
  if (n === 1) return 'سنة';
  if (n === 2) return 'سنتان';
  return 'سنوات';
}

export function ApplicationChoiceTree({ choices }: { choices: ApplicationChoiceDto[] }) {
  const ranked = [...choices].sort((a, b) => a.preferenceOrder - b.preferenceOrder);

  if (ranked.length === 0) {
    return <p className="rounded-2xl bg-ink-3 px-4 py-10 text-center text-sm text-slate">لا توجد خيارات في هذا الطلب.</p>;
  }

  return (
    <div className="space-y-3">
      {ranked.map((choice) => {
        const iso = countryIsoFromLabelAr(choice.countryLabel);
        return (
          <article
            key={choice.id}
            className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-ink-3 p-4 max-[640px]:grid-cols-[auto_minmax(0,1fr)]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber font-cairo text-lg font-black text-ink">
              {choice.preferenceOrder}
            </div>
            <div className="min-w-0">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <h3 className="m-0 font-cairo text-base font-extrabold text-paper">{choice.universityLabel}</h3>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/50 px-2.5 py-1 text-[12px] text-paper">
                  {iso ? (
                    <img src={flagUrl(iso, 40)} alt="" className="h-[13px] w-[18px] rounded-sm object-cover" />
                  ) : null}
                  {choice.countryLabel}
                </span>
              </div>
              <p className="m-0 flex flex-wrap items-center gap-1.5 text-[13px] leading-[1.7] text-slate">
                <span>{choice.majorLabel}</span>
                <span className="opacity-40">·</span>
                <span>{choice.stageLabel}</span>
                <span className="opacity-40">·</span>
                <span>
                  {choice.years} {yearsLabel(choice.years)}
                </span>
              </p>
            </div>
            <div className="text-left max-[640px]:col-start-2">
              <div className="font-cairo text-lg font-black leading-none text-amber" dir="ltr">
                {money(choice.annualCostUsd)}
              </div>
              <div className="mt-1 text-[11px] text-slate">سنوياً</div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
