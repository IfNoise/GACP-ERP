import { Controller } from '@nestjs/common';
import { TsRest, TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { workforceContract } from '@gacp-erp/shared-contracts';
import { type TrainingRepository } from './training.repository';
import { type ScheduleTrainingUseCase } from './use-cases/schedule-training.use-case';
import { type CompleteTrainingUseCase } from './use-cases/complete-training.use-case';

@TsRest({ validateResponses: false })
@Controller()
export class TrainingController {
  constructor(
    private readonly trainingRepo: TrainingRepository,
    private readonly scheduleTrainingUseCase: ScheduleTrainingUseCase,
    private readonly completeTrainingUseCase: CompleteTrainingUseCase,
  ) {}

  // ─── COURSES ──────────────────────────────────────────────────────────────

  @TsRestHandler(workforceContract.createCourse)
  createCourse() {
    return tsRestHandler(workforceContract.createCourse, async ({ body, headers }) => {
      const userId = (headers as Record<string, string | undefined>)['x-user-id'] ?? 'system';
      const result = await this.trainingRepo.createCourse(body, userId);
      return { status: 201 as const, body: result };
    });
  }

  @TsRestHandler(workforceContract.listCourses)
  listCourses() {
    return tsRestHandler(workforceContract.listCourses, async ({ query }) => {
      const result = await this.trainingRepo.findManyCourses({
        page: query.page,
        limit: query.limit,
      });
      return { status: 200 as const, body: result };
    });
  }

  @TsRestHandler(workforceContract.getCourse)
  getCourse() {
    return tsRestHandler(workforceContract.getCourse, async ({ params }) => {
      const result = await this.trainingRepo.findCourseByIdOrThrow(params.id);
      return { status: 200 as const, body: result };
    });
  }

  // ─── TRAINING EXECUTIONS ──────────────────────────────────────────────────

  @TsRestHandler(workforceContract.scheduleTraining)
  scheduleTraining() {
    return tsRestHandler(workforceContract.scheduleTraining, async ({ body, headers }) => {
      const userId = (headers as Record<string, string | undefined>)['x-user-id'] ?? 'system';
      const result = await this.scheduleTrainingUseCase.execute(body, userId);
      return { status: 201 as const, body: result };
    });
  }

  @TsRestHandler(workforceContract.listTrainingExecutions)
  listTrainingExecutions() {
    return tsRestHandler(workforceContract.listTrainingExecutions, async ({ query }) => {
      const filters: { trainee_id?: string; course_id?: string } = {};
      if (query.employee_id !== undefined) filters.trainee_id = query.employee_id;
      if (query.course_id !== undefined) filters.course_id = query.course_id;
      const result = await this.trainingRepo.findManyExecutions(filters, {
        page: query.page,
        limit: query.limit,
      });
      return { status: 200 as const, body: result };
    });
  }

  @TsRestHandler(workforceContract.completeTraining)
  completeTraining() {
    return tsRestHandler(workforceContract.completeTraining, async ({ params, body, headers }) => {
      const userId = (headers as Record<string, string | undefined>)['x-user-id'] ?? 'system';
      const result = await this.completeTrainingUseCase.execute(params.id, body, userId);
      return { status: 200 as const, body: result };
    });
  }

  // ─── CERTIFICATIONS ───────────────────────────────────────────────────────

  @TsRestHandler(workforceContract.listCertifications)
  listCertifications() {
    return tsRestHandler(workforceContract.listCertifications, async ({ query }) => {
      const filters: { employee_id?: string } = {};
      if (query.employee_id !== undefined) filters.employee_id = query.employee_id;
      const result = await this.trainingRepo.findManyCertifications(filters, {
        page: query.page,
        limit: query.limit,
      });
      return { status: 200 as const, body: result };
    });
  }
}
