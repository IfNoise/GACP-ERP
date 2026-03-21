let capturedHandler: (data: unknown, ctx: unknown) => unknown;

jest.mock('@nestjs/common', () => {
  const actual = jest.requireActual('@nestjs/common');
  return {
    ...actual,
    createParamDecorator: (handler: (data: unknown, ctx: unknown) => unknown) => {
      capturedHandler = handler;
      return () => () => undefined;
    },
  };
});

import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';

// Force module evaluation to capture handler

require('./zod-body.decorator');

const TestSchema = z.object({ name: z.string(), age: z.number() });

function makeCtx(body: unknown) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ body }),
    }),
  };
}

describe('ZodBody decorator', () => {
  // Re-invoke the factory to capture handler for our schema
  beforeAll(async () => {
    const mod = await import('./zod-body.decorator');
    mod.ZodBody(TestSchema);
  });

  it('should return parsed data for valid body', () => {
    const result = capturedHandler(undefined, makeCtx({ name: 'Alice', age: 30 }));
    expect(result).toEqual({ name: 'Alice', age: 30 });
  });

  it('should throw BadRequestException for invalid body', () => {
    expect(() => capturedHandler(undefined, makeCtx({ name: 123 }))).toThrow(BadRequestException);
  });

  it('should include validation details in error', () => {
    try {
      capturedHandler(undefined, makeCtx({}));
      fail('Expected BadRequestException');
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      const response = (e as BadRequestException).getResponse() as { details: unknown[] };
      expect(response.details).toBeDefined();
      expect(response.details.length).toBeGreaterThan(0);
    }
  });

  it('should strip unknown fields', () => {
    const result = capturedHandler(undefined, makeCtx({ name: 'Bob', age: 25, extra: true }));
    expect(result).toEqual({ name: 'Bob', age: 25 });
  });
});
