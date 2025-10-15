---
title: "GAMP 5: A Risk-Based Approach to Compliant GxP Computerized Systems"
version: "Second Edition (2022)"
status: "active"
last_updated: "2025-10-15"
regulatory_authority: "ISPE (International Society for Pharmaceutical Engineering)"
scope: "Validation of computerized systems in GxP environments"
related_standards: "FDA 21 CFR Part 11, EU GMP Annex 11, MHRA Data Integrity, ICH Q9"
---

# GAMP 5: A Risk-Based Approach to Compliant GxP Computerized Systems

## 1. Executive Summary

**GAMP 5** (Good Automated Manufacturing Practice) — это глобально признанное руководство по валидации компьютеризированных систем в фармацевтической и биотехнологической индустрии. Второе издание (2022) фокусируется на **risk-based approach**, **Agile/DevOps совместимости**, и **data integrity**.

### 1.1 Core Philosophy

```yaml
GAMP5_Principles:
  risk_based_approach:
    principle: "Validation effort proportional to risk and complexity"
    benefit: "Efficient use of resources, focused on patient safety"
    
  science_and_risk_based:
    principle: "Scientific understanding + risk assessment"
    tools: "FMEA, HAZOP, FTA (per ICH Q9)"
    
  lifecycle_approach:
    stages: ["Concept", "Design", "Build", "Test", "Deploy", "Operate", "Retire"]
    continuous: "Validation is continuous process, not one-time event"
    
  leveraging_supplier_efforts:
    principle: "Use supplier documentation and testing"
    requirement: "Supplier assessment and qualification"
    
  scalable_documentation:
    principle: "Documentation proportional to risk"
    avoid: "Over-documentation of low-risk systems"
```

### 1.2 GAMP 5 vs GAMP 4 (Key Changes)

**Evolution:**
```yaml
GAMP5_Enhancements:
  risk_emphasis:
    gamp4: "Category-driven validation"
    gamp5: "Risk-driven validation (category is starting point)"
    
  agile_support:
    gamp4: "Waterfall-centric"
    gamp5: "Agile/DevOps compatible with continuous validation"
    
  data_integrity:
    gamp4: "Implicit"
    gamp5: "Explicit ALCOA+ principles, dedicated appendix"
    
  cloud_systems:
    gamp4: "Not addressed"
    gamp5: "Cloud, SaaS, infrastructure as code"
    
  critical_thinking:
    gamp4: "Prescriptive"
    gamp5: "Encourages critical thinking and justification"
```

### 1.3 Applicability to GACP-ERP

**System Classification:**
```yaml
GACP_ERP_GAMP_Classification:
  system_type: "Custom Application (Category 5)"
  justification:
    - "Developed specifically for medical cannabis GACP/GMP"
    - "Bespoke business logic and workflows"
    - "Custom integrations (IoT, LIMS, Keycloak)"
    
  gxp_impact: "Direct GxP Impact"
  modules:
    high_gxp_impact:
      - Batch Management
      - QC/QA Testing
      - Product Release
      - Audit Trail
      - Electronic Signatures
      - Deviation Management
    
    indirect_gxp_impact:
      - Inventory Management
      - Equipment Calibration
      - Training Records
      - Environmental Monitoring
    
    no_gxp_impact:
      - Facility Management (non-GxP areas)
      - General Reporting
```

## 2. GAMP Software Categories (GAMP 5 Appendix M3)

### 2.1 Category Definitions

