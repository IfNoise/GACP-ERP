import { BadRequestException, type ExecutionContext } from '@nestjs/common';
import { z } from 'zod';

// Mock createParamDecorator to capture the inner handler function
let capturedHandler: (data: unknown, ctx: ExecutionContext) => unknown;
jest.mock('@nestjs/common', () => {
  const actual = jest.requireActual('@nestjs/common');
  return {
    ...actual,
    createParamDecorator: (handler: (data: unknown, ctx: ExecutionContext) => unknown) => {
      capturedHandler = handler;
      return () => 'decorator';
    },
  };
});

const { ZodBody } = require('./zod-body.decorator') as {
  ZodBody: (schema: z.ZodSchema) => ParameterDecorator;
};

const TestSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
});

function makeContext(body: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ body }),
    }),
  } as unknown as ExecutionContext;
}

describe('ZodBody decorator', () => {
  beforeEach(() => {
    // Trigger the factory to capture the handler
    ZodBody(TestSchema);
  });

  it('should return validated data for valid body', () => {
    const ctx = makeContext({ name: 'John', age: 25 });
    const result = capturedHandler(undefined, ctx);
    expect(result).toEqual({ name: 'John', age: 25 });
  });

  it('should throw BadRequestException for invalid body', () => {
    const ctx = makeContext({ name: '', age: -1 });
    expect(() => capturedHandler(undefined, ctx)).toThrow(BadRequestException);
  });

  it('should include validation details in exception', () => {
    const ctx = makeContext({ name: 123 });
    try {
      capturedHandler(undefined, ctx);
      fail('Expected BadRequestException');
    } catch (err) {
      const response = (err as BadRequestException).getResponse() as {
        message: string;
        details: Array<{ path: string; message: string; code: string }>;
      };
      expect(response.message).toBe('Validation failed');
      expect(response.details.length).toBeGreaterThan(0);
      expect(response.details[0]).toHaveProperty('path');
      expect(response.details[0]).toHaveProperty('message');
      expect(response.details[0]).toHaveProperty('code');
    }
  });

  it('should strip unknown fields', () => {
    const ctx = makeContext({ name: 'Jane', age: 30, extra: true });
    const result = capturedHandler(undefined, ctx);
    expect(result).toEqual({ name: 'Jane', age: 30 });
  });
});
