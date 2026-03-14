import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '@gacp-erp/shared-schemas';

/**
 * Extracts the authenticated user from the request.
 * Returns the full JwtPayload or a specific field if key is provided.
 *
 * @example
 * getProfile(@CurrentUser() user: JwtPayload) { ... }
 * getProfile(@CurrentUser('sub') userId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (key: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: JwtPayload }>();
    const user = request.user;
    return key !== undefined ? user[key] : user;
  },
);
