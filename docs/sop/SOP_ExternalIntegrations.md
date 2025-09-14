---
title: "SOP: External Integrations & API Management"
sop_id: "SOP-API-001"
version: "1.0"
effective_date: "2025-09-13"
review_date: "2026-09-13"
department: "IT / Systems Integration"
process_owner: "IT Manager"
approver: "Chief Technology Officer"
related_sops:
  - "SOP_FinancialAccounting.md"
  - "SOP_DataIntegrity.md"
  - "SOP_AccessControl.md"
  - "SOP_AuditTrail.md"
risk_level: "High"
---

# SOP: External Integrations & API Management

## 1. Purpose

Establish standardized procedures for managing external system integrations, API development and maintenance, regulatory reporting interfaces, and third-party data exchanges while maintaining GACP compliance, data integrity, and security standards.

## 2. Scope

This SOP covers:
- External API design and management
- Regulatory reporting system integrations
- Third-party accounting system interfaces
- State tracking system connections (METRC, BioTrackTHC)
- Laboratory information system (LIMS) integration
- Banking and payment system interfaces
- Monitoring and analytics platform connections
- API security and access control

## 3. Responsibilities

| Role | Responsibility |
|------|---------------|
| **IT Manager** | Integration strategy, API governance, security oversight |
| **Systems Integration Specialist** | API development, integration implementation, maintenance |
| **QA Manager** | Compliance verification, validation oversight |
| **Security Officer** | Security review, access control, threat assessment |
| **Compliance Manager** | Regulatory reporting oversight, audit preparation |
| **DevOps Engineer** | Deployment, monitoring, performance optimization |

## 4. API Design and Management

### 4.1 Contract-First API Development

#### 4.1.1 API Design Standards
**Contract-First Approach**:
- **OpenAPI 3.0** specifications for all public APIs
- **ts-rest + Zod** contracts for type-safe TypeScript integration
- **Semantic versioning** (semver) for API versions
- **Backward compatibility** maintained for minimum 2 major versions

**API Design Principles**:
```typescript
// Example ts-rest contract structure
const gacpApiContract = c.router({
  // Plant lifecycle endpoints
  plants: c.router({
    getPlant: {
      method: 'GET',
      path: '/plants/:id',
      responses: {
        200: plantSchema,
        404: errorSchema
      },
      summary: 'Get plant details by ID'
    },
    updatePlant: {
      method: 'PUT', 
      path: '/plants/:id',
      body: updatePlantSchema,
      responses: {
        200: plantSchema,
        400: validationErrorSchema,
        404: errorSchema
      },
      summary: 'Update plant information'
    }
  }),
  
  // Batch management endpoints
  batches: c.router({
    getBatchHistory: {
      method: 'GET',
      path: '/batches/:id/history',
      query: z.object({
        fromDate: z.string().optional(),
        toDate: z.string().optional(),
        includeAuditTrail: z.boolean().default(false)
      }),
      responses: {
        200: z.array(batchHistorySchema)
      }
    }
  }),
  
  // Compliance reporting endpoints
  compliance: c.router({
    generateReport: {
      method: 'POST',
      path: '/compliance/reports',
      body: reportRequestSchema,
      responses: {
        202: reportJobSchema,
        400: errorSchema
      }
    }
  })
});
```

#### 4.1.2 API Versioning Strategy
**Version Management**:
- **URL Versioning**: `/api/v1/`, `/api/v2/`
- **Header Versioning**: `API-Version: 2.1` for minor versions
- **Deprecation Timeline**: 12-month notice for major version changes
- **Migration Support**: Automated migration tools for common scenarios

**Version Lifecycle**:
```yaml
API_Lifecycle:
  development:
    version: "v2.1-beta"
    stability: "experimental"
    breaking_changes: "allowed"
  
  staging:
    version: "v2.1-rc.1"
    stability: "release_candidate"
    breaking_changes: "documentation_required"
  
  production:
    version: "v2.1"
    stability: "stable"
    breaking_changes: "forbidden"
  
  deprecated:
    version: "v1.x"
    stability: "maintenance_only"
    sunset_date: "2026-09-13"
```

### 4.2 API Security and Authentication

#### 4.2.1 Authentication Methods
**Multi-layered Security**:
- **OAuth 2.0 / OIDC**: Integration with Keycloak for user authentication
- **API Keys**: Service-to-service authentication with rotation
- **mTLS**: Mutual TLS for high-security government integrations
- **JWT Tokens**: Stateless authentication with configurable expiration

