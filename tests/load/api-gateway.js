import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * GACP-ERP — API Gateway Load Test
 * Target: 500 concurrent users, P95 < 200ms, <1% error rate
 */
export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 500 },
    { duration: '10m', target: 500 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'],
    http_req_failed: ['rate<0.01'],
  },
  tags: { testSuite: 'api-gateway' },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

const headers = {
  'Content-Type': 'application/json',
  ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
};

export default function () {
  // Health check
  const healthRes = http.get(`${BASE_URL}/api/health`, { headers });
  check(healthRes, {
    'health: status 200': (r) => r.status === 200,
  });

  // List plants
  const plantsRes = http.get(`${BASE_URL}/api/cultivation/plants?page=1&limit=20`, { headers });
  check(plantsRes, {
    'plants: status 200': (r) => r.status === 200,
    'plants: returns array': (r) => {
      try {
        return Array.isArray(JSON.parse(r.body).data);
      } catch {
        return false;
      }
    },
  });

  // List batches
  const batchRes = http.get(`${BASE_URL}/api/cultivation/batches?page=1&limit=20`, { headers });
  check(batchRes, {
    'batches: status 200': (r) => r.status === 200,
  });

  // Quality — deviations list
  const devRes = http.get(`${BASE_URL}/api/quality/deviations?page=1&limit=10`, { headers });
  check(devRes, {
    'deviations: status 200': (r) => r.status === 200,
  });

  // Financial — GL accounts
  const glRes = http.get(`${BASE_URL}/api/financial/accounts?page=1&limit=20`, { headers });
  check(glRes, {
    'accounts: status 200 or 401': (r) => r.status === 200 || r.status === 401,
  });

  // Analytics — KPIs
  const kpiRes = http.get(`${BASE_URL}/api/analytics/kpis`, { headers });
  check(kpiRes, {
    'kpis: status 200': (r) => r.status === 200,
  });

  sleep(1);
}