**Software Classification:**
```yaml
GAMP_Categories:
  category_1_infrastructure:
    description: "Operating systems, databases, middleware"
    examples: ["Linux", "PostgreSQL", "Nginx"]
    validation_approach: "Supplier assessment + IQ"
    gacp_erp_components:
      - "Ubuntu Server 22.04 LTS"
      - "PostgreSQL 15"
      - "Node.js runtime"
    
  category_3_non_configured:
    description: "Off-the-shelf software used as-is"
    examples: ["MS Office", "PDF readers"]
    validation_approach: "Supplier assessment + user requirements verification"
    gacp_erp_components:
      - "None (all software is configured or custom)"
    
  category_4_configured:
    description: "Configurable software (ERP, LIMS)"
    examples: ["SAP", "Oracle", "LabWare LIMS"]
    validation_approach: "Supplier assessment + configuration testing (OQ/PQ)"
    gacp_erp_components:
      - "Keycloak (IAM - configured)"
      - "Kafka (configured for audit events)"
    
  category_5_custom:
    description: "Bespoke/custom-developed software"
    examples: ["In-house developed systems"]
    validation_approach: "Full lifecycle validation (URS → FS → DS → IQ/OQ/PQ)"
    gacp_erp_components:
      - "GACP-ERP Frontend (React/TypeScript)"
      - "GACP-ERP Backend (NestJS/TypeScript)"
      - "Custom IoT integration layer"
      - "Audit consumer service"
      - "Report generation service"
```

### 2.2 Category-Based Validation Effort

**Validation Intensity:**
```yaml
Validation_Effort_Matrix:
  category_1_infrastructure:
    documentation: "Minimal (supplier docs + IQ)"
    testing: "Installation verification"
    effort: "5-10% of total validation"
    
  category_4_configured:
    documentation: "Moderate (config specs + OQ/PQ)"
    testing: "Configuration testing + user acceptance"
    effort: "20-30% of total validation"
    
  category_5_custom:
    documentation: "Extensive (URS/FS/DS + protocols)"
    testing: "Full IQ/OQ/PQ + regression"
    effort: "60-75% of total validation"
    
  gacp_erp_breakdown:
    infrastructure_cat1: "10%"
    configured_cat4: "15%"
    custom_cat5: "75%"
```

## 3. V-Model Lifecycle (GAMP 5 Section 3)

### 3.1 V-Model Overview

**Development and Testing Relationship:**
```yaml
V_Model_Structure:
  left_side_specification:
    concept:
      deliverable: "Business case, feasibility study"
      corresponding_test: "Operational review"
      
    user_requirements:
      deliverable: "User Requirements Specification (URS)"
      corresponding_test: "Performance Qualification (PQ) / UAT"
      
    functional_specification:
      deliverable: "Functional Specification (FS)"
      corresponding_test: "Operational Qualification (OQ)"
      
    design_specification:
      deliverable: "Design Specification (DS)"
      corresponding_test: "Installation Qualification (IQ)"
      
    code_development:
      deliverable: "Source code"
      corresponding_test: "Unit tests, Integration tests"
  
  right_side_verification:
    unit_testing:
      scope: "Individual functions/modules"
      responsibility: "Developers"
      
    integration_testing:
      scope: "Module interactions"
      responsibility: "Developers + QA"
      
    installation_qualification:
      scope: "System installation"
      responsibility: "QA + IT"
      
    operational_qualification:
      scope: "Functional testing"
      responsibility: "QA + SMEs"
      
    performance_qualification:
      scope: "End-to-end business processes"
      responsibility: "QA + Users"
```

### 3.2 GACP-ERP V-Model Implementation

**Traceability Matrix:**
```typescript
interface RequirementsTraceabilityMatrix {
  ursRequirements: {
    id: string;                    // e.g., "URS-001"
    description: string;           // User requirement
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    gxpImpact: 'DIRECT' | 'INDIRECT' | 'NONE';
  }[];
  
  fsRequirements: {
    id: string;                    // e.g., "FS-001"
    description: string;           // Functional requirement
    linkedURS: string[];           // e.g., ["URS-001", "URS-002"]
  }[];
  
  designSpecs: {
    id: string;                    // e.g., "DS-001"
    description: string;           // Technical design
    linkedFS: string[];
  }[];
  
  testCases: {
    id: string;                    // e.g., "TC-001"
    description: string;           // Test description
    testType: 'IQ' | 'OQ' | 'PQ';
    linkedRequirements: string[];  // e.g., ["URS-001", "FS-001"]
    status: 'PASS' | 'FAIL' | 'PENDING';
  }[];
  
  // Traceability verification
  coverage: {
    ursToTestCoverage: number;     // % of URS covered by tests
    criticalRequirements: number;  // All critical = 100% coverage
    gaps: string[];                // Uncovered requirements
  };
}
```

