import { DomainError } from '@gacp-erp/shared-schemas';

export class DuplicateEmailError extends DomainError {
  readonly code = 'EMPLOYEE_DUPLICATE_EMAIL';
  readonly statusCode = 409;

  constructor(email: string) {
    super(`A user with email "${email}" already exists`);
  }
}

export class ZitadelProvisioningError extends DomainError {
  readonly code = 'ZITADEL_PROVISIONING_FAILED';
  readonly statusCode = 500;

  constructor(message: string) {
    super(`Zitadel provisioning failed: ${message}`);
  }
}

export class ZitadelCompensationError extends DomainError {
  readonly code = 'ZITADEL_COMPENSATION_FAILED';
  readonly statusCode = 500;

  constructor(zitadelId: string, originalError: string) {
    super(
      `CRITICAL: Failed to delete Zitadel user ${zitadelId} during compensation. ` +
        `Original error: ${originalError}. Manual cleanup required.`,
    );
  }
}

// Keep old names for backward compatibility
export const KeycloakProvisioningError = ZitadelProvisioningError;
export const KeycloakCompensationError = ZitadelCompensationError;

export class UsernameGenerationError extends DomainError {
  readonly code = 'USERNAME_GENERATION_FAILED';
  readonly statusCode = 409;

  constructor(baseName: string) {
    super(`Could not generate unique username from "${baseName}" after max attempts`);
  }
}
