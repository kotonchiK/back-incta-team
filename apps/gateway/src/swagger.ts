import { appConfig, EAuthParams, EGatewayRoutes } from '@app/shared';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { version } from '../../../package.json';

const config = appConfig();

export const swagger = (app: any) => {
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Incta Backend API')
    .setDescription('API documentation for Incta Backend services')
    .setVersion(version)
    .addServer(
      `https://${EGatewayRoutes.gateway}.incta.team`,
      'Production server',
    )
    .addServer(
      `http://localhost:${config.GATEWAY_MICROSERVICE_PORT}`,
      'Local development server',
    )
    .addCookieAuth(EAuthParams.accessToken, {
      type: 'apiKey',
      in: 'cookie',
      name: EAuthParams.accessToken,
    })
    .build();

  SwaggerModule.setup(
    `${config.APP_API_PREFIX}/${EGatewayRoutes.apiDocs}`,
    app,
    SwaggerModule.createDocument(app, swaggerConfig),
  );
};
