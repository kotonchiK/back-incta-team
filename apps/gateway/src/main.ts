import { NestFactory } from '@nestjs/core';
import { appConfig as _appConfig } from '@app/shared';
import * as cookieParser from 'cookie-parser';
import { GatewayModule } from './gateway.module';
import { swagger } from './swagger';

(async function bootstrap() {
  const allowedDomains = [
    'https://incta.team',
    'https://www.incta.team',
    'https://gateway.incta.team',
    'http://localhost',
    'http://localhost:3000',
    'http://localhost:8080',
    'http://localhost:3457',
  ];
  const config = _appConfig();
  const gatewayApp = await NestFactory.create(GatewayModule);
  gatewayApp.use(cookieParser());
  gatewayApp.setGlobalPrefix(config.APP_API_PREFIX);
  swagger(gatewayApp);

  gatewayApp.enableCors({
    origin: (origin, callback) => {
      if (allowedDomains.includes(origin) || !origin) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    methods: 'GET,PUT,POST,PATCH,DELETE,UPDATE,OPTIONS',
    credentials: true,
  });
  await gatewayApp.listen(config.GATEWAY_MICROSERVICE_PORT).then(() => {
    console.debug(
      `
        Gateway microservice is running on port ${config.GATEWAY_MICROSERVICE_PORT}
      `,
    );
  });
})();
