import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { Request } from 'express';

/**
 * JWT strategy for authentication.
 * @extends PassportStrategy
 */
type JwtConstructor = new (opts: {
  jwtFromRequest: (req: Request) => string | null;
  secretOrKey: string;
}) => any;
const JwtBase = PassportStrategy(Strategy) as unknown as JwtConstructor;

@Injectable()
export class JwtStrategy extends JwtBase {
  constructor() {
    const jwtFromRequest = (req: Request): string | null => {
      const header = req.headers?.authorization;
      if (!header) return null;
      const [scheme, token] = header.split(' ');
      return scheme?.toLowerCase() === 'bearer' ? (token ?? null) : null;
    };
    super({
      jwtFromRequest,
      secretOrKey: (() => {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
          throw new Error('JWT_SECRET environment variable is required');
        }
        return secret;
      })(),
    });
  }

  /**
   * Validates the JWT token.
   * @param payload The JWT payload.
   * @returns An object containing the user ID.
   */
  validate(payload: { sub: string; email?: string }) {
    return { userId: payload.sub, email: payload.email };
  }
}
