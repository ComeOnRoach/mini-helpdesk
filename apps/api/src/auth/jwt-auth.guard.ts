import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';

// Registered globally in AuthModule: every route needs a valid token unless it is @Public().
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    return isPublic ? true : super.canActivate(context);
  }

  handleRequest<TUser>(err: unknown, user: TUser | false, info: unknown): TUser {
    if (err instanceof Error) {
      throw err;
    }
    if (!user) {
      const missing = info instanceof Error && info.message === 'No auth token';
      throw new UnauthorizedException(
        missing ? 'Missing bearer token' : 'Invalid or expired token',
      );
    }
    return user;
  }
}
