import { DynamicModule, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import {
  appConfig,
  AppConfigModule,
  BcryptService,
  TAppConfig,
} from '@app/shared';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { UsersController } from '../presenters/tcp/users.controller';
import {
  EUserInfrastuctureDriver,
  UserInfrastructureModule,
} from '../infrastructure/persistence/users-infrastructure.module';
import { UserFactory } from '../domain/factories/user.factory';
import { UsersProviderFactory } from '../domain/factories/users-provider.factory';
import { CreateUsersProviderCommandHandler } from './commands/create-users-provider.command.handler';
import { CreateUserCommandHandler } from './commands/create-user.command.handler';
import { FindUsersProviderQueryHandler } from './queries/find-users-provider.query.handler';
import { FindProviderQueryHandler } from './queries/find-provider.query.handler';
import { UpdateUsersProviderCommandHandler } from './commands/update-users-provider.command.handler';
import { DeleteUserCommandHandler } from './commands/delete-user.command.handler';
import { ConfirmUsersLocalProviderEmailCommandHandler } from './commands/confirm-users-local-provider-email-command.handler';
import { FindUsersProviderByEmailOrLoginQueryHandler } from './queries/find-users-provider-by-email-or-login.query.handler';
import { EmailNotifierModule } from '../../../email-notifier/email-notifier.module';
import { EmailNotifierService } from '../../../email-notifier/email-notifier.service';
import { FindUsersQueryHandler } from './queries/find-users.query.handler';

const config = appConfig();

@Module({})
export class UsersModule {
  static register(driver: EUserInfrastuctureDriver): DynamicModule {
    return {
      module: UsersModule,
      imports: [
        CqrsModule.forRoot(),
        AppConfigModule,
        UserInfrastructureModule.use(driver),
        EmailNotifierModule,
        ClientsModule.registerAsync([
          {
            name: config.AUTH_MICROSERVICE_NAME,
            useFactory: (_appConfig: TAppConfig) => ({
              transport: Transport.TCP,
              options: {
                host: _appConfig.AUTH_MICROSERVICE_HOST,
                port: _appConfig.AUTH_MICROSERVICE_PORT,
              },
            }),
            inject: [appConfig.KEY],
          },
        ]),
      ],
      controllers: [UsersController],
      providers: [
        JwtService,
        BcryptService,
        EmailNotifierService,
        UsersService,
        UserFactory,
        UsersProviderFactory,
        CreateUserCommandHandler,
        CreateUsersProviderCommandHandler,
        ConfirmUsersLocalProviderEmailCommandHandler,
        UpdateUsersProviderCommandHandler,
        FindUsersProviderQueryHandler,
        FindProviderQueryHandler,
        FindUsersProviderByEmailOrLoginQueryHandler,

        DeleteUserCommandHandler,
        FindUsersQueryHandler,
      ],
    };
  }
}
