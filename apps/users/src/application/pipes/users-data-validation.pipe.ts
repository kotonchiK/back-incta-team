import { AppRpcErrorFormatter } from '@app/shared';
import { ValidationPipe } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

export const UsersDataValidationPipe = new ValidationPipe({
  transform: true,
  transformOptions: { enableImplicitConversion: true },
  whitelist: true,
  stopAtFirstError: undefined,
  forbidNonWhitelisted: true,
  exceptionFactory: (errors) => {
    const messages = errors
      .map((error) => Object.values(error.constraints))
      .flat();
    const error = new Error();
    return new RpcException(
      AppRpcErrorFormatter.format({
        ...error,
        message: messages.join(', '),
        response: {
          error: 'BAD_REQUEST',
        },
      }),
    );
  },
});
