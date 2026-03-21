import { type FinancialController as FinancialControllerType } from './financial.controller';

const { FinancialController } = require('./financial.controller') as {
  FinancialController: new (...args: unknown[]) => FinancialControllerType;
};

const mockAccountRepo = {
  findMany: jest.fn().mockResolvedValue({ data: [], page: 1, limit: 10, total: 0, totalPages: 0 }),
  findByIdOrThrow: jest.fn().mockResolvedValue({ id: 'acc-1' }),
};

const mockJeRepo = {
  findByIdOrThrow: jest.fn().mockResolvedValue({ id: 'je-1' }),
  post: jest.fn().mockResolvedValue({ id: 'je-1', status: 'POSTED' }),
};

const mockBaRepo = {
  findLatestByBatchId: jest.fn().mockResolvedValue({ id: 'ba-1' }),
};

const mockCreateJeUseCase = {
  execute: jest.fn().mockResolvedValue({ id: 'je-1' }),
};

const mockBaValuationUseCase = {
  execute: jest.fn().mockResolvedValue({ id: 'ba-1' }),
};

describe('FinancialController', () => {
  let ctrl: FinancialControllerType;

  beforeEach(() => {
    jest.clearAllMocks();
    ctrl = new FinancialController(
      mockAccountRepo as never,
      mockJeRepo as never,
      mockBaRepo as never,
      mockCreateJeUseCase as never,
      mockBaValuationUseCase as never,
    );
  });

  describe('listAccounts', () => {
    it('should pass parsed query to repo', () => {
      ctrl.listAccounts({ page: '1', limit: '10' });
      expect(mockAccountRepo.findMany).toHaveBeenCalledWith(
        {},
        expect.objectContaining({ page: 1, limit: 10 }),
      );
    });

    it('should pass filters', () => {
      ctrl.listAccounts({ page: '1', limit: '10', account_type: 'ASSET', is_active: 'true' });
      expect(mockAccountRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ account_type: 'ASSET', is_active: true }),
        expect.objectContaining({ page: 1 }),
      );
    });
  });

  describe('getAccount', () => {
    it('should delegate to repo', () => {
      ctrl.getAccount('acc-1');
      expect(mockAccountRepo.findByIdOrThrow).toHaveBeenCalledWith('acc-1');
    });
  });

  describe('createJournalEntry', () => {
    it('should delegate to use case', () => {
      ctrl.createJournalEntry(
        { description: 'Test', entry_date: '2026-01-01', lines: [] } as never,
        'user-1',
      );
      expect(mockCreateJeUseCase.execute).toHaveBeenCalled();
    });

    it('should default userId to system', () => {
      ctrl.createJournalEntry(
        { description: 'Test', entry_date: '2026-01-01', lines: [] } as never,
        undefined as never,
      );
      expect(mockCreateJeUseCase.execute).toHaveBeenCalledWith(expect.anything(), 'system');
    });
  });

  describe('getJournalEntry', () => {
    it('should delegate to repo', () => {
      ctrl.getJournalEntry('je-1');
      expect(mockJeRepo.findByIdOrThrow).toHaveBeenCalledWith('je-1');
    });
  });

  describe('postJournalEntry', () => {
    it('should delegate to repo.post', () => {
      const sig = {
        signed_by: '00000000-0000-0000-0000-000000000001',
        signer_name: 'User',
        signer_role: 'Admin',
        signature_type: 'ELECTRONIC' as const,
        authentication_method: 'PASSWORD' as const,
        digital_signature: 'abc',
        content_hash: 'hash',
        ip_address: '127.0.0.1',
        workstation_id: 'WS-1',
        signature_meaning: 'I approve',
        signed_at: '2026-01-01T00:00:00.000Z',
      };
      ctrl.postJournalEntry('je-1', { electronic_signature: sig }, 'user-1');
      expect(mockJeRepo.post).toHaveBeenCalled();
    });
  });

  describe('recordValuation', () => {
    it('should delegate to use case', () => {
      ctrl.recordValuation({} as never, 'user-1');
      expect(mockBaValuationUseCase.execute).toHaveBeenCalled();
    });

    it('should default userId to system', () => {
      ctrl.recordValuation({} as never, undefined as never);
      expect(mockBaValuationUseCase.execute).toHaveBeenCalledWith(expect.anything(), 'system');
    });
  });

  describe('getLatestValuation', () => {
    it('should delegate to repo', () => {
      ctrl.getLatestValuation('batch-1');
      expect(mockBaRepo.findLatestByBatchId).toHaveBeenCalledWith('batch-1');
    });
  });
});
