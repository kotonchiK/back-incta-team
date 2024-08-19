import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '../ports/user-abstract.repository';
import { DeleteUserCommand } from './delete-user.command';

@CommandHandler(DeleteUserCommand)
export class DeleteUserCommandHandler
  implements ICommandHandler<DeleteUserCommand>
{
  constructor(private readonly repository: UserRepository) {}

  async execute(command: DeleteUserCommand): Promise<void> {
    const { userId } = command;
    await this.repository.delete(userId);
  }
}
