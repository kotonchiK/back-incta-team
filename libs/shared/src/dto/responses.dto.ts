import { ApiProperty } from '@nestjs/swagger';
import { Messages } from '../constants/messages.constants';
import {
  EUsersProviderFields,
  IUser,
  IUsersProvider,
} from '../types/user/user.type';

export class SuccessResponseDto {
  @ApiProperty({
    description: Messages.DESC_SUCCESS_INDICATOR,
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: Messages.DESC_SUCCESS_MESSAGE,
    example: Messages.SUCCESS_OPERATION,
  })
  message: string;
}

export class EmailVerificationResponseDto {
  @ApiProperty({
    description: Messages.DESC_REDIRECT_URL,
    example: Messages.DESC_URL_SAMPLE,
  })
  redirect: string;
}

export class DeleteUserResponseDto {
  @ApiProperty({
    description: Messages.DESC_SUCCESS_INDICATOR,
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: Messages.DESC_SUCCESS_MESSAGE,
    example: Messages.SUCCESS_USER_DELETED,
  })
  message: string;
}

export class UserResponseDto implements IUser {
  @ApiProperty({
    description: 'The unique identifier of the user',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'List of user providers',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        [EUsersProviderFields.providerName]: { type: 'string' },
        [EUsersProviderFields.email]: { type: 'string' },
        [EUsersProviderFields.login]: { type: 'string' },
        [EUsersProviderFields.name]: { type: 'string' },
        [EUsersProviderFields.surname]: { type: 'string' },
        [EUsersProviderFields.avatar]: { type: 'string' },
        [EUsersProviderFields.emailIsValidated]: { type: 'boolean' },
      },
    },
  })
  providers: IUsersProvider[];
}

export class GetUsersResponseDto {
  @ApiProperty({
    description: Messages.DESC_USER_LIST,
    type: [UserResponseDto],
  })
  users?: UserResponseDto[];
}
