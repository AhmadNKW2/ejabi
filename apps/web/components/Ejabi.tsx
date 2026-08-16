'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  CalendarDays,
  Check,
  CircleDollarSign,
  Globe,
  GraduationCap,
  LayoutGrid,
  School,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import {
  CatalogCountry,
  CatalogField,
  CatalogMajor,
  CatalogResponse,
  CatalogStage,
  CatalogUniversity,
  CompareItemDto,
  QuoteRequest,
  QuoteResponse,
  flagUrl,
} from '@ejabi/shared';
import { api, ApiError, mediaSrc } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatUsd, majorLabel } from '@/lib/format';
import { fieldImage, majorImage, stageImage } from '@/lib/catalog-images';
import { IconButton } from '@/components/IconButton';
import { BrandMark } from '@/components/BrandMark';
import { btnGhost, btnPrimary, cn } from '@/lib/cn';

type Selection = {
  fieldId: string | null;
  majorId: string | null;
  stageId: string | null;
  countryId: string | null;
  universityId: string | null;
};

type StepKey = 'country' | 'field' | 'major' | 'university' | 'stage';

const emptySelection: Selection = {
  fieldId: null,
  majorId: null,
  stageId: null,
  countryId: null,
  universityId: null,
};

const RANK_TITLES = ['الأفضلية الأولى', 'الأفضلية الثانية', 'الأفضلية الثالثة'];

const STEPS: { key: StepKey; n: number; label: string; hint: string }[] = [
  { key: 'country', n: 1, label: 'الدولة', hint: 'ابدأ من الدولة — باقي الخيارات تُبنى عليها.' },
  { key: 'field', n: 2, label: 'الحقل', hint: 'اختر المجال الأقرب لميولك الدراسية.' },
  { key: 'major', n: 3, label: 'التخصص', hint: 'التخصصات المتاحة داخل الحقل الذي اخترته.' },
  { key: 'university', n: 4, label: 'الجامعة', hint: 'جامعات هذه الدولة التي تقدم التخصص المختار.' },
  { key: 'stage', n: 5, label: 'المرحلة', hint: 'تظهر فقط المراحل التي تقدمها هذه الجامعة لهذا التخصص.' },
];

const STEP_ICONS: Record<StepKey, LucideIcon> = {
  country: Globe,
  field: LayoutGrid,
  major: BookOpen,
  university: School,
  stage: GraduationCap,
};

function StepGlyph({ name, size = 18 }: { name: StepKey; size?: number }) {
  const Icon = STEP_ICONS[name];
  return <Icon size={size} strokeWidth={1.85} aria-hidden />;
}

function derivedStep(selection: Selection): StepKey {
  if (!selection.countryId) return 'country';
  if (!selection.fieldId) return 'field';
  if (!selection.majorId) return 'major';
  if (!selection.universityId) return 'university';
  return 'stage';
}

function isUnlocked(key: StepKey, selection: Selection) {
  if (key === 'country') return true;
  if (key === 'field') return Boolean(selection.countryId);
  if (key === 'major') return Boolean(selection.countryId && selection.fieldId);
  if (key === 'university') return Boolean(selection.countryId && selection.majorId);
  return Boolean(selection.universityId);
}

