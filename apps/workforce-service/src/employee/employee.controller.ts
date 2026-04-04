import { Controller, Logger } from '@nestjs/common';
import { TsRest, TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { workforceContract } from '@gacp-erp/shared-contracts';
import { EmployeeRepository } from './employee.repository';
import { UserRepository } from './user.repository';
import { CreateEmployeeUseCase } from './use-cases/create-employee.use-case';
import {
  DuplicateEmailError,
  KeycloakProvisioningError,
  KeycloakCompensationError,
  UsernameGenerationError,
} from './errors/employee-provisioning.errors';

@TsRest({ validateResponses: false })
@Controller()
export class EmployeeController {
  private readonly logger = new Logger(EmployeeController.name);

  constructor(
    private readonly employeeRepo: EmployeeRepository,
    private readonly userRepo: UserRepository,
    private readonly createEmployeeUseCase: CreateEmployeeUseCase,
  ) {}

  /**
   * Resolve the x-user-id header (Keycloak sub) to the internal users.id.
   * Returns null if the header is missing or the user is not found.
   */
  private async resolveUserId(headers: Record<string, unknown>): Promise<string | null> {
    const keycloakSub = (headers as Record<string, string | undefined>)['x-user-id'];
    if (!keycloakSub) return null;
    const user = await this.userRepo.findByKeycloakId(keycloakSub);
    return user?.id ?? null;
  }

  @TsRestHandler(workforceContract.createEmployee)
  createEmployee() {
    return tsRestHandler(workforceContract.createEmployee, async ({ body, headers }) => {
      const userId = await this.resolveUserId(headers as Record<string, unknown>);
      if (!userId) {
        return {
          status: 401 as const,
          body: {
            statusCode: 401,
            error: 'UNAUTHORIZED',
            message: 'Missing or unresolvable user identity. Ensure you are logged in.',
            timestamp: new Date().toISOString(),
          },
        };
      }
      try {
        const result = await this.createEmployeeUseCase.execute(body, userId);
        return { status: 201 as const, body: result };
      } catch (error) {
        const now = new Date().toISOString();
        if (error instanceof DuplicateEmailError || error instanceof UsernameGenerationError) {
          return {
            status: 409 as const,
            body: {
              statusCode: error.statusCode,
              error: error.code,
              message: error.message,
              timestamp: now,
            },
          };
        }
        if (
          error instanceof KeycloakProvisioningError ||
          error instanceof KeycloakCompensationError
        ) {
          this.logger.error(error.message, error);
          return {
            status: 500 as const,
            body: {
              statusCode: error.statusCode,
              error: error.code,
              message: error.message,
              timestamp: now,
            },
          };
        }
        throw error;
      }
    });
  }

  @TsRestHandler(workforceContract.listEmployees)
  listEmployees() {
    return tsRestHandler(workforceContract.listEmployees, async ({ query }) => {
      const filters: { department?: string; is_active?: boolean } = {};
      if (query.department !== undefined) filters.department = query.department;
      if (query.is_active !== undefined) filters.is_active = query.is_active;
      const result = await this.employeeRepo.findMany(filters, {
        page: query.page,
        limit: query.limit,
      });
      return { status: 200 as const, body: result };
    });
  }

  @TsRestHandler(workforceContract.getEmployee)
  getEmployee() {
    return tsRestHandler(workforceContract.getEmployee, async ({ params }) => {
      const result = await this.employeeRepo.findByIdOrThrow(params.id);
      return { status: 200 as const, body: result };
    });
  }

  @TsRestHandler(workforceContract.deactivateEmployee)
  deactivateEmployee() {
    return tsRestHandler(workforceContract.deactivateEmployee, async ({ params, headers }) => {
      const userId = await this.resolveUserId(headers as Record<string, unknown>);
      if (!userId) {
        return {
          status: 401 as const,
          body: {
            statusCode: 401,
            error: 'UNAUTHORIZED',
            message: 'Missing or unresolvable user identity. Ensure you are logged in.',
            timestamp: new Date().toISOString(),
          },
        };
      }
      const result = await this.employeeRepo.deactivate(params.id, userId);
      return { status: 200 as const, body: result };
    });
  }
}
