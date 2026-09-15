import nodemailer, { Transporter } from "nodemailer";
import type { EmailMessage, EmailProvider } from "../emailProvider";

export class SmtpEmailProvider implements EmailProvider {
  private transporter: Transporter;
  private fromAddress: string;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;
    const from = process.env.EMAIL_FROM_ADDRESS;

    if (!host || !port || !user || !pass || !from) {
      throw new Error(
        "SMTP email provider requires SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD and EMAIL_FROM_ADDRESS to be set in the environment."
      );
    }

    this.fromAddress = from;
    this.transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: { user, pass },
    });
  }

  async send(message: EmailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: this.fromAddress,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
  }
}
