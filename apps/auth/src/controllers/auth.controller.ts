import { Controller, NotImplementedException } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import {
  AppRpcErrorFormatter,
  EAuthParams,
  EAuthRoutes,
  EProvider,
  EUsersProviderFields,
  SigninDto,
  UsersProviderDto,
} from '@app/shared';
import { AuthService } from '../services/auth.service';

@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  @MessagePattern({ cmd: `${EAuthRoutes.local}/${EAuthRoutes.signup}` })
  async localSignup(@Payload() signupDto: UsersProviderDto) {
    try {
      return await this.authService.localSignup(signupDto);
    } catch (error) {
      throw new RpcException(AppRpcErrorFormatter.format(error));
    }
  }

  @MessagePattern({ cmd: `${EAuthRoutes.local}/${EAuthRoutes.signin}` })
  async localSignin(
    @Payload()
    signinDto: SigninDto,
  ) {
    try {
      return await this.authService.localSignin(
        signinDto[EUsersProviderFields.emailOrLogin],
        signinDto[EUsersProviderFields.password],
      );
    } catch (error) {
      throw new RpcException(AppRpcErrorFormatter.format(error));
    }
  }

  @MessagePattern({ cmd: `${EAuthRoutes.external}/:${EAuthParams.provider}` })
  async externalSignin(@Payload() signupDto: UsersProviderDto) {
    try {
      return await this.authService.externalSignin(signupDto);
    } catch (error) {
      throw new RpcException(AppRpcErrorFormatter.format(error));
    }
  }

  @MessagePattern({ cmd: EAuthRoutes.logout })
  async logout(@Payload() token: string) {
    try {
      await this.authService.logout(token);
      return { success: true, message: 'Logout successful' };
    } catch (error) {
      throw new RpcException(AppRpcErrorFormatter.format(error));
    }
  }

  @MessagePattern({ cmd: EAuthRoutes.rotateToken })
  async refreshToken(@Payload() token: string) {
    try {
      return await this.authService.rotateToken(token);
    } catch (error) {
      throw new RpcException(AppRpcErrorFormatter.format(error));
    }
  }

  @MessagePattern({ cmd: EAuthRoutes.validateToken })
  async validateToken(@Payload() token: string) {
    try {
      return await this.authService.validateToken(token);
    } catch (error) {
      throw new RpcException(AppRpcErrorFormatter.format(error));
    }
  }

  @MessagePattern({ cmd: EAuthRoutes.deleteAllUsersProviderSessions })
  async deleteAllUsersProviderSessions(
    @Payload() data: { userId: string; providerName: EProvider },
  ) {
    try {
      await this.authService.deleteAllUsersProviderSessions(
        data.userId,
        data.providerName,
      );
      return {
        success: true,
        message: `All user:${data.providerName} sessions deleted successfully`,
      };
    } catch (error) {
      throw new RpcException(AppRpcErrorFormatter.format(error));
    }
  }
}
