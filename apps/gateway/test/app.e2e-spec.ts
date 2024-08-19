import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ClientProxy, ClientsModule, Transport } from '@nestjs/microservices';
import { of } from 'rxjs';
import {
  EUsersRoutes,
  EProvider,
  EUsersProviderFields,
  appConfig,
  TAppConfig,
  UsersProviderDto,
  ForgotUsersProviderPasswordDto,
  ResetUsersProviderPasswordDto,
  EUsersParams,
  EGatewayRoutes,
  EAuthRoutes,
  EAuthParams,
} from '@app/shared';
import { createMockAppConfig } from '@app/shared/tests/mocks/app-config.mock';
import * as request from 'supertest';
import * as cookieParser from 'cookie-parser';
import { GatewayModule } from '../src/gateway.module';

describe('GatewayController (e2e)', () => {
  let app: INestApplication;
  let usersClientProxy: ClientProxy;
  let authClientProxy: ClientProxy;
  let mockConfig: TAppConfig;

  beforeAll(async () => {
    mockConfig = createMockAppConfig();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        GatewayModule,
        ClientsModule.register([
          {
            name: mockConfig.USERS_MICROSERVICE_NAME,
            transport: Transport.TCP,
          },
          {
            name: mockConfig.AUTH_MICROSERVICE_NAME,
            transport: Transport.TCP,
          },
        ]),
      ],
    })
      .overrideProvider(mockConfig.USERS_MICROSERVICE_NAME)
      .useValue({
        send: jest.fn((pattern) => {
          if (pattern.cmd === EUsersRoutes.createUser) {
            return of({ id: '2' });
          }
          if (pattern.cmd === EUsersRoutes.verifyEmailVerificationToken) {
            return of({ success: true });
          }
          if (pattern.cmd === EUsersRoutes.forgotPassword) {
            return of({ success: true, message: 'Password reset email sent' });
          }
          if (pattern.cmd === EUsersRoutes.resetPassword) {
            return of({
              success: true,
              message: 'Password has been reset successfully',
            });
          }
          return of(null);
        }),
      })
      .overrideProvider(mockConfig.AUTH_MICROSERVICE_NAME)
      .useValue({
        send: jest.fn((pattern) => {
          if (pattern.cmd === `${EAuthRoutes.local}/${EAuthRoutes.signup}`) {
            return of({ [EAuthParams.accessToken]: 'mockToken' });
          }
          if (pattern.cmd === `${EAuthRoutes.local}/${EAuthRoutes.signin}`) {
            return of({ [EAuthParams.accessToken]: 'mockToken' });
          }
          if (pattern.cmd === EAuthRoutes.logout) {
            return of({ success: true });
          }
          if (pattern.cmd === EAuthRoutes.validateToken) {
            return of(true);
          }
          return of(null);
        }),
      })
      .overrideProvider(appConfig.KEY)
      .useValue(mockConfig)
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix(mockConfig.APP_API_PREFIX);
    await app.init();

    usersClientProxy = moduleFixture.get<ClientProxy>(
      mockConfig.USERS_MICROSERVICE_NAME,
    );
    authClientProxy = moduleFixture.get<ClientProxy>(
      mockConfig.AUTH_MICROSERVICE_NAME,
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it(`/${EGatewayRoutes.users} (POST)`, () => {
    const createUserDto: Partial<UsersProviderDto> = {
      [EUsersProviderFields.providerName]: EProvider.local,
      [EUsersProviderFields.email]: 'new@example.com',
      [EUsersProviderFields.login]: 'newuser',
      [EUsersProviderFields.name]: 'New',
      [EUsersProviderFields.surname]: 'User',
      [EUsersProviderFields.password]: 'Password123!',
      [EUsersProviderFields.repeatPassword]: 'Password123!',
      [EUsersProviderFields.agreement]: 'agreed',
      [EUsersProviderFields.avatar]: 'https://example.com/avatar.jpg',
      [EUsersProviderFields.emailIsValidated]: false,
    };

    return request(app.getHttpServer())
      .post(`/${mockConfig.APP_API_PREFIX}/${EGatewayRoutes.users}`)
      .send(createUserDto)
      .expect(404);
  });

  it(`/${EGatewayRoutes.users}/${EUsersRoutes.verifyEmailVerificationToken}/:token (GET)`, () =>
    request(app.getHttpServer())
      .get(
        `/${mockConfig.APP_API_PREFIX}/${EGatewayRoutes.users}/${EUsersRoutes.verifyEmailVerificationToken}/validToken`,
      )
      .expect(403));

  it(`/${EGatewayRoutes.users}/${EUsersRoutes.forgotPassword} (POST)`, () => {
    const forgotPasswordDto: ForgotUsersProviderPasswordDto = {
      [EUsersProviderFields.emailOrLogin]: 'test@example.com',
      [EUsersProviderFields.recaptchaToken]: 'validRecaptchaToken',
    };

    return request(app.getHttpServer())
      .post(
        `/${mockConfig.APP_API_PREFIX}/${EGatewayRoutes.users}/${EUsersRoutes.forgotPassword}`,
      )
      .send(forgotPasswordDto)
      .expect(403);
  });

  it(`/${EGatewayRoutes.users}/${EUsersRoutes.resetPassword} (POST)`, () => {
    const resetPasswordDto: ResetUsersProviderPasswordDto = {
      [EUsersProviderFields.password]: 'NewPassword123!',
      [EUsersProviderFields.repeatPassword]: 'NewPassword123!',
      [EUsersParams.token]: 'validResetToken',
      [EUsersProviderFields.recaptchaToken]: 'validRecaptchaToken',
    };

    return request(app.getHttpServer())
      .post(
        `/${mockConfig.APP_API_PREFIX}/${EGatewayRoutes.users}/${EUsersRoutes.resetPassword}`,
      )
      .send(resetPasswordDto)
      .expect(403);
  });

  it(`/${EGatewayRoutes.auth}/${EAuthRoutes.local}/${EAuthRoutes.signup} (POST)`, () => {
    const signupDto: Partial<UsersProviderDto> = {
      [EUsersProviderFields.providerName]: EProvider.local,
      [EUsersProviderFields.email]: 'new@example.com',
      [EUsersProviderFields.login]: 'newuser',
      [EUsersProviderFields.name]: 'New',
      [EUsersProviderFields.surname]: 'User',
      [EUsersProviderFields.password]: 'Password123!',
      [EUsersProviderFields.repeatPassword]: 'Password123!',
      [EUsersProviderFields.agreement]: 'agreed',
      [EUsersProviderFields.avatar]: 'https://example.com/avatar.jpg',
      [EUsersProviderFields.emailIsValidated]: false,
    };

    return request(app.getHttpServer())
      .post(
        `/${mockConfig.APP_API_PREFIX}/${EGatewayRoutes.auth}/${EAuthRoutes.local}/${EAuthRoutes.signup}`,
      )
      .send(signupDto)
      .expect(403);
  });

  it(`/${EGatewayRoutes.auth}/${EAuthRoutes.local}/${EAuthRoutes.signin} (POST)`, () => {
    const signinDto = {
      [EUsersProviderFields.emailOrLogin]: 'test@example.com',
      [EUsersProviderFields.password]: 'Password123!',
    };

    return request(app.getHttpServer())
      .post(
        `/${mockConfig.APP_API_PREFIX}/${EGatewayRoutes.auth}/${EAuthRoutes.local}/${EAuthRoutes.signin}`,
      )
      .send(signinDto)
      .expect(403);
  });

  it(`/${EGatewayRoutes.auth}/${EAuthRoutes.logout} (POST)`, () =>
    request(app.getHttpServer())
      .post(
        `/${mockConfig.APP_API_PREFIX}/${EGatewayRoutes.auth}/${EAuthRoutes.logout}`,
      )
      .set('Cookie', [`${EAuthParams.accessToken}=mockToken`])
      .expect(200)
      .expect({
        success: true,
        message: 'The user has been successfully logged out',
      }));
});
