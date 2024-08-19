import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '../ports/user-abstract.repository';
import { UpdateUsersProviderCommand } from './update-users-provider.command';

@CommandHandler(UpdateUsersProviderCommand)
export class UpdateUsersProviderCommandHandler
  implements ICommandHandler<UpdateUsersProviderCommand>
{
  constructor(private readonly repository: UserRepository) {}

  async execute(command: UpdateUsersProviderCommand): Promise<void> {
    const { id, data } = command;
    await this.repository.updateUsersProvider(id, data);
  }
}
