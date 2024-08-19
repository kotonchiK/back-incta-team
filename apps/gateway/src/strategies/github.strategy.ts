import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { appConfig, EProvider, EUsersProviderFields } from '@app/shared';
import { randomUUID } from 'crypto';

const config = appConfig();

@Injectable()
export class GitHubStrategy extends PassportStrategy(
  Strategy,
  EProvider.github,
) {
  constructor() {
    super({
      clientID: config.AUTH_GITHUB_CLIENT_ID,
      clientSecret: config.AUTH_GITHUB_CLIENT_SECRET,
      callbackURL: config.AUTH_GITHUB_CALLBACK_URL,
      scope: ['user:email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (...args: any[]) => any,
  ): Promise<any> {
    const { name, emails, photos, id } = profile;
    const usersProvider = {
      [EUsersProviderFields.email]: emails[0].value,
      [EUsersProviderFields.name]: name ? name.split(' ')[0] : '',
      [EUsersProviderFields.surname]: name
        ? name.split(' ').slice(1).join(' ')
        : '',
      [EUsersProviderFields.avatar]: photos[0].value,
      [EUsersProviderFields.sub]: id,
      [EUsersProviderFields.providerName]: EProvider.github,
      [EUsersProviderFields.login]: `${emails[0].value}:${EProvider.github}`,
      [EUsersProviderFields.password]: randomUUID(),
      [EUsersProviderFields.emailIsValidated]: true,
      [EUsersProviderFields.agreement]: true,
      accessToken,
      refreshToken,
    };
    done(null, usersProvider);
  }
}
