import { Test, TestingModule } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import { EProvider, appConfig, TAppConfig } from '@app/shared';
import { createMockAppConfig } from '@app/shared/tests/mocks/app-config.mock';
import { SessionService } from './session.service';
import { Session } from '../schemas/session.schema';

describe('SessionService', () => {
  let service: SessionService;
  let sessionModel: Model<Session>;
  let mockConfig: TAppConfig;

  beforeEach(async () => {
    mockConfig = createMockAppConfig();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: mockConfig.AUTH_SESSION_MODEL,
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            findByIdAndDelete: jest.fn(),
            deleteMany: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: appConfig.KEY,
          useValue: mockConfig,
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    sessionModel = module.get<Model<Session>>(mockConfig.AUTH_SESSION_MODEL);
  });

  describe('createSession', () => {
    it('should create a new session', async () => {
      const sessionData = {
        userId: 'userId',
        deviceId: 'deviceId',
        token: 'token',
        providerName: EProvider.local,
        expiresAt: new Date(),
        isActive: true,
      };

      jest
        .spyOn(sessionModel, 'create')
        .mockResolvedValueOnce(sessionData as any);

      const result = await service.createSession(sessionData);

      expect(sessionModel.create).toHaveBeenCalledWith(sessionData);
      expect(result).toEqual(sessionData);
    });
  });

  describe('findSessionByUserIdAndDeviceId', () => {
    it('should find a session by userId and deviceId', async () => {
      const userId = 'userId';
      const deviceId = 'deviceId';
      const mockSession = { userId, deviceId, token: 'token' };

      jest.spyOn(sessionModel, 'findOne').mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockSession),
      } as any);

      const result = await service.findSessionByUserIdAndDeviceId(
        userId,
        deviceId,
      );

      expect(sessionModel.findOne).toHaveBeenCalledWith({ userId, deviceId });
      expect(result).toEqual(mockSession);
    });
  });

  describe('updateSession', () => {
    it('should update a session', async () => {
      const sessionId = new Types.ObjectId();
      const updateData = { token: 'newToken', expiresAt: new Date() };
      const mockUpdatedSession = { _id: sessionId, ...updateData };

      jest.spyOn(sessionModel, 'findByIdAndUpdate').mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockUpdatedSession),
      } as any);

      const result = await service.updateSession(sessionId, updateData);

      expect(sessionModel.findByIdAndUpdate).toHaveBeenCalledWith(
        sessionId,
        updateData,
        { new: true },
      );
      expect(result).toEqual(mockUpdatedSession);
    });
  });

  describe('deleteSession', () => {
    it('should delete a session', async () => {
      const sessionId = new Types.ObjectId();
      const mockDeletedSession = { _id: sessionId, userId: 'userId' };

      jest.spyOn(sessionModel, 'findByIdAndDelete').mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockDeletedSession),
      } as any);

      const result = await service.deleteSession(sessionId);

      expect(sessionModel.findByIdAndDelete).toHaveBeenCalledWith(sessionId);
      expect(result).toEqual(mockDeletedSession);
    });
  });

  describe('deleteAllUsersProviderSessions', () => {
    it('should delete all sessions for a user and provider', async () => {
      const userId = 'userId';
      const providerName = EProvider.local;

      jest
        .spyOn(sessionModel, 'deleteMany')
        .mockResolvedValueOnce({ deletedCount: 2 } as any);

      await service.deleteAllUsersProviderSessions(userId, providerName);

      expect(sessionModel.deleteMany).toHaveBeenCalledWith({
        userId,
        providerName,
      });
    });
  });

  describe('findActiveSessionsByUserId', () => {
    it('should find active sessions for a user', async () => {
      const userId = new Types.ObjectId();
      const mockSessions = [
        { _id: new Types.ObjectId(), userId, isActive: true },
        { _id: new Types.ObjectId(), userId, isActive: true },
      ];

      jest.spyOn(sessionModel, 'find').mockReturnValueOnce({
        lean: jest.fn().mockResolvedValueOnce(mockSessions),
      } as any);

      const result = await service.findActiveSessionsByUserId(userId);

      expect(sessionModel.find).toHaveBeenCalledWith({
        userId,
        isActive: true,
      });
      expect(result).toEqual(mockSessions);
    });
  });

  describe('removeExpiredSessions', () => {
    it('should remove expired sessions', async () => {
      jest
        .spyOn(sessionModel, 'deleteMany')
        .mockResolvedValueOnce({ deletedCount: 3 } as any);

      await service.removeExpiredSessions();

      expect(sessionModel.deleteMany).toHaveBeenCalledWith({
        expiresAt: { $lt: expect.any(Date) },
      });
    });
  });

  describe('removeInactiveSessions', () => {
    it('should remove inactive sessions', async () => {
      jest
        .spyOn(sessionModel, 'deleteMany')
        .mockResolvedValueOnce({ deletedCount: 2 } as any);

      await service.removeInactiveSessions();

      expect(sessionModel.deleteMany).toHaveBeenCalledWith({
        updatedAt: { $lt: expect.any(Date) },
      });
    });
  });
});
