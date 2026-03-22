'use client';

import { useEmployees, useCourses, useCertifications } from '@/hooks';

export function CertificationMatrix() {
  const { data: empData, isLoading: empLoading } = useEmployees({ limit: 50, is_active: 'true' });
  const { data: courseData, isLoading: courseLoading } = useCourses({ limit: 50 });
  const { data: certData, isLoading: certLoading } = useCertifications({ limit: 500 });

  const employees = ((empData as Record<string, unknown>)?.['data'] ?? []) as Record<
    string,
    unknown
  >[];
  const courses = ((courseData as Record<string, unknown>)?.['data'] ?? []) as Record<
    string,
    unknown
  >[];
  const certifications = ((certData as Record<string, unknown>)?.['data'] ?? []) as Record<
    string,
    unknown
  >[];

  const isLoading = empLoading || courseLoading || certLoading;

  // Build lookup: employeeId-courseId → certification
  const certMap = new Map<string, Record<string, unknown>>();
  for (const c of certifications) {
    const key = `${String(c['employee_id'])}-${String(c['course_id'])}`;
    certMap.set(key, c);
  }

  const getCellStyle = (cert: Record<string, unknown> | undefined) => {
    if (!cert) return 'bg-gray-100 text-gray-400';
    const validUntil = new Date(String(cert['valid_until']));
    const now = new Date();
    const daysLeft = Math.ceil((validUntil.getTime() - now.getTime()) / 86400000);
    if (daysLeft < 0) return 'bg-red-100 text-red-700';
    if (daysLeft < 30) return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  };

  const getCellLabel = (cert: Record<string, unknown> | undefined) => {
    if (!cert) return '—';
    const validUntil = new Date(String(cert['valid_until']));
    const now = new Date();
    const daysLeft = Math.ceil((validUntil.getTime() - now.getTime()) / 86400000);
    if (daysLeft < 0) return 'Expired';
    if (daysLeft < 30) return `${daysLeft}d`;
    return 'Valid';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Certification Matrix</h1>
        <p className="mt-1 text-sm text-gray-500">
          Training compliance overview — employees × courses
        </p>
        <div className="mt-3 flex gap-4 text-xs">
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded bg-green-200" /> Valid
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded bg-yellow-200" /> Expiring (&lt;30d)
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded bg-red-200" /> Expired
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded bg-gray-100" /> Missing
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse p-6 text-center">Loading certification data...</div>
      ) : employees.length === 0 || courses.length === 0 ? (
        <div className="rounded-lg bg-white p-6 text-center text-gray-500">
          No employees or courses found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="sticky left-0 bg-white px-3 py-2 text-left">Employee</th>
                {courses.map((c) => (
                  <th
                    key={String(c['id'])}
                    className="px-2 py-2 text-center"
                    title={String(c['title'])}
                  >
                    <div className="max-w-[80px] truncate text-xs">{String(c['course_id'])}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((emp) => (
                <tr key={String(emp['id'])} className="border-b hover:bg-gray-50">
                  <td className="sticky left-0 bg-white px-3 py-2 font-medium">
                    <div>{String(emp['employee_number'])}</div>
                    <div className="text-xs text-gray-500">{String(emp['position'])}</div>
                  </td>
                  {courses.map((c) => {
                    const key = `${String(emp['id'])}-${String(c['id'])}`;
                    const cert = certMap.get(key);
                    return (
                      <td
                        key={String(c['id'])}
                        className={`px-2 py-2 text-center text-xs font-medium ${getCellStyle(cert)}`}
                      >
                        {getCellLabel(cert)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
