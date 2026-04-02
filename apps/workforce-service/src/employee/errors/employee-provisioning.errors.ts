import { DomainError } from '@gacp-erp/shared-schemas';

export class DuplicateEmailError extends DomainError {
  readonly code = 'EMPLOYEE_DUPLICATE_EMAIL';
  readonly statusCode = 409;

  constructor(email: string) {
    super(`A user with email "${email}" already exists`);
  }
}

export class KeycloakProvisioningError extends DomainError {
  readonly code = 'KEYCLOAK_PROVISIONING_FAILED';
  readonly statusCode = 500;

  constructor(message: string) {
    super(`Keycloak provisioning failed: ${message}`);
  }
}

export class KeycloakCompensationError extends DomainError {
  readonly code = 'KEYCLOAK_COMPENSATION_FAILED';
  readonly statusCode = 500;

  constructor(keycloakId: string, originalError: string) {
    super(
      `CRITICAL: Failed to delete Keycloak user ${keycloakId} during compensation. ` +
        `Original error: ${originalError}. Manual cleanup required.`,
    );
  }
}

export class UsernameGenerationError extends DomainError {
  readonly code = 'USERNAME_GENERATION_FAILED';
  readonly statusCode = 409;

  constructor(baseName: string) {
    super(`Could not generate unique username from "${baseName}" after max attempts`);
  }
}
