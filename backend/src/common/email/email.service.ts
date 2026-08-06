import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendVerificationCode(email: string, code: string): Promise<void> {
    const subject = 'Verify your email for MT Pocket';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9e9e9; border-radius: 8px;">
        <h2 style="color: #0F7A53;">MT Pocket Verification</h2>
        <p>Hello,</p>
        <p>Thank you for signing up with MT Pocket. Please use the verification code below to verify your email address. This code is valid for 10 minutes:</p>
        <div style="background-color: #FDF6ED; border: 1px solid #DCCFC0; border-radius: 4px; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #0F7A53; margin: 20px 0;">
          ${code}
        </div>
        <p>If you did not request this code, please ignore this email.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777;">&copy; 2026 MT Pocket. All rights reserved.</p>
      </div>
    `;
    await this.sendMail(email, subject, html);
  }

  async sendPasswordResetCode(email: string, code: string): Promise<void> {
    const subject = 'Reset your password for MT Pocket';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9e9e9; border-radius: 8px;">
        <h2 style="color: #0F7A53;">MT Pocket Password Reset</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password. Please use the 6-digit OTP code below to set a new password. This code is valid for 10 minutes:</p>
        <div style="background-color: #FDF6ED; border: 1px solid #DCCFC0; border-radius: 4px; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #0F7A53; margin: 20px 0;">
          ${code}
        </div>
        <p>If you did not request a password reset, please secure your account immediately.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777;">&copy; 2026 MT Pocket. All rights reserved.</p>
      </div>
    `;
    await this.sendMail(email, subject, html);
  }

  public async sendMail(to: string, subject: string, html: string): Promise<void> {
    const provider = process.env.EMAIL_PROVIDER || 'stub';
    const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';
    const apiKey = process.env.RESEND_API_KEY;

    if (provider === 'stub' || process.env.NODE_ENV === 'test') {
      this.logger.warn(`[EMAIL STUB] to ${to}: [${subject}]`);
      this.logger.log(`[EMAIL STUB BODY] ${html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}`);
      return;
    }

    if (!apiKey) {
      this.logger.error('RESEND_API_KEY is not set — falling back to stub');
      this.logger.warn(`[EMAIL STUB FALLBACK] to ${to}: [${subject}]`);
      return;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from,
          to,
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        this.logger.error(`Resend API failed (${response.status}): ${err}`);
        throw new Error('Email delivery failed');
      }

      const result = await response.json();
      this.logger.log(`Email sent via Resend: ${result.id}`);
    } catch (error) {
      this.logger.error('Error sending email via Resend', error);
      throw error;
    }
  }
}