import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  UnauthorizedException,
  Inject,
  Param,
  HttpCode,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  appConfig,
  EAuthParams,
  EAuthRoutes,
  EGatewayRoutes,
  EProvider,
  EUsersProviderFields,
  Messages,
  SigninDto,
  TAppConfig,
  UsersProviderDto,
} from '@app/shared';
import { Request, Response } from 'express';
import { lastValueFrom } from 'rxjs';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiExcludeEndpoint,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SuccessResponseDto } from '@app/shared/dto/responses.dto';
import { ErrorResponseDto } from '@app/shared/dto/error.dto';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { AuthGuard as NestAuthGuard } from '@nestjs/passport';
import { AuthGuard } from '../guards/auth.guard';
import { GatwayErrorInterceptor } from '../interceptors/gateway-errors.interceptor';
import { NonAuthGuard } from '../guards/non-auth.guard';

@ApiTags(EGatewayRoutes.auth)
@Controller(EGatewayRoutes.auth)
@UseInterceptors(GatwayErrorInterceptor)
export class AuthProxyController {
  constructor(
    @Inject(appConfig().AUTH_MICROSERVICE_NAME)
    private authClient: ClientProxy,
    @Inject(appConfig.KEY) private readonly config: TAppConfig,
  ) {}

  @ApiOperation({ summary: Messages.DESC_REGISTER_USER })
  @ApiConsumes('application/json')
  @ApiConsumes('application/x-www-form-urlencoded')
  @ApiBody({ type: UsersProviderDto })
  @ApiResponse({
    status: 200,
    description: Messages.SUCCESS_REGISTRATION,
    type: SuccessResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: Messages.ERROR_BAD_REQUEST,
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: Messages.ERROR_CONFLICT_USER_EXISTS,
    type: ErrorResponseDto,
  })
  @UseGuards(NonAuthGuard)
  @HttpCode(200)
  @Post(`${EAuthRoutes.local}/${EAuthRoutes.signup}`)
  async localSignup(@Body() signupDto: UsersProviderDto) {
    const result = await lastValueFrom(
      this.authClient.send(
        { cmd: `${EAuthRoutes.local}/${EAuthRoutes.signup}` },
        signupDto,
      ),
    );
    const registered = !!result?.[EAuthParams.accessToken];

    return {
      success: registered,
      message: registered
        ? Messages.SUCCESS_REGISTRATION
        : Messages.ERROR_REGISRATION_FAILED,
    };
  }

  @ApiOperation({ summary: Messages.DESC_AUTHENTICATE_USER })
  @ApiConsumes('application/json')
  @ApiConsumes('application/x-www-form-urlencoded')
  @ApiBody({ type: SigninDto })
  @ApiResponse({
    status: 200,
    description: Messages.SUCCESS_LOGIN,
    type: SuccessResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: Messages.ERROR_UNAUTHORIZED,
    type: ErrorResponseDto,
  })
  @UseGuards(NonAuthGuard)
  @HttpCode(200)
  @Post(`${EAuthRoutes.local}/${EAuthRoutes.signin}`)
  async localSignin(
    @Body() signinDto: SigninDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await lastValueFrom(
      this.authClient.send(
        { cmd: `${EAuthRoutes.local}/${EAuthRoutes.signin}` },
        signinDto,
      ),
    );
    if (result[EAuthParams.accessToken]) {
      response.cookie(
        EAuthParams.accessToken,
        result[EAuthParams.accessToken],
        await this.getCookiesParameters(),
      );
    }

    return { success: true, message: Messages.SUCCESS_LOGIN };
  }

  @ApiOperation({ summary: Messages.DESC_EXTERNAL_AUTH })
  @ApiConsumes('application/json')
  @ApiConsumes('application/x-www-form-urlencoded')
  @ApiResponse({
    status: 302,
  })
  @ApiResponse({
    status: 400,
    description: Messages.ERROR_BAD_REQUEST,
  })
  @ApiParam({
    required: true,
    name: EAuthParams.provider,
    enum: [EProvider.google, EProvider.github],
    description: Messages.DESC_PROVIDER_PARAM,
  })
  @ApiQuery({
    name: EUsersProviderFields.agreement,
    required: true,
    type: 'string',
    description: Messages.DESC_AGREEMENT_PARAM,
    schema: {
      default: '1',
    } as SchemaObject,
  })
  @UseGuards(NonAuthGuard)
  @Get(`${EAuthRoutes.external}/:${EAuthParams.provider}`)
  async externalSignin(
    @Param(EAuthParams.provider) provider: EProvider,
    @Query(EUsersProviderFields.agreement) agreement: string,
    @Res({ passthrough: true }) response: Response,
  ) {
    if (!agreement) {
      return response.redirect(400, this.config.USERS_LOGIN_PAGE_URL);
    }
    if (provider === EProvider.google) {
      return response.redirect(`./${EAuthRoutes.signin}/${EProvider.google}`);
    }
    if (provider === EProvider.github) {
      return response.redirect(`./${EAuthRoutes.signin}/${EProvider.github}`);
    }
    return response.redirect(400, this.config.USERS_LOGIN_PAGE_URL);
  }

