import { z } from 'zod';
import { EventHeaderSchema } from './base.events';

// ─── KAFKA TOPICS ─────────────────────────────────────────────────────────────
export const TRAINING_EXECUTION_TOPIC = 'training.execution.v1' as const;
export const TRAINING_CERTIFICATION_TOPIC = 'training.certification.v1' as const;

// ─── PAYLOAD FRAGMENTS ────────────────────────────────────────────────────────

const CourseRefSchema = z.object({
  courseId: z.string().uuid(),
  courseCode: z.string().regex(/^CUR-\d{3}$/),
  title: z.string(),
  trainingType: z.enum([
    'INITIAL',
    'REFRESHER',
    'GMP',
    'SAFETY',
    'ROLE_SPECIFIC',
    'COMPLIANCE',
    'SOP',
  ]),
});

const ExecutionRefSchema = z.object({
  executionId: z.string().uuid(),
  employeeId: z.string().uuid(),
  courseId: z.string().uuid(),
});

// ════════════════════════════════════════════════════════════════════════════════
// TRAINING EXECUTION EVENTS — topic: training.execution.v1
// ════════════════════════════════════════════════════════════════════════════════

export const TrainingScheduledEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('training.execution.scheduled'),
  topic: z.literal(TRAINING_EXECUTION_TOPIC),
  payload: ExecutionRefSchema.extend({
    scheduledDate: z.string().date(),
    trainerId: z.string().uuid().nullable(),
    scheduledBy: z.string().uuid(),
  }),
});
export type TrainingScheduledEvent = z.infer<typeof TrainingScheduledEventSchema>;

export const TrainingCompletedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('training.execution.completed'),
  topic: z.literal(TRAINING_EXECUTION_TOPIC),
  payload: ExecutionRefSchema.extend({
    completedDate: z.string().date(),
    score: z.number().int().min(0).max(100),
    passed: z.boolean(),
    expiryDate: z.string().date().nullable(),
    hasSignature: z.boolean(),
    completedBy: z.string().uuid(),
  }),
});
export type TrainingCompletedEvent = z.infer<typeof TrainingCompletedEventSchema>;

export const TrainingOverdueEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('training.execution.overdue'),
  topic: z.literal(TRAINING_EXECUTION_TOPIC),
  payload: ExecutionRefSchema.extend({
    scheduledDate: z.string().date(),
    course: CourseRefSchema,
    isMandatory: z.boolean(),
  }),
});
export type TrainingOverdueEvent = z.infer<typeof TrainingOverdueEventSchema>;

// ════════════════════════════════════════════════════════════════════════════════
// CERTIFICATION EVENTS — topic: training.certification.v1
// ════════════════════════════════════════════════════════════════════════════════

export const CertificationIssuedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('training.certification.issued'),
  topic: z.literal(TRAINING_CERTIFICATION_TOPIC),
  payload: z.object({
    certificationId: z.string().uuid(),
    certificateNumber: z.string().regex(/^CERT-\d{4}-\d{6}$/),
    employeeId: z.string().uuid(),
    course: CourseRefSchema,
    issuedDate: z.string().date(),
    expiryDate: z.string().date().nullable(),
    issuedBy: z.string().uuid(),
  }),
});
export type CertificationIssuedEvent = z.infer<typeof CertificationIssuedEventSchema>;

export const CertificationExpiredEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('training.certification.expired'),
  topic: z.literal(TRAINING_CERTIFICATION_TOPIC),
  payload: z.object({
    certificationId: z.string().uuid(),
    certificateNumber: z.string(),
    employeeId: z.string().uuid(),
    courseId: z.string().uuid(),
    expiredDate: z.string().date(),
    isMandatory: z.boolean(),
  }),
});
export type CertificationExpiredEvent = z.infer<typeof CertificationExpiredEventSchema>;

export const CertificationRevokedEventSchema = EventHeaderSchema.extend({
  eventType: z.literal('training.certification.revoked'),
  topic: z.literal(TRAINING_CERTIFICATION_TOPIC),
  payload: z.object({
    certificationId: z.string().uuid(),
    certificateNumber: z.string(),
    employeeId: z.string().uuid(),
    revokedBy: z.string().uuid(),
    revokedAt: z.string().datetime({ offset: true }),
    reason: z.string(),
  }),
});
export type CertificationRevokedEvent = z.infer<typeof CertificationRevokedEventSchema>;
