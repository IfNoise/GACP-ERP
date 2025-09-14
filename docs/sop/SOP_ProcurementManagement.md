---
title: "SOP: Procurement Management & Supplier Integration"
sop_id: "SOP-PR-001"
version: "1.0"
effective_date: "2025-09-13"
review_date: "2026-09-13"
department: "Procurement / Supply Chain"
process_owner: "Procurement Manager"
approver: "Operations Director"
related_sops:
  - "SOP_SupplierQualification.md"
  - "SOP_RawMaterialReception.md"
  - "SOP_InventoryManagement.md"
  - "SOP_FinancialAccounting.md"
risk_level: "High"
---

# SOP: Procurement Management & Supplier Integration

## 1. Purpose

Establish standardized procedures for procurement operations including supplier management, purchase order processing, receiving, and quality control to ensure continuous supply of compliant materials while maintaining GACP requirements and cost optimization.

## 2. Scope

This SOP covers:
- Supplier qualification and performance management
- Purchase order creation and approval workflows
- Receiving and quality control processes
- Inventory management integration
- Financial system integration
- Compliance documentation and audit trail

## 3. Responsibilities

| Role | Responsibility |
|------|---------------|
| **Procurement Manager** | Strategic sourcing, supplier relationships, policy enforcement |
| **Procurement Specialist** | Daily procurement operations, PO processing, supplier communication |
| **Receiving Clerk** | Material receipt, inspection, documentation |
| **QA Manager** | Supplier qualification approval, material quality verification |
| **Finance Manager** | Budget control, payment authorization, cost analysis |
| **Warehouse Manager** | Inventory management, storage allocation |

## 4. Supplier Management

### 4.1 Supplier Qualification Process

#### 4.1.1 Initial Supplier Evaluation
**Qualification Criteria**:
- **Regulatory Compliance**: GACP/GMP certifications where applicable
- **Quality Systems**: ISO 9001 or equivalent quality management
- **Financial Stability**: Credit rating, financial statements review
- **Supply Capacity**: Ability to meet volume and delivery requirements
- **Geographic Considerations**: Proximity, shipping capabilities, import/export

**Documentation Requirements**:
```yaml
Supplier_Qualification_Package:
  legal_documents:
    - business_license
    - tax_certificates
    - insurance_certificates
    - regulatory_permits
  
  quality_documentation:
    - quality_certifications
    - test_certificates
    - sds_sheets
    - product_specifications
  
  operational_information:
    - production_capacity
    - lead_times
    - minimum_order_quantities
    - payment_terms
```

#### 4.1.2 Supplier Approval Workflow
1. **Initial Application**:
   - Supplier submits qualification package
   - Procurement reviews completeness
   - Initial scoring based on criteria

2. **Quality Assessment**:
   - QA reviews quality documentation
   - Sample testing if required
   - Site audit for critical suppliers

3. **Financial Review**:
   - Credit check and financial analysis
   - Payment terms negotiation
   - Contract development

4. **Final Approval**:
   - Cross-functional approval committee
   - Supplier onboarding to ERP system
   - Contract execution and filing

### 4.2 Supplier Performance Management

#### 4.2.1 Key Performance Indicators (KPIs)
```typescript
interface SupplierKPIs {
  supplierId: string;
  performancePeriod: DateRange;
  metrics: {
    qualityScore: number;      // % of batches passing QC
    deliveryPerformance: number; // % on-time deliveries
    costPerformance: number;   // Actual vs. budgeted costs
    responsiveness: number;    // Response time to inquiries
    complianceScore: number;   // Audit and documentation compliance
  };
  overallRating: 'excellent' | 'good' | 'acceptable' | 'poor';
  actionItems: string[];
  nextReviewDate: Date;
}
```

#### 4.2.2 Performance Review Process
**Monthly Reviews**:
- Automated KPI calculation from ERP data
- Exception reporting for performance issues
- Corrective action planning for underperformers

**Quarterly Business Reviews**:
- Comprehensive performance analysis
- Strategic discussions on capacity and capabilities
- Contract renegotiation opportunities
- Continuous improvement initiatives

