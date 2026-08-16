'use client';

import { Reorder, useDragControls } from 'framer-motion';
import { CompareItemDto, flagUrl } from '@ejabi/shared';
import { GripVertical, School } from 'lucide-react';
import { IconButton } from '@/components/IconButton';
import { mediaSrc } from '@/lib/api';
import { cn, inputClass, labelClass } from '@/lib/cn';
import { formatUsd, majorLabel } from '@/lib/format';

const RANK_TITLES = ['الأفضلية الأولى', 'الأفضلية الثانية', 'الأفضلية الثالثة'];

export function OrderSummary({
  items,
  error,
  fullName,
  phone,
  submitting,
  asPage = false,
  onFullName,
  onPhone,
  onClose,
  onContinue,
  onChangeItem,
  onRemoveItem,
  onReorder,
  onSubmit,
}: {
  items: CompareItemDto[];
  error: string;
  fullName: string;
  phone: string;
  submitting: boolean;
  asPage?: boolean;
  onFullName: (value: string) => void;
  onPhone: (value: string) => void;
  onClose?: () => void;
  onContinue: () => void;
  onChangeItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onReorder: (next: CompareItemDto[]) => void;
  onSubmit: () => void;
}) {
  const idPrefix = asPage ? 'page' : 'sheet';
  const sortable = items.length > 1;

  return (
    <div
      className={cn(
        'flex w-full flex-col overflow-hidden rounded-[22px] bg-ink-2 text-right',
        !asPage && 'max-h-[min(880px,calc(100vh-32px))] w-[min(820px,100%)] shadow-sheet',
      )}
    >
      <header
        className={cn(
          'grid items-start gap-4 border-b border-line bg-amber-fade px-[22px] pb-[18px] pt-[22px]',
          asPage ? 'grid-cols-[1fr_auto]' : 'grid-cols-[1fr_auto_auto] max-[720px]:grid-cols-[1fr_auto]',
        )}
      >
        <div>
          <p className="mb-1 font-cairo text-[11.5px] font-extrabold tracking-[0.8px] text-amber">خياراتك الدراسية</p>
          <h3 id={`${idPrefix}-order-title`} className="mb-1.5 font-cairo text-2xl font-black text-paper">
            ملخص الترتيب
          </h3>
          <p className="m-0 max-w-[46ch] text-[13.5px] leading-[1.8] text-slate">
            {items.length === 3
              ? 'اسحب البطاقات لتغيير الأفضلية، أو عدّل أي خيار، ثم أدخل اسمك ورقم هاتفك لإرسال الطلب.'
              : 'ثلاثة خيارات مرتبة حسب الأفضلية. اسحب لإعادة الترتيب، أو غيّر أو احذف أي خيار قبل التقديم.'}
          </p>
        </div>
        <div className="flex items-center gap-2 pt-1" aria-label={`تم اختيار ${items.length} من 3`}>
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
        {!asPage ? (
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border-0 bg-white/[0.04] p-0 text-paper hover:bg-white/[0.08] hover:text-amber max-[720px]:col-start-2 max-[720px]:row-start-1"
            aria-label="إغلاق"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        ) : null}
      </header>

      <div className={cn('grid gap-3 px-[18px] py-4', !asPage && 'overflow-y-auto')}>
        {items.length > 0 ? (
          <Reorder.Group
            axis="y"
            values={items}
            onReorder={onReorder}
            as="div"
            layoutScroll
            className="grid gap-3"
          >
            {items.map((item, index) => (
              <SortableChoiceCard
                key={item.id}
                item={item}
                index={index}
                sortable={sortable}
                onChangeItem={onChangeItem}
                onRemoveItem={onRemoveItem}
              />
            ))}
          </Reorder.Group>
        ) : null}
        {Array.from({ length: 3 - items.length }, (_, offset) => {
          const index = items.length + offset;
          return (
            <button
              key={`empty-${index}`}
              type="button"
              className="grid min-h-[92px] w-full cursor-pointer grid-cols-[auto_1fr] items-center gap-3.5 rounded-2xl border-0 bg-ink-3/60 px-4 py-3.5 text-right font-tajawal font-medium text-slate hover:bg-amber/[0.05] hover:text-paper"
              onClick={onContinue}
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
        })}
      </div>

      <footer className="flex flex-col gap-3.5 border-t border-line bg-black/[0.12] px-[18px] pb-[18px] pt-3.5">
        {items.length === 3 ? (
          <div className="grid grid-cols-2 gap-3 max-[720px]:grid-cols-1">
            <div>
              <label className={labelClass} htmlFor={`${idPrefix}-applicant-name`}>
                اسمك
              </label>
              <input
                id={`${idPrefix}-applicant-name`}
                className={inputClass}
                value={fullName}
                onChange={(e) => onFullName(e.target.value)}
                placeholder="الاسم الكامل"
                autoComplete="name"
              />
            </div>
            <div>
              <label className={labelClass} htmlFor={`${idPrefix}-applicant-phone`}>
                رقم هاتفك
              </label>
              <input
                id={`${idPrefix}-applicant-phone`}
                className={inputClass}
                value={phone}
                onChange={(e) => onPhone(e.target.value)}
                placeholder="07xxxxxxxxx"
                inputMode="tel"
                autoComplete="tel"
              />
            </div>
          </div>
        ) : null}
        {error ? <p className="m-0 text-[13px] text-danger">{error}</p> : null}
        <div className="flex flex-wrap items-center justify-between gap-3.5 max-[720px]:flex-col max-[720px]:items-stretch">
          <p className="m-0 min-w-[180px] flex-1 text-[13px] leading-[1.7] text-slate">
            {items.length === 3
              ? 'جاهز للإرسال بعد إدخال الاسم ورقم الهاتف.'
              : items.length === 2
                ? 'يتبقى خيار واحد لإكمال الترتيب.'
                : items.length === 1
                  ? 'يتبقى خياران لإكمال الترتيب.'
                  : 'ابدأ بإضافة خيارك الأول من اللوحة.'}
          </p>
          <div className="flex flex-wrap gap-2.5 max-[720px]:w-full max-[720px]:[&>button]:flex-1">
            {!asPage ? (
              <button
                type="button"
                className="cursor-pointer rounded-[9px] border-0 bg-ink-3 px-[18px] py-[11px] font-cairo text-[14.5px] font-bold text-paper hover:bg-white/[0.08]"
                onClick={items.length < 3 ? onContinue : () => onClose?.()}
              >
                {items.length < 3 ? 'متابعة الاختيار' : 'إغلاق'}
              </button>
            ) : null}
            <button
              type="button"
              className="min-w-[148px] cursor-pointer rounded-[9px] border-0 bg-amber px-[22px] py-[11px] font-cairo text-[14.5px] font-bold text-ink disabled:cursor-not-allowed disabled:opacity-35"
              onClick={onSubmit}
              disabled={items.length !== 3 || submitting || fullName.trim().length < 2 || phone.trim().length < 8}
            >
              {submitting ? 'جارٍ الإرسال...' : 'إرسال الطلب'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SortableChoiceCard({
  item,
  index,
  sortable,
  onChangeItem,
  onRemoveItem,
}: {
  item: CompareItemDto;
  index: number;
  sortable: boolean;
  onChangeItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      value={item}
      as="article"
      drag={sortable}
      dragListener={false}
      dragControls={controls}
      whileDrag={{
        scale: 1.015,
        boxShadow: '0 22px 44px -18px rgba(0, 0, 0, 0.55)',
        cursor: 'grabbing',
        zIndex: 30,
      }}
      className={cn(
        'relative grid grid-cols-[auto_1fr_auto_auto] items-center gap-3.5 rounded-2xl bg-ink-3 p-4 text-right max-[720px]:grid-cols-[auto_1fr]',
        index === 0 && 'bg-[linear-gradient(180deg,rgba(232,163,61,0.1),theme(colors.ink-3)_70%)]',
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2',
          sortable && 'cursor-grab touch-none active:cursor-grabbing',
        )}
        onPointerDown={(e) => {
          if (sortable) controls.start(e);
        }}
      >
        {sortable ? (
          <span className="inline-flex h-9 w-7 shrink-0 items-center justify-center text-slate" aria-hidden>
            <GripVertical size={18} strokeWidth={1.85} />
          </span>
        ) : null}
        <div
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber font-cairo text-base font-black text-ink"
          aria-label={sortable ? 'اسحب لإعادة الترتيب' : undefined}
        >
          {index + 1}
        </div>
      </div>
      <div className="min-w-0">
        <div className="mb-2.5 flex items-center gap-3">
          {item.university.logoUrl ? (
            <img className="h-11 w-11 shrink-0 rounded-xl bg-ink-3 object-cover" src={mediaSrc(item.university.logoUrl) || ''} alt="" />
          ) : (
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-amber">
              <School size={22} strokeWidth={1.7} />
            </span>
          )}
          <div className="min-w-0">
            <div className="mb-0.5 font-cairo text-[11px] font-extrabold text-amber">{RANK_TITLES[index]}</div>
            <h4 className="m-0 font-cairo text-[16.5px] font-extrabold leading-[1.35] text-paper">{item.university.labelAr}</h4>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] leading-[1.6] text-slate">
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
            {item.stage.labelAr}
          </span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-ink/45 px-2.5 py-1 text-[12.5px] text-paper">
            {item.years} سنوات
          </span>
        </div>
      </div>
      <div
        className={cn(
          'min-w-[132px] text-left',
          'max-[720px]:col-start-2 max-[720px]:min-w-0 max-[720px]:text-right',
        )}
      >
        <div className="font-cairo text-lg font-black leading-tight text-amber" dir="ltr">
          {formatUsd(item.totalCostUsd)}
        </div>
        <div className="mt-1 text-xs text-slate">سعر المرحلة</div>
      </div>
      <div
        className={cn(
          'flex items-center gap-2',
          'max-[720px]:col-start-2 max-[720px]:justify-start',
        )}
      >
        <IconButton icon="edit" label="تغيير" onClick={() => onChangeItem(item.id)} />
        <IconButton icon="delete" label="حذف" tone="danger" onClick={() => onRemoveItem(item.id)} />
      </div>
    </Reorder.Item>
  );
}