**Documentation:**
- 📋 See `/docs/validation/VMP.md` for validation lifecycle
- 📋 See `/docs/validation/TestCases/` for test protocols

## 4. Risk Management (GAMP 5 Section 5)

### 4.1 ICH Q9 Integration

**Risk-Based Approach:**
```yaml
Risk_Management_Process:
  risk_identification:
    methods:
      - "FMEA (Failure Mode and Effects Analysis)"
      - "HAZOP (Hazard and Operability Study)"
      - "FTA (Fault Tree Analysis)"
    
    focus_areas:
      - "Patient/consumer safety"
      - "Product quality"
      - "Data integrity"
      - "Regulatory compliance"
      - "Business continuity"
  
  risk_analysis:
    factors:
      severity: ["Negligible", "Minor", "Major", "Critical", "Catastrophic"]
      probability: ["Remote", "Low", "Medium", "High", "Very High"]
      detectability: ["High", "Medium", "Low"]
    
    risk_priority_number:
      formula: "Severity × Probability × Detectability"
      threshold: "RPN > 100 = unacceptable"
  
  risk_evaluation:
    criteria:
      critical: "RPN > 100 OR Severity = Catastrophic"
      high: "50 < RPN ≤ 100"
      medium: "20 < RPN ≤ 50"
      low: "RPN ≤ 20"
  
  risk_control:
    strategies:
      - "Prevention (design controls)"
      - "Detection (monitoring, alerts)"
      - "Mitigation (procedures, training)"
      - "Acceptance (low-risk, documented)"
  
  risk_review:
    frequency:
      critical_systems: "Quarterly"
      high_risk: "Semi-annual"
      medium_low_risk: "Annual"
```

### 4.2 GACP-ERP Risk Assessment

**System Risk Profile:**
```yaml
GACP_ERP_Risks:
  data_integrity_risks:
    audit_trail_failure:
      severity: "Critical"
      probability: "Low"
      detectability: "High"
      rpn: 30
      controls:
        - "ImmuDB immutable storage"
        - "Cryptographic verification"
        - "Periodic audit trail review"
    
    unauthorized_data_modification:
      severity: "Critical"
      probability: "Medium"
      detectability: "Medium"
      rpn: 80
      controls:
        - "RBAC with least privilege"
        - "MFA for privileged accounts"
        - "Audit trail alerts"
  
  system_availability_risks:
    database_failure:
      severity: "Major"
      probability: "Low"
      detectability: "High"
      rpn: 25
      controls:
        - "Database replication"
        - "Automated backups (4-hour frequency)"
        - "Disaster recovery plan (RTO 4 hours)"
    
    application_crash:
      severity: "Major"
      probability: "Medium"
      detectability: "High"
      rpn: 40
      controls:
        - "Error handling and logging"
        - "Health monitoring"
        - "Auto-restart mechanisms"
  
  compliance_risks:
    invalid_batch_release:
      severity: "Catastrophic"
      probability: "Remote"
      detectability: "Medium"
      rpn: 50
      controls:
        - "Dual approval workflow"
        - "Automated specification checks"
        - "QP electronic signature required"
```

## 5. Validation Planning (GAMP 5 Section 6)

### 5.1 Validation Master Plan (VMP)

