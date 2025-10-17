---
title: "Coding Standards & Best Practices"
version: "1.0"
status: "active"
last_updated: "2025-09-14"
type: "standards"
# AI-Assisted Documentation Metadata (per AI_Assisted_Documentation_Policy.md)
ai_generated: true
author_verified: false
qa_approved: false
ai_status: draft
---

# 📏 Стандарты кодирования и лучшие практики

**Документ**: Coding Standards & Best Practices  
**Версия**: 1.0  
**Дата**: 14 сентября 2025  
**Статус**: MANDATORY - Обязательно к соблюдению

---

## 🎯 **1. ОБЗОР СТАНДАРТОВ**

### 1.1 Цель документа

Данный документ определяет обязательные стандарты кодирования для GACP-ERP системы с акцентом на:

- AI-assisted разработку с GitHub Copilot + Claude
- Schema-first API design с ts-rest + Zod!
- Zod single source of truth z.infer for all types!
- Type-safe development с TypeScript
- NX monorepo для организации кода
- Domain-driven design principles
- Clean Architecture patterns
- Comprehensive testing strategies

### 1.2 Применимость

**Обязательно для**:

- Всего TypeScript/JavaScript кода
- React/Next.js компонентов
- NestJS backend сервисов
- Database migrations и queries
- API documentation
- Test code

**Рекомендовано для**:

- Configuration files
- Docker files
- Documentation
- Shell scripts

---

## 🔧 **2. DEVELOPMENT ENVIRONMENT**

### 2.1 Required Tools

```json
{
  "required": {
    "node": ">=18.0.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "husky": "^8.0.0",
    "lint-staged": "^13.0.0"
  },
  "aiTools": {
    "githubCopilot": "required",
    "copilotChat": "recommended",
    "cursor": "optional"
  },
  "vscode": {
    "extensions": [
      "ms-vscode.vscode-typescript-next",
      "esbenp.prettier-vscode",
      "ms-vscode.eslint",
      "bradlc.vscode-tailwindcss",
      "ms-vscode.vscode-json"
    ]
  }
}
```

### 2.2 Project Configuration

**ESLint Configuration (.eslintrc.js)**:

```javascript
module.exports = {
  extends: [
    "@next/next/core-web-vitals",
    "@typescript-eslint/recommended",
    "@typescript-eslint/recommended-requiring-type-checking",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint", "import"],
  rules: {
    // Type Safety
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unsafe-assignment": "error",
    "@typescript-eslint/no-unsafe-call": "error",
    "@typescript-eslint/no-unsafe-member-access": "error",
    "@typescript-eslint/no-unsafe-return": "error",

    // Code Quality
    "@typescript-eslint/prefer-readonly": "error",
    "@typescript-eslint/prefer-readonly-parameter-types": "warn",
    "@typescript-eslint/strict-boolean-expressions": "error",

    // Import Organization
    "import/order": [
      "error",
      {
        groups: [
          "builtin",
          "external",
          "internal",
          "parent",
          "sibling",
          "index",
        ],
        "newlines-between": "always",
        alphabetize: {
          order: "asc",
          caseInsensitive: true,
        },
      },
    ],

    // Naming Conventions
    "@typescript-eslint/naming-convention": [
      "error",
      {
        selector: "interface",
        format: ["PascalCase"],
      },
      {
        selector: "typeAlias",
        format: ["PascalCase"],
      },
      {
        selector: "class",
        format: ["PascalCase"],
      },
      {
        selector: "method",
        format: ["camelCase"],
      },
      {
        selector: "variable",
        format: ["camelCase", "UPPER_CASE"],
      },
    ],
  },
};
```

**Prettier Configuration (.prettierrc)**:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

**TypeScript Configuration (tsconfig.json)**:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"],
      "@/api/*": ["./src/app/api/*"]
    },

    // Strict Mode Settings
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noImplicitOverride": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

---

## � **2.5 ZOD-FIRST DEVELOPMENT APPROACH**

> **🏛️ ФУНДАМЕНТАЛЬНЫЙ ПРИНЦИП**: В нашей архитектуре Zod-схемы являются единственным источником истины для всех типов и валидации

### 2.5.1 Zod как Single Source of Truth

**ПРАВИЛО №1**: Всегда начинаем с Zod-схемы, никогда с интерфейса TypeScript

```typescript
// ✅ ПРАВИЛЬНО: Начинаем с Zod-схемы
import { z } from "zod";

// 1. Сначала определяем Zod-схему
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: z.enum(["admin", "operator", "viewer"]),
  isActive: z.boolean(),
  lastLoginAt: z.date().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// 2. Затем выводим TypeScript тип
export type User = z.infer<typeof UserSchema>;

// ❌ НЕПРАВИЛЬНО: Не начинаем с интерфейса
interface User {
  id: string;
  email: string;
  // ... остальные поля
}
```

### 2.5.2 Kafka Events с Zod Validation

**ОБЯЗАТЕЛЬНО**: Все Kafka события должны быть описаны Zod-схемами

```typescript
// ✅ Правильно: Event-driven architecture с Zod
export const PlantCreatedEventSchema = z.object({
  eventType: z.literal("plant.created"),
  eventId: z.string().uuid(),
  timestamp: z.string().datetime(),
  version: z.literal("1.0"),
  payload: z.object({
    plantId: z.string().uuid(),
    batchId: z.string().uuid(),
    genetics: GeneticsSchema,
    location: LocationSchema,
    createdBy: z.string().uuid(),
  }),
  metadata: z.object({
    source: z.literal("cultivation-service"),
    correlationId: z.string().uuid(),
    causationId: z.string().uuid().optional(),
  }),
});

export type PlantCreatedEvent = z.infer<typeof PlantCreatedEventSchema>;

// Kafka producer с типобезопасностью
export async function publishPlantCreated(event: PlantCreatedEvent) {
  // Валидация на runtime
  const validatedEvent = PlantCreatedEventSchema.parse(event);

  await kafka.producer().send({
    topic: "cultivation.events",
    messages: [
      {
        key: event.payload.plantId,
        value: JSON.stringify(validatedEvent),
      },
    ],
  });
}
```

