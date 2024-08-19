import {
  EDbEntityFields,
  EProvider,
  EUserFields,
  IUser,
  IUsersProvider,
  TFindUserByEmailOrLoginQueryHandlerReturnType,
} from '@app/shared';
import { User } from '../../domain/user';

export abstract class UserRepository {
  abstract findAllUsers(): Promise<IUser[]>;
  abstract findUserById(userId: string): Promise<IUser>;
  abstract findProvider(
    providerName: EProvider,
  ): Promise<{ [EDbEntityFields.id]: string }>;
  abstract findUsersProvider(
    where: Partial<IUsersProvider>,
  ): Promise<IUsersProvider | null>;
  // RETURNS PASSWORD & EMAIL
  abstract findLocalUsersProviderByEmailOrLogin(
    emailOrLogin: string,
  ): Promise<TFindUserByEmailOrLoginQueryHandlerReturnType | undefined>;
  abstract create(userData: User): Promise<Omit<IUser, EUserFields.providers>>;
  abstract createUsersProvider(
    userId: string,
    providerData: Omit<IUsersProvider, EDbEntityFields.id>,
  ): Promise<void>;
  abstract confirmUsersLocalProviderEmail(providerId: string): Promise<void>;
  abstract updateUsersProvider(
    id: string,
    data: Partial<IUsersProvider>,
  ): Promise<void>;
  abstract delete(userId: string): Promise<void>;
}
