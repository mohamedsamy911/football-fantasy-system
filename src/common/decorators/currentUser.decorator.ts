import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

type AuthUser = { userId?: string; sub?: string };

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { user?: AuthUser }>();
    const user = request.user;
    const userId = user?.userId ?? user?.sub;

    if (!userId) {
      throw new UnauthorizedException('User ID not found in token');
    }

    return userId;
  },
);
