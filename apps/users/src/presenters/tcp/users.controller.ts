import {
  Controller,
  Inject,
  NotFoundException,
  UnauthorizedException, UseGuards,
} from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import {
  appConfig,
  AppRpcErrorFormatter,
  DeleteUserDto,
  EUsersParams,
  EUsersProviderFields,
  EUsersRoutes,
  ForgotUsersProviderPasswordDto,
  Messages,
  ResetUsersProviderPasswordDto,
  TAppConfig,
  UsersProviderDto,
} from '@app/shared';
import { UsersService } from '../../application/users.service';
import { CreateUsersProviderCommand } from '../../application/commands/create-users-provider.command';
import { RecaptchaGuard } from '../../../../auth/src/guards/recaptcha.guard';

@Controller()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(appConfig.KEY) private readonly config: TAppConfig,
  ) {}

  @MessagePattern({ cmd: EUsersRoutes.findUsersProviderByEmailOrLogin })
  async findUsersProviderByEmailOrLogin(
    @Payload() data: { emailOrLogin: string },
  ) {
    try {
      const result = await this.usersService.findUsersProviderByEmailOrLogin(
        data.emailOrLogin,
      );
      if (!result) {
        throw new NotFoundException(Messages.ERROR_USER_NOT_FOUND);
      }

      return result;
    } catch (error) {
      throw new RpcException(AppRpcErrorFormatter.format(error));
    }
  }

  @MessagePattern({ cmd: EUsersRoutes.createUser })
  async create(@Payload() userProviderData: UsersProviderDto) {
    try {
      const createUsersProviderCommand = new CreateUsersProviderCommand(
        userProviderData[EUsersProviderFields.providerName],
        userProviderData[EUsersProviderFields.sub],
        userProviderData[EUsersProviderFields.email],
        userProviderData[EUsersProviderFields.login],
        userProviderData[EUsersProviderFields.name],
        userProviderData[EUsersProviderFields.surname],
        userProviderData[EUsersProviderFields.password],
        userProviderData[EUsersProviderFields.avatar],
        userProviderData[EUsersProviderFields.emailIsValidated],
      );
      return await this.usersService.create(createUsersProviderCommand);
    } catch (error) {
      throw new RpcException(AppRpcErrorFormatter.format(error));
    }
  }

  @MessagePattern({ cmd: EUsersRoutes.verifyEmailVerificationToken })
  async verifyEmailVerificationToken(@Payload() data: { token: string }) {
    try {
      if (!data.token.trim()) {
        throw new UnauthorizedException('Email was not verified');
      }
      const result = await this.usersService.verifyEmailVerificationToken(
        data.token,
      );
      if (!result) {
        return { success: false };
      }

      return { success: true };
    } catch (error) {
      throw new RpcException(AppRpcErrorFormatter.format(error));
    }
  }

  @MessagePattern({ cmd: EUsersRoutes.forgotPassword })
  @UseGuards(RecaptchaGuard)
  async forgotPassword(
    @Payload() forgotUsersProviderPasswordDto: ForgotUsersProviderPasswordDto,
  ) {
    try {
      console.debug('');
      console.debug('cmd: EUsersRoutes.forgotPassword');
      console.debug(
        forgotUsersProviderPasswordDto[EUsersProviderFields.recaptchaToken],
        'recaptchaToken',
      );
      console.debug('');

      await this.usersService.forgotPassword(forgotUsersProviderPasswordDto);
      return {
        success: true,
        message: Messages.SUCCESS_OPERATION,
      };
    } catch (error) {
      throw new RpcException(AppRpcErrorFormatter.format(error));
    }
  }

  @MessagePattern({ cmd: EUsersRoutes.resetPassword })
  @UseGuards(RecaptchaGuard)
  async resetPassword(
    @Payload() resetUsersProviderPasswordDto: ResetUsersProviderPasswordDto,
  ) {
    try {
      console.debug('');
      console.debug('cmd: EUsersRoutes.resetPassword');
      console.debug(
        resetUsersProviderPasswordDto[EUsersProviderFields.recaptchaToken],
        'recaptchaToken',
      );
      console.debug('');

      await this.usersService.resetPassword(resetUsersProviderPasswordDto);

      return {
        success: true,
        message: Messages.SUCCESS_OPERATION,
      };
    } catch (error) {
      throw new RpcException(AppRpcErrorFormatter.format(error));
    }
  }

  // TEMPORRARY<
  @MessagePattern({ cmd: EUsersRoutes.findUsers })
  async findUsers(@Payload() data: { userId?: string }) {
    try {
      return await this.usersService.findUsers(data.userId);
    } catch (error) {
      throw new RpcException(AppRpcErrorFormatter.format(error));
    }
  }

  @MessagePattern({ cmd: EUsersRoutes.deleteUser })
  async deleteUser(@Payload() deleteUserDto: DeleteUserDto) {
    try {
      await this.usersService.deleteUser(deleteUserDto[EUsersParams.userId]);
      return {
        success: true,
        message: Messages.SUCCESS_USER_DELETED,
      };
    } catch (error) {
      throw new RpcException(AppRpcErrorFormatter.format(error));
    }
  }
  // TEMPORARY/>
}
