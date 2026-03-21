import { HttpException, HttpStatus } from '@nestjs/common';
import { type ZodError, z } from 'zod';
import { AllExceptionsFilter } from './all-exceptions.filter';

function makeHost(url = '/api/test') {
  const send = jest.fn();
  const status = jest.fn().mockReturnValue({ send });
  const reply = { status };
  const request = { url };

  const host = {
    switchToHttp: () => ({
      getResponse: () => reply,
      getRequest: () => request,
    }),
  };

  return { host, reply, send, status };
}

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  it('handles HttpException with string response', () => {
    const { host, status, send } = makeHost();
    const exception = new HttpException('Not found', HttpStatus.NOT_FOUND);

    filter.catch(exception, host as never);

    expect(status).toHaveBeenCalledWith(404);
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'NOT_FOUND', message: 'Not found', status: 404 }),
      }),
    );
  });

  it('handles HttpException with object response', () => {
    const { host, status, send } = makeHost();
    const exception = new HttpException(
      { message: 'Custom msg', code: 'CUSTOM', details: [1] },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, host as never);

    expect(status).toHaveBeenCalledWith(400);
    const body = send.mock.calls[0][0];
    expect(body.error.code).toBe('CUSTOM');
    expect(body.error.message).toBe('Custom msg');
    expect(body.error.details).toEqual([1]);
  });

  it('handles HttpException with object response without custom code', () => {
    const { host, send } = makeHost();
    const exception = new HttpException({ message: 'Oops' }, HttpStatus.FORBIDDEN);

    filter.catch(exception, host as never);

    const body = send.mock.calls[0][0];
    expect(body.error.code).toBe('FORBIDDEN');
  });

  it('handles ZodError as 422', () => {
    const { host, status, send } = makeHost();
    const schema = z.object({ name: z.string() });
    let zodError: ZodError;
    try {
      schema.parse({ name: 123 });
    } catch (e) {
      zodError = e as ZodError;
    }

    filter.catch(zodError!, host as never);

    expect(status).toHaveBeenCalledWith(422);
    const body = send.mock.calls[0][0];
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: 'name' })]),
    );
  });

  it('handles unknown errors as 500', () => {
    const { host, status, send } = makeHost();

    filter.catch(new Error('boom'), host as never);

    expect(status).toHaveBeenCalledWith(500);
    const body = send.mock.calls[0][0];
    expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
  });

  it('statusToCode returns HTTP_ERROR for unmapped codes', () => {
    const { host, send } = makeHost();
    const exception = new HttpException('Teapot', 418);

    filter.catch(exception, host as never);

    const body = send.mock.calls[0][0];
    expect(body.error.code).toBe('HTTP_ERROR');
  });

  it('statusToCode maps 401 to UNAUTHORIZED', () => {
    const { host, send } = makeHost();
    const exception = new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);

    filter.catch(exception, host as never);

    expect(send.mock.calls[0][0].error.code).toBe('UNAUTHORIZED');
  });

  it('statusToCode maps 409 to CONFLICT', () => {
    const { host, send } = makeHost();
    const exception = new HttpException('Conflict', HttpStatus.CONFLICT);

    filter.catch(exception, host as never);

    expect(send.mock.calls[0][0].error.code).toBe('CONFLICT');
  });

  it('statusToCode maps 429 to TOO_MANY_REQUESTS', () => {
    const { host, send } = makeHost();
    const exception = new HttpException('Too many', HttpStatus.TOO_MANY_REQUESTS);

    filter.catch(exception, host as never);

    expect(send.mock.calls[0][0].error.code).toBe('TOO_MANY_REQUESTS');
  });

  it('includes path and timestamp in body', () => {
    const { host, send } = makeHost('/api/v1/test');
    filter.catch(new Error('x'), host as never);

    const body = send.mock.calls[0][0];
    expect(body.error.path).toBe('/api/v1/test');
    expect(body.error.timestamp).toBeDefined();
  });
});
