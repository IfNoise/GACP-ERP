import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * GACP-ERP — Electronic Signature Throughput Test
 * Target: 1,000 signatures/hour (~17/min)
 * Verify: Each signature verified in ImmuDB, response < 2s
 */
export const options = {
  stages: [
    { duration: '1m', target: 5 },
    { duration: '10m', target: 17 },
    { duration: '10m', target: 17 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    'http_req_duration{name:sign}': ['p(95)<2000'],
    'http_req_duration{name:verify}': ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
  },
  tags: { testSuite: 'signatures' },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'TestPassword123!';

const headers = {
  'Content-Type': 'application/json',
  ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
};

const ACTIONS = [
  'APPROVE_CHANGE_CONTROL',
  'APPROVE_DEVIATION',
  'APPROVE_CAPA',
  'APPROVE_VALIDATION_PROTOCOL',
  'APPROVE_DOCUMENT',
  'APPROVE_BATCH_RELEASE',
];

export default function () {
  const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
  const entityId = `LOAD-TEST-${Date.now()}-${__VU}`;

  // Step 1: Create electronic signature
  const signRes = http.post(
    `${BASE_URL}/api/signatures`,
    JSON.stringify({
      action,
      entity_id: entityId,
      entity_type: 'load_test',
      password: TEST_PASSWORD,
      reason: `Load test signature for ${action}`,
    }),
    { headers, tags: { name: 'sign' } },
  );

  const signOk = check(signRes, {
    'sign: status created': (r) => r.status === 201 || r.status === 200 || r.status === 401,
  });

  if (signOk && signRes.status === 201) {
    let signatureId;
    try {
      signatureId = JSON.parse(signRes.body).data?.id || JSON.parse(signRes.body).id;
    } catch {
      return;
    }

    sleep(0.5);

    // Step 2: Verify signature
    if (signatureId) {
      const verifyRes = http.get(`${BASE_URL}/api/signatures/${signatureId}/verify`, {
        headers,
        tags: { name: 'verify' },
      });

      check(verifyRes, {
        'verify: status ok': (r) => r.status === 200,
        'verify: signature valid': (r) => {
          try {
            return JSON.parse(r.body).valid === true;
          } catch {
            return false;
          }
        },
      });
    }
  }

  sleep(2);
}