**VMP Content:**
```yaml
VMP_Structure:
  section_1_introduction:
    - Project overview
    - System description (GACP-ERP)
    - Regulatory basis (FDA, EU GMP, MHRA, GACP)
    - Validation approach (GAMP 5, risk-based)
  
  section_2_validation_strategy:
    - GAMP category assignment (Category 5)
    - Risk assessment approach (ICH Q9)
    - V-model lifecycle
    - Agile integration (if applicable)
    - Documentation standards
  
  section_3_roles_responsibilities:
    - Validation team structure
    - Subject matter experts
    - Quality Assurance oversight
    - Approvers (QA Manager, IT Manager, GM)
  
  section_4_system_description:
    - Architecture overview
    - GxP impact assessment
    - Critical vs non-critical functionality
    - Interfaces and integrations
  
  section_5_deliverables:
    - URS (User Requirements Specification)
    - FS (Functional Specification)
    - DS (Design Specification)
    - IQ/OQ/PQ protocols and reports
    - Traceability Matrix
    - Validation Summary Report
  
  section_6_acceptance_criteria:
    - Test pass criteria
    - Deviation handling
    - Re-testing approach
    - Final acceptance signature requirements
  
  section_7_change_control:
    - Change control process
    - Impact assessment
    - Revalidation triggers
  
  section_8_maintenance:
    - Periodic review (annual)
    - Continuous validation
    - Backup and recovery testing
```

**Documentation:**
- 📋 See `/docs/validation/VMP.md`

### 5.2 Validation Protocols

**Protocol Structure (GAMP 5 Appendix O3):**
```typescript
interface ValidationProtocol {
  header: {
    protocolNumber: string;
    title: string;
    version: string;
    systemName: 'GACP-ERP';
    protocolType: 'IQ' | 'OQ' | 'PQ';
    approvals: {
      author: ElectronicSignature;
      reviewer: ElectronicSignature;
      approver: ElectronicSignature;
    };
  };
  
  introduction: {
    purpose: string;
    scope: string;
    references: string[];      // URS, FS, DS, SOPs
    definitions: { term: string; definition: string }[];
  };
  
  systemDescription: {
    overview: string;
    architecture: string;
    gxpImpact: string;
  };
  
  testCases: {
    testId: string;
    requirement: string;       // Linked to URS/FS
    testDescription: string;
    prerequisites: string[];
    testSteps: {
      step: number;
      action: string;
      expectedResult: string;
      actualResult?: string;
      passFailNA: 'PASS' | 'FAIL' | 'N/A';
      tester: string;
      date: Date;
    }[];
    deviations?: {
      deviationNumber: string;
      description: string;
      impact: string;
      resolution: string;
    }[];
  }[];
  
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    na: number;
    deviationCount: number;
    conclusion: string;
    recommendation: 'APPROVED' | 'APPROVED_WITH_DEVIATIONS' | 'REJECTED';
  };
  
  approvalSignatures: {
    tester: ElectronicSignature;
    reviewer: ElectronicSignature;
    qaApprover: ElectronicSignature;
  };
}
```

## 6. Specification (GAMP 5 Section 7)

### 6.1 User Requirements Specification (URS)

**URS Content:**
```yaml
URS_Requirements:
  business_requirements:
    - "System shall support medical cannabis cultivation per WHO GACP"
    - "System shall comply with FDA 21 CFR Part 11"
    - "System shall support traceability from seed to sale"
    
  functional_requirements:
    - "System shall track individual plants with unique IDs"
    - "System shall record environmental data (temp, humidity, CO2)"
    - "System shall generate compliance reports (audit trail, batch records)"
    
  data_requirements:
    - "System shall maintain immutable audit trail (ALCOA+)"
    - "System shall support electronic signatures per FDA Part 11"
    - "System shall retain data for minimum 7 years"
    
  interface_requirements:
    - "System shall integrate with IoT sensors (MQTT protocol)"
    - "System shall integrate with LIMS (HL7 or REST API)"
    - "System shall authenticate users via Keycloak (OAuth 2.0)"
    
  security_requirements:
    - "System shall enforce RBAC with least privilege"
    - "System shall require MFA for privileged accounts"
    - "System shall encrypt data at rest (AES-256) and in transit (TLS 1.3)"
    
  performance_requirements:
    - "System shall have 99.9% availability during business hours"
    - "System shall respond to user actions within 2 seconds (95th percentile)"
    - "System shall support 100 concurrent users"
    
  disaster_recovery:
    - "System shall have RTO of 4 hours"
    - "System shall have RPO of 1 hour"
    - "System shall perform automated backups every 4 hours"
```

