'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useValidationProtocol, useExecuteValidationTest } from '@/hooks';
import { Button, StatusBadge, SignatureDialog } from '@gacp-erp/ui-components';
import type { StatusVariant } from '@gacp-erp/ui-components';

const TEST_STATUS_VARIANT: Record<string, StatusVariant> = {
  PENDING: 'draft',
  PASS: 'approved',
  FAIL: 'rejected',
  NOT_APPLICABLE: 'cancelled',
};

export function ExecuteTestForm({ protocolId }: { protocolId: string }) {
  const router = useRouter();
  const { data, isLoading } = useValidationProtocol(protocolId);
  const execute = useExecuteValidationTest();
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [actualResult, setActualResult] = useState('');
  const [testStatus, setTestStatus] = useState<'PASS' | 'FAIL' | 'NOT_APPLICABLE'>('PASS');
  const [exceptionNote, setExceptionNote] = useState('');
  const [showSignature, setShowSignature] = useState(false);

  if (isLoading) return <div className="animate-pulse p-6">Loading protocol...</div>;
  if (!data) return <div className="p-6 text-red-600">Protocol not found</div>;

  const p = data as Record<string, unknown>;
  const testSteps = (p['test_steps'] ?? []) as Record<string, unknown>[];
  const pendingSteps = testSteps.filter((s) => String(s['status']) === 'PENDING');

  const handleExecute = () => {
    if (selectedStep == null || !actualResult) return;
    setShowSignature(true);
  };

  // e-signature constructed server-side
  const handleSign = (_password: string, _reason: string) => {
    setShowSignature(false);
    execute.mutate(
      {
        id: protocolId,
        body: {
          step_number: selectedStep!,
          actual_result: actualResult,
          status: testStatus,
          ...(exceptionNote ? { exception_note: exceptionNote } : {}),
        } as Parameters<typeof execute.mutate>[0]['body'],
      },
      {
        onSuccess: () => {
          setSelectedStep(null);
          setActualResult('');
          setExceptionNote('');
          if (pendingSteps.length <= 1) {
            router.push(`/quality/validation-protocols/${protocolId}`);
          }
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/quality/validation-protocols/${protocolId}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to {String(p['protocol_number'])}
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Execute Test Steps</h1>
        <p className="mt-1 text-sm text-gray-500">{pendingSteps.length} pending step(s)</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Step List */}
        <div className="space-y-2">
          {testSteps.map((step) => {
            const stepNum = Number(step['step_number']);
            const isPending = String(step['status']) === 'PENDING';
            const isSelected = selectedStep === stepNum;
            return (
              <Button
                key={stepNum}
                type="button"
                variant="ghost"
                disabled={!isPending}
                onClick={() => setSelectedStep(stepNum)}
                className={`w-full rounded border p-3 text-left transition ${isSelected ? '' : isPending ? '' : 'opacity-50'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">Step {stepNum}</span>
                  <StatusBadge
                    status={TEST_STATUS_VARIANT[String(step['status'])] ?? 'draft'}
                    label={String(step['status'])}
                  />
                </div>
                <p className="mt-1 text-sm text-gray-600">{String(step['description'])}</p>
                <p className="mt-1 text-xs text-gray-500">
                  Expected: {String(step['expected_result'])}
                </p>
              </Button>
            );
          })}
        </div>

        {/* Execution Form */}
        {selectedStep != null && (
          <div className="card sticky top-6">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Execute Step {selectedStep}</h2>
            </div>
            <div className="card-body space-y-4">
              <div>
                <label className="label">Actual Result</label>
                <textarea
                  className="input w-full"
                  rows={4}
                  value={actualResult}
                  onChange={(e) => setActualResult(e.target.value)}
                  required
                  minLength={1}
                />
              </div>
              <div>
                <label className="label">Status</label>
                <select
                  className="input w-full"
                  value={testStatus}
                  onChange={(e) => setTestStatus(e.target.value as typeof testStatus)}
                >
                  <option value="PASS">PASS</option>
                  <option value="FAIL">FAIL</option>
                  <option value="NOT_APPLICABLE">NOT APPLICABLE</option>
                </select>
              </div>
              {testStatus === 'FAIL' && (
                <div>
                  <label className="label">Exception Note</label>
                  <textarea
                    className="input w-full"
                    rows={3}
                    value={exceptionNote}
                    onChange={(e) => setExceptionNote(e.target.value)}
                  />
                </div>
              )}
              <Button
                type="button"
                variant="default"
                className="w-full"
                disabled={execute.isPending || !actualResult}
                onClick={handleExecute}
              >
                {execute.isPending ? 'Executing...' : 'Record Result with Signature'}
              </Button>
            </div>
          </div>
        )}
      </div>

      <SignatureDialog
        open={showSignature}
        onClose={() => setShowSignature(false)}
        onConfirm={handleSign}
        title={`Execute Step ${selectedStep}`}
      />
    </div>
  );
}
