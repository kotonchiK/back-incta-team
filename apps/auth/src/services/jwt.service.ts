import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { appConfig } from '@app/shared';

@Injectable()
export class JwtAuthService {
  constructor(private jwtService: JwtService) {}

  async generateToken(userId: string): Promise<string> {
    const payload = { sub: userId };
    return this.jwtService.sign(payload, {
      issuer: appConfig().AUTH_JWT_ISSUER,
      audience: appConfig().AUTH_JWT_AUDIENCE,
    });
  }

  async verifyToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token, {
        issuer: appConfig().AUTH_JWT_ISSUER,
        audience: appConfig().AUTH_JWT_AUDIENCE,
      });
    } catch (error) {
      return null;
    }
  }
}
