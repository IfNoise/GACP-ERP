# GACP-ERP Data Dictionary

**Version**: 2.0  
**Last Updated**: 2025-10-17  
**Next Review**: 2026-01-17  
**Status**: Active - Aligned with DS v2.0

## 🎯 DS v2.0 Compliance Structures

This data dictionary is fully synchronized with **Data Specification (DS) v2.0**, which introduces 7 new compliance management modules:

### � Compliance Modules (DS v2.0)

| Module | Zod Schema | Events (Kafka) | REST API | Description |
|--------|-----------|----------------|----------|-------------|
| **Change Control** | `ChangeControlZodSchema` | Section 9 (8 topics, 15 events) | 26 endpoints | Управление изменениями с GxP compliance |
| **CAPA** | `CAPAZodSchema` | Section 10 (6 topics, 12 events) | 26 endpoints | Corrective & Preventive Actions |
| **Deviation** | `DeviationZodSchema` | Section 11 (5 topics, 10 events) | 26 endpoints | Управление отклонениями |
| **Validation** | `ValidationZodSchema` | Section 12 (4 topics, 8 events) | 26 endpoints | Lifecycle валидации (GAMP 5) |
| **Quality Events** | `QualityEventZodSchema` | Section 13 (3 topics, 6 events) | 26 endpoints | Управление качественными событиями |
| **Training** | `TrainingZodSchema` | Section 14 (2 topics, 4 events) | 26 endpoints | Обучение и компетенции |
| **Documents** | `DocumentZodSchema` | Section 15 (1 topic, 3 events) | 26 endpoints | Контроль документов |
| **Analytics** | `AnalyticsZodSchema` | Section 16 (2 topics, 5 events) | N/A | Аналитика и отчётность |

**Enhanced Structures (DS v2.0)**:
- `ElectronicSignatureZodSchema` - 21 CFR Part 11 compliant signatures
- `AuditTrailZodSchema` - ALCOA+ compliant audit trail
- `UserZodSchema` - Enhanced with GxP roles and competencies
- `GxPValidationFieldsSchema` - Mixin for all GxP-critical entities

### 📚 Primary References

- **[CONTRACT_SPECIFICATIONS v2.0](../CONTRACT_SPECIFICATIONS.md)** - Zod schemas, API contracts, Kafka events
- **[EVENT_ARCHITECTURE v2.0](../EVENT_ARCHITECTURE.md)** - 42 Kafka topics, 83+ event schemas
- **[Data Specification (DS) v2.0](../validation/DS.md)** - Technical data specification

---

## 📂 Structure

### � Data Definitions (Источники истины)

| Файл                                                                             | Описание                                   | Статус         |
| -------------------------------------------------------------------------------- | ------------------------------------------ | -------------- |
| [`_definitions/core_types.md`](./_definitions/core_types.md)                     | Базовые типы данных (UUID, Address, Money) | ✅ Создано     |
| [`_definitions/plant_definitions.md`](./_definitions/plant_definitions.md)       | Определения растений и связанных сущностей | ✅ Создано     |
| [`_definitions/facility_definitions.md`](./_definitions/facility_definitions.md) | Определения объектов и инфраструктуры      | 🔄 Планируется |
| [`_definitions/user_definitions.md`](./_definitions/user_definitions.md)         | Определения пользователей и ролей          | 🔄 Планируется |
| [`_definitions/sensor_definitions.md`](./_definitions/sensor_definitions.md)     | Определения IoT и сенсорных данных         | 🔄 Планируется |

### 👀 Views (Представления)

| Файл                                               | Описание                                       | Ссылается на     |
| -------------------------------------------------- | ---------------------------------------------- | ---------------- |
| [`entities.md`](./entities.md)                     | Бизнес-сущности (включая compliance модули)    | `CONTRACT_SPECIFICATIONS.md v2.0` |
| [`database_tables.md`](./database_tables.md)       | Схемы таблиц БД (PostgreSQL, MongoDB)         | `_definitions/*` |
| [`api_dtos.md`](./api_dtos.md)                     | API DTO структуры (ts-rest contracts)          | `CONTRACT_SPECIFICATIONS.md v2.0` |
| [`validation_schemas.md`](./validation_schemas.md) | Схемы валидации Zod                            | `CONTRACT_SPECIFICATIONS.md v2.0` |
| [`enums.md`](./enums.md)                           | Перечисления и константы                       | `_definitions/*` |
| [`constants.md`](./constants.md)                   | Системные константы                            | `DS.md v2.0`     |

### Specialized Categories

| Категория          | Файл                                       | Описание                             |
| ------------------ | ------------------------------------------ | ------------------------------------ |
| **Spatial Data**   | [`spatial_data.md`](./spatial_data.md)     | Пространственные данные и координаты |
| **IoT Data**       | [`iot_data.md`](./iot_data.md)             | Структуры данных IoT сенсоров        |
| **Audit Data**     | [`audit_data.md`](./audit_data.md)         | Аудиторские записи и compliance      |
| **Financial Data** | [`financial_data.md`](./financial_data.md) | Финансовые структуры и отчеты        |
| **Training Data**  | [`training_data.md`](./training_data.md)   | Обучение и компетенции               |

## ⚙️ Как работать с SSOT

### 📝 Правила редактирования

**✅ Разрешено изменять:**

- `_definitions/*.md` - структуры данных и их описания
- `views/*.md` - бизнес-контекст и примеры использования
- Ссылки между файлами

**❌ Запрещено дублировать:**

