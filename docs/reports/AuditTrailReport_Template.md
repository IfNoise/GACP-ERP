---
title: "Audit Trail Report"
module: "Audit Trail"
version: "0.1"
status: "draft"
last_updated: "2025-09-01"
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
