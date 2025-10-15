# GACP-ERP Data | Файл | Описание | Статус |

|------|----------|---------|
| **[plant_data_definitions.md](plant_data_definitions.md)** | Все структуры данных растений | ✅ Активно |

### 📊 Implementation Files (Использование данных)

| Файл                                               | Описание            | Ссылается на              |
| -------------------------------------------------- | ------------------- | ------------------------- | --- |
| **[entities.md](entities.md)**                     | Бизнес-сущности     | plant_data_definitions.md |
| **[database_tables.md](database_tables.md)**       | SQL схемы           | plant_data_definitions.md |
| **[api_dtos.md](api_dtos.md)**                     | API структуры       | plant_data_definitions.md |
| **[enums.md](enums.md)**                           | Перечисления        | Автономный                |
| **[validation_schemas.md](validation_schemas.md)** | Zod схемы валидации | Автономный                | ary |

## 📋 Overview

Справочник структур данных в GACP-ERP системе с простым подходом **Single Source of Truth**.

### 🎯 Простой SSOT подход

- **`plant_data_definitions.md`** - единый источник для всех данных растений
- **Остальные файлы ссылаются** на определения вместо дублирования
- **Изменения только в definitions** - автоматически распространяются

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

| Файл                                               | Описание                                       | Ссылается на            |
| -------------------------------------------------- | ---------------------------------------------- | ----------------------- |
| [`views/entities.md`](./views/entities.md)         | Бизнес-ориентированное представление сущностей | `_definitions/*`        |
| [`database_tables.md`](./database_tables.md)       | Схемы таблиц БД                                | `_definitions/*`        |
| [`api_dtos.md`](./api_dtos.md)                     | Интерфейсы API                                 | `_definitions/*`        |
| [`validation_schemas.md`](./validation_schemas.md) | Схемы валидации Zod                            | `_definitions/*`        |
| [`validation_schemas.md`](./validation_schemas.md) | Схемы валидации Zod                            | Правила проверки данных |

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

- **[Data Specification (DS)](../validation/DS.md)** - Техническая спецификация данных
- **[Contract Specifications](../CONTRACT_SPECIFICATIONS.md)** - Схемы и контракты API
- **[System Architecture](../SYSTEM_ARCHITECTURE.md)** - Архитектурный контекст
- **[Event Architecture](../EVENT_ARCHITECTURE.md)** - События и сообщения

## 🏷️ Versioning

**Version**: 1.0  
**Last Updated**: 2025-09-16  
**Next Review**: 2025-10-16

---

💡 **Tip**: Используйте Ctrl+F для быстрого поиска по типам данных
