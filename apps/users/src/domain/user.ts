import {
  EDbEntityFields,
  EProvider,
  EUserFields,
  EUsersProviderFields,
  IUser,
  IUsersProvider,
} from '@app/shared';
import { randomUUID } from 'crypto';

export class User implements IUser {
  public readonly [EUserFields.providers]: IUsersProvider[];

  constructor(
    public id: string,
    provider: IUsersProvider,
    public readonly providerName: EProvider,
  ) {
    this[EUserFields.providers] = [provider];
  }

  static create(
    id: string,
    providerName: EProvider,
    usersProvider: Omit<
      IUsersProvider,
      | EDbEntityFields.id
      | EUsersProviderFields.userLocalId
      | EUsersProviderFields.providerLocalId
    >,
  ): User {
    const userId = id || randomUUID();
    const providerId = randomUUID();
    const provider: IUsersProvider = {
      ...usersProvider,
      [EUsersProviderFields.sub]:
        providerName === EProvider.local
          ? userId
          : usersProvider[EUsersProviderFields.sub],
      id: providerId,
    };

    return new User(userId, provider, providerName);
  }

  getUsersProvider(): IUsersProvider {
    return this.providers[0];
  }

  setProviderLocalId(providerLocalId: string): void {
    this.providers[0][EUsersProviderFields.providerLocalId] = providerLocalId;
  }

  getProviderName(): EProvider {
    return this[EUsersProviderFields.providerName];
  }

  isLocalProvider(): boolean {
    return this.getProviderName() === EProvider.local;
  }

  toJSON(): IUser {
    return {
      id: this.id,
      providers: this.providers.map((provider) => ({
        ...provider,
        providerName: undefined,
      })),
    };
  }
}
