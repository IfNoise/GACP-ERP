import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

let decoratorHandler: (data: unknown, ctx: unknown) => unknown;

jest.mock('@nestjs/common', () => {
  const actual = jest.requireActual('@nestjs/common');
  return {
    ...actual,
    createParamDecorator: (handler: (data: unknown, ctx: unknown) => unknown) => {
      decoratorHandler = handler;
      return () => () => undefined;
    },
  };
});

require('./zod-body.decorator');

const TestSchema = z.object({ name: z.string().min(1) });

function makeCtx(body: unknown) {
  return { switchToHttp: () => ({ getRequest: () => ({ body }) }) };
}

describe('ZodBody', () => {
  beforeAll(async () => {
    const mod = await import('./zod-body.decorator');
    mod.ZodBody(TestSchema);
  });

  it('should return parsed data for valid input', () => {
    const result = decoratorHandler(undefined, makeCtx({ name: 'test' }));
    expect(result).toEqual({ name: 'test' });
  });

  it('should throw BadRequestException for invalid input', () => {
    expect(() => decoratorHandler(undefined, makeCtx({ name: '' }))).toThrow(BadRequestException);
  });

  it('should include details in error', () => {
    try {
      decoratorHandler(undefined, makeCtx({}));
      fail('expected to throw');
    } catch (err) {
      const response = (err as BadRequestException).getResponse() as { details: unknown[] };
      expect(response.details).toBeDefined();
      expect(response.details.length).toBeGreaterThan(0);
    }
  });

  it('should strip extra fields', () => {
    const result = decoratorHandler(undefined, makeCtx({ name: 'test', extra: 'field' }));
    expect(result).toEqual({ name: 'test' });
  });
});
