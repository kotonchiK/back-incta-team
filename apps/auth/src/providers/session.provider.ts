import { Connection } from 'mongoose';
import { appConfig as _appConfig } from '@app/shared';
import { Session, SessionSchema } from '../schemas/session.schema';

const appConfig = _appConfig();

export const sessionProviders = [
  {
    provide: appConfig.AUTH_SESSION_MODEL,
    useFactory: (connection: Connection) =>
      connection.model(Session.name, SessionSchema),
    inject: [appConfig.AUTH_MONGOOSE_CONNECTION],
  },
];
