import {
  EDbEntityFields,
  EProvider,
  EProviderFields,
  EUserFields,
  EUsersProviderFields,
  IUser,
  appConfig as _appConfig,
  TAppConfig,
  IUsersProvider,
  EUsersRoutes,
  EGatewayRoutes,
  TFindUserByEmailOrLoginQueryHandlerReturnType,
  ForgotUsersProviderPasswordDto,
  ResetUsersProviderPasswordDto,
  EUsersParams,
  EAuthRoutes,
} from '@app/shared';
import {
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { EmailNotifierService } from '../../../email-notifier/email-notifier.service';
import { CreateUsersProviderCommand } from './commands/create-users-provider.command';
import { UserFactory } from '../domain/factories/user.factory';
import { CreateUserCommand } from './commands/create-user.command';
import { FindUsersProviderQuery } from './queries/find-users-provider.query';
import { FindProviderQuery } from './queries/find-provider.query';
import { UpdateUsersProviderCommand } from './commands/update-users-provider.command';
import { User } from '../domain/user';
import { ConfirmUsersLocalProviderEmailCommand } from './commands/confirm-users-local-provider-email-command';
import { FindUsersProviderByEmailOrLoginQuery } from './queries/find-users-provider-by-email-or-login.query';
import { UsersProviderFactory } from '../domain/factories/users-provider.factory';
import { DeleteUserCommand } from './commands/delete-user.command';
import { FindUsersQuery } from './queries/find-users.query';

const config = _appConfig();

@Injectable()
export class UsersService {
  constructor(
    @Inject(_appConfig.KEY)
    private readonly appConfig: TAppConfig,
    private readonly userFactory: UserFactory,
    private readonly usersProviderFactory: UsersProviderFactory,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly jwtService: JwtService,
    @Inject(config.AUTH_MICROSERVICE_NAME)
    private readonly authClient: ClientProxy,
    private readonly emailNotifierService: EmailNotifierService,
  ) {}

  // RETURNS PASSWORD & EMAIL
  async findUsersProviderByEmailOrLogin(
    emailOrLogin: string,
  ): Promise<TFindUserByEmailOrLoginQueryHandlerReturnType | undefined> {
    return this.commandBus.execute(
      new FindUsersProviderByEmailOrLoginQuery(emailOrLogin),
    );
  }

  async create(
    usersProvider: CreateUsersProviderCommand,
  ): Promise<Omit<IUser, EUserFields.providers>> {
    const existingWithEmailUsersProvider = await this.queryBus.execute(
      // should search for the 'local' first <- this is a required condition
      new FindUsersProviderQuery({
        [EUsersProviderFields.email]: usersProvider[EUsersProviderFields.email],
      }),
    );
    const user = await this.userFactory.create(
      usersProvider,
      existingWithEmailUsersProvider?.[EUsersProviderFields.userLocalId],
    );
    const provider = await this.queryBus.execute(
      new FindProviderQuery(user.getProviderName()),
    );
    user.setProviderLocalId(provider.id);
    const newUsersProvider = user.getUsersProvider();
    if (user.isLocalProvider()) {
      return this.createUserWithUsersLocalProviderOrUpdateUsersLocalProvider(
        user,
        newUsersProvider,
        existingWithEmailUsersProvider,
      );
    }
    return this.createUserWithUsersExternalProviderOrUpdateUsersExternalProvider(
      user,
      newUsersProvider,
      existingWithEmailUsersProvider,
    );
  }

  private async addUsersProviderToExistingUser(
    user: User,
    newUsersProvider: IUsersProvider,
    existingUsersProvider: IUsersProvider,
  ): Promise<Omit<IUser, EUserFields.providers>> {
    const createUsersProviderCommand = new CreateUsersProviderCommand(
      user.getProviderName(),
      newUsersProvider[EUsersProviderFields.sub],
      newUsersProvider[EUsersProviderFields.email],
      newUsersProvider[EUsersProviderFields.login],
      newUsersProvider[EUsersProviderFields.name],
      newUsersProvider[EUsersProviderFields.surname],
      newUsersProvider[EUsersProviderFields.password],
      newUsersProvider[EUsersProviderFields.avatar],
      newUsersProvider[EUsersProviderFields.emailIsValidated],
      existingUsersProvider[EUsersProviderFields.userLocalId],
    );
    await this.commandBus.execute(createUsersProviderCommand);
    return {
      [EDbEntityFields.id]:
        existingUsersProvider[EUsersProviderFields.userLocalId],
    };
  }

  private async updateUsersProvider(
    usersProviderId: string,
    newUsersProvider: IUsersProvider,
    fields: EUsersProviderFields[],
  ): Promise<void> {
    const updateData = fields.reduce((acc, field) => {
      acc[field] = newUsersProvider[field];
      return acc;
    }, {} as Partial<IUsersProvider>);

    await this.commandBus.execute(
      new UpdateUsersProviderCommand(usersProviderId, updateData),
    );
  }

  private async createUserWithUsersLocalProviderOrUpdateUsersLocalProvider(
    user: User,
    newUsersProvider: IUsersProvider,
    existingWithEmailUsersProvider: IUsersProvider,
  ): Promise<Omit<IUser, EUserFields.providers>> {
    // mail does not exist

    // should send verification email
    // should update -> !existingWithEmailUsersProvider<local> && login exists && !emailIsValidated

    // should send verification email if it did not throw
    // should throw -> !existingWithEmailUsersProvider<local> && login exists && emailIsValidated || !email && !login && will add

    // mail exists

    // mail exists with local

    // should throw -> existingWithEmailUsersProvider<local> && emailIsValidated

    // should send verification email
    // should update -> existingWithEmailUsersProvider<local> && !emailIsValidated

    // mail exists with external

    // console.log('should throw -> existingWithLoginUsersProvider && emailIsValidated')

    // should send verification email
    // console.log('should update -> existingWithLoginUsersProvider && !emailIsValidated')

    // should add -> local does not exist
    // should send verification email

    const existingWithLoginUsersProvider = await this.queryBus.execute(
      new FindUsersProviderQuery({
        [EUsersProviderFields.login]:
          newUsersProvider[EUsersProviderFields.login],
      }),
    );

    // mail does not exist
    if (!existingWithEmailUsersProvider) {
      // login exists
      if (
        existingWithLoginUsersProvider &&
        !existingWithLoginUsersProvider[EUsersProviderFields.emailIsValidated]
      ) {
        // and login unconfirmed
        // console.log('should update -> login exists && !emailIsValidated')
        await this.updateUsersProvider(
          existingWithLoginUsersProvider[EDbEntityFields.id],
          newUsersProvider,
          [
            EUsersProviderFields.email,
            EUsersProviderFields.name,
            EUsersProviderFields.surname,
            EUsersProviderFields.password,
            EUsersProviderFields.avatar,
          ],
        );
        // should send verification email
        await this.sendVerificationEmailToVerifyProviderEmail(
          existingWithLoginUsersProvider[EDbEntityFields.id],
          newUsersProvider[EUsersProviderFields.email],
        );

        return {
          [EDbEntityFields.id]:
            existingWithLoginUsersProvider[EUsersProviderFields.userLocalId],
        };
      }

      // login does not exists or login confirmed
      // console.log('should throw -> login exists || !email && !login && will create UsersProvider<local>')
      const createdUser = await this.commandBus.execute(
        new CreateUserCommand(user),
      );
      // should send verification email if it did not throw
      await this.sendVerificationEmailToVerifyProviderEmail(
        newUsersProvider[EDbEntityFields.id],
        newUsersProvider[EUsersProviderFields.email],
      );

      return {
        [EDbEntityFields.id]: createdUser[EDbEntityFields.id],
      };
    }

    // mail exists
    // should be always selected with local first!
    const existingWithEmailUsersProviderProviderName =
      existingWithEmailUsersProvider[EUsersProviderFields.provider][
        EProviderFields.name
      ];

    // mail exists with local
    if (existingWithEmailUsersProviderProviderName === EProvider.local) {
      const emailIsValidated =
        existingWithEmailUsersProvider[EUsersProviderFields.emailIsValidated];
      if (emailIsValidated) {
        // console.log('should throw -> existingWithEmailUsersProvider<local> && emailIsValidated')
        return this.commandBus.execute(new CreateUserCommand(user));
      }
      // console.log('should update -> existingWithEmailUsersProvider<local> && !emailIsValidated')
      await this.updateUsersProvider(
        existingWithEmailUsersProvider[EDbEntityFields.id],
        newUsersProvider,
        [
          EUsersProviderFields.email,
          EUsersProviderFields.login,
          EUsersProviderFields.name,
          EUsersProviderFields.surname,
          EUsersProviderFields.password,
          EUsersProviderFields.avatar,
        ],
      );
      // should send verification email
      await this.sendVerificationEmailToVerifyProviderEmail(
        existingWithEmailUsersProvider[EDbEntityFields.id],
        newUsersProvider[EUsersProviderFields.email],
      );

      return {
        [EDbEntityFields.id]:
          existingWithEmailUsersProvider[EUsersProviderFields.userLocalId],
      };
    }

    // mail exists with external
    if (existingWithLoginUsersProvider) {
      const emailIsValidated =
        existingWithLoginUsersProvider[EUsersProviderFields.emailIsValidated];
      if (emailIsValidated) {
        // console.log('should throw -> existingWithEmailUsersProvider<local> && emailIsValidated')
        return this.commandBus.execute(new CreateUserCommand(user));
      }
      // console.log('should update -> existingWithLoginUsersProvider<local> && !emailIsValidated')
      await this.updateUsersProvider(
        existingWithLoginUsersProvider[EDbEntityFields.id],
        newUsersProvider,
        [
          EUsersProviderFields.email,
          EUsersProviderFields.login,
          EUsersProviderFields.name,
          EUsersProviderFields.surname,
          EUsersProviderFields.password,
          EUsersProviderFields.avatar,
        ],
      );
      // should send verification email
      await this.sendVerificationEmailToVerifyProviderEmail(
        existingWithLoginUsersProvider[EDbEntityFields.id],
        newUsersProvider[EUsersProviderFields.email],
      );

      return {
        [EDbEntityFields.id]:
          existingWithLoginUsersProvider[EUsersProviderFields.userLocalId],
      };
    }

    // should add -> local does not exist
    const result = this.addUsersProviderToExistingUser(
      user,
      newUsersProvider,
      existingWithEmailUsersProvider,
    );
    // should send verification email
    await this.sendVerificationEmailToVerifyProviderEmail(
      newUsersProvider[EDbEntityFields.id],
      newUsersProvider[EUsersProviderFields.email],
    );

    return result;
  }

  private generateEmailVerificationToken(
    newUsersLocalProviderId: string,
  ): string {
    return this.jwtService.sign(
      { [EDbEntityFields.id]: newUsersLocalProviderId },
      {
        secret: this.appConfig.AUTH_JWT_SECRET,
        expiresIn: this.appConfig.USERS_EMAIL_CONFIRMATION_TTL / 1000,
      },
    );
  }

  async verifyEmailVerificationToken(token: string): Promise<boolean> {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: this.appConfig.AUTH_JWT_SECRET,
      });

      const usersProvider = await this.queryBus.execute(
        new FindUsersProviderQuery({
          [EDbEntityFields.id]: decoded[EDbEntityFields.id],
        }),
      );
      if (!usersProvider) {
        return false;
      }
      await this.commandBus.execute(
        new ConfirmUsersLocalProviderEmailCommand(decoded[EDbEntityFields.id]),
      );
      await this.sendEmailHasBeenVerified(
        usersProvider[EUsersProviderFields.email],
      );

      return true;
    } catch (error) {
      return false;
    }
  }

  // TODO<
  private async addEMailToQueue(
    email: string,
    message: string,
    subject: string,
  ): Promise<any> {
    // TODO
    // add email to queue
    await this.emailNotifierService
      .sendMail({
        to: email,
        subject,
        html: `<html><body>${message}</body></html>`,
      })
      .then(() => {
        console.debug('');
        console.debug(`addEMailToQueue email to: ${email} has been sent `);
      })
      .catch((error) => {
        console.debug('');
        console.debug(
          `addEMailToQueue email to: ${email} has NOT been sent , error: ${error.message}`,
        );
      });
  }

  private async sendVerificationEmailToVerifyProviderEmail(
    usersProviderId: string,
    email: string,
  ): Promise<void> {
    const verificationToken =
      this.generateEmailVerificationToken(usersProviderId);
    const basePath =
      this.appConfig.NODE_ENV === 'production'
        ? `https://${EGatewayRoutes.gateway}.${this.appConfig.APP_MAIN_DOMAIN}`
        : `http://localhost:${this.appConfig.GATEWAY_MICROSERVICE_PORT}`;
    const url = `${basePath}/${this.appConfig.APP_API_PREFIX}/${EUsersRoutes.users}/${EUsersRoutes.verifyEmailVerificationToken}/${verificationToken}`;
    const message = `
        <div>Please follow this link to verify your email address</div>
        <div>
            <a href="${url}" target="_blank">Verify email</a>
        </div>
        <div>Current time is: ${Date.now()}</div>
        <div>The link expires at ${Date.now() + this.appConfig.USERS_EMAIL_CONFIRMATION_TTL}</div>
    `;
    await this.addEMailToQueue(email, message, 'verify your email');
  }

  private async sendEmailHasBeenVerified(email: string): Promise<void> {
    const message = `
        <div>Hi there, you have successfully verified your email and signed up</div>
    `;
    await this.addEMailToQueue(email, message, 'success');
  }

  private async sendExternalSignUpSuccess(email: string): Promise<void> {
    const message = `
        <div>Hi there, you have successfully signed up</div>
    `;
    await this.addEMailToQueue(email, message, 'success');
  }

  private async sendResetPasswordEmail(
    usersProviderId: string,
    email: string,
  ): Promise<void> {
    const token = this.generatePasswordResetToken(usersProviderId);
    const url = `https://incta.team/auth/reset-password/${token}`;
    const message = `
        <div>Please follow this link to reset your password</div>
        <div>
            <a href="${url}" target="_blank">Reset password</a>
        </div>
        <div>Current time is: ${Date.now()}</div>
        <div>Please copmplete your password recovery before: ${Date.now() + this.appConfig.USERS_PASSWORD_RESET_TOKEN_TTL / 1000} </div>
    `;
    await this.addEMailToQueue(email, message, 'reset your password');
  }

  private async sendPasswordWasChangedEmail(email: string): Promise<void> {
    const message = `
        <div>Your password has been succesfully changed.</div>
    `;
    await this.addEMailToQueue(email, message, 'password changed');
  }
  // TODO/>

  async forgotPassword(
    forgotUsersProviderPasswordDto: ForgotUsersProviderPasswordDto,
  ): Promise<void> {
    const usersProvider = await this.findUsersProviderByEmailOrLogin(
      forgotUsersProviderPasswordDto[EUsersProviderFields.emailOrLogin],
    );
    if (!usersProvider) {
      throw new NotFoundException('User not found');
    }
    await this.sendResetPasswordEmail(
      usersProvider[EDbEntityFields.id],
      usersProvider[EUsersProviderFields.email],
    );
  }

  async resetPassword(
    resetUsersProviderPasswordDto: ResetUsersProviderPasswordDto,
  ): Promise<void> {
    const decoded = this.verifyPasswordResetToken(
      resetUsersProviderPasswordDto[EUsersParams.token],
    );
    if (!decoded) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    const usersProvider = await this.queryBus.execute(
      new FindUsersProviderQuery({
        [EDbEntityFields.id]: decoded[EDbEntityFields.id],
      }),
    );
    if (!usersProvider) {
      throw new NotFoundException('User not found');
    }
    await this.updateUsersProviderPassword(
      decoded[EDbEntityFields.id],
      resetUsersProviderPasswordDto[EUsersProviderFields.password],
    );
    await firstValueFrom(
      this.authClient.send(
        { cmd: EAuthRoutes.deleteAllUsersProviderSessions },
        {
          userId: usersProvider[EUsersProviderFields.userLocalId],
          providerName: usersProvider[EUsersProviderFields.providerName],
        },
      ),
    );
    await this.sendPasswordWasChangedEmail(
      usersProvider[EUsersProviderFields.email],
    );
  }

  private generatePasswordResetToken(usersProviderLocalId: string): string {
    return this.jwtService.sign(
      { [EDbEntityFields.id]: usersProviderLocalId },
      {
        secret: this.appConfig.USERS_JWT_SECRET,
        expiresIn: this.appConfig.USERS_PASSWORD_RESET_TOKEN_TTL / 1000,
      },
    );
  }

  private verifyPasswordResetToken(
    token: string,
  ): { [EDbEntityFields.id]: string } | undefined {
    try {
      return this.jwtService.verify(token, {
        secret: this.appConfig.USERS_JWT_SECRET,
      });
    } catch (error) {
      return undefined;
    }
  }

  async updateUsersProviderPassword(
    usersProviderId: string,
    newPassword: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdateUsersProviderCommand(usersProviderId, {
        [EUsersProviderFields.password]:
          await this.usersProviderFactory.hashPassword(newPassword),
      }),
    );
  }

  private async createUserWithUsersExternalProviderOrUpdateUsersExternalProvider(
    user: User,
    newUsersProvider: IUsersProvider,
    existingWithEmailUsersProvider: IUsersProvider,
  ): Promise<Omit<IUser, EUserFields.providers>> {
    // external
    // email+provider && will update
    // sub+provider && will update
    // sub || provider email <- does not exist <- will add to existing
    // external does not exist -> will add

    const existingWithEmailAndProviderUsersProvider =
      await this.queryBus.execute(
        new FindUsersProviderQuery({
          [EUsersProviderFields.sub]:
            newUsersProvider[EUsersProviderFields.sub],
          [EUsersProviderFields.email]:
            newUsersProvider[EUsersProviderFields.email],
          [EUsersProviderFields.providerLocalId]:
            newUsersProvider[EUsersProviderFields.providerLocalId],
        }),
      );
    // email+provider && update
    if (existingWithEmailAndProviderUsersProvider) {
      await this.updateUsersProvider(
        existingWithEmailAndProviderUsersProvider[EDbEntityFields.id],
        newUsersProvider,
        [
          EUsersProviderFields.name,
          EUsersProviderFields.surname,
          EUsersProviderFields.password,
          EUsersProviderFields.avatar,
        ],
      );

      return {
        [EDbEntityFields.id]:
          existingWithEmailAndProviderUsersProvider[
            EUsersProviderFields.userLocalId
          ],
      };
    }

    const existingWithProviderIdUsersProvider = await this.queryBus.execute(
      new FindUsersProviderQuery({
        [EUsersProviderFields.sub]: newUsersProvider[EUsersProviderFields.sub],
        [EUsersProviderFields.providerLocalId]:
          newUsersProvider[EUsersProviderFields.providerLocalId],
      }),
    );
    // sub+provider && update
    if (existingWithProviderIdUsersProvider) {
      await this.updateUsersProvider(
        existingWithProviderIdUsersProvider[EDbEntityFields.id],
        newUsersProvider,
        [
          EUsersProviderFields.email,
          EUsersProviderFields.login,
          EUsersProviderFields.name,
          EUsersProviderFields.surname,
          EUsersProviderFields.password,
          EUsersProviderFields.avatar,
        ],
      );

      return {
        [EDbEntityFields.id]:
          existingWithProviderIdUsersProvider[EUsersProviderFields.userLocalId],
      };
    }

    // sub || provider email <- does not exist <- adds to existing
    if (existingWithEmailUsersProvider) {
      return this.addUsersProviderToExistingUser(
        user,
        newUsersProvider,
        existingWithEmailUsersProvider,
      );
    }

    // external does not exist -> will add
    const result = await this.commandBus.execute(new CreateUserCommand(user));
    await this.sendExternalSignUpSuccess(
      newUsersProvider[EUsersProviderFields.email],
    );

    return result;
  }

  // TEMPORRARY<
  async findUsers(userId?: string) {
    return this.queryBus.execute(new FindUsersQuery(userId));
  }

  async deleteUser(userId: string) {
    return this.commandBus.execute(new DeleteUserCommand(userId));
  }
  // TEMPORARY/>
}
