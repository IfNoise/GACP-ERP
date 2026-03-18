import { Module } from '@nestjs/common';
import { SupplierRepository } from './supplier.repository';
import { ProcurementRepository } from './procurement.repository';
import { CreateSupplierUseCase } from './use-cases/create-supplier.use-case';
import { ProcurementWorkflowUseCase } from './use-cases/procurement-workflow.use-case';
import { ProcurementController } from './procurement.controller';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
  imports: [OutboxModule],
  controllers: [ProcurementController],
  providers: [
    SupplierRepository,
    ProcurementRepository,
    CreateSupplierUseCase,
    ProcurementWorkflowUseCase,
  ],
  exports: [SupplierRepository, ProcurementRepository],
})
export class ProcurementModule {}
