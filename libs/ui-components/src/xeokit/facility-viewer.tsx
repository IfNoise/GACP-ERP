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
  /** Optional 3D bounding box [x,y,z, width,height,depth] — used as fallback when no spaceId */
  bounds?: [number, number, number, number, number, number] | undefined;
  /** Occupancy 0-1 */
  occupancy?: number | undefined;
  is_active?: boolean | undefined;
  alert?: string | undefined;
  /**
   * XeoKit scene entity ID of the IfcSpace that represents this zone.
   * When set, the viewer colorizes the actual IFC room geometry instead of
   * rendering a placeholder box. Use onModelLoaded to discover available IDs.
   */
  spaceId?: string | undefined;
}

export interface SensorReading {
  sensor_type: string;
  value: number;
  unit?: string | undefined;
  timestamp: number;
}

/** Metadata about a space entity discovered in the loaded model */
export interface SpaceInfo {
  /** Scene entity ID — pass this as ZoneEntity.spaceId */
  id: string;
  name?: string | undefined;
  type: string;
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
  /**
   * Called after the 3D model finishes loading with all IfcSpace entities
   * found in the model. Use the returned ids as ZoneEntity.spaceId to bind
   * zones to real room geometry.
   */
  onModelLoaded?: ((spaces: SpaceInfo[]) => void) | undefined;
  /**
   * Enable space-mapping mode: clicking any scene entity fires onSpacePicked
   * instead of onZoneClick. Hovered entities are highlighted for feedback.
   */
  spaceMappingMode?: boolean | undefined;
  /** Called when user clicks a scene entity in spaceMappingMode */
  onSpacePicked?: ((entityId: string, name?: string) => void) | undefined;
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

type SceneObject = {
  colorize: number[] | null;
  opacity: number;
  highlighted: boolean;
  selected: boolean;
  pickable: boolean;
  aabb: number[];
  destroy(): void;
};

/**
 * FacilityViewer — 3D canvas backed by XeoKit SDK.
 *
 * Zone visualization strategy (in priority order):
 *  1. If zone.spaceId is set and the IFC model has that entity: colorize the
 *     real IfcSpace geometry from the model (no extra mesh created).
 *  2. Fallback: render a coloured box mesh using zone.bounds or a grid position.
 *
 * Use the onModelLoaded callback to discover IfcSpace entity IDs after loading,
 * then store them in your zone records as spaceId.
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
      onModelLoaded,
      spaceMappingMode = false,
      onSpacePicked,
    },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const viewerRef = useRef<InstanceType<XeoKitModule['Viewer']> | null>(null);
    const xeokitRef = useRef<XeoKitModule | null>(null);
    const meshesRef = useRef<Map<string, unknown>>(new Map());
    const ifcEntityMapRef = useRef<Map<string, string>>(new Map());
    const previewMeshRef = useRef<unknown>(null);
    const hoverHighlightRef = useRef<string | null>(null);
    /** Transparent proxy meshes created for IfcSpace entities that have no renderable geometry */
    const spaceProxyMeshesRef = useRef<Map<string, unknown>>(new Map());
    const onModelLoadedRef = useRef(onModelLoaded);
    const onSpacePickedRef = useRef(onSpacePicked);
    const [ready, setReady] = useState(false);
    /** Bumped each time a model finishes loading or is destroyed. */
    const [modelLoaded, setModelLoaded] = useState(false);

    // Keep callback ref stable across renders
    useEffect(() => {
      onModelLoadedRef.current = onModelLoaded;
      onSpacePickedRef.current = onSpacePicked;
    }, [onModelLoaded, onSpacePicked]);

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

        viewer.camera.eye = [20, 20, 20];
        viewer.camera.look = [0, 0, 0];
        viewer.camera.up = [0, 1, 0];
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

      let loadedModel: { destroy(): void; on(event: string, cb: () => void): void } | null = null;
      let cancelled = false;