**URS Format:**
- Each requirement has unique ID (e.g., URS-FUNC-001)
- Priority (Critical, High, Medium, Low)
- GxP impact (Direct, Indirect, None)
- Verification method (Test, Inspection, Analysis)

### 6.2 Functional Specification (FS)

**FS Detail Level:**
```yaml
FS_Content:
  module_specifications:
    batch_management:
      - "Batch creation workflow with approval"
      - "Batch record data model"
      - "Batch status transitions (In Progress → QC → Released)"
      - "Batch genealogy (parent-child relationships)"
      
    audit_trail:
      - "Audit event schema (WHO, WHAT, WHEN, WHERE, WHY)"
      - "Kafka event publishing"
      - "ImmuDB storage with cryptographic verification"
      - "Audit trail search and reporting"
      
    electronic_signatures:
      - "Signature meanings (Approved, Reviewed, etc.)"
      - "Signature workflow (request → authenticate → record)"
      - "Signature verification and display"
      - "Non-repudiation (cryptographic binding)"
  
  user_interface:
    - "Screen mockups or wireframes"
    - "Navigation flow"
    - "Input validation rules"
    - "Error messages"
  
  interfaces:
    - "API endpoints (ts-rest contracts)"
    - "Data exchange formats (JSON schemas)"
    - "Integration protocols (MQTT, REST, OAuth)"
    - "Error handling"
  
  data_model:
    - "Database schema (PostgreSQL)"
    - "Entity relationships"
    - "Data types and constraints"
    - "Indexing strategy"
```

### 6.3 Design Specification (DS)

**Technical Design:**
```yaml
DS_Content:
  architecture:
    - "Microservices architecture diagram"
    - "Frontend: React + TypeScript + Zod"
    - "Backend: NestJS + TypeScript + Zod"
    - "Data: PostgreSQL (business) + ImmuDB (audit)"
    - "Messaging: Kafka"
    - "Auth: Keycloak"
    
  detailed_design:
    - "Class diagrams (TypeScript interfaces)"
    - "Sequence diagrams (user interactions)"
    - "Database schema (DDL scripts)"
    - "API contract definitions (ts-rest)"
    
  algorithms:
    - "Cannabinoid calculation formulas"
    - "Cryptographic signature algorithm (ECDSA)"
    - "Audit trail hash chaining"
    
  security_design:
    - "Authentication flow (OAuth 2.0 + MFA)"
    - "Authorization model (RBAC)"
    - "Encryption implementation (AES-256, TLS 1.3)"
    - "Key management"
  
  infrastructure:
    - "Server specifications"
    - "Network topology"
    - "Firewall rules"
    - "Backup architecture"
```

## 7. Verification and Testing (GAMP 5 Section 8)

### 7.1 Test Strategy

**Test Coverage:**
```yaml
Test_Types:
  unit_testing:
    scope: "Individual functions and components"
    responsibility: "Developers"
    tools: ["Jest", "Vitest"]
    coverage_target: "80% code coverage"
    gxp_critical: "100% coverage for critical calculations"
    
  integration_testing:
    scope: "Module interactions, API contracts"
    responsibility: "Developers + QA"
    tools: ["Supertest", "Postman"]
    coverage: "All API endpoints"
    
  installation_qualification:
    scope: "System installation verification"
    responsibility: "QA + IT"
    deliverable: "IQ Protocol and Report"
    evidence:
      - "Hardware/VM specifications verified"
      - "Operating system version confirmed"
      - "Database installation verified"
      - "Application deployment successful"
      - "Network connectivity tested"
    
  operational_qualification:
    scope: "Functional testing against FS"
    responsibility: "QA + SMEs"
    deliverable: "OQ Protocol and Report"
    coverage: "All functional requirements from FS"
    examples:
      - "Create batch record"
      - "Record environmental data"
      - "Generate audit trail report"
      - "Electronic signature workflow"
    
  performance_qualification:
    scope: "End-to-end business processes"
    responsibility: "QA + Users"
    deliverable: "PQ Protocol and Report"
    coverage: "All critical business workflows"
    examples:
      - "Complete cultivation cycle (seed to harvest)"
      - "Batch release process"
      - "Deviation investigation workflow"
      - "Regulatory inspection scenario"
```

