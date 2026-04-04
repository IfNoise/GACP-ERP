import { Controller, Get, Patch, Param, Headers } from '@nestjs/common';
import { UpdateZoneSchema, type UpdateZone } from '@gacp-erp/shared-schemas';
import { ZoneRepository } from './zone.repository';
import { ZodBody } from '../common/decorators/zod-body.decorator';

@Controller({ path: 'zones', version: '1' })
export class ZoneController {
  constructor(private readonly zoneRepo: ZoneRepository) {}

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.zoneRepo.findByIdOrThrow(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @ZodBody(UpdateZoneSchema) dto: UpdateZone,
    @Headers('x-user-id') userId: string,
  ) {
    return this.zoneRepo.update(id, dto, userId ?? 'system');
  }
}
