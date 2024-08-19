import {
  Injectable,
  Inject,
  UnauthorizedException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';
import {
  appConfig as _appConfig,
  BcryptService,
  EAuthParams,
  EDbEntityFields,
  EProvider,
  EUsersProviderFields,
  EUsersRoutes,
  IDbEntity,
  TAppConfig,
  TFindUserByEmailOrLoginQueryHandlerReturnType,
  UsersProviderDto,
} from '@app/shared';
import { firstValueFrom } from 'rxjs';
import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import { SessionService } from './session.service';

const config = _appConfig();

@Injectable()
export class AuthService {
  constructor(
    @Inject(_appConfig.KEY) private readonly appConfig: TAppConfig,
    @Inject(config.USERS_MICROSERVICE_NAME)
    private readonly usersClient: ClientProxy,
    private readonly jwtService: JwtService,
    private readonly sessionService: SessionService,
    private readonly bcryptService: BcryptService,
  ) {}

  async localSignup(signupDto: UsersProviderDto): Promise<any> {
    const newUser = await firstValueFrom(
      this.usersClient.send(
        { cmd: EUsersRoutes.createUser },
        { ...signupDto, [EUsersProviderFields.providerName]: EProvider.local },
      ),
    );
    return this.generateLocalAuthResponse(newUser, EProvider.local, true);
  }

  async localSignin(emailOrLogin: string, password: string): Promise<any> {
    const user = await this.validateUser(emailOrLogin, password);
    return this.generateLocalAuthResponse(user, EProvider.local);
  }

  async externalSignin(signupDto: UsersProviderDto): Promise<any> {
    const externalUser = await firstValueFrom(
      this.usersClient.send({ cmd: EUsersRoutes.createUser }, signupDto),
    );
    return this.generateLocalAuthResponse(
      externalUser,
      signupDto[EUsersProviderFields.providerName],
    );
  }

  async validateUser(emailOrLogin: string, password: string): Promise<any> {
    const usersProvider:
      | TFindUserByEmailOrLoginQueryHandlerReturnType
      | undefined = await firstValueFrom(
      this.usersClient.send(
        { cmd: EUsersRoutes.findUsersProviderByEmailOrLogin },
        { emailOrLogin },
      ),
    );
    if (
      usersProvider &&
      (await this.bcryptService.compare(password, usersProvider.password))
    ) {
      const {
        [EUsersProviderFields.password]: passord,
        [EUsersProviderFields.email]: email,
        [EUsersProviderFields.userLocalId]: userLocalId,
        [EDbEntityFields.id]: usersProviderLocalId,
        [EUsersProviderFields.emailIsValidated]: emailIsValidated,
      } = usersProvider;

      if (!emailIsValidated) {
        throw new ForbiddenException(
          'Email is not verified. Please verify your email before logging in.',
        );
      }

      return { [EDbEntityFields.id]: userLocalId };
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  private async generateLocalAuthResponse(
    user: IDbEntity,
    providerName: EProvider,
    isSignUp: boolean = false,
  ) {
    const deviceId = randomUUID();
    const token = this.generateToken(user.id, deviceId, providerName);
    if (!isSignUp) {
      await this.sessionService.createSession({
        _id: new Types.ObjectId(),
        userId: user.id,
        deviceId,
        token,
        providerName,
        expiresAt: new Date(Date.now() + this.appConfig.AUTH_TOKEN_EXPIRATION),
        isActive: true,
      });
    }
    return {
      [EAuthParams.accessToken]: token,
    };
  }

  async logout(token: string) {
    try {
      const decodedToken = this.jwtService.verify(token);
      const { sub: userId, deviceId } = decodedToken;
      const session = await this.sessionService.findSessionByUserIdAndDeviceId(
        userId,
        deviceId,
      );
      if (session) {
        await this.sessionService.deleteSession(session._id);
      }
    } catch (error) {
      throw new UnauthorizedException('Invalid token during logout');
    }
  }

  async rotateToken(oldToken: string) {
    const decodedToken = this.jwtService.verify(oldToken);
    const { sub: userId, deviceId, providerName } = decodedToken;

    const session = await this.sessionService.findSessionByUserIdAndDeviceId(
      userId,
      deviceId,
    );
    if (!session || session.token !== oldToken || !session.isActive) {
      throw new UnauthorizedException('Invalid session');
    }

    const newToken = this.generateToken(userId, deviceId, providerName);

    await this.sessionService.updateSession(session._id, {
      token: newToken,
      expiresAt: new Date(Date.now() + this.appConfig.AUTH_TOKEN_EXPIRATION),
    });

    return { [EAuthParams.accessToken]: newToken };
  }

  private generateToken(
    userId: string,
    deviceId: string,
    providerName: EProvider,
  ): string {
    return this.jwtService.sign(
      { sub: userId, deviceId, providerName },
      {
        secret: this.appConfig.AUTH_JWT_SECRET,
        expiresIn: this.appConfig.AUTH_TOKEN_EXPIRATION,
      },
    );
  }

  async validateToken(token: string): Promise<any> {
    try {
      const decodedToken = this.jwtService.verify(token);
      const session = await this.sessionService.findSessionByUserIdAndDeviceId(
        decodedToken.sub,
        decodedToken.deviceId,
      );
      if (!session || !session.isActive) {
        throw new UnauthorizedException('Invalid session');
      }
      return decodedToken;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async deleteAllUsersProviderSessions(
    userId: string,
    providerName: EProvider,
  ): Promise<void> {
    await this.sessionService.deleteAllUsersProviderSessions(
      userId,
      providerName,
    );
  }
}
