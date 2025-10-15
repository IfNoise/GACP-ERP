# Validation Schemas (Схемы валидации)

Правила валидации, ограничения и проверки данных в GACP-ERP системе с использованием Zod.

## 🧬 Core Validation Patterns

### Base Field Validations

**Описание**: Основные паттерны валидации полей  
**Источник**: `docs/CONTRACT_SPECIFICATIONS.md`, `docs/validation/DS.md`

| Поле    | Тип     | Правило                                                                    | Пример                                 | Ошибка                     |
| ------- | ------- | -------------------------------------------------------------------------- | -------------------------------------- | -------------------------- |
| `id`    | UUID v4 | `/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i` | `550e8400-e29b-41d4-a716-446655440000` | "Неверный формат UUID"     |
| `email` | Email   | RFC 5322 + max 254 chars                                                   | `user@example.com`                     | "Неверный формат email"    |
| `phone` | Phone   | E.164 format                                                               | `+1234567890`                          | "Неверный формат телефона" |
| `name`  | String  | 2-100 chars, Unicode letters                                               | `Иван Иванов`                          | "Имя от 2 до 100 символов" |
| `code`  | String  | 2-20 chars, alphanumeric + dash                                            | `PLANT-001`                            | "Код: буквы, цифры, дефис" |
| `url`   | URL     | Valid HTTP/HTTPS URL                                                       | `https://example.com`                  | "Неверный формат URL"      |

### Timestamp Validations

**Описание**: Валидация временных меток и дат  
**Источник**: `docs/validation/DS.md`

| Поле           | Формат    | Ограничения                      | Пример                 | Валидация                                     |
| -------------- | --------- | -------------------------------- | ---------------------- | --------------------------------------------- |
| `created_at`   | ISO 8601  | Не в будущем                     | `2024-01-15T10:30:00Z` | `z.date().max(new Date())`                    |
| `updated_at`   | ISO 8601  | ≥ created_at                     | `2024-01-15T11:45:00Z` | `z.date().min(created_at)`                    |
| `deleted_at`   | ISO 8601  | Optional, ≥ created_at           | `2024-02-01T09:00:00Z` | `z.date().optional()`                         |
| `scheduled_at` | ISO 8601  | Может быть в будущем             | `2024-03-01T08:00:00Z` | `z.date()`                                    |
| `birth_date`   | Date only | Не в будущем, макс 150 лет назад | `1980-05-15`           | `z.date().max(new Date()).min(150 years ago)` |

## 🌱 Plant Domain Validations

### Plant Entity Schema

**Описание**: Валидация основной сущности растения  
**Источник**: `docs/services/frontend-entity-system.md`

```typescript
const PlantValidationSchema = z.object({
  id: z.string().uuid("Неверный формат ID растения"),
  strain_id: z.string().uuid("Неверный ID штамма"),
  plant_code: z
    .string()
    .min(3, "Код растения минимум 3 символа")
    .max(20, "Код растения максимум 20 символов")
    .regex(/^[A-Z0-9-]+$/, "Код: только заглавные буквы, цифры, дефис"),

  stage: z.enum(
    [
      "germination",
      "seedling",
      "vegetative",
      "flowering",
      "harvest_ready",
      "harvested",
    ],
    { errorMap: () => ({ message: "Неверная стадия роста" }) }
  ),

  health_score: z
    .number()
    .min(0, "Оценка здоровья не может быть отрицательной")
    .max(100, "Оценка здоровья не может превышать 100")
    .int("Оценка здоровья должна быть целым числом"),

  planted_date: z
    .date()
    .max(new Date(), "Дата посадки не может быть в будущем"),

  expected_harvest_date: z
    .date()
    .min(new Date(), "Ожидаемая дата сбора должна быть в будущем")
    .optional(),

  // Spatial addressing
  facility_id: z.string().uuid("Неверный ID объекта"),
  room_id: z.string().uuid("Неверный ID помещения"),
  zone_id: z.string().uuid("Неверный ID зоны"),
  rack_id: z.string().uuid("Неверный ID стеллажа").optional(),
  tray_id: z.string().uuid("Неверный ID лотка").optional(),
  position: z.object({
    x: z.number().min(0).max(9999, "X координата вне допустимого диапазона"),
    y: z.number().min(0).max(9999, "Y координата вне допустимого диапазона"),
    z: z.number().min(0).max(999, "Z координата вне допустимого диапазона"),
  }),
});
```

