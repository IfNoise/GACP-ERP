import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import {
  ApiErrorSchema,
  PaginationQuerySchema,
  EmployeeSchema,
  CreateEmployeeSchema,
  EmployeeProvisionedResponseSchema,
  TaskSchema,
  CreateTaskSchema,
  MobileTaskSchema,
  TimeEntrySchema,
  CreateTimeEntrySchema,
  CourseSchema,
  CreateCourseSchema,
  TrainingExecutionSchema,
  CreateTrainingExecutionSchema,
  CompleteTrainingExecutionSchema,
  CertificationSchema,
  CompetencyProfileSchema,
} from '@gacp-erp/shared-schemas';

const c = initContract();

function paginatedList<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
  });
}

/**
 * Workforce Management API contract (EPIC 9).
 *
 * Covers Employees, Tasks (including mobile-optimized), Time Entries,
 * Training Courses, Training Executions, Certifications, and Competency Profiles.
 */
export const workforceContract = c.router({
  // ── Employees ─────────────────────────────────────────────────────────────

  createEmployee: {
    method: 'POST',
    path: '/workforce/employees',
    body: CreateEmployeeSchema,
    responses: {
      201: EmployeeProvisionedResponseSchema,
      400: ApiErrorSchema,
      409: ApiErrorSchema,
      500: ApiErrorSchema,
    },
    summary: 'Provision a new employee with Keycloak user account',
  },

  listEmployees: {
    method: 'GET',
    path: '/workforce/employees',
    query: PaginationQuerySchema.extend({
      department: z.string().optional(),
      is_active: z
        .string()
        .transform((v) => v === 'true')
        .optional(),
      role: z.string().optional(),
    }),
    responses: {
      200: paginatedList(EmployeeSchema),
    },
    summary: 'List employees with optional filters',
  },

  getEmployee: {
    method: 'GET',
    path: '/workforce/employees/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: EmployeeSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get employee by ID',
  },

  deactivateEmployee: {
    method: 'POST',
    path: '/workforce/employees/:id/deactivate',
    pathParams: z.object({ id: z.string().uuid() }),
    body: z.object({ reason: z.string().min(1).optional() }),
    responses: {
      200: EmployeeSchema,
      404: ApiErrorSchema,
    },
    summary: 'Deactivate an employee',
  },

  // ── Tasks ─────────────────────────────────────────────────────────────────

  createTask: {
    method: 'POST',
    path: '/workforce/tasks',
    body: CreateTaskSchema,
    responses: {
      201: TaskSchema,
      400: ApiErrorSchema,
    },
    summary: 'Create a work task',
  },

  listTasks: {
    method: 'GET',
    path: '/workforce/tasks',
    query: PaginationQuerySchema.extend({
      status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OVERDUE']).optional(),
      priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
      scheduled_date: z.string().date().optional(),
      zone_id: z.string().uuid().optional(),
      batch_id: z.string().uuid().optional(),
      assigned_to: z.string().uuid().optional(),
    }),
    responses: {
      200: paginatedList(TaskSchema),
    },
    summary: 'List tasks with filters',
  },

  getTask: {
    method: 'GET',
    path: '/workforce/tasks/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: TaskSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get task by ID',
  },

  getMobileTask: {
    method: 'GET',
    path: '/workforce/tasks/:id/mobile',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: MobileTaskSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get mobile-optimized task view',
  },

  completeTask: {
    method: 'POST',
    path: '/workforce/tasks/:id/complete',
    pathParams: z.object({ id: z.string().uuid() }),
    body: z.object({
      completion_notes: z.string().optional(),
      photo_urls: z.array(z.string().url()).optional(),
      electronic_signature: z
        .object({
          signed_by: z.string().uuid(),
          signer_name: z.string().min(1),
          signer_role: z.string().min(1),
          signature_type: z.literal('ELECTRONIC'),
          authentication_method: z.enum(['PASSWORD', 'MFA', 'BIOMETRIC', 'SMART_CARD']),
          digital_signature: z.string().min(1),
          content_hash: z.string().min(1),
          ip_address: z.string().ip(),
          workstation_id: z.string().min(1),
          signature_meaning: z.string().min(1),
          signed_at: z.string().datetime(),
        })
        .optional(),
    }),
    responses: {
      200: TaskSchema,
      400: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Mark a task as completed',
  },

  assignTask: {
    method: 'POST',
    path: '/workforce/tasks/:id/assign',
    pathParams: z.object({ id: z.string().uuid() }),
    body: z.object({
      employee_ids: z.array(z.string().uuid()).min(1),
      lead_employee_id: z.string().uuid().optional(),
    }),
    responses: {
      200: TaskSchema,
      400: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Assign employees to a task',
  },

  // ── Time Entries ──────────────────────────────────────────────────────────

  createTimeEntry: {
    method: 'POST',
    path: '/workforce/time-entries',
    body: CreateTimeEntrySchema,
    responses: {
      201: TimeEntrySchema,
      400: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Clock in / create a time entry',
  },

  clockOut: {
    method: 'POST',
    path: '/workforce/time-entries/:id/clock-out',
    pathParams: z.object({ id: z.string().uuid() }),
    body: z.object({ notes: z.string().optional() }),
    responses: {
      200: TimeEntrySchema,
      400: ApiErrorSchema,
      404: ApiErrorSchema,
    },
    summary: 'Clock out (close an open time entry)',
  },

  approveTimeEntry: {
    method: 'POST',
    path: '/workforce/time-entries/:id/approve',
    pathParams: z.object({ id: z.string().uuid() }),
    body: z.object({}),
    responses: {
      200: TimeEntrySchema,
      404: ApiErrorSchema,
    },
    summary: 'Approve a time entry',
  },

  listTimeEntries: {
    method: 'GET',
    path: '/workforce/time-entries',
    query: PaginationQuerySchema.extend({
      employee_id: z.string().uuid().optional(),
      task_id: z.string().uuid().optional(),
      from_date: z.string().date().optional(),
      to_date: z.string().date().optional(),
    }),
    responses: {
      200: paginatedList(TimeEntrySchema),
    },
    summary: 'List time entries',
  },

  // ── Training Courses ──────────────────────────────────────────────────────

  createCourse: {
    method: 'POST',
    path: '/workforce/training/courses',
    body: CreateCourseSchema,
    responses: {
      201: CourseSchema,
      400: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Create a training course',
  },

  listCourses: {
    method: 'GET',
    path: '/workforce/training/courses',
    query: PaginationQuerySchema.extend({
      training_type: z
        .enum(['INITIAL', 'REFRESHER', 'GMP', 'SAFETY', 'ROLE_SPECIFIC', 'COMPLIANCE', 'SOP'])
        .optional(),
      is_mandatory: z
        .string()
        .transform((v) => v === 'true')
        .optional(),
    }),
    responses: {
      200: paginatedList(CourseSchema),
    },
    summary: 'List training courses',
  },

  getCourse: {
    method: 'GET',
    path: '/workforce/training/courses/:id',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: CourseSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get training course by ID',
  },

  // ── Training Executions ───────────────────────────────────────────────────

  scheduleTraining: {
    method: 'POST',
    path: '/workforce/training/executions',
    body: CreateTrainingExecutionSchema,
    responses: {
      201: TrainingExecutionSchema,
      400: ApiErrorSchema,
    },
    summary: 'Schedule a training execution',
  },

  completeTraining: {
    method: 'POST',
    path: '/workforce/training/executions/:id/complete',
    pathParams: z.object({ id: z.string().uuid() }),
    body: CompleteTrainingExecutionSchema,
    responses: {
      200: TrainingExecutionSchema,
      400: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Record training completion with e-signature',
  },

  listTrainingExecutions: {
    method: 'GET',
    path: '/workforce/training/executions',
    query: PaginationQuerySchema.extend({
      employee_id: z.string().uuid().optional(),
      course_id: z.string().uuid().optional(),
      status: z
        .enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED'])
        .optional(),
    }),
    responses: {
      200: paginatedList(TrainingExecutionSchema),
    },
    summary: 'List training executions',
  },

  // ── Certifications ────────────────────────────────────────────────────────

  listCertifications: {
    method: 'GET',
    path: '/workforce/training/certifications',
    query: PaginationQuerySchema.extend({
      employee_id: z.string().uuid().optional(),
      course_id: z.string().uuid().optional(),
      is_active: z
        .string()
        .transform((v) => v === 'true')
        .optional(),
    }),
    responses: {
      200: paginatedList(CertificationSchema),
    },
    summary: 'List certifications',
  },

  // ── Competency Profiles ───────────────────────────────────────────────────

  getCompetencyProfile: {
    method: 'GET',
    path: '/workforce/employees/:id/competency',
    pathParams: z.object({ id: z.string().uuid() }),
    responses: {
      200: CompetencyProfileSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get competency profile for an employee',
  },
});
