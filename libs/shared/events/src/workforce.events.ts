import { z } from 'zod';
import { EventHeaderSchema } from './base.events';

// ─── KAFKA TOPICS ─────────────────────────────────────────────────────────────
export const WORKFORCE_EMPLOYEE_TOPIC = 'workforce.employee.v1' as const;
export const WORKFORCE_TASK_TOPIC = 'workforce.task.v1' as const;
export const WORKFORCE_TIME_TOPIC = 'workforce.time.v1' as const;

// ─── PAYLOAD FRAGMENTS ────────────────────────────────────────────────────────

const EmployeeRefSchema = z.object({
  employeeId: z.string().uuid(),
  employeeNumber: z.string().regex(/^EMP-\d{6}$/),
  fullName: z.string(),
  department: z.string(),
});

const TaskRefSchema = z.object({
  taskId: z.string().uuid(),
  taskNumber: z.string().regex(/^TASK-\d{4}\d{5}$/),
  title: z.string(),
});

// ════════════════════════════════════════════════════════════════════════════════
// EMPLOYEE EVENTS — topic: workforce.employee.v1
// ════════════════════════════════════════════════════════════════════════════════

export const EmployeeCreatedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('workforce.employee.created'),
  topic: z.literal(WORKFORCE_EMPLOYEE_TOPIC),
  payload: EmployeeRefSchema.extend({
    position: z.string(),
    hireDate: z.string().date(),
    createdBy: z.string(),
  }),
});
export type EmployeeCreatedEvent = z.infer<typeof EmployeeCreatedEventSchema>;

export const EmployeeDeactivatedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('workforce.employee.deactivated'),
  topic: z.literal(WORKFORCE_EMPLOYEE_TOPIC),
  payload: EmployeeRefSchema.extend({
    deactivatedBy: z.string().uuid(),
    deactivatedAt: z.string().datetime({ offset: true }),
    reason: z.string().optional(),
  }),
});
export type EmployeeDeactivatedEvent = z.infer<typeof EmployeeDeactivatedEventSchema>;

// ════════════════════════════════════════════════════════════════════════════════
// TASK EVENTS — topic: workforce.task.v1
// ════════════════════════════════════════════════════════════════════════════════

export const TaskCreatedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('workforce.task.created'),
  topic: z.literal(WORKFORCE_TASK_TOPIC),
  payload: TaskRefSchema.extend({
    taskType: z.string(),
    priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
    scheduledDate: z.string().date(),
    zoneId: z.string().uuid().nullable(),
    batchId: z.string().uuid().nullable(),
    createdBy: z.string().uuid(),
  }),
});
export type TaskCreatedEvent = z.infer<typeof TaskCreatedEventSchema>;

export const TaskCompletedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('workforce.task.completed'),
  topic: z.literal(WORKFORCE_TASK_TOPIC),
  payload: TaskRefSchema.extend({
    completedBy: z.string().uuid(),
    completedAt: z.string().datetime({ offset: true }),
    actualMinutes: z.number().int().nonnegative().nullable(),
    sopReference: z.string().nullable(),
    hasSignature: z.boolean(),
  }),
});
export type TaskCompletedEvent = z.infer<typeof TaskCompletedEventSchema>;

export const TaskOverdueEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('workforce.task.overdue'),
  topic: z.literal(WORKFORCE_TASK_TOPIC),
  payload: TaskRefSchema.extend({
    scheduledDate: z.string().date(),
    priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
    assigneeIds: z.array(z.string().uuid()),
  }),
});
export type TaskOverdueEvent = z.infer<typeof TaskOverdueEventSchema>;

// ════════════════════════════════════════════════════════════════════════════════
// TIME ENTRY EVENTS — topic: workforce.time.v1
// ════════════════════════════════════════════════════════════════════════════════

export const TimeEntryCreatedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('workforce.time_entry.created'),
  topic: z.literal(WORKFORCE_TIME_TOPIC),
  payload: z.object({
    timeEntryId: z.string().uuid(),
    employeeId: z.string().uuid(),
    taskId: z.string().uuid().nullable(),
    clockIn: z.string().datetime({ offset: true }),
    source: z.enum(['MANUAL', 'MOBILE', 'SYSTEM', 'BIOMETRIC']),
    createdBy: z.string().uuid(),
  }),
});
export type TimeEntryCreatedEvent = z.infer<typeof TimeEntryCreatedEventSchema>;

export const TimeEntryApprovedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('workforce.time_entry.approved'),
  topic: z.literal(WORKFORCE_TIME_TOPIC),
  payload: z.object({
    timeEntryId: z.string().uuid(),
    employeeId: z.string().uuid(),
    durationMinutes: z.number().int().nonnegative(),
    approvedBy: z.string().uuid(),
    approvedAt: z.string().datetime({ offset: true }),
  }),
});
export type TimeEntryApprovedEvent = z.infer<typeof TimeEntryApprovedEventSchema>;
