import { Module } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { BatchesRepository } from './batches.repository';

@Module({
  providers: [BatchesService, BatchesRepository],
  exports: [BatchesService],
})
export class BatchesModule {}
