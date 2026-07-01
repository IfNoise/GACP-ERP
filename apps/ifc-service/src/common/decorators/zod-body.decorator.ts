import { createParamDecorator, type ExecutionContext, BadRequestException } from '@nestjs/common';
import type { ZodSchema } from 'zod';

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
      throw new BadRequestException({ message: 'Validation failed', details });
    }

    return result.data;
  })();
