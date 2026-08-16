'use client';

import { CatalogStage } from '@ejabi/shared';
import { CatalogManager } from '@/components/CatalogManager';
import { RequireAdmin } from '@/components/RequireAdmin';

export default function StagesPage() {
  return (
    <RequireAdmin>
      <CatalogManager<CatalogStage>
        title="المراحل الدراسية"
        path="/admin/stages"
        fields={[
          { key: 'labelAr', label: 'الاسم بالعربي', type: 'text' },
          { key: 'labelEn', label: 'الاسم بالإنجليزي', type: 'text' },
          { key: 'icon', label: 'الأيقونة', type: 'icon' },
          { key: 'years', label: 'عدد السنوات', type: 'number', step: '1' },
        ]}
        defaults={{ icon: '🎓', years: '4', isActive: true }}
        toForm={(r) => ({
          labelAr: r.labelAr,
          labelEn: r.labelEn,
          icon: r.icon,
          years: String(r.years),
          isActive: r.isActive,
        })}
        fromForm={(f) => ({
          labelAr: f.labelAr,
          labelEn: f.labelEn,
          icon: f.icon || '🎓',
          years: Number(f.years),
          isActive: f.isActive !== false,
        })}
        renderItem={(r) => (
          <div className="flex items-center gap-3">
            <span className="text-xl">{r.icon}</span>
            <div>
              <div className="font-bold">{r.labelAr}</div>
              <div className="text-xs text-slate">{r.labelEn}</div>
            </div>
            <div className="mr-auto text-xs text-amber">{r.years} سنوات</div>
          </div>
        )}
      />
    </RequireAdmin>
  );
}
