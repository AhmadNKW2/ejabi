'use client';

import {
  ApplicationChoiceDto,
  countryIsoFromLabelAr,
  flagUrl,
  groupApplicationChoices,
} from '@ejabi/shared';

function money(value: number | null) {
  return value == null ? 'تُحدد لاحقًا' : `$${value.toLocaleString('en-US')}`;
}

export function ApplicationChoiceTree({ choices }: { choices: ApplicationChoiceDto[] }) {
  const universities = groupApplicationChoices(choices);

  return (
    <div className="space-y-3">
      {universities.map((uni) => {
        const iso = countryIsoFromLabelAr(uni.countryLabel);
        return (
          <section key={`${uni.universityLabel}-${uni.countryLabel}`} className="rounded-2xl bg-ink-3 p-4">
            <header className="mb-3 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-xl">🏫</span>
              <div>
                <h3 className="font-cairo text-lg font-extrabold text-paper">{uni.universityLabel}</h3>
                <p className="mt-0.5 flex items-center gap-2 text-sm text-slate">
                  {iso ? <img src={flagUrl(iso, 40)} alt="" className="h-[13px] w-[18px] rounded-sm object-cover" /> : null}
                  {uni.countryLabel}
                </p>
              </div>
            </header>

            <div className="space-y-3 border-r border-dashed border-amber/30 pr-4 mr-2">
              {uni.majors.map((major) => (
                <div key={`${major.majorLabel}-${major.fieldLabel}`}>
                  <div className="mb-2">
                    <div className="font-bold text-paper">{major.majorLabel}</div>
                    <div className="text-xs text-slate">{major.fieldLabel}</div>
                  </div>
                  <div className="space-y-2">
                    {major.stages.map((stage) => (
                      <div
                        key={stage.id}
                        className="flex flex-wrap items-center gap-3 rounded-xl bg-ink-2 px-3 py-2.5"
                      >
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber font-cairo text-sm font-black text-ink">
                          {stage.preferenceOrder}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold">{stage.stageLabel}</div>
                          <div className="text-xs text-slate">{stage.years} سنوات</div>
                        </div>
                        <div className="text-left">
                          <div className="font-cairo text-base font-black text-amber" dir="ltr">
                            {money(stage.totalCostUsd)}
                          </div>
                          <div className="text-xs text-slate">سعر المرحلة</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
