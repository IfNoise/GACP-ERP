# Constants (Константы)

Системные константы, статические значения и конфигурационные параметры GACP-ERP.

## 🌱 Plant & Growth Constants

### Growth Stages Duration

**Описание**: Типичная продолжительность стадий роста  
**Источник**: Системная логика, `docs/validation/DS.md`

| Константа                   | Значение | Единица | Описание               |
| --------------------------- | -------- | ------- | ---------------------- |
| `GERMINATION_DURATION_DAYS` | 3-7      | дни     | Прорастание семян      |
| `SEEDLING_DURATION_DAYS`    | 14-21    | дни     | Стадия саженца         |
| `VEGETATIVE_MIN_DAYS`       | 30       | дни     | Минимальная вегетация  |
| `VEGETATIVE_MAX_DAYS`       | 90       | дни     | Максимальная вегетация |
| `FLOWERING_DURATION_DAYS`   | 56-70    | дни     | Цветение               |
| `HARVEST_WINDOW_DAYS`       | 7-14     | дни     | Окно для сбора         |

### Health Score Thresholds

**Описание**: Пороговые значения здоровья растений (0-100)  
**Источник**: `docs/validation/DS.md`, `docs/services/frontend-entity-system.md`

| Константа              | Значение | Статус                | Действие              |
| ---------------------- | -------- | --------------------- | --------------------- |
| `HEALTH_EXCELLENT_MIN` | 90       | ✅ Отличное           | Норма                 |
| `HEALTH_GOOD_MIN`      | 75       | ✅ Хорошее            | Норма                 |
| `HEALTH_FAIR_MIN`      | 60       | ⚠️ Удовлетворительное | Внимание              |
| `HEALTH_POOR_MIN`      | 40       | ⚠️ Плохое             | Требует вмешательства |
| `HEALTH_CRITICAL_MAX`  | 39       | 🚨 Критическое        | Немедленные меры      |

### Space Requirements

**Описание**: Требования к пространству по стадиям (см)  
**Источник**: `docs/services/spatial-addressing-service-v2.md`

| Стадия          | Радиус (см) | Высота (см) | Прогноз роста (см) |
| --------------- | ----------- | ----------- | ------------------ |
| `seedling`      | 5-10        | 5-15        | 20-30              |
| `vegetative`    | 15-30       | 30-60       | 60-120             |
| `flowering`     | 30-50       | 60-150      | 100-200            |
| `harvest_ready` | 30-50       | 80-200      | н/д                |

## 🏭 Facility & Infrastructure Constants

### Tray Specifications

**Описание**: Стандартные размеры лотков  
**Источник**: `docs/services/spatial-addressing-service-v2.md`

| Размер   | Ширина (см) | Глубина (см) | Высота (см) | Вместимость    |
| -------- | ----------- | ------------ | ----------- | -------------- |
| `small`  | 50          | 30           | 8           | 4-6 растений   |
| `medium` | 120         | 60           | 10          | 8-12 растений  |
| `large`  | 244         | 122          | 12          | 15-20 растений |
| `xlarge` | 60          | 50           | 15          | 25-30 растений |

### Rack Configurations

**Описание**: Стандартные конфигурации стеллажей  
**Источник**: `docs/services/spatial-addressing-service-v2.md`

| Тип       | Полки | Высота (см) | Ширина (см) | Глубина (см) | Макс. лотков |
| --------- | ----- | ----------- | ----------- | ------------ | ------------ |
| `1-shelf` | 1     | 60          | 120         | 60           | 6            |
| `2-shelf` | 2     | 160         | 120         | 60           | 12           |
| `3-shelf` | 3     | 220         | 120         | 60           | 18           |
| `4-shelf` | 4     | 280         | 120         | 60           | 24           |

### Environmental Ranges

**Описание**: Оптимальные диапазоны условий по зонам  
**Источник**: `docs/services/frontend-entity-system.md`

