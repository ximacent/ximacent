import { getEmailProvider } from "./getEmailProvider";
import {
  emailVerificationOTPTemplate,
  emailVerifiedConfirmationTemplate,
  roleChangedTemplate,
  passwordResetOTPTemplate,
  passwordChangedTemplate,
  organizerApplicationSubmittedTemplate,
  organizerApprovedTemplate,
  organizerRejectedTemplate,
  organizerSuspendedTemplate,
  lowSmsCreditTemplate,
  electionSubmittedTemplate,
  electionApprovedTemplate,
  electionRejectedTemplate,
  phoneChangedTemplate,
  emailChangedTemplate,
} from "./templates";

/**
 * Single entry point for all outbound email in the app. Services call
 * these methods; they never talk to nodemailer/SMTP/a provider directly.
 *
 * Failures here are logged and swallowed by design — a transient email
 * outage must never roll back or fail a business operation (e.g. an
 * organizer approval succeeding in the DB but throwing because the SMTP
 * server timed out would be worse than a delayed/missing notification).
 */
export class EmailService {
  private static async safeSend(to: string, message: { subject: string; html: string; text: string }) {
    try {
      await getEmailProvider().send({ to, ...message });
    } catch (err) {
      console.error(`EmailService: failed to send "${message.subject}" to ${to}`, err);
    }
  }

  static async sendEmailVerificationOTP(to: string, otp: string) {
    await this.safeSend(to, emailVerificationOTPTemplate(otp));
  }

  static async sendEmailVerifiedConfirmation(to: string) {
    await this.safeSend(to, emailVerifiedConfirmationTemplate());
  }

  static async sendRoleChanged(to: string, newRole: string) {
    await this.safeSend(to, roleChangedTemplate(newRole));
  }

  static async sendPasswordResetOTP(to: string, otp: string) {
    await this.safeSend(to, passwordResetOTPTemplate(otp));
  }

  static async sendPasswordChanged(to: string) {
    await this.safeSend(to, passwordChangedTemplate());
  }

  static async sendPhoneChanged(to: string, newPhone: string) {
    await this.safeSend(to, phoneChangedTemplate(newPhone));
  }

  static async sendEmailChanged(to: string, newEmail: string) {
    await this.safeSend(to, emailChangedTemplate(newEmail));
  }  

  static async sendOrganizerApplicationSubmitted(to: string) {
    await this.safeSend(to, organizerApplicationSubmittedTemplate());
  }

  static async sendOrganizerApproved(to: string) {
    await this.safeSend(to, organizerApprovedTemplate());
  }

  static async sendOrganizerRejected(to: string, reason: string) {
    await this.safeSend(to, organizerRejectedTemplate(reason));
  }

  static async sendOrganizerSuspended(to: string) {
    await this.safeSend(to, organizerSuspendedTemplate());
  }

  static async sendLowSmsCredit(to: string, creditLeft: number) {
    await this.safeSend(to, lowSmsCreditTemplate(creditLeft));
  }

  static async sendElectionSubmitted(to: string, electionTitle: string) {
    await this.safeSend(to, electionSubmittedTemplate(electionTitle));
  }

  static async sendElectionApproved(to: string, electionTitle: string) {
    await this.safeSend(to, electionApprovedTemplate(electionTitle));
  }

  static async sendElectionRejected(to: string, electionTitle: string, reason: string) {
    await this.safeSend(to, electionRejectedTemplate(electionTitle, reason));
  }
}
