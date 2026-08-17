'use client';

import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CatalogCountry, CatalogMajor, CatalogStage, CatalogUniversity, MajorPriceDto } from '@ejabi/shared';
import { api, apiUpload, ApiError } from '@/lib/api';
import { Flag } from '@/components/Flag';
import { IconButton } from '@/components/IconButton';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { Modal } from '@/components/Modal';
import { Pills } from '@/components/Pills';
import { PriceCell } from '@/components/PriceCell';
import { RequireAdmin } from '@/components/RequireAdmin';
import { SearchField } from '@/components/SearchField';
import { Select } from '@/components/Select';
import { Toggle } from '@/components/Toggle';
import { UniversityLogo } from '@/components/UniversityLogo';
import { useSiteSettings } from '@/lib/settings';

type UniRow = CatalogUniversity & {
  country?: CatalogCountry;
  majorIds?: string[];
  majorStages?: { majorId: string; stageIds: string[] }[];
};

type Offering = { majorId: string; stageIds: string[] };

type IdentityForm = {
  countryId: string;
  labelAr: string;
  labelEn: string;
  logoUrl: string;
  isActive: boolean;
};

function offeringsOf(row: UniRow): Offering[] {
  const staged = row.majorStages || [];
  const extra = (row.majorIds || []).filter((id) => !staged.some((o) => o.majorId === id));
  return [...staged, ...extra.map((majorId) => ({ majorId, stageIds: [] as string[] }))];
}

function coverage(prices: MajorPriceDto[], universityId: string) {
  const priced = prices.filter((p) => p.universityId === universityId && p.costUsd != null).length;
  return { priced };
}

function emptyIdentity(countryId = ''): IdentityForm {
  return { countryId, labelAr: '', labelEn: '', logoUrl: '', isActive: true };
}

function AddMajorSelect({
  majors,
  addedIds,
  onAdd,
}: {
  majors: CatalogMajor[];
  addedIds: string[];
  onAdd: (majorId: string) => void;
}) {
  const added = new Set(addedIds);
  return (
    <div className="w-full">
      <Select
        value=""
        placeholder={majors.length === 0 ? 'لا توجد تخصصات في قاعدة البيانات' : 'اختر تخصصًا'}
        options={majors.map((m) => ({
          value: m.id,
          label: m.labelAr,
          disabled: added.has(m.id),
        }))}
        onChange={(id) => {
          if (id && !added.has(id)) onAdd(id);
        }}
      />
    </div>
  );
}

