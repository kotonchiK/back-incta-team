import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  AppConfigModule,
  appConfig,
  TAppConfig,
  BcryptService,
} from '@app/shared';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtConfigModule } from './jwt.module';
import { SchemaModule } from './schema.module';
import { SessionService } from '../services/session.service';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';

const config = appConfig();

@Module({
  imports: [
    ConfigModule.forRoot(),
    AppConfigModule,
    ScheduleModule.forRoot(),
    JwtConfigModule,
    SchemaModule,
    ClientsModule.registerAsync([
      {
        name: config.USERS_MICROSERVICE_NAME,
        useFactory: (_appConfig: TAppConfig) => ({
          transport: Transport.TCP,
          options: {
            host: _appConfig.USERS_MICROSERVICE_HOST,
            port: _appConfig.USERS_MICROSERVICE_PORT,
          },
        }),
        inject: [appConfig.KEY],
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, SessionService, BcryptService],
  exports: [SessionService, AuthService],
})
export class AuthModule {}
