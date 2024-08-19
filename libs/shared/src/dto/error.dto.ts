import { ApiProperty } from '@nestjs/swagger';
import { Messages } from '../constants/messages.constants';

export class ErrorResponseDto {
  @ApiProperty({
    description: Messages.DESC_HTTP_STATUS_CODE,
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: Messages.DESC_ERROR_MESSAGE,
    example: Messages.ERROR_BAD_REQUEST,
  })
  message: string;

  @ApiProperty({
    description: Messages.DESC_ERROR_DETAILS,
    example: [Messages.ERROR_INVALID_EMAIL],
  })
  errors?: string[];
}
