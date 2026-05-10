'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useBuilding, useBuildingRooms, useCreateRoom, useSpatialBuilding } from '@/hooks';
import { DataTable, StatusBadge, Button, Badge } from '@gacp-erp/ui-components';
import type { ColumnDef, PaginationState } from '@gacp-erp/ui-components';

interface Room {
  id: string;
  room_code: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

function getRoomColumns(facilityId: string, buildingId: string): ColumnDef<Room, unknown>[] {
  return [
    {
      accessorKey: 'room_code',
      header: 'Code',
      cell: ({ row }) => (
        <Link
          href={`/facilities/${facilityId}/buildings/${buildingId}/rooms/${row.original.id}`}
          className="font-medium text-green-700 hover:text-green-900 hover:underline"
        >
          {row.original.room_code}
        </Link>
      ),
    },
    { accessorKey: 'name', header: 'Name' },
    {
      accessorKey: 'is_active',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.is_active ? 'active' : 'closed'}
          label={row.original.is_active ? 'Active' : 'Inactive'}
        />
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString(),
    },
  ];
}

function BuildingModelSection({ buildingId }: { buildingId: string }) {
  const { data: spatialBuilding, isLoading, refetch } = useSpatialBuilding(buildingId);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    setProgress(`Uploading ${file.name}…`);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/buildings/${buildingId}/model/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `Upload failed (${res.status})`);
      }

      setProgress(null);
      setShowForm(false);
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setProgress(null);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  if (isLoading) return <div className="text-sm text-gray-400">Loading model info…</div>;

  const hasModel = spatialBuilding?.model_url;

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">3D Building Model</h2>
        {hasModel ? (
          <div className="flex gap-2">
            <Link href={`/spatial/3d?buildingId=${buildingId}`}>
              <Button variant="outline" size="sm">
                View in 3D
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : 'Replace Model'}
            </Button>
          </div>
        ) : (
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Upload 3D Model'}
          </Button>
        )}
      </div>

      {hasModel && !showForm && (
        <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="font-medium text-gray-500">Format</dt>
            <dd className="mt-1">
              <Badge variant="info">{spatialBuilding.model_format?.toUpperCase()}</Badge>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Model URL</dt>
            <dd className="mt-1 truncate text-gray-700" title={spatialBuilding.model_url ?? ''}>
              {spatialBuilding.model_url}
            </dd>
          </div>
        </div>
      )}

      {!hasModel && !showForm && (
        <p className="mt-2 text-sm text-gray-500">
          No 3D model uploaded. Upload an IFC, glTF, or XKT file to enable zone marking in the 3D
          viewer.
        </p>
      )}

      {showForm && (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">
              Select file (.ifc, .gltf, .glb, .xkt)
            </span>
            <input
              type="file"
              accept=".ifc,.gltf,.glb,.xkt"
              disabled={uploading}
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-600
                file:mr-3 file:rounded file:border-0 file:bg-green-50 file:px-3 file:py-1.5
                file:text-sm file:font-medium file:text-green-700
                hover:file:bg-green-100 disabled:opacity-50"
            />
          </label>
          {progress && <p className="text-sm text-blue-600">{progress}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}

export function BuildingDetail({
  facilityId,
  buildingId,
}: {
  facilityId: string;
  buildingId: string;
}) {
  const { data: building, isLoading: buildingLoading } = useBuilding(buildingId);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const { data: rooms, isLoading: roomsLoading } = useBuildingRooms(buildingId, {
    page,
    limit: 20,
  });

  const createMutation = useCreateRoom();
  const [form, setForm] = useState({ room_code: '', name: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({ buildingId, body: form });
    setForm({ room_code: '', name: '' });
    setShowForm(false);
  };

  if (buildingLoading) return <div className="p-4 text-gray-500">Loading...</div>;
  if (!building) return <div className="p-4 text-red-500">Building not found</div>;

  const b = building as Record<string, unknown>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/facilities/${facilityId}`} className="text-gray-500 hover:text-gray-700">
          &larr; Back to Facility
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{b['name'] as string}</h1>
        <StatusBadge
          status={b['is_active'] ? 'active' : 'closed'}
          label={b['is_active'] ? 'Active' : 'Inactive'}
        />
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <dl className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <dt className="font-medium text-gray-500">Building Code</dt>
            <dd className="text-gray-900">{b['building_code'] as string}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Name</dt>
            <dd className="text-gray-900">{b['name'] as string}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Type</dt>
            <dd className="text-gray-900">
              <Badge variant="info">
                {((b['building_type'] as string | undefined) ?? '—').replace('_', ' ')}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-500">Created</dt>
            <dd className="text-gray-900">
              {new Date(b['created_at'] as string).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </div>

      <BuildingModelSection buildingId={buildingId} />

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Rooms</h2>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'New Room'}</Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Room Code</label>
              <input
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
                value={form.room_code}
                onChange={(e) => setForm({ ...form, room_code: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="mt-4">
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Room'}
            </Button>
          </div>
        </form>
      )}

      {roomsLoading && <div className="p-4 text-gray-500">Loading rooms...</div>}

      <DataTable
        columns={getRoomColumns(facilityId, buildingId)}
        data={(rooms?.data as Room[]) ?? []}
        totalRows={rooms?.total ?? 0}
        pageSize={20}
        onPaginationChange={(p: PaginationState) => setPage(p.pageIndex + 1)}
      />
    </div>
  );
}
