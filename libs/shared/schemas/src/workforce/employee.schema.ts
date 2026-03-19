import { z } from 'zod';

import { BaseEntitySchema } from '../common/base-entity.schema';
import { UserIdSchema } from '../common/branded-ids';

// ─── TASK PRIORITY ────────────────────────────────────────────────────────────
export const TaskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);
export type TaskPriority = z.infer<typeof TaskPriorityEnum>;

// ─── TASK STATUS ──────────────────────────────────────────────────────────────
export const TaskStatusEnum = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE']);
export type TaskStatus = z.infer<typeof TaskStatusEnum>;

// ─── TIME ENTRY SOURCE ────────────────────────────────────────────────────────
export const TimeEntrySourceEnum = z.enum(['TERMINAL', 'WEB', 'API']);
export type TimeEntrySource = z.infer<typeof TimeEntrySourceEnum>;

// ─── EMPLOYEE ─────────────────────────────────────────────────────────────────
/**
 * Employee profile. Links to Keycloak `user_id` for authentication.
 * Per EU GMP Annex 11 §2 — personnel qualification.
 */
export const EmployeeSchema = BaseEntitySchema.extend({
  /** Internal employee number, format: EMP-NNNNNN */
  employee_number: z.string().regex(/^EMP-\d{6}$/, {
    message: 'employee_number must match EMP-NNNNNN',
  }),
  /** FK → Keycloak user / users table */
  user_id: UserIdSchema,
  position: z.string().min(2).max(255),
  department: z.string().min(2).max(100),
  /** ISO 8601 date string */
  hire_date: z.string().date(),
  /** FK → competency_profiles.id */
  competency_profile_id: z.string().uuid().nullable(),
  is_active: z.boolean().default(true),
});
export type Employee = z.infer<typeof EmployeeSchema>;

// ─── CREATE EMPLOYEE ──────────────────────────────────────────────────────────
export const CreateEmployeeSchema = EmployeeSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
});
export type CreateEmployee = z.infer<typeof CreateEmployeeSchema>;

// ─── TASK ─────────────────────────────────────────────────────────────────────
/**
 * Operational task assigned to an employee.
 * May reference a zone (spatial) and/or a batch (plant lifecycle).
 * `sop_reference` links to the governing SOP (GACP traceability).
 */
export const TaskSchema = BaseEntitySchema.extend({
  /** Format: TASK-YYYYNNNNN */
  task_number: z.string().regex(/^TASK-\d{4}\d{5}$/, {
    message: 'task_number must match TASK-YYYYNNNNN',
  }),
  title: z.string().min(3).max(500),
  description: z.string().max(2000).nullable(),
  assigned_to: UserIdSchema,
  zone_id: z.string().uuid().nullable(),
  batch_id: z.string().uuid().nullable(),
  priority: TaskPriorityEnum,
  status: TaskStatusEnum,
  scheduled_start: z.string().datetime({ offset: true }).nullable(),
  scheduled_end: z.string().datetime({ offset: true }).nullable(),
  completed_at: z.string().datetime({ offset: true }).nullable(),
  /** SOP number governing this task */
  sop_reference: z.string().max(50).nullable(),
});
export type Task = z.infer<typeof TaskSchema>;

export const CreateTaskSchema = TaskSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
  task_number: true,
  status: true,
  completed_at: true,
});
export type CreateTask = z.infer<typeof CreateTaskSchema>;

// ─── MOBILE TASK (minimal payload for Android terminals) ──────────────────────
export const MobileTaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  zone_id: z.string().uuid().nullable(),
  priority: TaskPriorityEnum,
  scheduled_start: z.string().datetime({ offset: true }).nullable(),
});
export type MobileTask = z.infer<typeof MobileTaskSchema>;

// ─── TIME ENTRY ───────────────────────────────────────────────────────────────
/**
 * Labour time record. ALCOA+: Contemporaneous — must be recorded in real-time.
 */
export const TimeEntrySchema = BaseEntitySchema.extend({
  employee_id: z.string().uuid(),
  task_id: z.string().uuid().nullable(),
  clock_in_at: z.string().datetime({ offset: true }),
  clock_out_at: z.string().datetime({ offset: true }).nullable(),
  duration_minutes: z.number().int().nonnegative().nullable(),
  recorded_via: TimeEntrySourceEnum,
});
export type TimeEntry = z.infer<typeof TimeEntrySchema>;

export const CreateTimeEntrySchema = TimeEntrySchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
  duration_minutes: true,
});
export type CreateTimeEntry = z.infer<typeof CreateTimeEntrySchema>;

// ─── QUERY FILTERS ───────────────────────────────────────────────────────────

export const EmployeeFiltersSchema = z.object({
  department: z.string().optional(),
  is_active: z.boolean().optional(),
});
export type EmployeeFilters = z.infer<typeof EmployeeFiltersSchema>;

export const TaskFiltersSchema = z.object({
  status: z.string().optional(),
  zone_id: z.string().uuid().optional(),
});
export type TaskFilters = z.infer<typeof TaskFiltersSchema>;

export const TimeEntryFiltersSchema = z.object({
  employee_id: z.string().uuid().optional(),
  task_id: z.string().uuid().optional(),
});
export type TimeEntryFilters = z.infer<typeof TimeEntryFiltersSchema>;
