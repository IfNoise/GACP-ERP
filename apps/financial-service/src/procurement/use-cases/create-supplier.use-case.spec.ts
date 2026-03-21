import { type CreateSupplierUseCase as CreateSupplierUseCaseType } from './create-supplier.use-case';

const { CreateSupplierUseCase } = require('./create-supplier.use-case') as {
  CreateSupplierUseCase: new (...args: unknown[]) => CreateSupplierUseCaseType;
};

const mockRepo = {
  nextSupplierCode: jest.fn().mockResolvedValue('SUP-0001'),
  create: jest.fn(),
};

const mockDb = {
  transaction: jest.fn().mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn({})),
};

describe('CreateSupplierUseCase', () => {
  let useCase: CreateSupplierUseCaseType;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.transaction.mockImplementation((fn: (tx: unknown) => Promise<unknown>) => fn({}));
    useCase = new CreateSupplierUseCase(mockDb as never, mockRepo as never);
  });

  it('should create supplier with PROVISIONAL status', async () => {
    const fakeSupplier = { id: 'sup-1', supplier_code: 'SUP-0001', name: 'Test' };
    mockRepo.create.mockResolvedValue(fakeSupplier);

    const result = await useCase.execute(
      {
        name: 'Test',
        contact_details: {
          email: 'a@b.com',
          phone: '123',
          address: 'Addr',
          contact_person: 'John',
        },
      } as never,
      'user-1',
    );

    expect(result).toEqual(fakeSupplier);
    expect(mockRepo.nextSupplierCode).toHaveBeenCalled();
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        supplier_code: 'SUP-0001',
        qualification_status: 'PROVISIONAL',
      }),
    );
  });

  it('should handle missing contact_details', async () => {
    const fakeSupplier = { id: 'sup-2', supplier_code: 'SUP-0001', name: 'Mini' };
    mockRepo.create.mockResolvedValue(fakeSupplier);

    const result = await useCase.execute({ name: 'Mini' } as never, 'user-1');

    expect(result).toEqual(fakeSupplier);
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        contact_details: expect.objectContaining({
          email: null,
          phone: null,
          address: null,
          contact_person: null,
        }),
      }),
    );
  });

  it('should handle optional notes', async () => {
    mockRepo.create.mockResolvedValue({ id: 'sup-3' });

    await useCase.execute({ name: 'X', notes: 'Important' } as never, 'user-1');

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ notes: 'Important' }),
    );
  });
});
