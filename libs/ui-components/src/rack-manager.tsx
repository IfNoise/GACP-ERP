'use client';

import { useState } from 'react';
import { cn } from './utils';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RackManagerTray {
  id: string;
  tray_code: string;
  tray_size: string;
  shelf_index: number;
  position_index: number;
  plant_capacity?: number | null;
  occupied_slots: number;
  qr_code?: string | null;
}

export interface RackManagerShelf {
  id: string;
  shelf_index: number;
  trays: RackManagerTray[];
}

export interface RackManagerRack {
  id: string;
  rack_code: string;
  rack_type: string;
  shelf_count: number;
  row_position?: number | null;
  column_position?: number | null;
  shelves: RackManagerShelf[];
}

export interface CreateRackDto {
  rack_code?: string | undefined;
  rack_type: string;
  shelf_count: number;
  row_position?: number | undefined;
  column_position?: number | undefined;
  max_tray_capacity?: number | undefined;
}

export interface CreateTrayDto {
  shelf_index: number;
  position_index: number;
  tray_code: string;
  tray_size: string;
  plant_capacity?: number | undefined;
}

export interface RackManagerProps {
  racks: RackManagerRack[];
  isLoading?: boolean | undefined;
  error?: string | null | undefined;
  canEdit?: boolean | undefined;
  onCreate?: ((dto: CreateRackDto) => void | Promise<void>) | undefined;
  onDelete?: ((rackId: string) => void | Promise<void>) | undefined;
  onCreateTray?: ((rackId: string, dto: CreateTrayDto) => void | Promise<void>) | undefined;
  onDeleteTray?: ((trayId: string) => void | Promise<void>) | undefined;
  className?: string | undefined;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RACK_TYPE_SHELF_DEFAULTS: Record<string, number> = {
  '1-shelf': 1,
  '2-shelf': 2,
  '3-shelf': 3,
  custom: 2,
};

const RACK_TYPE_LABELS: Record<string, string> = {
  '1-shelf': '1 полка',
  '2-shelf': '2 полки',
  '3-shelf': '3 полки',
  custom: 'Кастом',
};

const TRAY_SIZE_COLORS: Record<string, string> = {
  small: 'bg-blue-50 border-blue-300',
  medium: 'bg-purple-50 border-purple-300',
  large: 'bg-orange-50 border-orange-300',
  custom: 'bg-gray-50 border-gray-300',
};

// ─── AddRack Dialog ───────────────────────────────────────────────────────────

interface AddRackDialogProps {
  onClose: () => void;
  onSubmit: (dto: CreateRackDto) => void | Promise<void>;
}

function AddRackDialog({ onClose, onSubmit }: AddRackDialogProps) {
  const [rackType, setRackType] = useState('2-shelf');
  const [shelfCount, setShelfCount] = useState(2);
  const [rackCode, setRackCode] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('');
  const [rowPos, setRowPos] = useState('');
  const [colPos, setColPos] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRackTypeChange = (t: string) => {
    setRackType(t);
    const def = RACK_TYPE_SHELF_DEFAULTS[t];
    if (def !== undefined) setShelfCount(def);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({
        rack_code: rackCode.trim() || undefined,
        rack_type: rackType,
        shelf_count: shelfCount,
        row_position: rowPos ? parseInt(rowPos, 10) : undefined,
        column_position: colPos ? parseInt(colPos, 10) : undefined,
        max_tray_capacity: maxCapacity ? parseInt(maxCapacity, 10) : undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogOverlay onClose={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Добавить стеллаж</h2>
        <div className="space-y-3">
          <Field label="Тип стеллажа">
            <select
              value={rackType}
              onChange={(e) => handleRackTypeChange(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(RACK_TYPE_LABELS).map(([val, label]) => (
                <option key={val} value={val}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Кол-во полок">
            <input
              type="number"
              min={1}
              max={20}
              value={shelfCount}
              onChange={(e) => setShelfCount(parseInt(e.target.value, 10) || 1)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>
          <Field label="Код стеллажа (авто, если пусто)">
            <input
              type="text"
              placeholder="R-001"
              value={rackCode}
              onChange={(e) => setRackCode(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Ряд (опц.)">
              <input
                type="number"
                min={0}
                placeholder="0"
                value={rowPos}
                onChange={(e) => setRowPos(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
            <Field label="Колонка (опц.)">
              <input
                type="number"
                min={0}
                placeholder="0"
                value={colPos}
                onChange={(e) => setColPos(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </Field>
          </div>
          <Field label="Макс. поддонов (опц.)">
            <input
              type="number"
              min={1}
              placeholder="—"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || shelfCount < 1}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Создание…' : 'Создать'}
          </button>
        </div>
      </div>
    </DialogOverlay>
  );
}

// ─── AddTray Dialog ───────────────────────────────────────────────────────────

interface AddTrayDialogProps {
  rackId: string;
  shelfIndex: number;
  onClose: () => void;
  onSubmit: (rackId: string, dto: CreateTrayDto) => void | Promise<void>;
}

function AddTrayDialog({ rackId, shelfIndex, onClose, onSubmit }: AddTrayDialogProps) {
  const [trayCode, setTrayCode] = useState('');
  const [traySize, setTraySize] = useState('medium');
  const [positionIndex, setPositionIndex] = useState('0');
  const [plantCapacity, setPlantCapacity] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!trayCode.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(rackId, {
        tray_code: trayCode.trim(),
        tray_size: traySize,
        shelf_index: shelfIndex,
        position_index: parseInt(positionIndex, 10) || 0,
        plant_capacity: plantCapacity ? parseInt(plantCapacity, 10) : undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogOverlay onClose={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Добавить поддон</h2>
        <p className="text-sm text-gray-500 mb-4">Полка {shelfIndex}</p>
        <div className="space-y-3">
          <Field label="Код поддона">
            <input
              type="text"
              placeholder="T-001"
              value={trayCode}
              onChange={(e) => setTrayCode(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </Field>
          <Field label="Размер">
            <select
              value={traySize}
              onChange={(e) => setTraySize(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="small">Малый</option>
              <option value="medium">Средний</option>
              <option value="large">Большой</option>
              <option value="custom">Кастом</option>
            </select>
          </Field>
          <Field label="Позиция на полке">
            <input
              type="number"
              min={0}
              value={positionIndex}
              onChange={(e) => setPositionIndex(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>
          <Field label="Вместимость растений (опц.)">
            <input
              type="number"
              min={1}
              placeholder="—"
              value={plantCapacity}
              onChange={(e) => setPlantCapacity(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !trayCode.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Создание…' : 'Добавить'}
          </button>
        </div>
      </div>
    </DialogOverlay>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function DialogOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

// ─── Tray slot ────────────────────────────────────────────────────────────────

interface TraySlotProps {
  tray: RackManagerTray;
  canEdit?: boolean | undefined;
  onDelete?: ((id: string) => void | Promise<void>) | undefined;
}

function TraySlot({ tray, canEdit, onDelete }: TraySlotProps) {
  const occupied = tray.occupied_slots > 0;
  const sizeClass = TRAY_SIZE_COLORS[tray.tray_size] ?? 'bg-gray-50 border-gray-300';

  return (
    <div
      className={cn(
        'group relative rounded border px-2 py-1 min-w-[56px] text-center',
        occupied ? 'bg-green-100 border-green-400' : sizeClass,
      )}
      title={`${tray.tray_code} (${tray.tray_size}) — ${tray.occupied_slots}/${tray.plant_capacity ?? '?'} растений`}
    >
      <span className="text-xs font-mono text-gray-700">{tray.tray_code}</span>
      {occupied && (
        <span className="block text-[10px] text-green-700 font-medium leading-none">
          {tray.occupied_slots}/{tray.plant_capacity ?? '?'}
        </span>
      )}
      {canEdit && !occupied && onDelete && (
        <button
          onClick={() => onDelete(tray.id)}
          className="absolute -top-1.5 -right-1.5 hidden group-hover:flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[9px] leading-none hover:bg-red-600"
          title="Удалить поддон"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ─── Rack card ────────────────────────────────────────────────────────────────

interface RackCardProps {
  rack: RackManagerRack;
  canEdit?: boolean | undefined;
  onDelete?: ((id: string) => void | Promise<void>) | undefined;
  onAddTray?: ((rackId: string, shelfIndex: number) => void) | undefined;
  onDeleteTray?: ((trayId: string) => void | Promise<void>) | undefined;
}

function RackCard({ rack, canEdit, onDelete, onAddTray, onDeleteTray }: RackCardProps) {
  const allEmpty = rack.shelves.every((s) => s.trays.every((t) => t.occupied_slots === 0));

  // Build shelf list (fill in empty shelves that have no trays yet)
  const shelfMap = new Map(rack.shelves.map((s) => [s.shelf_index, s]));
  const shelvesToShow: { shelf_index: number; trays: RackManagerTray[] }[] = [];
  for (let i = rack.shelf_count - 1; i >= 0; i--) {
    const shelf = shelfMap.get(i);
    shelvesToShow.push({ shelf_index: i, trays: shelf?.trays ?? [] });
  }

  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-gray-900">{rack.rack_code}</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
            {RACK_TYPE_LABELS[rack.rack_type] ?? rack.rack_type}
          </span>
          {(rack.row_position != null || rack.column_position != null) && (
            <span className="text-xs text-gray-400">
              [{rack.row_position ?? '—'}, {rack.column_position ?? '—'}]
            </span>
          )}
        </div>
        {canEdit && onDelete && (
          <button
            onClick={() => onDelete(rack.id)}
            disabled={!allEmpty}
            title={allEmpty ? 'Удалить стеллаж' : 'Поддоны с растениями нельзя удалить'}
            className="text-xs px-2 py-1 rounded text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Удалить
          </button>
        )}
      </div>

      {/* Shelves */}
      <div className="p-3 space-y-2">
        {shelvesToShow.map(({ shelf_index, trays }) => (
          <div key={shelf_index} className="flex items-center gap-2">
            <span className="w-6 text-right text-xs text-gray-400 shrink-0">S{shelf_index}</span>
            <div className="flex-1 flex items-center gap-1 flex-wrap min-h-[32px] bg-gray-50 rounded px-2 py-1">
              {trays
                .slice()
                .sort((a, b) => a.position_index - b.position_index)
                .map((tray) => (
                  <TraySlot key={tray.id} tray={tray} canEdit={canEdit} onDelete={onDeleteTray} />
                ))}
              {canEdit && onAddTray && (
                <button
                  onClick={() => onAddTray(rack.id, shelf_index)}
                  className="flex items-center justify-center w-8 h-8 rounded border border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500 text-lg leading-none shrink-0"
                  title="Добавить поддон"
                >
                  +
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RackManager({
  racks,
  isLoading,
  error,
  canEdit = false,
  onCreate,
  onDelete,
  onCreateTray,
  onDeleteTray,
  className,
}: RackManagerProps) {
  const [showAddRack, setShowAddRack] = useState(false);
  const [addTrayContext, setAddTrayContext] = useState<{
    rackId: string;
    shelfIndex: number;
  } | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        Загрузка стеллажей…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-32 text-red-500 text-sm">{error}</div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          Стеллажи <span className="ml-1 text-xs font-normal text-gray-400">({racks.length})</span>
        </h3>
        {canEdit && onCreate && (
          <button
            onClick={() => setShowAddRack(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            <span className="text-base leading-none">+</span> Стеллаж
          </button>
        )}
      </div>

      {/* Rack grid */}
      {racks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm gap-2">
          <span>Стеллажи не созданы</span>
          {canEdit && onCreate && (
            <button
              onClick={() => setShowAddRack(true)}
              className="text-blue-600 hover:underline text-xs"
            >
              Добавить первый стеллаж
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {racks.map((rack) => (
            <RackCard
              key={rack.id}
              rack={rack}
              canEdit={canEdit}
              onDelete={onDelete}
              onAddTray={
                onCreateTray
                  ? (rackId, shelfIndex) => setAddTrayContext({ rackId, shelfIndex })
                  : undefined
              }
              onDeleteTray={onDeleteTray}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      {showAddRack && onCreate && (
        <AddRackDialog onClose={() => setShowAddRack(false)} onSubmit={onCreate} />
      )}
      {addTrayContext && onCreateTray && (
        <AddTrayDialog
          rackId={addTrayContext.rackId}
          shelfIndex={addTrayContext.shelfIndex}
          onClose={() => setAddTrayContext(null)}
          onSubmit={onCreateTray}
        />
      )}
    </div>
  );
}
