import { Controller } from '@nestjs/common';
import { TsRest, TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { workforceContract } from '@gacp-erp/shared-contracts';
import { type TaskRepository } from './task.repository';
import { type CreateTaskUseCase } from './use-cases/create-task.use-case';
import { type CompleteTaskUseCase } from './use-cases/complete-task.use-case';

@TsRest({ validateResponses: false })
@Controller()
export class TaskController {
  constructor(
    private readonly taskRepo: TaskRepository,
    private readonly createTaskUseCase: CreateTaskUseCase,
    private readonly completeTaskUseCase: CompleteTaskUseCase,
  ) {}

  @TsRestHandler(workforceContract.createTask)
  createTask() {
    return tsRestHandler(workforceContract.createTask, async ({ body, headers }) => {
      const userId = (headers as Record<string, string | undefined>)['x-user-id'] ?? 'system';
      const result = await this.createTaskUseCase.execute(body, userId);
      return { status: 201 as const, body: result };
    });
  }

  @TsRestHandler(workforceContract.listTasks)
  listTasks() {
    return tsRestHandler(workforceContract.listTasks, async ({ query }) => {
      const filters: { status?: string; zone_id?: string } = {};
      if (query.status !== undefined) filters.status = query.status;
      if (query.zone_id !== undefined) filters.zone_id = query.zone_id;
      const result = await this.taskRepo.findMany(filters, {
        page: query.page,
        limit: query.limit,
      });
      return { status: 200 as const, body: result };
    });
  }

  @TsRestHandler(workforceContract.getTask)
  getTask() {
    return tsRestHandler(workforceContract.getTask, async ({ params }) => {
      const result = await this.taskRepo.findByIdOrThrow(params.id);
      return { status: 200 as const, body: result };
    });
  }

  @TsRestHandler(workforceContract.getMobileTask)
  getMobileTask() {
    return tsRestHandler(workforceContract.getMobileTask, async ({ params }) => {
      const result = await this.taskRepo.findByIdOrThrow(params.id);
      return { status: 200 as const, body: result };
    });
  }

  @TsRestHandler(workforceContract.completeTask)
  completeTask() {
    return tsRestHandler(workforceContract.completeTask, async ({ params, headers }) => {
      const userId = (headers as Record<string, string | undefined>)['x-user-id'] ?? 'system';
      const result = await this.completeTaskUseCase.execute(params.id, userId);
      return { status: 200 as const, body: result };
    });
  }
}
