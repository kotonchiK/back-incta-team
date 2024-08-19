import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { appConfig, EAuthParams, EAuthRoutes } from '@app/shared';
import { lastValueFrom } from 'rxjs';

const config = appConfig();

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(config.AUTH_MICROSERVICE_NAME)
    private authClient: ClientProxy,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies[EAuthParams.accessToken];
    if (!token?.trim()) {
      throw new UnauthorizedException();
    }
    const result = await lastValueFrom(
      this.authClient.send({ cmd: EAuthRoutes.validateToken }, token),
    ).catch((error) => {
      throw new UnauthorizedException(error.message);
    });
    if (result) {
      return true;
    }
    return false;
  }
}
