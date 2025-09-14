# GACP-ERP Source Code Structure

This directory will contain the Nx monorepo with the following structure:

```text
src/
├── apps/
│   ├── api/                    # NestJS backend
│   ├── web/                    # Next.js frontend
│   ├── audit-worker/           # Kafka → immudb consumer
│   └── report-generator/       # PDF generation service
├── libs/
│   ├── contracts/              # ts-rest + Zod schemas
│   ├── auth/                   # Keycloak integration
│   ├── audit/                  # Audit trail utilities
│   ├── db/                     # TypeORM/Prisma helpers
│   ├── iot/                    # Sensor adapters
│   └── compliance/             # GACP reporting
├── tools/
│   ├── deployment/             # Kubernetes manifests
│   └── validation/             # IQ/OQ/PQ test scripts
└── README.md
```

## Current Status

- Documentation structure completed
- Technical architecture defined
- Infrastructure requirements specified
- Ready to begin implementation phase