**Security Configuration**:
```typescript
interface APISecurityConfig {
  authentication: {
    method: 'oauth2' | 'api_key' | 'mtls' | 'jwt';
    provider: 'keycloak' | 'external' | 'internal';
    tokenExpiry: number; // seconds
    refreshEnabled: boolean;
    mfaRequired: boolean;
  };
  
  authorization: {
    rbacEnabled: boolean;
    scopes: string[];
    resourcePermissions: ResourcePermission[];
  };
  
  rateLimit: {
    requestsPerMinute: number;
    burstAllowance: number;
    byEndpoint: boolean;
  };
  
  encryption: {
    tlsVersion: '1.2' | '1.3';
    cipherSuites: string[];
    certificatePinning: boolean;
  };
}
```

#### 4.2.2 Rate Limiting and Throttling
**Protection Mechanisms**:
- **Sliding Window**: Rate limiting based on recent request history
- **Token Bucket**: Burst allowance for legitimate traffic spikes
- **IP-based Limiting**: Protection against single-source attacks
- **User-based Limiting**: Per-user quotas for fair usage

**Rate Limit Configuration**:
```yaml
Rate_Limits:
  public_api:
    requests_per_minute: 100
    burst_allowance: 20
    window_size: "1m"
  
  internal_api:
    requests_per_minute: 1000
    burst_allowance: 200
    window_size: "1m"
  
  regulatory_reporting:
    requests_per_minute: 10
    burst_allowance: 5
    window_size: "5m"
```

## 5. Regulatory System Integrations

### 5.1 State Tracking Systems

#### 5.1.1 METRC Integration
**Massachusetts Cannabis Track & Trace**:
- **Plant Registration**: Automatic registration of new plants
- **Transfer Manifests**: Electronic transfer documentation
- **Harvest Reporting**: Batch completion and yield reporting
- **Inventory Updates**: Real-time inventory synchronization

**Data Mapping**:
```typescript
interface METRCPlant {
  Id: number;
  Label: string;
  State: 'Planted' | 'Vegetative' | 'Flowering' | 'Manicuring' | 'Drying' | 'Harvested';
  GrowthPhase: string;
  PlantBatchId: number;
  StrainName: string;
  LocationName: string;
  HarvestCount: number;
  PlantedDate: string; // ISO date
  VegetativeDate?: string;
  FloweringDate?: string;
  HarvestedDate?: string;
}

// Mapping function
const mapToMETRC = (plant: Plant): METRCPlant => ({
  Id: plant.externalId,
  Label: plant.identifier,
  State: mapPlantStage(plant.stage),
  GrowthPhase: plant.stage,
  PlantBatchId: plant.batch.externalId,
  StrainName: plant.strain,
  LocationName: plant.zone.name,
  HarvestCount: plant.harvestEvents.length,
  PlantedDate: plant.plantedAt.toISOString(),
  VegetativeDate: plant.vegetativeAt?.toISOString(),
  FloweringDate: plant.floweringAt?.toISOString(),
  HarvestedDate: plant.harvestedAt?.toISOString()
});
```

#### 5.1.2 BioTrackTHC Integration
**Washington State Traceability**:
- **Inventory Tracking**: Seed-to-sale inventory management
- **Lab Results**: Integration with testing laboratory results
- **Transport Manifests**: Shipment tracking and verification
- **Disposal Records**: Waste tracking and disposal documentation

**Synchronization Process**:
```yaml
Sync_Schedule:
  plant_updates:
    frequency: "every_4_hours"
    batch_size: 100
    retry_policy: "exponential_backoff"
  
  inventory_updates:
    frequency: "daily"
    time: "02:00"
    full_sync: "weekly"
  
  lab_results:
    frequency: "real_time"
    webhook: true
    verification_required: true
```

### 5.2 Laboratory Information Systems (LIMS)

#### 5.2.1 Testing Laboratory Integration
**Automated Sample Management**:
- **Sample Registration**: Automatic sample creation and labeling
- **Chain of Custody**: Digital custody transfer tracking
- **Result Import**: Automated COA import and validation
- **Non-conformance Handling**: Automatic deviation workflows

