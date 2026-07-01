import { SPATIAL_ZONE_TOPIC, SpatialZoneSpaceIdUpdatedEventSchema } from '@gacp-erp/shared-events';
import { UpdateZoneSpaceIdUseCase } from './update-zone-space-id.use-case';

const TEST_USER_ID = '00000000-0000-0000-0000-000000000001';

type ZoneStub = {
  id: string;
  zone_code: string;
  zone_name: string;
  zone_type: 'CULTIVATION';
  area_sqm: number;
  capacity: number;
  parent_zone_id: null;
  is_active: true;
  current_occupancy: number;
  notes: null;
  bounds_3d: null;
  ifc_space_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
};

function makeZone(overrides?: Partial<ZoneStub>) {
  return { ...makeZoneBase(), ...overrides };
}

function makeZoneBase(): ZoneStub {
  return {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    zone_code: 'ZONE-ABC123',
    zone_name: 'Cultivation A',
    zone_type: 'CULTIVATION',
    area_sqm: 100,
    capacity: 10,
    parent_zone_id: null,
    is_active: true,
    current_occupancy: 2,
    notes: null,
    bounds_3d: null,
    ifc_space_id: null,
    created_at: '2026-06-29T00:00:00.000Z',
    updated_at: '2026-06-29T00:00:00.000Z',
    created_by: TEST_USER_ID,
    updated_by: TEST_USER_ID,
  };
}

describe('UpdateZoneSpaceIdUseCase', () => {
  it('updates zone ifc_space_id and writes spatial.zone.space_id_updated to outbox', async () => {
    const existingZone = makeZone();
    const updatedZone = makeZone({ ifc_space_id: 'space-42' });

    const tx = {};
    const db = {
      transaction: jest
        .fn()
        .mockImplementation(async (cb: (ctx: unknown) => Promise<unknown>) => cb(tx)),
    };
    const repo = {
      findZoneByIdOrThrow: jest.fn().mockResolvedValue(existingZone),
      updateZoneSpaceId: jest.fn().mockResolvedValue(updatedZone),
    };
    const outboxRepo = {
      createWithTx: jest.fn().mockResolvedValue(undefined),
    };

    const useCase = new UpdateZoneSpaceIdUseCase(db as never, repo as never, outboxRepo as never);

    const result = await useCase.execute(existingZone.id, 'space-42', TEST_USER_ID);

    expect(result.ifc_space_id).toBe('space-42');
    expect(db.transaction).toHaveBeenCalledTimes(1);
    expect(repo.updateZoneSpaceId).toHaveBeenCalledWith(
      tx,
      existingZone.id,
      'space-42',
      TEST_USER_ID,
    );
    expect(outboxRepo.createWithTx).toHaveBeenCalledTimes(1);

    const [, outboxEntry] = outboxRepo.createWithTx.mock.calls[0] as [
      unknown,
      {
        topic: string;
        key: string;
        payload: unknown;
      },
    ];

    expect(outboxEntry.topic).toBe(SPATIAL_ZONE_TOPIC);
    expect(outboxEntry.key).toBe(existingZone.id);

    const parsed = SpatialZoneSpaceIdUpdatedEventSchema.safeParse(outboxEntry.payload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.eventType).toBe('spatial.zone.space_id_updated');
      expect(parsed.data.payload.ifcSpaceId).toBe('space-42');
      expect(parsed.data.payload.zoneId).toBe(existingZone.id);
    }
  });

  it('supports clearing ifc_space_id with null value', async () => {
    const existingZone = makeZone({ ifc_space_id: 'space-7' });
    const updatedZone = makeZone({ ifc_space_id: null });

    const tx = {};
    const db = {
      transaction: jest
        .fn()
        .mockImplementation(async (cb: (ctx: unknown) => Promise<unknown>) => cb(tx)),
    };
    const repo = {
      findZoneByIdOrThrow: jest.fn().mockResolvedValue(existingZone),
      updateZoneSpaceId: jest.fn().mockResolvedValue(updatedZone),
    };
    const outboxRepo = {
      createWithTx: jest.fn().mockResolvedValue(undefined),
    };

    const useCase = new UpdateZoneSpaceIdUseCase(db as never, repo as never, outboxRepo as never);

    const result = await useCase.execute(existingZone.id, null, TEST_USER_ID);

    expect(result.ifc_space_id).toBeNull();

    const [, outboxEntry] = outboxRepo.createWithTx.mock.calls[0] as [
      unknown,
      {
        topic: string;
        key: string;
        payload: unknown;
      },
    ];
    const parsed = SpatialZoneSpaceIdUpdatedEventSchema.safeParse(outboxEntry.payload);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.payload.ifcSpaceId).toBeNull();
    }
  });

  it('propagates outbox write failure', async () => {
    const existingZone = makeZone();
    const updatedZone = makeZone({ ifc_space_id: 'space-13' });

    const tx = {};
    const db = {
      transaction: jest
        .fn()
        .mockImplementation(async (cb: (ctx: unknown) => Promise<unknown>) => cb(tx)),
    };
    const repo = {
      findZoneByIdOrThrow: jest.fn().mockResolvedValue(existingZone),
      updateZoneSpaceId: jest.fn().mockResolvedValue(updatedZone),
    };
    const outboxRepo = {
      createWithTx: jest.fn().mockRejectedValue(new Error('outbox unavailable')),
    };

    const useCase = new UpdateZoneSpaceIdUseCase(db as never, repo as never, outboxRepo as never);

    await expect(useCase.execute(existingZone.id, 'space-13', TEST_USER_ID)).rejects.toThrow(
      'outbox unavailable',
    );
    expect(repo.updateZoneSpaceId).toHaveBeenCalledTimes(1);
    expect(outboxRepo.createWithTx).toHaveBeenCalledTimes(1);
  });
});
