import { Injectable } from '@nestjs/common';
import {
  BcryptService,
  EDbEntityFields,
  EProvider,
  EUsersProviderFields,
  IUsersProvider,
} from '@app/shared';
import { CreateUsersProviderCommand } from '../../application/commands/create-users-provider.command';
import { UsersProvider } from '../users-provider';

@Injectable()
export class UsersProviderFactory {
  constructor(private readonly bcryptService: BcryptService) {}

  async create(
    userId: string,
    providerName: EProvider,
    usersProvider: CreateUsersProviderCommand,
  ): Promise<IUsersProvider> {
    return UsersProvider.create(
      userId,
      providerName,
      await this.mapCommandToProviderData(usersProvider),
    );
  }

  private async mapCommandToProviderData(
    data: CreateUsersProviderCommand,
  ): Promise<
    Omit<
      IUsersProvider,
      | EDbEntityFields.id
      | EUsersProviderFields.userLocalId
      | EUsersProviderFields.providerLocalId
    >
  > {
    return {
      [EUsersProviderFields.sub]: data[EUsersProviderFields.sub],
      [EUsersProviderFields.email]: data[EUsersProviderFields.email],
      [EUsersProviderFields.login]: data[EUsersProviderFields.login],
      [EUsersProviderFields.name]: data[EUsersProviderFields.name],
      [EUsersProviderFields.surname]: data[EUsersProviderFields.surname],
      [EUsersProviderFields.password]: await this.hashPassword(
        data[EUsersProviderFields.password],
      ),
      [EUsersProviderFields.avatar]: data[EUsersProviderFields.avatar],
      [EUsersProviderFields.emailIsValidated]:
        data[EUsersProviderFields.providerName] !== EProvider.local,
    };
  }

  async hashPassword(password: string) {
    return this.bcryptService.hash(password);
  }
}
