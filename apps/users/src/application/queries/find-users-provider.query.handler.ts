import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IUsersProvider } from '@app/shared';
import { FindUsersProviderQuery } from './find-users-provider.query';
import { UserRepository } from '../ports/user-abstract.repository';

@QueryHandler(FindUsersProviderQuery)
export class FindUsersProviderQueryHandler
  implements IQueryHandler<FindUsersProviderQuery>
{
  constructor(private readonly repository: UserRepository) {}

  async execute(query: FindUsersProviderQuery): Promise<IUsersProvider | null> {
    return this.repository.findUsersProvider(query.where);
  }
}
