import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { TFindUserByEmailOrLoginQueryHandlerReturnType } from '@app/shared';
import { UserRepository } from '../ports/user-abstract.repository';
import { FindUsersProviderByEmailOrLoginQuery } from './find-users-provider-by-email-or-login.query';

@CommandHandler(FindUsersProviderByEmailOrLoginQuery)
export class FindUsersProviderByEmailOrLoginQueryHandler
  implements ICommandHandler<FindUsersProviderByEmailOrLoginQuery>
{
  constructor(private readonly userRepository: UserRepository) {}

  // RETURNS PASSWORD & EMAIL
  async execute(
    command: FindUsersProviderByEmailOrLoginQuery,
  ): Promise<TFindUserByEmailOrLoginQueryHandlerReturnType | undefined> {
    const { emailOrLogin } = command;

    return this.userRepository.findLocalUsersProviderByEmailOrLogin(
      emailOrLogin,
    );
  }
}
