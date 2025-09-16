# GACP-ERP Copilot Development Instructions

> **Critical Reference Document for all GACP-ERP Development**  
> Date: September 15, 2025  
> Version: 1.0  
> Purpose: Comprehensive guidance for GitHub Copilot on GACP-ERP system development

## 🎯 PROJECT OVERVIEW

**GACP-ERP** is an enterprise-grade regulatory compliance system for medical cannabis cultivation, processing, and distribution. This system must adhere to strict pharmaceutical-grade standards including FDA 21 CFR Part 11, EU GMP Annex 11, and Good Agricultural and Collection Practices (GACP) guidelines.

### Mission Statement

Provide a fully validated, traceable, and compliant ERP system for medical cannabis operations with real-time monitoring, comprehensive audit trails, and regulatory reporting capabilities.

## 📋 MANDATORY PRE-DEVELOPMENT CHECKLIST

Before starting ANY development task, Copilot MUST:

1. **Review Architecture**: Consult `/docs/SYSTEM_ARCHITECTURE.md` for system design principles
2. **Check Technical Standards**: Reference `/docs/CODING_STANDARDS.md` for development guidelines
3. **Validate Compliance**: Ensure alignment with `/docs/compliance/` regulatory requirements
4. **Review SOPs**: Check relevant `/docs/sop/` procedures for operational context
5. **Consider Validation**: Reference `/docs/validation/` for testing and qualification requirements

## 🏗️ SYSTEM ARCHITECTURE PRINCIPLES

### Technology Stack (MANDATORY)

```yaml
# Project Structure & Build System
Monorepo: NX Workspace (TypeScript-first, multi-language support)
Frontend: Next.js 15+ App Router (TypeScript)
Backend: NestJS 10+ (TypeScript)
Shared Libraries: NX libraries for common code
Build System: NX targets and dependency graph

# Observability & Monitoring (CRITICAL - Medical Cannabis Compliance)
Metrics:
  - VictoriaMetrics Cluster (Application Metrics)
  - VictoriaMetrics IoT Cluster (Environmental Data)
Tracing: Tempo (Distributed Tracing)
Logging: Loki (Centralized Logging)
APM: OpenTelemetry (Full Instrumentation)

# IoT & Environmental Monitoring
MQTT: EMQX (Message Broker)
Data Collection: Telegraf (IoT Metrics Collection)
Environmental: Separate monitoring stack for grow environment

# Infrastructure
Containerization: Docker
Orchestration: Kubernetes
Service Mesh: Istio (with mTLS)
```

### Separation of Concerns (CRITICAL)

- **Application Observability**: Business logic, user interactions, system performance
- **Environmental IoT**: Temperature, humidity, CO2, light levels, irrigation data
- **Compliance Monitoring**: Audit trails, regulatory data, validation metrics

## 📚 DOCUMENTATION MATRIX

### Core Architecture & Design

| Document                          | Purpose                              | When to Reference       |
| --------------------------------- | ------------------------------------ | ----------------------- |
| `/docs/SYSTEM_ARCHITECTURE.md`    | System design, components, data flow | All development tasks   |
| `/docs/TECHNICAL_REQUIREMENTS.md` | Technical specifications             | Feature development     |
| `/docs/CODING_STANDARDS.md`       | Code quality, patterns, conventions  | All coding tasks        |
| `/docs/EVENT_ARCHITECTURE.md`     | Event-driven patterns, messaging     | Integration development |

### Regulatory Compliance (CRITICAL)

| Document                               | Regulation                     | When to Reference          |
| -------------------------------------- | ------------------------------ | -------------------------- |
| `/docs/compliance/FDA_21CFR_Part11.md` | US FDA Electronic Records      | All data handling features |
| `/docs/compliance/EU_GMP_Annex11.md`   | EU Good Manufacturing Practice | Manufacturing workflows    |
| `/docs/compliance/WHO_GACP.md`         | Good Agricultural Practices    | Cultivation features       |
| `/docs/compliance/ALCOA+.md`           | Data integrity principles      | Data validation            |

### Standard Operating Procedures

| Category               | Key SOPs                                    | Reference For                 |
| ---------------------- | ------------------------------------------- | ----------------------------- |
| **Data Management**    | `SOP_DataIntegrity.md`, `SOP_DataBackup.md` | Database operations           |
| **Quality Management** | `SOP_QMS_Governance.md`, `SOP_CAPA.md`      | Quality workflows             |
| **Security**           | `SOP_ITSecurity.md`, `SOP_AccessControl.md` | Authentication, authorization |
| **Cultivation**        | `SOP_GrowthMonitoring.md`, `SOP_Harvest.md` | Agricultural features         |
| **Chain of Custody**   | `SOP_ChainOfCustody.md`, `SOP_Sampling.md`  | Traceability features         |

### Validation & Testing

