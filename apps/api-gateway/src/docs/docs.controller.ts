import { Controller, Get, Res } from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { randomBytes } from 'node:crypto';
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
} from '@gacp-erp/shared-contracts';

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

let cachedSpec: object | null = null;

function getOpenApiSpec(): object {
  if (!cachedSpec) {
    cachedSpec = generateOpenApi(apiContract, {
      info: {
        title: 'GACP-ERP API',
        version: '1.0.0',
        description:
          'GACP-ERP platform API — cultivation, quality, financial, workforce, audit, IoT, analytics',
      },
    });
  }
  return cachedSpec;
}

@Controller({ path: 'docs', version: '' })
export class DocsController {
  @Get('openapi.json')
  getOpenApiJson(@Res() reply: FastifyReply) {
    if (process.env['NODE_ENV'] === 'production') {
      return reply.status(404).send({ message: 'Not available in production' });
    }
    return reply.send(getOpenApiSpec());
  }

  @Get()
  getSwaggerUi(@Res() reply: FastifyReply) {
    if (process.env['NODE_ENV'] === 'production') {
      return reply.status(404).send({ message: 'Not available in production' });
    }

    const nonce = randomBytes(16).toString('base64');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>GACP-ERP API Docs</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script nonce="${nonce}">
    SwaggerUIBundle({ url: '/api/docs/openapi.json', dom_id: '#swagger-ui' });
  </script>
</body>
</html>`;

    const csp = [
      "default-src 'self'",
      `script-src 'self' https://cdn.jsdelivr.net 'nonce-${nonce}'`,
      "style-src 'self' https://cdn.jsdelivr.net",
      "connect-src 'self' https://cdn.jsdelivr.net",
      "img-src 'self' data:",
      "object-src 'none'",
      "frame-ancestors 'none'",
    ].join('; ');

    return reply
      .header('content-security-policy', csp)
      .type('text/html')
      .send(html);
  }
}
