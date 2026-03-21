import { z } from 'zod';
import { ZodBody } from './zod-body.decorator';

const TestSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
});

describe('ZodBody decorator', () => {
  it('is defined', () => {
    expect(ZodBody).toBeDefined();
    expect(typeof ZodBody).toBe('function');
  });

  it('returns a parameter decorator when called with schema', () => {
    const decorator = ZodBody(TestSchema);
    expect(typeof decorator).toBe('function');
  });
});
