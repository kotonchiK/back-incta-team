import { Test, TestingModule } from '@nestjs/testing';
import { RpcException } from '@nestjs/microservices';
import {
  EProvider,
  EUsersProviderFields,
  Messages,
  UsersProviderDto,
  ForgotUsersProviderPasswordDto,
  ResetUsersProviderPasswordDto,
  EUsersParams,
  appConfig,
  EDbEntityFields,
  TFindUserByEmailOrLoginQueryHandlerReturnType,
} from '@app/shared';
import { createMockAppConfig } from '@app/shared/tests/mocks/app-config.mock';
import { UsersController } from './users.controller';
import { UsersService } from '../../application/users.service';
import { CreateUsersProviderCommand } from '../../application/commands/create-users-provider.command';
import { EmailNotifierService } from '../../../../email-notifier/email-notifier.service';

describe('UsersController', () => {
  let usersController: UsersController;
  let usersService: UsersService;
  const mockAppConfig = createMockAppConfig();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findUsersProviderByEmailOrLogin: jest.fn(),
            create: jest.fn(),
            verifyEmailVerificationToken: jest.fn(),
            forgotPassword: jest.fn(),
            resetPassword: jest.fn(),
          },
        },
        {
          provide: appConfig.KEY,
          useValue: mockAppConfig,
        },
        {
          provide: EmailNotifierService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
      ],
    }).compile();

    usersController = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  describe('findUsersProviderByEmailOrLogin', () => {
    it('should return user provider when found', async () => {
      const mockUser: TFindUserByEmailOrLoginQueryHandlerReturnType = {
        [EDbEntityFields.id]: '1',
        [EUsersProviderFields.userLocalId]: '1',
        [EUsersProviderFields.password]: 'hashedPassword',
        [EUsersProviderFields.email]: 'test@example.com',
        [EUsersProviderFields.emailIsValidated]: true,
      };
      jest
        .spyOn(usersService, 'findUsersProviderByEmailOrLogin')
        .mockResolvedValue(mockUser);

      const result = await usersController.findUsersProviderByEmailOrLogin({
        emailOrLogin: 'test@example.com',
      });

      expect(result).toEqual(mockUser);
      expect(usersService.findUsersProviderByEmailOrLogin).toHaveBeenCalledWith(
        'test@example.com',
      );
    });

    it('should throw RpcException when user not found', async () => {
      jest
        .spyOn(usersService, 'findUsersProviderByEmailOrLogin')
        .mockResolvedValue(undefined);

      await expect(
        usersController.findUsersProviderByEmailOrLogin({
          emailOrLogin: 'nonexistent@example.com',
        }),
      ).rejects.toThrow(RpcException);
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userProviderDto: UsersProviderDto = {
        [EUsersProviderFields.providerName]: EProvider.local,
        [EUsersProviderFields.email]: 'test@example.com',
        [EUsersProviderFields.login]: 'testuser',
        [EUsersProviderFields.name]: 'Test',
        [EUsersProviderFields.surname]: 'User',
        [EUsersProviderFields.sub]: 'SUB',
        [EUsersProviderFields.password]: 'Password123!',
        [EUsersProviderFields.repeatPassword]: 'Password123!',
        [EUsersProviderFields.agreement]: 'agreed',
        [EUsersProviderFields.avatar]: 'https://example.com/avatar.jpg',
        [EUsersProviderFields.emailIsValidated]: false,
      };

      const expectedResult = { id: '1' };
      jest.spyOn(usersService, 'create').mockResolvedValue(expectedResult);

      const result = await usersController.create(userProviderDto);

      expect(result).toEqual(expectedResult);
      expect(usersService.create).toHaveBeenCalledWith(
        expect.any(CreateUsersProviderCommand),
      );
    });

    it('should throw RpcException when creation fails', async () => {
      const userProviderDto: UsersProviderDto = {
        [EUsersProviderFields.providerName]: EProvider.local,
        [EUsersProviderFields.email]: 'test@example.com',
        [EUsersProviderFields.login]: 'testuser',
        [EUsersProviderFields.name]: 'Test',
        [EUsersProviderFields.surname]: 'User',
        [EUsersProviderFields.sub]: 'SUB',
        [EUsersProviderFields.password]: 'Password123!',
        [EUsersProviderFields.repeatPassword]: 'Password123!',
        [EUsersProviderFields.agreement]: 'agreed',
        [EUsersProviderFields.avatar]: 'https://example.com/avatar.jpg',
        [EUsersProviderFields.emailIsValidated]: false,
      };

      jest
        .spyOn(usersService, 'create')
        .mockRejectedValue(new Error('Creation failed'));

      await expect(usersController.create(userProviderDto)).rejects.toThrow(
        RpcException,
      );
    });
  });

  describe('verifyEmailVerificationToken', () => {
    it('should return success true when token is valid', async () => {
      jest
        .spyOn(usersService, 'verifyEmailVerificationToken')
        .mockResolvedValue(true);

      const result = await usersController.verifyEmailVerificationToken({
        token: 'valid-token',
      });

      expect(result).toEqual({ success: true });
      expect(usersService.verifyEmailVerificationToken).toHaveBeenCalledWith(
        'valid-token',
      );
    });

    it('should return success false when token is invalid', async () => {
      jest
        .spyOn(usersService, 'verifyEmailVerificationToken')
        .mockResolvedValue(false);

      const result = await usersController.verifyEmailVerificationToken({
        token: 'invalid-token',
      });

      expect(result).toEqual({ success: false });
    });

    it('should throw RpcException when token is empty', async () => {
      await expect(
        usersController.verifyEmailVerificationToken({ token: '' }),
      ).rejects.toThrow(RpcException);
    });
  });

  describe('forgotPassword', () => {
    it('should call usersService.forgotPassword and return success message', async () => {
      const forgotPasswordDto: ForgotUsersProviderPasswordDto = {
        [EUsersProviderFields.emailOrLogin]: 'test@example.com',
        [EUsersProviderFields.recaptchaToken]: 'recaptcha-token',
      };

      jest.spyOn(usersService, 'forgotPassword').mockResolvedValue(undefined);

      const result = await usersController.forgotPassword(forgotPasswordDto);

      expect(result).toEqual({
        success: true,
        message: Messages.SUCCESS_OPERATION,
      });
      expect(usersService.forgotPassword).toHaveBeenCalledWith(
        forgotPasswordDto,
      );
    });

    it('should throw RpcException when forgotPassword fails', async () => {
      const forgotPasswordDto: ForgotUsersProviderPasswordDto = {
        [EUsersProviderFields.emailOrLogin]: 'test@example.com',
        [EUsersProviderFields.recaptchaToken]: 'recaptcha-token',
      };

      jest
        .spyOn(usersService, 'forgotPassword')
        .mockRejectedValue(new Error('Forgot password failed'));

      await expect(
        usersController.forgotPassword(forgotPasswordDto),
      ).rejects.toThrow(RpcException);
    });
  });

  describe('resetPassword', () => {
    it('should call usersService.resetPassword and return success message', async () => {
      const resetPasswordDto: ResetUsersProviderPasswordDto = {
        [EUsersProviderFields.password]: 'newPassword123!',
        [EUsersProviderFields.repeatPassword]: 'newPassword123!',
        [EUsersParams.token]: 'reset-token',
        [EUsersProviderFields.recaptchaToken]: 'recaptcha-token',
      };

      jest.spyOn(usersService, 'resetPassword').mockResolvedValue(undefined);

      const result = await usersController.resetPassword(resetPasswordDto);

      expect(result).toEqual({
        success: true,
        message: Messages.SUCCESS_OPERATION,
      });
      expect(usersService.resetPassword).toHaveBeenCalledWith(resetPasswordDto);
    });

    it('should throw RpcException when resetPassword fails', async () => {
      const resetPasswordDto: ResetUsersProviderPasswordDto = {
        [EUsersProviderFields.password]: 'newPassword123!',
        [EUsersProviderFields.repeatPassword]: 'newPassword123!',
        [EUsersParams.token]: 'reset-token',
        [EUsersProviderFields.recaptchaToken]: 'recaptcha-token',
      };

      jest
        .spyOn(usersService, 'resetPassword')
        .mockRejectedValue(new Error('Reset password failed'));

      await expect(
        usersController.resetPassword(resetPasswordDto),
      ).rejects.toThrow(RpcException);
    });
  });
});
