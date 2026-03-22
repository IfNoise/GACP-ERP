'use client';

export function PayrollPlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
        <p className="mt-1 text-sm text-gray-500">Payroll management for workforce compensation</p>
      </div>

      <div className="card">
        <div className="card-body flex flex-col items-center py-12 text-center">
          <div className="mb-4 text-4xl">💰</div>
          <h2 className="text-lg font-semibold text-gray-700">Payroll Module Coming Soon</h2>
          <p className="mt-2 max-w-md text-sm text-gray-500">
            Payroll processing, approval workflows, and pay period management will be available once
            the payroll service API is operational. The schema is defined and ready for integration.
          </p>
          <div className="mt-6 grid gap-3 text-left text-sm text-gray-600">
            <div className="flex items-center gap-2">
              ✓ Payroll run lifecycle (Draft → Calculated → Approved → Paid)
            </div>
            <div className="flex items-center gap-2">✓ Pay period management</div>
            <div className="flex items-center gap-2">
              ✓ Payroll line items with gross/deductions/net
            </div>
            <div className="flex items-center gap-2">
              ✓ Electronic signature for approvals (21 CFR Part 11)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
