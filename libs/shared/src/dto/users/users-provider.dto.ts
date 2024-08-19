import {
  IsString,
  IsEmail,
  MinLength,
  IsEnum,
  IsNotEmpty,
  ValidateIf,
  Matches,
  MaxLength,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Expose, Transform } from 'class-transformer';
import { EUsersParams } from '@app/shared/routes/users.routes';
import { ApiProperty } from '@nestjs/swagger';
import { Messages } from '@app/shared/constants/messages.constants';
import { EProvider, EUsersProviderFields } from '../../types/user/user.type';
import { appConfig as _appConfig } from '../../modules/config.module';

const appConfig = _appConfig();

export class UsersProviderDto {
  @IsOptional()
  @IsEnum(EProvider)
  public readonly [EUsersProviderFields.providerName]: EProvider;

  @ValidateIf(
    (_this) =>
      _this[EUsersProviderFields.providerName] === EProvider.github ||
      _this[EUsersProviderFields.providerName] === EProvider.google,
  )
  @IsNotEmpty()
  @IsString()
  @MaxLength(200)
  public readonly [EUsersProviderFields.sub]: string;

  @ApiProperty({
    required: true,
    format: 'email',
    description: Messages.DESC_USER_EMAIL,
    example: Messages.DESC_EMAIL_SAMPLE,
  })
  @IsEmail()
  public readonly [EUsersProviderFields.email]: string;

  @ApiProperty({
    required: true,
    minLength: appConfig.USERNAME_MIN_LENGHT,
    maxLength: appConfig.USERNAME_MAX_LENGHT,
    description: `${Messages.DESC_USERNAME}`,
    example: Messages.DESC_USER_LOGIN_SAMPLE,
  })
  @ValidateIf(
    (_this) => _this[EUsersProviderFields.providerName] === EProvider.local,
  )
  @IsString()
  @MinLength(appConfig.USERNAME_MIN_LENGHT)
  @MaxLength(appConfig.USERNAME_MAX_LENGHT)
  @Matches(new RegExp(`^${appConfig.USERNAME_ALLOWED_SYMBOLS}+$`), {
    message: Messages.ERROR_INVALID_USERNAME,
  })
  public readonly [EUsersProviderFields.login]: string;

  @IsOptional()
  @IsString()
  @MaxLength(appConfig.USERNAME_MAX_LENGHT)
  public readonly [EUsersProviderFields.name]?: string;

  @IsOptional()
  @IsString()
  @MaxLength(appConfig.USERNAME_MAX_LENGHT)
  public readonly [EUsersProviderFields.surname]?: string;

  @ApiProperty({
    required: true,
    minLength: appConfig.USERPASSWORD_MIN_LENGHT,
    maxLength: appConfig.USERPASSWORD_MAX_LENGHT,
    description: `${Messages.DESC_USER_PASSWORD}`,
    example: Messages.DESC_PASSWORD_SAMPLE,
  })
  @ValidateIf(
    (_this) => _this[EUsersProviderFields.providerName] === EProvider.local,
  )
  @IsString()
  @MinLength(appConfig.USERPASSWORD_MIN_LENGHT)
  @MaxLength(appConfig.USERPASSWORD_MAX_LENGHT)
  @Matches(new RegExp(`^${appConfig.USERPASSWORD_ALLOWED_SYMBOLS}.*$`), {
    message: Messages.ERROR_INVALID_PASSWORD,
  })
  public readonly [EUsersProviderFields.password]: string;

  @ApiProperty({
    required: true,
    description: `${Messages.DESC_PASSWORD_CONFIRMATION}`,
    example: Messages.DESC_PASSWORD_SAMPLE,
  })
  @ValidateIf(
    (_this) => _this[EUsersProviderFields.providerName] === EProvider.local,
  )
  @Expose()
  @Transform(({ obj }) =>
    obj[EUsersProviderFields.password] ===
    obj[EUsersProviderFields.repeatPassword]
      ? obj[EUsersProviderFields.repeatPassword]
      : '',
  )
  @IsNotEmpty({
    message: Messages.ERROR_PASSWORD_MISMATCH,
  })
  public readonly [EUsersProviderFields.repeatPassword]: string;

  @ApiProperty({
    required: true,
    maxLength: 10,
    description: Messages.DESC_USER_AGREEMENT,
    example: Messages.DESC_AGREED_SAMPLE,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  public readonly [EUsersProviderFields.agreement]: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  public readonly [EUsersProviderFields.avatar]?: string;

  @IsBoolean()
  get [EUsersProviderFields.emailIsValidated](): boolean {
    return this[EUsersProviderFields.providerName] !== EProvider.local;
  }
}

export class ForgotUsersProviderPasswordDto {
  @ApiProperty({
    required: true,
    description: Messages.DESC_EMAIL_OR_LOGIN,
    example: Messages.DESC_EMAIL_SAMPLE,
  })
  @IsString()
  @IsNotEmpty()
  [EUsersProviderFields.emailOrLogin]: string;

  @ApiProperty({
    required: true,
    description: Messages.DESC_RECAPTCHA_TOKEN,
    example: Messages.DESC_HASH_SAMPLE,
  })
  @IsString()
  @IsNotEmpty()
  [EUsersProviderFields.recaptchaToken]: string;
}

export class ResetUsersProviderPasswordDto {
  @ApiProperty({
    required: true,
    description: Messages.DESC_NEW_PASSWORD,
    example: Messages.DESC_NEW_PASSWORD_SAMPLE,
  })
  @IsString()
  @IsNotEmpty()
  public readonly [EUsersProviderFields.password]: string;

  @ApiProperty({
    required: true,
    description: Messages.DESC_NEW_PASSWORD_CONFIRMATION,
    example: Messages.DESC_NEW_PASSWORD_SAMPLE,
  })
  @Expose()
  @Transform(({ obj }) =>
    obj[EUsersProviderFields.password] ===
    obj[EUsersProviderFields.repeatPassword]
      ? obj[EUsersProviderFields.repeatPassword]
      : '',
  )
  @IsNotEmpty({
    message: Messages.ERROR_PASSWORD_MISMATCH,
  })
  public readonly [EUsersProviderFields.repeatPassword]: string;

  @ApiProperty({
    required: true,
    description: Messages.DESC_PASSWORD_RESET_TOKEN,
    example: Messages.DESC_HASH_SAMPLE,
  })
  @IsString()
  @IsNotEmpty()
  public readonly [EUsersParams.token]: string;

  @ApiProperty({
    required: true,
    description: Messages.DESC_RECAPTCHA_TOKEN,
    example: Messages.DESC_HASH_SAMPLE,
  })
  @IsString()
  @IsNotEmpty()
  [EUsersProviderFields.recaptchaToken]: string;
}
