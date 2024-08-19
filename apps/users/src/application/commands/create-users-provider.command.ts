import { EDbEntityFields, EProvider, EUsersProviderFields } from '@app/shared';
import { randomUUID } from 'crypto';

const nonLocalProviderLoginDevider = ':';

export class CreateUsersProviderCommand {
  public readonly [EDbEntityFields.id]: string;

  public readonly [EUsersProviderFields.password]: string;

  public readonly [EUsersProviderFields.login]: string;

  public readonly [EUsersProviderFields.name]?: string;

  public readonly [EUsersProviderFields.surname]?: string;

  public readonly [EUsersProviderFields.avatar]?: string;

  public readonly [EUsersProviderFields.userLocalId]?: string;

  constructor(
    public readonly providerName: string,
    public readonly sub: string,
    public readonly email: string,
    login: string,
    name: string = undefined,
    surname: string = undefined,
    password: string,
    avatar: string = undefined,
    public readonly emailIsValidated: boolean,
    userLocalId: string = undefined,
  ) {
    this[EDbEntityFields.id] = randomUUID();
    this[EUsersProviderFields.password] = password || randomUUID();
    this[EUsersProviderFields.login] =
      providerName !== EProvider.local
        ? `${email}${nonLocalProviderLoginDevider}${providerName}`
        : login;
    this[EUsersProviderFields.name] = name;
    this[EUsersProviderFields.surname] = surname;
    this[EUsersProviderFields.avatar] = avatar;
    this[EUsersProviderFields.userLocalId] = userLocalId;
  }
}
