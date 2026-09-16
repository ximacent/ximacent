import type { EmailMessage } from "./emailProvider";

const APP_NAME = process.env.APP_NAME || "Ximacent";

function wrap(bodyHtml: string): string {
  return `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
    <h2>${APP_NAME}</h2>
    ${bodyHtml}
  </div>`;
}

export function emailVerificationOTPTemplate(otp: string): Omit<EmailMessage, "to"> {
  return {
    subject: `Your ${APP_NAME} verification code`,
    text: `Your verification code is ${otp}. It expires in 10 minutes. If you didn't request this, ignore this email.`,
    html: wrap(`<p>Your verification code is:</p><h1 style="letter-spacing:4px;">${otp}</h1><p>This code expires in 10 minutes.</p>`),
  };
}

export function emailVerifiedConfirmationTemplate(): Omit<EmailMessage, "to"> {
  return {
    subject: `Your email has been verified`,
    text: `Your email address has been successfully verified.`,
    html: wrap(`<p>Your email address has been successfully verified.</p>`),
  };
}

export function roleChangedTemplate(newRole: string): Omit<EmailMessage, "to"> {
  return {
    subject: `Your account role has been updated`,
    text: `Your ${APP_NAME} account role has been changed to "${newRole}" by an administrator. If you weren't expecting this, contact support.`,
    html: wrap(`<p>Your account role has been changed to <strong>${newRole}</strong> by an administrator.</p><p>If you weren't expecting this, contact support.</p>`),
  };
}

export function passwordResetOTPTemplate(otp: string): Omit<EmailMessage, "to"> {
  return {
    subject: `Your ${APP_NAME} password reset code`,
    text: `Your password reset code is ${otp}. It expires in 10 minutes. If you didn't request this, you can safely ignore this email — your password will not be changed.`,
    html: wrap(`<p>Your password reset code is:</p><h1 style="letter-spacing:4px;">${otp}</h1><p>This code expires in 10 minutes. If you didn't request this, you can safely ignore this email — your password will not be changed.</p>`),
  };
}

export function passwordChangedTemplate(): Omit<EmailMessage, "to"> {
  return {
    subject: `Your password was changed`,
    text: `Your ${APP_NAME} account password was just changed. If this wasn't you, contact support immediately.`,
    html: wrap(`<p>Your account password was just changed. If this wasn't you, contact support immediately.</p>`),
  };
}

export function phoneChangedTemplate(newPhone: string): Omit<EmailMessage, "to"> {
  return {
    subject: `Your phone number was changed`,
    text: `Your ${APP_NAME} account phone number was changed to ${newPhone}. If this wasn't you, contact support immediately.`,
    html: wrap(`<p>Your account phone number was changed to <strong>${newPhone}</strong>.</p><p>If this wasn't you, contact support immediately.</p>`),
  };
}

// Sent to the OLD email address once a change completes — the old
// address is still the stable, previously-verified channel at the moment
// this fires, same reasoning as phoneChangedTemplate going out before the
// old number could be considered stale.
export function emailChangedTemplate(newEmail: string): Omit<EmailMessage, "to"> {
  return {
    subject: `Your account email was changed`,
    text: `Your ${APP_NAME} account email was changed to ${newEmail}. You'll need to use the new email to log in from now on. If this wasn't you, contact support immediately.`,
    html: wrap(`<p>Your account email was changed to <strong>${newEmail}</strong>. You'll need to use the new email to log in from now on.</p><p>If this wasn't you, contact support immediately.</p>`),
  };
}

export function organizerApplicationSubmittedTemplate(): Omit<EmailMessage, "to"> {
  return {
    subject: `Your organizer application has been submitted`,
    text: `We've received your organizer application. Our team will review it and get back to you shortly.`,
    html: wrap(`<p>We've received your organizer application. Our team will review it and get back to you shortly.</p>`),
  };
}

export function organizerApprovedTemplate(): Omit<EmailMessage, "to"> {
  return {
    subject: `Your organizer application has been approved`,
    text: `Congratulations! Your organizer application has been approved. You can now create elections.`,
    html: wrap(`<p>Congratulations! Your organizer application has been approved. You can now create elections.</p>`),
  };
}

export function organizerRejectedTemplate(reason: string): Omit<EmailMessage, "to"> {
  return {
    subject: `Your organizer application needs changes`,
    text: `Your organizer application was not approved. Reason: ${reason}. You can update your information and resubmit.`,
    html: wrap(`<p>Your organizer application was not approved.</p><p><strong>Reason:</strong> ${reason}</p><p>You can update your information and resubmit.</p>`),
  };
}

export function organizerSuspendedTemplate(): Omit<EmailMessage, "to"> {
  return {
    subject: `Your organizer account has been suspended`,
    text: `Your organizer account has been suspended. You will not be able to create or manage elections until this is resolved. Contact support for details.`,
    html: wrap(`<p>Your organizer account has been suspended. You will not be able to create or manage elections until this is resolved.</p><p>Contact support for details.</p>`),
  };
}

export function lowSmsCreditTemplate(creditLeft: number): Omit<EmailMessage, "to"> {
  return {
    subject: `⚠️ SMS credit running low (${creditLeft} left)`,
    text: `The mNotify SMS account has only ${creditLeft} credits remaining. Phone verification OTPs will stop sending once credits run out. Please top up soon.`,
    html: wrap(`<p>The mNotify SMS account has only <strong>${creditLeft}</strong> credits remaining.</p><p>Phone verification OTPs will stop sending once credits run out. Please top up soon.</p>`),
  };
}

export function electionSubmittedTemplate(electionTitle: string): Omit<EmailMessage, "to"> {
  return {
    subject: `"${electionTitle}" submitted for review`,
    text: `Your election "${electionTitle}" has been submitted for admin review.`,
    html: wrap(`<p>Your election <strong>${electionTitle}</strong> has been submitted for admin review.</p>`),
  };
}

export function electionApprovedTemplate(electionTitle: string): Omit<EmailMessage, "to"> {
  return {
    subject: `"${electionTitle}" has been approved`,
    text: `Your election "${electionTitle}" has been approved and is ready to launch.`,
    html: wrap(`<p>Your election <strong>${electionTitle}</strong> has been approved and is ready to launch.</p>`),
  };
}

export function electionLaunchedTemplate(electionTitle: string): Omit<EmailMessage, "to"> {
  return {
    subject: `"${electionTitle}" is now live`,
    text: `Your election "${electionTitle}" is now live and accepting votes — its start date has arrived.`,
    html: wrap(`<p>Your election <strong>${electionTitle}</strong> is now live and accepting votes.</p>`),
  };
}

export function electionRejectedTemplate(electionTitle: string, reason: string): Omit<EmailMessage, "to"> {
  return {
    subject: `"${electionTitle}" needs changes`,
    text: `Your election "${electionTitle}" was not approved. Reason: ${reason}.`,
    html: wrap(`<p>Your election <strong>${electionTitle}</strong> was not approved.</p><p><strong>Reason:</strong> ${reason}</p>`),
  };
}
