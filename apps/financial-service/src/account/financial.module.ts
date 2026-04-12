import { Module } from '@nestjs/common';
import { AccountRepository } from './account.repository';
import { JournalEntryRepository } from '../journal/journal-entry.repository';
import { BiologicalAssetRepository } from '../journal/biological-asset.repository';
import { CreateJournalEntryUseCase } from '../journal/use-cases/create-journal-entry.use-case';
import { BiologicalAssetValuationUseCase } from '../journal/use-cases/biological-asset-valuation.use-case';
import { FinancialController } from './financial.controller';
import { BatchIntakeConsumer } from '../batch-intake.consumer';
import { OutboxModule } from '../outbox/outbox.module';

@Module({
  imports: [OutboxModule],
  controllers: [FinancialController, BatchIntakeConsumer],
  providers: [
    AccountRepository,
    JournalEntryRepository,
    BiologicalAssetRepository,
    CreateJournalEntryUseCase,
    BiologicalAssetValuationUseCase,
  ],
  exports: [AccountRepository, JournalEntryRepository, BiologicalAssetRepository],
})
export class FinancialModule {}
