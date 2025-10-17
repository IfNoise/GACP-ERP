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

## 📋 Compliance & Quality Validation Schemas (DS v2.0)

### Change Control Validation

**Описание**: Валидация change request с GxP compliance  
**Источник**: `CONTRACT_SPECIFICATIONS.md v2.0 - ChangeControlZodSchema`

```typescript
import { z } from 'zod';

const ChangeControlValidationSchema = z.object({
  requestId: z
    .string()
    .regex(/^CR-\d{4}-\d{4}$/, "Формат: CR-YYYY-NNNN")
    .describe("Уникальный номер change request"),

  title: z
    .string()
    .min(10, "Заголовок минимум 10 символов")
    .max(200, "Заголовок максимум 200 символов")
    .describe("Краткое описание изменения"),

  description: z
    .string()
    .min(50, "Описание минимум 50 символов")
    .describe("Детальное описание необходимости изменения"),

  classification: z
    .enum(["critical", "major", "minor", "emergency"])
    .describe("Классификация по влиянию на качество/безопасность"),

  impactAnalysis: z.object({
    affectedSystems: z
      .array(z.string())
      .min(1, "Укажите хотя бы одну затронутую систему"),

    affectedProcesses: z
      .array(z.string())
      .min(1, "Укажите хотя бы один затронутый процесс"),

    riskLevel: z.enum(["low", "medium", "high", "critical"]),

    mitigationPlan: z
      .string()
      .min(50, "План митигации минимум 50 символов"),

    regulatoryImpact: z.boolean(),

    validationRequired: z.boolean(),
  }).describe("Анализ влияния изменения"),

  electronicSignature: z.object({
    userId: z.string().uuid("Неверный UUID пользователя"),
    reason: z
      .string()
      .min(10, "Обоснование подписи минимум 10 символов (21 CFR Part 11)"),
    authenticationMethod: z.enum(["password", "mfa", "certificate"]),
  }).describe("Электронная подпись (21 CFR Part 11)"),
});

// Refinements для бизнес-правил
const ChangeControlRefinedSchema = ChangeControlValidationSchema.refine(
  (data) => {
    if (data.classification === "critical") {
      return data.impactAnalysis.validationRequired === true;
    }
    return true;
  },
  {
    message: "Критичные изменения требуют валидации",
    path: ["impactAnalysis", "validationRequired"],
  }
).refine(
  (data) => {
    if (data.impactAnalysis.regulatoryImpact) {
      return data.impactAnalysis.riskLevel !== "low";
    }
    return true;
  },
  {
    message: "Изменения с регуляторным влиянием не могут иметь низкий риск",
    path: ["impactAnalysis", "riskLevel"],
  }
);
```

### CAPA Validation

**Описание**: Валидация CAPA с root cause analysis  
**Источник**: `CONTRACT_SPECIFICATIONS.md v2.0 - CAPAZodSchema`

```typescript
const CAPAValidationSchema = z.object({
  capaId: z
    .string()
    .regex(/^CAPA-\d{4}-\d{4}$/, "Формат: CAPA-YYYY-NNNN"),

  type: z
    .enum(["corrective", "preventive"])
    .describe("Тип: корректирующее или предупреждающее"),

  title: z
    .string()
    .min(10, "Заголовок минимум 10 символов")
    .max(200, "Заголовок максимум 200 символов"),

  description: z
    .string()
    .min(50, "Описание проблемы минимум 50 символов"),

  priority: z
    .enum(["low", "medium", "high", "critical"])
    .describe("Приоритет CAPA"),

  rootCauseAnalysis: z.object({
    method: z.enum(["5_why", "fishbone", "fault_tree", "pareto"]),

    findings: z
      .string()
      .min(100, "Результаты анализа минимум 100 символов"),

    rootCause: z
      .string()
      .min(50, "Описание первопричины минимум 50 символов"),

    contributingFactors: z
      .array(z.string())
      .min(1, "Укажите хотя бы один способствующий фактор"),

    evidence: z
      .array(z.string())
      .min(1, "Приложите хотя бы один документ-доказательство"),
  }).describe("Анализ первопричины (RCA)"),

  actions: z
    .array(
      z.object({
        description: z
          .string()
          .min(20, "Описание действия минимум 20 символов"),

        assignedTo: z.string().uuid("Неверный UUID ответственного"),

        dueDate: z
          .string()
          .datetime()
          .refine(
            (date) => new Date(date) > new Date(),
            "Дата выполнения должна быть в будущем"
          ),

        status: z.enum(["pending", "in_progress", "completed", "overdue"]),
      })
    )
    .min(1, "Добавьте хотя бы одно корректирующее действие"),

  effectivenessCheck: z.object({
    scheduledDate: z
      .string()
      .datetime()
      .refine(
        (date) => new Date(date) > new Date(),
        "Дата проверки эффективности должна быть в будущем"
      ),

    method: z
      .string()
      .min(20, "Опишите метод проверки эффективности"),

    followUpRequired: z.boolean(),
  }).optional(),
});

// Refinement: Критичные CAPA требуют effectiveness check
const CAPARefinedSchema = CAPAValidationSchema.refine(
  (data) => {
    if (data.priority === "critical" || data.priority === "high") {
      return data.effectivenessCheck !== undefined;
    }
    return true;
  },
  {
    message: "Критичные и высокоприоритетные CAPA требуют проверки эффективности",
    path: ["effectivenessCheck"],
  }
);
```

