import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { appConfig, EProvider, EUsersProviderFields } from '@app/shared';
import { randomUUID } from 'crypto';

const config = appConfig();
@Injectable()
export class GoogleStrategy extends PassportStrategy(
  Strategy,
  EProvider.google,
) {
  constructor() {
    super({
      clientID: config.AUTH_GOOGLE_CLIENT_ID,
      clientSecret: config.AUTH_GOOGLE_CLIENT_SECRET,
      callbackURL: config.AUTH_GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos, id } = profile;
    const usersProvider = {
      [EUsersProviderFields.email]: emails[0].value,
      [EUsersProviderFields.name]: name.givenName,
      [EUsersProviderFields.surname]: name.familyName,
      [EUsersProviderFields.avatar]: photos[0].value,
      [EUsersProviderFields.sub]: id,
      [EUsersProviderFields.providerName]: EProvider.google,
      [EUsersProviderFields.login]: `${emails[0].value}:${EProvider.google}`,
      [EUsersProviderFields.password]: randomUUID(),
      [EUsersProviderFields.emailIsValidated]: true,
      [EUsersProviderFields.agreement]: true,
      accessToken,
      refreshToken,
    };
    done(null, usersProvider);
  }
}
