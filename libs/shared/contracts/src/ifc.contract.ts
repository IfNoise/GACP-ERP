import { initContract } from '@ts-rest/core';
import { z } from 'zod';

import {
  ApiErrorSchema,
  IfcApproveRevisionBodySchema,
  IfcListRevisionsQuerySchema,
  IfcProjectionStateSchema,
  IfcRejectRevisionBodySchema,
  IfcRequestApprovalBodySchema,
  IfcRevisionDiffSchema,
  IfcRevisionSchema,
  IfcRevisionsListResponseSchema,
  IfcUploadRevisionBodySchema,
} from '@gacp-erp/shared-schemas';

const c = initContract();

export const ifcContract = c.router({
  uploadRevision: {
    method: 'POST',
    path: '/ifc/revisions',
    body: IfcUploadRevisionBodySchema,
    responses: {
      201: IfcRevisionSchema,
      400: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Upload/register a new IFC revision for ingestion',
  },

  listRevisions: {
    method: 'GET',
    path: '/ifc/revisions',
    query: IfcListRevisionsQuerySchema,
    responses: {
      200: IfcRevisionsListResponseSchema,
    },
    summary: 'List IFC revisions with filtering',
  },

  getRevision: {
    method: 'GET',
    path: '/ifc/revisions/:revisionId',
    pathParams: z.object({ revisionId: z.string().uuid() }),
    responses: {
      200: IfcRevisionSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get IFC revision by ID',
  },

  getRevisionDiff: {
    method: 'GET',
    path: '/ifc/revisions/:revisionId/diff',
    pathParams: z.object({ revisionId: z.string().uuid() }),
    responses: {
      200: IfcRevisionDiffSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get diff against currently approved baseline revision',
  },

  requestApproval: {
    method: 'POST',
    path: '/ifc/revisions/:revisionId/approval-request',
    pathParams: z.object({ revisionId: z.string().uuid() }),
    body: IfcRequestApprovalBodySchema,
    responses: {
      200: IfcRevisionSchema,
      400: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Move revision to pending approval state',
  },

  approveRevision: {
    method: 'POST',
    path: '/ifc/revisions/:revisionId/approve',
    pathParams: z.object({ revisionId: z.string().uuid() }),
    body: IfcApproveRevisionBodySchema,
    responses: {
      200: IfcRevisionSchema,
      400: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Approve revision and unlock domain projections',
  },

  rejectRevision: {
    method: 'POST',
    path: '/ifc/revisions/:revisionId/reject',
    pathParams: z.object({ revisionId: z.string().uuid() }),
    body: IfcRejectRevisionBodySchema,
    responses: {
      200: IfcRevisionSchema,
      400: ApiErrorSchema,
      404: ApiErrorSchema,
      409: ApiErrorSchema,
    },
    summary: 'Reject revision and keep existing baseline active',
  },

  getProjectionStatus: {
    method: 'GET',
    path: '/ifc/revisions/:revisionId/projections',
    pathParams: z.object({ revisionId: z.string().uuid() }),
    responses: {
      200: IfcProjectionStateSchema,
      404: ApiErrorSchema,
    },
    summary: 'Get projection status per domain for a revision',
  },
});
