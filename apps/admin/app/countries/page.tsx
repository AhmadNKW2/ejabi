'use client';

import { CatalogCountry, WORLD_COUNTRIES, flagUrl } from '@ejabi/shared';
import { CatalogManager } from '@/components/CatalogManager';
import { Flag } from '@/components/Flag';
import { RequireAdmin } from '@/components/RequireAdmin';

export default function CountriesPage() {
  return (
    <RequireAdmin>
      <CatalogManager<CatalogCountry>
        title="الدول"
        path="/admin/countries"
        showStatusFilter={false}
        fields={[
          {
            key: 'iso2',
            label: 'الدولة',
            type: 'select',
            options: WORLD_COUNTRIES.map((c) => ({
              value: c.iso2,
              label: c.labelAr,
              icon: <img src={flagUrl(c.iso2, 40)} alt="" className="h-4 w-6 rounded-sm object-cover" />,
            })),
          },
          { key: 'labelAr', label: 'الاسم', type: 'text' },
        ]}
        defaults={{ isActive: true }}
        onFieldChange={(key, value, setForm) => {
          if (key !== 'iso2') return;
          const c = WORLD_COUNTRIES.find((x) => x.iso2 === value);
          if (c) setForm((s) => ({ ...s, iso2: c.iso2, labelAr: c.labelAr, labelEn: c.labelEn }));
        }}
        toForm={(r) => ({
          iso2: r.iso2 || '',
          labelAr: r.labelAr,
          labelEn: r.labelEn,
          isActive: r.isActive,
        })}
        fromForm={(f) => ({
          iso2: f.iso2,
          labelAr: f.labelAr,
          labelEn: f.labelEn || f.labelAr,
          isActive: f.isActive !== false,
        })}
        renderItem={(r) => (
          <div className="flex items-center gap-3">
            <Flag iso2={r.iso2} />
            <div className="font-bold">{r.labelAr}</div>
          </div>
        )}
      />
    </RequireAdmin>
  );
}
