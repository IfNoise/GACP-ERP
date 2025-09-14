# Infrastructure

This directory contains production-ready infrastructure configurations:

```text
infrastructure/
├── docker/
│   ├── docker-compose.dev.yml      # Development environment
│   └── docker-compose.prod.yml     # Production environment
├── kubernetes/
│   ├── manifests/                  # Raw K8s manifests
│   ├── helm/                       # Helm charts
│   └── operators/                  # Custom operators
├── terraform/                      # Infrastructure as Code
│   ├── aws/                        # AWS resources
│   ├── gcp/                        # Google Cloud resources
│   └── on-premise/                 # On-premise setup
└── monitoring/
    ├── prometheus/                 # Monitoring configs
    ├── grafana/                    # Dashboards
    └── loki/                       # Log aggregation
```

## Infrastructure Components

### Core Services

- **PostgreSQL**: Primary database with streaming replication
- **Apache Kafka**: Event streaming platform
- **immudb**: Immutable database for audit trails
- **MinIO**: S3-compatible object storage with WORM
- **Keycloak**: Identity and access management

### Supporting Services

- **Mayan EDMS**: Document management system
- **VictoriaMetrics**: Time-series database
- **Loki**: Log aggregation system
- **Tempo**: Distributed tracing
- **Grafana**: Observability dashboards

## Deployment Architecture

### Geo-Redundant Setup

- **DC1 (Primary)**: Bangkok - 14 servers
- **DC2 (Secondary)**: Chiang Mai - 12 servers
- **Cloud Backup**: Off-site disaster recovery

### Resource Requirements

- **CPU**: 48+ cores per DC
- **Memory**: 256+ GB RAM per DC
- **Storage**: 50+ TB raw capacity
- **Network**: 10 Gbps inter-DC link