### 7.2 Test Case Design

**GAMP 5 Test Case Requirements:**
```typescript
interface GAMP5TestCase {
  // Identification
  testId: string;              // e.g., "OQ-BATCH-001"
  testTitle: string;
  testType: 'IQ' | 'OQ' | 'PQ';
  
  // Traceability
  linkedRequirements: {
    ursId?: string;            // e.g., "URS-FUNC-012"
    fsId?: string;             // e.g., "FS-BATCH-003"
    dsId?: string;             // e.g., "DS-API-007"
  };
  
  // Test definition
  objective: string;
  prerequisites: string[];
  testData: any;               // Test data setup
  
  // Test steps
  steps: {
    stepNumber: number;
    action: string;            // What to do
    expectedResult: string;    // What should happen
    actualResult?: string;     // What actually happened
    passFailNA: 'PASS' | 'FAIL' | 'N/A';
    evidence?: string;         // Screenshot, log file, etc.
    executedBy?: string;
    executedDate?: Date;
  }[];
  
  // Risk and priority
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  gxpImpact: 'DIRECT' | 'INDIRECT' | 'NONE';
  
  // Deviation handling
  deviations?: {
    deviationId: string;
    description: string;
    impact: string;
    resolution: string;
    status: 'OPEN' | 'RESOLVED';
  }[];
  
  // Approval
  testResult: 'PASS' | 'FAIL';
  approvedBy?: ElectronicSignature;
}
```

**Documentation:**
- 📋 See `/docs/validation/TestCases/TC-*.md` for examples

## 8. Reporting (GAMP 5 Section 9)

### 8.1 Validation Summary Report (VSR)

**VSR Content:**
```yaml
VSR_Structure:
  executive_summary:
    - "System description"
    - "Validation approach"
    - "Key findings"
    - "Recommendation"
    
  validation_activities:
    - "List of protocols executed"
    - "Test statistics (passed/failed/NA)"
    - "Deviations summary"
    - "CAPA summary"
    
  traceability:
    - "Requirements Traceability Matrix"
    - "Coverage analysis (100% for critical requirements)"
    
  open_items:
    - "Outstanding deviations (if any)"
    - "Planned improvements"
    - "Known limitations"
    
  conclusion:
    - "System is validated and fit for intended use"
    - "Compliance with GAMP 5, FDA 21 CFR Part 11, EU GMP Annex 11"
    
  approvals:
    - "Validation Team Leader"
    - "Quality Assurance Manager"
    - "IT Manager"
    - "General Manager"
```

## 9. Operation and Maintenance (GAMP 5 Section 10)

### 9.1 Change Control

**GAMP 5 Change Management:**
```yaml
Change_Control_Process:
  change_classification:
    major_change:
      definition: "Affects GxP functionality or data integrity"
      examples:
        - "New GxP module"
        - "Audit trail modifications"
        - "E-signature changes"
      validation: "Full regression testing"
      
    minor_change:
      definition: "Low impact, no GxP effect"
      examples:
        - "UI improvements"
        - "Performance optimizations"
        - "Non-GxP reports"
      validation: "Targeted testing"
      
    emergency_change:
      definition: "Critical fix required immediately"
      approval: "Retrospective (within 24 hours)"
      validation: "Expedited testing + full testing post-deployment"
  
  change_workflow:
    - "Change request submitted"
    - "Impact assessment (GxP, risk, effort)"
    - "Approval by Change Control Board"
    - "Development and testing"
    - "Deployment to production"
    - "Post-deployment verification"
    - "Change closure"
```

**Documentation:**
- 📋 See `SOP_ChangeControl.md`

### 9.2 Periodic Review

