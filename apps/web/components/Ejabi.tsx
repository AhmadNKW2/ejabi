'use client';

import { useEffect, useRef, useState, type ReactNode, type Ref, type RefObject } from 'react';
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
  parseCatalogView,
} from '@ejabi/shared';
import { api, ApiError, mediaSrc } from '@/lib/api';
import { formatUsd, majorLabel } from '@/lib/format';
import { fireRealisticConfetti } from '@/lib/confetti';
import { fieldImage, majorImage, stageImage } from '@/lib/catalog-images';
import { BrandMark } from '@/components/BrandMark';
import { OrderSummary } from '@/components/OrderSummary';
import { OptionPills } from '@/components/OptionPills';
import { IconButton } from '@/components/IconButton';
import { LoadingOverlay } from '@/components/LoadingOverlay';
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

const STORAGE_KEY = 'ejabi-choices';

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

const NEXT_AFTER: Record<keyof Selection, StepKey | null> = {
  countryId: 'field',
  fieldId: 'major',
  majorId: 'university',
  universityId: 'stage',
  stageId: null,
};

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
  const builderRef = useRef<HTMLElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const pendingSummaryScroll = useRef(false);
  const countryStepRef = useRef<HTMLElement>(null);
  const fieldStepRef = useRef<HTMLElement>(null);
  const majorStepRef = useRef<HTMLElement>(null);
  const universityStepRef = useRef<HTMLElement>(null);
  const stageStepRef = useRef<HTMLElement>(null);
  const view2StepRefs: Record<StepKey, RefObject<HTMLElement | null>> = {
    country: countryStepRef,
    field: fieldStepRef,
    major: majorStepRef,
    university: universityStepRef,
    stage: stageStepRef,
  };
  const [actionsEl, setActionsEl] = useState<HTMLDivElement | null>(null);
  const [actionsVisible, setActionsVisible] = useState(false);
  const [catalog, setCatalog] = useState<CatalogResponse | null>(null);
  const [selection, setSelection] = useState<Selection>(emptySelection);
  const [focusStep, setFocusStep] = useState<StepKey | null>(null);
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [items, setItems] = useState<CompareItemDto[]>([]);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryPage, setSummaryPage] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [replaceId, setReplaceId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [choicesReady, setChoicesReady] = useState(false);

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

  useEffect(() => {
    api<CatalogResponse>('/catalog').then(setCatalog).catch(() => setCatalog(null));
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CompareItemDto[] | { items?: CompareItemDto[]; fullName?: string; phone?: string };
        const list = Array.isArray(parsed) ? parsed : parsed.items ?? [];
        setItems(list);
        if (!Array.isArray(parsed)) {
          if (parsed.fullName) setFullName(parsed.fullName);
          if (parsed.phone) setPhone(parsed.phone);
        }
        if (list.length === 3) {
          pendingSummaryScroll.current = true;
          setSummaryPage(true);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setChoicesReady(true);
  }, []);

  useEffect(() => {
    if (!choicesReady) return;
    if (items.length === 0 && !fullName && !phone) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, fullName, phone }));
  }, [items, fullName, phone, choicesReady]);

  useEffect(() => {
    if (!actionsEl) return;
    const io = new IntersectionObserver(([entry]) => setActionsVisible(entry.isIntersecting), {
      threshold: 0.4,
    });
    io.observe(actionsEl);
    return () => io.disconnect();
  }, [actionsEl]);

  useEffect(() => {
    if (!catalog || !summaryPage || items.length !== 3 || !pendingSummaryScroll.current) return;
    const id = window.setTimeout(() => {
      summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      pendingSummaryScroll.current = false;
    }, 80);
    return () => window.clearTimeout(id);
  }, [catalog, summaryPage, items.length]);

  useEffect(() => {
    if (!summaryOpen && !successOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (successOpen) setSuccessOpen(false);
      else closeSummaryOverlay();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [summaryOpen, successOpen, items.length]);

  const canQuote = Boolean(
    selection.fieldId && selection.majorId && selection.stageId && selection.countryId && selection.universityId,
  );

  useEffect(() => {
    if (!canQuote) {
      setQuote(null);
      setQuoting(false);
      return;
    }
    let cancelled = false;
    setQuote(null);
    setQuoting(true);
    const dto: QuoteRequest = {
      fieldId: selection.fieldId!,
      majorId: selection.majorId!,
      stageId: selection.stageId!,
      countryId: selection.countryId!,
      universityId: selection.universityId!,
    };
    api<QuoteResponse>('/catalog/quote', { method: 'POST', body: JSON.stringify(dto) })
      .then((row) => {
        if (!cancelled) setQuote(row);
      })
      .catch(() => {
        if (!cancelled) {
          setQuote(null);
          setError('تعذر حساب التكلفة. حاول مرة أخرى.');
        }
      })
      .finally(() => {
        if (!cancelled) setQuoting(false);
      });
    return () => {
      cancelled = true;
    };
  }, [canQuote, selection.fieldId, selection.majorId, selection.stageId, selection.countryId, selection.universityId]);

  function scrollToFirstStep() {
    window.setTimeout(() => {
      const target = countryStepRef.current || builderRef.current;
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  function scrollToNextView2Step(group: keyof Selection) {
    const next = NEXT_AFTER[group];
    window.setTimeout(() => {
      if (next) {
        view2StepRefs[next].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      actionsEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 120);
  }

  function clearFrom(prev: Selection, group: keyof Selection): Selection {
    const next = { ...prev };
    if (group === 'countryId') {
      next.countryId = null;
      next.fieldId = null;
      next.majorId = null;
      next.universityId = null;
      next.stageId = null;
    }
    if (group === 'fieldId') {
      next.fieldId = null;
      next.majorId = null;
      next.universityId = null;
      next.stageId = null;
    }
    if (group === 'majorId') {
      next.majorId = null;
      next.universityId = null;
      next.stageId = null;
    }
    if (group === 'universityId') {
      next.universityId = null;
      next.stageId = null;
    }
    if (group === 'stageId') next.stageId = null;
    return next;
  }

  function pick(group: keyof Selection, id: string, toggle = false) {
    if (toggle && selection[group] === id) {
      setSelection((prev) => clearFrom(prev, group));
      setFocusStep(group === 'countryId' ? 'country' : group === 'fieldId' ? 'field' : group === 'majorId' ? 'major' : group === 'universityId' ? 'university' : 'stage');
      return;
    }
    if (!toggle && selection[group] === id) {
      setFocusStep(NEXT_AFTER[group]);
      return;
    }
    setSelection((prev) => {
      const next = { ...prev, [group]: id };
      if (group === 'fieldId') {
        next.majorId = null;
        next.universityId = null;
        next.stageId = null;
      }
      if (group === 'countryId') {
        next.universityId = null;
        next.stageId = null;
      }
      if (group === 'majorId') {
        next.universityId = null;
        next.stageId = null;
      }
      if (group === 'universityId') next.stageId = null;
      return next;
    });
    setFocusStep(NEXT_AFTER[group]);
    if (toggle) scrollToNextView2Step(group);
  }

  function scrollToBuilder() {
    builderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetBoard(opts?: { scroll?: boolean }) {
    setSelection(emptySelection);
    setFocusStep(null);
    setQuote(null);
    if (opts?.scroll === false) return;
    scrollToFirstStep();
  }

  function scrollToSummary() {
    pendingSummaryScroll.current = true;
    window.setTimeout(() => {
      summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      pendingSummaryScroll.current = false;
    }, 80);
  }

  function continueChoosing() {
    setSummaryOpen(false);
    setSummaryPage(false);
    scrollToBuilder();
  }

  function closeSummaryOverlay() {
    setSummaryOpen(false);
    if (items.length === 3) {
      pendingSummaryScroll.current = true;
      setSummaryPage(true);
      scrollToSummary();
    }
  }

  function cancelReplace() {
    setReplaceId(null);
    setSelection(emptySelection);
    setFocusStep(null);
    setQuote(null);
    if (items.length === 3) {
      pendingSummaryScroll.current = true;
      setSummaryPage(true);
      scrollToSummary();
    }
  }

  function openChoices() {
    if (items.length === 3) {
      pendingSummaryScroll.current = true;
      setSummaryPage(true);
      setSummaryOpen(false);
      scrollToSummary();
      return;
    }
    setSummaryOpen(true);
  }

  async function addChoice() {
    if (!canQuote || !quote || !selectedField || !selectedMajor || !selectedStage || !selectedCountry || !selectedUniversity) {
      return;
    }
    if (!replaceId && items.length >= 3) {
      setSummaryOpen(true);
      setError('يمكنك اختيار 3 خيارات فقط. احذف أو غيّر أحدها.');
      return;
    }
    const key = `${selection.fieldId}:${selection.majorId}:${selection.stageId}:${selection.countryId}:${selection.universityId}`;
    const duplicate = items.some(
      (item) =>
        item.id !== replaceId &&
        `${item.fieldId}:${item.majorId}:${item.stageId}:${item.countryId}:${item.universityId}` === key,
    );
    if (duplicate) {
      setError('هذا الخيار مضاف مسبقًا.');
      setSummaryOpen(true);
      return;
    }
    const nextItem: CompareItemDto = {
      id: crypto.randomUUID(),
      fieldId: selection.fieldId!,
      majorId: selection.majorId!,
      stageId: selection.stageId!,
      countryId: selection.countryId!,
      universityId: selection.universityId!,
      customMajorLabel: null,
      years: quote.years,
      annualCostUsd: quote.annualCostUsd,
      totalCostUsd: quote.totalCostUsd,
      createdAt: new Date().toISOString(),
      field: selectedField,
      major: selectedMajor,
      stage: selectedStage,
      country: selectedCountry,
      university: selectedUniversity,
    };
    const next = replaceId ? items.map((item) => (item.id === replaceId ? nextItem : item)) : [...items, nextItem];
    setItems(next);
    setReplaceId(null);
    setError('');
    resetBoard({ scroll: false });
    if (next.length === 3) {
      setSummaryOpen(false);
      pendingSummaryScroll.current = true;
      setSummaryPage(true);
      if (!replaceId) fireRealisticConfetti();
    } else {
      setSummaryOpen(true);
    }
  }

  function removeItem(id: string) {
    setItems((list) => {
      const next = list.filter((item) => item.id !== id);
      if (next.length < 3) setSummaryPage(false);
      return next;
    });
  }

  function changeItem(id: string) {
    const item = items.find((row) => row.id === id);
    if (!item) return;
    setReplaceId(id);
    setSummaryOpen(false);
    setSummaryPage(false);
    setSelection({
      fieldId: item.fieldId,
      majorId: item.majorId,
      stageId: item.stageId,
      countryId: item.countryId,
      universityId: item.universityId,
    });
    setFocusStep('country');
    setQuote(null);
    scrollToFirstStep();
  }

  async function submitApplication() {
    if (items.length !== 3) return;
    if (fullName.trim().length < 2 || phone.trim().length < 8) {
      setError('أدخل اسمك ورقم هاتفك لإرسال الطلب.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await api('/applications', {
        method: 'POST',
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          choices: items.map((item) => ({
            fieldId: item.fieldId,
            majorId: item.majorId,
            stageId: item.stageId,
            countryId: item.countryId,
            universityId: item.universityId,
          })),
        }),
      });
      fireRealisticConfetti();
      setSummaryOpen(false);
      setSummaryPage(false);
      setSuccessOpen(true);
      setItems([]);
      setFullName('');
      setPhone('');
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'تعذر رفع الطلب');
    } finally {
      setSubmitting(false);
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

  const pills = parseCatalogView(catalog.catalogView) === 'view2';

  return (
    <div className={cn('home flex flex-col gap-[15px]', showDock && !summaryPage && 'max-[720px]:pb-[84px]')}>
      <LoadingOverlay
        show={quoting || submitting}
        label={submitting ? 'جارٍ إرسال الطلب...' : 'جارٍ حساب التكلفة...'}
      />
      <div ref={summaryRef} className="flex flex-col gap-[15px] scroll-mt-2">
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
            <span className="text-amber">ابنِ</span> انطلاقتك الدراسية
          </h1>
        </div>
      </header>
      {summaryPage && items.length === 3 ? (
        <section aria-label="ملخص الترتيب">
          <OrderSummary
            asPage
            items={items}
            error={error}
            fullName={fullName}
            phone={phone}
            submitting={submitting}
            onFullName={setFullName}
            onPhone={setPhone}
            onContinue={continueChoosing}
            onChangeItem={changeItem}
            onRemoveItem={removeItem}
            onReorder={setItems}
            onSubmit={submitApplication}
            hideMedia={pills}
          />
        </section>
      ) : (
        <>
      {replaceId ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-amber-wash px-4 py-3">
          <p className="m-0 text-sm leading-[1.7] text-paper">
            <strong className="font-cairo text-amber">وضع التعديل.</strong> غيّر الخطوات أدناه ثم احفظ. باقي خياراتك تبقى ظاهرة.
          </p>
          <button type="button" className={btnGhost} onClick={cancelReplace}>
            إلغاء
          </button>
        </div>
      ) : null}

      {items.length > 0 ? (
        <section className="grid gap-2" aria-label="خياراتك المختارة">
          <div className="flex items-center justify-between gap-3 px-1">
            <p className="m-0 font-cairo text-xs font-extrabold text-amber">خياراتك · {items.length} من 3</p>
            {items.length < 3 ? (
              <button
                type="button"
                className="cursor-pointer rounded-full border-0 bg-transparent px-2 py-1 font-cairo text-[12.5px] font-extrabold text-slate hover:text-amber"
                onClick={openChoices}
              >
                عرض الملخص
              </button>
            ) : null}
          </div>
          <div className="grid grid-cols-3 gap-2 max-[720px]:grid-cols-1">
            {[0, 1, 2].map((index) => {
              const item = items[index];
              if (!item) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="flex min-h-[72px] items-center gap-3 rounded-2xl bg-ink-2 px-3.5 py-3 text-slate"
                  >
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ink-3 font-cairo text-sm font-black">
                      {index + 1}
                    </span>
                    <span className="text-[13px]">لم يُضف بعد</span>
                  </div>
                );
              }
              const editing = replaceId === item.id;
              return (
                <article
                  key={item.id}
                  className={cn(
                    'grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl bg-ink-2 px-3.5 py-3',
                    editing && 'bg-amber-wash ring-1 ring-amber/50',
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ink-3 font-cairo text-sm font-black text-slate',
                      editing && 'bg-amber text-ink',
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <h4 className="m-0 truncate font-cairo text-[14.5px] font-extrabold text-paper">{item.university.labelAr}</h4>
                    <p className="m-0 truncate text-[12.5px] text-slate">{majorLabel(item)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <IconButton icon="edit" label="تعديل" onClick={() => changeItem(item.id)} />
                    <IconButton icon="delete" label="حذف" tone="danger" onClick={() => removeItem(item.id)} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      <div>
        <section ref={builderRef} className="min-w-0 overflow-hidden rounded-[22px] bg-ink-2 scroll-mt-[92px]" aria-label="لوحة بناء المسار">
          {pills ? (
            <div className="px-4 py-5 max-[720px]:px-3 max-[720px]:py-4">
              <AnimatePresence initial={false}>
              <PillStep key="country" stepRef={countryStepRef} label="الدولة" hint={STEPS[0].hint}>
                <OptionPills
                  items={catalog.countries.map((c) => ({ id: c.id, label: c.labelAr }))}
                  value={selection.countryId}
                  onChange={(id) => pick('countryId', id, true)}
                />
              </PillStep>
              {selection.countryId ? (
                <PillStep key="field" stepRef={fieldStepRef} label="الحقل" hint={STEPS[1].hint}>
                  <OptionPills
                    items={catalog.fields.map((f) => ({ id: f.id, label: f.labelAr }))}
                    value={selection.fieldId}
                    onChange={(id) => pick('fieldId', id, true)}
                  />
                </PillStep>
              ) : null}
              {selection.countryId && selection.fieldId ? (
                <PillStep key="major" stepRef={majorStepRef} label="التخصص" hint={STEPS[2].hint}>
                  <OptionPills
                    items={majors.map((m) => ({ id: m.id, label: m.labelAr }))}
                    value={selection.majorId}
                    onChange={(id) => pick('majorId', id, true)}
                  />
                </PillStep>
              ) : null}
              {selection.countryId && selection.majorId ? (
                <PillStep key="university" stepRef={universityStepRef} label="الجامعة" hint={STEPS[3].hint}>
                  {universities.length === 0 ? (
                    <p className="m-0 rounded-2xl bg-ink-3 px-4 py-5 text-center text-[14.5px] leading-[1.9] text-slate">
                      لا توجد جامعات لهذا التخصص في هذه الدولة. غيّر التخصص أو الدولة.
                    </p>
                  ) : (
                    <OptionPills
                      items={universities.map((u) => ({ id: u.id, label: u.labelAr }))}
                      value={selection.universityId}
                      onChange={(id) => pick('universityId', id, true)}
                    />
                  )}
                </PillStep>
              ) : null}
              {selection.universityId ? (
                <PillStep key="stage" stepRef={stageStepRef} label="المرحلة" hint={STEPS[4].hint}>
                  {offeredStages.length === 0 ? (
                    <p className="m-0 rounded-2xl bg-ink-3 px-4 py-5 text-center text-[14.5px] leading-[1.9] text-slate">
                      هذا التخصص لا يُقدَّم في أي مرحلة في هذه الجامعة.
                    </p>
                  ) : (
                    <OptionPills
                      items={offeredStages.map((s) => ({
                        id: s.id,
                        label: s.labelAr,
                      }))}
                      value={selection.stageId}
                      onChange={(id) => pick('stageId', id, true)}
                    />
                  )}
                </PillStep>
              ) : null}
              </AnimatePresence>
            </div>
          ) : (
            <>
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
            </>
          )}

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
                      <span className="mb-1.5 block text-xs text-slate">التكلفة الإجمالية</span>
                      <b className="block text-center font-cairo text-[22px] font-black leading-[1.25] text-amber" dir={quote && quote.totalCostUsd != null ? 'ltr' : undefined}>
                        {quote ? formatUsd(quote.totalCostUsd) : '—'}
                        {quote && quote.totalCostUsd != null ? <small className="font-tajawal text-xs font-bold text-slate"> USD</small> : null}
                      </b>
                    </div>
                  </div>

                  <div className="flex gap-2.5 max-[720px]:flex-col [&>button]:m-0 [&>button]:flex-1" ref={setActionsEl}>
                    <button type="button" className={btnGhost} onClick={() => resetBoard()}>
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
        </>
      )}
      </div>

      <AnimatePresence>
        {summaryOpen && !summaryPage ? (
          <motion.div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#060c14]/[0.78] p-4 backdrop-blur-[10px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={closeSummaryOverlay}
          >
            <motion.div
              role="dialog"
              aria-labelledby="sheet-order-title"
              aria-modal="true"
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <OrderSummary
                items={items}
                error={error}
                fullName={fullName}
                phone={phone}
                submitting={submitting}
                onFullName={setFullName}
                onPhone={setPhone}
                onClose={closeSummaryOverlay}
                onContinue={continueChoosing}
                onChangeItem={changeItem}
                onRemoveItem={removeItem}
                onReorder={setItems}
                onSubmit={submitApplication}
                hideMedia={pills}
              />
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
              <div className="mb-2.5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber text-ink">
                <Check size={28} strokeWidth={3} aria-hidden />
              </div>
              <h3 className="mb-3.5 font-cairo text-[22px] font-black text-amber">ممتاز!</h3>
              <p className="mb-6 text-[15px] leading-[2] text-paper">لقد تم رفع الطلب وسيتواصل معك فريقنا لمتابعة التقديم إن شاء الله.</p>
              <button
                className={btnPrimary}
                onClick={() => setSuccessOpen(false)}
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

function PillStep({
  label,
  hint,
  children,
  stepRef,
}: {
  label: string;
  hint: string;
  children: ReactNode;
  stepRef?: Ref<HTMLElement>;
}) {
  return (
    <motion.section
      ref={stepRef}
      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
      animate={{ opacity: 1, height: 'auto', marginBottom: 28 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="scroll-mt-[92px] overflow-hidden"
    >
      <h2 className="mb-1 font-cairo text-xl font-black text-paper">{label}</h2>
      <p className="mb-3 max-w-[46ch] text-sm leading-[1.8] text-slate">{hint}</p>
      {children}
    </motion.section>
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
