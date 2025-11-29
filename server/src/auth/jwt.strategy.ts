import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export type JwtPayload = { sub: string; email: string; username?: string };

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'lejeudepepsbite',
    });
  }

  async validate(payload: JwtPayload) {
    // Le payload est attaché à req.user
    return { userId: payload.sub, email: payload.email, username: payload.username };
  }
}
