import { BadRequestException } from '@nestjs/common';
import type { ArgumentMetadata } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from './zod-validation.pipe';

describe('ZodValidationPipe', () => {
  let pipe: ZodValidationPipe;

  beforeEach(() => {
    pipe = new ZodValidationPipe();
  });

  describe('when metatype is not a ZodSchema', () => {
    it('passes through value unchanged when metatype is undefined', () => {
      const metadata: ArgumentMetadata = { type: 'body', metatype: undefined };
      expect(pipe.transform({ foo: 'bar' }, metadata)).toEqual({ foo: 'bar' });
    });

    it('passes through value unchanged for regular class metatype', () => {
      class SomeDto {}
      const metadata: ArgumentMetadata = { type: 'body', metatype: SomeDto as never };
      expect(pipe.transform({ some: 'data' }, metadata)).toEqual({ some: 'data' });
    });
  });

  describe('when metatype IS a ZodSchema', () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().int().positive(),
    });

    it('returns parsed data for valid input', () => {
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: schema as never,
      };
      const result = pipe.transform({ name: 'Jane', age: 30 }, metadata);
      expect(result).toEqual({ name: 'Jane', age: 30 });
    });

    it('strips extra fields (schema default behavior)', () => {
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: schema as never,
      };
      const result = pipe.transform({ name: 'Jane', age: 30, extra: true }, metadata);
      expect(result).toEqual({ name: 'Jane', age: 30 });
    });

    it('throws BadRequestException for invalid input', () => {
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: schema as never,
      };

      expect(() => pipe.transform({ name: '', age: -1 }, metadata)).toThrow(BadRequestException);
    });

    it('includes validation details in the error', () => {
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: schema as never,
      };

      try {
        pipe.transform({ name: 123, age: 'not-a-number' }, metadata);
        fail('Expected BadRequestException');
      } catch (e) {
        const err = e as BadRequestException;
        const response = err.getResponse() as {
          message: string;
          details: Array<{ path: string; message: string; code: string }>;
        };
        expect(response.message).toBe('Validation failed');
        expect(response.details).toBeInstanceOf(Array);
        expect(response.details.length).toBeGreaterThan(0);
        expect(response.details[0]).toHaveProperty('path');
        expect(response.details[0]).toHaveProperty('message');
        expect(response.details[0]).toHaveProperty('code');
      }
    });

    it('validates missing required fields', () => {
      const metadata: ArgumentMetadata = {
        type: 'body',
        metatype: schema as never,
      };

      expect(() => pipe.transform({}, metadata)).toThrow(BadRequestException);
    });
  });
});
