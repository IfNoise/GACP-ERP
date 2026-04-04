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
  CreateZoneSchema,
  UpdateRoomSchema,
  PaginationQuerySchema,
  PlantZoneTypeEnum,
  type UpdateRoom,
} from '@gacp-erp/shared-schemas';
import { RoomRepository } from './room.repository';
import { ZoneRepository } from './zone.repository';
import { CreateZoneUseCase } from './use-cases/create-zone.use-case';
import { ZodBody } from '../common/decorators/zod-body.decorator';

const ListZonesQuerySchema = PaginationQuerySchema.extend({
  zone_type: PlantZoneTypeEnum.optional(),
});

@Controller({ path: 'rooms', version: '1' })
export class RoomController {
  constructor(
    private readonly roomRepo: RoomRepository,
    private readonly zoneRepo: ZoneRepository,
    private readonly createZoneUseCase: CreateZoneUseCase,
  ) {}

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.roomRepo.findByIdOrThrow(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @ZodBody(UpdateRoomSchema) dto: UpdateRoom,
    @Headers('x-user-id') userId: string,
  ) {
    return this.roomRepo.update(id, dto, userId ?? 'system');
  }

  @Get(':roomId/zones')
  listZones(@Param('roomId') roomId: string, @Query() rawQuery: unknown) {
    const { zone_type, ...pagination } = ListZonesQuerySchema.parse(rawQuery);
    return this.zoneRepo.findManyByRoom(
      roomId,
      zone_type !== undefined ? { zone_type } : {},
      pagination,
    );
  }

  @Post(':roomId/zones')
  @HttpCode(HttpStatus.CREATED)
  createZone(
    @Param('roomId') roomId: string,
    @ZodBody(CreateZoneSchema.omit({ room_id: true }))
    dto: Omit<z.infer<typeof CreateZoneSchema>, 'room_id'>,
    @Headers('x-user-id') userId: string,
  ) {
    return this.createZoneUseCase.execute(
      { ...dto, room_id: roomId } as z.infer<typeof CreateZoneSchema>,
      userId ?? 'system',
    );
  }
}
