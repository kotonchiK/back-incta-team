import { Messages } from '@app/shared/constants/messages.constants';
import { EUsersParams } from '@app/shared/routes/users.routes';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteUserDto {
  @ApiProperty({
    required: true,
    description: Messages.DESC_USER_ID_PARAM,
    example: Messages.DESC_USER_ID_SAMPLE,
  })
  @IsString()
  @IsNotEmpty()
  [EUsersParams.userId]: string;
}
