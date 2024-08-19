import { Injectable, Inject } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { appConfig as _appConfig, EProvider, TAppConfig } from '@app/shared';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SessionDocument, Session } from '../schemas/session.schema';

const config = _appConfig();

@Injectable()
export class SessionService {
  constructor(
    @Inject(config.AUTH_SESSION_MODEL)
    private sessionModel: Model<SessionDocument>,
    @Inject(_appConfig.KEY) private readonly appConfig: TAppConfig,
  ) {}

  async createSession(session: Partial<Session>): Promise<Session> {
    return this.sessionModel.create(session);
  }

  async findSessionByUserIdAndDeviceId(
    userId: string,
    deviceId: string,
  ): Promise<Session | null> {
    return this.sessionModel.findOne({ userId, deviceId }).lean();
  }

  async updateSession(
    sessionId: Types.ObjectId,
    session: Partial<Session>,
  ): Promise<Session | null> {
    return this.sessionModel
      .findByIdAndUpdate(sessionId, session, { new: true })
      .lean();
  }

  async deleteSession(sessionId: Types.ObjectId): Promise<Session | null> {
    return this.sessionModel.findByIdAndDelete(sessionId).lean();
  }

  async deleteAllUsersProviderSessions(
    userId: string,
    providerName: EProvider,
  ): Promise<void> {
    await this.sessionModel.deleteMany({
      userId,
      providerName,
    });
  }

  async findActiveSessionsByUserId(userId: Types.ObjectId): Promise<Session[]> {
    return this.sessionModel.find({ userId, isActive: true }).lean();
  }

  @Cron(CronExpression.EVERY_HOUR)
  async removeExpiredSessions() {
    const now = new Date();
    await this.sessionModel.deleteMany({ expiresAt: { $lt: now } });
  }

  @Cron(CronExpression.EVERY_HOUR)
  async removeInactiveSessions() {
    const inactivityPeriod = this.appConfig.AUTH_SESSION_INACTIVITY_PERIOD;
    const cutoffDate = new Date(Date.now() - inactivityPeriod);
    await this.sessionModel.deleteMany({ updatedAt: { $lt: cutoffDate } });
  }
}
