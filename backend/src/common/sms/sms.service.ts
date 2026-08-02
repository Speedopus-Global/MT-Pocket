import { Injectable, Logger } from '@nestjs/common';

/**
 * SmsService — production-ready MSG91 OTP sender
 * ─────────────────────────────────────────────────────────────────────────
 * MSG91 is the recommended provider for Indian numbers:
 *   • Cheapest (~₹0.20/OTP) with DLT-compliant templates
 *   • API is stable and used by Razorpay, Swiggy, Zomato
 *   • Sign up at https://msg91.com → get authkey + template_id
 *
 * Required .env keys:
 *   MSG91_AUTH_KEY      — your API key from MSG91 dashboard
 *   MSG91_TEMPLATE_ID   — DLT-approved SMS template ID
 *   MSG91_SENDER_ID     — 6-char DLT sender ID (e.g. MTPKTT)
 *
 * Set SMS_PROVIDER=stub to log OTPs to console instead of sending,
 * useful in development without burning credits.
 * ─────────────────────────────────────────────────────────────────────────
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async send(phone: string, message: string): Promise<void> {
    if (process.env.SMS_PROVIDER === 'stub' || process.env.NODE_ENV === 'test') {
      // DEV MODE — prints OTP to console, no real SMS sent
      this.logger.warn(`[SMS STUB] to ${phone}: ${message}`);
      return;
    }

    const authKey    = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;
    const senderId   = process.env.MSG91_SENDER_ID || 'MTPKTT';

    if (!authKey || !templateId) {
      this.logger.error('MSG91_AUTH_KEY or MSG91_TEMPLATE_ID not set — falling back to stub');
      this.logger.warn(`[SMS STUB FALLBACK] to ${phone}: ${message}`);
      return;
    }

    // MSG91 expects phone without '+' and with country code prefix
    const mobile = phone.replace(/^\+/, '');

    // Extract the OTP digits from the message (6 consecutive digits)
    const otpMatch = message.match(/\d{6}/);
    const otp = otpMatch?.[0] ?? '';

    const body = JSON.stringify({
      template_id: templateId,
      short_url:   '0',
      realTimeResponse: '1',
      recipients: [{ mobiles: mobile, var1: otp }],
    });

    const response = await fetch('https://control.msg91.com/api/v5/flow/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authkey: authKey,
        accept: 'application/json',
      },
      body,
    });

    if (!response.ok) {
      const err = await response.text();
      this.logger.error(`MSG91 send failed (${response.status}): ${err}`);
      throw new Error(`SMS delivery failed — please try again`);
    }

    const result = await response.json();
    this.logger.log(`MSG91 → ${mobile}: ${result.message ?? 'sent'}`);
  }
}