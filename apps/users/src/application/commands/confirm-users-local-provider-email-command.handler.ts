import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '../ports/user-abstract.repository';
import { ConfirmUsersLocalProviderEmailCommand } from './confirm-users-local-provider-email-command';

@CommandHandler(ConfirmUsersLocalProviderEmailCommand)
export class ConfirmUsersLocalProviderEmailCommandHandler
  implements ICommandHandler<ConfirmUsersLocalProviderEmailCommand>
{
  constructor(private readonly userRepository: UserRepository) {}

  async execute(command: ConfirmUsersLocalProviderEmailCommand): Promise<void> {
    await this.userRepository.confirmUsersLocalProviderEmail(
      command.providerId,
    );
  }
}
