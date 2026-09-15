import type { EmailMessage, EmailProvider } from "../emailProvider";

// Logs the email instead of sending it. Used when EMAIL_PROVIDER=console
// (local dev) or when no SMTP credentials are configured. Never used to
// silently swallow failures in production — getEmailProvider() will throw
// at startup instead of falling back to this provider unexpectedly.
export class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<void> {
    console.log("──────── [ConsoleEmailProvider] Email not actually sent ────────");
    console.log(`To:      ${message.to}`);
    console.log(`Subject: ${message.subject}`);
    console.log(message.text);
    console.log("───────────────────────────────────────────────────────────────");
  }
}
