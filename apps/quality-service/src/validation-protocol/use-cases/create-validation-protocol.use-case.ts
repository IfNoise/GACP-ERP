import { Injectable, Logger, Inject } from '@nestjs/common';
import { type Database } from '@gacp-erp/shared-database';
import {
  type CreateValidationProtocol,
  type ValidationProtocol,
  type UserId,
} from '@gacp-erp/shared-schemas';
import { DATABASE_TOKEN } from '../../database/database.module';
import { type ValidationProtocolRepository } from '../validation-protocol.repository';

@Injectable()
export class CreateValidationProtocolUseCase {
  private readonly logger = new Logger(CreateValidationProtocolUseCase.name);

  constructor(
    @Inject(DATABASE_TOKEN) private readonly db: Database,
    private readonly repo: ValidationProtocolRepository,
  ) {}

  async execute(dto: CreateValidationProtocol, userId: string): Promise<ValidationProtocol> {
    const protocolNumber = await this.repo.nextProtocolNumber();

    const protocol = await this.db.transaction(async (tx) => {
      return this.repo.create(tx, {
        protocol_number: protocolNumber,
        type: dto.type,
        status: 'DRAFT',
        system_under_test: dto.system_under_test,
        change_control_id: dto.change_control_id ?? null,
        electronic_signature: null,
        validation_status: 'unvalidated',
        validation_protocol_id: null,
        last_validated_at: null,
        next_review_date: null,
        retention_class: '7_YEAR',
        audit_tx_id: null,
        created_by: userId as UserId,
        updated_by: userId as UserId,
        test_steps: dto.test_steps.map((step, i) => ({
          step_number: i + 1,
          description: step.description,
          expected_result: step.expected_result,
          status: 'PENDING' as const,
          actual_result: null,
          exception_note: null,
          executed_by: null,
          executed_at: null,
          electronic_signature: null,
        })),
      });
    });

    this.logger.log(
      `Validation Protocol created: ${protocol.protocol_number} (id: ${protocol.id})`,
    );
    return protocol;
  }
}
