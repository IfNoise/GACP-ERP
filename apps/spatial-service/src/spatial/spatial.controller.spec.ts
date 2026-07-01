import { SpatialController } from './spatial.controller';

function createController() {
  const repo = {
    findTopLevelZones: jest.fn(),
    findManyZones: jest.fn(),
    findZoneByIdOrThrow: jest.fn(),
    findZoneHierarchy: jest.fn(),
    findAssignmentByIdOrThrow: jest.fn(),
    listActiveAssignmentsForZone: jest.fn(),
    findRacksByZonePaginated: jest.fn(),
    findRackByIdOrThrow: jest.fn(),
    listTraysByRack: jest.fn(),
  };

  const planningUseCase = {
    createZone: jest.fn(),
    assignBatchToZone: jest.fn(),
    releaseBatchFromZone: jest.fn(),
  };

  const createRackUseCase = { execute: jest.fn() };
  const deleteRackUseCase = { execute: jest.fn() };
  const createTrayUseCase = { execute: jest.fn() };
  const deleteTrayUseCase = { execute: jest.fn() };
  const updateZoneBoundsUseCase = { execute: jest.fn() };
  const updateZoneSpaceIdUseCase = { execute: jest.fn() };

  const controller = new SpatialController(
    repo as never,
    planningUseCase as never,
    createRackUseCase as never,
    deleteRackUseCase as never,
    createTrayUseCase as never,
    deleteTrayUseCase as never,
    updateZoneBoundsUseCase as never,
    updateZoneSpaceIdUseCase as never,
  );

  return {
    controller,
    updateZoneSpaceIdUseCase,
    updateZoneBoundsUseCase,
  };
}

describe('SpatialController', () => {
  it('delegates PATCH zones/:id/space with provided user id', async () => {
    const { controller, updateZoneSpaceIdUseCase } = createController();
    const expected = { id: 'zone-1', ifc_space_id: 'space-88' };
    updateZoneSpaceIdUseCase.execute.mockResolvedValue(expected);

    const result = await controller.updateZoneSpaceId(
      'zone-1',
      { ifc_space_id: 'space-88' },
      '00000000-0000-0000-0000-000000000001',
    );

    expect(result).toEqual(expected);
    expect(updateZoneSpaceIdUseCase.execute).toHaveBeenCalledWith(
      'zone-1',
      'space-88',
      '00000000-0000-0000-0000-000000000001',
    );
  });

  it('delegates PATCH zones/:id/space and falls back to system user', async () => {
    const { controller, updateZoneSpaceIdUseCase } = createController();
    updateZoneSpaceIdUseCase.execute.mockResolvedValue({ id: 'zone-2', ifc_space_id: null });

    await controller.updateZoneSpaceId('zone-2', { ifc_space_id: null }, undefined as never);

    expect(updateZoneSpaceIdUseCase.execute).toHaveBeenCalledWith('zone-2', null, 'system');
  });

  it('delegates PATCH zones/:id/bounds and falls back to system user', async () => {
    const { controller, updateZoneBoundsUseCase } = createController();
    const bounds: [number, number, number, number, number, number] = [0, 0, 0, 10, 4, 6];
    updateZoneBoundsUseCase.execute.mockResolvedValue({ id: 'zone-3', bounds_3d: bounds });

    await controller.updateZoneBounds('zone-3', { bounds_3d: bounds }, undefined as never);

    expect(updateZoneBoundsUseCase.execute).toHaveBeenCalledWith('zone-3', bounds, 'system');
  });
});