### 2.5.3 API Contracts с ts-rest + Zod

**ОБЯЗАТЕЛЬНО**: Используем ts-rest для type-safe API контрактов

```typescript
import { initContract } from "@ts-rest/core";
import { z } from "zod";

// 1. Определяем входные/выходные схемы
const CreatePlantRequestSchema = z.object({
  batchId: z.string().uuid(),
  genetics: GeneticsSchema,
  location: LocationSchema.optional(),
});

const PlantResponseSchema = z.object({
  id: z.string().uuid(),
  batchId: z.string().uuid(),
  genetics: GeneticsSchema,
  location: LocationSchema.nullable(),
  stage: z.enum(["seedling", "vegetative", "flowering", "harvested"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// 2. Создаем типобезопасный контракт
const c = initContract();

export const plantsContract = c.router(
  {
    createPlant: {
      method: "POST",
      path: "/plants",
      responses: {
        201: PlantResponseSchema,
        400: z.object({
          error: z.string(),
          details: z.array(z.string()).optional(),
        }),
        422: z.object({
          error: z.string(),
          validation: z.record(z.array(z.string())),
        }),
      },
      body: CreatePlantRequestSchema,
      summary: "Create a new plant",
    },
    getPlant: {
      method: "GET",
      path: "/plants/:id",
      responses: {
        200: PlantResponseSchema,
        404: z.object({ error: z.string() }),
      },
      pathParams: z.object({ id: z.string().uuid() }),
    },
  },
  {
    pathPrefix: "/api/v1",
  }
);

// 3. Типы выводятся автоматически
export type CreatePlantRequest = z.infer<typeof CreatePlantRequestSchema>;
export type PlantResponse = z.infer<typeof PlantResponseSchema>;
```

### 2.5.4 Component Props с Zod

**ОБЯЗАТЕЛЬНО**: Все React компоненты используют Zod для валидации props

```typescript
import { z } from "zod";
import { forwardRef } from "react";

// 1. Определяем схему props
const PlantCardPropsSchema = z.object({
  plant: PlantResponseSchema,
  onClick: z.function().args(z.string().uuid()).returns(z.void()).optional(),
  isSelected: z.boolean().default(false),
  className: z.string().optional(),
});

export type PlantCardProps = z.infer<typeof PlantCardPropsSchema>;

// 2. Компонент с типобезопасными props
export const PlantCard = forwardRef<HTMLDivElement, PlantCardProps>(
  (props, ref) => {
    // Runtime валидация в development
    if (process.env.NODE_ENV === "development") {
      PlantCardPropsSchema.parse(props);
    }

    const { plant, onClick, isSelected = false, className } = props;

    return (
      <div
        ref={ref}
        className={cn("plant-card", { selected: isSelected }, className)}
        onClick={() => onClick?.(plant.id)}
      >
        <h3>{plant.genetics.strain}</h3>
        <p>Stage: {plant.stage}</p>
        <p>Created: {new Date(plant.createdAt).toLocaleDateString()}</p>
      </div>
    );
  }
);
```

### 2.5.5 Database Models с Zod

**ОБЯЗАТЕЛЬНО**: Схемы БД соответствуют Zod-схемам

```typescript
// 1. Zod схема для создания записи
export const CreatePlantDbSchema = z.object({
  id: z.string().uuid(),
  batch_id: z.string().uuid(),
  genetics_id: z.string().uuid(),
  location_zone: z.string().optional(),
  location_row: z.number().int().positive().optional(),
  location_position: z.number().int().positive().optional(),
  stage: z.enum(["seedling", "vegetative", "flowering", "harvested"]),
  created_at: z.date(),
  updated_at: z.date(),
});

// 2. Zod схема для чтения из БД (может включать computed поля)
export const PlantDbRecordSchema = CreatePlantDbSchema.extend({
  // Добавляем computed поля
  age_days: z.number().int().nonnegative(),
  is_active: z.boolean(),
  last_activity_at: z.date().nullable(),
});

// 3. Типы для TypeScript
export type CreatePlantDbRecord = z.infer<typeof CreatePlantDbSchema>;
export type PlantDbRecord = z.infer<typeof PlantDbRecordSchema>;

// 4. Трансформация между API и DB моделями
export function transformApiToDb(
  apiPlant: CreatePlantRequest
): CreatePlantDbRecord {
  return CreatePlantDbSchema.parse({
    id: crypto.randomUUID(),
    batch_id: apiPlant.batchId,
    genetics_id: apiPlant.genetics.id,
    location_zone: apiPlant.location?.zone,
    location_row: apiPlant.location?.row,
    location_position: apiPlant.location?.position,
    stage: "seedling",
    created_at: new Date(),
    updated_at: new Date(),
  });
}
```

### 2.5.6 Zod Best Practices

#### 2.5.6.1 Композиция схем

```typescript
// ✅ Базовые схемы для переиспользования
export const TimestampsSchema = z.object({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const AuditableSchema = TimestampsSchema.extend({
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid(),
});

// ✅ Композиция сложных схем
export const PlantSchema = z
  .object({
    id: z.string().uuid(),
    batchId: z.string().uuid(),
    genetics: GeneticsSchema,
    location: LocationSchema.nullable(),
    stage: PlantStageSchema,
  })
  .merge(AuditableSchema);
```

#### 2.5.6.2 Валидация с transform

```typescript
// ✅ Автоматическая нормализация данных
export const EmailSchema = z
  .string()
  .email()
  .transform((email) => email.toLowerCase().trim());

export const CurrencyAmountSchema = z
  .number()
  .positive()
  .transform((amount) => Math.round(amount * 100)); // В центах
```

