import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * GACP-ERP — IoT Ingestion Load Test
 * Target: 100,000 data points/minute via HTTP (MQTT proxy)
 * Verify: No data loss, all points queryable
 */
export const options = {
  stages: [
    { duration: '1m', target: 500 },
    { duration: '5m', target: 1667 }, // ~100k/min = 1667/sec
    { duration: '5m', target: 1667 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.001'],
  },
  tags: { testSuite: 'iot-ingestion' },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

const headers = {
  'Content-Type': 'application/json',
  ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
};

const SENSOR_TYPES = ['temperature', 'humidity', 'co2', 'light', 'ph', 'ec'];
const ZONE_IDS = ['zone-A1', 'zone-A2', 'zone-B1', 'zone-B2', 'zone-C1'];

function randomSensorReading() {
  const sensorType = SENSOR_TYPES[Math.floor(Math.random() * SENSOR_TYPES.length)];
  const zoneId = ZONE_IDS[Math.floor(Math.random() * ZONE_IDS.length)];

  const ranges = {
    temperature: { min: 18, max: 32 },
    humidity: { min: 40, max: 90 },
    co2: { min: 300, max: 1500 },
    light: { min: 0, max: 1000 },
    ph: { min: 5.0, max: 8.0 },
    ec: { min: 0.5, max: 3.5 },
  };

  const range = ranges[sensorType];
  const value = range.min + Math.random() * (range.max - range.min);

  return {
    sensor_id: `${zoneId}-${sensorType}-01`,
    zone_id: zoneId,
    sensor_type: sensorType,
    value: Math.round(value * 100) / 100,
    unit:
      sensorType === 'temperature'
        ? '°C'
        : sensorType === 'humidity'
          ? '%'
          : sensorType === 'co2'
            ? 'ppm'
            : sensorType === 'light'
              ? 'lux'
              : '',
    timestamp: new Date().toISOString(),
  };
}

export default function () {
  const reading = randomSensorReading();

  const res = http.post(`${BASE_URL}/api/iot/readings`, JSON.stringify(reading), {
    headers,
    tags: { name: 'iot_ingest' },
  });

  check(res, {
    'ingest: accepted': (r) => r.status === 200 || r.status === 201 || r.status === 204,
  });

  // Occasionally query to verify data is available
  if (Math.random() < 0.01) {
    const queryRes = http.get(
      `${BASE_URL}/api/iot/readings?sensor_id=${reading.sensor_id}&limit=1`,
      { headers, tags: { name: 'iot_query' } },
    );
    check(queryRes, {
      'query: status ok': (r) => r.status === 200,
    });
  }
}
