import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  CreateBatchSchema,
  UpdateBatchSchema,
  CloneBatchSchema,
  BatchStatusEnum,
  type CreateBatch,
  type UpdateBatch,
  type CloneBatch,
} from '@gacp-erp/shared-schemas';
import { z } from 'zod';
import { BatchesService } from './batches.service';
import { ZodBody } from '../common/decorators/zod-body.decorator';

const ListBatchesQuerySchema = z.object({
  facility_id: z.string().uuid().optional(),
  status: BatchStatusEnum.optional(),
});

@Controller({ path: 'batches', version: '1' })
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  /** GET /api/v1/batches */
  @Get()
  list(@Query() rawQuery: unknown) {
    const { facility_id } = ListBatchesQuerySchema.parse(rawQuery);
    return this.batchesService.list(facility_id);
  }

  /** GET /api/v1/batches/:id */
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.batchesService.getById(id);
  }

  /** POST /api/v1/batches */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@ZodBody(CreateBatchSchema) dto: CreateBatch, @Headers('x-user-id') userId: string) {
    return this.batchesService.create(dto, userId ?? 'system');
  }

  /** PATCH /api/v1/batches/:id */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @ZodBody(UpdateBatchSchema) dto: UpdateBatch,
    @Headers('x-user-id') userId: string,
  ) {
    return this.batchesService.update(id, dto, userId ?? 'system');
  }

  /** POST /api/v1/batches/:id/status */
  @Post(':id/status')
  updateStatus(
    @Param('id') id: string,
    @ZodBody(z.object({ status: BatchStatusEnum }))
    body: { status: z.infer<typeof BatchStatusEnum> },
    @Headers('x-user-id') userId: string,
  ) {
    return this.batchesService.updateStatus(id, body.status, userId ?? 'system');
  }

  /** POST /api/v1/batches/clone — Create a new batch from mother plant cuttings */
  @Post('clone')
  @HttpCode(HttpStatus.CREATED)
  clone(@ZodBody(CloneBatchSchema) dto: CloneBatch, @Headers('x-user-id') userId: string) {
    return this.batchesService.cloneBatch(dto, userId ?? 'system');
  }
}
