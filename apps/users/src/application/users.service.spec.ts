import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import {
  EDbEntityFields,
  EUsersProviderFields,
  EProvider,
  appConfig,
  TAppConfig,
  ForgotUsersProviderPasswordDto,
  ResetUsersProviderPasswordDto,
  EUsersParams,
} from '@app/shared';
import { of } from 'rxjs';
import { UsersService } from './users.service';
import { UserFactory } from '../domain/factories/user.factory';
import { UsersProviderFactory } from '../domain/factories/users-provider.factory';
import { EmailNotifierService } from '../../../email-notifier/email-notifier.service';
import { FindUsersProviderQuery } from './queries/find-users-provider.query';
import { FindProviderQuery } from './queries/find-provider.query';
import { CreateUserCommand } from './commands/create-user.command';
import { User } from '../domain/user';
import { CreateUsersProviderCommand } from './commands/create-users-provider.command';

describe('UsersService', () => {
  let service: UsersService;
  let mockCommandBus: jest.Mocked<CommandBus>;
  let mockQueryBus: jest.Mocked<QueryBus>;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockAuthClient: jest.Mocked<ClientProxy>;
  let mockUserFactory: jest.Mocked<UserFactory>;
  let mockUsersProviderFactory: jest.Mocked<UsersProviderFactory>;
  let mockEmailNotifierService: jest.Mocked<EmailNotifierService>;
  let mockConfig: TAppConfig;

  beforeEach(async () => {
    mockConfig = {
      ...appConfig(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: CommandBus,
          useFactory: () => ({
            execute: jest.fn(),
          }),
        },
        {
          provide: QueryBus,
          useFactory: () => ({
            execute: jest.fn(),
          }),
        },
        {
          provide: JwtService,
          useFactory: () => ({
            sign: jest.fn(),
            verify: jest.fn(),
          }),
        },
        {
          provide: appConfig.KEY,
          useValue: mockConfig,
        },
        {
          provide: mockConfig.AUTH_MICROSERVICE_NAME,
          useFactory: () => ({
            send: jest.fn(),
          }),
        },
        {
          provide: UserFactory,
          useFactory: () => ({
            create: jest.fn(),
          }),
        },
        {
          provide: UsersProviderFactory,
          useFactory: () => ({
            create: jest.fn(),
            hashPassword: jest.fn(),
          }),
        },
        {
          provide: EmailNotifierService,
          useFactory: () => ({
            sendMail: jest.fn().mockResolvedValue(undefined),
          }),
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    mockCommandBus = module.get(CommandBus) as jest.Mocked<CommandBus>;
    mockQueryBus = module.get(QueryBus) as jest.Mocked<QueryBus>;
    mockJwtService = module.get(JwtService) as jest.Mocked<JwtService>;
    mockAuthClient = module.get(
      mockConfig.AUTH_MICROSERVICE_NAME,
    ) as jest.Mocked<ClientProxy>;
    mockUserFactory = module.get(UserFactory) as jest.Mocked<UserFactory>;
    mockUsersProviderFactory = module.get(
      UsersProviderFactory,
    ) as jest.Mocked<UsersProviderFactory>;
    mockEmailNotifierService = module.get(
      EmailNotifierService,
    ) as jest.Mocked<EmailNotifierService>;
  });

  describe('create', () => {
    it('should create a new local user when no existing user is found', async () => {
      const createUsersProviderCommand = {
        [EUsersProviderFields.providerName]: EProvider.local,
        [EUsersProviderFields.sub]: 'SUB',
        [EUsersProviderFields.email]: 'test@example.com',
        [EUsersProviderFields.login]: 'testuser',
        [EUsersProviderFields.name]: 'Test',
        [EUsersProviderFields.surname]: 'User',
        [EUsersProviderFields.password]: 'password123',
        [EUsersProviderFields.avatar]: 'https://example.com/avatar.jpg',
        [EUsersProviderFields.emailIsValidated]: false,
      };

      const mockUser = {
        [EDbEntityFields.id]: '1',
        getUsersProvider: jest.fn().mockReturnValue(createUsersProviderCommand),
        getProviderName: jest.fn().mockReturnValue(EProvider.local),
        setProviderLocalId: jest.fn(),
        isLocalProvider: jest.fn().mockReturnValue(true),
      } as unknown as User;

      const mockCreatedUser = {
        [EDbEntityFields.id]: '1',
      };

      mockQueryBus.execute.mockImplementation((query) => {
        if (query instanceof FindUsersProviderQuery) {
          return Promise.resolve(null);
        }
        if (query instanceof FindProviderQuery) {
          return Promise.resolve({ id: 'providerId' });
        }
        return undefined;
      });

      mockUserFactory.create.mockResolvedValue(mockUser);
      mockCommandBus.execute.mockResolvedValue(mockCreatedUser);
      mockEmailNotifierService.sendMail.mockResolvedValue(undefined);

      const result = await service.create(
        createUsersProviderCommand as CreateUsersProviderCommand,
      );

      expect(result).toEqual(mockCreatedUser);
      expect(mockUserFactory.create).toHaveBeenCalledWith(
        createUsersProviderCommand,
        undefined,
      );
      expect(mockQueryBus.execute).toHaveBeenCalledWith(
        expect.any(FindProviderQuery),
      );
      expect(mockUser.setProviderLocalId).toHaveBeenCalledWith('providerId');
      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        expect.any(CreateUserCommand),
      );
      expect(mockEmailNotifierService.sendMail).toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('should send reset password email', async () => {
      const dto: ForgotUsersProviderPasswordDto = {
        [EUsersProviderFields.emailOrLogin]: 'test@example.com',
        [EUsersProviderFields.recaptchaToken]: 'recaptcha-token',
      };

      const mockUser = {
        [EDbEntityFields.id]: 'userId',
        [EUsersProviderFields.email]: 'test@example.com',
      };

      mockCommandBus.execute.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('reset-token');
      mockEmailNotifierService.sendMail.mockResolvedValue(undefined);

      await service.forgotPassword(dto);

      expect(mockCommandBus.execute).toHaveBeenCalled();
      expect(mockJwtService.sign).toHaveBeenCalled();
      expect(mockEmailNotifierService.sendMail).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset user password', async () => {
      const dto: ResetUsersProviderPasswordDto = {
        [EUsersProviderFields.password]: 'newPassword123!',
        [EUsersProviderFields.repeatPassword]: 'newPassword123!',
        [EUsersParams.token]: 'valid-token',
        [EUsersProviderFields.recaptchaToken]: 'recaptcha-token',
      };

      const mockDecodedToken = { [EDbEntityFields.id]: 'userId' };
      mockJwtService.verify.mockReturnValue(mockDecodedToken);

      const mockUser = {
        [EDbEntityFields.id]: 'userId',
        [EUsersProviderFields.userLocalId]: 'userLocalId',
        [EUsersProviderFields.email]: 'test@example.com',
        [EUsersProviderFields.providerName]: EProvider.local,
      };

      mockQueryBus.execute.mockResolvedValue(mockUser);
      mockUsersProviderFactory.hashPassword.mockResolvedValue('hashedPassword');
      mockCommandBus.execute.mockResolvedValue(undefined);
      mockAuthClient.send.mockReturnValue(of(undefined));
      mockEmailNotifierService.sendMail.mockResolvedValue(undefined);

      await service.resetPassword(dto);

      expect(mockJwtService.verify).toHaveBeenCalled();
      expect(mockQueryBus.execute).toHaveBeenCalled();
      expect(mockUsersProviderFactory.hashPassword).toHaveBeenCalled();
      expect(mockCommandBus.execute).toHaveBeenCalled();
      expect(mockAuthClient.send).toHaveBeenCalled();
      expect(mockEmailNotifierService.sendMail).toHaveBeenCalled();
    });
  });
});
