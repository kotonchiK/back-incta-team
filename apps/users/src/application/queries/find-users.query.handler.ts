import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { IUser } from '@app/shared';
import { UserRepository } from '../ports/user-abstract.repository';
import { FindUsersQuery } from './find-users.query';

@QueryHandler(FindUsersQuery)
export class FindUsersQueryHandler implements IQueryHandler<FindUsersQuery> {
  constructor(private readonly repository: UserRepository) {}

  async execute(query: FindUsersQuery): Promise<IUser[]> {
    if (query.userId) {
      return [await this.repository.findUserById(query.userId)];
    }
    return this.repository.findAllUsers();
  }
}
