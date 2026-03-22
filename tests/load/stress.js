import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * GACP-ERP — Stress Test
 * 2x expected load: 1,000 concurrent users, 20,000 req/min
 * Verify: Graceful degradation, no crash, recovery after load reduction
 */
export const options = {
  stages: [
    // Ramp up
    { duration: '2m', target: 200 },
    { duration: '3m', target: 500 },
    // Sustained 2x load
    { duration: '5m', target: 1000 },
    // Peak spike
    { duration: '2m', target: 1500 },
    // Sustained 2x load
    { duration: '5m', target: 1000 },
    // Recovery — ramp down
    { duration: '2m', target: 200 },
    // Verify recovery at normal load
    { duration: '3m', target: 200 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    // Under stress: more lenient thresholds
    http_req_duration: ['p(95)<5000'], // P95 < 5s (degraded)
    http_req_failed: ['rate<0.10'], // <10% error rate
    // Recovery phase should return to normal
    'http_req_duration{phase:recovery}': ['p(95)<500'],
  },
  tags: { testSuite: 'stress' },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

const headers = {
  'Content-Type': 'application/json',
  ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
};

const ENDPOINTS = [
  { method: 'GET', path: '/api/health' },
  { method: 'GET', path: '/api/cultivation/plants?page=1&limit=20' },
  { method: 'GET', path: '/api/cultivation/batches?page=1&limit=20' },
  { method: 'GET', path: '/api/quality/deviations?page=1&limit=10' },
  { method: 'GET', path: '/api/quality/capas?page=1&limit=10' },
  { method: 'GET', path: '/api/financial/accounts?page=1&limit=20' },
  { method: 'GET', path: '/api/workforce/employees?page=1&limit=20' },
  { method: 'GET', path: '/api/analytics/kpis' },
];

export default function () {
  const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
  const isRecovery = __ITER > 0 && __ENV.K6_STAGE === 'recovery';

  const res = http.get(`${BASE_URL}${endpoint.path}`, {
    headers,
    tags: {
      name: endpoint.path.split('?')[0],
      ...(isRecovery ? { phase: 'recovery' } : {}),
    },
  });

  // Under stress, accept 503 (service unavailable) as graceful degradation
  check(res, {
    'response received': (r) => r.status > 0,
    'not 500 (server error)': (r) => r.status !== 500,
    'graceful degradation': (r) =>
      r.status === 200 || r.status === 401 || r.status === 429 || r.status === 503,
  });

  sleep(0.3);
}
