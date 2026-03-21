import { type ProcurementController as ProcurementControllerType } from './procurement.controller';

const { ProcurementController } = require('./procurement.controller') as {
  ProcurementController: new (...args: unknown[]) => ProcurementControllerType;
};

const mockSupplierRepo = {
  findMany: jest.fn().mockResolvedValue({ data: [], page: 1, limit: 10, total: 0, totalPages: 0 }),
  findByIdOrThrow: jest.fn().mockResolvedValue({ id: 'sup-1' }),
  update: jest.fn().mockResolvedValue({ id: 'sup-1' }),
};

const mockProcurementRepo = {
  findMany: jest.fn().mockResolvedValue({ data: [], page: 1, limit: 10, total: 0, totalPages: 0 }),
  findByIdOrThrow: jest.fn().mockResolvedValue({ id: 'po-1' }),
};

const mockCreateSupplierUseCase = {
  execute: jest.fn().mockResolvedValue({ id: 'sup-1' }),
};

const mockWorkflowUseCase = {
  createPO: jest.fn().mockResolvedValue({ id: 'po-1' }),
  submitPO: jest.fn().mockResolvedValue({ id: 'po-1' }),
  acknowledgePO: jest.fn().mockResolvedValue({ id: 'po-1' }),
  receiveGoods: jest.fn().mockResolvedValue({ id: 'po-1' }),
  closePO: jest.fn().mockResolvedValue({ id: 'po-1' }),
  cancelPO: jest.fn().mockResolvedValue({ id: 'po-1' }),
};

describe('ProcurementController', () => {
  let ctrl: ProcurementControllerType;

  beforeEach(() => {
    jest.clearAllMocks();
    ctrl = new ProcurementController(
      mockSupplierRepo as never,
      mockProcurementRepo as never,
      mockCreateSupplierUseCase as never,
      mockWorkflowUseCase as never,
    );
  });

  describe('createSupplier', () => {
    it('should delegate to use case', () => {
      ctrl.createSupplier({ name: 'Test' } as never, 'user-1');
      expect(mockCreateSupplierUseCase.execute).toHaveBeenCalled();
    });

    it('should default userId to system', () => {
      ctrl.createSupplier({ name: 'Test' } as never, undefined as never);
      expect(mockCreateSupplierUseCase.execute).toHaveBeenCalledWith(expect.anything(), 'system');
    });
  });

  describe('listSuppliers', () => {
    it('should pass parsed query to repo', () => {
      ctrl.listSuppliers({ page: '1', limit: '10' });
      expect(mockSupplierRepo.findMany).toHaveBeenCalledWith(
        {},
        expect.objectContaining({ page: 1, limit: 10 }),
      );
    });

    it('should pass filters', () => {
      ctrl.listSuppliers({
        page: '1',
        limit: '10',
        qualification_status: 'PROVISIONAL',
        is_active: 'true',
      });
      expect(mockSupplierRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ qualification_status: 'PROVISIONAL', is_active: true }),
        expect.objectContaining({ page: 1 }),
      );
    });
  });

  describe('getSupplier', () => {
    it('should delegate to repo', () => {
      ctrl.getSupplier('sup-1');
      expect(mockSupplierRepo.findByIdOrThrow).toHaveBeenCalledWith('sup-1');
    });
  });

  describe('qualifySupplier', () => {
    it('should update supplier', () => {
      ctrl.qualifySupplier('sup-1', { qualification_status: 'QUALIFIED' as never }, 'user-1');
      expect(mockSupplierRepo.update).toHaveBeenCalled();
    });
  });

  describe('createPO', () => {
    it('should delegate to workflow', () => {
      ctrl.createPO({ supplier_id: 'sup-1', lines: [] } as never, 'user-1');
      expect(mockWorkflowUseCase.createPO).toHaveBeenCalled();
    });
  });

  describe('listPOs', () => {
    it('should pass parsed query to repo', () => {
      ctrl.listPOs({ page: '1', limit: '10' });
      expect(mockProcurementRepo.findMany).toHaveBeenCalledWith(
        {},
        expect.objectContaining({ page: 1, limit: 10 }),
      );
    });

    it('should pass filters', () => {
      ctrl.listPOs({
        page: '1',
        limit: '10',
        status: 'DRAFT',
        supplier_id: '00000000-0000-0000-0000-000000000001',
      });
      expect(mockProcurementRepo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'DRAFT',
          supplier_id: '00000000-0000-0000-0000-000000000001',
        }),
        expect.objectContaining({ page: 1 }),
      );
    });
  });

  describe('getPO', () => {
    it('should delegate to repo', () => {
      ctrl.getPO('po-1');
      expect(mockProcurementRepo.findByIdOrThrow).toHaveBeenCalledWith('po-1');
    });
  });

  describe('submitPO', () => {
    it('should delegate to workflow', () => {
      ctrl.submitPO('po-1', { electronic_signature: {} } as never, 'user-1');
      expect(mockWorkflowUseCase.submitPO).toHaveBeenCalledWith(
        expect.objectContaining({ poId: 'po-1', authorId: 'user-1' }),
      );
    });
  });

  describe('acknowledgePO', () => {
    it('should delegate to workflow', () => {
      ctrl.acknowledgePO('po-1', {}, 'user-1');
      expect(mockWorkflowUseCase.acknowledgePO).toHaveBeenCalledWith(
        expect.objectContaining({ poId: 'po-1', authorId: 'user-1' }),
      );
    });
  });

  describe('receiveGoods', () => {
    it('should delegate to workflow', () => {
      ctrl.receiveGoods('po-1', { lines: [] } as never, 'user-1');
      expect(mockWorkflowUseCase.receiveGoods).toHaveBeenCalledWith(
        expect.objectContaining({ poId: 'po-1' }),
      );
    });
  });

  describe('closePO', () => {
    it('should delegate to workflow', () => {
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
      ctrl.closePO('po-1', { electronic_signature: sig }, 'user-1');
      expect(mockWorkflowUseCase.closePO).toHaveBeenCalledWith(
        expect.objectContaining({ poId: 'po-1' }),
      );
    });
  });

  describe('cancelPO', () => {
    it('should delegate to workflow', () => {
      ctrl.cancelPO('po-1', { reason: 'Not needed' }, 'user-1');
      expect(mockWorkflowUseCase.cancelPO).toHaveBeenCalledWith(
        expect.objectContaining({ poId: 'po-1', reason: 'Not needed' }),
      );
    });

    it('should default userId to system', () => {
      ctrl.cancelPO('po-1', { reason: 'Not needed' }, undefined as never);
      expect(mockWorkflowUseCase.cancelPO).toHaveBeenCalledWith(
        expect.objectContaining({ authorId: 'system' }),
      );
    });
  });
});
