import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaUserRepository } from './user-prisma.repository';
import { UserRepository } from '../../../application/ports/user-abstract.repository';

@Global()
@Module({
  providers: [
    PrismaService,
    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [UserRepository],
})
export class PrismaModule {}