| Зона          | Температура (°C) | Влажность (%) | CO2 (ppm) | Освещение (μmol/m²/s) |
| ------------- | ---------------- | ------------- | --------- | --------------------- |
| `vegetation`  | 22-26            | 60-70         | 800-1200  | 400-600               |
| `flowering`   | 20-24            | 45-55         | 600-900   | 600-1000              |
| `mother_room` | 24-26            | 65-75         | 1000-1500 | 200-400               |
| `clone_room`  | 22-24            | 70-80         | 600-800   | 100-300               |
| `drying`      | 18-21            | 45-55         | 400-600   | 0                     |
| `curing`      | 16-18            | 58-62         | 400-600   | 0                     |

## 📊 IoT & Monitoring Constants

### Sensor Reading Intervals

**Описание**: Интервалы опроса сенсоров  
**Источник**: `docs/validation/DS.md`

| Тип сенсора   | Интервал | Критический интервал | Хранение  |
| ------------- | -------- | -------------------- | --------- |
| `temperature` | 5 мин    | 1 мин                | 2 года    |
| `humidity`    | 5 мин    | 1 мин                | 2 года    |
| `co2`         | 10 мин   | 2 мин                | 1 год     |
| `ph`          | 30 мин   | 5 мин                | 1 год     |
| `light_par`   | 15 мин   | 5 мин                | 6 месяцев |
| `water_level` | 15 мин   | 2 мин                | 6 месяцев |

### Alert Thresholds

**Описание**: Пороги для уведомлений  
**Источник**: `docs/services/frontend-entity-system.md`

| Параметр               | Норма     | Предупреждение | Критично  | Действие                          |
| ---------------------- | --------- | -------------- | --------- | --------------------------------- |
| Температура отклонение | ±2°C      | ±3°C           | ±5°C      | Автокоррекция/Уведомление/Тревога |
| Влажность отклонение   | ±5%       | ±10%           | ±15%      | Автокоррекция/Уведомление/Тревога |
| CO2 минимум            | >400 ppm  | <400 ppm       | <300 ppm  | Уведомление/Тревога               |
| CO2 максимум           | <2000 ppm | >2000 ppm      | >3000 ppm | Уведомление/Тревога               |

### Data Retention

**Описание**: Сроки хранения данных  
**Источник**: `docs/validation/DS.md`

| Тип данных             | Первичное хранение | Архив  | Аудит     | Примечание              |
| ---------------------- | ------------------ | ------ | --------- | ----------------------- |
| Sensor readings        | 30 дней            | 2 года | 7 лет     | Hot → Cold → Archive    |
| Plant events           | 1 год              | 5 лет  | Бессрочно | Критично для compliance |
| Financial transactions | Бессрочно          | -      | Бессрочно | Обязательно по закону   |
| Audit trail            | Бессрочно          | -      | Бессрочно | Immutable storage       |
| User activity          | 90 дней            | 1 год  | 3 года    | GDPR compliance         |

## 💰 Financial Constants

### Chart of Accounts

**Описание**: Стандартные коды счетов  
**Источник**: `docs/validation/DS.md`

| Код    | Название            | Тип       | Описание                   |
| ------ | ------------------- | --------- | -------------------------- |
| `1000` | Cash                | Asset     | Денежные средства          |
| `1100` | Accounts Receivable | Asset     | Дебиторская задолженность  |
| `1200` | Inventory - Seeds   | Asset     | Запасы семян               |
| `1210` | Inventory - Clones  | Asset     | Запасы клонов              |
| `1300` | Biological Assets   | Asset     | Растущие растения          |
| `1400` | Finished Goods      | Asset     | Готовая продукция          |
| `1500` | Equipment           | Asset     | Оборудование               |
| `2000` | Accounts Payable    | Liability | Кредиторская задолженность |
| `3000` | Equity              | Equity    | Собственный капитал        |
| `4000` | Revenue             | Revenue   | Выручка от продаж          |
| `5000` | COGS                | Expense   | Себестоимость              |
| `6000` | Labor Costs         | Expense   | Затраты на персонал        |
| `7000` | Utilities           | Expense   | Коммунальные услуги        |
| `8000` | Depreciation        | Expense   | Амортизация                |

### Currency & Pricing

**Описание**: Валютные и ценовые константы  
**Источник**: `docs/validation/DS.md`