### Deviation Validation

**Описание**: Валидация отклонений с impact assessment  
**Источник**: `CONTRACT_SPECIFICATIONS.md v2.0 - DeviationZodSchema`

```typescript
const DeviationValidationSchema = z.object({
  deviationId: z
    .string()
    .regex(/^DEV-\d{4}-\d{4}$/, "Формат: DEV-YYYY-NNNN"),

  title: z
    .string()
    .min(10, "Заголовок минимум 10 символов")
    .max(200, "Заголовок максимум 200 символов"),

  description: z
    .string()
    .min(50, "Описание отклонения минимум 50 символов"),

  classification: z
    .enum(["critical", "major", "minor"])
    .describe("Классификация отклонения"),

  affectedProcess: z
    .string()
    .min(5, "Укажите затронутый процесс"),

  immediateActions: z
    .string()
    .min(30, "Опишите немедленные действия минимум 30 символов")
    .describe("Действия, предпринятые сразу после выявления"),

  impactAssessment: z.object({
    qualityImpact: z.enum(["none", "low", "medium", "high"]),

    productImpact: z.boolean().describe("Влияние на продукцию"),

    affectedBatches: z
      .array(z.string())
      .optional()
      .describe("Затронутые партии продукции"),

    regulatoryReportingRequired: z
      .boolean()
      .describe("Требуется ли уведомление регуляторов"),

    customerNotificationRequired: z
      .boolean()
      .describe("Требуется ли уведомление клиентов"),
  }).describe("Оценка влияния на качество и продукцию"),

  capaRequired: z
    .boolean()
    .describe("Требуется ли открыть CAPA"),
});

// Refinements
const DeviationRefinedSchema = DeviationValidationSchema
  .refine(
    (data) => {
      if (data.classification === "critical") {
        return data.capaRequired === true;
      }
      return true;
    },
    {
      message: "Критичные отклонения всегда требуют CAPA",
      path: ["capaRequired"],
    }
  )
  .refine(
    (data) => {
      if (data.impactAssessment.productImpact) {
        return (
          data.impactAssessment.affectedBatches &&
          data.impactAssessment.affectedBatches.length > 0
        );
      }
      return true;
    },
    {
      message: "При влиянии на продукцию укажите затронутые партии",
      path: ["impactAssessment", "affectedBatches"],
    }
  );
```

### Validation Lifecycle Schema

**Описание**: Валидация протоколов IQ/OQ/PQ (GAMP 5)  
**Источник**: `CONTRACT_SPECIFICATIONS.md v2.0 - ValidationZodSchema`

