import { Body, Controller, Post, Req, Res, UseGuards, Get } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RequestOtpDto } from './dto/request.otp.dto';
import { VerifyOtpDto } from './dto/verify.otp.dto';
import { RegisterCompleteDto } from './dto/register.complete.dto';
import { LoginPasswordDto } from './dto/login.password.dto';
import { LoginOtpRequestDto } from './dto/login.otp.request.dto';
import { LoginOtpVerifyDto } from './dto/login.otp.verify.dto';
import { ForgotPasswordRequestDto } from './dto/forgot.password.request.dto';
import { ForgotPasswordResetDto } from './dto/forgot.password.reset.dto';
import { RequestEmailDto } from './dto/request.email.dto';
import { VerifyEmailDto } from './dto/verify.email.dto';
import { RequestPhoneDto } from './dto/request.phone.dto';
import { VerifyPhoneDto } from './dto/verify.phone.dto';
import { SetRoleDto } from './dto/set.role.dto';
import { JwtAccessGuard } from './guards/jwt-access.guard';
import { JwtRefreshGuard } from './guards/jwt.refresh-guard';

const REFRESH_COOKIE = 'mtp_refresh';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/auth', // scope the cookie to just the auth routes that need it
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ── REGISTRATION ENDPOINTS ──────────────────────────────────────────

  @Post('register/request-otp')
  registerRequestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestRegisterOtp(dto.identifier);
  }

  @Post('register/verify-otp')
  registerVerifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyRegisterOtp(dto.identifier, dto.otp);
  }

  @Post('register/complete')
  async registerComplete(
    @Req() req: Request,
    @Body() dto: RegisterCompleteDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket?.remoteAddress || req.ip || '127.0.0.1';
    const { accessToken, refreshToken, refreshTokenMaxAgeMs, user } = await this.authService.completeRegistration(
      dto.identifier,
      dto.password,
      dto.fullName,
      dto.role,
      {
        ip: clientIp,
        termsVersionHash: dto.termsVersionHash,
        privacyVersionHash: dto.privacyVersionHash,
      },
    );
    res.cookie(REFRESH_COOKIE, refreshToken, { ...cookieOptions, maxAge: refreshTokenMaxAgeMs });
    return { accessToken, user };
  }

  // ── PASSWORD LOGIN ENDPOINT ─────────────────────────────────────────

  @Post('login/password')
  async loginWithPassword(@Body() dto: LoginPasswordDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, refreshTokenMaxAgeMs, user } = await this.authService.loginWithPassword(
      dto.identifier,
      dto.password,
    );
    res.cookie(REFRESH_COOKIE, refreshToken, { ...cookieOptions, maxAge: refreshTokenMaxAgeMs });
    return { accessToken, user };
  }

  // ── OTP LOGIN ENDPOINTS ─────────────────────────────────────────────

  @Post('login/otp/request')
  loginOtpRequest(@Body() dto: LoginOtpRequestDto) {
    return this.authService.requestLoginOtp(dto.identifier);
  }

  @Post('login/otp/verify')
  async loginOtpVerify(@Body() dto: LoginOtpVerifyDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, refreshTokenMaxAgeMs, user } = await this.authService.verifyLoginOtp(
      dto.identifier,
      dto.otp,
    );
    res.cookie(REFRESH_COOKIE, refreshToken, { ...cookieOptions, maxAge: refreshTokenMaxAgeMs });
    return { accessToken, user };
  }

  // ── FORGOT PASSWORD ENDPOINTS ────────────────────────────────────────

  @Post('forgot-password/request')
  forgotPasswordRequest(@Body() dto: ForgotPasswordRequestDto) {
    return this.authService.requestForgotPasswordOtp(dto.identifier);
  }

  @Post('forgot-password/reset')
  forgotPasswordReset(@Body() dto: ForgotPasswordResetDto) {
    return this.authService.resetPassword(dto.identifier, dto.otp, dto.newPassword);
  }

  // ── EMAIL VERIFICATION ENDPOINTS (post-login add/verify email) ───────

  @UseGuards(JwtAccessGuard)
  @Post('email/request')
  requestEmailVerification(@Req() req: Request, @Body() dto: RequestEmailDto) {
    const { sub } = req.user as { sub: string };
    return this.authService.requestEmailVerification(sub, dto.email);
  }

  @UseGuards(JwtAccessGuard)
  @Post('email/verify')
  verifyEmail(@Req() req: Request, @Body() dto: VerifyEmailDto) {
    const { sub } = req.user as { sub: string };
    return this.authService.verifyEmail(sub, dto.otp);
  }

  // ── PHONE VERIFICATION ENDPOINTS (post-login add/verify phone) ────────

  @UseGuards(JwtAccessGuard)
  @Post('phone/request')
  requestPhoneVerification(@Req() req: Request, @Body() dto: RequestPhoneDto) {
    const { sub } = req.user as { sub: string };
    return this.authService.requestPhoneVerification(sub, dto.phone);
  }

  @UseGuards(JwtAccessGuard)
  @Post('phone/verify')
  verifyPhone(@Req() req: Request, @Body() dto: VerifyPhoneDto) {
    const { sub } = req.user as { sub: string };
    return this.authService.verifyPhone(sub, dto.otp);
  }

  // ── SESSION MANAGEMENT ──────────────────────────────────────────────

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { sub, token } = req.user as { sub: string; token: string };
    const { accessToken, refreshToken, refreshTokenMaxAgeMs, user } = await this.authService.refreshTokens(
      sub,
      token,
    );
    res.cookie(REFRESH_COOKIE, refreshToken, { ...cookieOptions, maxAge: refreshTokenMaxAgeMs });
    return { accessToken, user };
  }

  @UseGuards(JwtAccessGuard)
  @Post('role')
  setRole(@Req() req: Request, @Body() dto: SetRoleDto) {
    const { sub } = req.user as { sub: string };
    return this.authService.setRole(sub, dto.role);
  }

  @UseGuards(JwtAccessGuard)
  @Get('me')
  me(@Req() req: Request) {
    const { sub } = req.user as { sub: string };
    return this.authService.getFullUser(sub);
  }

  @UseGuards(JwtAccessGuard)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { sub } = req.user as { sub: string };
    res.clearCookie(REFRESH_COOKIE, { path: cookieOptions.path });
    return this.authService.logout(sub);
  }
}