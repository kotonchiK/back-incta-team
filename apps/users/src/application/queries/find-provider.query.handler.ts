import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { EDbEntityFields } from '@app/shared';
import { FindProviderQuery } from './find-provider.query';
import { UserRepository } from '../ports/user-abstract.repository';

@QueryHandler(FindProviderQuery)
export class FindProviderQueryHandler
  implements IQueryHandler<FindProviderQuery>
{
  constructor(private readonly repository: UserRepository) {}

  async execute(
    query: FindProviderQuery,
  ): Promise<{ [EDbEntityFields.id]: string }> {
    return this.repository.findProvider(query.providerName);
  }
}