```typescript
const ValidationLifecycleSchema = z.object({
  validationId: z
    .string()
    .regex(/^VAL-\d{4}-\d{4}$/, "Формат: VAL-YYYY-NNNN"),

  title: z
    .string()
    .min(10, "Название валидации минимум 10 символов")
    .max(200, "Название максимум 200 символов"),

  type: z
    .enum(["IQ", "OQ", "PQ", "revalidation"])
    .describe("Тип валидации согласно GAMP 5"),

  system: z
    .string()
    .min(3, "Название валидируемой системы минимум 3 символа"),

  gampCategory: z
    .enum(["1", "3", "4", "5"])
    .describe("GAMP 5 категория программного обеспечения"),

  protocol: z.object({
    protocolNumber: z
      .string()
      .regex(/^VP-\d{4}-\d{4}$/, "Формат протокола: VP-YYYY-NNNN"),

    version: z
      .string()
      .regex(/^\d+\.\d+$/, "Версия формата: X.Y"),

    approvedBy: z.string().uuid("Неверный UUID утверждающего"),

    approvalDate: z.string().datetime(),

    documentId: z.string().describe("ID документа в Mayan-EDMS"),
  }).optional(),

  testCases: z
    .array(
      z.object({
        testCaseId: z
          .string()
          .regex(/^TC-\d{3}$/, "Формат test case: TC-NNN"),

        description: z
          .string()
          .min(20, "Описание теста минимум 20 символов"),

        acceptanceCriteria: z
          .string()
          .min(20, "Критерии приёмки минимум 20 символов"),

        status: z.enum(["pending", "passed", "failed", "na"]),
      })
    )
    .min(1, "Добавьте хотя бы один тест-кейс"),
});

// Refinement: IQ/OQ/PQ требуют минимум определённого количества тестов
const ValidationRefinedSchema = ValidationLifecycleSchema.refine(
  (data) => {
    const minTests = {
      IQ: 5,
      OQ: 10,
      PQ: 15,
      revalidation: 5,
    };
    return data.testCases.length >= minTests[data.type];
  },
  (data) => ({
    message: `Валидация типа ${data.type} требует минимум ${
      { IQ: 5, OQ: 10, PQ: 15, revalidation: 5 }[data.type]
    } тест-кейсов`,
    path: ["testCases"],
  })
);
```

### Training Validation

**Описание**: Валидация обучения и компетенций  
**Источник**: `CONTRACT_SPECIFICATIONS.md v2.0 - TrainingZodSchema`

```typescript
const TrainingValidationSchema = z.object({
  trainingId: z
    .string()
    .regex(/^TRN-\d{4}-\d{4}$/, "Формат: TRN-YYYY-NNNN"),

  courseId: z
    .string()
    .regex(/^CUR-\d{3}$/, "Формат курса: CUR-NNN"),

  userId: z.string().uuid("Неверный UUID пользователя"),

  status: z.enum(["enrolled", "in_progress", "completed", "expired"]),

  startDate: z
    .string()
    .datetime()
    .refine(
      (date) => new Date(date) <= new Date(),
      "Дата начала не может быть в будущем"
    ),

  completionDate: z
    .string()
    .datetime()
    .optional()
    .refine(
      (date) => !date || new Date(date) <= new Date(),
      "Дата завершения не может быть в будущем"
    ),

  score: z
    .number()
    .min(0, "Оценка минимум 0")
    .max(100, "Оценка максимум 100")
    .optional(),

  passingScore: z
    .number()
    .min(0, "Проходной балл минимум 0")
    .max(100, "Проходной балл максимум 100"),

  attempts: z
    .number()
    .min(0, "Количество попыток не может быть отрицательным")
    .max(3, "Максимум 3 попытки")
    .default(0),
});

// Refinements
const TrainingRefinedSchema = TrainingValidationSchema
  .refine(
    (data) => {
      if (data.status === "completed") {
        return data.completionDate !== undefined && data.score !== undefined;
      }
      return true;
    },
    {
      message: "Завершённое обучение требует даты завершения и оценки",
      path: ["status"],
    }
  )
  .refine(
    (data) => {
      if (data.score !== undefined) {
        return data.score >= data.passingScore;
      }
      return true;
    },
    {
      message: "Оценка должна быть не ниже проходного балла",
      path: ["score"],
    }
  )
  .refine(
    (data) => {
      if (data.completionDate && data.startDate) {
        return new Date(data.completionDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: "Дата завершения должна быть после даты начала",
      path: ["completionDate"],
    }
  );
```

### Document Control Validation

**Описание**: Валидация документов с версионированием  
**Источник**: `CONTRACT_SPECIFICATIONS.md v2.0 - DocumentZodSchema`

