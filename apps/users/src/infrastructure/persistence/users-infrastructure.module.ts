import { DynamicModule, Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';

export enum EUserInfrastuctureDriver {
  prisma = 'prisma',
}
@Module({})
export class UserInfrastructureModule {
  static use(driver: EUserInfrastuctureDriver): DynamicModule {
    const persistanceModule =
      driver === EUserInfrastuctureDriver.prisma ? PrismaModule : {};
    return {
      module: UserInfrastructureModule,
      imports: [persistanceModule as DynamicModule],
      exports: [persistanceModule as DynamicModule],
    };
  }
}
