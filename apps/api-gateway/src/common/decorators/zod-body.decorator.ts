import { createParamDecorator, type ExecutionContext, BadRequestException } from '@nestjs/common';
import type { ZodSchema } from 'zod';

/**
 * Parameter decorator that validates the request body using a Zod schema.
 * Throws BadRequestException with detailed field errors on failure.
 *
 * @example
 * async create(@ZodBody(CreatePlantSchema) dto: CreatePlant) { ... }
 */
export const ZodBody = (schema: ZodSchema) =>
  createParamDecorator((_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ body: unknown }>();
    const result = schema.safeParse(request.body);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      throw new BadRequestException({
        message: 'Validation failed',
        details,
      });
    }

    return result.data;
  })();