| Константа                | Значение     | Описание                      |
| ------------------------ | ------------ | ----------------------------- |
| `DEFAULT_CURRENCY`       | 'USD'        | Базовая валюта системы        |
| `DECIMAL_PLACES_AMOUNT`  | 2            | Знаков после запятой в суммах |
| `DECIMAL_PLACES_RATE`    | 4            | Знаков в курсах валют         |
| `MIN_TRANSACTION_AMOUNT` | 0.01         | Минимальная сумма транзакции  |
| `MAX_TRANSACTION_AMOUNT` | 999999999.99 | Максимальная сумма            |

## 👥 User & Security Constants

### Password Policy

**Описание**: Требования к паролям  
**Источник**: `docs/validation/DS.md`

| Параметр                   | Значение | Описание                    |
| -------------------------- | -------- | --------------------------- |
| `MIN_PASSWORD_LENGTH`      | 12       | Минимальная длина           |
| `REQUIRE_UPPERCASE`        | true     | Обязательные заглавные      |
| `REQUIRE_LOWERCASE`        | true     | Обязательные строчные       |
| `REQUIRE_NUMBERS`          | true     | Обязательные цифры          |
| `REQUIRE_SPECIAL_CHARS`    | true     | Спецсимволы                 |
| `PASSWORD_HISTORY_COUNT`   | 12       | Запрет повтора последних N  |
| `PASSWORD_EXPIRY_DAYS`     | 90       | Срок действия пароля        |
| `MAX_LOGIN_ATTEMPTS`       | 5        | Попыток входа до блокировки |
| `LOCKOUT_DURATION_MINUTES` | 30       | Длительность блокировки     |

### Session Management

**Описание**: Управление сессиями  
**Источник**: `docs/SYSTEM_ARCHITECTURE.md`

| Параметр                  | Значение | Описание                   |
| ------------------------- | -------- | -------------------------- |
| `JWT_EXPIRY_HOURS`        | 8        | Срок действия JWT токена   |
| `REFRESH_TOKEN_DAYS`      | 30       | Срок refresh токена        |
| `SESSION_TIMEOUT_MINUTES` | 60       | Таймаут неактивности       |
| `CONCURRENT_SESSIONS_MAX` | 3        | Макс. одновременных сессий |
| `REMEMBER_ME_DAYS`        | 30       | "Запомнить меня"           |

### Auditor Access

**Описание**: Параметры доступа аудиторов  
**Источник**: `docs/validation/DS.md`, обновления пользователя

| Параметр                       | Значение | Описание                           |
| ------------------------------ | -------- | ---------------------------------- |
| `AUDITOR_SESSION_HOURS`        | 4        | Макс. длительность сессии аудитора |
| `AUDITOR_MAX_EXPORT_RECORDS`   | 10000    | Макс. записей в экспорте           |
| `TEMPORARY_ACCESS_MAX_DAYS`    | 14       | Макс. временный доступ             |
| `WATERMARK_REQUIRED`           | true     | Обязательные водяные знаки         |
| `ACTIVITY_LOG_RETENTION_YEARS` | 7        | Хранение логов активности          |

## 🔍 Audit & Compliance Constants

### Audit Trail

**Описание**: Настройки аудиторского следа  
**Источник**: `docs/validation/DS.md`

| Параметр                   | Значение  | Описание                  |
| -------------------------- | --------- | ------------------------- |
| `AUDIT_BATCH_SIZE`         | 1000      | Размер пакета записей     |
| `AUDIT_FLUSH_INTERVAL_SEC` | 30        | Интервал сброса буфера    |
| `AUDIT_RETENTION_YEARS`    | 7         | Срок хранения (минимум)   |
| `AUDIT_IMMUTABLE_STORAGE`  | true      | Неизменяемое хранение     |
| `AUDIT_CHECKSUM_ALGORITHM` | 'SHA-256' | Алгоритм контрольных сумм |
| `AUDIT_SIGNATURE_REQUIRED` | true      | Цифровые подписи          |

### ALCOA+ Compliance

**Описание**: Соответствие принципам ALCOA+  
**Источник**: `docs/sop/SOP_DataIntegrity.md`