export function Ejabi() {
  const router = useRouter();
  const { user } = useAuth();
  const builderRef = useRef<HTMLElement>(null);
  const [actionsEl, setActionsEl] = useState<HTMLDivElement | null>(null);
  const [actionsVisible, setActionsVisible] = useState(false);
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [selection, setSelection] = useState<Selection>(emptySelection);
  const [focusStep, setFocusStep] = useState<StepKey | null>(null);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [items, setItems] = useState<CompareItemDto[]>([]);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [replaceId, setReplaceId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const step = focusStep && isUnlocked(focusStep, selection) ? focusStep : derivedStep(selection);
  const selectedField = catalog?.fields.find((f) => f.id === selection.fieldId);
  const selectedMajor = (selectedField?.majors ?? catalog?.majors ?? []).find((m) => m.id === selection.majorId);
  const majors = (selectedField?.majors ?? catalog?.majors.filter((m) => m.fieldId === selection.fieldId) ?? []).filter(
    (m) => !m.isCustom,
  );
  const selectedCountry = catalog?.countries.find((c) => c.id === selection.countryId);
  const universities = (selectedCountry?.universities ?? []).filter((u) => {
    if (!selection.majorId) return false;
    const stageIds = (u.majorStages || []).find((o) => o.majorId === selection.majorId)?.stageIds || [];
    return stageIds.length > 0;
  });
  const selectedUniversity = universities.find((u) => u.id === selection.universityId);
  const offeredStageIds =
    (selectedUniversity?.majorStages || []).find((o) => o.majorId === selection.majorId)?.stageIds || [];
  const offeredStages = (catalog?.stages ?? []).filter((s) => offeredStageIds.includes(s.id));
  const selectedStage = offeredStages.find((s) => s.id === selection.stageId);

  const loadCompare = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    try {
      setItems(await api<CompareItemDto[]>('/compare'));
    } catch {
      setItems([]);
    }
  }, [user]);

  useEffect(() => {
    api<CatalogResponse>('/catalog').then(setCatalog).catch(() => setCatalog(null));
  }, []);

  useEffect(() => {
    loadCompare();
  }, [loadCompare]);

  useEffect(() => {
    if (!actionsEl) return;
    const io = new IntersectionObserver(([entry]) => setActionsVisible(entry.isIntersecting), {
      threshold: 0.4,
    });
    io.observe(actionsEl);
    return () => io.disconnect();
  }, [actionsEl]);

  useEffect(() => {
    if (!summaryOpen && !successOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (successOpen) setSuccessOpen(false);
      else setSummaryOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [summaryOpen, successOpen]);

  useEffect(() => {
    const pending = sessionStorage.getItem('pendingAdd');
    if (pending && user) {
      sessionStorage.removeItem('pendingAdd');
      const dto = JSON.parse(pending) as QuoteRequest;
      api<CompareItemDto>('/compare', { method: 'POST', body: JSON.stringify(dto) })
        .then(async () => {
          await loadCompare();
          setSummaryOpen(true);
        })
        .catch(() => undefined);
    }
  }, [user, loadCompare]);

  const canQuote = Boolean(
    selection.fieldId && selection.majorId && selection.stageId && selection.countryId && selection.universityId,
  );

  useEffect(() => {
    if (!canQuote) {
      setQuote(null);
      return;
    }
    const dto: QuoteRequest = {
      fieldId: selection.fieldId!,
      majorId: selection.majorId!,
      stageId: selection.stageId!,
      countryId: selection.countryId!,
      universityId: selection.universityId!,
    };
    api<QuoteResponse>('/catalog/quote', { method: 'POST', body: JSON.stringify(dto) })
      .then(setQuote)
      .catch(() => setQuote(null));
  }, [canQuote, selection.fieldId, selection.majorId, selection.stageId, selection.countryId, selection.universityId]);

  function pick(group: keyof Selection, id: string) {
    setFocusStep(null);
    setSelection((prev) => {
      const next = { ...prev, [group]: id };
      if (group === 'fieldId') {
        next.majorId = null;
        next.universityId = null;
        next.stageId = null;
      }
      if (group === 'majorId' || group === 'countryId') {
        next.universityId = null;
        next.stageId = null;
      }
      if (group === 'universityId') next.stageId = null;
      return next;
    });
  }

  function scrollToBuilder() {
    builderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetBoard() {
    setSelection(emptySelection);
    setFocusStep(null);
    setQuote(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function continueChoosing() {
    setSummaryOpen(false);
    scrollToBuilder();
  }

  async function addChoice() {
    if (!canQuote) return;
    if (!replaceId && items.length >= 3) {
      setSummaryOpen(true);
      setError('يمكنك اختيار 3 خيارات فقط. احذف أو غيّر أحدها.');
      return;
    }
    const dto: QuoteRequest = {
      fieldId: selection.fieldId!,
      majorId: selection.majorId!,
      stageId: selection.stageId!,
      countryId: selection.countryId!,
      universityId: selection.universityId!,
    };
    if (!user) {
      sessionStorage.setItem('pendingAdd', JSON.stringify(dto));
      router.push('/login?next=/');
      return;
    }
    setError('');
    try {
      if (replaceId) {
        await api(`/compare/${replaceId}`, { method: 'DELETE' });
        setReplaceId(null);
      }
      await api('/compare', { method: 'POST', body: JSON.stringify(dto) });
      await loadCompare();
      resetBoard();
      setSummaryOpen(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'تعذر الإضافة');
    }
  }

  async function removeItem(id: string) {
    await api(`/compare/${id}`, { method: 'DELETE' });
    await loadCompare();
  }

  function changeItem(id: string) {
    setReplaceId(id);
    setSummaryOpen(false);
    setSelection(emptySelection);
    setFocusStep(null);
    setQuote(null);
    scrollToBuilder();
  }

  async function submitApplication() {
    if (items.length !== 3) return;
    setError('');
    try {
      await api('/applications', {
        method: 'POST',
        body: JSON.stringify({ itemIds: items.map((i) => i.id) }),
      });
      setSummaryOpen(false);
      setSuccessOpen(true);
      for (const item of items) {
        await api(`/compare/${item.id}`, { method: 'DELETE' }).catch(() => undefined);
      }
      setItems([]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'تعذر رفع الطلب');
    }
  }

  const addLabel = replaceId ? 'حفظ التعديل' : items.length >= 3 ? 'تم اختيار 3' : `إضافة كخيار ${items.length + 1}`;
  const addDisabled = !canQuote || (!replaceId && items.length >= 3);

  const showDock = Boolean(canQuote && quote && !actionsVisible);

  const skel =
    'rounded-[22px] bg-shimmer bg-[length:200%_100%] animate-shimmer motion-reduce:animate-none';

  if (!catalog) {
    return (
      <div className="home flex flex-col gap-[15px]" aria-busy="true" aria-live="polite">
        <div className={`${skel} h-[220px]`} />
        <div className={`${skel} h-[420px]`} />
      </div>
    );
  }

  return (
    <div className={cn('home flex flex-col gap-[15px]', showDock && 'max-[720px]:pb-[84px]')}>
      <header className="flex flex-row items-center justify-start gap-y-4 gap-x-7 px-1 pb-3 pt-2 max-[820px]:gap-x-5 max-[720px]:gap-x-4">
        <BrandMark
          className="h-[150px] w-[150px] max-[820px]:h-[148px] max-[820px]:w-[148px] max-[720px]:h-[120px] max-[720px]:w-[120px]"
          alt="إيجابي للخدمات الجامعية — EJABI"
        />
        <div className="min-w-0 text-start">
          <p className="mb-3 inline-flex items-center gap-2 font-cairo text-xs font-extrabold tracking-[0.6px] text-amber">
            <span className="inline-block h-[7px] w-[7px] rounded-full bg-teal shadow-[0_0_8px_#2c8a84]" /> نظام اختيار المسار الدراسي
          </p>
          <h1 className="m-0 font-cairo text-[clamp(30px,4.6vw,48px)] font-black leading-[1.25] tracking-[0.2px] text-paper">
            ابنِ انطلاقتك <span className="text-amber">الدراسية</span>
          </h1>
        </div>
      </header>

      {replaceId ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-amber-wash px-4 py-3">
          <p className="m-0 text-sm leading-[1.7] text-paper">
            <strong className="font-cairo text-amber">وضع التعديل.</strong> أكمل مسارًا جديدًا ثم احفظه مكان الخيار السابق.
          </p>
          <button type="button" className={btnGhost} onClick={() => setReplaceId(null)}>
            إلغاء
          </button>
        </div>
      ) : null}

      {items.length > 0 ? (
        <button
          type="button"
          className="self-center rounded-full border-0 bg-amber/10 px-4 py-[9px] font-cairo text-[13px] font-extrabold text-amber hover:bg-amber/20"
          onClick={() => setSummaryOpen(true)}
        >
          عرض خياراتك · {items.length} من 3
        </button>
      ) : null}

      <div>
        <section ref={builderRef} className="min-w-0 overflow-hidden rounded-[22px] bg-ink-2 scroll-mt-[92px]" aria-label="لوحة بناء المسار">
          <div className="flex flex-wrap justify-center gap-1.5 border-b border-line bg-black/[0.16] p-2.5 max-[720px]:overflow-hidden" aria-label="خطوات المسار">
            {STEPS.map((s) => {
              const unlocked = isUnlocked(s.key, selection);
              const chosen =
                s.key === 'country'
                  ? selectedCountry?.labelAr
                  : s.key === 'field'
                    ? selectedField?.labelAr
                    : s.key === 'major'
                      ? selectedMajor?.labelAr
                      : s.key === 'university'
                        ? selectedUniversity?.labelAr
                        : selectedStage?.labelAr;
              const filled = Boolean(chosen);
              const on = step === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  aria-current={on ? 'step' : undefined}
                  className={cn(
                    'flex flex-row items-center justify-center gap-2 rounded-[14px] border-0 bg-transparent px-3.5 py-2.5 font-cairo text-xs font-extrabold outline-none max-[720px]:px-2 max-[720px]:text-[11px]',
                    unlocked ? 'cursor-pointer' : 'cursor-not-allowed opacity-[0.42]',
                    filled || on ? 'text-paper' : 'text-slate',
                  )}
                  disabled={!unlocked}
                  onClick={() => setFocusStep(s.key)}
                >
                  <span
                    className={cn(
                      'inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-[9px] border-0',
                      filled || on ? 'bg-amber/15 text-amber' : 'bg-ink-3 text-slate',
                    )}
                  >
                    {s.key === 'country' && selectedCountry?.iso2 ? (
                      <img className="h-full w-full object-cover" src={flagUrl(selectedCountry.iso2, 80)} alt="" />
                    ) : (
                      <StepGlyph name={s.key} />
                    )}
                  </span>
                  <span className="max-w-full overflow-hidden text-ellipsis whitespace-nowrap">{chosen || s.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-[22px] text-center max-[720px]:pt-4">
            <p className="mb-1 px-4 font-cairo text-xs font-extrabold text-amber">الخطوة {STEPS.find((s) => s.key === step)?.n} من 5</p>
            <h2 className="mb-1.5 px-4 font-cairo text-2xl font-black text-paper max-[720px]:text-xl">{STEPS.find((s) => s.key === step)?.label}</h2>
            <p className="mx-auto mb-4 max-w-[46ch] px-4 text-center text-sm leading-[1.8] text-slate">{STEPS.find((s) => s.key === step)?.hint}</p>

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                {step === 'country' ? (
                  <div className="grid grid-cols-4 gap-2.5 px-4 pb-5 pt-2.5 max-[900px]:grid-cols-3 max-[720px]:grid-cols-2 max-[720px]:px-3 max-[720px]:pb-[18px]">
                    {catalog.countries.map((c) => (
                      <CountryCard key={c.id} country={c} active={selection.countryId === c.id} onPick={() => pick('countryId', c.id)} />
                    ))}
                  </div>
                ) : null}

                {step === 'field' ? (
                  <div className="grid grid-cols-4 gap-2.5 px-4 pb-5 pt-2.5 max-[900px]:grid-cols-3 max-[720px]:grid-cols-2 max-[720px]:px-3 max-[720px]:pb-[18px]">
                    {catalog.fields.map((f) => (
                      <FieldCard key={f.id} field={f} active={selection.fieldId === f.id} onPick={() => pick('fieldId', f.id)} />
                    ))}
                  </div>
                ) : null}

                {step === 'major' ? (
                  <div className="grid grid-cols-4 gap-2.5 px-4 pb-5 pt-2.5 max-[900px]:grid-cols-3 max-[720px]:grid-cols-2 max-[720px]:px-3 max-[720px]:pb-[18px]">
                    {majors.map((m) => (
                      <MajorCard key={m.id} major={m} active={selection.majorId === m.id} onPick={() => pick('majorId', m.id)} />
                    ))}
                  </div>
                ) : null}

                {step === 'university' ? (
                  universities.length === 0 ? (
                    <div className="rounded-2xl bg-ink-3 px-4 py-7 text-center text-[14.5px] leading-[1.9] text-slate">لا توجد جامعات لهذا التخصص في هذه الدولة. غيّر التخصص أو الدولة.</div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2.5 px-4 pb-5 pt-2.5 max-[900px]:grid-cols-3 max-[720px]:grid-cols-2 max-[720px]:px-3 max-[720px]:pb-[18px]">
                      {universities.map((u) => (
                        <UniversityCard
                          key={u.id}
                          university={u}
                          active={selection.universityId === u.id}
                          onPick={() => pick('universityId', u.id)}
                        />
                      ))}
                    </div>
                  )
                ) : null}

                {step === 'stage' ? (
                  offeredStages.length === 0 ? (
                    <div className="rounded-2xl bg-ink-3 px-4 py-7 text-center text-[14.5px] leading-[1.9] text-slate">هذا التخصص لا يُقدَّم في أي مرحلة في هذه الجامعة.</div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2.5 px-4 pb-5 pt-2.5 max-[900px]:grid-cols-3 max-[720px]:grid-cols-2 max-[720px]:px-3 max-[720px]:pb-[18px]">
                      {offeredStages.map((s) => (
                        <StageCard key={s.id} stage={s} active={selection.stageId === s.id} onPick={() => pick('stageId', s.id)} />
                      ))}
                    </div>
                  )
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>

          <AnimatePresence initial={false}>
            {canQuote ? (
              <motion.div
                key="home-foot"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                style={{ overflow: 'hidden' }}
              >
                <footer className="flex flex-col gap-4 border-t border-line bg-black/[0.14] px-5 pb-[18px] pt-5 max-[720px]:px-3.5 max-[720px]:pb-4 max-[720px]:pt-3.5" aria-live="polite">
                  <div className="grid grid-cols-3 gap-3 max-[720px]:grid-cols-2">
                    <div className="flex flex-col items-center rounded-2xl bg-ink-3 px-3 py-4 text-center">
                      <span className="mb-2 inline-flex items-center justify-center text-amber" aria-hidden>
                        <CalendarDays size={18} strokeWidth={1.85} />
                      </span>
                      <span className="mb-1.5 block text-xs text-slate">سنوات الدراسة</span>
                      <b className="block text-center font-cairo text-[22px] font-black leading-[1.25] text-paper">{quote ? quote.years : '—'}</b>
                    </div>
                    <div className="flex flex-col items-center rounded-2xl bg-ink-3 px-3 py-4 text-center">
                      <span className="mb-2 inline-flex items-center justify-center text-amber" aria-hidden>
                        <CircleDollarSign size={18} strokeWidth={1.85} />
                      </span>
                      <span className="mb-1.5 block text-xs text-slate">التكلفة السنوية</span>
                      <b className="block text-center font-cairo text-[22px] font-black leading-[1.25] text-paper" dir={quote && quote.annualCostUsd != null ? 'ltr' : undefined}>
                        {quote ? formatUsd(quote.annualCostUsd) : '—'}
                      </b>
                    </div>
                    <div className="flex flex-col items-center rounded-2xl bg-amber-metric px-3 py-4 text-center max-[720px]:col-span-full">
                      <span className="mb-2 inline-flex items-center justify-center text-amber" aria-hidden>
                        <Wallet size={18} strokeWidth={1.85} />
                      </span>
                      <span className="mb-1.5 block text-xs text-slate">تكلفة المرحلة</span>
                      <b className="block text-center font-cairo text-[22px] font-black leading-[1.25] text-amber" dir={quote && quote.totalCostUsd != null ? 'ltr' : undefined}>
                        {quote ? formatUsd(quote.totalCostUsd) : '—'}
                        {quote && quote.totalCostUsd != null ? <small className="font-tajawal text-xs font-bold text-slate"> USD</small> : null}
                      </b>
                    </div>
                  </div>

                  <div className="flex gap-2.5 max-[720px]:flex-col [&>button]:m-0 [&>button]:flex-1" ref={setActionsEl}>
                    <button type="button" className={btnGhost} onClick={resetBoard}>
                      إعادة المسار
                    </button>
                    <button className={btnPrimary} disabled={addDisabled} onClick={addChoice}>
                      {addLabel}
                    </button>
                  </div>
                  {error ? <p className="m-0 text-[13px] text-danger">{error}</p> : null}
                </footer>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </section>
      </div>

      {showDock && quote ? (
        <div className="fixed inset-x-3 bottom-[max(10px,env(safe-area-inset-bottom))] z-40 hidden items-center justify-between gap-3 rounded-[18px] bg-ink-2/90 p-3 shadow-dock backdrop-blur-lg max-[720px]:flex">
          <div>
            <b className="font-cairo text-base text-amber">{formatUsd(quote.totalCostUsd)}</b>
            <span className="block text-xs text-slate">
              {quote.years} سنوات · {selectedUniversity?.labelAr}
            </span>
          </div>
          <button className={`${btnPrimary} shrink-0 px-4 py-[11px]`} disabled={addDisabled} onClick={addChoice}>
            {addLabel}
          </button>
        </div>
      ) : null}

      <AnimatePresence>
        {summaryOpen ? (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#060c14]/[0.78] p-4 backdrop-blur-[10px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={() => setSummaryOpen(false)}
          >
            <motion.div
              className="flex max-h-[min(880px,calc(100vh-32px))] w-[min(820px,100%)] flex-col overflow-hidden rounded-[22px] bg-ink-2 text-right shadow-sheet"
              role="dialog"
              aria-labelledby="order-sheet-title"
              aria-modal="true"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <header className="grid grid-cols-[1fr_auto_auto] items-start gap-4 border-b border-line bg-amber-fade px-[22px] pb-[18px] pt-[22px] max-[720px]:grid-cols-[1fr_auto]">
                <div>
                  <p className="mb-1 font-cairo text-[11.5px] font-extrabold tracking-[0.8px] text-amber">خياراتك الدراسية</p>
                  <h3 id="order-sheet-title" className="mb-1.5 font-cairo text-2xl font-black text-paper">
                    ملخص الترتيب
                  </h3>
                  <p className="m-0 max-w-[46ch] text-[13.5px] leading-[1.8] text-slate">
                    {items.length === 3
                      ? 'ترتيبك مكتمل. راجع الجامعات ثم اضغط «تقدم الآن».'
                      : 'ثلاثة خيارات مرتبة حسب الأفضلية. غيّر أو احذف أي خيار قبل التقديم.'}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1 max-[720px]:col-start-1" aria-label={`تم اختيار ${items.length} من 3`}>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className={cn(
                        'inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink-3 font-cairo text-xs font-black text-slate',
                        i < items.length && 'bg-amber text-ink',
                      )}
                    >
                      {i + 1}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-0 bg-white/[0.04] p-0 text-paper hover:bg-white/[0.08] hover:text-amber max-[720px]:col-start-2 max-[720px]:row-start-1"
                  aria-label="إغلاق"
                  onClick={() => setSummaryOpen(false)}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </header>

              <div className="grid gap-3 overflow-y-auto px-[18px] py-4">
                {[0, 1, 2].map((index) => {
                  const item = items[index];
                  if (!item) {
                    return (
                      <button
                        key={`empty-${index}`}
                        type="button"
                        className="grid min-h-[92px] w-full cursor-pointer grid-cols-[auto_1fr] items-center gap-3.5 rounded-2xl border-0 bg-ink-3/60 px-4 py-3.5 text-right font-tajawal font-medium text-slate hover:bg-amber/[0.05] hover:text-paper max-[720px]:grid-cols-[auto_1fr]"
                        onClick={continueChoosing}
                      >
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-3 font-cairo text-base font-black text-slate">
                          {index + 1}
                        </span>
                        <span className="flex flex-col items-start gap-0.5">
                          <strong className="font-cairo text-[15px]">{RANK_TITLES[index]}</strong>
                          <small className="text-[12.5px] opacity-80">لم يُضف بعد — اضغط للعودة إلى اللوحة</small>
                        </span>
                      </button>
                    );
                  }
                  return (
                    <article
                      key={item.id}
                      className={cn(
                        'grid grid-cols-[auto_1fr_auto_auto] items-center gap-3.5 rounded-2xl bg-ink-3 p-4 text-right max-[720px]:grid-cols-[auto_1fr]',
                        index === 0 && 'bg-[linear-gradient(180deg,rgba(232,163,61,0.1),theme(colors.ink-3)_70%)]',
                      )}
                    >
                      <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber font-cairo text-base font-black text-ink">
                        {index + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="mb-2.5 flex items-center gap-3">
                          {item.university.logoUrl ? (
                            <img className="h-11 w-11 shrink-0 rounded-xl bg-ink-3 object-cover" src={mediaSrc(item.university.logoUrl) || ''} alt="" />
                          ) : (
                            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-xl">🏫</span>
                          )}
                          <div className="min-w-0">
                            <div className="mb-0.5 font-cairo text-[11px] font-extrabold text-amber">{RANK_TITLES[index]}</div>
                            <h4 className="m-0 font-cairo text-[16.5px] font-extrabold leading-[1.35] text-paper">{item.university.labelAr}</h4>
                            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] leading-[1.6] text-slate">
                              <span className="text-[15px] leading-none">{item.major.icon}</span>
                              {majorLabel(item)}
                              <span className="opacity-50">·</span>
                              {item.field.labelAr}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-ink/45 px-2.5 py-1 text-[12.5px] text-paper">
                            {item.country.iso2 ? <img className="h-[13px] w-[18px] rounded-sm object-cover" src={flagUrl(item.country.iso2, 40)} alt="" /> : null}
                            {item.country.labelAr}
                          </span>
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-ink/45 px-2.5 py-1 text-[12.5px] text-paper">
                            <span className="text-[15px] leading-none">{item.stage.icon}</span>
                            {item.stage.labelAr}
                          </span>
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-ink/45 px-2.5 py-1 text-[12.5px] text-paper">
                            {item.years} سنوات
                          </span>
                        </div>
                      </div>
                      <div className="min-w-[132px] text-left max-[720px]:col-start-2 max-[720px]:min-w-0 max-[720px]:text-right">
                        <div className="font-cairo text-lg font-black leading-tight text-amber" dir="ltr">
                          {formatUsd(item.totalCostUsd)}
                        </div>
                        <div className="mt-1 text-xs text-slate">سعر المرحلة</div>
                      </div>
                      <div className="flex items-center gap-2 max-[720px]:col-start-2 max-[720px]:justify-start">
                        <IconButton icon="edit" label="تغيير" onClick={() => changeItem(item.id)} />
                        <IconButton icon="delete" label="حذف" tone="danger" onClick={() => removeItem(item.id)} />
                      </div>
                    </article>
                  );
                })}
              </div>

              <footer className="flex flex-wrap items-center justify-between gap-3.5 border-t border-line bg-black/[0.12] px-[18px] pb-[18px] pt-3.5 max-[720px]:flex-col max-[720px]:items-stretch">
                <p className="m-0 min-w-[180px] flex-1 text-[13px] leading-[1.7] text-slate">
                  {items.length === 3
                    ? 'جاهز للتقديم. يمكنك تعديل أي خيار قبل الإرسال.'
                    : items.length === 2
                      ? 'يتبقى خيار واحد لإكمال الترتيب.'
                      : items.length === 1
                        ? 'يتبقى خياران لإكمال الترتيب.'
                        : 'ابدأ بإضافة خيارك الأول من اللوحة.'}
                </p>
                <div className="flex flex-wrap gap-2.5 max-[720px]:w-full max-[720px]:[&>button]:flex-1">
                  <button
                    type="button"
                    className="cursor-pointer rounded-[9px] border-0 bg-ink-3 px-[18px] py-[11px] font-cairo text-[14.5px] font-bold text-paper hover:bg-white/[0.08]"
                    onClick={items.length < 3 ? continueChoosing : () => setSummaryOpen(false)}
                  >
                    {items.length < 3 ? 'متابعة الاختيار' : 'إغلاق'}
                  </button>
                  <button
                    type="button"
                    className="min-w-[148px] cursor-pointer rounded-[9px] border-0 bg-amber px-[22px] py-[11px] font-cairo text-[14.5px] font-bold text-ink disabled:cursor-not-allowed disabled:opacity-35"
                    onClick={submitApplication}
                    disabled={items.length !== 3}
                  >
                    تقدم الآن
                  </button>
                </div>
              </footer>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {successOpen ? (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#060c14]/[0.78] p-4 backdrop-blur-[10px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={() => setSuccessOpen(false)}
          >
            <motion.div
              className="w-full max-w-[420px] rounded-2xl bg-ink-2 px-[30px] py-9 text-center shadow-modal max-[520px]:px-[18px] max-[520px]:py-7"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-2.5 text-[42px]">🎉</div>
              <h3 className="mb-3.5 font-cairo text-[22px] font-black text-amber">ممتاز!</h3>
              <p className="mb-6 text-[15px] leading-[2] text-paper">لقد تم رفع الطلب وسيتواصل معك فريقنا لمتابعة التقديم إن شاء الله.</p>
              <button
                className={btnPrimary}
                onClick={() => {
                  setSuccessOpen(false);
                  router.push('/applications');
                }}
              >
                تم
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function PhotoTile({
  src,
  label,
  active,
  onPick,
  caption,
}: {
  src: string | null;
  label: string;
  active: boolean;
  onPick: () => void;
  caption?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onPick}
      className={cn(
        'group relative flex min-h-0 items-stretch justify-start overflow-hidden rounded-[14px] bg-[#152033] p-0 text-center outline-none transition-shadow duration-200 hover:ring-1 hover:ring-amber/50 focus-visible:ring-2 focus-visible:ring-amber',
        active && 'z-10 ring-2 ring-amber',
      )}
    >
      <span className="relative block aspect-[3/2] w-full overflow-hidden rounded-[14px] bg-[#152033]">
        {src ? (
          <img
            src={src}
            alt=""
            className="block h-full w-full object-cover object-center"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-[22px] leading-none text-paper">
            <School size={36} strokeWidth={1.6} />
          </span>
        )}
        {active ? (
          <span className="absolute start-2 top-2 z-[2] inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber text-ink">
            <Check size={16} strokeWidth={3} aria-hidden />
          </span>
        ) : null}
        <span
          className={cn(
            'absolute inset-x-0 bottom-0 z-[1] flex flex-col items-center bg-tile-name px-2 pb-2.5 pt-8 font-cairo text-sm font-extrabold leading-[1.3]',
            active ? 'text-amber' : 'text-paper',
          )}
        >
          {label}
          {caption ? (
            <small className={cn('block font-tajawal text-[11px] font-medium', active ? 'text-amber/80' : 'text-paper/85')}>
              {caption}
            </small>
          ) : null}
        </span>
      </span>
    </button>
  );
}

function FieldCard({
  field,
  active,
  onPick,
}: {
  field: CatalogField;
  active: boolean;
  onPick: () => void;
}) {
  return <PhotoTile src={fieldImage(field.slug)} label={field.labelAr} active={active} onPick={onPick} />;
}

function CountryCard({
  country,
  active,
  onPick,
}: {
  country: CatalogCountry;
  active: boolean;
  onPick: () => void;
}) {
  return (
    <PhotoTile
      src={country.iso2 ? `https://flagcdn.com/${country.iso2.toLowerCase()}.svg` : null}
      label={country.labelAr}
      active={active}
      onPick={onPick}
    />
  );
}

function MajorCard({
  major,
  active,
  onPick,
}: {
  major: CatalogMajor;
  active: boolean;
  onPick: () => void;
}) {
  return <PhotoTile src={majorImage(major.slug)} label={major.labelAr} active={active} onPick={onPick} />;
}

function UniversityCard({
  university,
  active,
  onPick,
}: {
  university: CatalogUniversity;
  active: boolean;
  onPick: () => void;
}) {
  return (
    <PhotoTile src={mediaSrc(university.logoUrl)} label={university.labelAr} active={active} onPick={onPick} />
  );
}

function StageCard({
  stage,
  active,
  onPick,
}: {
  stage: CatalogStage;
  active: boolean;
  onPick: () => void;
}) {
  return (
    <PhotoTile
      src={stageImage(stage.slug)}
      label={stage.labelAr}
      caption={`${stage.years} سنوات دراسية`}
      active={active}
      onPick={onPick}
    />
  );
}
