import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'keycloak-jwt' })],
  providers: [JwtStrategy, JwtAuthGuard, RolesGuard, AuthService],
  controllers: [AuthController],
  exports: [JwtAuthGuard, RolesGuard, PassportModule],
})
export class AuthModule {}
