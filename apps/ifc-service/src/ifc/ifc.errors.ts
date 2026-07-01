import { DomainError } from '@gacp-erp/shared-schemas';

export class IfcRevisionNotFoundError extends DomainError {
  readonly code = 'IFC_REVISION_NOT_FOUND';
  readonly statusCode = 404;
  constructor(revisionId: string) {
    super(`IFC revision ${revisionId} not found`);
  }
}

export class IfcRevisionConflictError extends DomainError {
  readonly code = 'IFC_REVISION_CONFLICT';
  readonly statusCode = 409;
  constructor(revisionId: string, detail: string) {
    super(`IFC revision ${revisionId}: ${detail}`);
  }
}

export class IfcBaselineNotFoundError extends DomainError {
  readonly code = 'IFC_BASELINE_NOT_FOUND';
  readonly statusCode = 404;
  constructor(modelId: string) {
    super(`No approved baseline revision found for model ${modelId}`);
  }
}
