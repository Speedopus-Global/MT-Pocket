// ── KYC transactional email templates ─────────────────────────────────────
// All templates return { subject, html } — pass to EmailService.sendMail()
// Keep brand colours in sync with your design tokens.
// ──────────────────────────────────────────────────────────────────────────

const BRAND_GREEN = '#0F7A53';
const BRAND_BG = '#FDF6ED';
const BRAND_BORDER = '#DCCFC0';

function base(content: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;
                padding: 24px; border: 1px solid ${BRAND_BORDER}; border-radius: 12px;
                background: #ffffff;">
      <div style="margin-bottom: 20px;">
        <h2 style="color: ${BRAND_GREEN}; margin: 0 0 4px 0;">MT Pocket</h2>
        <div style="height: 2px; background: ${BRAND_GREEN}; border-radius: 2px;"></div>
      </div>
      ${content}
      <hr style="border: 0; border-top: 1px solid #eee; margin: 28px 0 16px;" />
      <p style="font-size: 11px; color: #999; margin: 0;">
        &copy; 2026 MT Pocket. All rights reserved.<br/>
        This is an automated message — please do not reply.
      </p>
    </div>
  `;
}

function infoBox(text: string): string {
  return `<div style="background: ${BRAND_BG}; border: 1px solid ${BRAND_BORDER};
                       border-radius: 6px; padding: 16px; margin: 16px 0;
                       font-size: 14px; color: #333;">${text}</div>`;
}

// ── 1. Submission confirmation ─────────────────────────────────────────────
export function kycSubmittedEmail(name: string, docType: string, version: number) {
  return {
    subject: 'KYC Document Received — MT Pocket',
    html: base(`
      <p style="font-size: 15px; color: #333;">Hi ${name || 'there'},</p>
      <p style="color: #555;">
        We've received your <strong>${humanDocType(docType)}</strong> for identity verification
        (submission #${version}). Our team will review it within <strong>2–3 working days</strong>.
      </p>
      ${infoBox(`
        <strong>What happens next?</strong><br/>
        &bull; Our reviewer will inspect your document.<br/>
        &bull; If everything looks good, your Identity Verified badge will be activated.<br/>
        &bull; If we need anything else, we'll send you another email with details.
      `)}
      <p style="color: #555; font-size: 13px;">
        You can track your verification status in your MT Pocket dashboard at any time.
        Do not resubmit unless you receive a specific request from us.
      </p>
    `),
  };
}

// ── 2. Under review (reviewer claimed it) ─────────────────────────────────
export function kycUnderReviewEmail(name: string) {
  return {
    subject: 'Your KYC Document Is Being Reviewed — MT Pocket',
    html: base(`
      <p style="font-size: 15px; color: #333;">Hi ${name || 'there'},</p>
      <p style="color: #555;">
        Good news — your identity document is now <strong>actively under review</strong>
        by our verification team. You'll receive another email once a decision is made.
      </p>
      ${infoBox('This usually takes less than 1 working day once review has started.')}
    `),
  };
}

// ── 3. Approved ────────────────────────────────────────────────────────────
export function kycApprovedEmail(name: string) {
  return {
    subject: '✅ Identity Verified — MT Pocket',
    html: base(`
      <p style="font-size: 15px; color: #333;">Hi ${name || 'there'},</p>
      <p style="color: #555;">
        Great news! Your identity has been <strong style="color: ${BRAND_GREEN};">verified</strong>.
        Your <strong>Identity Verified</strong> badge is now active on your profile.
      </p>
      ${infoBox(`
        <strong>What this means:</strong><br/>
        &bull; Other users can see your verified badge, increasing trust.<br/>
        &bull; You can access all borrower and lender features on MT Pocket.<br/>
        &bull; Your document is securely stored and won't be requested again.
      `)}
      <p style="color: #555; font-size: 13px;">
        Thank you for completing your verification. You can now use MT Pocket with full trust.
      </p>
    `),
  };
}

// ── 4. Rejected ────────────────────────────────────────────────────────────
export function kycRejectedEmail(name: string, reason: string) {
  return {
    subject: 'Action Required: KYC Document Rejected — MT Pocket',
    html: base(`
      <p style="font-size: 15px; color: #333;">Hi ${name || 'there'},</p>
      <p style="color: #555;">
        Unfortunately, we were unable to verify your identity document.
        Please review the reason below and resubmit.
      </p>
      ${infoBox(`<strong>Reason for rejection:</strong><br/>${reason}`)}
      <p style="color: #555;"><strong>How to fix this:</strong></p>
      <ul style="color: #555; font-size: 14px; line-height: 1.8;">
        <li>Make sure the document is clearly visible with no glare or shadows.</li>
        <li>Ensure all four corners of the document are in the frame.</li>
        <li>Only upload PNG, JPG, or PDF files under 8MB.</li>
        <li>The document must be valid and not expired.</li>
      </ul>
      <p style="color: #555; font-size: 13px;">
        Log in to your MT Pocket dashboard and resubmit from the Identity Verification section.
        If you believe this is an error, contact our support team.
      </p>
    `),
  };
}

// ── 5. Reupload required ───────────────────────────────────────────────────
export function kycReuploadEmail(name: string, reason: string) {
  return {
    subject: 'Action Required: Please Resubmit Your Document — MT Pocket',
    html: base(`
      <p style="font-size: 15px; color: #333;">Hi ${name || 'there'},</p>
      <p style="color: #555;">
        Our reviewer has requested a <strong>new submission</strong> of your identity document.
        Your current submission cannot be processed for the following reason:
      </p>
      ${infoBox(reason)}
      <p style="color: #555; font-size: 13px;">
        Please log in to your MT Pocket dashboard and upload a new document.
        This will create a fresh review cycle — you don't need to contact support.
      </p>
    `),
  };
}

// ── 6. Duplicate document detected (security alert to user) ───────────────
export function kycDuplicateAlertEmail(name: string) {
  return {
    subject: '⚠️ Security Alert: Document Already on File — MT Pocket',
    html: base(`
      <p style="font-size: 15px; color: #333;">Hi ${name || 'there'},</p>
      <p style="color: #555;">
        We detected that the document you submitted has already been associated
        with another account on MT Pocket. For security reasons, this submission
        has been flagged and paused.
      </p>
      ${infoBox(
        'If you believe this is a mistake, or if someone else may have submitted ' +
        'a document using your identity, please contact our support team immediately.'
      )}
      <p style="color: #555; font-size: 13px; color: #c0392b;">
        <strong>Do not share your identity documents with anyone.</strong>
      </p>
    `),
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────
function humanDocType(docType: string): string {
  const map: Record<string, string> = {
    aadhaar: 'Aadhaar Card',
    pan: 'PAN Card',
    passport: 'Passport',
    driving_license: 'Driving Licence',
  };
  return map[docType] ?? docType;
}