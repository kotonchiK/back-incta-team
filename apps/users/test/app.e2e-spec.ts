import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ClientProxy, ClientsModule, Transport } from '@nestjs/microservices';
import { of, lastValueFrom } from 'rxjs';
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
} from '@app/shared';
import { createMockAppConfig } from '@app/shared/tests/mocks/app-config.mock';
import { UsersModule } from '../src/application/users.module';
import { UserRepository } from '../src/application/ports/user-abstract.repository';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let clientProxy: ClientProxy;
  let mockConfig: TAppConfig;

  beforeAll(async () => {
    mockConfig = createMockAppConfig();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        UsersModule,
        ClientsModule.register([
          {
            name: 'USER_SERVICE',
            transport: Transport.TCP,
          },
        ]),
      ],
    })
      .overrideProvider(UserRepository)
      .useValue({
        findAll: jest
          .fn()
          .mockResolvedValue([
            { id: '1', email: 'test@example.com', name: 'Test User' },
          ]),
        create: jest.fn().mockResolvedValue({ id: '2' }),
        findUsersProvider: jest.fn().mockResolvedValue({
          id: '1',
          email: 'test@example.com',
          password: 'hashedPassword',
          emailIsValidated: true,
        }),
        findProvider: jest.fn().mockResolvedValue({ id: 'providerId' }),
        verifyEmailVerificationToken: jest.fn().mockResolvedValue(true),
        forgotPassword: jest.fn().mockResolvedValue(undefined),
        resetPassword: jest.fn().mockResolvedValue(undefined),
      })
      .overrideProvider(appConfig.KEY)
      .useValue(mockConfig)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    clientProxy = moduleFixture.get<ClientProxy>('USER_SERVICE');
    jest.spyOn(clientProxy, 'send').mockImplementation(() => of({}));
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a new user', async () => {
    const userProviderDto: Partial<UsersProviderDto> = {
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

    (clientProxy.send as jest.Mock).mockReturnValueOnce(of({ id: '2' }));

    const result = await lastValueFrom(
      clientProxy.send({ cmd: EUsersRoutes.createUser }, userProviderDto),
    );

    expect(result).toEqual({ id: '2' });
    expect(clientProxy.send).toHaveBeenCalledWith(
      { cmd: EUsersRoutes.createUser },
      userProviderDto,
    );
  });

  it('should find a user provider by email or login', async () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      password: 'hashedPassword',
      emailIsValidated: true,
    };

    (clientProxy.send as jest.Mock).mockReturnValueOnce(of(mockUser));

    const result = await lastValueFrom(
      clientProxy.send(
        { cmd: EUsersRoutes.findUsersProviderByEmailOrLogin },
        { emailOrLogin: 'test@example.com' },
      ),
    );

    expect(result).toEqual(mockUser);
    expect(clientProxy.send).toHaveBeenCalledWith(
      { cmd: EUsersRoutes.findUsersProviderByEmailOrLogin },
      { emailOrLogin: 'test@example.com' },
    );
  });

  it('should verify email', async () => {
    (clientProxy.send as jest.Mock).mockReturnValueOnce(of({ success: true }));

    const result = await lastValueFrom(
      clientProxy.send(
        { cmd: EUsersRoutes.verifyEmailVerificationToken },
        { token: 'validToken' },
      ),
    );

    expect(result).toEqual({ success: true });
    expect(clientProxy.send).toHaveBeenCalledWith(
      { cmd: EUsersRoutes.verifyEmailVerificationToken },
      { token: 'validToken' },
    );
  });

  it('should handle forgot password request', async () => {
    const forgotPasswordDto: ForgotUsersProviderPasswordDto = {
      [EUsersProviderFields.emailOrLogin]: 'test@example.com',
      [EUsersProviderFields.recaptchaToken]: 'validRecaptchaToken',
    };

    (clientProxy.send as jest.Mock).mockReturnValueOnce(
      of({ success: true, message: 'Password reset email sent' }),
    );

    const result = await lastValueFrom(
      clientProxy.send({ cmd: EUsersRoutes.forgotPassword }, forgotPasswordDto),
    );

    expect(result).toEqual({
      success: true,
      message: 'Password reset email sent',
    });
    expect(clientProxy.send).toHaveBeenCalledWith(
      { cmd: EUsersRoutes.forgotPassword },
      forgotPasswordDto,
    );
  });

  it('should reset password', async () => {
    const resetPasswordDto: ResetUsersProviderPasswordDto = {
      [EUsersProviderFields.password]: 'NewPassword123!',
      [EUsersProviderFields.repeatPassword]: 'NewPassword123!',
      [EUsersParams.token]: 'validResetToken',
      [EUsersProviderFields.recaptchaToken]: 'validRecaptchaToken',
    };

    (clientProxy.send as jest.Mock).mockReturnValueOnce(
      of({ success: true, message: 'Password has been reset successfully' }),
    );

    const result = await lastValueFrom(
      clientProxy.send({ cmd: EUsersRoutes.resetPassword }, resetPasswordDto),
    );

    expect(result).toEqual({
      success: true,
      message: 'Password has been reset successfully',
    });
    expect(clientProxy.send).toHaveBeenCalledWith(
      { cmd: EUsersRoutes.resetPassword },
      resetPasswordDto,
    );
  });
});