      const onLoaded = () => {
        if (cancelled) return;
        setModelLoaded(true);

        // Collect IfcSpace entities from metaScene for caller discovery
        const meta = (viewer as unknown as Record<string, unknown>)['metaScene'] as
          | Record<
              string,
              { metaObjects: Record<string, { id: string; name?: string; type: string }> }
            >
          | null
          | undefined;
        if (meta && onModelLoadedRef.current) {
          const allMeta = Object.values(
            (
              meta as unknown as {
                metaObjects: Record<string, { id: string; name?: string; type: string }>;
              }
            ).metaObjects ?? {},
          );
          const spaces: SpaceInfo[] = allMeta
            .filter((mo) => mo.type === 'IfcSpace')
            .map((mo) => ({ id: mo.id, name: mo.name, type: mo.type }));
          onModelLoadedRef.current(spaces);
          console.log(
            `[FacilityViewer] Model loaded: ${spaces.length} IfcSpace discovered — proxy meshes: ${spaceProxyMeshesRef.current.size}`,
          );

          // Proxy meshes were created before model load (in the IFC async block)
          // with pickable=true. Ensure any that coincide with scene.objects are
          // also pickable (covers XKT/glTF where IfcSpace may have real geometry).
          const sceneObjects = (viewer.scene as unknown as Record<string, unknown>)['objects'] as
            | Record<string, SceneObject>
            | undefined;
          spaces.forEach((s) => {
            const ent = sceneObjects?.[s.id];
            if (ent) {
              try {
                ent.pickable = true;
                if (typeof ent.opacity === 'number' && ent.opacity === 0) ent.opacity = 0.2;
                ent.highlighted = false;
              } catch {
                /* ignore */
              }
            }
          });
        }
      };