- Определения полей сущностей
- Списки значений enum'ов
- Структуры таблиц базы данных
- Схемы валидации

### 🔄 Процесс изменения данных

1. **Изменение структуры:** Редактируем только `_definitions/file.md`
2. **Проверка ссылок:** Убеждаемся, что все views корректно ссылаются
3. **Обновление контекста:** При необходимости дополняем бизнес-информацию в views
4. **Валидация:** Проверяем, что нет дублирования

### 🔍 Поиск информации

- **Структура данных:** Ищите в `_definitions/`
- **Бизнес-логика:** Ищите в `views/`
- **Связи сущностей:** Смотрите диаграммы в `views/entities.md`
- **Примеры API:** Проверяйте `api_dtos.md` (ссылки на definitions)

## 🔍 Quick Navigation

### By Domain

- **🌱 Plant Lifecycle**: [`entities.md#plant-entities`](./entities.md#plant-entities), [`database_tables.md#plant-tables`](./database_tables.md#plant-tables)
- **🏭 Facilities**: [`spatial_data.md`](./spatial_data.md), [`entities.md#facility-entities`](./entities.md#facility-entities)
- **💰 Financial**: [`financial_data.md`](./financial_data.md), [`database_tables.md#financial-tables`](./database_tables.md#financial-tables)
- **👥 Workforce**: [`training_data.md`](./training_data.md), [`database_tables.md#user-tables`](./database_tables.md#user-tables)
- **📊 IoT & Monitoring**: [`iot_data.md`](./iot_data.md), [`events.md#iot-events`](./events.md#iot-events)
- **📋 Compliance**: [`audit_data.md`](./audit_data.md), [`database_tables.md#audit-tables`](./database_tables.md#audit-tables)

### By Technology

- **PostgreSQL**: [`database_tables.md#postgresql-tables`](./database_tables.md#postgresql-tables)
- **MongoDB**: [`database_tables.md#mongodb-collections`](./database_tables.md#mongodb-collections)
- **Kafka Events**: [`events.md`](./events.md)
- **REST API**: [`api_dtos.md`](./api_dtos.md)
- **Frontend**: [`frontend_types.md`](./frontend_types.md)
- **Validation**: [`schemas.md`](./schemas.md)

## 📝 Usage Guidelines

### For Developers

- Используйте для понимания структур данных
- Проверяйте совместимость при изменениях
- Ссылайтесь на типы при разработке API

### For Analysts

- Изучайте бизнес-логику через структуры
- Понимайте связи между сущностями
- Анализируйте модели данных

### For QA

- Валидация структур данных
- Тестирование совместимости
- Проверка compliance требований

## 🔗 Related Documentation

### Core Specifications (v2.0)
- **[Data Specification (DS) v2.0](../validation/DS.md)** - Technical data specification with compliance modules
- **[Contract Specifications v2.0](../CONTRACT_SPECIFICATIONS.md)** - Zod schemas, API contracts (ts-rest), Kafka events
- **[Event Architecture v2.0](../EVENT_ARCHITECTURE.md)** - 42 Kafka topics, 83+ event schemas
- **[System Architecture](../SYSTEM_ARCHITECTURE.md)** - Architectural context and patterns

### Assessment Reports (DS v2.0)
- **[Architecture Assessment](../reports/ARCHITECTURE_ASSESSMENT_DS_V2.md)** - Gap analysis: 7 missing modules, 40-60 dev-days
- **[Requirements Gap Analysis](../reports/REQUIREMENTS_GAP_ANALYSIS_DS_V2.md)** - ~350 missing functional requirements
- **[Event Architecture Assessment](../reports/EVENT_ARCHITECTURE_ASSESSMENT_DS_V2.md)** - 31 missing topics, 83 missing schemas
- **[API Contracts Assessment](../reports/API_CONTRACTS_ASSESSMENT_DS_V2.md)** - 95% alignment, Grade A

### Training & Compliance
- **[Curriculum v2.0](../training/Curriculum.md)** - 15 courses including 7 new compliance courses (CUR-009 to CUR-015)
- **[Position Matrix v2.0](../training/PositionMatrix.md)** - Training requirements by role
- **[SOPs](../sop/)** - 5 updated SOPs with DS v2.0 references (Change Control, CAPA, Deviation, Document Control, Audit Trail)

### Compliance Standards
- **[FDA 21 CFR Part 11](../compliance/FDA_21CFR_Part11.md)** - Electronic Records and Signatures
- **[EU GMP Annex 11](../compliance/EU_GMP_Annex11.md)** - Computerised Systems
- **[ALCOA+](../compliance/ALCOA+.md)** - Data Integrity Principles
- **[GAMP 5](../compliance/GAMP5.md)** - Validation of Automated Systems

## 🏷️ Versioning

**Version**: 2.0  
**Last Updated**: 2025-10-17  
**Next Review**: 2026-01-17  
**Changes in v2.0**:
- Added DS v2.0 compliance modules section (8 new modules)
- Updated references to CONTRACT_SPECIFICATIONS v2.0 and EVENT_ARCHITECTURE v2.0
- Added links to assessment reports and training materials
- Enhanced with GxP compliance structures (ElectronicSignature, AuditTrail, GxPValidationFields)
- Aligned with POST_DS_V2_ACTION_PLAN.md completion

---

💡 **Tip**: Используйте Ctrl+F для быстрого поиска по типам данных или начните с CONTRACT_SPECIFICATIONS.md для Zod schemas
