import { z } from 'zod';

import { BaseEntitySchema, ElectronicSignatureSchema } from '../common/base-entity.schema';

// ─── TRAINING TYPES ───────────────────────────────────────────────────────────
export const TrainingTypeEnum = z.enum(['INITIAL', 'REFRESHER', 'ANNUAL_RECERTIFICATION']);
export type TrainingType = z.infer<typeof TrainingTypeEnum>;

// ─── TRAINING STATUS ──────────────────────────────────────────────────────────
export const TrainingStatusEnum = z.enum([
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'FAILED',
  'EXPIRED',
]);
export type TrainingStatus = z.infer<typeof TrainingStatusEnum>;

// ─── COURSE ───────────────────────────────────────────────────────────────────
/**
 * Training course definition.
 * course_id format: CUR-NNN (e.g. CUR-001 … CUR-015)
 * Per EU GMP Annex 11 §2 — personnel qualification records.
 */
export const CourseSchema = BaseEntitySchema.extend({
  /** Curriculum identifier: CUR-NNN */
  course_id: z.string().regex(/^CUR-\d{3}$/, {
    message: 'course_id must match CUR-NNN',
  }),
  title: z.string().min(3).max(500),
  type: TrainingTypeEnum,
  duration_hours: z.number().positive(),
  passing_score: z.number().min(0).max(100),
  /** Roles required to complete this course */
  applicable_roles: z.array(z.string().min(1)),
  /** SOPs covered by this course */
  sop_references: z.array(z.string().max(50)),
  is_active: z.boolean().default(true),
});
export type Course = z.infer<typeof CourseSchema>;

export const CreateCourseSchema = CourseSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
});
export type CreateCourse = z.infer<typeof CreateCourseSchema>;

// ─── TRAINING EXECUTION ───────────────────────────────────────────────────────
/**
 * Record of a specific training session for a trainee.
 * Immutable once COMPLETED/FAILED (21 CFR Part 11).
 * Electronic signature required for COMPLETED status.
 */
export const TrainingExecutionSchema = BaseEntitySchema.extend({
  course_id: z.string().uuid(),
  /** FK → employees.id */
  trainee_id: z.string().uuid(),
  /** FK → employees.id */
  trainer_id: z.string().uuid().nullable(),
  status: TrainingStatusEnum,
  score: z.number().min(0).max(100).nullable(),
  completed_at: z.string().datetime({ offset: true }).nullable(),
  /** E-signature of the trainer/assessor confirming completion */
  electronic_signature: ElectronicSignatureSchema.nullable(),
});
export type TrainingExecution = z.infer<typeof TrainingExecutionSchema>;

export const CreateTrainingExecutionSchema = z.object({
  course_id: z.string().uuid(),
  trainee_id: z.string().uuid(),
  trainer_id: z.string().uuid().optional(),
});
export type CreateTrainingExecution = z.infer<typeof CreateTrainingExecutionSchema>;

export const CompleteTrainingExecutionSchema = z.object({
  score: z.number().min(0).max(100),
  electronic_signature: ElectronicSignatureSchema,
});
export type CompleteTrainingExecution = z.infer<typeof CompleteTrainingExecutionSchema>;

// ─── CERTIFICATION ────────────────────────────────────────────────────────────
/**
 * Issued certification record after successful training completion.
 * certificate_number: CERT-YYYY-NNNNNN
 * Per 21 CFR Part 11 — requires electronic signature.
 */
export const CertificationSchema = BaseEntitySchema.extend({
  /** FK → employees.id */
  employee_id: z.string().uuid(),
  /** FK → training_courses.id */
  course_id: z.string().uuid(),
  issued_at: z.string().datetime({ offset: true }),
  valid_until: z.string().datetime({ offset: true }),
  certificate_number: z.string().regex(/^CERT-\d{4}-\d{6}$/, {
    message: 'certificate_number must match CERT-YYYY-NNNNNN',
  }),
  electronic_signature: ElectronicSignatureSchema,
});
export type Certification = z.infer<typeof CertificationSchema>;

// ─── COMPETENCY PROFILE ───────────────────────────────────────────────────────
/**
 * Defines required training courses and minimum passing scores for a position.
 * Links employee qualification to SOP compliance.
 */
export const CompetencyProfileSchema = BaseEntitySchema.extend({
  position: z.string().min(2).max(255),
  /** Array of course UUIDs required for this position */
  required_courses: z.array(z.string().uuid()),
  /** Map of courseId → minimum passing score */
  minimum_scores: z.record(z.string().uuid(), z.number().min(0).max(100)),
});
export type CompetencyProfile = z.infer<typeof CompetencyProfileSchema>;

export const CreateCompetencyProfileSchema = CompetencyProfileSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
});
export type CreateCompetencyProfile = z.infer<typeof CreateCompetencyProfileSchema>;