**LIMS Interface**:
```typescript
interface LIMSSample {
  sampleId: string;
  batchId: string;
  sampleType: 'potency' | 'microbiology' | 'pesticides' | 'heavy_metals' | 'residual_solvents';
  collectionDate: Date;
  collectedBy: string;
  testingLab: string;
  priority: 'routine' | 'urgent' | 'rush';
  tests: TestRequest[];
  chainOfCustody: CustodyRecord[];
  results?: TestResult[];
  status: 'registered' | 'collected' | 'in_transit' | 'received' | 'testing' | 'completed' | 'rejected';
}

interface TestResult {
  testId: string;
  testMethod: string;
  analyte: string;
  result: number;
  units: string;
  limit: number;
  passFail: 'pass' | 'fail' | 'pending';
  uncertainty?: number;
  detectionLimit?: number;
  reportedDate: Date;
  analystSignature: string;
}
```

#### 5.2.2 Certificate of Analysis (COA) Processing
**Automated COA Workflow**:
```
Lab Completion → COA Generation → Digital Signature → ERP Import → Batch Release → QA Review → Customer Distribution
```

**COA Validation Rules**:
- **Format Validation**: PDF structure and required fields
- **Digital Signature**: Laboratory signature verification
- **Test Completeness**: All required tests performed
- **Result Validation**: Values within expected ranges
- **Batch Matching**: Correct sample-to-batch correlation

## 6. Financial System Integrations

### 6.1 Accounting System Integration

#### 6.1.1 QuickBooks Integration
**Chart of Accounts Synchronization**:
- **Account Mapping**: GACP chart of accounts to QuickBooks
- **Transaction Export**: Daily GL transaction export
- **Customer/Vendor Sync**: Master data synchronization
- **Reconciliation**: Automated balance reconciliation

**Data Exchange Format**:
```typescript
interface QuickBooksExport {
  transactions: {
    txnId: string;
    date: string;
    type: 'invoice' | 'bill' | 'payment' | 'journal_entry';
    account: string;
    amount: number;
    description: string;
    reference: string;
    customFields: Record<string, string>;
  }[];
  
  reconciliation: {
    exportDate: Date;
    totalTransactions: number;
    totalDebits: number;
    totalCredits: number;
    checksum: string;
  };
}
```

#### 6.1.2 SAP Integration
**Enterprise Resource Planning**:
- **Material Master**: Synchronized product catalog
- **Purchase Orders**: Automated PO creation and processing
- **Goods Receipt**: Receiving confirmation and inventory updates
- **Invoice Processing**: Three-way matching and approval workflow

### 6.2 Banking and Payment Systems

#### 6.2.1 Bank API Integration
**Cash Management**:
- **Account Balances**: Real-time balance monitoring
- **Transaction History**: Automatic transaction import
- **Payment Processing**: ACH and wire transfer initiation
- **Reconciliation**: Automated bank reconciliation

**Security Requirements**:
```yaml
Banking_Security:
  encryption:
    data_at_rest: "AES-256"
    data_in_transit: "TLS_1.3"
    key_management: "HSM"
  
  authentication:
    multi_factor: "required"
    api_keys: "rotated_monthly"
    client_certificates: "required"
  
  compliance:
    pci_dss: "level_1"
    sox_compliance: "required"
    audit_trail: "complete"
```

## 7. Monitoring and Analytics Integration

### 7.1 Business Intelligence Platforms

#### 7.1.1 Analytics Data Pipeline
**Data Warehouse Integration**:
- **ETL Processes**: Scheduled data extraction and transformation
- **Real-time Streaming**: Kafka to analytics platforms
- **Data Quality**: Validation and cleansing procedures
- **Performance Monitoring**: Query performance and optimization

