'use client';

import { useEffect, useRef } from 'react';
import type { ZoneEntity } from './facility-viewer';

export interface ZoneHighlighterProps {
  /** The zone currently hovered */
  hoveredZone: ZoneEntity | null;
  /** Active alerts mapped by zone id */
  alertsByZone?: Record<string, string>;
  /** Anchor element for tooltip positioning */
  containerRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * ZoneHighlighter — renders a floating tooltip when the user hovers over a
 * zone in the 3D viewer, and pulsing glow indicators for zones with active alerts.
 */
export function ZoneHighlighter({ hoveredZone, alertsByZone, containerRef }: ZoneHighlighterProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Re-position tooltip near mouse (simplified: pinned to container centre)
  useEffect(() => {
    if (!tooltipRef.current || !containerRef.current) return;
    if (!hoveredZone) {
      tooltipRef.current.style.display = 'none';
      return;
    }
    tooltipRef.current.style.display = 'block';
  }, [hoveredZone, containerRef]);

  const alertZones = Object.entries(alertsByZone ?? {});

  return (
    <>
      {/* Hover tooltip */}
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute left-4 top-4 z-20 hidden max-w-xs rounded-lg bg-white/95 p-3 shadow-lg backdrop-blur"
      >
        {hoveredZone && (
          <>
            <p className="text-sm font-semibold text-gray-900">{hoveredZone.zone_name}</p>
            <p className="text-xs text-gray-500">
              {hoveredZone.zone_code} — {hoveredZone.zone_type}
            </p>
            {hoveredZone.occupancy != null && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Occupancy</span>
                  <span>{Math.round(hoveredZone.occupancy * 100)}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
                  <div
                    className="h-1.5 rounded-full bg-green-500 transition-all"
                    style={{ width: `${Math.min(hoveredZone.occupancy * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
            {hoveredZone.alert && (
              <p className="mt-2 text-xs font-medium text-red-600">⚠ {hoveredZone.alert}</p>
            )}
          </>
        )}
      </div>

      {/* Alert indicator badges */}
      {alertZones.length > 0 && (
        <div className="pointer-events-none absolute right-3 top-3 z-20 space-y-1">
          {alertZones.map(([zoneId, alert]) => (
            <div
              key={zoneId}
              className="animate-pulse rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-medium text-white shadow"
            >
              {alert}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
