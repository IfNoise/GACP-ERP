# PDF Report Generator Service

## Обзор

PDF Report Generator — это микросервис для автоматической генерации PDF-отчетов на основе событий Audit Trail. Сервис обеспечивает полную GACP-совместимость через цифровые подписи, QR-коды для верификации и интеграцию с Mayan EDMS.

## Архитектура

### Основные компоненты

```text
┌─────────────────────┐    ┌──────────────────────┐    ┌─────────────────────┐
│   Kafka Consumer    │───▶│   PDF Generator      │───▶│   Digital Signer    │
│   audit.events      │    │   @react-pdf/        │    │   OpenSSL CLI       │
└─────────────────────┘    │   renderer           │    └─────────────────────┘
                           └──────────────────────┘                ▼
                                     ▼                  ┌─────────────────────┐
┌─────────────────────┐    ┌──────────────────────┐    │   Storage Layer     │
│   Mayan EDMS        │◀───│   Template Engine    │    │   S3/MinIO backup   │
│   Official Storage  │    │   React Components   │    └─────────────────────┘
└─────────────────────┘    └──────────────────────┘
```

### Технологический стек

- **Runtime**: Node.js + TypeScript (Nx monorepo)
- **PDF Engine**: @react-pdf/renderer
- **Template System**: React-подобные компоненты
- **Digital Signature**: OpenSSL через child_process
- **Message Broker**: KafkaJS
- **EDMS Integration**: Mayan EDMS REST API
- **Storage**: AWS S3 / MinIO Object Storage

## Структура проекта

```text
apps/pdf-service/
├─ src/
│  ├─ main.ts                    # Entry point
│  ├─ kafka-consumer.ts          # Подписка на audit.events
│  └─ config/
│      └─ environment.ts         # Конфигурация окружения

libs/
├─ pdf-generator/                # Генерация PDF
│  ├─ templates/                 # Шаблоны отчетов
│  │   ├─ daily-plant-report.tsx
│  │   ├─ weekly-summary.tsx
│  │   └─ batch-lifecycle.tsx
│  ├─ components/                # Переиспользуемые компоненты
│  │   ├─ Table.tsx
│  │   ├─ Header.tsx
│  │   ├─ QRCode.tsx
│  │   └─ Footer.tsx
│  └─ index.ts                   # Экспорт функции generatePDF()
│
├─ signature/                    # Цифровая подпись
│  ├─ openssl.ts                 # Интерфейс к OpenSSL CLI
│  └─ index.ts                   # Экспорт signPDF(), verifyPDF()
│
├─ storage/                      # Хранение файлов
│  ├─ s3.ts                      # S3/MinIO клиент
│  └─ index.ts                   # Экспорт uploadToStorage()
│
├─ edm/                          # Интеграция с Mayan EDMS
│  ├─ mayan-client.ts            # REST API клиент
│  └─ index.ts                   # Экспорт uploadToMayan()
│
└─ types/                        # TypeScript типы
    ├─ audit-events.ts           # Типы событий Kafka
    ├─ pdf-templates.ts          # Типы шаблонов
    └─ index.ts                  # Экспорт всех типов
```

## Поток данных

### 1. Получение событий из Kafka

```typescript
interface AuditEvent {
  id: string;
  type: "daily_plant_activity" | "batch_completed" | "equipment_calibration";
  timestamp: string;
  payload: {
    period: string;
    userName: string;
    events: Array<PlantEvent | EquipmentEvent | BatchEvent>;
  };
}
```

### 2. Генерация PDF

```typescript
const { filePath, hash } = await generatePDF("daily-plant-report", {
  plantEvents: event.payload.events,
  period: event.payload.period,
  userName: event.payload.userName,
  edmUrl: process.env.MAYAN_BASE_URL,
});
```

### 3. Цифровая подпись

```typescript
const sigPath = await signPDFWithOpenSSL(
  filePath,
  process.env.PRIVATE_KEY_PATH
);
```

### 4. Сохранение и публикация

```typescript
// Резервная копия в S3/MinIO
const backupUrl = await uploadToStorage(filePath);

// Официальное хранение в Mayan EDMS
const edmData = await uploadToMayan(filePath, {
  label: `Report ${period}`,
  hash,
  signaturePath: sigPath,
  template: "daily-plant-report",
});

// Публикация события о готовности отчета
await publishEvent("pdf.generated", {
  documentId: edmData.id,
  hash,
  edmUrl: edmData.url,
  backupUrl,
  template: "daily-plant-report",
});
```

## Шаблоны отчетов

### Базовая структура шаблона

```tsx
import React from "react";
import { Document, Page, StyleSheet } from "@react-pdf/renderer";
import { Header, Footer, Table, QRCode } from "../components";

interface ReportProps {
  period: string;
  userName: string;
  events: EventData[];
  edmUrl: string;
  hash: string;
}

export const DailyPlantReport: React.FC<ReportProps> = (props) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Header
        title="Daily Plant Activity Report"
        period={props.period}
        userName={props.userName}
      />

      <Table
        columns={["Plant ID", "Activity", "Timestamp"]}
        data={props.events}
      />

      <Footer hash={props.hash} />

      <QRCode
        value={`${props.edmUrl}/documents/verify?hash=${props.hash}`}
        style={styles.qr}
      />
    </Page>
  </Document>
);
```

