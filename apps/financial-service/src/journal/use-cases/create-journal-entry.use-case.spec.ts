import { BadRequestException } from '@nestjs/common';
import { CreateJournalEntryUseCase } from './create-journal-entry.use-case';
import type { JournalEntry, UserId } from '@gacp-erp/shared-schemas';

// ─── FACTORIES ────────────────────────────────────────────────────────────────

const AUTHOR_ID = '00000000-0000-0000-0000-000000000099';
const JE_ID = '00000000-0000-0000-0000-000000000001';

const makeEntry = (overrides: Partial<JournalEntry> = {}): JournalEntry => ({
  id: JE_ID,
  entry_number: 'JE-2026-000001',
  description: 'Test journal entry',
  entry_date: '2026-01-15',
  status: 'POSTED',
  lines: [
    {
      id: 'l1',
      entry_id: JE_ID,
      account_id: 'acc1',
      account_code: '1000',
      description: 'Debit line',
      debit_amount: 1000,
      credit_amount: 0,
      batch_id: null,
    },
    {
      id: 'l2',
      entry_id: JE_ID,
      account_id: 'acc2',
      account_code: '2000',
      description: 'Credit line',
      debit_amount: 0,
      credit_amount: 1000,
      batch_id: null,
    },
  ],
  reversal_of_id: null,
  electronic_signature: null,
  created_at: '2026-01-15T00:00:00.000Z',
  updated_at: '2026-01-15T00:00:00.000Z',
  created_by: AUTHOR_ID as UserId,
  updated_by: AUTHOR_ID as UserId,
  ...overrides,
});

// ─── MOCKS ────────────────────────────────────────────────────────────────────

const mockRepo = {
  nextEntryNumber: jest.fn().mockResolvedValue('JE-2026-000001'),
  create: jest.fn().mockResolvedValue(makeEntry()),
};

const mockOutboxRepo = {
  createWithTx: jest.fn().mockResolvedValue(undefined),
};

const mockDb = {
  transaction: jest.fn().mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn({})),
};

// ─── TESTS ────────────────────────────────────────────────────────────────────

describe('CreateJournalEntryUseCase', () => {
  let useCase: CreateJournalEntryUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepo.nextEntryNumber.mockResolvedValue('JE-2026-000001');
    mockRepo.create.mockResolvedValue(makeEntry());
    mockOutboxRepo.createWithTx.mockResolvedValue(undefined);
    mockDb.transaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn({}));

    useCase = new CreateJournalEntryUseCase(
      mockDb as never,
      mockRepo as never,
      mockOutboxRepo as never,
    );
  });

  it('should create a posted journal entry for a balanced entry', async () => {
    const dto = {
      description: 'Test journal entry',
      entry_date: '2026-01-15',
      lines: [
        {
          account_id: 'acc1',
          account_code: '1000',
          description: 'Debit acc',
          debit_amount: 1000,
          credit_amount: 0,
        },
        {
          account_id: 'acc2',
          account_code: '2000',
          description: 'Credit acc',
          debit_amount: 0,
          credit_amount: 1000,
        },
      ],
    };

    const result = await useCase.execute(dto, AUTHOR_ID);
    expect(result.status).toBe('POSTED');
    expect(result.entry_number).toBe('JE-2026-000001');
  });

  it('should throw BadRequestException when debits ≠ credits', async () => {
    const dto = {
      description: 'Unbalanced entry',
      entry_date: '2026-01-15',
      lines: [
        {
          account_id: 'acc1',
          account_code: '1000',
          description: 'Debit',
          debit_amount: 1000,
          credit_amount: 0,
        },
        {
          account_id: 'acc2',
          account_code: '2000',
          description: 'Credit',
          debit_amount: 0,
          credit_amount: 500,
        }, // imbalance!
      ],
    };

    await expect(useCase.execute(dto, AUTHOR_ID)).rejects.toThrow(BadRequestException);
    await expect(useCase.execute(dto, AUTHOR_ID)).rejects.toThrow(/unbalanced/i);
  });

  it('should call nextEntryNumber to generate JE number', async () => {
    const dto = {
      description: 'Entry',
      entry_date: '2026-01-15',
      lines: [
        {
          account_id: 'acc1',
          account_code: '1000',
          description: 'D',
          debit_amount: 500,
          credit_amount: 0,
        },
        {
          account_id: 'acc2',
          account_code: '2000',
          description: 'C',
          debit_amount: 0,
          credit_amount: 500,
        },
      ],
    };
    await useCase.execute(dto, AUTHOR_ID);
    expect(mockRepo.nextEntryNumber).toHaveBeenCalledTimes(1);
  });

  it('should publish outbox event after creation', async () => {
    const dto = {
      description: 'Entry',
      entry_date: '2026-01-15',
      lines: [
        {
          account_id: 'acc1',
          account_code: '1000',
          description: 'D',
          debit_amount: 200,
          credit_amount: 0,
        },
        {
          account_id: 'acc2',
          account_code: '2000',
          description: 'C',
          debit_amount: 0,
          credit_amount: 200,
        },
      ],
    };
    await useCase.execute(dto, AUTHOR_ID);

    expect(mockOutboxRepo.createWithTx).toHaveBeenCalledTimes(1);
    const [, eventArg] = mockOutboxRepo.createWithTx.mock.calls[0];
    expect(eventArg.topic).toBe('finance.transaction.v1');
    expect(eventArg.payload).toMatchObject({
      eventType: 'finance.journal_entry.posted',
    });
  });

  it('should accept a multi-line balanced entry', async () => {
    const dto = {
      description: 'Multi-line entry',
      entry_date: '2026-01-15',
      lines: [
        {
          account_id: 'acc1',
          account_code: '1000',
          description: 'D1',
          debit_amount: 300,
          credit_amount: 0,
        },
        {
          account_id: 'acc2',
          account_code: '2000',
          description: 'D2',
          debit_amount: 200,
          credit_amount: 0,
        },
        {
          account_id: 'acc3',
          account_code: '3000',
          description: 'C1',
          debit_amount: 0,
          credit_amount: 500,
        },
      ],
    };

    await expect(useCase.execute(dto, AUTHOR_ID)).resolves.toBeDefined();
  });

  it('should run inside a transaction', async () => {
    const dto = {
      description: 'Entry',
      entry_date: '2026-01-15',
      lines: [
        {
          account_id: 'acc1',
          account_code: '1000',
          description: 'D',
          debit_amount: 100,
          credit_amount: 0,
        },
        {
          account_id: 'acc2',
          account_code: '2000',
          description: 'C',
          debit_amount: 0,
          credit_amount: 100,
        },
      ],
    };
    await useCase.execute(dto, AUTHOR_ID);
    expect(mockDb.transaction).toHaveBeenCalledTimes(1);
  });
});