function UniversitiesWorkspace() {
  const { hideCatalogImages } = useSiteSettings();
  const searchParams = useSearchParams();
  const requestedUni = searchParams.get('university') || '';
  const [countries, setCountries] = useState<CatalogCountry[]>([]);
  const [majors, setMajors] = useState<CatalogMajor[]>([]);
  const [stages, setStages] = useState<CatalogStage[]>([]);
  const [universities, setUniversities] = useState<UniRow[]>([]);
  const [prices, setPrices] = useState<MajorPriceDto[]>([]);
  const [countryId, setCountryId] = useState('');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [savingKey, setSavingKey] = useState('');
  const [banner, setBanner] = useState('');
  const [identityOpen, setIdentityOpen] = useState(false);
  const [editing, setEditing] = useState<UniRow | null>(null);
  const [form, setForm] = useState<IdentityForm>(emptyIdentity());
  const [formError, setFormError] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingDelete, setPendingDelete] = useState<UniRow | null>(null);
  const [pendingRemoveMajor, setPendingRemoveMajor] = useState<CatalogMajor | null>(null);

  async function load() {
    const [c, m, s, u, p] = await Promise.all([
      api<CatalogCountry[]>('/admin/countries'),
      api<CatalogMajor[]>('/admin/majors'),
      api<CatalogStage[]>('/admin/stages'),
      api<UniRow[]>('/admin/universities'),
      api<MajorPriceDto[]>('/admin/prices'),
    ]);
    setCountries(c);
    setMajors(m);
    setStages(s);
    setUniversities(u);
    setPrices(p);
    return { countries: c, universities: u };
  }

  useEffect(() => {
    load()
      .then(({ countries: c, universities: u }) => {
        const fromQuery = u.find((row) => row.id === requestedUni);
        if (fromQuery) {
          setCountryId(fromQuery.countryId);
          setSelectedId(fromQuery.id);
          return;
        }
        setSelectedId((prev) => prev || u[0]?.id || '');
        if (!c.length) return;
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [requestedUni]);

  const priceMap = useMemo(() => {
    const map = new Map<string, number | null>();
    prices.forEach((r) => map.set(`${r.majorId}:${r.universityId}:${r.stageId}`, r.costUsd));
    return map;
  }, [prices]);

  const filteredUnis = useMemo(() => {
    const q = query.trim().toLowerCase();
    return universities.filter((u) => {
      if (countryId && u.countryId !== countryId) return false;
      if (!q) return true;
      const country = countries.find((c) => c.id === u.countryId);
      return (
        u.labelAr.toLowerCase().includes(q) ||
        u.labelEn.toLowerCase().includes(q) ||
        (country?.labelAr.toLowerCase().includes(q) ?? false) ||
        (country?.labelEn.toLowerCase().includes(q) ?? false)
      );
    });
  }, [universities, countries, countryId, query]);

  const groups = useMemo(() => {
    const byCountry = new Map<string, UniRow[]>();
    filteredUnis.forEach((row) => {
      const list = byCountry.get(row.countryId) || [];
      list.push(row);
      byCountry.set(row.countryId, list);
    });
    const ordered = countryId ? countries.filter((c) => c.id === countryId) : countries;
    return ordered
      .map((country) => ({ country, universities: byCountry.get(country.id) || [] }))
      .filter((g) => g.universities.length > 0);
  }, [filteredUnis, countries, countryId]);

  useEffect(() => {
    if (!filteredUnis.length) {
      setSelectedId('');
      return;
    }
    if (!filteredUnis.some((u) => u.id === selectedId)) {
      setSelectedId(filteredUnis[0].id);
    }
  }, [filteredUnis, selectedId]);

  const selected = universities.find((u) => u.id === selectedId);
  const selectedCountry = countries.find((c) => c.id === selected?.countryId);
  const selectedOfferings = selected ? offeringsOf(selected) : [];
  const selectedMajors = majors.filter((m) => selectedOfferings.some((o) => o.majorId === m.id));
  const selectedCov = selected ? coverage(prices, selected.id) : { priced: 0 };

  const stats = useMemo(
    () => ({ priced: filteredUnis.reduce((n, u) => n + coverage(prices, u.id).priced, 0) }),
    [filteredUnis, prices],
  );

  function patchLocalUni(id: string, nextOfferings: Offering[]) {
    setUniversities((list) =>
      list.map((u) =>
        u.id === id
          ? { ...u, majorStages: nextOfferings, majorIds: nextOfferings.map((o) => o.majorId) }
          : u,
      ),
    );
  }

  function patchLocalPrice(majorId: string, universityId: string, stageId: string, costUsd: number | null, remove = false) {
    setPrices((list) => {
      const i = list.findIndex(
        (r) => r.majorId === majorId && r.universityId === universityId && r.stageId === stageId,
      );
      if (remove) return i >= 0 ? list.filter((_, idx) => idx !== i) : list;
      if (i >= 0) {
        const next = list.slice();
        next[i] = { ...next[i], costUsd };
        return next;
      }
      return [...list, { majorId, universityId, stageId, costUsd }];
    });
  }

  async function persistOfferings(uni: UniRow, next: Offering[]) {
    const prev = offeringsOf(uni);
    patchLocalUni(uni.id, next);
    try {
      await api(`/admin/universities/${uni.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ offerings: next }),
      });
    } catch (err) {
      patchLocalUni(uni.id, prev);
      setBanner(err instanceof ApiError ? err.message : 'تعذر تحديث التخصصات');
      throw err;
    }
  }

  async function savePrice(majorId: string, stageId: string, costUsd: number) {
    if (!selected) return;
    const key = `${majorId}:${selected.id}:${stageId}`;
    const prev = priceMap.get(key);
    setSavingKey(key);
    setBanner('');
    patchLocalPrice(majorId, selected.id, stageId, costUsd);
    patchLocalUni(
      selected.id,
      selectedOfferings.map((o) =>
        o.majorId === majorId ? { ...o, stageIds: [...new Set([...o.stageIds, stageId])] } : o,
      ),
    );
    try {
      await api('/admin/prices', {
        method: 'POST',
        body: JSON.stringify({ majorId, universityId: selected.id, stageId, costUsd }),
      });
    } catch (err) {
      patchLocalPrice(majorId, selected.id, stageId, prev ?? null, prev == null);
      setBanner(err instanceof ApiError ? err.message : 'تعذر حفظ السعر');
    } finally {
      setSavingKey('');
    }
  }

  async function removeStage(majorId: string, stageId: string) {
    if (!selected) return;
    const key = `${majorId}:${selected.id}:${stageId}`;
    setSavingKey(key);
    setBanner('');
    const next = selectedOfferings.map((o) =>
      o.majorId === majorId ? { ...o, stageIds: o.stageIds.filter((id) => id !== stageId) } : o,
    );
    try {
      await persistOfferings(selected, next);
      patchLocalPrice(majorId, selected.id, stageId, null, true);
    } catch {
      /* persistOfferings already set banner */
    } finally {
      setSavingKey('');
    }
  }

  async function addMajor(majorId: string) {
    if (!selected) return;
    if (selectedOfferings.some((o) => o.majorId === majorId)) return;
    setBusy(true);
    setBanner('');
    try {
      await persistOfferings(selected, [...selectedOfferings, { majorId, stageIds: [] }]);
    } finally {
      setBusy(false);
    }
  }

  async function removeMajor(majorId: string) {
    if (!selected) return;
    setBusy(true);
    setBanner('');
    try {
      await persistOfferings(
        selected,
        selectedOfferings.filter((o) => o.majorId !== majorId),
      );
      setPrices((list) => list.filter((p) => !(p.universityId === selected.id && p.majorId === majorId)));
    } finally {
      setBusy(false);
    }
  }

  function resetLogoPicker() {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(null);
    setLogoPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  function startAdd() {
    setEditing(null);
    setForm(emptyIdentity(countryId || countries[0]?.id || ''));
    setFormError('');
    resetLogoPicker();
    setIdentityOpen(true);
  }

  function startEdit(row: UniRow) {
    setEditing(row);
    setForm({
      countryId: row.countryId,
      labelAr: row.labelAr,
      labelEn: row.labelEn,
      logoUrl: row.logoUrl || '',
      isActive: row.isActive !== false,
    });
    setFormError('');
    resetLogoPicker();
    setIdentityOpen(true);
  }

  function onPickLogo(file: File | undefined) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFormError('حجم الصورة أكبر من 5 ميغابايت');
      return;
    }
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setFormError('');
  }

  async function saveIdentity(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {
        countryId: form.countryId,
        labelAr: form.labelAr.trim(),
        labelEn: form.labelEn.trim(),
        isActive: form.isActive,
      };
      if (!hideCatalogImages) {
        let logoUrl = form.logoUrl.trim() || null;
        if (logoFile) {
          const body = new FormData();
          body.append('file', logoFile);
          const uploaded = await apiUpload<{ url: string }>('/admin/universities/image', body);
          logoUrl = uploaded.url;
        }
        payload.logoUrl = logoUrl;
      }
      if (editing) {
        await api(`/admin/universities/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
        setSelectedId(editing.id);
      } else {
        const created = await api<UniRow>('/admin/universities', {
          method: 'POST',
          body: JSON.stringify({ ...payload, offerings: [] }),
        });
        if (created?.id) setSelectedId(created.id);
      }
      setIdentityOpen(false);
      resetLogoPicker();
      await load();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'تعذر الحفظ');
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await api(`/admin/universities/${pendingDelete.id}`, { method: 'DELETE' });
      setPendingDelete(null);
      if (selectedId === pendingDelete.id) setSelectedId('');
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(row: UniRow) {
    await api(`/admin/universities/${row.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !row.isActive }),
    });
    setUniversities((list) => list.map((r) => (r.id === row.id ? { ...r, isActive: !r.isActive } : r)));
  }

  return (
    <>
      <LoadingOverlay show={loading || busy} />

      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-cairo text-2xl font-black text-amber">الجامعات والأسعار</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-teal/15 px-3 py-1 text-xs text-teal">{stats.priced} مرحلة مفعّلة</span>
          <button className="rounded-xl bg-amber px-4 py-2.5 font-cairo font-bold text-ink" onClick={startAdd}>
            إضافة جامعة
          </button>
        </div>
      </div>

      <div className="mb-5 rounded-2xl bg-ink-2 px-4 py-3">
        <Pills
          nowrap
          value={countryId}
          onChange={setCountryId}
          items={[
            { id: '', label: 'كل الدول' },
            ...countries.map((c) => ({
              id: c.id,
              label: c.labelAr,
              icon: <Flag iso2={c.iso2} size={16} />,
            })),
          ]}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="relative min-h-[240px] lg:min-h-0">
        <aside className="flex h-full flex-col overflow-hidden rounded-2xl bg-ink-2 p-3 lg:absolute lg:inset-0">
          <div className="shrink-0">
            <SearchField value={query} onChange={setQuery} placeholder="ابحث عن دولة أو جامعة..." />
          </div>
          <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-auto p-0.5">
            {groups.length === 0 ? (
              <p className="px-2 py-10 text-center text-sm text-slate">لا توجد جامعات مطابقة.</p>
            ) : (
              groups.map(({ country, universities: list }) => (
                <div key={country.id}>
                  {!countryId ? (
                    <div className="mb-1.5 flex items-center gap-2 px-1 text-xs text-slate">
                      <Flag iso2={country.iso2} size={14} />
                      {country.labelAr}
                    </div>
                  ) : null}
                  <div className="space-y-1">
                    {list.map((uni) => {
                      const active = uni.id === selectedId;
                      return (
                        <button
                          key={uni.id}
                          type="button"
                          onClick={() => setSelectedId(uni.id)}
                          className={`flex w-full items-center gap-3 rounded-xl border-0 px-2.5 py-2 text-right transition-colors ${
                            active
                              ? 'bg-amber/15'
                              : 'hover:bg-ink-3'
                          } ${uni.isActive ? '' : 'opacity-55'}`}
                        >
                          <UniversityLogo src={uni.logoUrl} size={36} />
                          <div className="min-w-0 flex-1 truncate text-sm font-bold">{uni.labelAr}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
        </div>

        <section className="min-w-0 rounded-2xl bg-ink-2 p-4 sm:p-6">
          {!selected ? (
            <div className="py-20 text-center">
              <p className="text-slate">أضف جامعة للبدء، أو اختر واحدة من القائمة.</p>
              <button className="mt-4 rounded-xl bg-amber px-4 py-2 font-bold text-ink" onClick={startAdd}>
                إضافة جامعة
              </button>
            </div>
          ) : (
            <motion.div
              key={selected.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.16 }}
            >
              <header className="mb-5 flex flex-wrap items-start gap-4">
                <UniversityLogo src={selected.logoUrl} size={64} />
                <div className="min-w-0 flex-1">
                  <h2 className="flex flex-wrap items-center gap-2 font-cairo text-2xl font-black">
                    {selected.labelAr}
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-3 px-2.5 py-1 text-xs font-bold text-paper">
                      <Flag iso2={selectedCountry?.iso2 || selected.country?.iso2} size={14} />
                      {selectedCountry?.labelAr || selected.country?.labelAr}
                    </span>
                  </h2>
                  <p className="mt-0.5 text-sm text-slate">{selected.labelEn}</p>
                  {!selected.isActive ? (
                    <span className="mt-2 inline-flex rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-slate">غير مفعلة</span>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-left">
                    <div className="font-cairo text-2xl font-black text-amber">{selectedCov.priced}</div>
                    <div className="text-xs text-slate">مراحل مفعّلة</div>
                  </div>
                  <Toggle
                    checked={!!selected.isActive}
                    onChange={() => toggleActive(selected)}
                    label={selected.isActive ? 'مفعّلة' : 'غير مفعلة'}
                  />
                  <IconButton icon="edit" label="تعديل البيانات" onClick={() => startEdit(selected)} />
                  <IconButton icon="delete" label="حذف" tone="danger" onClick={() => setPendingDelete(selected)} />
                </div>
              </header>

              {banner ? <p className="mb-4 text-sm text-danger">{banner}</p> : null}

              <div className="mb-4">
                <AddMajorSelect
                  majors={majors}
                  addedIds={selectedOfferings.map((o) => o.majorId)}
                  onAdd={addMajor}
                />
              </div>

              {selectedMajors.length === 0 ? (
                <div className="rounded-2xl bg-ink-3 px-4 py-14 text-center text-slate">
                  هذه الجامعة بلا تخصصات بعد. ابحث عن تخصص أعلاه ثم اضغط إضافة.
                </div>
              ) : stages.length === 0 ? (
                <div className="rounded-2xl bg-ink-3 px-4 py-10 text-center text-slate">
                  أضف مراحل دراسية من صفحة المراحل أولًا حتى يظهر جدول الأسعار.
                </div>
              ) : (
                <div className="overflow-auto rounded-2xl">
                  <table className="w-full min-w-[640px] border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className="sticky right-0 top-0 z-[3] whitespace-nowrap border-b border-line bg-ink-2 px-2.5 py-3 text-right font-cairo font-extrabold text-amber">
                          التخصص
                        </th>
                        {stages.map((stage) => (
                          <th
                            key={stage.id}
                            className="sticky top-0 z-[2] whitespace-nowrap border-b border-line bg-ink-2 px-2.5 py-3 text-center font-cairo font-extrabold text-amber"
                          >
                            <div>
                              {stage.labelAr}
                            </div>
                            <div className="mx-auto mt-1 w-fit rounded-full bg-amber/10 px-2.5 py-0.5 text-[11px] font-bold text-amber">
                              {stage.years} سنوات
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedMajors.map((major) => {
                        return (
                          <tr key={major.id} className="hover:[&>td]:bg-white/[0.03] hover:[&>th]:bg-white/[0.03]">
                            <th className="sticky right-0 z-[1] min-w-[220px] border-b border-line bg-ink-2 px-2.5 py-3 text-right font-bold text-paper">
                              <div className="flex items-center gap-2">
                                <IconButton
                                  icon="delete"
                                  label="حذف التخصص"
                                  tone="danger"
                                  onClick={() => setPendingRemoveMajor(major)}
                                />
                                <div className="font-bold">{major.labelAr}</div>
                              </div>
                            </th>
                            {stages.map((stage) => {
                              const key = `${major.id}:${selected.id}:${stage.id}`;
                              const cost = priceMap.get(key);
                              const active = cost != null;
                              return (
                                <td key={stage.id} className="min-w-[148px] border-b border-line px-2.5 py-3 text-center align-middle">
                                  <PriceCell
                                    cost={active ? cost : null}
                                    offered={active}
                                    busy={savingKey === key}
                                    onSave={(value) => savePrice(major.id, stage.id, value)}
                                    onRemove={() => removeStage(major.id, stage.id)}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </section>
      </div>

      <Modal
        open={identityOpen}
        title={editing ? 'تعديل بيانات الجامعة' : 'إضافة جامعة'}
        onClose={() => setIdentityOpen(false)}
      >
        <form onSubmit={saveIdentity} className="space-y-4">
          <div>
            <label>الدولة</label>
            <Select
              value={form.countryId}
              options={countries.map((c) => ({
                value: c.id,
                label: c.labelAr,
                icon: <Flag iso2={c.iso2} size={18} />,
              }))}
              onChange={(v) => setForm((s) => ({ ...s, countryId: v }))}
            />
          </div>
          {!hideCatalogImages ? (
            <div>
              <label>صورة الجامعة</label>
              <div className="flex items-center gap-4">
                <UniversityLogo src={logoPreview || form.logoUrl} size={72} />
                <div className="min-w-0 space-y-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => onPickLogo(e.target.files?.[0])}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-xl bg-ink-3 px-4 py-2 text-sm font-bold"
                      onClick={() => fileRef.current?.click()}
                    >
                      رفع صورة
                    </button>
                    {logoPreview || form.logoUrl ? (
                      <button
                        type="button"
                        className="rounded-xl bg-ink-3 px-4 py-2 text-sm"
                        onClick={() => {
                          resetLogoPicker();
                          setForm((s) => ({ ...s, logoUrl: '' }));
                        }}
                      >
                        إزالة
                      </button>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-slate">JPG أو PNG أو WebP، حتى 5 ميغابايت</p>
                </div>
              </div>
            </div>
          ) : null}
          <div>
            <label>الاسم بالعربي</label>
            <input
              required
              value={form.labelAr}
              onChange={(e) => setForm((s) => ({ ...s, labelAr: e.target.value }))}
            />
          </div>
          <div>
            <label>الاسم بالإنجليزي</label>
            <input
              required
              value={form.labelEn}
              onChange={(e) => setForm((s) => ({ ...s, labelEn: e.target.value }))}
            />
          </div>
          <Toggle
            checked={form.isActive}
            onChange={(v) => setForm((s) => ({ ...s, isActive: v }))}
            label={form.isActive ? 'مفعّلة للطلاب' : 'غير مفعلة'}
          />
          {formError ? <p className="text-sm text-danger">{formError}</p> : null}
          <div className="flex gap-2 pt-1">
            <button className="rounded-xl bg-amber px-5 py-2.5 font-bold text-ink" type="submit">
              {editing ? 'حفظ' : 'إنشاء والمتابعة'}
            </button>
            <button
              type="button"
              className="rounded-xl bg-ink-3 px-5 py-2.5"
              onClick={() => setIdentityOpen(false)}
            >
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={!!pendingRemoveMajor} title="إزالة التخصص" onClose={() => setPendingRemoveMajor(null)}>
        <p className="mb-5 leading-7 text-slate">
          إزالة <span className="font-bold text-paper">{pendingRemoveMajor?.labelAr}</span> من هذه الجامعة ستحذف مراحلها وأسعارها هنا.
        </p>
        <div className="flex gap-2">
          <button
            className="rounded-xl bg-danger px-4 py-2 font-bold text-paper"
            onClick={async () => {
              if (!pendingRemoveMajor) return;
              const id = pendingRemoveMajor.id;
              setPendingRemoveMajor(null);
              await removeMajor(id);
            }}
          >
            إزالة
          </button>
          <button className="rounded-xl bg-ink-3 px-4 py-2" onClick={() => setPendingRemoveMajor(null)}>
            إلغاء
          </button>
        </div>
      </Modal>

      <Modal open={!!pendingDelete} title="حذف الجامعة" onClose={() => setPendingDelete(null)}>
        <p className="mb-5 leading-7 text-slate">
          هل تريد حذف <span className="font-bold text-paper">{pendingDelete?.labelAr}</span>؟ سيُحذف معها ربط التخصصات والأسعار.
        </p>
        <div className="flex gap-2">
          <button className="rounded-xl bg-danger px-4 py-2 font-bold text-paper" onClick={confirmDelete}>
            حذف
          </button>
          <button className="rounded-xl bg-ink-3 px-4 py-2" onClick={() => setPendingDelete(null)}>
            إلغاء
          </button>
        </div>
      </Modal>
    </>
  );
}

export default function UniversitiesPage() {
  return (
    <RequireAdmin>
      <Suspense fallback={<LoadingOverlay show />}>
        <UniversitiesWorkspace />
      </Suspense>
    </RequireAdmin>
  );
}
