import { User } from '../../domain/user';

export class CreateUserCommand {
  constructor(public readonly user: User) {}
}
