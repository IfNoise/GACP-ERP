import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { z } from 'zod';
import {
  CreateRoomSchema,
  UpdateBuildingSchema,
  PaginationQuerySchema,
  type UpdateBuilding,
} from '@gacp-erp/shared-schemas';
import { BuildingRepository } from './building.repository';
import { RoomRepository } from './room.repository';
import { CreateRoomUseCase } from './use-cases/create-room.use-case';
import { ZodBody } from '../common/decorators/zod-body.decorator';

@Controller({ path: 'buildings', version: '1' })
export class BuildingController {
  constructor(
    private readonly buildingRepo: BuildingRepository,
    private readonly roomRepo: RoomRepository,
    private readonly createRoomUseCase: CreateRoomUseCase,
  ) {}

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.buildingRepo.findByIdOrThrow(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @ZodBody(UpdateBuildingSchema) dto: UpdateBuilding,
    @Headers('x-user-id') userId: string,
  ) {
    return this.buildingRepo.update(id, dto, userId ?? 'system');
  }

  @Get(':buildingId/rooms')
  listRooms(@Param('buildingId') buildingId: string, @Query() rawQuery: unknown) {
    const pagination = PaginationQuerySchema.parse(rawQuery);
    return this.roomRepo.findManyByBuilding(buildingId, pagination);
  }

  @Post(':buildingId/rooms')
  @HttpCode(HttpStatus.CREATED)
  createRoom(
    @Param('buildingId') buildingId: string,
    @ZodBody(CreateRoomSchema.omit({ building_id: true }))
    dto: Omit<z.infer<typeof CreateRoomSchema>, 'building_id'>,
    @Headers('x-user-id') userId: string,
  ) {
    return this.createRoomUseCase.execute(
      { ...dto, building_id: buildingId } as z.infer<typeof CreateRoomSchema>,
      userId ?? 'system',
    );
  }
}
