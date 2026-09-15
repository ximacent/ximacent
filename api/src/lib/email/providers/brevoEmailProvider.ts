import type { EmailMessage, EmailProvider } from "../emailProvider";

export class BrevoEmailProvider implements EmailProvider {
  private apiKey: string;
  private fromAddress: string;

  constructor() {
    const apiKey = process.env.BREVO_API_KEY;
    const from = process.env.EMAIL_FROM_ADDRESS;

    if (!apiKey || !from) {
      throw new Error(
        "Brevo email provider requires BREVO_API_KEY and EMAIL_FROM_ADDRESS to be set in the environment."
      );
    }

    this.apiKey = apiKey;
    this.fromAddress = from;
  }

  async send(message: EmailMessage): Promise<void> {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "api-key": this.apiKey,
      },
      body: JSON.stringify({
        sender: { email: this.fromAddress },
        to: [{ email: message.to }],
        subject: message.subject,
        htmlContent: message.html,
        textContent: message.text,
      }),
    });

    const responseBody = await response.text();
    // console.log(`Brevo API response (${response.status}):`, responseBody);

    if (!response.ok) {
      throw new Error(`Brevo send failed (${response.status}): ${responseBody}`);
    }
  }
}