| Document                                 | Purpose                    | When to Reference     |
| ---------------------------------------- | -------------------------- | --------------------- |
| `/docs/validation/URS.md`                | User Requirements          | Feature specification |
| `/docs/validation/IQ.md`                 | Installation Qualification | Deployment procedures |
| `/docs/validation/OQ.md`                 | Operational Qualification  | System testing        |
| `/docs/validation/PQ.md`                 | Performance Qualification  | Performance testing   |
| `/docs/validation/TraceabilityMatrix.md` | Requirements traceability  | Testing coverage      |

### Business Continuity

| Document                                   | Purpose             | When to Reference            |
| ------------------------------------------ | ------------------- | ---------------------------- |
| `/docs/drp_bcp/DISASTER_RECOVERY_PLAN.md`  | DR procedures       | Infrastructure changes       |
| `/docs/drp_bcp/BUSINES_CONTINUITY_PLAN.md` | Business continuity | Critical feature development |

## 🚀 DEVELOPMENT WORKFLOWS

### 1. New Feature Development

```markdown
MANDATORY SEQUENCE:

1. Review URS (/docs/validation/URS.md) for requirements context
2. Check SYSTEM_ARCHITECTURE.md for design patterns
3. Consult relevant SOPs for operational procedures
4. Implement with CODING_STANDARDS.md compliance
5. Add tracing/metrics per observability stack
6. Update TraceabilityMatrix.md
7. Add validation test cases
```

### 2. Integration Development

```markdown
MANDATORY SEQUENCE:

1. Review EVENT_ARCHITECTURE.md for messaging patterns
2. Check SOP_ITSecurity.md for security requirements
3. Implement with OpenTelemetry instrumentation
4. Add to VictoriaMetrics monitoring
5. Document in SYSTEM_ARCHITECTURE.md
6. Update integration test cases
```

### 3. Compliance Feature Development

```markdown
MANDATORY SEQUENCE:

1. Identify applicable regulations (FDA/EU GMP/GACP)
2. Review specific compliance document
3. Check ALCOA+ principles for data integrity
4. Implement with full audit trail
5. Add compliance monitoring
6. Update ComplianceChecklist.md
7. Add regulatory test scenarios
```

### 4. Infrastructure Changes

```markdown
MANDATORY SEQUENCE:

1. Review SYSTEM_ARCHITECTURE.md for impact
2. Check DISASTER_RECOVERY_PLAN.md for DR implications
3. Update IQ.md if installation procedures change
4. Test with OQ.md operational procedures
5. Validate with PQ.md performance criteria
6. Document changes
```

## 🔧 CODING STANDARDS ENFORCEMENT

### Observability (MANDATORY)

```go
// REQUIRED: Every service must include
import (
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/trace"
    "go.opentelemetry.io/otel/metric"
)

// REQUIRED: Compliance context in all operations
type ComplianceContext struct {
    UserID       string    `json:"user_id"`
    Timestamp    time.Time `json:"timestamp"`
    Operation    string    `json:"operation"`
    AuditTrail   bool      `json:"audit_trail"`
    Regulation   string    `json:"regulation"` // FDA, EU_GMP, GACP
}
```

### Error Handling (REGULATORY CRITICAL)

```go
// REQUIRED: All errors must be traceable
type ComplianceError struct {
    Code        string    `json:"code"`
    Message     string    `json:"message"`
    Timestamp   time.Time `json:"timestamp"`
    UserID      string    `json:"user_id"`
    Regulation  string    `json:"regulation"`
    Severity    string    `json:"severity"`
    AuditRef    string    `json:"audit_ref"`
}
```

### Data Validation (ALCOA+ COMPLIANCE)

```go
// REQUIRED: All data operations must validate ALCOA+ principles
func ValidateALCOAPlus(data interface{}) error {
    // Attributable: Clear data ownership
    // Legible: Human readable
    // Contemporaneous: Real-time capture
    // Original: Source data integrity
    // Accurate: Correct and complete
}
```

## 🛡️ SECURITY REQUIREMENTS

### Authentication & Authorization

- **Reference**: `/docs/sop/SOP_AccessControl.md`
- **Implementation**: Role-based access control (RBAC)
- **Compliance**: 21 CFR Part 11 electronic signatures

### Data Protection

- **Reference**: `/docs/sop/SOP_DataIntegrity.md`
- **Implementation**: Encryption at rest and in transit
- **Compliance**: EU GMP Annex 11 data integrity

### Audit Trails

- **Reference**: `/docs/sop/SOP_AuditTrail.md`
- **Implementation**: Immutable audit logs
- **Compliance**: Complete change tracking

## 📊 MONITORING & ALERTING

### Application Metrics (VictoriaMetrics)

```yaml
Business Metrics:
  - cultivation_batch_progress
  - quality_test_results
  - compliance_violations
  - user_authentication_events

Technical Metrics:
  - service_response_time
  - database_performance
  - error_rates
  - system_resources
```

