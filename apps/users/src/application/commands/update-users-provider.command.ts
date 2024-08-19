import { IUsersProvider } from '@app/shared';

export class UpdateUsersProviderCommand {
  constructor(
    public readonly id: string,
    public readonly data: Partial<IUsersProvider>,
  ) {}
}