      (async () => {
        try {
          if (modelFormat === 'ifc') {
            const [{ WebIFCLoaderPlugin, Mesh, ReadableGeometry, PhongMaterial }, WebIFC] =
              await Promise.all([import('@xeokit/xeokit-sdk'), import('web-ifc')]);

            // ── Pre-fetch IFC data to create IfcSpace proxy meshes ────────────────
            // XeoKit's WebIFC loader fails to render IfcSpace geometry (mesh type
            // 17778 unsupported).  We use a separate IfcAPI instance to extract
            // IfcSpace bounding volumes and create transparent, pickable XeoKit
            // Mesh placeholders so hover/pick work correctly in space-mapping mode.
            const ifcData = await fetch(modelUrl).then((r) => r.arrayBuffer());

            const spaceProxyApi = new WebIFC.IfcAPI();
            spaceProxyApi.SetWasmPath('/static/', true);
            await spaceProxyApi.Init();
            try {
              const IFCSPACE_TYPE = 3856911033; // IFC4 stable constant
              const proxyModelId = (
                spaceProxyApi as unknown as {
                  OpenModel(data: Uint8Array, opts?: Record<string, unknown>): number;
                }
              ).OpenModel(new Uint8Array(ifcData));

              const spaceExpressIds = (
                spaceProxyApi as unknown as {
                  GetLineIDsWithType(
                    modelId: number,
                    type: number,
                  ): { size(): number; get(i: number): number };
                }
              ).GetLineIDsWithType(proxyModelId, IFCSPACE_TYPE);

              const spaceCount = spaceExpressIds.size();
              console.log(`[FacilityViewer] IfcSpace proxy: ${spaceCount} express IDs found`);

              const metaForProxy = (viewer as unknown as Record<string, unknown>)['metaScene'] as
                | { metaObjects?: Record<string, { name?: string }> }
                | null
                | undefined;

              for (let i = 0; i < spaceCount; i++) {
                if (cancelled) break;
                const expressId = spaceExpressIds.get(i);

                let guid: string | undefined;
                try {
                  const line = (
                    spaceProxyApi as unknown as {
                      GetLine(
                        modelId: number,
                        expressId: number,
                        flatten: boolean,
                      ): Record<string, unknown>;
                    }
                  ).GetLine(proxyModelId, expressId, false);
                  guid = (line?.['GlobalId'] as Record<string, unknown>)?.['value'] as
                    | string
                    | undefined;
                } catch {
                  continue;
                }
                if (!guid) continue;

                // Collect actual boolean-resolved geometry + AABB from flat mesh
                let aabb: [number, number, number, number, number, number] | undefined;
                const meshPositions: number[] = [];
                const meshNormals: number[] = [];
                const meshIndices: number[] = [];
                let vertexOffset = 0;
                try {
                  const flatMesh = (
                    spaceProxyApi as unknown as {
                      GetFlatMesh(
                        modelId: number,
                        expressId: number,
                      ): {
                        geometries: {
                          size(): number;
                          get(i: number): {
                            geometryExpressID: number;
                            flatTransformation: number[];
                          };
                        };
                      } | null;
                    }
                  ).GetFlatMesh(proxyModelId, expressId);

                  if (flatMesh && flatMesh.geometries.size() > 0) {
                    let minX = Infinity,
                      minY = Infinity,
                      minZ = Infinity;
                    let maxX = -Infinity,
                      maxY = -Infinity,
                      maxZ = -Infinity;

                    for (let g = 0; g < flatMesh.geometries.size(); g++) {
                      const placedGeom = flatMesh.geometries.get(g);
                      const geometry = (
                        spaceProxyApi as unknown as {
                          GetGeometry(
                            modelId: number,
                            expressId: number,
                          ): {
                            GetVertexData(): number;
                            GetVertexDataSize(): number;
                            GetIndexData(): number;
                            GetIndexDataSize(): number;
                            delete(): void;
                          };
                        }
                      ).GetGeometry(proxyModelId, placedGeom.geometryExpressID);
                      const verts = (
                        spaceProxyApi as unknown as {
                          GetVertexArray(ptr: number, size: number): Float32Array;
                        }
                      ).GetVertexArray(geometry.GetVertexData(), geometry.GetVertexDataSize());
                      const idxs = (
                        spaceProxyApi as unknown as {
                          GetIndexArray(ptr: number, size: number): Uint32Array;
                        }
                      ).GetIndexArray(geometry.GetIndexData(), geometry.GetIndexDataSize());
                      const tf = placedGeom.flatTransformation;
                      const vertCount = verts.length / 6;

                      for (let v = 0; v < verts.length; v += 6) {
                        const x = Number(verts[v]),
                          y = Number(verts[v + 1]),
                          z = Number(verts[v + 2]);
                        const nx = Number(verts[v + 3]),
                          ny = Number(verts[v + 4]),
                          nz = Number(verts[v + 5]);
                        const tx =
                          Number(tf[0]) * x +
                          Number(tf[4]) * y +
                          Number(tf[8]) * z +
                          Number(tf[12]);
                        const ty =
                          Number(tf[1]) * x +
                          Number(tf[5]) * y +
                          Number(tf[9]) * z +
                          Number(tf[13]);
                        const tz =
                          Number(tf[2]) * x +
                          Number(tf[6]) * y +
                          Number(tf[10]) * z +
                          Number(tf[14]);
                        meshPositions.push(tx, ty, tz);
                        // Rotate normal (no translation)
                        meshNormals.push(
                          Number(tf[0]) * nx + Number(tf[4]) * ny + Number(tf[8]) * nz,
                          Number(tf[1]) * nx + Number(tf[5]) * ny + Number(tf[9]) * nz,
                          Number(tf[2]) * nx + Number(tf[6]) * ny + Number(tf[10]) * nz,
                        );
                        if (tx < minX) minX = tx;
                        if (tx > maxX) maxX = tx;
                        if (ty < minY) minY = ty;
                        if (ty > maxY) maxY = ty;
                        if (tz < minZ) minZ = tz;
                        if (tz > maxZ) maxZ = tz;
                      }
                      for (let idx = 0; idx < idxs.length; idx++) {
                        meshIndices.push(Number(idxs[idx]) + vertexOffset);
                      }
                      vertexOffset += vertCount;
                      try {
                        geometry.delete();
                      } catch {
                        /* ignore */
                      }
                    }
                    if (minX !== Infinity) aabb = [minX, minY, minZ, maxX, maxY, maxZ];
                  }
                } catch {
                  // GetFlatMesh failed for this space — skip proxy creation
                }

                if (!aabb) {
                  console.warn(
                    `[FacilityViewer] IfcSpace proxy: no geometry for ${guid}, skipping`,
                  );
                  continue;
                }

                const [minX, minY, minZ, maxX, maxY, maxZ] = aabb;
                const w = Math.max(maxX - minX, 0.1);
                const h = Math.max(maxY - minY, 0.1);
                const d = Math.max(maxZ - minZ, 0.1);
                const name = metaForProxy?.metaObjects?.[guid]?.name ?? guid;
                console.log(
                  `[FacilityViewer] IfcSpace proxy: ${name} (${guid}) size=[${w.toFixed(2)},${h.toFixed(2)},${d.toFixed(2)}]`,
                );

                try {
                  const proxyMesh = new Mesh(viewer.scene, {
                    id: guid,
                    isObject: true,
                    // Use actual IFC geometry (boolean cuts resolved) — positions are already
                    // in world space from flatTransformation, so no mesh-level position offset.
                    geometry: new ReadableGeometry(viewer.scene, {
                      primitive: 'triangles',
                      positions: meshPositions,
                      normals: meshNormals,
                      indices: meshIndices,
                    }),
                    material: new PhongMaterial(viewer.scene, {
                      diffuse: [0.4, 0.7, 1.0] as unknown as number[],
                      alpha: 0.2,
                      backfaces: true,
                    }),
                    pickable: true,
                  });
                  spaceProxyMeshesRef.current.set(guid, proxyMesh);
                } catch (meshErr) {
                  console.warn(`[FacilityViewer] IfcSpace proxy: mesh error for ${guid}:`, meshErr);
                }
              }

              try {
                (spaceProxyApi as unknown as { CloseModel(id: number): void }).CloseModel(
                  proxyModelId,
                );
              } catch {
                /* ignore */
              }
            } catch (proxyErr) {
              console.warn('[FacilityViewer] IfcSpace proxy creation failed:', proxyErr);
            }

            // Use the original URL for WebIFCLoaderPlugin — browser HTTP cache will
            // avoid a real second network request for the same IFC file.
            const ifcAPI = new WebIFC.IfcAPI();
            ifcAPI.SetWasmPath('/static/', true);
            await ifcAPI.Init();
            const ifcLoader = new WebIFCLoaderPlugin(viewer, {
              WebIFC,
              IfcAPI: ifcAPI,
            } as unknown as import('@xeokit/xeokit-sdk').WebIFCLoaderPluginConfiguration);
            const model = ifcLoader.load({
              id: 'building-model',
              src: modelUrl,
              edges: true,
            }) as unknown as { destroy(): void; on(event: string, cb: () => void): void };
            loadedModel = model;
            model.on('loaded', onLoaded);
          } else if (modelFormat === 'xkt') {
            const { XKTLoaderPlugin } = await import('@xeokit/xeokit-sdk');
            const xktLoader = new XKTLoaderPlugin(viewer);
            const model = xktLoader.load({
              id: 'building-model',
              src: modelUrl,
            }) as unknown as { destroy(): void; on(event: string, cb: () => void): void };
            loadedModel = model;
            model.on('loaded', onLoaded);
          } else if (modelFormat === 'gltf') {
            const { GLTFLoaderPlugin } = await import('@xeokit/xeokit-sdk');
            const gltfLoader = new GLTFLoaderPlugin(viewer);
            const model = gltfLoader.load({
              id: 'building-model',
              src: modelUrl,
            }) as unknown as { destroy(): void; on(event: string, cb: () => void): void };
            loadedModel = model;
            model.on('loaded', onLoaded);
          }
        } catch (err) {
          console.error('[FacilityViewer] Failed to load building model:', err);
        }
      })();

