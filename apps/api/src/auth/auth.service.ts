import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '@prisma/client';

const ACCESS_MAX_AGE = 15 * 60 * 1000;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  private cookieOptions(maxAge: number) {
    const secure = this.config.get('COOKIE_SECURE') === 'true';
    return {
      httpOnly: true,
      secure,
      // Cross-site Vercel → Railway cookies require SameSite=None; Secure
      sameSite: (secure ? 'none' : 'lax') as 'none' | 'lax',
      path: '/',
      maxAge,
    };
  }

  private toPublic(user: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    role: Role;
    createdAt: Date;
  }) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
    };
  }

  async signTokens(user: { id: string; email: string; role: Role }) {
    const accessSecret = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
    const accessExpires = this.config.get('JWT_ACCESS_EXPIRES') || '15m';
    const refreshExpires = this.config.get('JWT_REFRESH_EXPIRES') || '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: user.id, email: user.email, role: user.role },
        { secret: accessSecret, expiresIn: accessExpires },
      ),
      this.jwt.signAsync(
        { sub: user.id, type: 'refresh' },
        { secret: refreshSecret, expiresIn: refreshExpires },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('access_token', accessToken, this.cookieOptions(ACCESS_MAX_AGE));
    res.cookie('refresh_token', refreshToken, this.cookieOptions(REFRESH_MAX_AGE));
  }

  clearAuthCookies(res: Response) {
    const base = this.cookieOptions(0);
    res.clearCookie('access_token', { path: base.path, secure: base.secure, sameSite: base.sameSite });
    res.clearCookie('refresh_token', { path: base.path, secure: base.secure, sameSite: base.sameSite });
  }

  async register(dto: RegisterDto, res: Response) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (existing) throw new ConflictException('البريد الإلكتروني مستخدم مسبقاً');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        fullName: dto.fullName,
        phone: dto.phone || null,
        role: 'STUDENT',
      },
    });
    const tokens = await this.signTokens(user);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return this.toPublic(user);
  }

  async login(dto: LoginDto, res: Response) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase() } });
    if (!user) throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    const tokens = await this.signTokens(user);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return this.toPublic(user);
  }

  async refresh(refreshToken: string | undefined, res: Response) {
    if (!refreshToken) throw new UnauthorizedException();
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; type: string }>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      if (payload.type !== 'refresh') throw new UnauthorizedException();
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();
      const tokens = await this.signTokens(user);
      this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
      return this.toPublic(user);
    } catch {
      throw new UnauthorizedException();
    }
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.toPublic(user);
  }
}
