import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

/**
 * JWT strategy for authentication.
 */
type JwtConstructor = new (opts: {
  jwtFromRequest: (req: Request) => string | null;
  secretOrKey: string;
  ignoreExpiration?: boolean;
}) => any;
const JwtBase = PassportStrategy(Strategy) as unknown as JwtConstructor;

@Injectable()
export class JwtStrategy extends JwtBase {
  constructor(private readonly configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET') || 'dev_secret';

    const jwtFromRequest = (req: Request): string | null => {
      const header = req.headers?.authorization;
      if (!header) return null;
      const [scheme, token] = header.split(' ');
      return scheme?.toLowerCase() === 'bearer' ? (token ?? null) : null;
    };
    super({
      jwtFromRequest,
      ignoreExpiration: false,
      secretOrKey: secret,
    });

    // Warn if using fallback secret
    if (!configService.get<string>('JWT_SECRET')) {
      console.warn(
        'JWT_SECRET not set. Using insecure default. Set JWT_SECRET in production!',
      );
    }
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
