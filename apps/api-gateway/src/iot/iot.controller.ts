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
    const page = pageRaw != null ? Math.max(1, parseInt(pageRaw, 10)) : 1;
    const limit = limitRaw != null ? Math.min(100, Math.max(1, parseInt(limitRaw, 10))) : 20;
    const acknowledged = acknowledgedRaw != null ? acknowledgedRaw === 'true' : undefined;

    const filters: Parameters<AlertHistoryQueryService['findAll']>[0] = { page, limit };
    if (zoneId !== undefined) filters.zone_id = zoneId;
    if (sensorType !== undefined) filters.sensor_type = sensorType;
    if (alertLevel !== undefined) filters.alert_level = alertLevel;
    if (acknowledged !== undefined) filters.acknowledged = acknowledged;
    if (from !== undefined) filters.from = from;
    if (to !== undefined) filters.to = to;

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
