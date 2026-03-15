import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TransitionStageUseCase } from './transition-stage.use-case';
import type { PlantsRepository } from '../plants.repository';
import type { OutboxRepository } from '../../outbox/outbox.repository';
import type {
  Plant,
  PlantStageTransitionRecord,
  ElectronicSignature,
} from '@gacp-erp/shared-schemas';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const fakePlant = {
  id: 'plant-uuid-1',
  plant_code: 'PLT-001',
  batch_id: 'batch-uuid-1',
  strain_id: 'strain-uuid-1',
  facility_id: 'facility-uuid-1',
  zone_id: null,
  qr_code: 'QR-001',
  current_stage: 'SEED',
  is_active: true,
  notes: null,
  planted_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  created_by: 'user-1',
  updated_by: 'user-1',
  deleted_at: null,
} as unknown as Plant;

const fakeStageRecord = {
  id: 'record-uuid-1',
  plant_id: 'plant-uuid-1',
  from_stage: 'SEED',
  to_stage: 'GERMINATION',
  transitioned_by: 'user-1',
  transitioned_at: new Date().toISOString(),
  notes: null,
  electronic_signature: null,
} as unknown as PlantStageTransitionRecord;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TransitionStageUseCase', () => {
  let useCase: TransitionStageUseCase;
  let plantsRepo: jest.Mocked<PlantsRepository>;
  let outboxRepo: jest.Mocked<OutboxRepository>;
  let mockDb: { transaction: jest.Mock };

  beforeEach(() => {
    plantsRepo = {
      findById: jest.fn(),
      getStageHistory: jest.fn().mockResolvedValue([]),
      updateStageWithTx: jest.fn(),
    } as unknown as jest.Mocked<PlantsRepository>;

    outboxRepo = {
      createWithTx: jest.fn(),
    } as unknown as jest.Mocked<OutboxRepository>;

    mockDb = {
      transaction: jest
        .fn()
        .mockImplementation(async (cb: (tx: unknown) => Promise<PlantStageTransitionRecord>) =>
          cb(mockDb),
        ),
    };

    useCase = new TransitionStageUseCase(mockDb as never, plantsRepo, outboxRepo);
  });

  describe('plant not found', () => {
    it('throws NotFoundException when plant does not exist', async () => {
      plantsRepo.findById.mockResolvedValue(null);

      await expect(useCase.execute('plant-uuid-1', 'GERMINATION', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('invalid stage transition', () => {
    it('throws BadRequestException for a disallowed transition (SEED → FLOWERING)', async () => {
      plantsRepo.findById.mockResolvedValue(fakePlant); // current_stage = SEED

      await expect(useCase.execute('plant-uuid-1', 'FLOWERING', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException for a HARVESTED plant (terminal state)', async () => {
      const harvestedPlant: Plant = { ...fakePlant, current_stage: 'HARVESTED' };
      plantsRepo.findById.mockResolvedValue(harvestedPlant);
      plantsRepo.getStageHistory.mockResolvedValue([fakeStageRecord]);

      await expect(useCase.execute('plant-uuid-1', 'GERMINATION', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('successful transition', () => {
    beforeEach(() => {
      plantsRepo.findById.mockResolvedValue(fakePlant); // current_stage = SEED
      plantsRepo.getStageHistory.mockResolvedValue([]);
      plantsRepo.updateStageWithTx.mockResolvedValue(undefined);
      outboxRepo.createWithTx.mockResolvedValue(undefined);
    });

    it('returns the stage transition record', async () => {
      const result = await useCase.execute('plant-uuid-1', 'GERMINATION', 'user-1');

      expect(result).toMatchObject({
        plant_id: 'plant-uuid-1',
        from_stage: 'SEED',
        to_stage: 'GERMINATION',
        transitioned_by: 'user-1',
      });
    });

    it('calls updateStageWithTx inside transaction', async () => {
      await useCase.execute('plant-uuid-1', 'GERMINATION', 'user-1');

      expect(plantsRepo.updateStageWithTx).toHaveBeenCalledTimes(1);
      const [txArg, plantIdArg, toStageArg] = plantsRepo.updateStageWithTx.mock.calls[0]!;
      expect(txArg).toBe(mockDb);
      expect(plantIdArg).toBe('plant-uuid-1');
      expect(toStageArg).toBe('GERMINATION');
    });

    it('writes PLANT_STAGE_CHANGED outbox event inside same transaction', async () => {
      await useCase.execute('plant-uuid-1', 'GERMINATION', 'user-1');

      expect(outboxRepo.createWithTx).toHaveBeenCalledTimes(1);
      const [txArg, eventArg] = outboxRepo.createWithTx.mock.calls[0]!;
      expect(txArg).toBe(mockDb);
      expect((eventArg.payload as Record<string, unknown>)['eventType']).toBe(
        'PLANT_STAGE_CHANGED',
      );
    });

    it('passes notes to the stage record when provided', async () => {
      const result = await useCase.execute('plant-uuid-1', 'GERMINATION', 'user-1', 'test note');

      expect(result.notes).toBe('test note');
    });

    it('passes signature to updateStageWithTx when provided', async () => {
      const sig = {
        signed_by: 'user-1',
        signature_type: 'approval',
        authentication_method: 'password',
        digital_signature: 'abc123',
        ip_address: '127.0.0.1',
        signed_at: new Date().toISOString(),
      } as unknown as ElectronicSignature;
      await useCase.execute('plant-uuid-1', 'GERMINATION', 'user-1', undefined, sig);

      const [, , , , stageRecordArg] = plantsRepo.updateStageWithTx.mock.calls[0]!;
      expect(stageRecordArg.electronic_signature).not.toBeNull();
    });

    it('marks signatureProvided=true in the outbox event when signature is present', async () => {
      const sig = {
        signed_by: 'user-1',
        signature_type: 'approval',
        authentication_method: 'password',
        digital_signature: 'abc123',
        ip_address: '127.0.0.1',
        signed_at: new Date().toISOString(),
      } as unknown as ElectronicSignature;
      await useCase.execute('plant-uuid-1', 'GERMINATION', 'user-1', undefined, sig);

      const [, eventArg] = outboxRepo.createWithTx.mock.calls[0]!;
      const payload = eventArg.payload as Record<string, unknown>;
      expect((payload['payload'] as Record<string, unknown>)['signatureProvided']).toBe(true);
    });
  });
});