### Growth Event Schema

**Описание**: Валидация событий роста растений  
**Источник**: `docs/services/frontend-entity-system.md`

```typescript
const GrowthEventSchema = z.object({
  id: z.string().uuid(),
  plant_id: z.string().uuid("Неверный ID растения"),
  event_type: z.enum([
    "stage_change",
    "transplant",
    "pruning",
    "watering",
    "fertilizing",
    "health_check",
    "pest_treatment",
  ]),

  old_stage: z
    .enum([
      "germination",
      "seedling",
      "vegetative",
      "flowering",
      "harvest_ready",
    ])
    .optional(),
  new_stage: z
    .enum(["seedling", "vegetative", "flowering", "harvest_ready", "harvested"])
    .optional(),

  measurements: z
    .object({
      height_cm: z
        .number()
        .min(0)
        .max(500, "Высота не может превышать 500см")
        .optional(),
      width_cm: z
        .number()
        .min(0)
        .max(200, "Ширина не может превышать 200см")
        .optional(),
      trunk_diameter_mm: z
        .number()
        .min(0)
        .max(100, "Диаметр ствола не может превышать 100мм")
        .optional(),
    })
    .optional(),

  performed_by: z.string().uuid("Неверный ID пользователя"),
  performed_at: z.date().max(new Date(), "Событие не может быть в будущем"),
  notes: z
    .string()
    .max(1000, "Заметки не могут превышать 1000 символов")
    .optional(),
});
```

## 🏭 Facility & Infrastructure Schemas

### Facility Schema

**Описание**: Валидация объектов и инфраструктуры  
**Источник**: `docs/services/spatial-addressing-service-v2.md`

```typescript
const FacilitySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, "Название объекта минимум 2 символа").max(100),
  facility_type: z.enum([
    "greenhouse",
    "indoor",
    "processing",
    "storage",
    "laboratory",
  ]),

  address: z.object({
    street: z.string().min(5, "Адрес минимум 5 символов").max(200),
    city: z.string().min(2).max(100),
    state: z.string().length(2, "Код штата должен быть 2 символа"),
    postal_code: z
      .string()
      .regex(/^\d{5}(-\d{4})?$/, "Неверный формат почтового индекса"),
    country: z
      .string()
      .length(2, "Код страны должен быть 2 символа (ISO 3166-1)"),
  }),

  coordinates: z.object({
    latitude: z.number().min(-90).max(90, "Широта должна быть от -90 до 90"),
    longitude: z
      .number()
      .min(-180)
      .max(180, "Долгота должна быть от -180 до 180"),
  }),

  total_area_sqm: z
    .number()
    .min(1, "Площадь должна быть положительной")
    .max(100000),

  license_number: z
    .string()
    .min(5, "Номер лицензии минимум 5 символов")
    .max(50, "Номер лицензии максимум 50 символов")
    .regex(
      /^[A-Z0-9-]+$/,
      "Номер лицензии: только заглавные буквы, цифры, дефис"
    ),
});
```

### Room Configuration Schema

**Описание**: Валидация конфигурации помещений  
**Источник**: `docs/services/spatial-addressing-service-v2.md`

```typescript
const RoomConfigSchema = z.object({
  id: z.string().uuid(),
  facility_id: z.string().uuid(),
  name: z.string().min(2).max(100),
  room_type: z.enum([
    "vegetation",
    "flowering",
    "mother_room",
    "clone_room",
    "drying",
    "curing",
    "processing",
  ]),

  dimensions: z.object({
    length_cm: z
      .number()
      .min(100, "Длина минимум 1м")
      .max(10000, "Длина максимум 100м"),
    width_cm: z
      .number()
      .min(100, "Ширина минимум 1м")
      .max(10000, "Ширина максимум 100м"),
    height_cm: z
      .number()
      .min(200, "Высота минимум 2м")
      .max(1000, "Высота максимум 10м"),
  }),

  environmental_settings: z
    .object({
      temperature_min: z.number().min(10).max(35, "Мин. температура 10-35°C"),
      temperature_max: z.number().min(15).max(40, "Макс. температура 15-40°C"),
      humidity_min: z.number().min(20).max(80, "Мин. влажность 20-80%"),
      humidity_max: z.number().min(30).max(90, "Макс. влажность 30-90%"),
      co2_target: z.number().min(300).max(2000, "CO2 цель 300-2000 ppm"),
      light_schedule: z
        .string()
        .regex(/^\d{1,2}\/\d{1,2}$/, "Световой режим: формат 18/6"),
    })
    .refine((data) => data.temperature_max > data.temperature_min, {
      message: "Максимальная температура должна быть больше минимальной",
    })
    .refine((data) => data.humidity_max > data.humidity_min, {
      message: "Максимальная влажность должна быть больше минимальной",
    }),
});
```

