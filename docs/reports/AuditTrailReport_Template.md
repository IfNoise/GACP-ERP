---
title: "Audit Trail Report"
module: "Audit Trail"
version: "0.1"
status: "draft"
last_updated: "2025-09-01"
# AI-Assisted Documentation Metadata (per AI_Assisted_Documentation_Policy.md)
ai_assisted: true
ai_tool: "GitHub Copilot (GPT-4)"
ai_model_version: "gpt-4-turbo-2024-04-09"
ai_usage_date: "2025-10-16"
ai_purpose: "Documentation generation and compliance review"

# Human Verification (per Section 6-7 of AI Policy)
author_id: "noise83"
author_verified: false  # Author must set to true after review
author_verification_date: null
author_signature_id: null  # Link to DS-ES-001 after e-signature

# QA Approval (per Section 6-7 of AI Policy)
qa_reviewer_id: null
qa_approved: false
qa_approval_date: null
qa_signature_id: null  # Link to DS-ES-001 after QA e-signature

# Document Control (per Section 8 of AI Policy)
document_status: "draft"  # draft | under_review | approved | effective
controlled_copy: false  # Must be false until QA approval
---

# 1. Purpose

Документ фиксирует все действия пользователей в ERP для обеспечения GACP-соответствия.

# 2. Report Parameters

- Period: [Start Date] – [End Date]
- Module: [Plant Lifecycle / Reporting / Training / Other]
- User: [Optional filter by user]
- Action Type: [Create / Update / Delete / e-Signature]

# 3. Audit Trail Entries

| Timestamp        | User                | Module          | Action        | Record ID | e-Signature | Comments             |
| ---------------- | ------------------- | --------------- | ------------- | --------- | ----------- | -------------------- |
| 2025-09-01T10:15 | Cultivation Manager | Plant Lifecycle | Create        | PL-001    | Signed      | Initial creation     |
| 2025-09-01T11:00 | HR Manager          | Training        | Complete Exam | TR-001    | Signed      | Employee passed exam |
| ...              | ...                 | ...             | ...           | ...       | ...         | ...                  |

# 4. Summary

- Total Actions: [number]
- Actions with e-Signature: [number]
- Unusual/Failed Actions: [number]

# 5. Notes

- Этот шаблон используется для автоматической генерации отчетов после выполнения OQ/PQ тестов.
