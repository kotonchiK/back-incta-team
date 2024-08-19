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
export class NonAuthGuard implements CanActivate {
  constructor(
    @Inject(config.AUTH_MICROSERVICE_NAME)
    private authClient: ClientProxy,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.cookies?.[EAuthParams.accessToken] || '';
    const result = await lastValueFrom(
      this.authClient.send({ cmd: EAuthRoutes.validateToken }, token),
    ).catch((error) => false);
    if (result) {
      return false;
    }
    return true;
  }
}
