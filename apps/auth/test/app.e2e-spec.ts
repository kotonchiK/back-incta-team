import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import {
  EAuthRoutes,
  EProvider,
  EUsersProviderFields,
  appConfig,
  TAppConfig,
  UsersProviderDto,
  SigninDto,
  EAuthParams,
} from '@app/shared';
import { createMockAppConfig } from '@app/shared/tests/mocks/app-config.mock';
import { AuthController } from '../src/controllers/auth.controller';
import { AuthService } from '../src/services/auth.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let authController: AuthController;
  let mockConfig: TAppConfig;

  beforeAll(async () => {
    mockConfig = createMockAppConfig();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            localSignup: jest
              .fn()
              .mockResolvedValue({ [EAuthParams.accessToken]: 'mockToken' }),
            localSignin: jest
              .fn()
              .mockResolvedValue({ [EAuthParams.accessToken]: 'mockToken' }),
            logout: jest.fn().mockResolvedValue({ success: true }),
            validateToken: jest.fn().mockResolvedValue(true),
            rotateToken: jest
              .fn()
              .mockResolvedValue({ [EAuthParams.accessToken]: 'newMockToken' }),
          },
        },
        {
          provide: appConfig.KEY,
          useValue: mockConfig,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    authController = moduleFixture.get<AuthController>(AuthController);
  });

  afterAll(async () => {
    await app.close();
  });

  it(`/${EAuthRoutes.local}/${EAuthRoutes.signup} (POST)`, async () => {
    const signupDto: Partial<UsersProviderDto> = {
      [EUsersProviderFields.providerName]: EProvider.local,
      [EUsersProviderFields.email]: 'test@example.com',
      [EUsersProviderFields.login]: 'testuser',
      [EUsersProviderFields.password]: 'Password123!',
      [EUsersProviderFields.repeatPassword]: 'Password123!',
      [EUsersProviderFields.agreement]: 'agreed',
    };

    const result = await authController.localSignup(
      signupDto as UsersProviderDto,
    );
    expect(result).toHaveProperty(EAuthParams.accessToken);
    expect(result[EAuthParams.accessToken]).toBe('mockToken');
  });

  it(`/${EAuthRoutes.local}/${EAuthRoutes.signin} (POST)`, async () => {
    const signinDto: SigninDto = {
      [EUsersProviderFields.emailOrLogin]: 'test@example.com',
      [EUsersProviderFields.password]: 'Password123!',
    };

    const result = await authController.localSignin(signinDto);
    expect(result).toHaveProperty(EAuthParams.accessToken);
    expect(result[EAuthParams.accessToken]).toBe('mockToken');
  });

  it(`/${EAuthRoutes.logout} (POST)`, async () => {
    const token = 'mockToken';
    const result = await authController.logout(token);
    expect(result).toEqual({ success: true, message: 'Logout successful' });
  });

  it(`/${EAuthRoutes.validateToken} (POST)`, async () => {
    const token = 'mockToken';
    const result = await authController.validateToken(token);
    expect(result).toBeTruthy();
  });

  it(`/${EAuthRoutes.rotateToken} (POST)`, async () => {
    const token = 'mockToken';
    const result = await authController.refreshToken(token);
    expect(result).toHaveProperty(EAuthParams.accessToken);
    expect(result[EAuthParams.accessToken]).toBe('newMockToken');
  });
});