      return () => {
        cancelled = true;
        setModelLoaded(false);
        loadedModel?.destroy();
        // Destroy IfcSpace proxy meshes
        spaceProxyMeshesRef.current.forEach((mesh) => {
          try {
            (mesh as { destroy(): void }).destroy();
          } catch {
            /* ignore */
          }
        });
        spaceProxyMeshesRef.current.clear();
      };
    }, [ready, modelUrl, modelFormat]);

    // ── Render / update zones ────────────────────────────────────────────────
    // Re-runs when zones change OR when model finishes loading so that IFC
    // spaces become available for colorization on the first render after load.

    useEffect(() => {
      const viewer = viewerRef.current;
      const xeokit = xeokitRef.current;
      if (!viewer || !xeokit || !ready) return;

      const sceneObjects = (viewer.scene as unknown as Record<string, unknown>)['objects'] as
        | Record<string, SceneObject>
        | undefined;

      // ── Clean up previous zone visualization ──────────────────────────────

      // Reset IFC entity colorization
      ifcEntityMapRef.current.forEach((entityId) => {
        const entity = sceneObjects?.[entityId];
        if (entity) {
          entity.colorize = null;
          entity.opacity = 1.0;
          entity.highlighted = false;
          entity.pickable = false;
        }
      });
      ifcEntityMapRef.current.clear();

      // Destroy fallback box meshes
      meshesRef.current.forEach((mesh) => {
        try {
          (mesh as { destroy(): void }).destroy();
        } catch {
          /* ignore */
        }
      });
      meshesRef.current.clear();

      // ── Render each zone ──────────────────────────────────────────────────

      zones.forEach((zone, idx) => {
        const color = ZONE_COLORS[zone.zone_type] ?? [0.6, 0.6, 0.6];
        const alertColor: [number, number, number] = [0.8, 0.2, 0.2];
        const finalColor = zone.alert ? alertColor : color;
        const alpha = zone.is_active === false ? 0.3 : 0.65;

        // Strategy 1: use real IfcSpace geometry from the loaded model
        if (zone.spaceId && sceneObjects) {
          const entity = sceneObjects[zone.spaceId];
          if (entity) {
            entity.colorize = finalColor;
            entity.opacity = alpha;
            entity.pickable = true;
            entity.highlighted = zone.id === selectedZoneId;
            ifcEntityMapRef.current.set(zone.id, zone.spaceId);
            return;
          }
        }

        // Strategy 2: fallback box mesh (when no spaceId or model not yet loaded)
        const col = idx % 5;
        const row = Math.floor(idx / 5);
        const [x, y, z, w, h, d] = zone.bounds ?? [col * 6, 0, row * 6, 5, 3, 5];

        const mesh = new xeokit.Mesh(viewer.scene, {
          id: `zone-${zone.id}`,
          geometry: new xeokit.ReadableGeometry(viewer.scene, {
            ...xeokit.buildBoxGeometry({ xSize: w / 2, ySize: h / 2, zSize: d / 2 }),
          }),
          material: new xeokit.PhongMaterial(viewer.scene, {
            diffuse: finalColor as unknown as number[],
            alpha,
            emissive: zone.alert
              ? ([0.4, 0, 0] as unknown as number[])
              : ([0, 0, 0] as unknown as number[]),
          }),
          position: [x + w / 2, y + h / 2, z + d / 2],
          pickable: true,
        });

        (mesh as unknown as Record<string, unknown>)['_zoneEntity'] = zone;
        meshesRef.current.set(zone.id, mesh);
      });

      viewer.cameraFlight.flyTo({ aabb: viewer.scene.aabb, duration: 0.5 });
    }, [zones, ready, modelLoaded, selectedZoneId]);

    // ── Highlight selected zone ──────────────────────────────────────────────

    useEffect(() => {
      const viewer = viewerRef.current;
      const sceneObjects = viewer
        ? ((viewer.scene as unknown as Record<string, unknown>)['objects'] as
            | Record<string, SceneObject>
            | undefined)
        : undefined;

      // Box meshes
      meshesRef.current.forEach((mesh, id) => {
        (mesh as { highlighted: boolean }).highlighted = id === selectedZoneId;
      });

      // IFC space entities
      ifcEntityMapRef.current.forEach((entityId, zoneId) => {
        const entity = sceneObjects?.[entityId];
        if (entity) entity.highlighted = zoneId === selectedZoneId;
      });
    }, [selectedZoneId]);

    // ── Pick / hover helpers ─────────────────────────────────────────────────

    /** Resolve a scene entity ID to a ZoneEntity (handles both box and IFC modes) */
    const resolveZone = useCallback(
      (entityId: string): ZoneEntity | undefined => {
        // Box mesh pattern: "ROOM<zoneId>"
        if (entityId.startsWith('ROOM')) {
          const zoneId = entityId.slice('ROOM'.length);
          return zones.find((z) => z.id === zoneId);
        }
        // IFC space: look up in reverse map
        for (const [zoneId, spaceEntityId] of ifcEntityMapRef.current) {
          if (spaceEntityId === entityId) return zones.find((z) => z.id === zoneId);
        }
        return undefined;
      },
      [zones],
    );

    // ── Click / hover handlers + editMode surface picking ───────────────────

    useEffect(() => {
      const viewer = viewerRef.current;
      const xeokit = xeokitRef.current;
      if (!viewer || !xeokit || !ready) return;

      const ctrl = viewer.cameraControl as unknown as {
        on: (event: string, handler: (e: Record<string, unknown>) => void) => number;
        off: (subId: number) => void;
      } | null;

      if (!ctrl) return;

      const sceneObjectsForPick = (viewer.scene as unknown as Record<string, unknown>)[
        'objects'
      ] as Record<string, SceneObject> | undefined;

      const getEntityName = (entityId: string): string | undefined => {
        const meta = (viewer as unknown as Record<string, unknown>)['metaScene'] as
          | { metaObjects?: Record<string, { name?: string }> }
          | null
          | undefined;
        return meta?.metaObjects?.[entityId]?.name;
      };
      const getEntityType = (entityId: string): string | undefined => {
        const meta = (viewer as unknown as Record<string, unknown>)['metaScene'] as
          | { metaObjects?: Record<string, { type?: string }> }
          | null
          | undefined;
        return meta?.metaObjects?.[entityId]?.type;
      };
      const getContainingSpaceId = (entityId: string): string | undefined => {
        const meta = (viewer as unknown as Record<string, unknown>)['metaScene'] as
          | { metaObjects?: Record<string, { id?: string; type?: string; parentId?: string }> }
          | null
          | undefined;
        if (!meta?.metaObjects) return undefined;
        let cur: string | undefined = entityId;
        const seen = new Set<string>();
        while (cur && !seen.has(cur)) {
          seen.add(cur);
          const mo = meta.metaObjects[cur] as
            | { id?: string; type?: string; parentId?: string }
            | undefined;
          if (!mo) break;
          if (mo.type === 'IfcSpace') return mo.id;
          cur = mo.parentId;
        }
        return undefined;
      };
      const getAabbCenter = (aabb: number[] | undefined): [number, number, number] | null => {
        if (!aabb || aabb.length < 6) return null;
        const minX = Number(aabb[0]),
          minY = Number(aabb[1]),
          minZ = Number(aabb[2]);
        const maxX = Number(aabb[3]),
          maxY = Number(aabb[4]),
          maxZ = Number(aabb[5]);
        return [(minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2];
      };

      // Returns the nearest IfcSpace by AABB centre distance (no hard cutoff).
      const findNearestSpaceForEntity = (entityId: string): string | undefined => {
        const target = sceneObjectsForPick?.[entityId];
        if (!target) return undefined;
        const targetCenter = getAabbCenter(target.aabb);
        if (!targetCenter) return undefined;

        let bestId: string | undefined = undefined;
        let bestDist = Infinity;

        const meta = (viewer as unknown as Record<string, unknown>)['metaScene'] as
          | { metaObjects?: Record<string, { type?: string }> }
          | null
          | undefined;

        for (const [id, mo] of Object.entries(meta?.metaObjects ?? {})) {
          if (mo.type !== 'IfcSpace') continue;
          const so = sceneObjectsForPick?.[id];
          if (!so) continue;
          const center = getAabbCenter(so.aabb);
          if (!center) continue;
          const dx = center[0] - targetCenter[0];
          const dy = center[1] - targetCenter[1];
          const dz = center[2] - targetCenter[2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < bestDist) {
            bestDist = dist;
            bestId = id;
          }
        }

        return bestId;
      };

      const onPick = (e: { entity?: { id?: string } }) => {
        if (!e.entity?.id) return;

        // Space-mapping mode: only IfcSpace clicks fire onSpacePicked
        if (spaceMappingMode) {
          const type = getEntityType(e.entity.id);
          if (type === 'IfcSpace') {
            onSpacePickedRef.current?.(e.entity.id, getEntityName(e.entity.id));
          } else {
            // Walk parent chain first, then fall back to nearest IfcSpace by AABB
            const spaceId =
              getContainingSpaceId(e.entity.id) ?? findNearestSpaceForEntity(e.entity.id);
            if (spaceId) onSpacePickedRef.current?.(spaceId, getEntityName(spaceId));
          }
          return;
        }

        const zone = resolveZone(e.entity.id);
        if (zone) onZoneClick?.(zone);
      };

      const onHover = (e: { entity?: { id?: string } }) => {
        // In space-mapping mode: highlight hovered entity only if it's an IfcSpace
        if (spaceMappingMode) {
          // Clear previous highlight on cursor move
          if (hoverHighlightRef.current && hoverHighlightRef.current !== e.entity?.id) {
            const prev = sceneObjectsForPick?.[hoverHighlightRef.current];
            if (prev) prev.highlighted = false;
            hoverHighlightRef.current = null;
          }

          if (e.entity?.id) {
            const type = getEntityType(e.entity.id);
            if (type === 'IfcSpace') {
              const entity = sceneObjectsForPick?.[e.entity.id];
              if (entity) entity.highlighted = true;
              hoverHighlightRef.current = e.entity.id;
            } else {
              // Walk parent chain first, then nearest IfcSpace by AABB
              const spaceId =
                getContainingSpaceId(e.entity.id) ?? findNearestSpaceForEntity(e.entity.id);
              if (spaceId) {
                const spaceEntity = sceneObjectsForPick?.[spaceId];
                if (spaceEntity) spaceEntity.highlighted = true;
                hoverHighlightRef.current = spaceId;
              }
            }
          }
          return;
        }

        if (!e.entity?.id) {
          onZoneHover?.(null);
          return;
        }
        onZoneHover?.(resolveZone(e.entity.id) ?? null);
      };

      const onPickedSurface = (e: Record<string, unknown>) => {
        if (!editMode || !onBoundsCreated) return;

        const worldPos = e['worldPos'] as [number, number, number] | undefined;
        if (!worldPos) return;

        const [wx, wy, wz] = worldPos;
        const [bw, bh, bd] = DEFAULT_BOUNDS_SIZE;
        const bounds: [number, number, number, number, number, number] = [wx, wy, wz, bw, bh, bd];

        if (previewMeshRef.current) {
          try {
            (previewMeshRef.current as { destroy(): void }).destroy();
          } catch {
            /* ignore */
          }
          previewMeshRef.current = null;
        }

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

      const safeOff = (subId: number): void => {
        try {
          ctrl.off(subId);
        } catch {
          /* cameraControl may already be torn down during unmount */
        }
      };

      return () => {
        safeOff(pickSub);
        safeOff(hoverSub);
        safeOff(surfaceSub);
        // Clear any lingering hover highlight
        if (hoverHighlightRef.current && sceneObjectsForPick) {
          const e = sceneObjectsForPick[hoverHighlightRef.current];
          if (e) e.highlighted = false;
          hoverHighlightRef.current = null;
        }
      };
    }, [
      zones,
      onZoneClick,
      onZoneHover,
      ready,
      editMode,
      onBoundsCreated,
      resolveZone,
      spaceMappingMode,
    ]);

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
      viewerRef.current?.cameraFlight.flyTo({ aabb: viewerRef.current.scene.aabb, duration: 0.8 });
    }, []);

    const flyToZone = useCallback((zoneId: string) => {
      const viewer = viewerRef.current;
      if (!viewer) return;

      // Prefer IFC entity AABB
      const ifcEntityId = ifcEntityMapRef.current.get(zoneId);
      if (ifcEntityId) {
        const sceneObjects = (viewer.scene as unknown as Record<string, unknown>)['objects'] as
          | Record<string, SceneObject>
          | undefined;
        const entity = sceneObjects?.[ifcEntityId];
        if (entity) {
          viewer.cameraFlight.flyTo({ aabb: entity.aabb, duration: 0.6 });
          return;
        }
      }

      // Fallback: box mesh
      const mesh = meshesRef.current.get(zoneId);
      if (mesh) {
        viewer.cameraFlight.flyTo({ aabb: (mesh as { aabb: number[] }).aabb, duration: 0.6 });
      }
    }, []);

    const setLayerVisible = useCallback(
      (_layer: 'zones' | 'sensors' | 'labels', _visible: boolean) => {
        // Layer visibility is a future extension
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

        {editMode && ready && (
          <div className="pointer-events-none absolute left-3 top-3 rounded bg-yellow-400/90 px-3 py-1 text-xs font-semibold text-yellow-900 shadow">
            Zone Marking Mode — Click surface to place bounds
          </div>
        )}

        {spaceMappingMode && ready && (
          <div className="pointer-events-none absolute left-3 top-3 rounded bg-blue-500/90 px-3 py-1 text-xs font-semibold text-white shadow">
            Space Mapping — Click a room to assign a zone
          </div>
        )}

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

function ZoneLabel({ zone }: { zone: ZoneEntity }) {
  return (
    <div
      className="absolute text-center text-[10px] font-medium text-gray-800 drop-shadow"
      style={{ display: 'none' }}
    >
      {zone.zone_code}
    </div>
  );
}
