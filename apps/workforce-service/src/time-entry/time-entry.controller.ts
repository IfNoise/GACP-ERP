import { Controller } from '@nestjs/common';
import { TsRest, TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { workforceContract } from '@gacp-erp/shared-contracts';
import { TimeEntryRepository } from './time-entry.repository';
import { ClockInUseCase } from './use-cases/clock-in.use-case';

@TsRest({ validateResponses: false })
@Controller()
export class TimeEntryController {
  constructor(
    private readonly timeEntryRepo: TimeEntryRepository,
    private readonly clockInUseCase: ClockInUseCase,
  ) {}

  @TsRestHandler(workforceContract.createTimeEntry)
  createTimeEntry() {
    return tsRestHandler(workforceContract.createTimeEntry, async ({ body, headers }) => {
      const userId = (headers as Record<string, string | undefined>)['x-user-id'] ?? 'system';
      const result = await this.clockInUseCase.execute(body, userId);
      return { status: 201 as const, body: result };
    });
  }

  @TsRestHandler(workforceContract.listTimeEntries)
  listTimeEntries() {
    return tsRestHandler(workforceContract.listTimeEntries, async ({ query }) => {
      const filters: { employee_id?: string; task_id?: string } = {};
      if (query.employee_id !== undefined) filters.employee_id = query.employee_id;
      if (query.task_id !== undefined) filters.task_id = query.task_id;
      const result = await this.timeEntryRepo.findMany(filters, {
        page: query.page,
        limit: query.limit,
      });
      return { status: 200 as const, body: result };
    });
  }

  @TsRestHandler(workforceContract.clockOut)
  clockOut() {
    return tsRestHandler(workforceContract.clockOut, async ({ params, headers }) => {
      const userId = (headers as Record<string, string | undefined>)['x-user-id'] ?? 'system';
      const result = await this.timeEntryRepo.clockOut(params.id, userId);
      return { status: 200 as const, body: result };
    });
  }
}
