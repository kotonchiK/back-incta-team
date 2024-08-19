import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { appConfig as _appConfig } from '@app/shared';
import { UsersDataValidationPipe } from 'apps/users/src/application/pipes/users-data-validation.pipe';
import { AuthModule } from './modules/auth.module';

(async function () {
  const appConfig = _appConfig();
  const authApp = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: appConfig.AUTH_MICROSERVICE_PORT,
      },
    },
  );

  await authApp.listen().then(() => {
    console.debug(
      `
        Auth microservice is running on TCP port ${appConfig.AUTH_MICROSERVICE_PORT}\n
      `,
    );
  });
})();