## 📊 IoT & Sensor Data Schemas

### Sensor Reading Schema

**Описание**: Валидация показаний сенсоров  
**Источник**: `docs/validation/DS.md`

```typescript
const SensorReadingSchema = z
  .object({
    id: z.string().uuid(),
    sensor_id: z.string().uuid("Неверный ID сенсора"),
    reading_type: z.enum([
      "temperature",
      "humidity",
      "co2",
      "ph",
      "light_par",
      "soil_moisture",
    ]),

    value: z.number().finite("Значение должно быть конечным числом"),

    unit: z.string().min(1).max(10, "Единица измерения максимум 10 символов"),

    timestamp: z
      .date()
      .max(new Date(), "Показание не может быть из будущего")
      .min(
        new Date(Date.now() - 24 * 60 * 60 * 1000),
        "Показание не может быть старше 24 часов"
      ),

    quality_score: z
      .number()
      .min(0, "Качество не может быть отрицательным")
      .max(100, "Качество не может превышать 100")
      .int("Качество должно быть целым числом"),

    calibration_offset: z.number().optional(),

    location: z.object({
      facility_id: z.string().uuid(),
      room_id: z.string().uuid(),
      zone_id: z.string().uuid().optional(),
      coordinates: z
        .object({
          x: z.number().min(0).max(9999),
          y: z.number().min(0).max(9999),
          z: z.number().min(0).max(999),
        })
        .optional(),
    }),
  })
  .superRefine((data, ctx) => {
    // Валидация по типу показания
    switch (data.reading_type) {
      case "temperature":
        if (data.value < -50 || data.value > 70) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Температура должна быть от -50°C до +70°C",
          });
        }
        break;
      case "humidity":
        if (data.value < 0 || data.value > 100) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Влажность должна быть от 0% до 100%",
          });
        }
        break;
      case "co2":
        if (data.value < 100 || data.value > 5000) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "CO2 должен быть от 100 до 5000 ppm",
          });
        }
        break;
      case "ph":
        if (data.value < 0 || data.value > 14) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "pH должен быть от 0 до 14",
          });
        }
        break;
    }
  });
```

### Alert Configuration Schema

**Описание**: Валидация настроек уведомлений  
**Источник**: `docs/services/frontend-entity-system.md`

```typescript
const AlertConfigSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3, "Название минимум 3 символа").max(100),
  alert_type: z.enum(["threshold", "trend", "offline", "manual"]),

  conditions: z
    .object({
      parameter: z.enum([
        "temperature",
        "humidity",
        "co2",
        "ph",
        "light_par",
        "health_score",
      ]),
      operator: z.enum(["gt", "gte", "lt", "lte", "eq", "ne", "between"]),
      value: z.number(),
      value_max: z.number().optional(), // Для operator: 'between'
      duration_minutes: z
        .number()
        .min(1)
        .max(1440, "Длительность от 1 минуты до 24 часов"),
    })
    .refine(
      (data) => {
        if (data.operator === "between" && !data.value_max) {
          return false;
        }
        if (
          data.operator === "between" &&
          data.value_max &&
          data.value >= data.value_max
        ) {
          return false;
        }
        return true;
      },
      {
        message: "Для оператора 'between' нужно указать value_max > value",
      }
    ),

  severity: z.enum(["info", "warning", "critical"]),

  notification_channels: z
    .array(z.enum(["email", "sms", "push", "slack"]))
    .min(1, "Нужен хотя бы один канал уведомлений"),

  recipients: z
    .array(z.string().uuid())
    .min(1, "Нужен хотя бы один получатель"),

  active: z.boolean().default(true),

  schedule: z
    .object({
      timezone: z
        .string()
        .regex(/^[A-Za-z]+\/[A-Za-z_]+$/, "Неверный формат timezone"),
      active_hours: z.object({
        start: z
          .string()
          .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Время в формате HH:MM"),
        end: z
          .string()
          .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Время в формате HH:MM"),
      }),
      active_days: z
        .array(
          z.enum([
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ])
        )
        .min(1, "Нужен хотя бы один активный день"),
    })
    .optional(),
});
```