#### 2.5.6.3 Conditional validation

```typescript
// ✅ Условная валидация
export const CreateUserSchema = z
  .object({
    email: z.string().email(),
    role: z.enum(["admin", "operator", "viewer"]),
    departmentId: z.string().uuid().optional(),
  })
  .refine((data) => data.role === "admin" || data.departmentId !== undefined, {
    message: "Department ID is required for non-admin users",
    path: ["departmentId"],
  });
```

---

## �📝 **3. CODING STANDARDS**

### 3.1 TypeScript Best Practices

#### 3.1.1 Type Definitions

**Domain Types (MANDATORY)**:

```typescript
// ✅ Good: Strong typing with branded types
export type PlantId = string & { readonly brand: unique symbol };
export type BatchId = string & { readonly brand: unique symbol };
export type UserId = string & { readonly brand: unique symbol };

// ✅ Good: Discriminated unions for state management
export type PlantStage =
  | "seedling"
  | "vegetative"
  | "flowering"
  | "harvest"
  | "disposed";

// ✅ Good: Comprehensive interface definitions
export interface Plant {
  readonly id: PlantId;
  readonly batchId: BatchId;
  readonly stage: PlantStage;
  readonly genetics: Genetics;
  readonly location?: Location;
  readonly metadata: PlantMetadata;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// ✅ Good: Strict validation schemas
export const PlantCreateSchema = z.object({
  batchId: z.string().uuid(),
  genetics: GeneticsSchema,
  location: LocationSchema.optional(),
  metadata: PlantMetadataSchema,
});

export type PlantCreateInput = z.infer<typeof PlantCreateSchema>;

// ❌ Bad: Loose typing
export interface Plant {
  id: string;
  data: any;
  info?: object;
}
```

#### 3.1.2 Error Handling

**Domain Errors (MANDATORY)**:

```typescript
// ✅ Good: Type-safe error handling
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
}

export class PlantNotFoundError extends DomainError {
  readonly code = "PLANT_NOT_FOUND";
  readonly statusCode = 404;

  constructor(plantId: PlantId) {
    super(`Plant with id ${plantId} not found`);
  }
}

export class InvalidStageTransitionError extends DomainError {
  readonly code = "INVALID_STAGE_TRANSITION";
  readonly statusCode = 400;

  constructor(from: PlantStage, to: PlantStage) {
    super(`Cannot transition plant from ${from} to ${to}`);
  }
}

// ✅ Good: Result pattern for operations
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export async function transitionPlantStage(
  plantId: PlantId,
  newStage: PlantStage
): Promise<Result<Plant, DomainError>> {
  try {
    const plant = await plantRepository.findById(plantId);
    if (!plant) {
      return { success: false, error: new PlantNotFoundError(plantId) };
    }

    if (!isValidTransition(plant.stage, newStage)) {
      return {
        success: false,
        error: new InvalidStageTransitionError(plant.stage, newStage),
      };
    }

    const updatedPlant = await plant.transitionTo(newStage);
    return { success: true, data: updatedPlant };
  } catch (error) {
    return { success: false, error: error as DomainError };
  }
}

// ❌ Bad: Throwing raw errors
export async function updatePlant(id: string, data: any): Promise<any> {
  const plant = await db.plants.findUnique({ where: { id } });
  if (!plant) throw new Error("Not found");
  return await db.plants.update({ where: { id }, data });
}
```

#### 3.1.3 Immutability

**Immutable Data Structures (RECOMMENDED)**:

```typescript
// ✅ Good: Immutable operations
export class PlantAggregate {
  constructor(
    private readonly _id: PlantId,
    private readonly _batchId: BatchId,
    private readonly _stage: PlantStage,
    private readonly _genetics: Genetics,
    private readonly _location: Location | undefined,
    private readonly _metadata: PlantMetadata,
    private readonly _events: ReadonlyArray<DomainEvent>
  ) {}

  get id(): PlantId {
    return this._id;
  }
  get stage(): PlantStage {
    return this._stage;
  }

  transitionTo(newStage: PlantStage): PlantAggregate {
    if (!this.canTransitionTo(newStage)) {
      throw new InvalidStageTransitionError(this._stage, newStage);
    }

    const event = new PlantStageTransitionedEvent(
      this._id,
      this._stage,
      newStage,
      new Date()
    );

    return new PlantAggregate(
      this._id,
      this._batchId,
      newStage,
      this._genetics,
      this._location,
      this._metadata,
      [...this._events, event]
    );
  }

  private canTransitionTo(newStage: PlantStage): boolean {
    const validTransitions: Record<PlantStage, PlantStage[]> = {
      seedling: ["vegetative", "disposed"],
      vegetative: ["flowering", "disposed"],
      flowering: ["harvest", "disposed"],
      harvest: ["disposed"],
      disposed: [],
    };

    return validTransitions[this._stage]?.includes(newStage) ?? false;
  }
}

// ❌ Bad: Mutable state
export class Plant {
  public stage: string;
  public metadata: any;

  changeStage(newStage: string) {
    this.stage = newStage; // Direct mutation
  }
}
```

### 3.2 React/Next.js Patterns

#### 3.2.1 Component Structure

**Component Standards (MANDATORY)**:

