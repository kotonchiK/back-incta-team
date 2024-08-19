import { NestFactory } from '@nestjs/core';
import { appConfig as _appConfig } from '@app/shared';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { UsersModule } from './application/users.module';
import { UsersDataValidationPipe } from './application/pipes/users-data-validation.pipe';
import { EUserInfrastuctureDriver } from './infrastructure/persistence/users-infrastructure.module';

(async function () {
  const appConfig = _appConfig();
  const usersApp = await NestFactory.createMicroservice<MicroserviceOptions>(
    UsersModule.register(EUserInfrastuctureDriver.prisma),
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: appConfig.USERS_MICROSERVICE_PORT,
      },
    },
  );
  usersApp.useGlobalPipes(UsersDataValidationPipe);
  await usersApp.listen().then(() => {
    console.debug(
      `
        Users microservice is running on TCP port ${appConfig.USERS_MICROSERVICE_PORT}\n
        DB connection is: ...${process.env.USERS_DATABASE_URL.slice(-30)}
      `,
    );
  });
})();