**Annual Product Review:**
```yaml
Periodic_Review_Process:
  frequency: "Annual minimum"
  
  review_scope:
    - "System performance (uptime, response time)"
    - "Change history (all changes in past year)"
    - "Deviations and incidents"
    - "Audit findings (internal/external)"
    - "Training compliance"
    - "Validation status"
    - "Supplier performance (for Cat 1/4 components)"
    
  deliverable: "Periodic Review Report"
  
  actions:
    - "Revalidation (if needed)"
    - "CAPA for issues identified"
    - "Update to VMP/SOPs (if needed)"
    
  approvals:
    - "Quality Manager"
    - "IT Manager"
    - "General Manager"
```

## 10. Retirement (GAMP 5 Section 11)

### 10.1 System Retirement

**Decommissioning Process:**
```yaml
System_Retirement:
  triggers:
    - "System obsolescence"
    - "Replacement by new system"
    - "Regulatory changes"
    - "Business discontinuation"
  
  retirement_steps:
    data_migration:
      - "Extract all GxP records"
      - "Migrate to new system or archive"
      - "Verify data completeness and integrity"
      
    documentation_archival:
      - "Archive all validation documents"
      - "Archive SOPs and procedures"
      - "Archive audit trail records"
      - "Retain per regulatory requirements (7 years)"
      
    system_deactivation:
      - "Disable user access"
      - "Backup final state"
      - "Remove from production"
      - "Destroy sensitive data (if applicable)"
      
    notification:
      - "Inform stakeholders"
      - "Update system inventory"
      - "Close validation status"
  
  documentation:
    - "System Retirement Plan"
    - "Data Migration Report"
    - "Retirement Summary Report"
    - "Approvals (QA, IT, Management)"
```

## 11. Agile and GAMP 5 (GAMP 5 Appendix D1)

### 11.1 Agile in Regulated Environments

**Continuous Validation:**
```yaml
Agile_GAMP5_Integration:
  principles:
    - "Iterative development with validation"
    - "Continuous testing and integration"
    - "Risk-based approach to documentation"
    - "Sprint-based deliverables"
    
  documentation_strategy:
    user_stories: "Equivalent to URS requirements"
    acceptance_criteria: "Testable specifications"
    sprint_deliverables: "Incremental validation"
    
  testing_approach:
    unit_tests: "Automated, run with every commit"
    integration_tests: "Automated, run with every merge"
    oq_tests: "Executed at end of sprint"
    pq_tests: "Executed at major release"
    
  traceability:
    - "User stories linked to requirements"
    - "Acceptance criteria = test cases"
    - "Automated test results = evidence"
    
  compliance:
    - "Sprint review = verification"
    - "Sprint retrospective = continuous improvement"
    - "Definition of Done includes GxP compliance checks"
```

**GACP-ERP Agile Workflow:**
```yaml
Sprint_Validation:
  sprint_planning:
    - "Select user stories (with GxP impact assessment)"
    - "Define acceptance criteria (testable)"
    - "Identify test cases needed"
    
  sprint_execution:
    - "TDD (Test-Driven Development) for critical functions"
    - "Code review (peer review)"
    - "Automated testing (CI/CD pipeline)"
    
  sprint_review:
    - "Demo to stakeholders"
    - "Acceptance testing"
    - "Document deviations (if any)"
    
  sprint_retrospective:
    - "Review process effectiveness"
    - "Identify improvements"
    - "Update validation strategy (if needed)"
    
  release:
    - "Aggregate sprint deliverables"
    - "Final OQ/PQ testing"
    - "Validation Summary Report"
    - "Release approval"
```

## 12. GACP-ERP GAMP 5 Implementation Matrix

### 12.1 Validation Deliverables