```typescript
// ✅ Good: Comprehensive component structure
import React, { useState, useCallback, useMemo } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Plant, PlantCreateInput } from "@/types/plant";

// Props validation schema
const PlantFormPropsSchema = z.object({
  plant: z.custom<Plant>().optional(),
  onSubmit: z
    .function()
    .args(z.custom<PlantCreateInput>())
    .returns(z.promise(z.void())),
  onCancel: z.function().returns(z.void()).optional(),
  className: z.string().optional(),
  disabled: z.boolean().default(false),
});

export type PlantFormProps = z.infer<typeof PlantFormPropsSchema>;

/**
 * PlantForm component for creating and editing plants
 *
 * @param plant - Existing plant data for editing mode
 * @param onSubmit - Callback function called when form is submitted
 * @param onCancel - Optional callback for form cancellation
 * @param className - Additional CSS classes
 * @param disabled - Whether the form is disabled
 */
export const PlantForm: React.FC<PlantFormProps> = ({
  plant,
  onSubmit,
  onCancel,
  className,
  disabled = false,
}) => {
  // Validate props at runtime (development only)
  if (process.env.NODE_ENV === "development") {
    PlantFormPropsSchema.parse({
      plant,
      onSubmit,
      onCancel,
      className,
      disabled,
    });
  }

  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state management
  const [formData, setFormData] = useState<PlantCreateInput>(() => ({
    batchId: plant?.batchId ?? "",
    genetics: plant?.genetics ?? { strain: "", lineage: "" },
    location: plant?.location,
    metadata: plant?.metadata ?? {},
  }));

  // Memoized validation
  const isValid = useMemo(() => {
    return PlantCreateSchema.safeParse(formData).success;
  }, [formData]);

  // Event handlers
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!isValid || isSubmitting) return;

      try {
        setIsSubmitting(true);
        await onSubmit(formData);
        toast({
          title: "Success",
          description: `Plant ${plant ? "updated" : "created"} successfully`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, isValid, isSubmitting, onSubmit, plant, toast]
  );

  const handleFieldChange = useCallback(
    (field: keyof PlantCreateInput) =>
      (value: PlantCreateInput[typeof field]) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
      },
    []
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("space-y-4", className)}
      data-testid="plant-form"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="strain" className="text-sm font-medium">
            Strain
          </label>
          <Input
            id="strain"
            value={formData.genetics.strain}
            onChange={(e) =>
              handleFieldChange("genetics")({
                ...formData.genetics,
                strain: e.target.value,
              })
            }
            disabled={disabled || isSubmitting}
            required
          />
        </div>

        {/* Additional form fields... */}
      </div>

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={!isValid || disabled || isSubmitting}
          loading={isSubmitting}
        >
          {plant ? "Update" : "Create"} Plant
        </Button>
      </div>
    </form>
  );
};

PlantForm.displayName = "PlantForm";

// ❌ Bad: Untyped, unvalidated component
export const PlantForm = ({ plant, onSubmit }: any) => {
  const [data, setData] = useState(plant || {});

  return (
    <form onSubmit={() => onSubmit(data)}>
      <input
        value={data.strain}
        onChange={(e) => setData({ ...data, strain: e.target.value })}
      />
      <button>Submit</button>
    </form>
  );
};
```

#### 3.2.2 Custom Hooks

**Hook Patterns (MANDATORY)**:

```typescript
// ✅ Good: Type-safe custom hook
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { api } from "@/lib/api";
import type {
  Plant,
  PlantId,
  PlantCreateInput,
  PlantUpdateInput,
} from "@/types/plant";

const PlantQueryFiltersSchema = z.object({
  batchId: z.string().uuid().optional(),
  stage: z
    .enum(["seedling", "vegetative", "flowering", "harvest", "disposed"])
    .optional(),
  facilityId: z.string().uuid().optional(),
});

export type PlantQueryFilters = z.infer<typeof PlantQueryFiltersSchema>;

/**
 * Hook for managing plant data with React Query
 * Provides CRUD operations and caching for plants
 */
export function usePlants(filters?: PlantQueryFilters) {
  const queryClient = useQueryClient();

  // Query for getting plants list
  const plantsQuery = useQuery({
    queryKey: ["plants", filters],
    queryFn: () => api.plants.getAll(filters),
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes
  });

  // Mutation for creating plants
  const createPlantMutation = useMutation({
    mutationFn: (input: PlantCreateInput) => api.plants.create(input),
    onSuccess: (newPlant) => {
      // Update the plants list cache
      queryClient.setQueryData(
        ["plants", filters],
        (oldData: Plant[] | undefined) =>
          oldData ? [...oldData, newPlant] : [newPlant]
      );

      // Set the individual plant cache
      queryClient.setQueryData(["plants", newPlant.id], newPlant);
    },
    onError: (error) => {
      console.error("Failed to create plant:", error);
    },
  });

  // Mutation for updating plants
  const updatePlantMutation = useMutation({
    mutationFn: ({ id, input }: { id: PlantId; input: PlantUpdateInput }) =>
      api.plants.update(id, input),
    onSuccess: (updatedPlant) => {
      // Update the individual plant cache
      queryClient.setQueryData(["plants", updatedPlant.id], updatedPlant);

      // Update the plants list cache
      queryClient.setQueryData(
        ["plants", filters],
        (oldData: Plant[] | undefined) =>
          oldData?.map((plant) =>
            plant.id === updatedPlant.id ? updatedPlant : plant
          )
      );
    },
  });

  // Mutation for deleting plants
  const deletePlantMutation = useMutation({
    mutationFn: (id: PlantId) => api.plants.delete(id),
    onSuccess: (_, deletedId) => {
      // Remove from plants list cache
      queryClient.setQueryData(
        ["plants", filters],
        (oldData: Plant[] | undefined) =>
          oldData?.filter((plant) => plant.id !== deletedId)
      );

      // Remove individual plant cache
      queryClient.removeQueries({ queryKey: ["plants", deletedId] });
    },
  });

  return {
    // Data
    plants: plantsQuery.data ?? [],
    isLoading: plantsQuery.isLoading,
    isError: plantsQuery.isError,
    error: plantsQuery.error,

    // Actions
    createPlant: createPlantMutation.mutate,
    updatePlant: updatePlantMutation.mutate,
    deletePlant: deletePlantMutation.mutate,

    // States
    isCreating: createPlantMutation.isPending,
    isUpdating: updatePlantMutation.isPending,
    isDeleting: deletePlantMutation.isPending,

    // Utilities
    refetch: plantsQuery.refetch,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ["plants"] }),
  };
}

// Hook for individual plant
export function usePlant(plantId: PlantId) {
  return useQuery({
    queryKey: ["plants", plantId],
    queryFn: () => api.plants.getById(plantId),
    enabled: !!plantId,
    staleTime: 60_000, // 1 minute
  });
}

// ❌ Bad: Untyped hook without proper caching
export function usePlants(filters: any) {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/plants")
      .then((res) => res.json())
      .then(setPlants)
      .finally(() => setLoading(false));
  }, []);

  return { plants, loading };
}
```

