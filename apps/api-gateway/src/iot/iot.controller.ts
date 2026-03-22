import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { type JwtPayload } from '@gacp-erp/shared-schemas';
import { CreateAlertThresholdSchema } from '@gacp-erp/shared-schemas';
import { z } from 'zod';
import { type AlertHistoryQueryService } from './alert-history-query.service';
import { type ThresholdService } from './threshold.service';
import { type VmProxyService } from './vm-proxy.service';

@Controller({ path: 'iot', version: '1' })
@UseGuards(JwtAuthGuard)
export class IotController {
  constructor(
    private readonly thresholdService: ThresholdService,
    private readonly vmProxy: VmProxyService,
    private readonly alertHistoryQuery: AlertHistoryQueryService,
  ) {}

  // ─── SENSOR READINGS ───────────────────────────────────────────────────────

  @Get('zones/:zoneId/readings')
  async getZoneReadings(
    @Param('zoneId', ParseUUIDPipe) zoneId: string,
    @Query('query') query?: string,
    @Query('time') time?: string,
  ) {
    return this.vmProxy.getZoneReadings(zoneId, query, time);
  }

  @Get('zones/:zoneId/history')
  async getZoneHistory(
    @Param('zoneId', ParseUUIDPipe) zoneId: string,
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('step') step?: string,
    @Query('sensor_type') sensorType?: string,
  ) {
    if (!from || !to) {
      throw new BadRequestException('Query params "from" and "to" are required');
    }
    return this.vmProxy.getZoneHistory(zoneId, from, to, step, sensorType);
  }

  // ─── ALERT HISTORY ─────────────────────────────────────────────────────────

  private static readonly AlertQuerySchema = z.object({
    zone_id: z.string().uuid().optional(),
    sensor_type: z.string().max(50).optional(),
    alert_level: z.enum(['WARNING', 'CRITICAL']).optional(),
    acknowledged: z
      .string()
      .optional()
      .transform((v) => (v != null ? v === 'true' : undefined)),
    from: z.string().max(30).optional(),
    to: z.string().max(30).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  });

  @Get('alerts')
  async listAlerts(
    @Query('zone_id') zoneId?: string,
    @Query('sensor_type') sensorType?: string,
    @Query('alert_level') alertLevel?: 'WARNING' | 'CRITICAL',
    @Query('acknowledged') acknowledgedRaw?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') pageRaw?: string,
    @Query('limit') limitRaw?: string,
  ) {
    const parsed = IotController.AlertQuerySchema.safeParse({
      zone_id: zoneId,
      sensor_type: sensorType,
      alert_level: alertLevel,
      acknowledged: acknowledgedRaw,
      from,
      to,
      page: pageRaw,
      limit: limitRaw,
    });
    if (!parsed.success) {
      throw new BadRequestException({
        message: 'Invalid query parameters',
        details: parsed.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
    }
    const { page, limit, acknowledged, ...rest } = parsed.data;
    const filters: Parameters<AlertHistoryQueryService['findAll']>[0] = { page, limit };
    if (rest.zone_id !== undefined) filters.zone_id = rest.zone_id;
    if (rest.sensor_type !== undefined) filters.sensor_type = rest.sensor_type;
    if (rest.alert_level !== undefined) filters.alert_level = rest.alert_level;
    if (acknowledged !== undefined) filters.acknowledged = acknowledged;
    if (rest.from !== undefined) filters.from = rest.from;
    if (rest.to !== undefined) filters.to = rest.to;

    return this.alertHistoryQuery.findAll(filters);
  }

  // ─── THRESHOLDS ────────────────────────────────────────────────────────────

  @Post('thresholds')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles('QUALITY_MANAGER', 'SUPER_ADMIN')
  async createThreshold(@Body() body: unknown, @CurrentUser() user: JwtPayload) {
    const parsed = CreateAlertThresholdSchema.safeParse(body);
    if (!parsed.success) {
      const details = parsed.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      throw new BadRequestException({ message: 'Validation failed', details });
    }
    return this.thresholdService.create(parsed.data, user);
  }

  @Get('thresholds')
  async listThresholds(
    @Query('zone_id') zoneId?: string,
    @Query('sensor_type') sensorType?: string,
    @Query('is_active') isActiveRaw?: string,
  ) {
    const is_active = isActiveRaw != null ? isActiveRaw === 'true' : undefined;
    const filters: Parameters<ThresholdService['findAll']>[0] = {};
    if (zoneId !== undefined) filters.zone_id = zoneId;
    if (sensorType !== undefined) filters.sensor_type = sensorType;
    if (is_active !== undefined) filters.is_active = is_active;
    return this.thresholdService.findAll(filters);
  }

  @Get('thresholds/:id')
  async getThreshold(@Param('id', ParseUUIDPipe) id: string) {
    return this.thresholdService.findById(id);
  }

  @Delete('thresholds/:id')
  @UseGuards(RolesGuard)
  @Roles('QUALITY_MANAGER', 'SUPER_ADMIN')
  async deactivateThreshold(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.thresholdService.deactivate(id, user);
  }
}