**Annual Supplier Audits**:
- On-site or virtual audit of critical suppliers
- Compliance verification with GACP requirements
- Risk assessment and mitigation planning
- Supplier development opportunities

## 5. Purchase Order Management

### 5.1 Purchase Requisition Process

#### 5.1.1 Automatic Requisition Generation
**Triggers for Auto-Requisition**:
- Inventory levels reach reorder points
- Production schedule requirements
- Maintenance schedules for equipment/supplies
- Emergency stock requirements

**Requisition Workflow**:
```
Inventory Alert → Auto-Generate Requisition → Department Approval → Procurement Review → Supplier Selection → PO Creation
```

#### 5.1.2 Manual Requisition Process
1. **Requisition Creation**:
   - Department submits request via ERP system
   - Include specifications, quantities, delivery requirements
   - Budget code and cost center assignment
   - Justification for non-standard requests

2. **Approval Workflow**:
   - Department manager approval
   - Budget holder approval for significant amounts
   - Procurement review for supplier and pricing
   - Final authorization based on spending limits

### 5.2 Purchase Order Processing

#### 5.2.1 PO Creation and Approval
**Standard PO Process**:
```typescript
interface PurchaseOrder {
  poNumber: string;
  requisitionId: string;
  supplierId: string;
  deliveryLocation: string;
  requestedDeliveryDate: Date;
  lineItems: {
    itemId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    glAccount: string;
    lotRequirements?: string;
  }[];
  terms: {
    paymentTerms: string;
    deliveryTerms: string;
    qualityRequirements: string;
    complianceRequirements: string[];
  };
  approvals: ApprovalRecord[];
  status: 'draft' | 'approved' | 'sent' | 'acknowledged' | 'delivered' | 'invoiced';
}
```

**Approval Matrix**:
| Amount Range | Required Approvals |
|--------------|-------------------|
| $0 - $1,000 | Procurement Specialist |
| $1,001 - $10,000 | Procurement Manager |
| $10,001 - $50,000 | Procurement Manager + Department Head |
| $50,001+ | Procurement Manager + Finance Manager + Operations Director |

#### 5.2.2 PO Communication and Tracking
- **Electronic PO Transmission**: Email, EDI, or supplier portal
- **Acknowledgment Tracking**: Confirmation of receipt and acceptance
- **Delivery Tracking**: Real-time status updates from suppliers
- **Exception Management**: Alerts for delays or changes

## 6. Receiving and Quality Control

### 6.1 Receiving Process

#### 6.1.1 Standard Receiving Procedure
1. **Delivery Notification**:
   - Advance shipping notice (ASN) from supplier
   - Delivery appointment scheduling
   - Receiving area preparation

2. **Physical Receipt**:
   - Verify delivery against PO and shipping documents
   - Count quantities and check for damage
   - QR code scanning for automatic data capture
   - Photographic documentation of deliveries

3. **System Processing**:
   - Create receiving record in ERP system
   - Update inventory quantities
   - Generate inspection work orders for QC
   - Trigger payment processing workflow

#### 6.1.2 Quality Control Integration
**QC Sampling Protocol**:
```yaml
QC_Inspection:
  raw_materials:
    sampling_rate: "10% of lots, minimum 1 unit"
    tests_required:
      - identity_verification
      - purity_testing
      - contaminant_screening
      - certificate_verification
  
  packaging_materials:
    sampling_rate: "5% of lots"
    tests_required:
      - dimensional_check
      - print_quality
      - barrier_properties
  
  equipment_supplies:
    sampling_rate: "100% visual inspection"
    tests_required:
      - completeness_check
      - damage_assessment
      - compliance_verification
```

**QC Decision Matrix**:
- **Accept**: Full quantity approved for use
- **Accept with Deviation**: Approved with restrictions or rework
- **Conditional Accept**: Approved pending additional testing
- **Reject**: Return to supplier or dispose properly

### 6.2 Non-Conforming Material Management

#### 6.2.1 Non-Conformance Process
1. **Identification and Isolation**:
   - Immediate segregation of non-conforming materials
   - Red tag identification system
   - Secure storage in quarantine area

2. **Investigation and Documentation**:
   - Root cause analysis
   - Supplier notification and response
   - Corrective action plan development
   - Impact assessment on operations