### 3.3 Backend (NestJS) Standards

#### 3.3.1 Controller Patterns

**API Controller Standards (MANDATORY)**:

```typescript
// ✅ Good: Comprehensive controller with validation
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  HttpStatus,
  HttpCode,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { z } from "zod";

import { ZodValidationPipe } from "@/common/pipes/zod-validation.pipe";
import { JwtAuthGuard } from "@/auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "@/auth/guards/permissions.guard";
import { LoggingInterceptor } from "@/common/interceptors/logging.interceptor";
import { Permissions } from "@/auth/decorators/permissions.decorator";
import { CurrentUser } from "@/auth/decorators/current-user.decorator";
import { PlantService } from "./plant.service";
import {
  PlantResponseDto,
  PlantCreateDto,
  PlantUpdateDto,
  PlantQueryDto,
  PlantStageTransitionDto,
} from "./dto";
import type { JwtPayload } from "@/auth/types";

const PlantParamsSchema = z.object({
  id: z.string().uuid(),
});

@ApiTags("plants")
@Controller("plants")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@UseInterceptors(LoggingInterceptor)
@ApiBearerAuth()
export class PlantController {
  constructor(private readonly plantService: PlantService) {}

  @Get()
  @ApiOperation({ summary: "Get all plants" })
  @ApiQuery({ name: "batchId", required: false, type: String })
  @ApiQuery({
    name: "stage",
    required: false,
    enum: ["seedling", "vegetative", "flowering", "harvest", "disposed"],
  })
  @ApiQuery({ name: "facilityId", required: false, type: String })
  @ApiResponse({
    status: 200,
    description: "Plants retrieved successfully",
    type: [PlantResponseDto],
  })
  @Permissions("plants:read")
  async getPlants(
    @Query(new ZodValidationPipe(PlantQueryDto.schema)) query: PlantQueryDto,
    @CurrentUser() user: JwtPayload
  ): Promise<PlantResponseDto[]> {
    const plants = await this.plantService.findAll(query, user);
    return plants.map((plant) => PlantResponseDto.fromDomain(plant));
  }

  @Get(":id")
  @ApiOperation({ summary: "Get plant by ID" })
  @ApiParam({ name: "id", description: "Plant ID", type: String })
  @ApiResponse({
    status: 200,
    description: "Plant retrieved successfully",
    type: PlantResponseDto,
  })
  @ApiResponse({ status: 404, description: "Plant not found" })
  @Permissions("plants:read")
  async getPlant(
    @Param(new ZodValidationPipe(PlantParamsSchema))
    params: z.infer<typeof PlantParamsSchema>,
    @CurrentUser() user: JwtPayload
  ): Promise<PlantResponseDto> {
    const plant = await this.plantService.findById(params.id as PlantId, user);
    return PlantResponseDto.fromDomain(plant);
  }

  @Post()
  @ApiOperation({ summary: "Create a new plant" })
  @ApiResponse({
    status: 201,
    description: "Plant created successfully",
    type: PlantResponseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid input data" })
  @ApiResponse({ status: 403, description: "Insufficient permissions" })
  @HttpCode(HttpStatus.CREATED)
  @Permissions("plants:write")
  async createPlant(
    @Body(new ZodValidationPipe(PlantCreateDto.schema))
    createDto: PlantCreateDto,
    @CurrentUser() user: JwtPayload
  ): Promise<PlantResponseDto> {
    const plant = await this.plantService.create(createDto.toDomain(), user);
    return PlantResponseDto.fromDomain(plant);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update plant" })
  @ApiParam({ name: "id", description: "Plant ID", type: String })
  @ApiResponse({
    status: 200,
    description: "Plant updated successfully",
    type: PlantResponseDto,
  })
  @ApiResponse({ status: 404, description: "Plant not found" })
  @Permissions("plants:write")
  async updatePlant(
    @Param(new ZodValidationPipe(PlantParamsSchema))
    params: z.infer<typeof PlantParamsSchema>,
    @Body(new ZodValidationPipe(PlantUpdateDto.schema))
    updateDto: PlantUpdateDto,
    @CurrentUser() user: JwtPayload
  ): Promise<PlantResponseDto> {
    const plant = await this.plantService.update(
      params.id as PlantId,
      updateDto.toDomain(),
      user
    );
    return PlantResponseDto.fromDomain(plant);
  }

  @Post(":id/transition")
  @ApiOperation({ summary: "Transition plant stage" })
  @ApiParam({ name: "id", description: "Plant ID", type: String })
  @ApiResponse({
    status: 200,
    description: "Plant stage transitioned successfully",
    type: PlantResponseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid stage transition" })
  @Permissions("plants:write")
  async transitionStage(
    @Param(new ZodValidationPipe(PlantParamsSchema))
    params: z.infer<typeof PlantParamsSchema>,
    @Body(new ZodValidationPipe(PlantStageTransitionDto.schema))
    transitionDto: PlantStageTransitionDto,
    @CurrentUser() user: JwtPayload
  ): Promise<PlantResponseDto> {
    const plant = await this.plantService.transitionStage(
      params.id as PlantId,
      transitionDto.newStage,
      transitionDto.reason,
      user
    );
    return PlantResponseDto.fromDomain(plant);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete plant" })
  @ApiParam({ name: "id", description: "Plant ID", type: String })
  @ApiResponse({ status: 204, description: "Plant deleted successfully" })
  @ApiResponse({ status: 404, description: "Plant not found" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions("plants:delete")
  async deletePlant(
    @Param(new ZodValidationPipe(PlantParamsSchema))
    params: z.infer<typeof PlantParamsSchema>,
    @CurrentUser() user: JwtPayload
  ): Promise<void> {
    await this.plantService.delete(params.id as PlantId, user);
  }
}

// ❌ Bad: Unvalidated controller
@Controller("plants")
export class PlantController {
  @Get()
  async getPlants(@Query() query: any) {
    return await this.plantService.findAll(query);
  }

  @Post()
  async createPlant(@Body() data: any) {
    return await this.plantService.create(data);
  }
}
```

