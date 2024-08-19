import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable()
export class GatwayErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        const httpEnumStatus = (error?.response?.error as string)
          ?.toUpperCase()
          ?.replace(' ', '_');
        if (HttpStatus[httpEnumStatus]) {
          return throwError(
            () => new HttpException(error.message, HttpStatus[httpEnumStatus]),
          );
        }
        if (error.code === 'P2002') {
          return throwError(
            () => new HttpException('Entity exists', HttpStatus.CONFLICT),
          );
        }
        if (error.code === 'P2025') {
          return throwError(
            () => new HttpException('Entity not found', HttpStatus.NOT_FOUND),
          );
        }

        console.error('');
        console.error('UsersErrorInterceptor Error:');
        console.error(error);
        console.error('');

        return throwError(
          () =>
            new HttpException(
              'Internal server error',
              HttpStatus.INTERNAL_SERVER_ERROR,
            ),
        );
      }),
    );
  }
}
