import { EDbEntityFields, IDbEntity } from '../db-entity/db-entity.type';

export enum EUserFields {
  providers = 'providers',
}
export interface IUser extends IDbEntity {
  [EUserFields.providers]: IUsersProvider[];
}

export enum EProvider {
  google = 'google',
  github = 'github',
  local = 'local',
}
export enum EProviderFields {
  name = 'name',
}
export interface IProvider extends IDbEntity {
  [EProviderFields.name]: EProvider;
}
export enum EUsersProviderFields {
  userLocalId = 'userLocalId',
  providerLocalId = 'providerLocalId',
  providerName = 'providerName',
  sub = 'sub',
  email = 'email',
  login = 'login',
  name = 'name',
  surname = 'surname',
  password = 'password',
  avatar = 'avatar',
  emailIsValidated = 'emailIsValidated',
  repeatPassword = 'repeat-password',
  agreement = 'agreement',
  provider = 'provider',
  emailOrLogin = 'email-or-login',
  recaptchaToken = 'recaptcha-token',
}
export interface IUsersProvider extends IDbEntity {
  [EUsersProviderFields.userLocalId]?: IUser['id'];
  [EUsersProviderFields.providerLocalId]?: IProvider['id'];
  [EUsersProviderFields.sub]: string;
  [EUsersProviderFields.email]: string;
  [EUsersProviderFields.login]: string;
  [EUsersProviderFields.name]?: string;
  [EUsersProviderFields.surname]?: string;
  [EUsersProviderFields.password]: string;
  [EUsersProviderFields.avatar]?: string;
  [EUsersProviderFields.emailIsValidated]: boolean;
}

export type TFindUserByEmailOrLoginQueryHandlerReturnType = Record<
  | EDbEntityFields.id
  | EUsersProviderFields.userLocalId
  | EUsersProviderFields.password
  | EUsersProviderFields.email,
  string
> & { [EUsersProviderFields.emailIsValidated]: boolean };
