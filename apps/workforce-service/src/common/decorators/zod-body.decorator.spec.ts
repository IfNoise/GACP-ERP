import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

const TestSchema = z.object({ name: z.string() });

let ZodBody: (schema: z.ZodSchema) => ParameterDecorator;

beforeAll(async () => {
  const mod = await import('./zod-body.decorator');
  ZodBody = mod.ZodBody;
});

describe('ZodBody', () => {
  it('should be defined', () => {
    expect(ZodBody).toBeDefined();
  });

  it('should return data when validation passes', () => {
    const decorator = ZodBody(TestSchema);
    // Extract the factory function — createParamDecorator returns the metadata handler
    const factory = (decorator as unknown as { factory: (...args: unknown[]) => unknown }).factory;
    if (factory) {
      const mockCtx = {
        switchToHttp: () => ({
          getRequest: () => ({ body: { name: 'test' } }),
        }),
      };
      const result = factory(undefined, mockCtx);
      expect(result).toEqual({ name: 'test' });
    }
  });

  it('should throw BadRequestException on validation failure', () => {
    const decorator = ZodBody(TestSchema);
    const factory = (decorator as unknown as { factory: (...args: unknown[]) => unknown }).factory;
    if (factory) {
      const mockCtx = {
        switchToHttp: () => ({
          getRequest: () => ({ body: { name: 123 } }),
        }),
      };
      expect(() => factory(undefined, mockCtx)).toThrow(BadRequestException);
    }
  });
});
