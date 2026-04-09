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
  CreateStrainSchema,
  UpdateStrainSchema,
  DeactivateStrainSchema,
  PaginationQuerySchema,
  StrainSpeciesEnum,
  type CreateStrain,
  type UpdateStrain,
  type DeactivateStrain,
} from '@gacp-erp/shared-schemas';
import { StrainsService } from './strains.service';
import { ZodBody } from '../common/decorators/zod-body.decorator';

const ListStrainsQuerySchema = PaginationQuerySchema.extend({
  species: StrainSpeciesEnum.optional(),
  supplier_id: z.string().uuid().optional(),
  is_active: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
});

@Controller({ path: 'strains', version: '1' })
export class StrainsController {
  constructor(private readonly strainsService: StrainsService) {}

  /** GET /api/v1/strains */
  @Get()
  list(@Query() rawQuery: unknown) {
    const { species, supplier_id, is_active, ...pagination } =
      ListStrainsQuerySchema.parse(rawQuery);
    const filters = {
      ...(species !== undefined && { species }),
      ...(supplier_id !== undefined && { supplier_id }),
      ...(is_active !== undefined && { is_active }),
    };
    return this.strainsService.list(filters, pagination);
  }

  /** GET /api/v1/strains/:id */
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.strainsService.getById(id);
  }

  /** POST /api/v1/strains */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@ZodBody(CreateStrainSchema) dto: CreateStrain, @Headers('x-user-id') userId: string) {
    return this.strainsService.create(dto, userId ?? 'system');
  }

  /** PATCH /api/v1/strains/:id */
  @Patch(':id')
  update(
    @Param('id') id: string,
    @ZodBody(UpdateStrainSchema) dto: UpdateStrain,
    @Headers('x-user-id') userId: string,
  ) {
    return this.strainsService.update(id, dto, userId ?? 'system');
  }

  /** POST /api/v1/strains/:id/deactivate */
  @Post(':id/deactivate')
  deactivate(
    @Param('id') id: string,
    @ZodBody(DeactivateStrainSchema) dto: DeactivateStrain,
    @Headers('x-user-id') userId: string,
  ) {
    return this.strainsService.deactivate(id, dto, userId ?? 'system');
  }
}