#### 3.3.2 Service Layer

**Service Patterns (MANDATORY)**:

```typescript
// ✅ Good: Domain-driven service with proper error handling
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { Transactional } from "@nestjs-cls/transactional";

import { PlantRepository } from "./plant.repository";
import { BatchRepository } from "../batch/batch.repository";
import { EventBus } from "@/common/events/event-bus";
import { AuditService } from "@/audit/audit.service";
import {
  Plant,
  PlantId,
  PlantCreateInput,
  PlantUpdateInput,
  PlantStage,
  PlantQueryFilters,
} from "./domain";
import {
  PlantCreatedEvent,
  PlantStageTransitionedEvent,
  PlantUpdatedEvent,
  PlantDeletedEvent,
} from "./events";
import type { JwtPayload } from "@/auth/types";

@Injectable()
export class PlantService {
  constructor(
    private readonly plantRepository: PlantRepository,
    private readonly batchRepository: BatchRepository,
    private readonly eventBus: EventBus,
    private readonly auditService: AuditService
  ) {}

  async findAll(
    filters: PlantQueryFilters,
    user: JwtPayload
  ): Promise<Plant[]> {
    // Apply user access filters
    const accessFilters = this.applyUserAccessFilters(filters, user);

    return await this.plantRepository.findMany(accessFilters);
  }

  async findById(plantId: PlantId, user: JwtPayload): Promise<Plant> {
    const plant = await this.plantRepository.findById(plantId);

    if (!plant) {
      throw new NotFoundException(`Plant with ID ${plantId} not found`);
    }

    // Check user access
    if (!this.canUserAccessPlant(plant, user)) {
      throw new NotFoundException(`Plant with ID ${plantId} not found`);
    }

    return plant;
  }

  @Transactional()
  async create(input: PlantCreateInput, user: JwtPayload): Promise<Plant> {
    // Validate batch exists and user has access
    const batch = await this.batchRepository.findById(input.batchId);
    if (!batch) {
      throw new BadRequestException(`Batch with ID ${input.batchId} not found`);
    }

    if (!this.canUserAccessBatch(batch, user)) {
      throw new BadRequestException(`Access denied to batch ${input.batchId}`);
    }

    // Create plant aggregate
    const plant = Plant.create(input, user.sub as UserId);

    // Persist
    const savedPlant = await this.plantRepository.save(plant);

    // Publish domain event
    const event = new PlantCreatedEvent(
      savedPlant.id,
      savedPlant.batchId,
      user.sub as UserId
    );
    await this.eventBus.publish(event);

    // Audit log
    await this.auditService.log({
      entityType: "plant",
      entityId: savedPlant.id,
      action: "created",
      userId: user.sub as UserId,
      changes: {
        created: savedPlant.toSnapshot(),
      },
    });

    return savedPlant;
  }

  @Transactional()
  async update(
    plantId: PlantId,
    input: PlantUpdateInput,
    user: JwtPayload
  ): Promise<Plant> {
    const existingPlant = await this.findById(plantId, user);

    // Create updated plant
    const updatedPlant = existingPlant.update(input, user.sub as UserId);

    // Persist changes
    const savedPlant = await this.plantRepository.save(updatedPlant);

    // Publish domain event
    const event = new PlantUpdatedEvent(
      savedPlant.id,
      existingPlant.toSnapshot(),
      savedPlant.toSnapshot(),
      user.sub as UserId
    );
    await this.eventBus.publish(event);

    // Audit log
    await this.auditService.log({
      entityType: "plant",
      entityId: savedPlant.id,
      action: "updated",
      userId: user.sub as UserId,
      changes: {
        before: existingPlant.toSnapshot(),
        after: savedPlant.toSnapshot(),
      },
    });

    return savedPlant;
  }

  @Transactional()
  async transitionStage(
    plantId: PlantId,
    newStage: PlantStage,
    reason: string | undefined,
    user: JwtPayload
  ): Promise<Plant> {
    const plant = await this.findById(plantId, user);
    const previousStage = plant.stage;

    // Perform stage transition
    const transitionedPlant = plant.transitionTo(
      newStage,
      user.sub as UserId,
      reason
    );

    // Persist changes
    const savedPlant = await this.plantRepository.save(transitionedPlant);

    // Publish domain event
    const event = new PlantStageTransitionedEvent(
      savedPlant.id,
      previousStage,
      newStage,
      user.sub as UserId,
      reason
    );
    await this.eventBus.publish(event);

    // Audit log
    await this.auditService.log({
      entityType: "plant",
      entityId: savedPlant.id,
      action: "stage_transition",
      userId: user.sub as UserId,
      changes: {
        from: previousStage,
        to: newStage,
        reason,
      },
    });

    return savedPlant;
  }

  @Transactional()
  async delete(plantId: PlantId, user: JwtPayload): Promise<void> {
    const plant = await this.findById(plantId, user);

    // Soft delete
    const deletedPlant = plant.markAsDeleted(user.sub as UserId);
    await this.plantRepository.save(deletedPlant);

    // Publish domain event
    const event = new PlantDeletedEvent(plant.id, user.sub as UserId);
    await this.eventBus.publish(event);

    // Audit log
    await this.auditService.log({
      entityType: "plant",
      entityId: plant.id,
      action: "deleted",
      userId: user.sub as UserId,
      changes: {
        deleted: plant.toSnapshot(),
      },
    });
  }

  private applyUserAccessFilters(
    filters: PlantQueryFilters,
    user: JwtPayload
  ): PlantQueryFilters {
    // Apply facility-based access control
    if (!user.roles.includes("admin")) {
      return {
        ...filters,
        facilityIds: user.facilities || [],
      };
    }
    return filters;
  }

  private canUserAccessPlant(plant: Plant, user: JwtPayload): boolean {
    if (user.roles.includes("admin")) return true;
    return user.facilities?.includes(plant.facilityId) ?? false;
  }

  private canUserAccessBatch(batch: Batch, user: JwtPayload): boolean {
    if (user.roles.includes("admin")) return true;
    return user.facilities?.includes(batch.facilityId) ?? false;
  }
}

// ❌ Bad: Anemic service without proper error handling
@Injectable()
export class PlantService {
  async getPlants(filters: any) {
    return this.plantRepo.findMany(filters);
  }

  async createPlant(data: any) {
    return this.plantRepo.create(data);
  }
}
```

