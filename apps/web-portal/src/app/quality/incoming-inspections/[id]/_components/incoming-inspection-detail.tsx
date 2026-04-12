'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  useIncomingInspection,
  usePerformInspection,
  useRecordTestResults,
  useReleaseInspection,
  useRejectInspection,
} from '@/hooks/use-domain-queries';
import {
  StatusBadge,
  WorkflowTimeline,
  SignatureDialog,
  type StatusVariant,
} from '@gacp-erp/ui-components';

type InspectionStatus = 'PENDING' | 'IN_PROGRESS' | 'QUARANTINE' | 'RELEASED' | 'REJECTED';

const STATUS_VARIANT: Record<InspectionStatus, StatusVariant> = {
  PENDING: 'pending',
  IN_PROGRESS: 'active',
  QUARANTINE: 'draft',
  RELEASED: 'approved',
  REJECTED: 'cancelled',
};

const WORKFLOW_STEPS = [
  { id: 'PENDING', label: 'Pending' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'QUARANTINE', label: 'Quarantine' },
  { id: 'RELEASED', label: 'Released' },
];

function BoolResult({ value, label }: { value: boolean | null; label: string }) {
  if (value === null || value === undefined) return <span className="text-gray-400">-</span>;
  return (
    <span className={value ? 'text-green-700' : 'text-red-700'}>
      {value ? 'Pass' : 'Fail'} ({label})
    </span>
  );
}

