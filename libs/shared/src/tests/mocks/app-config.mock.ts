import { appConfig as originalAppConfig, TAppConfig } from '@app/shared';

export const createMockAppConfig = (): TAppConfig => {
  const originalConfig = originalAppConfig();
  return {
    ...originalConfig,
    USERS_DATABASE_URL: 'mock-database-url',
  };
};

export const mockAppConfig = createMockAppConfig();
