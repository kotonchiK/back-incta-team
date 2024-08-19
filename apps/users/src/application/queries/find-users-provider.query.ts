import { IUsersProvider } from '@app/shared';

export class FindUsersProviderQuery {
  constructor(public readonly where: Partial<IUsersProvider>) {}
}