---

## 🧪 **4. TESTING STANDARDS**

### 4.1 Testing Strategy

**Test Categories (MANDATORY)**:

```typescript
// ✅ Good: Comprehensive test structure
describe("PlantService", () => {
  describe("Unit Tests", () => {
    describe("create", () => {
      it("should create plant with valid input", async () => {
        // Arrange
        const input: PlantCreateInput = {
          batchId: "batch-123" as BatchId,
          genetics: { strain: "OG Kush", lineage: "Indica" },
          metadata: {},
        };
        const user = createMockUser();
        const mockBatch = createMockBatch();

        batchRepository.findById.mockResolvedValue(mockBatch);
        plantRepository.save.mockResolvedValue(createMockPlant());

        // Act
        const result = await plantService.create(input, user);

        // Assert
        expect(result).toBeDefined();
        expect(result.batchId).toBe(input.batchId);
        expect(plantRepository.save).toHaveBeenCalledWith(
          expect.objectContaining({
            batchId: input.batchId,
            genetics: input.genetics,
          })
        );
        expect(eventBus.publish).toHaveBeenCalledWith(
          expect.any(PlantCreatedEvent)
        );
      });

      it("should throw BadRequestException when batch not found", async () => {
        // Arrange
        const input: PlantCreateInput = {
          batchId: "invalid-batch" as BatchId,
          genetics: { strain: "OG Kush", lineage: "Indica" },
          metadata: {},
        };
        const user = createMockUser();

        batchRepository.findById.mockResolvedValue(null);

        // Act & Assert
        await expect(plantService.create(input, user)).rejects.toThrow(
          BadRequestException
        );
      });
    });

    describe("transitionStage", () => {
      it("should transition plant from seedling to vegetative", async () => {
        // Arrange
        const plantId = "plant-123" as PlantId;
        const newStage: PlantStage = "vegetative";
        const user = createMockUser();
        const mockPlant = createMockPlant({ stage: "seedling" });

        plantRepository.findById.mockResolvedValue(mockPlant);
        const transitionedPlant = mockPlant.transitionTo(
          newStage,
          user.sub as UserId
        );
        plantRepository.save.mockResolvedValue(transitionedPlant);

        // Act
        const result = await plantService.transitionStage(
          plantId,
          newStage,
          undefined,
          user
        );

        // Assert
        expect(result.stage).toBe(newStage);
        expect(eventBus.publish).toHaveBeenCalledWith(
          expect.objectContaining({
            plantId,
            fromStage: "seedling",
            toStage: "vegetative",
          })
        );
      });

      it("should throw error for invalid stage transition", async () => {
        // Arrange
        const plantId = "plant-123" as PlantId;
        const newStage: PlantStage = "harvest";
        const user = createMockUser();
        const mockPlant = createMockPlant({ stage: "seedling" });

        plantRepository.findById.mockResolvedValue(mockPlant);

        // Act & Assert
        await expect(
          plantService.transitionStage(plantId, newStage, undefined, user)
        ).rejects.toThrow(InvalidStageTransitionError);
      });
    });
  });

  describe("Integration Tests", () => {
    it("should create plant and verify database persistence", async () => {
      // Integration test with real database
      const input: PlantCreateInput = {
        batchId: await createTestBatch(),
        genetics: { strain: "Test Strain", lineage: "Test" },
        metadata: {},
      };
      const user = createTestUser();

      const plant = await plantService.create(input, user);

      // Verify database state
      const persistedPlant = await plantRepository.findById(plant.id);
      expect(persistedPlant).toEqual(plant);

      // Verify event was published
      const events = await eventStore.getEvents(plant.id);
      expect(events).toContainEqual(
        expect.objectContaining({ type: "PlantCreatedEvent" })
      );
    });
  });
});

// Test Utilities
function createMockUser(overrides: Partial<JwtPayload> = {}): JwtPayload {
  return {
    sub: "user-123",
    email: "test@example.com",
    roles: ["cultivator"],
    permissions: ["plants:read", "plants:write"],
    facilities: ["facility-123"],
    iat: Date.now(),
    exp: Date.now() + 3600000,
    ...overrides,
  };
}

function createMockPlant(overrides: Partial<Plant> = {}): Plant {
  return new Plant({
    id: "plant-123" as PlantId,
    batchId: "batch-123" as BatchId,
    stage: "seedling",
    genetics: { strain: "Test Strain", lineage: "Test" },
    location: undefined,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

function createMockBatch(overrides: Partial<Batch> = {}): Batch {
  return new Batch({
    id: "batch-123" as BatchId,
    facilityId: "facility-123" as FacilityId,
    strainId: "strain-123" as StrainId,
    batchNumber: "B-001",
    startDate: new Date(),
    status: "active",
    ...overrides,
  });
}
```