## 💰 Financial & Accounting Schemas

### Transaction Schema

**Описание**: Валидация финансовых транзакций  
**Источник**: `docs/validation/DS.md`

```typescript
const TransactionSchema = z.object({
  id: z.string().uuid(),
  transaction_type: z.enum(["debit", "credit"]),

  amount: z
    .number()
    .positive("Сумма должна быть положительной")
    .multipleOf(0.01, "Сумма с точностью до копеек")
    .max(999999999.99, "Сумма не может превышать 999,999,999.99"),

  currency: z
    .string()
    .length(3, "Код валюты должен быть 3 символа")
    .regex(/^[A-Z]{3}$/, "Код валюты в верхнем регистре"),

  account_code: z
    .string()
    .regex(/^\d{4}$/, "Код счёта должен быть 4 цифры")
    .refine((code) => {
      const validCodes = [
        "1000",
        "1100",
        "1200",
        "1210",
        "1300",
        "1400",
        "1500",
        "2000",
        "3000",
        "4000",
        "5000",
        "6000",
        "7000",
        "8000",
      ];
      return validCodes.includes(code);
    }, "Неверный код счёта"),

  reference_type: z.enum([
    "plant",
    "equipment",
    "facility",
    "user",
    "supplier",
    "customer",
    "general",
  ]),
  reference_id: z.string().uuid("Неверный ID ссылки"),

  description: z
    .string()
    .min(5, "Описание минимум 5 символов")
    .max(500, "Описание максимум 500 символов"),

  transaction_date: z
    .date()
    .max(new Date(), "Дата транзакции не может быть в будущем"),

  created_by: z.string().uuid("Неверный ID пользователя"),
  approved_by: z.string().uuid("Неверный ID утверждающего").optional(),

  metadata: z.record(z.any()).optional(),

  // Поля для аудита
  batch_id: z.string().uuid().optional(),
  source_system: z.string().max(50).optional(),
});
```

### Cost Center Schema

**Описание**: Валидация центров затрат  
**Источник**: `docs/validation/DS.md`

```typescript
const CostCenterSchema = z.object({
  id: z.string().uuid(),
  code: z
    .string()
    .min(3, "Код ЦЗ минимум 3 символа")
    .max(20, "Код ЦЗ максимум 20 символов")
    .regex(/^[A-Z0-9-]+$/, "Код ЦЗ: заглавные буквы, цифры, дефис"),

  name: z.string().min(3).max(100, "Название ЦЗ от 3 до 100 символов"),

  cost_center_type: z.enum([
    "facility",
    "room",
    "process",
    "admin",
    "overhead",
  ]),

  parent_id: z.string().uuid("Неверный ID родительского ЦЗ").optional(),

  budget_annual: z
    .number()
    .positive("Годовой бюджет должен быть положительным")
    .max(999999999.99, "Бюджет не может превышать 999,999,999.99"),

  responsible_user_id: z.string().uuid("Неверный ID ответственного"),

  active: z.boolean().default(true),

  allocation_rules: z
    .array(
      z.object({
        rule_type: z.enum(["percentage", "fixed_amount", "per_unit"]),
        value: z.number().positive(),
        account_code: z.string().regex(/^\d{4}$/),
      })
    )
    .optional(),
});
```

## 👥 User & Authentication Schemas

### User Registration Schema

**Описание**: Валидация регистрации пользователей  
**Источник**: `docs/validation/DS.md`

