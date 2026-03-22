import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * GACP-ERP — Web Portal Page Load Test
 * Target: All critical pages load < 2 seconds
 */
export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '5m', target: 200 },
    { duration: '5m', target: 200 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
  },
  tags: { testSuite: 'web-portal' },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

const CRITICAL_PAGES = [
  '/',
  '/plants',
  '/batches',
  '/quality/deviations',
  '/quality/capas',
  '/quality/change-controls',
  '/financial/journal-entries',
  '/financial/general-ledger',
  '/workforce/employees',
  '/workforce/tasks',
  '/workforce/training',
  '/compliance',
  '/analytics',
  '/reports',
  '/documents',
  '/iot',
];

export default function () {
  const page = CRITICAL_PAGES[Math.floor(Math.random() * CRITICAL_PAGES.length)];

  const res = http.get(`${BASE_URL}${page}`, {
    tags: { name: `page_${page.replace(/\//g, '_') || 'home'}` },
  });

  check(res, {
    [`${page}: status ok`]: (r) => r.status === 200 || r.status === 302 || r.status === 307,
    [`${page}: load < 2s`]: (r) => r.timings.duration < 2000,
  });

  sleep(1);
}
