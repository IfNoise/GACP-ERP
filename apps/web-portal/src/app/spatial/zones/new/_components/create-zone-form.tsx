'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreateZone, useZoneTree } from '@/hooks';
import { Button, ZonePicker, buttonVariants } from '@gacp-erp/ui-components';
import type { ZoneNode } from '@gacp-erp/ui-components';

const ZONE_TYPES = [
  { value: 'CULTIVATION', label: 'Культивирование' },
  { value: 'PROCESSING', label: 'Переработка' },
  { value: 'STORAGE', label: 'Хранение' },
  { value: 'UTILITY', label: 'Технический' },
  { value: 'OFFICE', label: 'Офис' },
  { value: 'QUARANTINE', label: 'Карантин' },
] as const;

export function CreateZoneForm() {
  const router = useRouter();
  const create = useCreateZone();
  const { data: zoneTree, isLoading: zonesLoading } = useZoneTree();

  const [form, setForm] = useState({
    zone_name: '',
    zone_type: 'CULTIVATION',
    area_sqm: '',
    capacity: '',
    parent_zone_id: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: string, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.zone_name.trim().length < 2) e['zone_name'] = 'Минимум 2 символа';
    if (!form.area_sqm || Number(form.area_sqm) <= 0) e['area_sqm'] = 'Введите площадь > 0';
    if (!form.capacity || Number(form.capacity) < 1) e['capacity'] = 'Минимум 1';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    create.mutate(
      {
        zone_name: form.zone_name.trim(),
        zone_type: form.zone_type as (typeof ZONE_TYPES)[number]['value'],
        area_sqm: Number(form.area_sqm),
        capacity: Number(form.capacity),
        ...(form.parent_zone_id ? { parent_zone_id: form.parent_zone_id } : {}),
        ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
      },
      {
        onSuccess: (data) =>
          router.push(`/spatial/zones/${String((data as Record<string, unknown>)['id'])}`),
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/spatial/zones" className="text-sm text-gray-500 hover:text-gray-700">
          ← К списку зон
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Новая зона</h1>
        <p className="mt-1 text-sm text-gray-500">
          Код зоны генерируется автоматически (ZONE-XXXXXXXX)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card max-w-2xl">
        <div className="card-body space-y-4">
          {/* Name */}
          <div>
            <label className="label">
              Название зоны <span className="text-red-500">*</span>
            </label>
            <input
              className={`input w-full ${errors['zone_name'] ? 'border-red-400' : ''}`}
              placeholder="Например: Вегетационный зал №1"
              value={form.zone_name}
              onChange={(e) => set('zone_name', e.target.value)}
              required
            />
            {errors['zone_name'] && (
              <p className="mt-1 text-xs text-red-500">{errors['zone_name']}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="label">
              Тип зоны <span className="text-red-500">*</span>
            </label>
            <select
              className="input w-full"
              value={form.zone_type}
              onChange={(e) => set('zone_type', e.target.value)}
            >
              {ZONE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label} ({t.value})
                </option>
              ))}
            </select>
          </div>

          {/* Area + Capacity */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">
                Площадь (м²) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                className={`input w-full ${errors['area_sqm'] ? 'border-red-400' : ''}`}
                placeholder="50"
                value={form.area_sqm}
                onChange={(e) => set('area_sqm', e.target.value)}
                required
              />
              {errors['area_sqm'] && (
                <p className="mt-1 text-xs text-red-500">{errors['area_sqm']}</p>
              )}
            </div>
            <div>
              <label className="label">
                Ёмкость (макс. партий) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                className={`input w-full ${errors['capacity'] ? 'border-red-400' : ''}`}
                placeholder="10"
                value={form.capacity}
                onChange={(e) => set('capacity', e.target.value)}
                required
              />
              {errors['capacity'] && (
                <p className="mt-1 text-xs text-red-500">{errors['capacity']}</p>
              )}
            </div>
          </div>

          {/* Parent zone */}
          <div>
            <label className="label">Родительская зона (опционально)</label>
            <ZonePicker
              value={form.parent_zone_id || undefined}
              onChange={(id: string) => set('parent_zone_id', id)}
              zones={(zoneTree as ZoneNode[] | undefined) ?? []}
              isLoading={zonesLoading}
              placeholder="Выберите родительскую зону…"
            />
            {form.parent_zone_id && (
              <p className="mt-1 text-xs text-gray-500">Эта зона станет подзоной выбранной</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="label">Примечания</label>
            <textarea
              className="input w-full min-h-[80px] resize-y"
              placeholder="Любые дополнительные сведения о зоне…"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              maxLength={1000}
            />
          </div>

          {/* Error from server */}
          {create.isError && (
            <div className="rounded bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              Ошибка создания зоны. Попробуйте ещё раз.
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <Link href="/spatial/zones" className={buttonVariants({ variant: 'outline' })}>
            Отмена
          </Link>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Создание…' : 'Создать зону'}
          </Button>
        </div>
      </form>
    </div>
  );
}
