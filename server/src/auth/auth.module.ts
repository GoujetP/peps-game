import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtStrategy } from './jwt.strategy';

// Compute expiresIn once: allow numeric seconds (e.g. '28800') or timespan string ('1h')
const jwtExpiresIn: string | number = (() => {
  const raw = process.env.JWT_EXPIRES_IN;
  if (!raw) return 28800; // default seconds (8 hours)
  if (/^\d+$/.test(raw)) return Number(raw);
  return raw;
})();

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'lejeudepepsbite',
      signOptions: { expiresIn: jwtExpiresIn as unknown as any },
    }),
  ],
  providers: [AuthService, PrismaService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
