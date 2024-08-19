import { Messages } from '@app/shared/constants/messages.constants';
import { EUsersProviderFields } from '@app/shared/types/user/user.type';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SigninDto {
  @ApiProperty({
    required: true,
    type: 'string',
    description: Messages.DESC_EMAIL_OR_LOGIN,
    example: Messages.DESC_EMAIL_SAMPLE,
  })
  @IsString()
  @IsNotEmpty()
  [EUsersProviderFields.emailOrLogin]: string;

  @ApiProperty({
    required: true,
    type: 'string',
    description: Messages.DESC_NEW_PASSWORD,
    example: Messages.DESC_NEW_PASSWORD_SAMPLE,
  })
  @IsString()
  @IsNotEmpty()
  [EUsersProviderFields.password]: string;
}
