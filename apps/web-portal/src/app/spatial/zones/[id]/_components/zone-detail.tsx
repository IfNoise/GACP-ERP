'use client';

import Link from 'next/link';
import {
  useZone,
  useActiveAssignments,
  useAssignBatchToZone,
  useReleaseBatchFromZone,
} from '@/hooks';
import { StatusBadge, AuditTrailPanel, KPICard, Button } from '@gacp-erp/ui-components';
import type { StatusVariant, AuditEvent } from '@gacp-erp/ui-components';
import { useState } from 'react';

const TYPE_VARIANT: Record<string, StatusVariant> = {
  CULTIVATION: 'active',
  PROCESSING: 'pending',
  STORAGE: 'approved',
  UTILITY: 'draft',
  OFFICE: 'draft',
  QUARANTINE: 'overdue',
};

export function ZoneDetail({ id }: { id: string }) {
  const { data, isLoading } = useZone(id);
  const { data: assignmentsData, isLoading: loadingAssign } = useActiveAssignments(id);
  const assignMutation = useAssignBatchToZone();
  const releaseMutation = useReleaseBatchFromZone();

  const [batchId, setBatchId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');
  const [showAssignForm, setShowAssignForm] = useState(false);

  if (isLoading) return <div className="animate-pulse p-6">Loading zone...</div>;
  if (!data) return <div className="p-6 text-red-600">Zone not found</div>;

  const zone = data as Record<string, unknown>;
  const zoneType = String(zone['zone_type']);
  const assignments = ((assignmentsData as Record<string, unknown>)?.['data'] ?? []) as Record<
    string,
    unknown
  >[];

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    await assignMutation.mutateAsync({
      zone_id: id,
      batch_id: batchId,
      ...(assignNotes ? { notes: assignNotes } : {}),
    });
    setBatchId('');
    setAssignNotes('');
    setShowAssignForm(false);
  };

  const handleRelease = async (assignmentId: string) => {
    await releaseMutation.mutateAsync({ id: assignmentId, body: { assignment_id: assignmentId } });
  };

  const auditEvents: AuditEvent[] = [
    {
      id: 'created',
      action: 'Created',
      actor: String(zone['created_by'] ?? ''),
      timestamp: String(zone['created_at']),
    },
    ...(String(zone['updated_at']) !== String(zone['created_at'])
      ? [
          {
            id: 'updated',
            action: 'Updated',
            actor: String(zone['updated_by'] ?? ''),
            timestamp: String(zone['updated_at']),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/spatial/zones" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to zones
        </Link>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{String(zone['zone_code'])}</h1>
          <StatusBadge status={TYPE_VARIANT[zoneType] ?? 'draft'} label={zoneType} />
          <StatusBadge
            status={zone['is_active'] ? 'active' : 'closed'}
            label={zone['is_active'] ? 'Active' : 'Inactive'}
          />
        </div>
        <p className="mt-1 text-lg text-gray-700">{String(zone['zone_name'])}</p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-3">
        <KPICard title="Current Occupancy" value={String(zone['current_occupancy'] ?? 0)} />
        <KPICard
          title="Capacity"
          value={zone['capacity'] != null ? String(zone['capacity']) : '—'}
        />
        <KPICard
          title="Area (m²)"
          value={zone['area_sqm'] != null ? Number(zone['area_sqm']).toLocaleString() : '—'}
        />
      </div>

      {/* Zone Details */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold">Zone Details</h2>
        </div>
        <div className="card-body">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Zone Type</dt>
              <dd className="font-medium">{zoneType}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Parent Zone</dt>
              <dd className="font-medium">
                {zone['parent_zone_id'] ? (
                  <Link
                    href={`/spatial/zones/${String(zone['parent_zone_id'])}`}
                    className="text-green-700 hover:underline"
                  >
                    {String(zone['parent_zone_id']).slice(0, 8)}…
                  </Link>
                ) : (
                  '—'
                )}
              </dd>
            </div>
            {zone['notes'] ? (
              <div className="col-span-2">
                <dt className="text-gray-500">Notes</dt>
                <dd className="mt-1 whitespace-pre-wrap">{String(zone['notes'])}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>

      {/* Batch Assignments */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-lg font-semibold">Active Batch Assignments ({assignments.length})</h2>
          <Button onClick={() => setShowAssignForm((v) => !v)}>
            {showAssignForm ? 'Cancel' : 'Assign Batch'}
          </Button>
        </div>
        <div className="card-body">
          {showAssignForm && (
            <form onSubmit={handleAssign} className="mb-4 flex gap-3 rounded border p-3">
              <input
                className="input flex-1"
                placeholder="Batch ID (UUID)"
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                required
              />
              <input
                className="input w-48"
                placeholder="Notes (optional)"
                value={assignNotes}
                onChange={(e) => setAssignNotes(e.target.value)}
              />
              <Button type="submit" disabled={assignMutation.isPending}>
                {assignMutation.isPending ? 'Assigning...' : 'Assign'}
              </Button>
            </form>
          )}

          {loadingAssign ? (
            <div className="animate-pulse">Loading assignments...</div>
          ) : assignments.length === 0 ? (
            <p className="text-sm text-gray-500">No active batch assignments</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">Batch ID</th>
                  <th className="pb-2">Assigned At</th>
                  <th className="pb-2">Assigned By</th>
                  <th className="pb-2">Notes</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr key={String(a['id'])} className="border-b">
                    <td className="py-2 font-mono">{String(a['batch_id']).slice(0, 8)}…</td>
                    <td className="py-2">{new Date(String(a['assigned_at'])).toLocaleString()}</td>
                    <td className="py-2">{String(a['assigned_by'] ?? '').slice(0, 8)}</td>
                    <td className="py-2 text-gray-500">{String(a['notes'] ?? '—')}</td>
                    <td className="py-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRelease(String(a['id']))}
                        disabled={releaseMutation.isPending}
                      >
                        Release
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AuditTrailPanel events={auditEvents} />
    </div>
  );
}