**Analytics Schema**:
```sql
-- Data warehouse fact table example
CREATE TABLE fact_cultivation_metrics (
    date_key INTEGER,
    plant_key INTEGER,
    batch_key INTEGER,
    zone_key INTEGER,
    strain_key INTEGER,
    
    -- Cultivation Metrics
    plants_count INTEGER,
    avg_height_cm DECIMAL(8,2),
    avg_health_score DECIMAL(3,2),
    
    -- Environmental Metrics
    avg_temperature DECIMAL(5,2),
    avg_humidity DECIMAL(5,2),
    avg_co2_ppm INTEGER,
    avg_light_ppfd INTEGER,
    
    -- Resource Consumption
    water_liters DECIMAL(10,2),
    electricity_kwh DECIMAL(10,2),
    nutrients_ml DECIMAL(10,2),
    
    -- Quality Metrics
    compliance_score DECIMAL(3,2),
    sop_adherence DECIMAL(3,2),
    
    -- Financial Metrics
    cost_to_date DECIMAL(15,2),
    estimated_value DECIMAL(15,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 7.2 IoT Platform Integration

#### 7.2.1 Sensor Data Integration
**MQTT/CoAP Integration**:
- **Device Management**: IoT device registration and configuration
- **Data Collection**: Real-time sensor data ingestion
- **Alert Processing**: Threshold-based alerting system
- **Data Retention**: Time-series data storage and archival

**IoT Data Pipeline**:
```
Sensors → MQTT Broker → Kafka → Time Series DB → Analytics → Alerts → ERP Integration
```

## 8. API Documentation and Testing

### 8.1 Documentation Standards

#### 8.1.1 Interactive Documentation
**OpenAPI Documentation**:
- **Swagger UI**: Interactive API exploration
- **Code Examples**: Multiple language examples
- **Authentication Guides**: Step-by-step setup instructions
- **Use Case Scenarios**: Real-world integration examples

#### 8.1.2 Developer Portal
**Self-Service Integration**:
- **API Key Management**: Self-service key generation
- **Usage Analytics**: Real-time usage monitoring
- **Rate Limit Monitoring**: Current usage against limits
- **Support Channels**: Developer support and forums

### 8.2 Testing and Validation

#### 8.2.1 Automated Testing
**API Testing Pipeline**:
```yaml
Testing_Stages:
  unit_tests:
    framework: "Jest"
    coverage_threshold: 90
    mock_external_apis: true
  
  integration_tests:
    framework: "Supertest"
    test_databases: "isolated"
    external_services: "sandbox"
  
  contract_tests:
    framework: "Pact"
    consumer_driven: true
    provider_verification: true
  
  performance_tests:
    framework: "Artillery"
    load_scenarios: "production_like"
    sla_validation: true
```

#### 8.2.2 Sandbox Environment
**Testing Infrastructure**:
- **Mock Services**: Simulated external systems
- **Test Data**: Realistic but non-production data
- **Performance Testing**: Load testing capabilities
- **Security Testing**: Vulnerability scanning and penetration testing

## 9. Error Handling and Monitoring

### 9.1 Error Management

#### 9.1.1 Standardized Error Responses
**Error Schema**:
```typescript
interface APIError {
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable error message
    details?: string;       // Additional error details
    timestamp: string;      // ISO timestamp
    requestId: string;      // Unique request identifier
    path: string;          // API endpoint path
    method: string;        // HTTP method
  };
  
  validation?: {
    field: string;
    value: any;
    constraint: string;
    message: string;
  }[];
  
  links?: {
    documentation: string;
    support: string;
  };
}
```

#### 9.1.2 Circuit Breaker Pattern
**Fault Tolerance**:
- **Failure Detection**: Automatic detection of service degradation
- **Circuit Opening**: Stop calls to failing services
- **Fallback Mechanisms**: Alternative responses or cached data
- **Recovery Testing**: Automatic service recovery detection

### 9.2 Monitoring and Alerting

#### 9.2.1 Performance Monitoring
**Key Metrics**:
```typescript
interface APIMetrics {
  performance: {
    responseTime: {
      p50: number;
      p95: number;
      p99: number;
    };
    throughput: {
      requestsPerSecond: number;
      requestsPerMinute: number;
    };
    errorRate: {
      percentage: number;
      byEndpoint: Record<string, number>;
    };
  };
  
  availability: {
    uptime: number;        // Percentage
    slaCompliance: number; // Percentage
    downtimeMinutes: number;
  };
  
  security: {
    authenticationFailures: number;
    rateLimitExceedances: number;
    suspiciousActivity: number;
  };
}
```

#### 9.2.2 Alert Configuration
**Alerting Rules**:
```yaml
Alerts:
  critical:
    - name: "API_Down"
      condition: "availability < 95%"
      duration: "5m"
      notification: "immediate"
    
    - name: "High_Error_Rate"
      condition: "error_rate > 5%"
      duration: "10m"
      notification: "immediate"
  
  warning:
    - name: "Slow_Response"
      condition: "p95_response_time > 2s"
      duration: "15m"
      notification: "delayed"
    
    - name: "Rate_Limit_Approaching"
      condition: "usage > 80% of limit"
      duration: "5m"
      notification: "email"