### 4.2 E2E Testing

**End-to-End Test Standards (MANDATORY)**:

```typescript
// ✅ Good: Comprehensive E2E tests
import { test, expect } from "@playwright/test";

test.describe("Plant Management", () => {
  test.beforeEach(async ({ page }) => {
    // Setup test data
    await seedTestDatabase();

    // Login
    await page.goto("/login");
    await page.fill('[data-testid="email"]', "cultivator@test.com");
    await page.fill('[data-testid="password"]', "password123");
    await page.click('[data-testid="login-button"]');

    // Wait for dashboard
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  });

  test.afterEach(async () => {
    await cleanupTestDatabase();
  });

  test("should create new plant batch and add plants", async ({ page }) => {
    // Navigate to batch creation
    await page.click('[data-testid="nav-batches"]');
    await page.click('[data-testid="create-batch-button"]');

    // Fill batch form
    await page.fill('[data-testid="batch-number"]', "E2E-001");
    await page.selectOption('[data-testid="strain-select"]', "OG Kush");
    await page.fill('[data-testid="target-count"]', "10");

    // Submit batch
    await page.click('[data-testid="submit-batch"]');

    // Verify batch creation
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator("text=E2E-001")).toBeVisible();

    // Add plants to batch
    await page.click('[data-testid="batch-E2E-001"]');
    await page.click('[data-testid="add-plants-button"]');

    // Verify plant addition form
    await expect(page.locator('[data-testid="add-plants-form"]')).toBeVisible();
    await page.fill('[data-testid="plant-count"]', "5");
    await page.click('[data-testid="confirm-add-plants"]');

    // Verify plants were added
    await expect(page.locator('[data-testid="plant-count"]')).toHaveText("5");
    await expect(page.locator('[data-testid="plant-card"]')).toHaveCount(5);
  });

  test("should transition plant through growth stages", async ({ page }) => {
    // Setup: Create plant in seedling stage
    const plantId = await createTestPlant({ stage: "seedling" });

    // Navigate to plant details
    await page.goto(`/plants/${plantId}`);

    // Verify initial stage
    await expect(page.locator('[data-testid="plant-stage"]')).toHaveText(
      "Seedling"
    );

    // Transition to vegetative
    await page.click('[data-testid="stage-transition-button"]');
    await page.selectOption('[data-testid="new-stage-select"]', "vegetative");
    await page.fill(
      '[data-testid="transition-reason"]',
      "Plant has developed true leaves"
    );
    await page.click('[data-testid="confirm-transition"]');

    // Verify stage transition
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="plant-stage"]')).toHaveText(
      "Vegetative"
    );

    // Verify stage history
    await page.click('[data-testid="stage-history-tab"]');
    await expect(page.locator('[data-testid="stage-history"]')).toContainText(
      "Seedling → Vegetative"
    );
  });

  test("should display validation errors for invalid plant data", async ({
    page,
  }) => {
    // Navigate to plant creation
    await page.click('[data-testid="nav-plants"]');
    await page.click('[data-testid="create-plant-button"]');

    // Submit form without required fields
    await page.click('[data-testid="submit-plant"]');

    // Verify validation errors
    await expect(page.locator('[data-testid="batch-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="genetics-error"]')).toBeVisible();

    // Fill partial data
    await page.selectOption('[data-testid="batch-select"]', "B-001");

    // Submit again
    await page.click('[data-testid="submit-plant"]');

    // Verify remaining validation
    await expect(page.locator('[data-testid="batch-error"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="genetics-error"]')).toBeVisible();
  });

  test("should work across different device sizes", async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/plants");

    // Verify desktop layout
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="plants-grid"]')).toBeVisible();

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });

    // Verify responsive layout
    await expect(page.locator('[data-testid="sidebar"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify mobile layout
    await expect(page.locator('[data-testid="plants-grid"]')).toHaveCSS(
      "grid-template-columns",
      "1fr"
    );
    await expect(page.locator('[data-testid="bottom-tabs"]')).toBeVisible();
  });
});

// PWA-specific tests
test.describe("PWA Functionality", () => {
  test("should work offline", async ({ page, context }) => {
    // Setup service worker
    await page.goto("/plants");
    await page.waitForLoadState("networkidle");

    // Go offline
    await context.setOffline(true);

    // Navigate to cached page
    await page.goto("/plants");

    // Verify offline functionality
    await expect(
      page.locator('[data-testid="offline-indicator"]')
    ).toBeVisible();
    await expect(page.locator('[data-testid="plants-list"]')).toBeVisible();

    // Try to create plant offline
    await page.click('[data-testid="create-plant-button"]');
    await page.fill(
      '[data-testid="plant-form"] input[name="strain"]',
      "Offline Test"
    );
    await page.click('[data-testid="submit-plant"]');

    // Verify queued for sync
    await expect(
      page.locator('[data-testid="sync-queue-indicator"]')
    ).toBeVisible();
  });

  test("should install as PWA", async ({ page }) => {
    // Check PWA manifest
    const manifest = await page.evaluate(() => {
      const link = document.querySelector('link[rel="manifest"]');
      return link ? link.getAttribute("href") : null;
    });
    expect(manifest).toBe("/manifest.json");

    // Check service worker registration
    const swRegistered = await page.evaluate(() => {
      return "serviceWorker" in navigator;
    });
    expect(swRegistered).toBe(true);
  });
});
```

---

Этот документ о стандартах кодирования обеспечивает consistent quality code base для GACP-ERP системы с акцентом на AI-assisted разработку, type safety, и comprehensive testing.
