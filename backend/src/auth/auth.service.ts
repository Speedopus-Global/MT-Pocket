import { BadRequestException, Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/user.service';
import { SmsService } from '../common/sms/sms.service';
import { EmailService } from '../common/email/email.service';
import {
  compareOtp,
  generateOtp,
  hashOtp,
  otpExpiryDate,
  OTP_MAX_ATTEMPTS,
} from '../common/otp/otp.util';
import { UserDocument, User } from '../users/schemas/user.schema';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '30d';
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private smsService: SmsService,
    private emailService: EmailService,
    private jwtService: JwtService,
  ) {}

  // ── REGISTRATION FLOW ───────────────────────────────────────────────

  async requestRegisterOtp(identifier: string) {
    const isEmail = identifier.includes('@');

    // Reject if already fully registered via this identifier
    const existing = isEmail
      ? await this.usersService.findByEmail(identifier)
      : await this.usersService.findByPhone(identifier);

    if (existing && existing.passwordHash !== null) {
      throw new BadRequestException(
        isEmail
          ? 'This email is already registered. Please log in.'
          : 'This phone number is already registered. Please log in.',
      );
    }

    const user = await this.usersService.findOrCreateByIdentifier(identifier);
    const otp = generateOtp();

    await this.usersService.updateById(user._id.toString(), {
      otpHash: await hashOtp(otp),
      otpExpiresAt: otpExpiryDate(),
      otpAttempts: 0,
    });

    if (isEmail) {
      await this.emailService.sendVerificationCode(identifier, otp);
    } else {
      await this.smsService.send(
        identifier,
        `Your MT Pocket verification code is ${otp}. It expires in 5 minutes.`,
      );
    }

    return { message: 'OTP sent' };
  }

  async verifyRegisterOtp(identifier: string, otp: string) {
    const user = await this.usersService.findByIdentifier(identifier);
    if (!user || !user.otpHash || !user.otpExpiresAt) {
      throw new BadRequestException('No OTP requested for this identifier');
    }

    if (user.otpExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('OTP has expired — request a new one');
    }

    if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestException('Too many incorrect attempts — request a new OTP');
    }

    const isValid = await compareOtp(otp, user.otpHash);
    if (!isValid) {
      await this.usersService.updateById(user._id.toString(), { otpAttempts: user.otpAttempts + 1 });
      const attemptsLeft = OTP_MAX_ATTEMPTS - (user.otpAttempts + 1);
      throw new BadRequestException(`Incorrect code — ${Math.max(attemptsLeft, 0)} attempts left`);
    }

    const isEmail = identifier.includes('@');

    // OTP correct — clear it and mark that channel verified
    await this.usersService.updateById(user._id.toString(), {
      otpHash: null,
      otpExpiresAt: null,
      otpAttempts: 0,
      ...(isEmail ? { emailVerified: true } : { phoneVerified: true }),
    });

    return {
      verified: true,
      message: isEmail
        ? 'Email verified. Complete registration.'
        : 'Phone verified. Complete registration.',
    };
  }

  async completeRegistration(
    identifier: string,
    password: string,
    fullName: string,
    role: 'borrower' | 'lender' | 'both',
    consentData?: { ip?: string; termsVersionHash?: string; privacyVersionHash?: string },
  ) {
    const user = await this.usersService.findByIdentifier(identifier);
    if (!user) {
      throw new BadRequestException('Verification required first');
    }
    if (user.passwordHash !== null) {
      throw new BadRequestException('Registration already complete. Please log in.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const updatedUser = await this.usersService.updateById(user._id.toString(), {
      passwordHash,
      fullName,
      role,
      termsAcceptedAt: new Date(),
      termsAcceptedIp: consentData?.ip || null,
      termsVersionHash: consentData?.termsVersionHash || 'tc_v2026_08_12',
      privacyVersionHash: consentData?.privacyVersionHash || 'pp_v2026_08_12',
    });

    if (!updatedUser) {
      throw new NotFoundException('User not found during registration completion');
    }

    return this.issueTokens(updatedUser);
  }

  // ── DUAL LOGIN FLOW ────────────────────────────────────────────────

  async loginWithPassword(identifier: string, password: string) {
    const user = await this.usersService.findByIdentifier(identifier);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid phone number/email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid phone number/email or password');
    }

    return this.issueTokens(user);
  }

  async requestLoginOtp(identifier: string) {
    const user = await this.usersService.findByIdentifier(identifier);
    if (!user || !user.passwordHash) {
      throw new BadRequestException('Account not registered. Please sign up first.');
    }

    const otp = generateOtp();
    const expiry = otpExpiryDate();
    const hash = await hashOtp(otp);

    await this.usersService.updateById(user._id.toString(), {
      otpHash: hash,
      otpExpiresAt: expiry,
      otpAttempts: 0,
    });

    const isEmail = identifier.includes('@');
    if (isEmail) {
      if (!user.email) {
        throw new BadRequestException('Email field missing on user profile');
      }
      await this.emailService.sendVerificationCode(user.email, otp);
    } else {
      if (!user.phone) {
        throw new BadRequestException('Phone number missing on user profile');
      }
      await this.smsService.send(user.phone, `Your MT Pocket verification code is ${otp}. It expires in 5 minutes.`);
    }

    return { message: 'OTP sent' };
  }

  async verifyLoginOtp(identifier: string, otp: string) {
    const user = await this.usersService.findByIdentifier(identifier);
    if (!user || !user.otpHash || !user.otpExpiresAt) {
      throw new BadRequestException('No OTP requested');
    }

    if (user.otpExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('OTP has expired');
    }

    if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestException('Too many incorrect attempts — request a new OTP');
    }

    const isValid = await compareOtp(otp, user.otpHash);
    if (!isValid) {
      await this.usersService.updateById(user._id.toString(), { otpAttempts: user.otpAttempts + 1 });
      const attemptsLeft = OTP_MAX_ATTEMPTS - (user.otpAttempts + 1);
      throw new BadRequestException(`Incorrect code — ${Math.max(attemptsLeft, 0)} attempts left`);
    }

    await this.usersService.updateById(user._id.toString(), {
      otpHash: null,
      otpExpiresAt: null,
      otpAttempts: 0,
    });

    return this.issueTokens(user);
  }

  // ── FORGOT PASSWORD FLOW ───────────────────────────────────────────

  async requestForgotPasswordOtp(identifier: string) {
    const user = await this.usersService.findByIdentifier(identifier);
    if (!user || !user.passwordHash) {
      throw new BadRequestException('Account not registered');
    }

    const otp = generateOtp();
    const expiry = otpExpiryDate();
    const hash = await hashOtp(otp);

    await this.usersService.updateById(user._id.toString(), {
      passwordResetOtpHash: hash,
      passwordResetOtpExpiresAt: expiry,
      passwordResetOtpAttempts: 0,
    });

    const isEmail = identifier.includes('@');
    if (isEmail) {
      if (!user.email) {
        throw new BadRequestException('No email registered');
      }
      await this.emailService.sendPasswordResetCode(user.email, otp);
    } else {
      if (!user.phone) {
        throw new BadRequestException('No phone number registered');
      }
      await this.smsService.send(user.phone, `Your MT Pocket password reset code is ${otp}. It expires in 5 minutes.`);
    }

    return { message: 'Password reset OTP sent' };
  }

  async resetPassword(identifier: string, otp: string, password: string) {
    const user = await this.usersService.findByIdentifier(identifier);
    if (!user || !user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
      throw new BadRequestException('No reset OTP requested');
    }

    if (user.passwordResetOtpExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Reset OTP has expired');
    }

    if (user.passwordResetOtpAttempts >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestException('Too many incorrect attempts');
    }

    const isValid = await compareOtp(otp, user.passwordResetOtpHash);
    if (!isValid) {
      await this.usersService.updateById(user._id.toString(), {
        passwordResetOtpAttempts: user.passwordResetOtpAttempts + 1,
      });
      throw new BadRequestException('Incorrect OTP code');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await this.usersService.updateById(user._id.toString(), {
      passwordHash,
      passwordResetOtpHash: null,
      passwordResetOtpExpiresAt: null,
      passwordResetOtpAttempts: 0,
    });

    return { message: 'Password reset successful' };
  }

  // ── EMAIL VERIFICATION FLOW ─────────────────────────────────────────

  async requestEmailVerification(userId: string, email: string) {
    const existing = await this.usersService.findByEmail(email);
    if (existing && existing._id.toString() !== userId && existing.emailVerified) {
      throw new BadRequestException('Email is already registered by another verified user');
    }

    const otp = generateOtp();
    const expiry = otpExpiryDate();
    const hash = await hashOtp(otp);

    // Save temporary unverified email details onto current user
    await this.usersService.updateById(userId, {
      email,
      emailOtpHash: hash,
      emailOtpExpiresAt: expiry,
      emailOtpAttempts: 0,
    });

    await this.emailService.sendVerificationCode(email, otp);
    return { message: 'Verification code sent to your email' };
  }

  async verifyEmail(userId: string, otp: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.emailOtpHash || !user.emailOtpExpiresAt) {
      throw new BadRequestException('No email verification requested');
    }

    if (user.emailOtpExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Verification code has expired');
    }

    if (user.emailOtpAttempts >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestException('Too many verification attempts');
    }

    const isValid = await compareOtp(otp, user.emailOtpHash);
    if (!isValid) {
      await this.usersService.updateById(userId, {
        emailOtpAttempts: user.emailOtpAttempts + 1,
      });
      throw new BadRequestException('Incorrect code');
    }

    const updated = await this.usersService.updateById(userId, {
      emailVerified: true,
      emailOtpHash: null,
      emailOtpExpiresAt: null,
      emailOtpAttempts: 0,
    });

    return { emailVerified: true, email: updated?.email };
  }

  // ── PHONE VERIFICATION FLOW (post-login, mirrors email flow) ────────

  async requestPhoneVerification(userId: string, phone: string) {
    // Reject if a different verified user already owns this phone
    const existing = await this.usersService.findByPhone(phone);
    if (existing && existing._id.toString() !== userId && existing.phoneVerified) {
      throw new BadRequestException('Phone number is already registered by another verified user');
    }

    const otp = generateOtp();
    const expiry = otpExpiryDate();
    const hash = await hashOtp(otp);

    await this.usersService.updateById(userId, {
      phone,
      phoneOtpHash: hash,
      phoneOtpExpiresAt: expiry,
      phoneOtpAttempts: 0,
    });

    await this.smsService.send(
      phone,
      `Your MT Pocket verification code is ${otp}. It expires in 5 minutes.`,
    );
    return { message: 'Verification code sent to your phone' };
  }

  async verifyPhone(userId: string, otp: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.phoneOtpHash || !user.phoneOtpExpiresAt) {
      throw new BadRequestException('No phone verification requested');
    }

    if (user.phoneOtpExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Verification code has expired');
    }

    if (user.phoneOtpAttempts >= OTP_MAX_ATTEMPTS) {
      throw new BadRequestException('Too many verification attempts');
    }

    const isValid = await compareOtp(otp, user.phoneOtpHash);
    if (!isValid) {
      await this.usersService.updateById(userId, {
        phoneOtpAttempts: user.phoneOtpAttempts + 1,
      });
      throw new BadRequestException('Incorrect code');
    }

    const updated = await this.usersService.updateById(userId, {
      phoneVerified: true,
      phoneOtpHash: null,
      phoneOtpExpiresAt: null,
      phoneOtpAttempts: 0,
    });

    return { phoneVerified: true, phone: updated?.phone };
  }

  // ── ROLE & TOKENS ───────────────────────────────────────────────────

  async setRole(userId: string, role: 'borrower' | 'lender' | 'both') {
    const updated = await this.usersService.updateById(userId, { role });
    if (!updated) {
      throw new BadRequestException('User not found');
    }
    return { role: updated.role };
  }

  async refreshTokens(userId: string, providedToken: string) {
    const user = await this.usersService.findById(userId);
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Session expired — please log in again');
    }

    const matches = await bcrypt.compare(providedToken, user.refreshTokenHash);
    if (!matches) {
      await this.usersService.updateById(userId, { refreshTokenHash: null });
      throw new UnauthorizedException('Session invalid — please log in again');
    }

    return this.issueTokens(user);
  }

  async logout(userId: string) {
    await this.usersService.updateById(userId, { refreshTokenHash: null });
    return { message: 'Logged out' };
  }

  private async issueTokens(user: UserDocument) {
    const payload = { sub: user._id.toString(), phone: user.phone, role: user.role ,systemRole: user.systemRole, };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET!,
      expiresIn: ACCESS_TOKEN_TTL,
    });

    const refreshToken = this.jwtService.sign(
      { sub: user._id.toString() },
      { secret: process.env.JWT_REFRESH_SECRET!, expiresIn: REFRESH_TOKEN_TTL },
    );

    await this.usersService.updateById(user._id.toString(), {
      refreshTokenHash: await bcrypt.hash(refreshToken, 10),
    });

    return {
      accessToken,
      refreshToken,
      refreshTokenMaxAgeMs: REFRESH_TOKEN_TTL_MS,
      user: this.toPublicUser(user),
    };
  }

  // Single source of truth for the "user" shape sent to the frontend —
  // used by issueTokens() (login/register/refresh) AND getFullUser()
  // (/auth/me), so the two endpoints can never drift out of sync with
  // each other the way a second hand-copied field list would.
  private toPublicUser(user: UserDocument) {
    const fullyVerified =
      !!user.phone &&
      !!user.email &&
      !!user.phoneVerified &&
      !!user.emailVerified;

    return {
      id: user._id.toString(),
      phone: user.phone,
      email: user.email,
      emailVerified: user.emailVerified,
      phoneVerified: user.phoneVerified,
      fullyVerified,
      role: user.role,
      systemRole: user.systemRole,
      fullName: user.fullName,
      identityVerified: user.identityVerified,
      // KYC status trio — verificationStatus/idDocumentType/
      // idDocumentRejectionReason are denormalized onto User by
      // VerificationService; Dashboard.jsx/AdminDashboard.jsx read
      // these under the idDocumentStatus name.
      idDocumentStatus: user.verificationStatus,
      idDocumentType: user.idDocumentType,
      idDocumentRejectionReason: user.idDocumentRejectionReason,
      avatarUrl: user.avatarUrl,
      address: user.address,
      location: user.location,
    };
  }

  // Backs GET /auth/me — returns the SAME shape as login/register/refresh's
  // `user` object, unlike req.user (which is just the JWT strategy's
  // { sub, phone, role, systemRole, accountStatus } — no fullName,
  // avatarUrl, KYC status, etc). Use this if the frontend ever needs to
  // re-sync the full profile without a token refresh.
  async getFullUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toPublicUser(user);
  }
}