```typescript
const UserRegistrationSchema = z.object({
  username: z
    .string()
    .min(3, "Логин минимум 3 символа")
    .max(50, "Логин максимум 50 символов")
    .regex(/^[a-zA-Z0-9_-]+$/, "Логин: буквы, цифры, дефис, подчёркивание"),

  email: z
    .string()
    .email("Неверный формат email")
    .max(254, "Email максимум 254 символа")
    .toLowerCase(),

  password: z
    .string()
    .min(12, "Пароль минимум 12 символов")
    .max(128, "Пароль максимум 128 символов")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
      "Пароль должен содержать: строчные и заглавные буквы, цифры, спецсимволы"
    ),

  first_name: z
    .string()
    .min(2, "Имя минимум 2 символа")
    .max(50, "Имя максимум 50 символов")
    .regex(
      /^[a-zA-Zа-яА-Я\s'-]+$/u,
      "Имя: только буквы, пробелы, дефис, апостроф"
    ),

  last_name: z
    .string()
    .min(2, "Фамилия минимум 2 символа")
    .max(50, "Фамилия максимум 50 символов")
    .regex(
      /^[a-zA-Zа-яА-Я\s'-]+$/u,
      "Фамилия: только буквы, пробелы, дефис, апостроф"
    ),

  phone: z
    .string()
    .regex(/^\+[1-9]\d{1,14}$/, "Телефон в формате E.164 (+1234567890)")
    .optional(),

  role: z.enum([
    "admin",
    "facility_manager",
    "grower",
    "observer",
    "external_auditor",
    "internal_auditor",
    "third_party_auditor",
  ]),

  license_number: z
    .string()
    .min(5)
    .max(50)
    .regex(/^[A-Z0-9-]+$/)
    .optional(),

  terms_accepted: z
    .boolean()
    .refine((val) => val === true, "Необходимо принять условия использования"),

  privacy_accepted: z
    .boolean()
    .refine(
      (val) => val === true,
      "Необходимо принять политику конфиденциальности"
    ),
});
```

### Role Permission Schema

**Описание**: Валидация ролей и разрешений  
**Источник**: `docs/SYSTEM_ARCHITECTURE.md`

```typescript
const RolePermissionSchema = z.object({
  role: z.enum([
    "admin",
    "facility_manager",
    "grower",
    "observer",
    "external_auditor",
    "internal_auditor",
    "third_party_auditor",
  ]),

  permissions: z.array(
    z.object({
      resource: z.enum([
        "plants",
        "facilities",
        "users",
        "reports",
        "audit",
        "financial",
        "equipment",
        "inventory",
      ]),
      actions: z.array(
        z.enum(["create", "read", "update", "delete", "export", "approve"])
      ),
      conditions: z
        .object({
          own_only: z.boolean().default(false),
          facility_scope: z.array(z.string().uuid()).optional(),
          time_limited: z.boolean().default(false),
          ip_restricted: z.boolean().default(false),
        })
        .optional(),
    })
  ),

  audit_requirements: z.object({
    log_all_actions: z.boolean().default(false),
    require_reason: z.boolean().default(false),
    approval_required: z.boolean().default(false),
    session_timeout_minutes: z.number().min(5).max(480).default(60),
  }),
});
```

## 🔍 Audit & Compliance Schemas

### Audit Event Schema

**Описание**: Валидация событий аудита  
**Источник**: `docs/validation/DS.md`

```typescript
const AuditEventSchema = z.object({
  id: z.string().uuid(),

  event_type: z.enum([
    "create",
    "update",
    "delete",
    "read",
    "login",
    "logout",
    "export",
    "approve",
    "reject",
  ]),

  resource_type: z.enum([
    "plant",
    "facility",
    "user",
    "transaction",
    "report",
    "equipment",
    "sensor",
  ]),
  resource_id: z.string().uuid("Неверный ID ресурса"),

  user_id: z.string().uuid("Неверный ID пользователя"),
  session_id: z.string().uuid("Неверный ID сессии"),

  timestamp: z.date().max(new Date(), "Событие не может быть из будущего"),

  ip_address: z.string().ip("Неверный формат IP адреса"),

  user_agent: z.string().max(500, "User Agent максимум 500 символов"),

  changes: z
    .object({
      old_values: z.record(z.any()).optional(),
      new_values: z.record(z.any()).optional(),
      changed_fields: z.array(z.string()).optional(),
    })
    .optional(),

  reason: z.string().max(1000, "Причина максимум 1000 символов").optional(),

  risk_score: z
    .number()
    .min(0)
    .max(100)
    .int("Оценка риска должна быть целым числом")
    .default(0),

  compliance_flags: z
    .array(
      z.enum([
        "ALCOA_violation",
        "unauthorized_access",
        "data_integrity_issue",
        "suspicious_activity",
      ])
    )
    .default([]),

  checksum: z
    .string()
    .regex(/^[a-f0-9]{64}$/, "Контрольная сумма должна быть 64-символьным hex"),
});
```

### Deviation Report Schema

