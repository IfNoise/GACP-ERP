'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from './utils';

// ── Types ────────────────────────────────────────────────────────────────────

export interface ZoneNode {
  id: string;
  zone_code: string;
  zone_name: string;
  zone_type: string;
  is_active: boolean;
  current_occupancy?: number;
  capacity?: number | null;
  parent_zone_id?: string | null;
  sub_zones?: ZoneNode[];
}

export interface ZonePickerProps {
  /** Currently selected zone ID */
  value?: string | undefined;
  /** Fires with (id, zone) when user selects */
  onChange: (zoneId: string, zone: ZoneNode) => void;
  /** Hierarchical zone tree. Build from API response before passing. */
  zones?: ZoneNode[] | undefined;
  isLoading?: boolean | undefined;
  error?: string | null | undefined;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  /** Show occupancy bar next to each zone */
  showOccupancy?: boolean | undefined;
  className?: string | undefined;
}

// ── Constants ────────────────────────────────────────────────────────────────

const ZONE_TYPE_COLORS: Record<string, string> = {
  CULTIVATION: 'bg-green-100 text-green-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  STORAGE: 'bg-amber-100 text-amber-800',
  UTILITY: 'bg-slate-100 text-slate-700',
  OFFICE: 'bg-purple-100 text-purple-800',
  QUARANTINE: 'bg-red-100 text-red-800',
};

