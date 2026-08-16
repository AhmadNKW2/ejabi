'use client';

import {
  ApplicationChoiceDto,
  countryIsoFromLabelAr,
  flagUrl,
  groupApplicationChoices,
} from '@ejabi/shared';
import { formatUsd } from '@/lib/format';
import { School } from 'lucide-react';

export function ApplicationChoiceTree({ choices }: { choices: ApplicationChoiceDto[] }) {
  const universities = groupApplicationChoices(choices);

  return (
    <div className="grid gap-3 p-3.5">
      {universities.map((uni) => {
        const iso = countryIsoFromLabelAr(uni.countryLabel);
        return (
          <section key={`${uni.universityLabel}-${uni.countryLabel}`} className="rounded-2xl bg-ink-3 p-3.5">
            <header className="mb-3 flex items-center gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 text-amber" aria-hidden>
                <School size={22} strokeWidth={1.7} />
              </span>
              <div>
                <h3 className="m-0 font-cairo text-[17px] font-extrabold leading-[1.35] text-paper">{uni.universityLabel}</h3>
                <p className="mt-1 flex items-center gap-1.5 text-[13px] text-slate">
                  {iso ? <img className="h-[13px] w-[18px] rounded-sm object-cover" src={flagUrl(iso, 40)} alt="" /> : null}
                  {uni.countryLabel}
                </p>
              </div>
            </header>

            {uni.majors.map((major) => (
              <div key={`${major.majorLabel}-${major.fieldLabel}`} className="mr-2 mt-2.5 border-r border-dashed border-amber/35 py-0.5 pr-3.5 first:mt-0">
                <div className="mb-2 flex flex-col gap-0.5">
                  <strong className="font-cairo text-[15px] text-paper">{major.majorLabel}</strong>
                  <span className="text-[12.5px] text-slate">{major.fieldLabel}</span>
                </div>
                {major.stages.map((stage) => (
                  <div
                    key={stage.id}
                    className="mb-2 grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl bg-ink/45 px-3 py-2.5 max-[720px]:grid-cols-[auto_1fr] max-[720px]:[&>:last-child]:col-start-2 max-[720px]:[&>:last-child]:text-right"
                  >
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] bg-amber font-cairo text-sm font-black text-ink"
                      title={`الترتيب ${stage.preferenceOrder}`}
                    >
                      {stage.preferenceOrder}
                    </span>
                    <div>
                      <strong className="block text-sm text-paper">{stage.stageLabel}</strong>
                      <span className="text-[12.5px] text-slate">{stage.years} سنوات</span>
                    </div>
                    <div className="text-left">
                      <div className="font-cairo text-base font-black text-amber" dir="ltr">
                        {formatUsd(stage.totalCostUsd)}
                      </div>
                      <div className="mt-0.5 text-xs text-slate">سعر المرحلة</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
