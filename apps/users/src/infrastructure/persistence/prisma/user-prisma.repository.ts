import { Injectable } from '@nestjs/common';
import { User } from 'apps/users/src/domain/user';
import {
  EDbEntityFields,
  EProvider,
  EProviderFields,
  EUserFields,
  EUsersProviderFields,
  IUser,
  IUsersProvider,
  TFindUserByEmailOrLoginQueryHandlerReturnType,
} from '@app/shared';
import { Prisma } from '@users-generated';
import { UserRepository } from '../../../application/ports/user-abstract.repository';
import { PrismaService } from './prisma.service';

@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(private prisma: PrismaService) {
    super();
  }

  async findAllUsers(): Promise<IUser[]> {
    return this.prisma.user.findMany({
      include: {
        [EUserFields.providers]: {
          include: {
            provider: {
              select: {
                [EProviderFields.name]: true,
              },
            },
          },
        },
      },
    });
  }

  async findUserById(userId: string): Promise<IUser> {
    return this.prisma.user.findFirstOrThrow({
      where: {
        [EDbEntityFields.id]: userId,
      },
      include: {
        [EUserFields.providers]: {
          include: {
            provider: {
              select: {
                [EProviderFields.name]: true,
              },
            },
          },
        },
      },
    });
  }

  async findProvider(
    providerName: EProvider,
  ): Promise<{ [EDbEntityFields.id]: string }> {
    return this.prisma.provider.findFirstOrThrow({
      where: {
        [EProviderFields.name]: providerName,
      },
      select: { [EDbEntityFields.id]: true },
    });
  }

  async findUsersProvider(
    where: Partial<IUsersProvider>,
  ): Promise<IUsersProvider | null> {
    const allowedKeys = Object.values({
      ...EUsersProviderFields,
      ...EDbEntityFields,
    });

    const whereEntries = Object.entries(where).filter(([key]) =>
      allowedKeys.includes(key as EUsersProviderFields),
    );
    const whereConditions = whereEntries.map(
      ([key, value]) => Prisma.sql`up.${Prisma.raw(`"${key}"`)} = ${value}`,
    );

    const providerLocalIdField = Prisma.raw(
      `"${EUsersProviderFields.providerLocalId}"`,
    );

    const whereClause = whereConditions.length
      ? Prisma.sql`WHERE ${Prisma.join(whereConditions, ' AND ')}`
      : Prisma.empty;

    const query = Prisma.sql`
      SELECT 
        up.*,
        json_build_object(
          'id', p.id,
          'name', p.name,
          'createdAt', p."createdAt",
          'updatedAt', p."updatedAt"
        ) as provider
      FROM "UsersProvider" up
      JOIN "Provider" p ON up.${providerLocalIdField} = p.id
      ${whereClause}
      ORDER BY CASE WHEN p.name = ${EProvider.local} THEN 0 ELSE 1 END
      LIMIT 1
    `;

    const result = await this.prisma.$queryRaw<IUsersProvider[]>(query);

    return result[0] || null;
  }

  // RETURNS PASSWORD & EMAIL
  async findLocalUsersProviderByEmailOrLogin(
    emailOrLogin: string,
  ): Promise<TFindUserByEmailOrLoginQueryHandlerReturnType | undefined> {
    const result = await this.prisma.usersProvider.findFirst({
      where: {
        OR: [
          { [EUsersProviderFields.email]: emailOrLogin },
          { [EUsersProviderFields.login]: emailOrLogin },
        ],
        provider: {
          name: EProvider.local,
        },
      },
      include: {
        user: true,
      },
    });
    if (!result) {
      return undefined;
    }
    const {
      user,
      [EDbEntityFields.id]: id,
      [EUsersProviderFields.password]: password,
      [EUsersProviderFields.email]: email,
      [EUsersProviderFields.emailIsValidated]: emailIsValidated,
    } = result;

    return {
      [EUsersProviderFields.userLocalId]: user[EDbEntityFields.id],
      [EDbEntityFields.id]: id,
      [EUsersProviderFields.password]: password,
      [EUsersProviderFields.email]: email,
      [EUsersProviderFields.emailIsValidated]: emailIsValidated,
    };
  }

  async create(user: User): Promise<Omit<IUser, EUserFields.providers>> {
    const newUser = await this.prisma.user.create({
      data: {
        [EDbEntityFields.id]: user[EDbEntityFields.id],
        [EUserFields.providers]: {
          create: [user.providers[0] as Required<IUsersProvider>],
        },
      },
    });
    return { [EDbEntityFields.id]: newUser[EDbEntityFields.id] };
  }

  async createUsersProvider(
    userId: string,
    providerData: Omit<IUsersProvider, EDbEntityFields.id>,
  ): Promise<void> {
    await this.prisma.usersProvider.create({
      data: {
        userLocalId: userId,
        providerLocalId: providerData[EUsersProviderFields.providerLocalId],
        sub: providerData[EUsersProviderFields.sub],
        email: providerData[EUsersProviderFields.email],
        login: providerData[EUsersProviderFields.login],
        name: providerData[EUsersProviderFields.name],
        surname: providerData[EUsersProviderFields.surname],
        password: providerData[EUsersProviderFields.password],
        avatar: providerData[EUsersProviderFields.avatar],
        emailIsValidated: providerData[EUsersProviderFields.emailIsValidated],
      },
    });
  }

  async confirmUsersLocalProviderEmail(providerId: string): Promise<void> {
    await this.updateUsersProvider(providerId, {
      [EUsersProviderFields.emailIsValidated]: true,
    });
  }

  async updateUsersProvider(
    id: string,
    data: Partial<IUsersProvider>,
  ): Promise<void> {
    await this.prisma.usersProvider.update({
      where: { [EDbEntityFields.id]: id },
      data,
    });
  }

  async delete(userId: string): Promise<void> {
    await this.prisma.user.delete({
      where: {
        [EDbEntityFields.id]: userId,
      },
    });
  }
}
