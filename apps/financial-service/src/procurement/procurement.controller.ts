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
  CreateSupplierSchema,
  CreatePurchaseOrderSchema,
  SubmitPurchaseOrderSchema,
  ReceiveGoodsSchema,
  SupplierQualificationStatusEnum,
  PurchaseOrderStatusEnum,
  PaginationQuerySchema,
  type CreateSupplier,
  type CreatePurchaseOrder,
  type SubmitPurchaseOrder,
  type ReceiveGoods,
} from '@gacp-erp/shared-schemas';
import { ZodBody } from '../common/decorators/zod-body.decorator';
import { SupplierRepository } from './supplier.repository';
import type { SupplierFilters } from './supplier.repository';
import { ProcurementRepository } from './procurement.repository';
import type { POFilters } from './procurement.repository';
import { CreateSupplierUseCase } from './use-cases/create-supplier.use-case';
import { ProcurementWorkflowUseCase } from './use-cases/procurement-workflow.use-case';

const SupplierListQuerySchema = PaginationQuerySchema.extend({
  qualification_status: SupplierQualificationStatusEnum.optional(),
  is_active: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
});

const POListQuerySchema = PaginationQuerySchema.extend({
  status: PurchaseOrderStatusEnum.optional(),
  supplier_id: z.string().uuid().optional(),
});

const QualifySupplierBodySchema = z.object({
  qualification_status: SupplierQualificationStatusEnum,
  qualification_expiry: z.string().datetime().optional(),
  notes: z.string().optional(),
});

const AcknowledgeBodySchema = z.object({
  notes: z.string().optional(),
});

const ClosePOBodySchema = z.object({
  electronic_signature: z.object({
    signed_by: z.string().uuid(),
    signer_name: z.string().min(1),
    signer_role: z.string().min(1),
    signature_type: z.literal('ELECTRONIC'),
    authentication_method: z.enum(['PASSWORD', 'MFA', 'BIOMETRIC', 'SMART_CARD']),
    digital_signature: z.string().min(1),
    content_hash: z.string().min(1),
    ip_address: z.string().ip(),
    workstation_id: z.string().min(1),
    signature_meaning: z.string().min(1),
    signed_at: z.string().datetime(),
  }),
});

const CancelPOBodySchema = z.object({ reason: z.string().min(1) });

@Controller({ path: 'procurement', version: '1' })
export class ProcurementController {
  constructor(
    private readonly supplierRepo: SupplierRepository,
    private readonly procurementRepo: ProcurementRepository,
    private readonly createSupplierUseCase: CreateSupplierUseCase,
    private readonly workflowUseCase: ProcurementWorkflowUseCase,
  ) {}

  // ── Suppliers ─────────────────────────────────────────────────────────────

  @Post('suppliers')
  @HttpCode(HttpStatus.CREATED)
  createSupplier(
    @ZodBody(CreateSupplierSchema) dto: CreateSupplier,
    @Headers('x-user-id') userId: string,
  ) {
    return this.createSupplierUseCase.execute(dto, userId ?? 'system');
  }

  @Get('suppliers')
  listSuppliers(@Query() rawQuery: unknown) {
    const { qualification_status, is_active, ...pagination } =
      SupplierListQuerySchema.parse(rawQuery);
    const filters: SupplierFilters = {};
    if (qualification_status !== undefined) filters.qualification_status = qualification_status;
    if (is_active !== undefined) filters.is_active = is_active;
    return this.supplierRepo.findMany(filters, pagination);
  }

  @Get('suppliers/:id')
  getSupplier(@Param('id') id: string) {
    return this.supplierRepo.findByIdOrThrow(id);
  }

  @Patch('suppliers/:id/qualify')
  qualifySupplier(
    @Param('id') id: string,
    @ZodBody(QualifySupplierBodySchema) body: z.infer<typeof QualifySupplierBodySchema>,
    @Headers('x-user-id') userId: string,
  ) {
    return this.supplierRepo.update(undefined as never, id, {
      qualification_status: body.qualification_status,
      ...(body.qualification_expiry !== undefined && {
        qualification_expiry: body.qualification_expiry,
      }),
      notes: body.notes ?? null,
      updated_by: (userId ?? 'system') as never,
    });
  }

  // ── Purchase Orders ───────────────────────────────────────────────────────

  @Post('purchase-orders')
  @HttpCode(HttpStatus.CREATED)
  createPO(
    @ZodBody(CreatePurchaseOrderSchema) dto: CreatePurchaseOrder,
    @Headers('x-user-id') userId: string,
  ) {
    return this.workflowUseCase.createPO(dto, userId ?? 'system');
  }

  @Get('purchase-orders')
  listPOs(@Query() rawQuery: unknown) {
    const { status, supplier_id, ...pagination } = POListQuerySchema.parse(rawQuery);
    const filters: POFilters = {};
    if (status !== undefined) filters.status = status;
    if (supplier_id !== undefined) filters.supplier_id = supplier_id;
    return this.procurementRepo.findMany(filters, pagination);
  }

  @Get('purchase-orders/:id')
  getPO(@Param('id') id: string) {
    return this.procurementRepo.findByIdOrThrow(id);
  }

  @Post('purchase-orders/:id/submit')
  @HttpCode(HttpStatus.OK)
  submitPO(
    @Param('id') id: string,
    @ZodBody(SubmitPurchaseOrderSchema) dto: SubmitPurchaseOrder,
    @Headers('x-user-id') userId: string,
  ) {
    return this.workflowUseCase.submitPO({
      poId: id,
      authorId: userId ?? 'system',
      electronicSignature: dto.electronic_signature,
    });
  }

  @Post('purchase-orders/:id/acknowledge')
  @HttpCode(HttpStatus.OK)
  acknowledgePO(
    @Param('id') id: string,
    @ZodBody(AcknowledgeBodySchema) body: z.infer<typeof AcknowledgeBodySchema>,
    @Headers('x-user-id') userId: string,
  ) {
    return this.workflowUseCase.acknowledgePO({
      poId: id,
      authorId: userId ?? 'system',
      ...(body.notes !== undefined && { notes: body.notes }),
    });
  }

  @Post('purchase-orders/:id/receive-goods')
  @HttpCode(HttpStatus.OK)
  receiveGoods(
    @Param('id') id: string,
    @ZodBody(ReceiveGoodsSchema) dto: ReceiveGoods,
    @Headers('x-user-id') userId: string,
  ) {
    return this.workflowUseCase.receiveGoods({
      poId: id,
      authorId: userId ?? 'system',
      receivedAt: new Date().toISOString(),
      lines: dto.lines as never,
      electronicSignature: dto.electronic_signature,
    });
  }

  @Post('purchase-orders/:id/close')
  @HttpCode(HttpStatus.OK)
  closePO(
    @Param('id') id: string,
    @ZodBody(ClosePOBodySchema) body: z.infer<typeof ClosePOBodySchema>,
    @Headers('x-user-id') userId: string,
  ) {
    return this.workflowUseCase.closePO({
      poId: id,
      authorId: userId ?? 'system',
      electronicSignature: body.electronic_signature,
    });
  }

  @Post('purchase-orders/:id/cancel')
  @HttpCode(HttpStatus.OK)
  cancelPO(
    @Param('id') id: string,
    @ZodBody(CancelPOBodySchema) body: z.infer<typeof CancelPOBodySchema>,
    @Headers('x-user-id') userId: string,
  ) {
    return this.workflowUseCase.cancelPO({
      poId: id,
      authorId: userId ?? 'system',
      reason: body.reason,
    });
  }
}
