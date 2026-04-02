import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { z } from 'zod';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { type JwtPayload, ElectronicSignatureSchema } from '@gacp-erp/shared-schemas';
import { SignatureService } from './signature.service';
import { FastifyRequest } from 'fastify';

const SignRequestSchema = z.object({
  /** The raw JSON-serialisable content being signed */
  content: z.string().min(1).max(50_000),
  /** SHA-256 hex hash of content — computed by the caller */
  content_hash: z.string().regex(/^[0-9a-f]{64}$/i),
  signer_role: z.string().min(1).max(100),
  signature_type: ElectronicSignatureSchema.shape.signature_type,
  authentication_method: ElectronicSignatureSchema.shape.authentication_method,
  signature_meaning: z.string().min(1).max(500),
  workstation_id: z.string().min(1).max(100),
  /** Short-lived reauth token obtained from POST /auth/reauth (§11.200) */
  reauth_token: z.string().min(1),
});

const VerifyRequestSchema = z.object({
  signature: ElectronicSignatureSchema,
  content: z.string().min(1).max(50_000),
});

@Controller({ path: 'signatures', version: '1' })
@UseGuards(JwtAuthGuard)
export class SignatureController {
  constructor(private readonly signatureService: SignatureService) {}

  /**
   * POST /api/v1/signatures/sign
   *
   * Creates an RSA-SHA256 electronic signature for the provided content.
   * Requires a valid reauth_token to prove re-authentication (21 CFR §11.200).
   */
  @Post('sign')
  @HttpCode(HttpStatus.CREATED)
  async sign(
    @Body() rawBody: unknown,
    @CurrentUser() user: JwtPayload,
    @Req() req: FastifyRequest,
  ) {
    const parsed = SignRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      const details = parsed.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      throw new BadRequestException({ message: 'Validation failed', details });
    }

    const body = parsed.data;
    const ipAddress =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
      req.socket.remoteAddress ??
      '0.0.0.0';

    if (!body.reauth_token || body.reauth_token.length < 10) {
      throw new UnauthorizedException(
        'Valid reauth_token required for electronic signing (21 CFR §11.200)',
      );
    }

    const result = await this.signatureService.sign({
      content: body.content,
      contentHash: body.content_hash,
      signingUserId: user.sub,
      signingUsername: user.preferred_username ?? user.sub,
      signerName:
        `${user.given_name ?? ''} ${user.family_name ?? ''}`.trim() ||
        (user.preferred_username ?? user.sub),
      signerRole: body.signer_role,
      signatureMeaning: body.signature_meaning,
      signatureType: body.signature_type,
      authenticationMethod: body.authentication_method,
      ipAddress,
      workstationId: body.workstation_id,
      reauthToken: body.reauth_token,
    });

    return result.signature;
  }

  /**
   * POST /api/v1/signatures/verify
   *
   * Verifies an existing electronic signature against the original content.
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  verify(@Body() rawBody: unknown) {
    const parsed = VerifyRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      const details = parsed.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      throw new BadRequestException({ message: 'Validation failed', details });
    }

    const { signature, content } = parsed.data;
    const valid = this.signatureService.verify(signature, content);

    return {
      valid,
      signed_by: signature.signed_by,
      signed_at: signature.signed_at,
      signature_meaning: signature.signature_meaning,
    };
  }
}
