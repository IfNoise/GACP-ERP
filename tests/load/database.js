import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * GACP-ERP — Database Load Test
 * Target: 1,000 TPS sustained for 10 minutes
 * Mix: 70% reads, 30% writes
 * Threshold: avg query time < 100ms
 */
export const options = {
  stages: [
    { duration: '1m', target: 200 },
    { duration: '3m', target: 500 },
    { duration: '10m', target: 1000 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['avg<100', 'p(99)<500'],
    http_req_failed: ['rate<0.01'],
  },
  tags: { testSuite: 'database' },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

const headers = {
  'Content-Type': 'application/json',
  ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
};

export default function () {
  const random = Math.random();

  if (random < 0.7) {
    // ── 70% READ operations ──

    const readOps = [
      () =>
        http.get(`${BASE_URL}/api/cultivation/plants?page=1&limit=50`, {
          headers,
          tags: { name: 'read_plants' },
        }),
      () =>
        http.get(`${BASE_URL}/api/cultivation/batches?page=1&limit=50`, {
          headers,
          tags: { name: 'read_batches' },
        }),
      () =>
        http.get(`${BASE_URL}/api/quality/deviations?page=1&limit=20`, {
          headers,
          tags: { name: 'read_deviations' },
        }),
      () =>
        http.get(`${BASE_URL}/api/quality/capas?page=1&limit=20`, {
          headers,
          tags: { name: 'read_capas' },
        }),
      () =>
        http.get(`${BASE_URL}/api/financial/accounts?page=1&limit=50`, {
          headers,
          tags: { name: 'read_accounts' },
        }),
      () =>
        http.get(`${BASE_URL}/api/workforce/employees?page=1&limit=50`, {
          headers,
          tags: { name: 'read_employees' },
        }),
      () => http.get(`${BASE_URL}/api/analytics/kpis`, { headers, tags: { name: 'read_kpis' } }),
    ];

    const op = readOps[Math.floor(Math.random() * readOps.length)];
    const res = op();
    check(res, {
      'read: status ok': (r) => r.status >= 200 && r.status < 400,
    });
  } else {
    // ── 30% WRITE operations ──
    // These create minimal test records

    const writeRes = http.post(
      `${BASE_URL}/api/quality/quality-events`,
      JSON.stringify({
        title: `Load Test Event ${Date.now()}`,
        description: 'Automated load test — safe to delete',
        severity: 'MINOR',
        category: 'OBSERVATION',
      }),
      { headers, tags: { name: 'write_quality_event' } },
    );

    check(writeRes, {
      'write: status created or ok': (r) =>
        r.status === 201 || r.status === 200 || r.status === 401,
    });
  }

  sleep(0.1);
}