  @ApiExcludeEndpoint()
  @Get(`/${EAuthRoutes.external}/${EAuthRoutes.signin}/${EProvider.google}`)
  @UseGuards(NestAuthGuard(EProvider.google))
  async googleAuth(@Req() request: Request) {}

  @ApiExcludeEndpoint()
  @Get(
    `/${EAuthRoutes.external}/${EAuthRoutes.signin}/${EProvider.google}/${EAuthRoutes.callback}`,
  )
  @UseGuards(NestAuthGuard(EProvider.google))
  async googleCallback(@Req() request: Request, @Res() response: Response) {
    return this.handleExternalCallback(request, response, EProvider.google);
  }

  @ApiExcludeEndpoint()
  @Get(`/${EAuthRoutes.external}/${EAuthRoutes.signin}/${EProvider.github}`)
  @UseGuards(NestAuthGuard(EProvider.github))
  async githubAuth(@Req() request: Request) {}

  @ApiExcludeEndpoint()
  @Get(
    `/${EAuthRoutes.external}/${EAuthRoutes.signin}/${EProvider.github}/${EAuthRoutes.callback}`,
  )
  @UseGuards(NestAuthGuard(EProvider.github))
  async githubCallback(@Req() request: Request, @Res() response: Response) {
    return this.handleExternalCallback(request, response, EProvider.github);
  }

  private async handleExternalCallback(
    request: Request,
    response: Response,
    provider: EProvider,
  ) {
    const { accessToken, refreshToken, ...usersProvider } = request.user as any;
    const result = await lastValueFrom(
      this.authClient.send(
        { cmd: `${EAuthRoutes.external}/:${EAuthParams.provider}` },
        usersProvider,
      ),
    );
    if (result[EAuthParams.accessToken]) {
      response.cookie(
        EAuthParams.accessToken,
        result[EAuthParams.accessToken],
        await this.getCookiesParameters(),
      );
      return response.redirect(this.config.USERS_LOGIN_PAGE_URL);
    }
    return response.redirect(401, this.config.USERS_LOGIN_PAGE_URL);
  }

  private async getCookiesParameters() {
    return {
      domain:
        this.config.NODE_ENV === 'production'
          ? `.${this.config.APP_MAIN_DOMAIN}`
          : `.localhost`,
      path: '/',
      httpOnly: true,
      secure: this.config.NODE_ENV === 'production',
    };
  }

  @ApiOperation({ summary: Messages.DESC_LOGOUT })
  @ApiCookieAuth(EAuthParams.accessToken)
  @ApiResponse({
    status: 200,
    description: Messages.SUCCESS_LOGOUT,
    type: SuccessResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: Messages.ERROR_UNAUTHORIZED,
    type: ErrorResponseDto,
  })
  @UseGuards(AuthGuard)
  @HttpCode(200)
  @Post(EAuthRoutes.logout)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = request.cookies[EAuthParams.accessToken];
    await lastValueFrom(
      this.authClient.send({ cmd: EAuthRoutes.logout }, token),
    );
    response.clearCookie(EAuthParams.accessToken);

    return { success: true, message: Messages.SUCCESS_LOGOUT };
  }

  @ApiOperation({ summary: Messages.DESC_ROTATE_TOKEN })
  @ApiCookieAuth(EAuthParams.accessToken)
  @ApiResponse({
    status: 200,
    description: Messages.SUCCESS_TOKEN_ROTATION,
    type: SuccessResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: Messages.ERROR_INVALID_TOKEN,
    type: ErrorResponseDto,
  })
  @UseGuards(AuthGuard)
  @HttpCode(200)
  @Post(EAuthRoutes.rotateToken)
  async rotateToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = request.cookies[EAuthParams.accessToken];
    if (!token) {
      throw new UnauthorizedException(Messages.ERROR_INVALID_TOKEN);
    }
    const result = await lastValueFrom(
      this.authClient.send({ cmd: EAuthRoutes.rotateToken }, token),
    );
    if (result[EAuthParams.accessToken]) {
      response.cookie(
        EAuthParams.accessToken,
        result[EAuthParams.accessToken],
        await this.getCookiesParameters(),
      );
    }

    return { success: true, message: Messages.SUCCESS_TOKEN_ROTATION };
  }
}
