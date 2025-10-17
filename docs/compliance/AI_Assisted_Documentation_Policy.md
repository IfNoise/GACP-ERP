# AI-Assisted Documentation Policy

## 1. Purpose

To define the controlled use of Large Language Models (LLMs) and AI-based assistants in creation, editing, and maintenance of documentation within the GxP-regulated ERP system.

## 2. Scope

Applies to all project documentation stored under version control, including:

- SOPs, URS, FS, DS, IQ, OQ, PQ  
- Validation Reports, Change Controls  
- Compliance and Audit Trail records  
- Internal technical documentation  

## 3. Regulatory References

- **FDA 21 CFR Part 11** – Electronic Records and Signatures  
- **EU GMP Annex 11** – Computerised Systems  
- **GAMP 5** – Risk-Based Approach to Compliant GxP Computerized Systems  
- **MHRA Data Integrity Guidance**  
- **ALCOA+ Principles**

## 4. Definitions

| Term | Definition |
|------|-------------|
| **AI-Generated Content** | Any text produced partially or fully by an LLM or automated generation tool. |
| **Qualified Author** | Designated person responsible for human review and technical accuracy. |
| **QA Approval** | Formal verification and authorization by the Quality Assurance Unit. |
| **Controlled Document** | Approved and versioned record under document control system. |

## 5. Policy Statement

1. AI tools **may assist** in drafting, formatting, summarizing, and analyzing documentation.  
2. **AI-Generated Content must never be published or stored as a controlled copy** without human review and QA approval.  
3. All LLM-drafted documents must include explicit metadata:

```yaml
   ai_generated: true
   author_verified: false
   qa_approved: false
   status: draft

```

4. The following document categories **cannot** include unverified AI content.

   - SOPs, Validation Protocols, Reports
   - CAPA, Deviation, Change Control Records
   - Regulatory Submissions and Audit Responses

5. AI output must be treated as *reference material only* until verified by a qualified author.

## 6. Responsibilities

- **Author:** reviews AI draft, corrects technical content, ensures accuracy.
- **QA Unit:** verifies compliance, versioning, and controlled status.
- **System Owner:** maintains AI usage logs and model version traceability.
- **IT Administrator:** ensures access control and audit trail of AI interactions.

## 7. Procedure

1. **Draft Creation:** AI may generate initial text under human supervision.
2. **Review:** Author validates correctness and completeness.
3. **QA Verification:** QA signs off; sets `qa_approved: true`.
4. **Release:** Only after QA approval document receives controlled status and version number.

## 8. Records and Traceability

- All AI interactions must be logged with:

  - model name and version,
  - date/time,
  - prompt and output references.
  - Logs stored for ≥ 5 years or per QMS policy.

## 9. Validation of AI Tools

If an AI system influences decision-making or produces regulated data, it must undergo:

- documented **risk assessment**,
- **IQ/OQ/PQ** per GAMP 5 App. M9.

## 10. Training and Awareness

All personnel using AI tools must complete training in:

- AI limitations and regulatory constraints;
- Correct use of draft generation;
- Data confidentiality and security obligations.

## 11. Revision Control

- This policy is version-controlled under QMS.
- Changes require QA approval and management review.
