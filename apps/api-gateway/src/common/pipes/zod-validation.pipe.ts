import {
  type PipeTransform,
  Injectable,
  BadRequestException,
  type ArgumentMetadata,
} from '@nestjs/common';
import { ZodSchema } from 'zod';

/**
 * Global pipe – validates value against a Zod schema when the metatype IS a ZodSchema.
 * For regular NestJS DTOs without Zod metatype, passes through unchanged.
 *
 * Usage: app.useGlobalPipes(new ZodValidationPipe())
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    const { metatype } = metadata;

    // Only validate when the metatype is a ZodSchema instance
    if (!metatype || !(metatype instanceof ZodSchema)) {
      return value;
    }

    const result = metatype.safeParse(value);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      }));
      throw new BadRequestException({ message: 'Validation failed', details });
    }

    return result.data;
  }
}
