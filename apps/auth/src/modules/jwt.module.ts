import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigModule, TAppConfig, appConfig } from '@app/shared';
import { JwtAuthService } from '../services/jwt.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [AppConfigModule],
      useFactory: async (_appConfig: TAppConfig) => ({
        secret: _appConfig.AUTH_JWT_SECRET,
        signOptions: {
          expiresIn: _appConfig.AUTH_JWT_EXPIRATION,
          issuer: _appConfig.AUTH_JWT_ISSUER,
          audience: _appConfig.AUTH_JWT_AUDIENCE,
        },
      }),
      inject: [appConfig.KEY],
    }),
  ],
  providers: [JwtAuthService],
  exports: [JwtModule, JwtAuthService],
})
export class JwtConfigModule {}
