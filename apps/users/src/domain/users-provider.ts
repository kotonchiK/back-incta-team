import {
  EDbEntityFields,
  EProvider,
  EUsersProviderFields,
  IUsersProvider,
} from '@app/shared';
import { randomUUID } from 'crypto';

export class UsersProvider implements IUsersProvider {
  constructor(
    public readonly id: string,
    public readonly sub: string,
    public readonly email: string,
    public readonly login: string,
    public readonly password: string,
    public readonly emailIsValidated: boolean,
    public readonly userLocalId?: string,
    public readonly providerLocalId?: string,
    public readonly name?: string,
    public readonly surname?: string,
    public readonly avatar?: string,
  ) {}

  static create(
    userId: string,
    providerName: EProvider,
    providerData: Omit<
      IUsersProvider,
      | EDbEntityFields.id
      | EUsersProviderFields.userLocalId
      | EUsersProviderFields.providerLocalId
    >,
  ): UsersProvider {
    const sub =
      providerName === EProvider.local
        ? userId
        : providerData[EUsersProviderFields.sub];

    return new UsersProvider(
      randomUUID(),
      sub,
      providerData[EUsersProviderFields.email],
      providerData[EUsersProviderFields.login],
      providerData[EUsersProviderFields.password],
      providerData[EUsersProviderFields.emailIsValidated],
      providerData[EUsersProviderFields.userLocalId],
      providerData[EUsersProviderFields.providerLocalId],
      providerData[EUsersProviderFields.name],
      providerData[EUsersProviderFields.surname],
      providerData[EUsersProviderFields.avatar],
    );
  }
}
