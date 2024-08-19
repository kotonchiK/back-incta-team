import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EProvider, EUsersProviderFields } from '@app/shared';
import { CreateUsersProviderCommand } from './create-users-provider.command';
import { UsersProviderFactory } from '../../domain/factories/users-provider.factory';
import { UserRepository } from '../ports/user-abstract.repository';

@CommandHandler(CreateUsersProviderCommand)
export class CreateUsersProviderCommandHandler
  implements ICommandHandler<CreateUsersProviderCommand>
{
  constructor(
    private readonly usersProviderFactory: UsersProviderFactory,
    private readonly repository: UserRepository,
  ) {}

  async execute(command: CreateUsersProviderCommand): Promise<void> {
    const provider = await this.repository.findProvider(
      command[EUsersProviderFields.providerName] as EProvider,
    );

    await this.repository.createUsersProvider(
      command[EUsersProviderFields.userLocalId],
      {
        [EUsersProviderFields.providerLocalId]: provider.id,
        [EUsersProviderFields.sub]: command[EUsersProviderFields.sub],
        [EUsersProviderFields.email]: command[EUsersProviderFields.email],
        [EUsersProviderFields.login]: command[EUsersProviderFields.login],
        [EUsersProviderFields.name]: command[EUsersProviderFields.name],
        [EUsersProviderFields.surname]: command[EUsersProviderFields.surname],
        [EUsersProviderFields.password]: command[EUsersProviderFields.password],
        [EUsersProviderFields.avatar]: command[EUsersProviderFields.avatar],
        [EUsersProviderFields.emailIsValidated]:
          command[EUsersProviderFields.emailIsValidated],
      },
    );
  }
}
