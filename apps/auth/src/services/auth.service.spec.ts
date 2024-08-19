import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';
import { of } from 'rxjs';
import {
  EProvider,
  EUsersProviderFields,
  appConfig,
  TAppConfig,
  UsersProviderDto,
  EDbEntityFields,
  BcryptService,
} from '@app/shared';
import { createMockAppConfig } from '@app/shared/tests/mocks/app-config.mock';
import { Type } from '@nestjs/common';
import mongoose, { ObjectId } from 'mongoose';
import { SessionService } from './session.service';
import { AuthService } from './auth.service';
import { Session } from '../schemas/session.schema';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<JwtService>;
  let sessionService: jest.Mocked<SessionService>;
  let usersClient: jest.Mocked<ClientProxy>;
  let bcryptService: jest.Mocked<BcryptService>;
  let mockConfig: TAppConfig;

  beforeEach(async () => {
    mockConfig = createMockAppConfig();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useFactory: () => ({
            sign: jest.fn(),
            verify: jest.fn(),
          }),
        },
        {
          provide: SessionService,
          useFactory: () => ({
            createSession: jest.fn(),
            findSessionByUserIdAndDeviceId: jest.fn(),
            deleteSession: jest.fn(),
            updateSession: jest.fn(),
            deleteAllUsersProviderSessions: jest.fn(),
          }),
        },
        {
          provide: mockConfig.USERS_MICROSERVICE_NAME,
          useFactory: () => ({
            send: jest.fn(),
          }),
        },
        {
          provide: BcryptService,
          useFactory: () => ({
            compare: jest.fn(),
          }),
        },
        {
          provide: appConfig.KEY,
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get(JwtService);
    sessionService = module.get(SessionService);
    usersClient = module.get(mockConfig.USERS_MICROSERVICE_NAME);
    bcryptService = module.get(BcryptService);
  });

  describe('localSignup', () => {
    it('should create a new user and return access token', async () => {
      const signupDto: Partial<UsersProviderDto> = {
        [EUsersProviderFields.providerName]: EProvider.local,
        [EUsersProviderFields.email]: 'test@example.com',
        [EUsersProviderFields.login]: 'testuser',
        [EUsersProviderFields.name]: 'Test',
        [EUsersProviderFields.surname]: 'User',
        [EUsersProviderFields.password]: 'Password123!',
        [EUsersProviderFields.repeatPassword]: 'Password123!',
        [EUsersProviderFields.agreement]: 'agreed',
        [EUsersProviderFields.avatar]: 'https://example.com/avatar.jpg',
        [EUsersProviderFields.emailIsValidated]: false,
      };

      const mockUser = { [EDbEntityFields.id]: 'userId' };
      usersClient.send.mockReturnValue(of(mockUser));
      jwtService.sign.mockReturnValue('mockToken');

      const result = await service.localSignup(
        signupDto as Required<typeof signupDto>,
      );

      expect(usersClient.send).toHaveBeenCalledWith(
        { cmd: 'create-user' },
        signupDto,
      );
      expect(jwtService.sign).toHaveBeenCalled();
      expect(result).toEqual({ 'access-token': 'mockToken' });
    });
  });

  describe('localSignin', () => {
    it('should authenticate user and return access token', async () => {
      const emailOrLogin = 'test@example.com';
      const password = 'password';

      const mockUser = {
        [EDbEntityFields.id]: 'userId',
        [EUsersProviderFields.password]: 'hashedPassword',
        [EUsersProviderFields.emailIsValidated]: true,
      };

      usersClient.send.mockReturnValue(of(mockUser));
      bcryptService.compare.mockResolvedValue(true);
      jwtService.sign.mockReturnValue('mockToken');
      sessionService.createSession.mockResolvedValue(undefined);

      const result = await service.localSignin(emailOrLogin, password);

      expect(usersClient.send).toHaveBeenCalled();
      expect(bcryptService.compare).toHaveBeenCalledWith(
        password,
        'hashedPassword',
      );
      expect(jwtService.sign).toHaveBeenCalled();
      expect(sessionService.createSession).toHaveBeenCalled();
      expect(result).toEqual({ 'access-token': 'mockToken' });
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      const emailOrLogin = 'test@example.com';
      const password = 'wrongpassword';

      usersClient.send.mockReturnValue(of(null));

      await expect(service.localSignin(emailOrLogin, password)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('logout', () => {
    it('should delete the session', async () => {
      const token = 'validToken';
      const decodedToken = { sub: 'userId', deviceId: 'deviceId' };

      jwtService.verify.mockReturnValue(decodedToken);
      const sessionId = new mongoose.Types.ObjectId();
      sessionService.findSessionByUserIdAndDeviceId.mockResolvedValue({
        _id: sessionId,
      } as Session);

      await service.logout(token);

      expect(jwtService.verify).toHaveBeenCalledWith(token);
      expect(
        sessionService.findSessionByUserIdAndDeviceId,
      ).toHaveBeenCalledWith('userId', 'deviceId');
      expect(sessionService.deleteSession).toHaveBeenCalledWith(sessionId);
    });
  });

  describe('rotateToken', () => {
    it('should rotate the token and update the session', async () => {
      const oldToken = 'oldToken';
      const decodedToken = { sub: 'userId', deviceId: 'deviceId' };
      const session = {
        _id: new mongoose.Types.ObjectId(),
        token: oldToken,
        isActive: true,
        deviceId: 'deviceId',
        userId: 'userId',
        expiresAt: new Date(),
        providerName: EProvider.local,
      };

      jwtService.verify.mockReturnValue(decodedToken);
      sessionService.findSessionByUserIdAndDeviceId.mockResolvedValue(session);
      jwtService.sign.mockReturnValue('newToken');

      const result = await service.rotateToken(oldToken);

      expect(jwtService.verify).toHaveBeenCalledWith(oldToken);
      expect(
        sessionService.findSessionByUserIdAndDeviceId,
      ).toHaveBeenCalledWith('userId', 'deviceId');
      expect(jwtService.sign).toHaveBeenCalled();
      expect(sessionService.updateSession).toHaveBeenCalled();
      expect(result).toEqual({ 'access-token': 'newToken' });
    });
  });

  describe('validateToken', () => {
    it('should validate the token', async () => {
      const token = 'validToken';
      const decodedToken = { sub: 'userId', deviceId: 'deviceId' };

      jwtService.verify.mockReturnValue(decodedToken);
      sessionService.findSessionByUserIdAndDeviceId.mockResolvedValue({
        isActive: true,
      } as Session);

      const result = await service.validateToken(token);

      expect(jwtService.verify).toHaveBeenCalledWith(token);
      expect(
        sessionService.findSessionByUserIdAndDeviceId,
      ).toHaveBeenCalledWith('userId', 'deviceId');
      expect(result).toEqual(decodedToken);
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      const token = 'invalidToken';

      jwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.validateToken(token)).rejects.toThrow(
        'Invalid token',
      );
    });
  });

  describe('deleteAllUsersProviderSessions', () => {
    it('should delete all user provider sessions', async () => {
      const userId = 'userId';
      const providerName = EProvider.local;

      await service.deleteAllUsersProviderSessions(userId, providerName);

      expect(
        sessionService.deleteAllUsersProviderSessions,
      ).toHaveBeenCalledWith(userId, providerName);
    });
  });
});