function zoneTypeBadgeClass(zoneType: string): string {
  return ZONE_TYPE_COLORS[zoneType] ?? 'bg-slate-100 text-slate-600';
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Flatten all nodes in a tree to a dict for quick lookup by ID */
function flattenZoneTree(
  nodes: ZoneNode[],
  result: Record<string, ZoneNode> = {},
): Record<string, ZoneNode> {
  for (const node of nodes) {
    result[node.id] = node;
    if (node.sub_zones?.length) flattenZoneTree(node.sub_zones, result);
  }
  return result;
}

/** Check if a node or any of its descendants matches the search query */
function nodeMatchesSearch(node: ZoneNode, q: string): boolean {
  if (!q) return true;
  const lq = q.toLowerCase();
  if (node.zone_name.toLowerCase().includes(lq)) return true;
  if (node.zone_code.toLowerCase().includes(lq)) return true;
  if (node.sub_zones?.some((c) => nodeMatchesSearch(c, q))) return true;
  return false;
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface OccupancyBarProps {
  occupancy: number;
  capacity: number | null | undefined;
}

function OccupancyBar({ occupancy, capacity }: OccupancyBarProps) {
  if (!capacity) return null;
  const pct = Math.min(100, Math.round((occupancy / capacity) * 100));
  const barColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-green-500';
  return (
    <span className="ml-2 flex items-center gap-1 text-xs text-slate-500">
      <span className="inline-block w-14 h-1.5 rounded-full bg-slate-200 overflow-hidden">
        <span className={cn('block h-full rounded-full', barColor)} style={{ width: `${pct}%` }} />
      </span>
      <span>
        {occupancy}/{capacity}
      </span>
    </span>
  );
}

interface ZoneTreeNodeProps {
  node: ZoneNode;
  depth: number;
  selected: string | undefined;
  expanded: Set<string>;
  searchQuery: string;
  showOccupancy: boolean;
  onSelect: (node: ZoneNode) => void;
  onToggleExpand: (id: string) => void;
}

function ZoneTreeNode({
  node,
  depth,
  selected,
  expanded,
  searchQuery,
  showOccupancy,
  onSelect,
  onToggleExpand,
}: ZoneTreeNodeProps) {
  const hasChildren = !!node.sub_zones?.length;
  const isExpanded = expanded.has(node.id);
  const isSelected = selected === node.id;

  if (searchQuery && !nodeMatchesSearch(node, searchQuery)) return null;

  const visibleChildren =
    hasChildren && isExpanded
      ? node.sub_zones!.filter((c) => nodeMatchesSearch(c, searchQuery))
      : [];

  return (
    <div>
      <button
        type="button"
        onClick={() => onSelect(node)}
        className={cn(
          'w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-sm text-left transition-colors',
          'hover:bg-green-50 focus:outline-none focus:bg-green-50',
          isSelected && 'bg-green-100 text-green-900 font-medium',
          !node.is_active && 'opacity-50',
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        {/* Expand / collapse toggle */}
        <span
          role="button"
          tabIndex={-1}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggleExpand(node.id);
          }}
          className={cn(
            'shrink-0 w-4 h-4 flex items-center justify-center rounded text-slate-400',
            hasChildren && 'hover:text-slate-700 cursor-pointer',
          )}
        >
          {hasChildren ? (
            <svg
              viewBox="0 0 16 16"
              className={cn('w-3 h-3 transition-transform', isExpanded && 'rotate-90')}
              fill="currentColor"
            >
              <path
                d="M6 4l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" className="w-2 h-2 text-slate-300" fill="currentColor">
              <circle cx="8" cy="8" r="2" />
            </svg>
          )}
        </span>

        {/* Zone info */}
        <span className="truncate flex-1">{node.zone_name}</span>

        <span className="shrink-0 text-xs font-mono text-slate-400">{node.zone_code}</span>

        <span
          className={cn(
            'shrink-0 px-1.5 py-0.5 rounded text-xs font-medium',
            zoneTypeBadgeClass(node.zone_type),
          )}
        >
          {node.zone_type}
        </span>

        {showOccupancy && node.current_occupancy !== undefined && (
          <OccupancyBar occupancy={node.current_occupancy} capacity={node.capacity} />
        )}
      </button>

      {/* Recursively render children */}
      {isExpanded &&
        visibleChildren.map((child) => (
          <ZoneTreeNode
            key={child.id}
            node={child}
            depth={depth + 1}
            selected={selected}
            expanded={expanded}
            searchQuery={searchQuery}
            showOccupancy={showOccupancy}
            onSelect={onSelect}
            onToggleExpand={onToggleExpand}
          />
        ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ZonePicker({
  value,
  onChange,
  zones = [],
  isLoading = false,
  error = null,
  placeholder = 'Выбрать зону…',
  disabled = false,
  showOccupancy = false,
  className,
}: ZonePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Flatten tree for quick ID → node lookup
  const flatMap = flattenZoneTree(zones);
  const selectedZone = value ? flatMap[value] : undefined;

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleSelect = useCallback(
    (node: ZoneNode) => {
      onChange(node.id, node);
      setOpen(false);
      setSearch('');
    },
    [onChange],
  );

  // Auto-expand all top-level nodes when search is active
  useEffect(() => {
    if (search) {
      setExpanded(new Set(zones.map((z) => z.id)));
    }
  }, [search, zones]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  // Focus search on open
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  const hasResult = zones.some((z) => nodeMatchesSearch(z, search));

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled || isLoading}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md border text-sm',
          'bg-white cursor-pointer transition-colors',
          open
            ? 'border-green-500 ring-1 ring-green-500'
            : 'border-slate-300 hover:border-slate-400',
          (disabled || isLoading) && 'opacity-60 cursor-not-allowed bg-slate-50',
          error && 'border-red-400',
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {isLoading ? (
          <span className="text-slate-400">Загрузка зон…</span>
        ) : selectedZone ? (
          <span className="flex items-center gap-2 truncate">
            <span
              className={cn(
                'shrink-0 px-1.5 py-0.5 rounded text-xs font-medium',
                zoneTypeBadgeClass(selectedZone.zone_type),
              )}
            >
              {selectedZone.zone_type}
            </span>
            <span className="truncate">{selectedZone.zone_name}</span>
            <span className="shrink-0 text-xs font-mono text-slate-400">
              {selectedZone.zone_code}
            </span>
          </span>
        ) : (
          <span className="text-slate-400">{placeholder}</span>
        )}

        {/* Chevron */}
        <svg
          viewBox="0 0 16 16"
          className={cn(
            'shrink-0 w-4 h-4 text-slate-400 transition-transform',
            open && 'rotate-180',
          )}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        >
          <path d="M3 6l5 4 5-4" />
        </svg>
      </button>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {/* Dropdown panel */}
      {open && (
        <div
          className={cn(
            'absolute z-50 mt-1 w-full min-w-[280px] rounded-md border border-slate-200',
            'bg-white shadow-lg overflow-hidden',
          )}
          role="listbox"
        >
          {/* Search */}
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <circle cx="6.5" cy="6.5" r="4" />
                <path d="M10.5 10.5l3 3" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск зон…"
                className={cn(
                  'w-full pl-7 pr-3 py-1.5 text-sm rounded border border-slate-200',
                  'focus:outline-none focus:border-green-500',
                )}
              />
            </div>
          </div>

          {/* Zone tree */}
          <div className="max-h-64 overflow-y-auto p-1.5">
            {isLoading ? (
              <p className="py-6 text-center text-sm text-slate-400">Загрузка…</p>
            ) : zones.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">Нет доступных зон</p>
            ) : !hasResult ? (
              <p className="py-6 text-center text-sm text-slate-400">
                Зоны не найдены по запросу «{search}»
              </p>
            ) : (
              zones.map((zone) =>
                nodeMatchesSearch(zone, search) ? (
                  <ZoneTreeNode
                    key={zone.id}
                    node={zone}
                    depth={0}
                    selected={value}
                    expanded={expanded}
                    searchQuery={search}
                    showOccupancy={showOccupancy}
                    onSelect={handleSelect}
                    onToggleExpand={toggleExpand}
                  />
                ) : null,
              )
            )}
          </div>

          {/* Clear selection footer */}
          {value && (
            <div className="border-t border-slate-100 px-2 py-1.5">
              <button
                type="button"
                onClick={() => {
                  onChange('', {} as ZoneNode);
                  setOpen(false);
                }}
                className="w-full text-xs text-slate-500 hover:text-red-600 py-1 rounded hover:bg-red-50 transition-colors"
              >
                Снять выбор
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