```typescript
const DocumentValidationSchema = z.object({
  documentId: z
    .string()
    .regex(/^DOC-[A-Z]{3}-\d{4}-\d{4}$/, "Формат: DOC-XXX-YYYY-NNNN"),

  title: z
    .string()
    .min(10, "Название документа минимум 10 символов")
    .max(200, "Название максимум 200 символов"),

  type: z
    .enum(["SOP", "protocol", "report", "form", "policy"])
    .describe("Тип документа"),

  version: z
    .string()
    .regex(/^\d+\.\d+$/, "Версия формата: X.Y (например, 1.0, 2.1)"),

  status: z
    .enum(["draft", "review", "approved", "obsolete", "archived"])
    .describe("Статус документа в lifecycle"),

  effectiveDate: z
    .string()
    .datetime()
    .optional()
    .refine(
      (date) => !date || new Date(date) >= new Date(),
      "Дата вступления в силу не может быть в прошлом"
    ),

  reviewDate: z
    .string()
    .datetime()
    .optional()
    .describe("Дата следующего периодического пересмотра"),

  edmsDocumentId: z
    .string()
    .min(1, "ID документа в Mayan-EDMS обязателен"),

  changeControlId: z
    .string()
    .uuid()
    .optional()
    .describe("Ссылка на Change Control (если применимо)"),
});

// Refinements
const DocumentRefinedSchema = DocumentValidationSchema
  .refine(
    (data) => {
      const requiresApprover = ["SOP", "protocol", "policy"];
      if (requiresApprover.includes(data.type) && data.status === "approved") {
        return data.effectiveDate !== undefined;
      }
      return true;
    },
    {
      message: "Утверждённые SOP/протоколы/политики требуют даты вступления в силу",
      path: ["effectiveDate"],
    }
  )
  .refine(
    (data) => {
      if (data.reviewDate && data.effectiveDate) {
        return new Date(data.reviewDate) > new Date(data.effectiveDate);
      }
      return true;
    },
    {
      message: "Дата пересмотра должна быть после даты вступления в силу",
      path: ["reviewDate"],
    }
  )
  .refine(
    (data) => {
      const majorChange = parseFloat(data.version) >= 2.0;
      if (majorChange && data.status === "approved") {
        return data.changeControlId !== undefined;
      }
      return true;
    },
    {
      message: "Крупные изменения документа (версия ≥2.0) требуют Change Control",
      path: ["changeControlId"],
    }
  );
```

### Electronic Signature Validation

**Описание**: Валидация электронных подписей (21 CFR Part 11)  
**Источник**: `CONTRACT_SPECIFICATIONS.md v2.0 - ElectronicSignatureZodSchema`

```typescript
const ElectronicSignatureValidationSchema = z.object({
  userId: z.string().uuid("Неверный UUID пользователя"),

  fullName: z
    .string()
    .min(3, "Полное имя минимум 3 символа")
    .max(100, "Полное имя максимум 100 символов"),

  role: z
    .string()
    .min(3, "Роль минимум 3 символа")
    .describe("Роль пользователя в системе"),

  action: z
    .string()
    .min(3, "Действие минимум 3 символа")
    .describe("Действие: approved, reviewed, implemented, etc."),

  reason: z
    .string()
    .min(10, "Обоснование минимум 10 символов (требование 21 CFR Part 11)")
    .max(500, "Обоснование максимум 500 символов")
    .describe("Обязательное обоснование подписи"),

  timestamp: z
    .string()
    .datetime()
    .refine(
      (date) => new Date(date) <= new Date(),
      "Временная метка не может быть в будущем"
    ),

  ipAddress: z
    .string()
    .ip({ version: "v4" })
    .or(z.string().ip({ version: "v6" }))
    .describe("IP адрес пользователя"),

  authenticationMethod: z
    .enum(["password", "mfa", "certificate"])
    .describe("Метод аутентификации (password для тестовых систем, mfa/certificate для production)"),
});

// Refinement: Критичные операции требуют MFA или сертификат
const ElectronicSignatureRefinedSchema = ElectronicSignatureValidationSchema.refine(
  (data) => {
    const criticalActions = ["approved", "closed", "archived", "signed"];
    if (criticalActions.includes(data.action.toLowerCase())) {
      return data.authenticationMethod !== "password";
    }
    return true;
  },
  {
    message: "Критичные операции требуют MFA или certificate authentication",
    path: ["authenticationMethod"],
  }
);
```

### Audit Trail Metadata Validation