export function IncomingInspectionDetail({ id }: { id: string }) {
  const { data: inspection, isLoading, error } = useIncomingInspection(id);
  const performMutation = usePerformInspection();
  const testResultsMutation = useRecordTestResults();
  const releaseMutation = useReleaseInspection();
  const rejectMutation = useRejectInspection();

  const [showPerformForm, setShowPerformForm] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);
  const [showSignatureDialog, setShowSignatureDialog] = useState<
    'release' | 'reject' | 'perform' | null
  >(null);

  // Perform inspection form state
  const [visualCheck, setVisualCheck] = useState(false);
  const [quantityVerified, setQuantityVerified] = useState(false);
  const [assessmentNotes, setAssessmentNotes] = useState('');

  // Test results form state
  const [dnaPass, setDnaPass] = useState(false);
  const [cannabinoidPass, setCannabinoidPass] = useState(false);
  const [pathogenPass, setPathogenPass] = useState(false);
  const [germinationRate, setGerminationRate] = useState('');

  // Reject form state
  const [rejectReason, setRejectReason] = useState('');

  // Release form state
  const [releaseReason, setReleaseReason] = useState('');

  if (isLoading) return <div className="animate-pulse text-gray-500">Loading...</div>;
  if (error) return <div className="text-red-600">Error: {error.message}</div>;
  if (!inspection) return <div className="text-gray-500">Inspection not found</div>;

  const ins = inspection as Record<string, unknown>;
  const status = ins['status'] as InspectionStatus;

  const buildSignature = (_password: string, reason: string) => ({
    signed_by: '00000000-0000-0000-0000-000000000000',
    signer_name: 'Current User',
    signer_role: 'QUALITY_MANAGER',
    signature_type: 'approval' as const,
    authentication_method: 'password' as const,
    digital_signature: 'a'.repeat(256),
    content_hash: 'b'.repeat(64),
    ip_address: '127.0.0.1',
    workstation_id: 'WS-001',
    signature_meaning: reason || 'Inspection action',
    signed_at: new Date().toISOString(),
  });

  const handleSignatureConfirm = async (password: string, reason: string) => {
    const sig = buildSignature(password, reason);
    if (showSignatureDialog === 'perform') {
      await performMutation.mutateAsync({
        id,
        body: {
          visual_check_passed: visualCheck,
          quantity_verified: quantityVerified,
          quality_assessment_notes: assessmentNotes || undefined,
          electronic_signature: sig as never,
        },
      });
      setShowPerformForm(false);
    } else if (showSignatureDialog === 'release') {
      await releaseMutation.mutateAsync({
        id,
        body: {
          disposition_reason: releaseReason || undefined,
          electronic_signature: sig as never,
        },
      });
    } else if (showSignatureDialog === 'reject') {
      await rejectMutation.mutateAsync({
        id,
        body: {
          disposition_reason: rejectReason,
          electronic_signature: sig as never,
        },
      });
    }
    setShowSignatureDialog(null);
  };

  const handleRecordTestResults = async () => {
    await testResultsMutation.mutateAsync({
      id,
      body: {
        dna_fingerprint_passed: dnaPass,
        cannabinoid_profile_passed: cannabinoidPass,
        pathogen_screening_passed: pathogenPass,
        germination_rate: parseFloat(germinationRate) || 0,
      },
    });
    setShowTestForm(false);
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/quality/incoming-inspections"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            &larr; Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{ins['inspection_number'] as string}</h1>
          <StatusBadge status={STATUS_VARIANT[status] ?? 'draft'} />
        </div>
      </div>

      <WorkflowTimeline
        steps={WORKFLOW_STEPS.map((s) => ({
          ...s,
          status:
            s.id === status
              ? ('active' as const)
              : WORKFLOW_STEPS.findIndex((w) => w.id === status) >
                  WORKFLOW_STEPS.findIndex((w) => w.id === s.id)
                ? ('completed' as const)
                : ('pending' as const),
        }))}
      />

      {status === 'REJECTED' && (
        <div className="my-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
          <strong>Rejected</strong>: {ins['disposition_reason'] as string}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Reference Details */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">References</h2>
          </div>
          <div className="card-body">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <dt className="text-gray-500">GRN ID</dt>
              <dd className="font-mono text-xs">{ins['grn_id'] as string}</dd>
              <dt className="text-gray-500">PO ID</dt>
              <dd className="font-mono text-xs">{ins['po_id'] as string}</dd>
              <dt className="text-gray-500">Supplier</dt>
              <dd className="font-mono text-xs">{ins['supplier_id'] as string}</dd>
              <dt className="text-gray-500">Strain</dt>
              <dd className="font-mono text-xs">
                {(ins['strain_id'] as string) ?? <span className="text-gray-400">N/A</span>}
              </dd>
              <dt className="text-gray-500">Quarantine Days</dt>
              <dd>{ins['quarantine_days_required'] as number}</dd>
            </dl>
          </div>
        </div>

        {/* Visual & Quantity Check */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Visual & Quantity Check</h2>
          </div>
          <div className="card-body">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <dt className="text-gray-500">Visual Check</dt>
              <dd>
                <BoolResult value={ins['visual_check_passed'] as boolean | null} label="Visual" />
              </dd>
              <dt className="text-gray-500">Quantity Verified</dt>
              <dd>
                <BoolResult value={ins['quantity_verified'] as boolean | null} label="Quantity" />
              </dd>
              <dt className="text-gray-500">Notes</dt>
              <dd>{(ins['quality_assessment_notes'] as string) ?? '-'}</dd>
            </dl>
          </div>
        </div>

        {/* Lab Test Results */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Lab Test Results</h2>
          </div>
          <div className="card-body">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <dt className="text-gray-500">DNA Fingerprint</dt>
              <dd>
                <BoolResult value={ins['dna_fingerprint_passed'] as boolean | null} label="DNA" />
              </dd>
              <dt className="text-gray-500">Cannabinoid Profile</dt>
              <dd>
                <BoolResult
                  value={ins['cannabinoid_profile_passed'] as boolean | null}
                  label="Cannabinoid"
                />
              </dd>
              <dt className="text-gray-500">Pathogen Screening</dt>
              <dd>
                <BoolResult
                  value={ins['pathogen_screening_passed'] as boolean | null}
                  label="Pathogen"
                />
              </dd>
              <dt className="text-gray-500">Germination Rate</dt>
              <dd>
                {(ins['germination_rate'] as number | null) !== null
                  ? `${ins['germination_rate']}%`
                  : '-'}
              </dd>
            </dl>
          </div>
        </div>

        {/* Quarantine & Disposition */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Quarantine & Disposition</h2>
          </div>
          <div className="card-body">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <dt className="text-gray-500">Quarantine Start</dt>
              <dd>
                {ins['quarantine_start_date']
                  ? new Date(ins['quarantine_start_date'] as string).toLocaleString()
                  : '-'}
              </dd>
              <dt className="text-gray-500">Quarantine End</dt>
              <dd>
                {ins['quarantine_end_date']
                  ? new Date(ins['quarantine_end_date'] as string).toLocaleString()
                  : '-'}
              </dd>
              <dt className="text-gray-500">Disposition</dt>
              <dd>{(ins['disposition_decision'] as string) ?? '-'}</dd>
              <dt className="text-gray-500">Reason</dt>
              <dd>{(ins['disposition_reason'] as string) ?? '-'}</dd>
            </dl>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex gap-4">
        {status === 'PENDING' && (
          <button className="btn btn-primary" onClick={() => setShowPerformForm(true)}>
            Perform Inspection
          </button>
        )}
        {status === 'IN_PROGRESS' && (
          <>
            <button className="btn btn-primary" onClick={() => setShowTestForm(true)}>
              Record Test Results
            </button>
            <button className="btn btn-danger" onClick={() => setShowSignatureDialog('reject')}>
              Reject
            </button>
          </>
        )}
        {status === 'QUARANTINE' && (
          <>
            <button className="btn btn-primary" onClick={() => setShowSignatureDialog('release')}>
              Release
            </button>
            <button className="btn btn-danger" onClick={() => setShowSignatureDialog('reject')}>
              Reject
            </button>
          </>
        )}
      </div>

      {/* Perform Inspection Form */}
      {showPerformForm && (
        <div className="mt-6 card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Perform Visual & Quantity Inspection</h2>
          </div>
          <div className="card-body space-y-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={visualCheck}
                onChange={(e) => setVisualCheck(e.target.checked)}
              />
              Visual Check Passed
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={quantityVerified}
                onChange={(e) => setQuantityVerified(e.target.checked)}
              />
              Quantity Verified
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-700">Assessment Notes</label>
              <textarea
                className="input mt-1 w-full"
                rows={3}
                value={assessmentNotes}
                onChange={(e) => setAssessmentNotes(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary" onClick={() => setShowSignatureDialog('perform')}>
                Submit with Signature
              </button>
              <button className="btn btn-secondary" onClick={() => setShowPerformForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Test Results Form */}
      {showTestForm && (
        <div className="mt-6 card">
          <div className="card-header">
            <h2 className="text-lg font-semibold">Record Lab Test Results</h2>
          </div>
          <div className="card-body space-y-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={dnaPass}
                onChange={(e) => setDnaPass(e.target.checked)}
              />
              DNA Fingerprint Passed
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={cannabinoidPass}
                onChange={(e) => setCannabinoidPass(e.target.checked)}
              />
              Cannabinoid Profile Passed
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={pathogenPass}
                onChange={(e) => setPathogenPass(e.target.checked)}
              />
              Pathogen Screening Passed
            </label>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Germination Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                className="input mt-1 w-32"
                value={germinationRate}
                onChange={(e) => setGerminationRate(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                className="btn btn-primary"
                onClick={handleRecordTestResults}
                disabled={testResultsMutation.isPending}
              >
                {testResultsMutation.isPending
                  ? 'Submitting...'
                  : 'Submit Results & Enter Quarantine'}
              </button>
              <button className="btn btn-secondary" onClick={() => setShowTestForm(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject reason input */}
      {showSignatureDialog === 'reject' && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Rejection Reason</label>
          <textarea
            className="input mt-1 w-full"
            rows={2}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection (required, min 5 chars)"
          />
        </div>
      )}

      {/* Release reason input */}
      {showSignatureDialog === 'release' && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">
            Release Notes (optional)
          </label>
          <textarea
            className="input mt-1 w-full"
            rows={2}
            value={releaseReason}
            onChange={(e) => setReleaseReason(e.target.value)}
          />
        </div>
      )}

      {/* Signature Dialog */}
      {showSignatureDialog && (
        <SignatureDialog
          open={!!showSignatureDialog}
          onClose={() => setShowSignatureDialog(null)}
          onConfirm={handleSignatureConfirm}
          title={
            showSignatureDialog === 'perform'
              ? 'Perform Inspection'
              : showSignatureDialog === 'release'
                ? 'Release Inspection'
                : 'Reject Inspection'
          }
        />
      )}
    </>
  );
}
