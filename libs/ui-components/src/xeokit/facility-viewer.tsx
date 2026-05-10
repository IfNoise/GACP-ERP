'use client';

import { useRef, useEffect, useImperativeHandle, forwardRef, useCallback, useState } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

/** Zone type → default color mapping (RGB 0-1) */
const ZONE_COLORS: Record<string, [number, number, number]> = {
  CULTIVATION: [0.2, 0.7, 0.2],
  PROCESSING: [0.2, 0.4, 0.8],
  STORAGE: [0.85, 0.65, 0.15],
  UTILITY: [0.5, 0.5, 0.5],
  OFFICE: [0.9, 0.9, 0.9],
  QUARANTINE: [0.8, 0.2, 0.2],
};

export interface ZoneEntity {
  id: string;
  zone_code: string;
  zone_name: string;
  zone_type: string;
  /** Optional 3D bounding box [x,y,z, width,height,depth] */
  bounds?: [number, number, number, number, number, number] | undefined;
  /** Occupancy 0-1 */
  occupancy?: number | undefined;
  is_active?: boolean | undefined;
  alert?: string | undefined;
}

export interface SensorReading {
  sensor_type: string;
  value: number;
  unit?: string | undefined;
  timestamp: number;
}

export interface FacilityViewerProps {
  /** Zone data to render */
  zones: ZoneEntity[];
  /** Active sensor data to overlay per zone */
  sensorData?: Record<string, SensorReading[]> | undefined;
  /** Called when user clicks a zone */
  onZoneClick?: ((zone: ZoneEntity) => void) | undefined;
  /** Called when user hovers over a zone */
  onZoneHover?: ((zone: ZoneEntity | null) => void) | undefined;
  /** Currently selected zone id */
  selectedZoneId?: string | undefined;
  /** CSS class for canvas wrapper */
  className?: string | undefined;
  /** Show zone labels */
  showLabels?: boolean | undefined;
  /** URL to a 3D building model (IFC/glTF/XKT) to load as background */
  modelUrl?: string | undefined;
  /** Format of the 3D model file */
  modelFormat?: 'ifc' | 'gltf' | 'xkt' | undefined;
  /** Enable zone marking mode: clicking scene surface creates a bounding box preview */
  editMode?: boolean | undefined;
  /** Called with [x,y,z,w,h,d] when user places a bounding box in editMode */
  onBoundsCreated?:
    | ((bounds: [number, number, number, number, number, number]) => void)
    | undefined;
}

export interface FacilityViewerHandle {
  resetView: () => void;
  flyToZone: (zoneId: string) => void;
  setLayerVisible: (layer: 'zones' | 'sensors' | 'labels', visible: boolean) => void;
}

// ── XeoKit lazy import types ───────────────────────────────────────────────────

type XeoKitModule = typeof import('@xeokit/xeokit-sdk');

/** Default box size (metres) placed on surface-click in editMode */
const DEFAULT_BOUNDS_SIZE: [number, number, number] = [2, 2, 2];

/**
 * FacilityViewer — main 3D canvas component backed by XeoKit SDK.
 *
 * Renders zones as color-coded boxes in a 3D scene. Optionally loads a 3D
 * building model (IFC/glTF/XKT) and supports zone-marking via bounding boxes.
 *
 * XeoKit is loaded lazily (dynamic import) to avoid SSR issues.
 */
