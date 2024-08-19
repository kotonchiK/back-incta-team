import {
  appConfig,
  DeleteUserDto,
  EDbEntityFields,
  ErrorResponseDto,
  EUsersParams,
  EUsersRoutes,
  ForgotUsersProviderPasswordDto,
  GetUsersResponseDto,
  Messages,
  ResetUsersProviderPasswordDto,
  SuccessResponseDto,
  TAppConfig,
} from '@app/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  InternalServerErrorException,
  Param,
  Post,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GatwayErrorInterceptor } from '../interceptors/gateway-errors.interceptor';
import { NonAuthGuard } from '../guards/non-auth.guard';

@ApiTags(EUsersRoutes.users)
@Controller(EUsersRoutes.users)
@UseInterceptors(GatwayErrorInterceptor)
export class UsersProxyController {
  constructor(
    @Inject(appConfig().USERS_MICROSERVICE_NAME)
    private usersClient: ClientProxy,
    @Inject(appConfig.KEY) private readonly config: TAppConfig,
  ) {}

  @ApiOperation({ summary: Messages.DESC_VERIFY_EMAIL })
  @ApiResponse({
    status: 302,
    description: Messages.SUCCESS_LOGIN,
  })
  @ApiResponse({
    status: 401,
    description: Messages.ERROR_INVALID_TOKEN,
    type: ErrorResponseDto,
  })
  @ApiParam({
    name: EUsersParams.token,
    type: 'string',
    description: Messages.DESC_EMAIL_VERIFICATION_TOKEN,
  })
  // TODO log this error
  @UseGuards(NonAuthGuard)
  @Get(`${EUsersRoutes.verifyEmailVerificationToken}/:${EUsersParams.token}`)
  async verifyEmail(
    @Param(EUsersParams.token) token: string,
    @Res() response: Response,
  ) {
    try {
      const result = await lastValueFrom(
        this.usersClient.send(
          { cmd: EUsersRoutes.verifyEmailVerificationToken },
          { token },
        ),
      );
      if (result && result.success === true) {
        return response.redirect(
          302,
          this.config.USERS_EMAIL_VERIFICATION_SUCCESS_PAGE_URL,
        );
      }
      if (result && result.success === false) {
        return response.redirect(
          302,
          this.config.USERS_EMAIL_VERIFICATION_ERROR_PAGE_URL,
        );
      }
      throw new InternalServerErrorException(Messages.ERROR_INTERNAL_SERVER);
    } catch (error) {
      console.debug('');
      console.debug('verifyEmail');
      console.debug(error.message);
      console.debug('');

      return response.redirect(
        500,
        this.config.USERS_EMAIL_VERIFICATION_ERROR_PAGE_URL,
      );
    }
  }

  @ApiOperation({ summary: Messages.DESC_REQUEST_PASSWORD_RESET })
  @ApiConsumes('application/json')
  @ApiConsumes('application/x-www-form-urlencoded')
  @ApiResponse({
    status: 200,
    description: Messages.SUCCESS_PASSWORD_RESET_EMAIL,
    type: SuccessResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: Messages.ERROR_USER_NOT_FOUND,
    type: ErrorResponseDto,
  })
  @ApiBody({ type: ForgotUsersProviderPasswordDto })
  @UseGuards(NonAuthGuard)
  @HttpCode(200)
  @Post(EUsersRoutes.forgotPassword)
  async forgotPassword(
    @Body() forgotUsersProviderPasswordDto: ForgotUsersProviderPasswordDto,
  ) {
    return lastValueFrom(
      this.usersClient.send(
        { cmd: EUsersRoutes.forgotPassword },
        forgotUsersProviderPasswordDto,
      ),
    );
  }

  @ApiOperation({ summary: Messages.DESC_RESET_PASSWORD })
  @ApiConsumes('application/json')
  @ApiConsumes('application/x-www-form-urlencoded')
  @ApiResponse({
    status: 200,
    description: Messages.SUCCESS_PASSWORD_RESET,
    type: SuccessResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: Messages.ERROR_INVALID_TOKEN,
    type: ErrorResponseDto,
  })
  @ApiBody({ type: ResetUsersProviderPasswordDto })
  @UseGuards(NonAuthGuard)
  @Post(`${EUsersRoutes.resetPassword}`)
  async resetPassword(
    @Body() resetUsersProviderPasswordDto: ResetUsersProviderPasswordDto,
  ) {
    return lastValueFrom(
      this.usersClient.send(
        { cmd: EUsersRoutes.resetPassword },
        resetUsersProviderPasswordDto,
      ),
    );
  }

  // TEMPORARY<
  @ApiOperation({ summary: Messages.DESC_GET_USERS })
  @ApiResponse({
    status: 200,
    description: Messages.SUCCESS_USERS_RETRIEVED,
    type: GetUsersResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: Messages.ERROR_USER_NOT_FOUND,
  })
  @ApiParam({
    name: EDbEntityFields.id,
    type: 'string',
    required: false,
    description: Messages.DESC_USER_ID_PARAM,
  })
  @HttpCode(200)
  @Get(`:${EDbEntityFields.id}`)
  async getUsers(@Param(EDbEntityFields.id) id?: string) {
    const _id = id?.endsWith('}') ? undefined : id;
    return lastValueFrom(
      this.usersClient.send({ cmd: EUsersRoutes.findUsers }, { userId: _id }),
    );
  }

  @ApiOperation({ summary: Messages.DESC_DELETE_USER })
  @ApiConsumes('application/json')
  @ApiConsumes('application/x-www-form-urlencoded')
  @ApiResponse({
    status: 200,
    description: Messages.SUCCESS_USER_DELETED,
    type: SuccessResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: Messages.ERROR_USER_NOT_FOUND,
    type: ErrorResponseDto,
  })
  @HttpCode(200)
  @Delete()
  async deleteUser(@Body() deleteUserDto: DeleteUserDto) {
    return lastValueFrom(
      this.usersClient.send({ cmd: EUsersRoutes.deleteUser }, deleteUserDto),
    );
  }
  // TEMPORARY/>
}