### Environmental IoT Metrics (VictoriaMetrics IoT)

```yaml
Environmental Metrics:
  - grow_room_temperature
  - humidity_levels
  - co2_concentration
  - light_intensity
  - irrigation_flow_rates
```

### Distributed Tracing (Tempo)

- **Scope**: All service-to-service communication
- **Context**: Compliance context propagation
- **Retention**: Regulatory requirements (minimum 3 years)

## 🧪 TESTING REQUIREMENTS

### Validation Testing

- **Installation**: Follow IQ.md procedures
- **Operational**: Execute OQ.md test cases
- **Performance**: Validate PQ.md criteria
- **Traceability**: Update TraceabilityMatrix.md

### Compliance Testing

- **Reference**: `/docs/reports/ComplianceChecklist.md`
- **Coverage**: All regulatory requirements
- **Documentation**: Detailed test evidence

## 📋 CHANGE MANAGEMENT

### Change Control Process

1. **Impact Assessment**: Review affected SOPs
2. **Risk Analysis**: Update RA.md if needed
3. **Validation Impact**: Check validation documents
4. **Approval**: Follow SOP_ChangeControl.md
5. **Implementation**: Document all changes
6. **Verification**: Test per validation protocols

## 🏆 QUALITY ASSURANCE

### Code Review Checklist

- [ ] Follows CODING_STANDARDS.md
- [ ] Includes OpenTelemetry instrumentation
- [ ] Implements ALCOA+ data principles
- [ ] Updates relevant documentation
- [ ] Adds appropriate test cases
- [ ] Considers regulatory compliance
- [ ] Reviews security implications

### Documentation Requirements

- [ ] Update SYSTEM_ARCHITECTURE.md if needed
- [ ] Review SOPs for operational impact
- [ ] Update validation documents
- [ ] Check compliance documentation
- [ ] Update TraceabilityMatrix.md

## ⚠️ CRITICAL REMINDERS

### NEVER Compromise On

1. **Regulatory Compliance**: Always follow FDA/EU GMP/GACP requirements
2. **Data Integrity**: ALCOA+ principles are non-negotiable
3. **Audit Trails**: Complete traceability is mandatory
4. **Security**: Follow all security SOPs
5. **Validation**: All changes must be validated

### ALWAYS Consider

1. **Patient Safety**: Medical cannabis end-users
2. **Regulatory Inspections**: Documentation will be audited
3. **Data Retention**: Long-term storage requirements
4. **Business Continuity**: System availability critical
5. **Scalability**: Growth of operations

## 📞 ESCALATION PROCEDURES

When encountering:

- **Regulatory Questions**: Consult compliance documentation first
- **Architecture Decisions**: Review SYSTEM_ARCHITECTURE.md
- **Security Concerns**: Follow SOP_ITSecurity.md
- **Quality Issues**: Apply SOP_QMS_Governance.md
- **Data Problems**: Reference SOP_DataIntegrity.md

## 🔄 CONTINUOUS IMPROVEMENT

### Documentation Updates

- Keep all documentation current with implementations
- Update validation documents for any changes
- Maintain traceability matrices
- Review SOPs for operational alignment

### Technology Evolution

- Maintain modern observability stack
- Keep security measures current
- Update compliance procedures as regulations evolve
- Enhance monitoring and alerting

---

## 📖 QUICK REFERENCE GUIDE

### Primary Instruction Documents

1. **This Document**: `.github/instructions/copilot.instructions.md` - Master instruction reference
2. **Navigation Guide**: `docs/DOCUMENTATION_NAVIGATION_MATRIX.md` - Complete document inventory and navigation
3. **Workflow Guide**: `docs/DEVELOPMENT_WORKFLOW_GUIDE.md` - Detailed workflow patterns and procedures
4. **Integration Overview**: `README_COPILOT_INTEGRATION.md` - Quick start and overview guide

### Most Critical Documents for Daily Development

1. `/docs/SYSTEM_ARCHITECTURE.md` - System design
2. `/docs/CODING_STANDARDS.md` - Development standards
3. `/docs/compliance/ALCOA+.md` - Data integrity
4. `/docs/validation/TraceabilityMatrix.md` - Requirements traceability
5. `/docs/sop/SOP_DataIntegrity.md` - Data handling procedures

### Emergency References

- **Security Incident**: `/docs/sop/SOP_ITSecurity.md`
- **Data Breach**: `/docs/sop/SOP_DataIntegrity.md`
- **System Failure**: `/docs/drp_bcp/DISASTER_RECOVERY_PLAN.md`
- **Compliance Violation**: `/docs/reports/ComplianceChecklist.md`

---

**Remember**: This is a medical cannabis system where patient safety and regulatory compliance are paramount. Every line of code should reflect this responsibility.

_Last Updated: September 15, 2025_  
_Next Review: December 15, 2025_
