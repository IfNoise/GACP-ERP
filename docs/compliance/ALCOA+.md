# ALCOA+

## Цель

Фиксировать данные так, чтобы они соответствовали принципам:

- **Attributable** – кто создал/изменил запись  
- **Legible** – данные читаемые  
- **Contemporaneous** – фиксируются в момент события  
- **Original** – исходная запись сохраняется  
- **Accurate** – корректность и согласованность  
- **Complete** – все необходимые поля заполнены  
- **Consistent** – единый формат и структура  
- **Enduring** – долговременное хранение  
- **Available** – доступность для аудита  

## Применение к ERP

| Принцип     | Реализация в ERP |
|------------|----------------|
| Attributable | Все события имеют `userId` и `sourceModule` |
| Legible     | Структура событий Zod-схем читаема и стандартизирована |
| Contemporaneous | Timestamp фиксируется при событии (`timestamp`) |
| Original    | Immutable storage в Immudb, payloadHash |
| Accurate    | Валидация через Zod, контроль hash и типов |
| Complete    | Traceability matrix связывает события с PlantID / Module |
| Consistent  | Единая BaseEvent-схема для всех модулей |
| Enduring    | Immudb обеспечивает долговременное хранение |
| Available   | Доступно через AuditModule для инспекции и отчётов |

## Примеры событий

```ts
import { BaseEventSchema } from '../validation/BaseEvent';

const event = BaseEventSchema.parse({
  eventId: 'uuid',
  timestamp: new Date().toISOString(),
  userId: 'user-123',
  plantId: 'plant-001',
  eventType: 'QR_PRINT',
  sourceModule: 'PrintModule',
  payloadHash: 'sha256...',
});
Все события публикуются в Kafka и сохраняются в Immudb для полного аудита.

### `docs/compliance/MHRA_DataIntegrity.md`

```markdown
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

| Требование      | Реализация в ERP |
|----------------|----------------|
| Audit trail     | Kafka → AuditModule → Immudb |
| Validation      | BaseEvent + DerivedEvent Zod-схемы |
| Backups & DRP   | DRP/BCP модули, регулярное snapshot и replication |
| Access Control  | Keycloak + SCUD; зоны + права доступа к модулям |
| Error Handling  | События ошибок печати, расчетов, изменения конфигураций публикуются в Kafka |

## Примеры

```ts
// Событие ошибки печати
import { QRPrintEventSchema } from '../validation/BaseEvent';

const errorEvent = QRPrintEventSchema.parse({
  eventId: 'uuid-error',
  timestamp: new Date().toISOString(),
  userId: 'user-123',
  plantId: 'plant-001',
  eventType: 'QR_PRINT_ERROR',
  sourceModule: 'PrintModule',
  printerId: 'printer-001',
  qrCode: 'N/A',
  payloadHash: 'sha256...',
  metadata: { reason: 'Printer offline' }
});
Immutable запись сохраняется в Immudb, доступна через AuditModule и отчеты для инспектора.

yaml
Копировать код