```

## 10. Compliance and Audit

### 10.1 Regulatory Compliance

#### 10.1.1 GACP Compliance
**Integration Requirements**:
- **Traceability**: Complete integration audit trail
- **Data Integrity**: ALCOA+ principles in all integrations
- **Security**: Encryption and access control for all external connections
- **Validation**: Testing and validation documentation for all integrations

#### 10.1.2 Audit Trail
**Integration Audit Log**:
```typescript
interface IntegrationAuditLog {
  logId: string;
  timestamp: Date;
  integration: string;       // Which external system
  operation: string;         // What operation was performed
  direction: 'inbound' | 'outbound';
  endpoint: string;          // API endpoint or service
  requestId: string;         // Unique request identifier
  userId?: string;           // User who initiated (if applicable)
  dataPayload: {
    size: number;            // Data size in bytes
    checksum: string;        // Data integrity verification
    summary: string;         // High-level description
  };
  status: 'success' | 'error' | 'timeout' | 'retry';
  errorDetails?: string;
  responseTime: number;      // Milliseconds
  retryCount: number;
  complianceFlags: string[]; // GACP, GMP, etc.
}
```

### 10.2 Data Privacy and Security

#### 10.2.1 Data Protection
**Privacy Controls**:
- **Data Minimization**: Only share necessary data
- **Encryption**: All data encrypted in transit and at rest
- **Access Controls**: Role-based access to integration endpoints
- **Data Retention**: Automated cleanup of temporary integration data

#### 10.2.2 Security Assessment
**Regular Security Reviews**:
- **Quarterly**: Integration security assessment
- **Annually**: Penetration testing of API endpoints
- **Continuous**: Automated vulnerability scanning
- **Event-driven**: Security review after incidents

## 11. Change Management

### 11.1 Integration Change Control

#### 11.1.1 Change Process
**Change Workflow**:
```
Change Request → Impact Assessment → Risk Analysis → Approval → Testing → Deployment → Validation → Documentation
```

**Change Categories**:
- **Emergency**: Security fixes, critical bug fixes
- **Standard**: Planned enhancements, new integrations
- **Normal**: Configuration changes, routine updates

#### 11.1.2 Rollback Procedures
**Recovery Planning**:
- **Version Control**: All integration configurations versioned
- **Automated Rollback**: One-click rollback to previous version
- **Data Recovery**: Point-in-time recovery for integration data
- **Communication**: Stakeholder notification procedures

## 12. Training and Documentation

### 12.1 Integration Training

#### 12.1.1 Developer Training (8 hours)
- API design principles and best practices
- Security implementation and testing
- Integration patterns and error handling
- Monitoring and troubleshooting procedures

#### 12.1.2 Operations Training (4 hours)
- Integration monitoring and alerting
- Incident response procedures
- Change management processes
- Vendor relationship management

### 12.2 Documentation Maintenance

#### 12.2.1 Living Documentation
**Documentation Types**:
- **API Documentation**: Auto-generated from code
- **Integration Guides**: Step-by-step implementation guides
- **Troubleshooting**: Common issues and solutions
- **Architecture Diagrams**: System integration overview

## 13. Performance and Optimization

### 13.1 Performance Tuning

#### 13.1.1 Optimization Strategies
**Performance Improvements**:
- **Caching**: Redis caching for frequently accessed data
- **Connection Pooling**: Database and HTTP connection optimization
- **Batch Processing**: Bulk operations for efficiency
- **Compression**: Data compression for large transfers

#### 13.1.2 Capacity Planning
**Resource Management**:
- **Traffic Forecasting**: Predict integration load growth
- **Scaling Strategies**: Horizontal and vertical scaling plans
- **Resource Monitoring**: CPU, memory, and network utilization
- **Cost Optimization**: Balance performance and cost

## 14. Vendor Management

### 14.1 Vendor Relationships

#### 14.1.1 Service Level Agreements (SLAs)
**SLA Requirements**:
- **Availability**: 99.9% uptime minimum
- **Response Time**: API response time commitments
- **Support**: Technical support availability and response times
- **Data Recovery**: Recovery time and point objectives

#### 14.1.2 Vendor Assessment
**Regular Reviews**:
- **Performance**: SLA compliance monitoring
- **Security**: Regular security assessments
- **Compliance**: Regulatory compliance verification
- **Innovation**: Technology roadmap alignment

## 15. Revision History

| Version | Date | Description | Author |
|---------|------|-------------|---------|
| 1.0 | 2025-09-13 | Initial SOP creation | IT Manager |

---

**Next Review Date**: September 13, 2026
**Document Owner**: IT Manager
**Approval**: Chief Technology Officer