| Принцип             | Проверка            | Автоматизация           |
| ------------------- | ------------------- | ----------------------- |
| **Attributable**    | User ID + timestamp | ✅ Автоматически        |
| **Legible**         | UTF-8 encoding      | ✅ Автоматически        |
| **Contemporaneous** | Max delay: 5 min    | ✅ Проверка             |
| **Original**        | No modifications    | ✅ Immutable storage    |
| **Accurate**        | Validation rules    | ✅ Zod schemas          |
| **Complete**        | Required fields     | ✅ Schema validation    |
| **Consistent**      | Cross-references    | ✅ Database constraints |
| **Enduring**        | Long-term storage   | ✅ Archive policy       |
| **Available**       | 99.9% uptime        | ✅ Monitoring           |

## 🌐 API & Integration Constants

### Rate Limiting

**Описание**: Ограничения скорости API  
**Источник**: `docs/sop/SOP_ExternalIntegrations.md`

| Эндпоинт            | Лимит/мин | Лимит/час | Примечание        |
| ------------------- | --------- | --------- | ----------------- |
| `GET /api/plants`   | 100       | 1000      | Общие запросы     |
| `POST /api/plants`  | 20        | 100       | Создание          |
| `PUT /api/plants/*` | 50        | 500       | Обновления        |
| `GET /api/audit/*`  | 10        | 50        | Только аудиторы   |
| `POST /api/reports` | 5         | 20        | Генерация отчётов |

### Response Codes

**Описание**: Стандартные HTTP коды  
**Источник**: `docs/CONTRACT_SPECIFICATIONS.md`

| Код   | Название              | Использование      |
| ----- | --------------------- | ------------------ |
| `200` | OK                    | Успешный GET/PUT   |
| `201` | Created               | Успешный POST      |
| `400` | Bad Request           | Ошибка валидации   |
| `401` | Unauthorized          | Нет аутентификации |
| `403` | Forbidden             | Нет прав доступа   |
| `404` | Not Found             | Ресурс не найден   |
| `422` | Unprocessable Entity  | Бизнес-логика      |
| `429` | Too Many Requests     | Rate limiting      |
| `500` | Internal Server Error | Ошибка сервера     |

### Pagination Defaults

**Описание**: Настройки пагинации по умолчанию  
**Источник**: `docs/CONTRACT_SPECIFICATIONS.md`

| Параметр             | Значение | Минимум | Максимум |
| -------------------- | -------- | ------- | -------- |
| `DEFAULT_PAGE_SIZE`  | 20       | 1       | 100      |
| `MAX_PAGE_SIZE`      | 100      | -       | -        |
| `DEFAULT_SORT_ORDER` | 'asc'    | -       | -        |
| `MAX_SORT_FIELDS`    | 3        | -       | -        |

## 🔧 System Configuration

### File Upload Limits

**Описание**: Ограничения загрузки файлов  
**Источник**: Системная конфигурация

| Тип файла          | Макс. размер | Форматы         | Примечание          |
| ------------------ | ------------ | --------------- | ------------------- |
| Изображения        | 10 MB        | jpg, png, webp  | Фото растений       |
| Документы          | 50 MB        | pdf, docx, xlsx | Сертификаты, отчёты |
| Видео              | 100 MB       | mp4, webm       | Таймлапс роста      |
| Аудиторские отчёты | 500 MB       | pdf, xlsx       | Большие datasets    |

### Background Jobs

**Описание**: Настройки фоновых задач  
**Источник**: Системная архитектура

| Задача                   | Интервал    | Таймаут | Приоритет |
| ------------------------ | ----------- | ------- | --------- |
| Sensor data aggregation  | 5 мин       | 2 мин   | Высокий   |
| Health score calculation | 1 час       | 30 мин  | Средний   |
| Backup creation          | Ежедневно   | 4 часа  | Низкий    |
| Audit log rotation       | Еженедельно | 2 часа  | Средний   |
| Report generation        | По запросу  | 1 час   | Средний   |

---

**Последнее обновление**: 2025-09-16  
**Источники**: Анализ всей документации GACP-ERP системы
