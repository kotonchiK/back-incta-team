import * as mongoose from 'mongoose';
import { appConfig as _appConfig } from '@app/shared';

const appConfig = _appConfig();

export const databaseProviders = [
  {
    provide: appConfig.AUTH_MONGOOSE_CONNECTION,
    useFactory: (): Promise<typeof mongoose> =>
      mongoose.connect(appConfig.AUTH_MONGODB_URI, {
        dbName: 'auth',
      }),
  },
];