export const FacilityViewer = forwardRef<FacilityViewerHandle, FacilityViewerProps>(
  function FacilityViewer(
    {
      zones,
      onZoneClick,
      onZoneHover,
      selectedZoneId,
      className,
      showLabels = true,
      modelUrl,
      modelFormat,
      editMode = false,
      onBoundsCreated,
    },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const viewerRef = useRef<InstanceType<XeoKitModule['Viewer']> | null>(null);
    const xeokitRef = useRef<XeoKitModule | null>(null);
    const meshesRef = useRef<Map<string, unknown>>(new Map());
    const previewMeshRef = useRef<unknown>(null);
    const [ready, setReady] = useState(false);

    // ── Initialise viewer once ───────────────────────────────────────────────

    useEffect(() => {
      if (!canvasRef.current) return;

      let destroyed = false;

      (async () => {
        const xeokit = await import('@xeokit/xeokit-sdk');
        if (destroyed) return;
        xeokitRef.current = xeokit;

        const canvasEl = canvasRef.current;
        if (!canvasEl) return;

        const viewer = new xeokit.Viewer({
          canvasId: canvasEl.id,
          transparent: true,
        });

        // Default camera position
        viewer.camera.eye = [20, 20, 20];
        viewer.camera.look = [0, 0, 0];
        viewer.camera.up = [0, 1, 0];

        // Orbit on left-drag, pan on middle-drag
        viewer.cameraControl.navMode = 'orbit';

        viewerRef.current = viewer;
        setReady(true);
      })();

      return () => {
        destroyed = true;
        if (viewerRef.current) {
          viewerRef.current.destroy();
          viewerRef.current = null;
        }
      };
    }, []);

    // ── Load 3D building model ───────────────────────────────────────────────

    useEffect(() => {
      const viewer = viewerRef.current;
      const xeokit = xeokitRef.current;
      if (!viewer || !xeokit || !ready || !modelUrl || !modelFormat) return;

      let loadedModel: { destroy(): void } | null = null;

      (async () => {
        try {
          if (modelFormat === 'ifc') {
            // Lazy load WebIFCLoaderPlugin + web-ifc WASM
            const [{ WebIFCLoaderPlugin }, WebIFC] = await Promise.all([
              import('@xeokit/xeokit-sdk'),
              import('web-ifc'),
            ]);
            const ifcAPI = new WebIFC.IfcAPI();
            // Load web-ifc WASM from CDN to ensure the .wasm is reachable
            // Expect the wasm to be served from Next.js `public/static/`.
            // Place `web-ifc.wasm` into `apps/web-portal/public/static/web-ifc.wasm`.
            ifcAPI.SetWasmPath('/static/', true);
            // Initialize using default locateFile; absolute wasm path above
            // ensures Emscripten will fetch `/static/web-ifc.wasm`.
            await ifcAPI.Init();
            const ifcLoader = new WebIFCLoaderPlugin(viewer, {
              WebIFC,
              IfcAPI: ifcAPI,
            } as unknown as import('@xeokit/xeokit-sdk').WebIFCLoaderPluginConfiguration);
            loadedModel = ifcLoader.load({
              id: 'building-model',
              src: modelUrl,
              edges: true,
            }) as { destroy(): void };
          } else if (modelFormat === 'xkt') {
            const { XKTLoaderPlugin } = await import('@xeokit/xeokit-sdk');
            const xktLoader = new XKTLoaderPlugin(viewer);
            loadedModel = xktLoader.load({
              id: 'building-model',
              src: modelUrl,
            }) as { destroy(): void };
          } else if (modelFormat === 'gltf') {
            const { GLTFLoaderPlugin } = await import('@xeokit/xeokit-sdk');
            const gltfLoader = new GLTFLoaderPlugin(viewer);
            loadedModel = gltfLoader.load({
              id: 'building-model',
              src: modelUrl,
            }) as { destroy(): void };
          }
        } catch (err) {
          console.error('[FacilityViewer] Failed to load building model:', err);
        }
      })();

      return () => {
        loadedModel?.destroy();
      };
    }, [ready, modelUrl, modelFormat]);

    // ── Render / update zones ────────────────────────────────────────────────

    useEffect(() => {
      const viewer = viewerRef.current;
      const xeokit = xeokitRef.current;
      if (!viewer || !xeokit || !ready) return;

      // Remove previous meshes
      meshesRef.current.forEach((mesh) => {
        try {
          (mesh as { destroy(): void }).destroy();
        } catch {
          /* ignore */
        }
      });
      meshesRef.current.clear();

      zones.forEach((zone, idx) => {
        const color = ZONE_COLORS[zone.zone_type] ?? [0.6, 0.6, 0.6];

        // Default grid placement if no explicit bounds
        const col = idx % 5;
        const row = Math.floor(idx / 5);
        const [x, y, z, w, h, d] = zone.bounds ?? [col * 6, 0, row * 6, 5, 3, 5];

        const mesh = new xeokit.Mesh(viewer.scene, {
          id: `zone-${zone.id}`,
          geometry: new xeokit.ReadableGeometry(viewer.scene, {
            ...xeokit.buildBoxGeometry({ xSize: w / 2, ySize: h / 2, zSize: d / 2 }),
          }),
          material: new xeokit.PhongMaterial(viewer.scene, {
            diffuse: color as unknown as number[],
            alpha: zone.is_active === false ? 0.3 : 0.65,
            emissive: zone.alert ? [0.4, 0, 0] : [0, 0, 0],
          }),
          position: [x + w / 2, y + h / 2, z + d / 2],
          pickable: true,
        });

        // Store zone payload on mesh for picking
        (mesh as unknown as Record<string, unknown>)['_zoneEntity'] = zone;

        meshesRef.current.set(zone.id, mesh);
      });

      // Camera fit
      viewer.cameraFlight.flyTo({ aabb: viewer.scene.aabb, duration: 0.5 });
    }, [zones, ready]);

    // ── Highlight selected zone ──────────────────────────────────────────────

    useEffect(() => {
      meshesRef.current.forEach((mesh, id) => {
        const m = mesh as { highlighted: boolean };
        m.highlighted = id === selectedZoneId;
      });
    }, [selectedZoneId]);

    // ── Click / hover handlers + editMode surface picking ───────────────────

    useEffect(() => {
      const viewer = viewerRef.current;
      const xeokit = xeokitRef.current;
      if (!viewer || !xeokit || !ready) return;

      const ctrl = viewer.cameraControl as unknown as {
        on: (event: string, handler: (e: Record<string, unknown>) => void) => number;
        off: (subId: number) => void;
      };

      const onPick = (e: { entity?: { id?: string } }) => {
        if (!e.entity?.id) return;
        const zoneId = e.entity.id.replace('zone-', '');
        const zone = zones.find((z) => z.id === zoneId);
        if (zone) onZoneClick?.(zone);
      };

      const onHover = (e: { entity?: { id?: string } }) => {
        if (!e.entity?.id) {
          onZoneHover?.(null);
          return;
        }
        const zoneId = e.entity.id.replace('zone-', '');
        const zone = zones.find((z) => z.id === zoneId);
        onZoneHover?.(zone ?? null);
      };

      const onPickedSurface = (e: Record<string, unknown>) => {
        if (!editMode || !onBoundsCreated) return;

        const worldPos = e['worldPos'] as [number, number, number] | undefined;
        if (!worldPos) return;

        const [wx, wy, wz] = worldPos;
        const [bw, bh, bd] = DEFAULT_BOUNDS_SIZE;
        const bounds: [number, number, number, number, number, number] = [wx, wy, wz, bw, bh, bd];

        // Remove previous preview
        if (previewMeshRef.current) {
          try {
            (previewMeshRef.current as { destroy(): void }).destroy();
          } catch {
            /* ignore */
          }
          previewMeshRef.current = null;
        }

        // Draw wireframe preview box
        previewMeshRef.current = new xeokit.Mesh(viewer.scene, {
          id: 'bounds-preview',
          geometry: new xeokit.ReadableGeometry(viewer.scene, {
            ...xeokit.buildBoxGeometry({ xSize: bw / 2, ySize: bh / 2, zSize: bd / 2 }),
          }),
          material: new xeokit.PhongMaterial(viewer.scene, {
            diffuse: [1, 1, 0],
            alpha: 0.3,
            wireframe: true,
          }),
          position: [wx + bw / 2, wy + bh / 2, wz + bd / 2],
          pickable: false,
        });

        onBoundsCreated(bounds);
      };

      const pickSub = ctrl.on('picked', onPick);
      const hoverSub = ctrl.on('hover', onHover);
      const surfaceSub = ctrl.on('pickedSurface', onPickedSurface);

      return () => {
        ctrl.off(pickSub);
        ctrl.off(hoverSub);
        ctrl.off(surfaceSub);
      };
    }, [zones, onZoneClick, onZoneHover, ready, editMode, onBoundsCreated]);

    // ── Clear preview when editMode turns off ────────────────────────────────

    useEffect(() => {
      if (!editMode && previewMeshRef.current) {
        try {
          (previewMeshRef.current as { destroy(): void }).destroy();
        } catch {
          /* ignore */
        }
        previewMeshRef.current = null;
      }
    }, [editMode]);

    // ── Imperative handle ────────────────────────────────────────────────────

    const resetView = useCallback(() => {
      const viewer = viewerRef.current;
      if (!viewer) return;
      viewer.cameraFlight.flyTo({ aabb: viewer.scene.aabb, duration: 0.8 });
    }, []);

    const flyToZone = useCallback((zoneId: string) => {
      const viewer = viewerRef.current;
      const mesh = meshesRef.current.get(zoneId);
      if (!viewer || !mesh) return;
      viewer.cameraFlight.flyTo({ aabb: (mesh as { aabb: number[] }).aabb, duration: 0.6 });
    }, []);

    const setLayerVisible = useCallback(
      (_layer: 'zones' | 'sensors' | 'labels', _visible: boolean) => {
        // Layer visibility is a future extension for multi-layer architecture
      },
      [],
    );

    useImperativeHandle(ref, () => ({ resetView, flyToZone, setLayerVisible }), [
      resetView,
      flyToZone,
      setLayerVisible,
    ]);

    // ── Render ───────────────────────────────────────────────────────────────

    return (
      <div className={`relative h-full w-full ${className ?? ''}`}>
        <canvas
          id="gacp-facility-canvas"
          ref={canvasRef}
          className="h-full w-full"
          style={{ touchAction: 'none' }}
        />

        {/* Edit mode indicator */}
        {editMode && ready && (
          <div className="pointer-events-none absolute left-3 top-3 rounded bg-yellow-400/90 px-3 py-1 text-xs font-semibold text-yellow-900 shadow">
            Zone Marking Mode — Click surface to place bounds
          </div>
        )}

        {/* Zone labels overlay */}
        {showLabels && ready && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {zones.map((z) => (
              <ZoneLabel key={z.id} zone={z} />
            ))}
          </div>
        )}
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80">
            <span className="animate-pulse text-gray-500">Loading 3D viewer...</span>
          </div>
        )}
      </div>
    );
  },
);

/** Simple 2D HTML label pinned to zone centre (positioned in grid order). */
function ZoneLabel({ zone }: { zone: ZoneEntity }) {
  // Without screen-space projection we position via CSS grid order
  return (
    <div
      className="absolute text-center text-[10px] font-medium text-gray-800 drop-shadow"
      style={{ display: 'none' }} // Hidden by default; enable via screen-space projection
    >
      {zone.zone_code}
    </div>
  );
}
