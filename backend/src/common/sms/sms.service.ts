import { Injectable, Logger } from '@nestjs/common';

/**
 * SmsService — MSG91 OTP sender
 * ─────────────────────────────────────────────────────────────────────────
 * MSG91 is the recommended provider for Indian numbers:
 *   • Cheapest (~₹0.20/OTP) with DLT-compliant templates
 *   • API is stable and used by Razorpay, Swiggy, Zomato
 *   • Sign up at https://msg91.com → get authkey + template_id
 *
 * Required .env keys:
 *   MSG91_AUTH_KEY      — your API key from MSG91 dashboard
 *   MSG91_TEMPLATE_ID   — MSG91's own Flow template ID (NOT your DLT
 *                         template ID — see setup notes)
 *   MSG91_SENDER_ID     — 6-char DLT-approved sender ID (e.g. MTPKTT)
 *
 * Set SMS_PROVIDER=stub to log OTPs to console instead of sending,
 * useful in development without burning credits. Leaving SMS_PROVIDER
 * unset (or anything other than "stub") sends real SMS.
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
    const senderId    = process.env.MSG91_SENDER_ID || 'MTPKTT';

    if (!authKey || !templateId) {
      this.logger.error('MSG91_AUTH_KEY or MSG91_TEMPLATE_ID not set — falling back to stub');
      this.logger.warn(`[SMS STUB FALLBACK] to ${phone}: ${message}`);
      return;
    }

    // MSG91 expects phone without '+' and with country code prefix
    // (store phone numbers as E.164, e.g. +919999999999, so this strip
    // always leaves the country code attached).
    const mobile = phone.replace(/^\+/, '');

    // Extract the OTP digits from the message (6 consecutive digits).
    // Fragile by design — if you ever change the wording of the OTP
    // message text in auth.service.ts, make sure it still contains a
    // clean run of exactly 6 digits, or this will silently send "".
    const otpMatch = message.match(/\d{6}/);
    const otp = otpMatch?.[0] ?? '';
    if (!otp) {
      this.logger.error(`Could not extract a 6-digit OTP from message: "${message}"`);
    }

    const body = JSON.stringify({
      template_id: templateId,
      short_url: '0',
      realTimeResponse: '1',
      // ⚠️ "var1" MUST exactly match the variable name you configured
      // when creating this template in the MSG91 dashboard (Flow →
      // template editor). If your template placeholder is named
      // differently (e.g. "OTP" or "otp"), rename this key to match —
      // otherwise MSG91 returns a "type":"error" response even though
      // the HTTP status is 200.
      recipients: [{ mobiles: mobile, var1: otp }],
    });

    try {
      const response = await fetch('https://control.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authkey: authKey,
          accept: 'application/json',
        },
        body,
      });

      const result = await response.json().catch(() => null);

      // MSG91's Flow API can return HTTP 200 with { type: 'error', ... }
      // in the body — a non-OK status alone isn't enough to catch failures.
      if (!response.ok || result?.type === 'error') {
        this.logger.error(
          `MSG91 send failed (status ${response.status}): ${JSON.stringify(result)}`,
        );
        throw new Error('SMS delivery failed — please try again');
      }

      this.logger.log(`MSG91 → ${mobile}: ${result?.message ?? 'sent'}`);
    } catch (error) {
      this.logger.error('Error sending SMS via MSG91', error as any);
      throw error instanceof Error ? error : new Error('SMS delivery failed — please try again');
    }
  }
}