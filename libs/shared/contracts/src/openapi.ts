import { generateOpenApi } from '@ts-rest/open-api';
import { initContract } from '@ts-rest/core';
import {
  authContract,
  cultivationContract,
  auditContract,
  iotContract,
  qualityContract,
  financialContract,
  procurementContract,
  spatialContract,
  workforceContract,
  analyticsContract,
} from './index';
import * as fs from 'node:fs';
import * as path from 'node:path';

const c = initContract();

const apiContract = c.router({
  auth: authContract,
  cultivation: cultivationContract,
  audit: auditContract,
  iot: iotContract,
  quality: qualityContract,
  financial: financialContract,
  procurement: procurementContract,
  spatial: spatialContract,
  workforce: workforceContract,
  analytics: analyticsContract,
});

const openApiDocument = generateOpenApi(apiContract, {
  info: {
    title: 'GACP-ERP API',
    version: '1.0.0',
    description:
      'GACP-ERP platform API — cultivation, quality, financial, workforce, audit, IoT, analytics',
    contact: {
      name: 'GACP-ERP Team',
    },
    license: {
      name: 'Proprietary',
    },
  },
  servers: [
    { url: 'http://localhost:3000', description: 'Development' },
    { url: 'https://gacp-erp.local/api', description: 'Production' },
  ],
});

const outDir = path.resolve(__dirname, '../../../../docs/generated');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'openapi.json'), JSON.stringify(openApiDocument, null, 2));

console.log(`OpenAPI spec generated at docs/generated/openapi.json`);
console.log(`Endpoints: ${Object.keys(openApiDocument.paths ?? {}).length} paths`);
