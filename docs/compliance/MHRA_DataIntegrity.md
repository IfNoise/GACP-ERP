---

### `docs/compliance/MHRA_DataIntegrity.md`

````markdown
# MHRA Data Integrity

## Цель

Следовать требованиям **Data Integrity** MHRA:

- Контроль целостности данных
- Возможность аудита
- Безопасное управление изменениями

## Основные требования

1. **Audit trail** – каждая запись имеет журнал изменений
2. **Validation** – Zod валидация контрактов событий
3. **Backups & DRP** – регулярное резервное копирование и восстановление
4. **Access Control** – права через Keycloak + SCUD для помещений
5. **Error Handling** – ошибки фиксируются отдельными событиями в Kafka

## Применение к ERP

| Требование     | Реализация в ERP                                                            |
| -------------- | --------------------------------------------------------------------------- |
| Audit trail    | Kafka → AuditModule → Immudb                                                |
| Validation     | BaseEvent + DerivedEvent Zod-схемы                                          |
| Backups & DRP  | DRP/BCP модули, регулярное snapshot и replication                           |
| Access Control | Keycloak + SCUD; зоны + права доступа к модулям                             |
| Error Handling | События ошибок печати, расчетов, изменения конфигураций публикуются в Kafka |

## Примеры

```ts
// Событие ошибки печати
import { QRPrintEventSchema } from "../validation/BaseEvent";

const errorEvent = QRPrintEventSchema.parse({
  eventId: "uuid-error",
  timestamp: new Date().toISOString(),
  userId: "user-123",
  plantId: "plant-001",
  eventType: "QR_PRINT_ERROR",
  sourceModule: "PrintModule",
  printerId: "printer-001",
  qrCode: "N/A",
  payloadHash: "sha256...",
  metadata: { reason: "Printer offline" },
});
```
````