3. **Disposition Decision**:
   - Engineering review for usability
   - Cost-benefit analysis of rework vs. disposal
   - Supplier return authorization if applicable
   - Final disposition and closure

## 7. Integration Points

### 7.1 ERP System Integration

#### 7.1.1 Real-Time Data Flow
```
Supplier → PO Creation → Inventory → Receiving → QC → Financial
    ↓           ↓           ↓          ↓       ↓        ↓
  Master     Budget     Allocation  Inspection Invoice  Payment
   Data     Control      Update     Results   Creation  Processing
```

#### 7.1.2 Financial Integration
- **Budget Control**: Real-time budget checking during PO approval
- **Cost Allocation**: Automatic GL coding and cost center assignment
- **Invoice Matching**: Three-way matching (PO, Receipt, Invoice)
- **Payment Processing**: Automated payment scheduling based on terms

### 7.2 Quality Management Integration
- **Supplier Audits**: Integration with audit scheduling and results
- **Certificate Management**: COA tracking and expiration monitoring
- **Deviation Management**: Link procurement issues to CAPA system
- **Qualification Updates**: Real-time supplier status updates

### 7.3 Production Planning Integration
- **Demand Forecasting**: Integration with production schedules
- **Lead Time Management**: Dynamic lead time updates for planning
- **Critical Path Identification**: Flag materials affecting production
- **Alternative Sourcing**: Backup supplier activation protocols

## 8. Technology Features

### 8.1 E-Procurement Platform

#### 8.1.1 Supplier Portal
**Features**:
- **Order Management**: View POs, acknowledge orders, update status
- **Catalog Management**: Maintain product catalogs and pricing
- **Invoice Submission**: Electronic invoice submission and tracking
- **Performance Dashboard**: Real-time performance metrics and feedback

#### 8.1.2 Mobile Receiving App
- **Barcode/QR Scanning**: Automated data capture for efficiency
- **Photo Documentation**: Visual evidence of deliveries and conditions
- **Digital Signatures**: Electronic receipt confirmation
- **Offline Capability**: Function without network connectivity

### 8.2 Analytics and Reporting

#### 8.2.1 Procurement Analytics
```sql
-- Supplier performance analysis
SELECT 
    s.supplier_name,
    COUNT(po.po_id) as total_orders,
    AVG(CASE WHEN r.receipt_date <= po.requested_date THEN 1 ELSE 0 END) * 100 as on_time_delivery,
    AVG(qc.quality_score) as avg_quality_score,
    SUM(po.total_amount) as total_spend
FROM suppliers s
JOIN purchase_orders po ON s.supplier_id = po.supplier_id
JOIN receipts r ON po.po_id = r.po_id
JOIN qc_inspections qc ON r.receipt_id = qc.receipt_id
WHERE po.po_date >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH)
GROUP BY s.supplier_id, s.supplier_name
ORDER BY total_spend DESC;
```

#### 8.2.2 Cost Analysis and Optimization
- **Spend Analysis**: Category-wise spending trends and patterns
- **Price Benchmarking**: Market price comparison and negotiation support
- **Contract Utilization**: Tracking usage against contracted volumes
- **Savings Tracking**: Measurement of cost reduction initiatives

## 9. Compliance and Audit

### 9.1 GACP Compliance Requirements

#### 9.1.1 Supplier Documentation
- **Certificate Management**: Current regulatory certificates
- **Traceability Records**: Complete supply chain documentation
- **Quality Agreements**: Formal quality requirements and responsibilities
- **Audit Reports**: Regular assessment of supplier compliance

#### 9.1.2 Material Traceability
```typescript
interface MaterialLot {
  lotNumber: string;
  supplierId: string;
  productId: string;
  manufacturingDate: Date;
  expirationDate?: Date;
  certificates: {
    coa: string;           // Certificate of Analysis
    gmp: string;           // GMP certificate
    organic?: string;      // Organic certification
    testing: TestResult[]; // Third-party testing
  };
  traceability: {
    source: string;        // Ultimate source/manufacturer
    intermediaries: string[]; // Distribution chain
    transporters: string[]; // Shipping companies
  };
  usage: {
    allocatedTo: string[]; // Which batches used this material
    remainingQuantity: number;
    status: 'active' | 'depleted' | 'expired' | 'recalled';
  };
}
```

