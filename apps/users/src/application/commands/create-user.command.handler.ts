import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EUserFields, IUser } from '@app/shared';
import { UserRepository } from '../ports/user-abstract.repository';
import { CreateUserCommand } from './create-user.command';

@CommandHandler(CreateUserCommand)
export class CreateUserCommandHandler
  implements ICommandHandler<CreateUserCommand>
{
  constructor(private readonly repository: UserRepository) {}

  async execute(command: CreateUserCommand): Promise<Omit<IUser, EUserFields>> {
    const { user } = command;
    return this.repository.create(user);
  }
}
