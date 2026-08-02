import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';

export const OTP_LENGTH = 6;
export const OTP_TTL_MINUTES = 5;
export const OTP_MAX_ATTEMPTS = 5;

export function generateOtp(): string {
  // crypto.randomInt is cryptographically secure — unlike Math.random()
  return randomInt(100000, 1000000).toString();
}

export async function hashOtp(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

export async function compareOtp(otp: string, hash: string): Promise<boolean> {
  return bcrypt.compare(otp, hash);
}

export function otpExpiryDate(): Date {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
}