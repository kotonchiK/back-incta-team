import { Test, TestingModule } from '@nestjs/testing';
import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';
import {
  EUsersRoutes,
  EUsersProviderFields,
  appConfig,
  ForgotUsersProviderPasswordDto,
  ResetUsersProviderPasswordDto,
  EUsersParams,
} from '@app/shared';
import { createMockAppConfig } from '@app/shared/tests/mocks/app-config.mock';
import { UsersProxyController } from './users.proxy.controller';

jest.mock('../guards/non-auth.guard', () => ({
  NonAuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: jest.fn().mockReturnValue(true),
  })),
}));

describe('UsersProxyController', () => {
  let controller: UsersProxyController;
  let usersClient: ClientProxy;
  const mockConfig = createMockAppConfig();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersProxyController],
      providers: [
        {
          provide: mockConfig.USERS_MICROSERVICE_NAME,
          useValue: {
            send: jest.fn(),
          },
        },
        {
          provide: appConfig.KEY,
          useValue: mockConfig,
        },
      ],
    }).compile();

    controller = module.get<UsersProxyController>(UsersProxyController);
    usersClient = module.get<ClientProxy>(mockConfig.USERS_MICROSERVICE_NAME);
  });

  describe('verifyEmail', () => {
    it('should redirect to success page on successful verification', async () => {
      const token = 'valid-token';
      const mockResponse = {
        redirect: jest.fn(),
      } as any;

      jest.spyOn(usersClient, 'send').mockReturnValue(of({ success: true }));

      await controller.verifyEmail(token, mockResponse);

      expect(usersClient.send).toHaveBeenCalledWith(
        { cmd: EUsersRoutes.verifyEmailVerificationToken },
        { token },
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        302,
        mockConfig.USERS_EMAIL_VERIFICATION_SUCCESS_PAGE_URL,
      );
    });

    it('should redirect to error page on failed verification', async () => {
      const token = 'invalid-token';
      const mockResponse = {
        redirect: jest.fn(),
      } as any;

      jest.spyOn(usersClient, 'send').mockReturnValue(of({ success: false }));

      await controller.verifyEmail(token, mockResponse);

      expect(usersClient.send).toHaveBeenCalledWith(
        { cmd: EUsersRoutes.verifyEmailVerificationToken },
        { token },
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        302,
        mockConfig.USERS_EMAIL_VERIFICATION_ERROR_PAGE_URL,
      );
    });
  });

  describe('forgotPassword', () => {
    it('should call usersClient.send with correct parameters', async () => {
      const forgotPasswordDto: ForgotUsersProviderPasswordDto = {
        [EUsersProviderFields.emailOrLogin]: 'test@example.com',
        [EUsersProviderFields.recaptchaToken]: 'recaptcha-token',
      };

      jest
        .spyOn(usersClient, 'send')
        .mockReturnValue(
          of({ success: true, message: 'Password reset email sent' }),
        );

      const result = await controller.forgotPassword(forgotPasswordDto);

      expect(usersClient.send).toHaveBeenCalledWith(
        { cmd: EUsersRoutes.forgotPassword },
        forgotPasswordDto,
      );
      expect(result).toEqual({
        success: true,
        message: 'Password reset email sent',
      });
    });
  });

  describe('resetPassword', () => {
    it('should call usersClient.send with correct parameters', async () => {
      const resetPasswordDto: ResetUsersProviderPasswordDto = {
        [EUsersProviderFields.password]: 'newPassword123!',
        [EUsersProviderFields.repeatPassword]: 'newPassword123!',
        [EUsersParams.token]: 'reset-token',
        [EUsersProviderFields.recaptchaToken]: 'recaptcha-token',
      };

      jest
        .spyOn(usersClient, 'send')
        .mockReturnValue(
          of({ success: true, message: 'Password reset successfully' }),
        );

      const result = await controller.resetPassword(resetPasswordDto);

      expect(usersClient.send).toHaveBeenCalledWith(
        { cmd: EUsersRoutes.resetPassword },
        resetPasswordDto,
      );
      expect(result).toEqual({
        success: true,
        message: 'Password reset successfully',
      });
    });
  });
});