**Описание**: Валидация ALCOA+ audit trail метаданных  
**Источник**: `CONTRACT_SPECIFICATIONS.md v2.0 - AuditTrailZodSchema`

```typescript
const AuditTrailMetadataValidationSchema = z.object({
  createdBy: z.object({
    userId: z.string().uuid("Неверный UUID создателя"),
    fullName: z.string().min(3, "Имя создателя минимум 3 символа"),
  }),

  createdAt: z
    .string()
    .datetime()
    .refine(
      (date) => new Date(date) <= new Date(),
      "Дата создания не может быть в будущем"
    ),

  lastModifiedBy: z
    .object({
      userId: z.string().uuid("Неверный UUID изменившего"),
      fullName: z.string().min(3, "Имя изменившего минимум 3 символа"),
    })
    .optional(),

  lastModifiedAt: z
    .string()
    .datetime()
    .optional()
    .refine(
      (date) => !date || new Date(date) <= new Date(),
      "Дата изменения не может быть в будущем"
    ),

  changeReason: z
    .string()
    .min(10, "Причина изменения минимум 10 символов")
    .max(500, "Причина изменения максимум 500 символов")
    .optional()
    .describe("Обоснование изменения (ALCOA+ requirement)"),

  version: z
    .number()
    .int()
    .positive("Версия должна быть положительным числом")
    .describe("Версия записи (автоинкремент)"),

  dataIntegrityHash: z
    .string()
    .regex(/^[a-f0-9]{64}$/, "Неверный формат SHA-256 хеша")
    .describe("SHA-256 хеш для проверки целостности данных"),
});

// Refinement: При изменении обязательны lastModifiedBy, lastModifiedAt, changeReason
const AuditTrailRefinedSchema = AuditTrailMetadataValidationSchema.refine(
  (data) => {
    if (data.version > 1) {
      return (
        data.lastModifiedBy !== undefined &&
        data.lastModifiedAt !== undefined &&
        data.changeReason !== undefined
      );
    }
    return true;
  },
  {
    message: "Изменённые записи (version > 1) требуют lastModifiedBy, lastModifiedAt, changeReason",
    path: ["version"],
  }
).refine(
  (data) => {
    if (data.lastModifiedAt && data.createdAt) {
      return new Date(data.lastModifiedAt) >= new Date(data.createdAt);
    }
    return true;
  },
  {
    message: "Дата изменения должна быть после даты создания",
    path: ["lastModifiedAt"],
  }
);
```

### GxP Validation Fields Schema

**Описание**: Валидация GxP полей (mixin для всех критичных сущностей)  
**Источник**: `CONTRACT_SPECIFICATIONS.md v2.0 - GxPValidationFieldsSchema`

```typescript
const GxPValidationFieldsSchema = z.object({
  gxpCritical: z
    .boolean()
    .describe("Является ли запись критичной для GxP"),

  validationStatus: z
    .enum(["validated", "pending", "failed", "na"])
    .describe("Статус валидации записи"),

  regulatoryRelevance: z
    .array(
      z.enum([
        "FDA_21CFR11",
        "EU_GMP_ANNEX11",
        "WHO_GACP",
        "EMA_GACP",
        "GAMP5",
        "ALCOA_PLUS",
        "ISO_9001",
        "ISO_13485",
      ])
    )
    .min(1, "Укажите хотя бы один применимый регуляторный стандарт")
    .describe("Применимые регуляторные требования"),

  dataIntegrityLevel: z
    .enum([
      "attributable",
      "legible",
      "contemporaneous",
      "original",
      "accurate",
      "complete",
      "consistent",
      "enduring",
      "available",
    ])
    .describe("ALCOA+ уровень data integrity"),
});

// Refinement: GxP critical записи должны быть validated
const GxPValidationRefinedSchema = GxPValidationFieldsSchema.refine(
  (data) => {
    if (data.gxpCritical) {
      return data.validationStatus === "validated" || data.validationStatus === "pending";
    }
    return true;
  },
  {
    message: "GxP критичные записи должны быть validated или pending",
    path: ["validationStatus"],
  }
);
```

---

**Последнее обновление**: 2025-10-17  
**Версия**: 2.0 - Aligned with DS v2.0 compliance modules  
**Источники**: CONTRACT_SPECIFICATIONS.md v2.0, FDA_21CFR_Part11.md, ALCOA+.md, GAMP5.md