### 9.2 Audit Trail and Documentation

#### 9.2.1 Required Records
- **Supplier qualification documentation**
- **Purchase orders and amendments**
- **Receiving records and QC results**
- **Non-conformance reports and CAPAs**
- **Supplier performance reviews**
- **Contract agreements and modifications**

#### 9.2.2 Record Retention
- **Active supplier records**: Duration of relationship + 7 years
- **Quality documentation**: 10 years minimum
- **Financial records**: Per accounting standards (typically 7 years)
- **Audit reports**: 10 years
- **CAPA records**: 5 years post-closure

## 10. Emergency Procedures

### 10.1 Supply Chain Disruption

#### 10.1.1 Immediate Response
1. **Impact Assessment**:
   - Identify affected materials and production impact
   - Calculate available inventory and runway
   - Assess alternative supplier capabilities

2. **Activation of Backup Plans**:
   - Contact pre-qualified alternative suppliers
   - Expedite orders from existing suppliers
   - Consider temporary specification changes if approved

3. **Communication Protocol**:
   - Notify affected departments and stakeholders
   - Update production schedules and priorities
   - Communicate with customers if delivery impacts expected

#### 10.1.2 Supplier Recovery Support
- **Collaborative Recovery Planning**: Work with suppliers on recovery timelines
- **Financial Support**: Consider advance payments or longer terms if beneficial
- **Temporary Quality Exceptions**: Risk-based decisions on specifications
- **Long-term Relationship Strengthening**: Learn from crisis and improve partnerships

### 10.2 Quality Issues and Recalls

#### 10.2.1 Material Recall Process
1. **Immediate Actions**:
   - Stop use of affected materials immediately
   - Identify and quarantine all affected inventory
   - Trace usage in production batches
   - Assess risk to final products

2. **Investigation and Response**:
   - Work with supplier on root cause analysis
   - Implement interim quality measures
   - Consider supplier relationship implications
   - Document lessons learned and improve processes

## 11. Continuous Improvement

### 11.1 Process Optimization

#### 11.1.1 Regular Process Reviews
- **Monthly KPI Reviews**: Track procurement efficiency and effectiveness
- **Quarterly Process Audits**: Identify improvement opportunities
- **Annual Strategic Reviews**: Align procurement strategy with business goals
- **Continuous Feedback**: Gather input from stakeholders and suppliers

#### 11.1.2 Technology Enhancement
- **Automation Opportunities**: Identify manual processes for automation
- **Integration Improvements**: Enhance data flow between systems
- **User Experience**: Simplify interfaces and improve usability
- **Advanced Analytics**: Implement AI/ML for better decision-making

### 11.2 Sustainability and Innovation

#### 11.2.1 Sustainable Sourcing
- **Environmental Criteria**: Include sustainability in supplier evaluation
- **Local Sourcing**: Preference for local suppliers to reduce carbon footprint
- **Packaging Optimization**: Work with suppliers on sustainable packaging
- **Circular Economy**: Explore recycling and reuse opportunities

#### 11.2.2 Innovation Partnerships
- **Supplier Innovation**: Collaborate on new products and technologies
- **Cost Reduction Initiatives**: Joint efforts to reduce total cost of ownership
- **Quality Improvements**: Continuous improvement in material quality
- **Digital Transformation**: Leverage technology for competitive advantage

## 12. Training and Competency

### 12.1 Initial Training (8 hours)
- Procurement policies and procedures
- ERP system navigation and functionality
- Supplier management and relationship building
- Quality control and GACP compliance
- Contract negotiation and management

### 12.2 Ongoing Training
- **Monthly**: New supplier and product training
- **Quarterly**: System updates and process improvements
- **Annually**: Advanced procurement strategies and market analysis
- **As Needed**: Emergency procedures and crisis management

## 13. Revision History

| Version | Date | Description | Author |
|---------|------|-------------|---------|
| 1.0 | 2025-09-13 | Initial SOP creation | Procurement Manager |

---

**Next Review Date**: September 13, 2026
**Document Owner**: Procurement Manager
**Approval**: Operations Director