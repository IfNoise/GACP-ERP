import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Validates the Bearer JWT token via Zitadel JWKS (RS256).
 * Attaches the decoded JwtPayload to request.user on success.
 */
@Injectable()
export class JwtAuthGuard extends (AuthGuard('zitadel-jwt') as new () => CanActivate) {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
