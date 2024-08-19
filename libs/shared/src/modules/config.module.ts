import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType, registerAs } from '@nestjs/config';
import * as Joi from 'joi';
import * as dotenv from 'dotenv';
import { EAuthRoutes } from '../routes/auth.routes';
import { EProvider } from '../types/user/user.type';
import { EGatewayRoutes } from '../routes/gateway.routes';

dotenv.config({ path: './.env' });

export const APP_CONFIG_NAME = 'appConfig';

export const appConfig = registerAs(APP_CONFIG_NAME, () => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  const configValues = {
    NODE_ENV: process.env.NODE_ENV,
    APP_MAIN_DOMAIN: process.env.APP_MAIN_DOMAIN,

    SMTP_AUTHENTICATION_USERNAME: process.env.SMTP_AUTHENTICATION_USERNAME,
    SMTP_AUTHENTICATION_PASSWORD: process.env.SMTP_AUTHENTICATION_PASSWORD,
    SMTP_SERVER_HOST: process.env.SMTP_SERVER_HOST,
    SMTP_SERVER_PORT: process.env.SMTP_SERVER_PORT,

    APP_API_PREFIX: process.env.APP_API_PREFIX,

    GATEWAY_MICROSERVICE_PORT: +process.env.GATEWAY_MICROSERVICE_PORT,

    AUTH_MICROSERVICE_HOST: isDevelopment
      ? undefined
      : process.env.AUTH_MICROSERVICE_HOST,
    AUTH_MICROSERVICE_PORT: +process.env.AUTH_MICROSERVICE_PORT,
    AUTH_MICROSERVICE_NAME: process.env.AUTH_MICROSERVICE_NAME,
    AUTH_MONGODB_URI: process.env.AUTH_MONGODB_URI,
    AUTH_JWT_SECRET: process.env.AUTH_JWT_SECRET,
    AUTH_JWT_EXPIRATION: process.env.AUTH_JWT_EXPIRATION,
    AUTH_JWT_ISSUER: process.env.AUTH_JWT_ISSUER,
    AUTH_JWT_AUDIENCE: process.env.AUTH_JWT_AUDIENCE,
    AUTH_MONGOOSE_CONNECTION: 'AUTH-MONGOOSE-CONNECTION',
    AUTH_SESSION_MODEL: 'AUTH-SESSION-MODEL',
    AUTH_TOKEN_EXPIRATION: 3600,
    AUTH_SESSION_INACTIVITY_PERIOD: +process.env.AUTH_SESSION_INACTIVITY_PERIOD,
    AUTH_GOOGLE_CALLBACK_URL: isDevelopment
      ? `http://localhost:${+process.env.GATEWAY_MICROSERVICE_PORT}/${process.env.APP_API_PREFIX}/${EAuthRoutes.auth}/${EAuthRoutes.external}/${EAuthRoutes.signin}/${EProvider.google}/${EAuthRoutes.callback}`
      : `https://${EGatewayRoutes.gateway}.${process.env.APP_MAIN_DOMAIN}/${process.env.APP_API_PREFIX}/${EAuthRoutes.auth}/${EAuthRoutes.external}/${EAuthRoutes.signin}/${EProvider.google}/${EAuthRoutes.callback}`,
    AUTH_GOOGLE_CLIENT_ID: process.env.AUTH_GOOGLE_CLIENT_ID,
    AUTH_GOOGLE_CLIENT_SECRET: process.env.AUTH_GOOGLE_CLIENT_SECRET,
    AUTH_GITHUB_CALLBACK_URL: isDevelopment
      ? `http://localhost:${+process.env.GATEWAY_MICROSERVICE_PORT}/${process.env.APP_API_PREFIX}/${EAuthRoutes.auth}/${EAuthRoutes.external}/${EAuthRoutes.signin}/${EProvider.github}/${EAuthRoutes.callback}`
      : `https://${EGatewayRoutes.gateway}.${process.env.APP_MAIN_DOMAIN}/${process.env.APP_API_PREFIX}/${EAuthRoutes.auth}/${EAuthRoutes.external}/${EAuthRoutes.signin}/${EProvider.github}/${EAuthRoutes.callback}`,
    AUTH_GITHUB_CLIENT_ID: process.env.AUTH_GITHUB_CLIENT_ID,
    AUTH_GITHUB_CLIENT_SECRET: process.env.AUTH_GITHUB_CLIENT_SECRET,

    USERS_MICROSERVICE_HOST: isDevelopment
      ? undefined
      : process.env.USERS_MICROSERVICE_HOST,
    USERS_MICROSERVICE_NAME: process.env.USERS_MICROSERVICE_NAME,
    USERS_MICROSERVICE_PORT: +process.env.USERS_MICROSERVICE_PORT,
    USERS_DATABASE_URL: process.env.USERS_DATABASE_URL,
    USERNAME_MIN_LENGHT: +process.env.USERNAME_MIN_LENGHT,
    USERNAME_MAX_LENGHT: +process.env.USERNAME_MAX_LENGHT,
    USERNAME_ALLOWED_SYMBOLS: process.env.USERNAME_ALLOWED_SYMBOLS,
    USERPASSWORD_MIN_LENGHT: +process.env.USERPASSWORD_MIN_LENGHT,
    USERPASSWORD_MAX_LENGHT: +process.env.USERPASSWORD_MAX_LENGHT,
    USERPASSWORD_ALLOWED_SYMBOLS: process.env.USERPASSWORD_ALLOWED_SYMBOLS,
    USERS_EMAIL_CONFIRMATION_TTL: +process.env.USERS_EMAIL_CONFIRMATION_TTL,
    USERS_JWT_SECRET: process.env.USERS_JWT_SECRET,
    USERS_PASSWORD_RESET_TOKEN_TTL: +process.env.USERS_PASSWORD_RESET_TOKEN_TTL,
    USERS_LOGIN_PAGE_URL: process.env.USERS_LOGIN_PAGE_URL,
    USERS_EMAIL_VERIFICATION_ERROR_PAGE_URL:
      process.env.USERS_EMAIL_VERIFICATION_ERROR_PAGE_URL,
    USERS_EMAIL_VERIFICATION_SUCCESS_PAGE_URL:
      process.env.USERS_EMAIL_VERIFICATION_SUCCESS_PAGE_URL,
  };

  const schema = Joi.object<typeof configValues>({
    NODE_ENV: Joi.string().valid('development', 'production').required(),
    APP_MAIN_DOMAIN: Joi.string().required(),
    SMTP_AUTHENTICATION_USERNAME: Joi.string().required(),
    SMTP_AUTHENTICATION_PASSWORD: Joi.string().required(),
    SMTP_SERVER_HOST: Joi.string().required(),
    SMTP_SERVER_PORT: Joi.string().required(),
    APP_API_PREFIX: Joi.string().required(),
    GATEWAY_MICROSERVICE_PORT: Joi.number().required(),
    AUTH_MICROSERVICE_HOST: Joi.string().when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    AUTH_MICROSERVICE_PORT: Joi.number().required(),
    AUTH_MICROSERVICE_NAME: Joi.string().required(),
    AUTH_MONGODB_URI: Joi.string().required(),
    AUTH_JWT_SECRET: Joi.string().required(),
    AUTH_JWT_EXPIRATION: Joi.string().required(),
    AUTH_JWT_ISSUER: Joi.string().required(),
    AUTH_JWT_AUDIENCE: Joi.string().required(),
    AUTH_MONGOOSE_CONNECTION: Joi.string().required(),
    AUTH_SESSION_MODEL: Joi.string().required(),
    AUTH_TOKEN_EXPIRATION: Joi.number().required(),
    AUTH_SESSION_INACTIVITY_PERIOD: Joi.number().required(),
    AUTH_GOOGLE_CLIENT_ID: Joi.string().required(),
    AUTH_GOOGLE_CLIENT_SECRET: Joi.string().required(),
    AUTH_GOOGLE_CALLBACK_URL: Joi.string().required(),
    AUTH_GITHUB_CALLBACK_URL: Joi.string().required(),
    AUTH_GITHUB_CLIENT_ID: Joi.string().required(),
    AUTH_GITHUB_CLIENT_SECRET: Joi.string().required(),

    USERS_MICROSERVICE_HOST: Joi.string().when('NODE_ENV', {
      is: 'production',
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    USERS_MICROSERVICE_NAME: Joi.string().required(),
    USERS_MICROSERVICE_PORT: Joi.number().required(),
    USERS_DATABASE_URL: Joi.string().required(),
    USERNAME_MIN_LENGHT: Joi.number().required(),
    USERNAME_MAX_LENGHT: Joi.number().required(),
    USERNAME_ALLOWED_SYMBOLS: Joi.string().required(),
    USERPASSWORD_MIN_LENGHT: Joi.number().required(),
    USERPASSWORD_MAX_LENGHT: Joi.number().required(),
    USERPASSWORD_ALLOWED_SYMBOLS: Joi.string().required(),
    USERS_EMAIL_CONFIRMATION_TTL: Joi.number().required(),
    USERS_JWT_SECRET: Joi.string().required(),
    USERS_PASSWORD_RESET_TOKEN_TTL: Joi.number().required(),
    USERS_LOGIN_PAGE_URL: Joi.string().required(),
    USERS_EMAIL_VERIFICATION_ERROR_PAGE_URL: Joi.string().required(),
    USERS_EMAIL_VERIFICATION_SUCCESS_PAGE_URL: Joi.string().required(),
  });

  const { error, value } = schema.validate(configValues, { abortEarly: false });

  if (error) {
    console.error(
      `\nApp ENV variables validation failed\n${error.details
        .map((detail) => detail.message)
        .join('\n')}`,
    );
    process.exit(1);
  }

  return Object.freeze(value) as typeof configValues;
});

export type TAppConfig = ConfigType<typeof appConfig>;

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig],
      isGlobal: true,
      expandVariables: true,
    }),
  ],
})
export class AppConfigModule {}