**Documentation Status:**
```yaml
GACP_ERP_Validation_Docs:
  planning:
    vmp: 
      status: "Active"
      location: "/docs/validation/VMP.md"
      last_review: "2025-10-15"
    
    risk_assessment:
      status: "Active"
      location: "/docs/validation/Risk_Assessment.md"
      last_review: "2025-10-15"
  
  specification:
    urs:
      status: "In Progress"
      modules: ["Batch Management", "Audit Trail", "E-Signatures"]
      
    fs:
      status: "In Progress"
      modules: ["Batch Management", "Audit Trail"]
      
    ds:
      status: "In Progress"
      focus: "API contracts (ts-rest), Database schema"
  
  testing:
    iq:
      status: "Planned"
      scope: "Infrastructure installation"
      
    oq:
      status: "Partial (Test Cases created)"
      test_cases:
        - "TC-TRAIN-001 (Training)"
        - "TC-REPORT-001 (Reporting)"
        - "TC-BACKUP-001 (Backup/Recovery)"
        - "TC-ES-001 (Electronic Signatures)"
      
    pq:
      status: "Planned"
      scope: "End-to-end business workflows"
  
  reporting:
    vsr:
      status: "Pending (after testing completion)"
```

### 12.2 Compliance Checklist

| GAMP 5 Section | Requirement | GACP-ERP Status | Evidence |
|----------------|-------------|-----------------|----------|
| **Section 3** | V-Model lifecycle | ✅ Implemented | VMP.md, Traceability Matrix |
| **Section 5** | Risk management | ✅ Implemented | Risk Assessment Report |
| **Section 6** | VMP | ✅ Active | VMP.md |
| **Section 7** | URS/FS/DS | 🔄 In Progress | Specification documents |
| **Section 8** | IQ/OQ/PQ | 🔄 Partial | Test Cases (OQ level) |
| **Section 9** | VSR | ⏳ Pending | After testing completion |
| **Section 10** | Change Control | ✅ Implemented | SOP_ChangeControl.md |
| **Section 10** | Periodic Review | ✅ Defined | SOP_PeriodicReview.md |
| **Appendix D1** | Agile approach | ✅ Compatible | Agile + validation process |
| **Appendix M7** | Data Integrity | ✅ Implemented | ALCOA+ compliance (MHRA_DataIntegrity.md) |

## 13. Glossary

| Term | Definition |
|------|------------|
| **GAMP** | Good Automated Manufacturing Practice |
| **CSV** | Computer System Validation |
| **URS** | User Requirements Specification |
| **FS** | Functional Specification |
| **DS** | Design Specification |
| **IQ** | Installation Qualification |
| **OQ** | Operational Qualification |
| **PQ** | Performance Qualification |
| **VMP** | Validation Master Plan |
| **VSR** | Validation Summary Report |
| **RTM** | Requirements Traceability Matrix |
| **FMEA** | Failure Mode and Effects Analysis |
| **RPN** | Risk Priority Number |

## 14. Revision History

| Version | Date | Description | Author | Approved By |
|---------|------|-------------|--------|-------------|
| 0.1 | 2025-09-01 | Initial reference | System | - |
| 1.0 | 2025-10-15 | Comprehensive GAMP 5 implementation guide with risk-based validation, V-model lifecycle, Agile integration, and GACP-ERP specific implementation | Validation Team | Quality Director |

## 15. Approvals

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Author** | Validation Manager | _________________ | __________ |
| **Technical Reviewer** | IT Manager | _________________ | __________ |
| **Quality Reviewer** | Quality Manager | _________________ | __________ |
| **Final Approver** | General Manager | _________________ | __________ |

---

**Document Control:**
- Document ID: COMP-GAMP5-001
- Location: /docs/compliance/GAMP5.md
- Classification: Internal - Restricted
- Next Review Date: 2026-10-15

## 16. References

- **GAMP 5**: A Risk-Based Approach to Compliant GxP Computerized Systems (Second Edition, 2022)
- **ISPE**: International Society for Pharmaceutical Engineering
- **ICH Q9**: Quality Risk Management
- **FDA 21 CFR Part 11**: Electronic Records; Electronic Signatures
- **EU GMP Annex 11**: Computerised Systems
- **MHRA Data Integrity**: GXP Data Integrity Guidance
- **VMP.md**: Validation Master Plan
- **Risk_Assessment.md**: System risk assessment
- **TestCases/**: OQ/PQ test protocols
- **SOP_ChangeControl.md**: Change management procedures
- **SOP_DeviationManagement.md**: Deviation handling