**Описание**: Валидация отчётов об отклонениях  
**Источник**: `docs/sop/SOP_DeviationManagement.md`

```typescript
const DeviationReportSchema = z.object({
  id: z.string().uuid(),

  deviation_number: z
    .string()
    .regex(/^DEV-\d{4}-\d{6}$/, "Номер отклонения в формате DEV-YYYY-NNNNNN"),

  title: z
    .string()
    .min(10, "Заголовок минимум 10 символов")
    .max(200, "Заголовок максимум 200 символов"),

  description: z
    .string()
    .min(50, "Описание минимум 50 символов")
    .max(5000, "Описание максимум 5000 символов"),

  severity: z.enum(["minor", "major", "critical"]),

  category: z.enum([
    "process",
    "equipment",
    "environmental",
    "documentation",
    "personnel",
    "quality",
  ]),

  discovered_date: z
    .date()
    .max(new Date(), "Дата обнаружения не может быть в будущем"),

  discovered_by: z.string().uuid("Неверный ID обнаружившего"),

  affected_products: z.array(z.string().uuid()).optional(),
  affected_batches: z.array(z.string()).optional(),

  root_cause_analysis: z
    .object({
      methodology: z.enum(["5_whys", "fishbone", "fault_tree", "other"]),
      findings: z.string().min(100, "Результаты РСА минимум 100 символов"),
      evidence: z.array(z.string().url()).optional(),
    })
    .optional(),

  corrective_actions: z.array(
    z.object({
      action_id: z.string().uuid(),
      description: z.string().min(20),
      responsible_person: z.string().uuid(),
      due_date: z
        .date()
        .min(new Date(), "Срок исполнения не может быть в прошлом"),
      status: z.enum(["open", "in_progress", "completed", "overdue"]),
      completion_date: z.date().optional(),
    })
  ),

  preventive_actions: z
    .array(
      z.object({
        action_id: z.string().uuid(),
        description: z.string().min(20),
        responsible_person: z.string().uuid(),
        due_date: z.date().min(new Date()),
        status: z.enum(["open", "in_progress", "completed", "overdue"]),
      })
    )
    .optional(),

  status: z.enum(["open", "under_investigation", "pending_approval", "closed"]),

  quality_review: z
    .object({
      reviewer_id: z.string().uuid(),
      review_date: z.date(),
      approved: z.boolean(),
      comments: z.string().max(2000),
    })
    .optional(),
});
```

## 📊 Report Generation Schemas

### Report Request Schema

**Описание**: Валидация запросов на генерацию отчётов  
**Источник**: `docs/services/pdf-report-generator.md`

```typescript
const ReportRequestSchema = z.object({
  id: z.string().uuid(),

  report_type: z.enum([
    "plant_batch_report",
    "facility_overview",
    "compliance_audit",
    "financial_summary",
    "inventory_report",
    "deviation_report",
    "chain_of_custody",
    "environmental_monitoring",
  ]),

  parameters: z
    .object({
      date_from: z.date(),
      date_to: z.date().min(z.date(), "Дата 'до' должна быть больше даты 'от'"),

      facility_ids: z.array(z.string().uuid()).optional(),
      plant_ids: z.array(z.string().uuid()).optional(),
      user_ids: z.array(z.string().uuid()).optional(),

      include_charts: z.boolean().default(true),
      include_photos: z.boolean().default(false),
      include_raw_data: z.boolean().default(false),

      format: z.enum(["pdf", "excel", "csv"]).default("pdf"),

      grouping: z.enum(["daily", "weekly", "monthly", "none"]).default("daily"),

      filters: z.record(z.any()).optional(),
    })
    .refine((data) => data.date_to > data.date_from, {
      message: "Дата окончания должна быть позже даты начала",
    }),

  requested_by: z.string().uuid("Неверный ID запросившего"),

  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),

  delivery_method: z
    .enum(["download", "email", "secure_link"])
    .default("download"),

  notification_emails: z.array(z.string().email()).optional(),

  retention_days: z
    .number()
    .min(1, "Срок хранения минимум 1 день")
    .max(365, "Срок хранения максимум 365 дней")
    .default(30),

  confidentiality_level: z
    .enum(["public", "internal", "confidential", "restricted"])
    .default("internal"),
});
```

---

**Последнее обновление**: 2025-09-16  
**Источники**: Анализ контрактов API, схем валидации и SOP документов GACP-ERP