### Поддерживаемые шаблоны

1. **daily-plant-report** — ежедневная активность растений
2. **weekly-summary** — недельная сводка по участкам
3. **batch-lifecycle** — полный жизненный цикл партии
4. **equipment-calibration** — отчеты по калибровке оборудования
5. **audit-trail-export** — экспорт журнала аудита за период

## GACP-совместимость

### Неизменяемость документов

- **SHA-256 hash** для каждого PDF файла
- **Цифровая подпись** через RSA-ключи
- **QR-код** для быстрой верификации
- **Версионирование** в Mayan EDMS

### Трассируемость

```json
{
  "documentId": "doc-2025-09-14-001",
  "template": "daily-plant-report",
  "period": "2025-09-14",
  "hash": "a1b2c3...",
  "signature": "base64-encoded-signature",
  "generatedBy": "pdf-service-v1.2.0",
  "sourceEvents": ["evt-001", "evt-002", "evt-003"],
  "timestamp": "2025-09-14T10:30:00Z"
}
```

### Верификация для аудиторов

1. **Сканирование QR-кода** → переход на страницу верификации
2. **Проверка hash** в Mayan EDMS
3. **Проверка подписи** через OpenSSL:

   ```bash
   openssl dgst -sha256 -verify public_key.pem \
     -signature report.pdf.sig report.pdf
   ```

## Конфигурация

### Переменные окружения

```bash
# Kafka
KAFKA_BROKER=kafka:9092
KAFKA_GROUP_ID=pdf-service-group

# OpenSSL Keys
PRIVATE_KEY_PATH=/etc/ssl/private/pdf-service.pem
PUBLIC_KEY_PATH=/etc/ssl/certs/pdf-service.pem

# Mayan EDMS
MAYAN_API_URL=https://edms.farm.local/api/v4
MAYAN_API_TOKEN=your-api-token

# S3/MinIO Storage
S3_ENDPOINT=https://storage.farm.local
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET=gacp-reports

# Service
PDF_TEMP_DIR=/tmp/pdf-service
MAX_FILE_SIZE_MB=50
```

## Развертывание

### Docker контейнер

```dockerfile
FROM node:20-alpine

# Установка OpenSSL
RUN apk add --no-cache openssl

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/
COPY keys/ ./keys/

USER node
CMD ["node", "dist/main.js"]
```

### Kubernetes манифест

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pdf-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: pdf-service
  template:
    metadata:
      labels:
        app: pdf-service
    spec:
      containers:
        - name: pdf-service
          image: gacp-erp/pdf-service:latest
          env:
            - name: KAFKA_BROKER
              value: "kafka:9092"
            - name: MAYAN_API_URL
              value: "http://mayan-edms:8000/api/v4"
          volumeMounts:
            - name: ssl-keys
              mountPath: /etc/ssl/private
              readOnly: true
      volumes:
        - name: ssl-keys
          secret:
            secretName: pdf-service-keys
```

## Мониторинг и логирование

### Метрики

- `pdf_generation_total` — количество сгенерированных PDF
- `pdf_generation_duration_seconds` — время генерации
- `pdf_signature_total` — количество подписанных документов
- `edm_upload_total` — количество загруженных в EDM документов
- `template_usage_total{template="daily-report"}` — использование шаблонов

### Логи

```json
{
  "timestamp": "2025-09-14T10:30:00Z",
  "level": "info",
  "message": "PDF generated successfully",
  "documentId": "doc-2025-09-14-001",
  "template": "daily-plant-report",
  "hash": "a1b2c3...",
  "fileSize": 1024576,
  "generationTime": 2.3
}
```

## Безопасность

### Ключи подписи

- **Приватный ключ** хранится в Kubernetes Secret
- **Публичный ключ** доступен аудиторам для верификации
- **Ротация ключей** каждые 12 месяцев

### Доступ к EDMS

- **Service Account** с ограниченными правами
- **Rate limiting** для предотвращения злоупотреблений
- **Audit log** всех операций загрузки

## Производительность

### Характеристики

- **Генерация простого отчета**: ~2-3 секунды
- **Генерация сложного отчета** (с графиками): ~5-10 секунд
- **Подпись документа**: ~0.5 секунды
- **Загрузка в EDM**: ~1-2 секунды

### Масштабирование

- **Горизонтальное**: несколько экземпляров сервиса
- **Kafka Consumer Groups**: автоматическое распределение нагрузки
- **Batch processing**: группировка событий для больших отчетов

## Расширения

### Новые шаблоны

1. Создать компонент в `libs/pdf-generator/templates/`
2. Добавить тип в `libs/types/pdf-templates.ts`
3. Обновить switch в `libs/pdf-generator/index.ts`

### Новые форматы

- **Excel отчеты** через ExcelJS
- **HTML отчеты** с возможностью печати
- **JSON структуры** для API интеграций

### Дополнительные подписи

- **Qualified Electronic Signature** (QES) через HSM
- **Blockchain anchoring** через Ethereum/Hyperledger
- **Timestamping** через RFC 3161 серверы

