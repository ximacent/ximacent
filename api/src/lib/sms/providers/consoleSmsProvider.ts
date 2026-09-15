import type { SmsMessage, SmsProvider } from "../smsProvider";

export class ConsoleSmsProvider implements SmsProvider {
  async send(message: SmsMessage): Promise<void> {
    console.log("──────── [ConsoleSmsProvider] SMS not actually sent ────────");
    console.log(`To:      ${message.to}`);
    console.log(message.body);
    console.log("──────────────────────────────────────────────────────────");
  }
}
