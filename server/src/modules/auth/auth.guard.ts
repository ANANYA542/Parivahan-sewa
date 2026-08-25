import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';

export interface AuthenticatedRequest extends Request {
  userId: string;
}

/**
 * Verifies the bearer token on every route it guards, and — when the route
 * has a `:userId` path param — rejects the request unless the token's owner
 * matches that param. Routes with no `:userId` param (e.g. `/cases/:caseId`)
 * only get the "is this a valid session" check; those handlers are
 * responsible for their own ownership check against the record they load.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Sign in to continue.');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Sign in to continue.');
    }

    let payload: { sub: string };
    try {
      payload = this.authService.verify(token);
    } catch {
      throw new UnauthorizedException('Your session has expired. Please sign in again.');
    }

    const routeUserId = request.params?.userId;
    if (routeUserId && routeUserId !== payload.sub) {
      throw new ForbiddenException('You cannot access another user’s data.');
    }

    request.userId = payload.sub;
    return true;
  }
}
