import type { SmsProvider } from "./smsProvider";
import { ConsoleSmsProvider } from "./providers/consoleSmsProvider";
import { MnotifySmsProvider } from "./providers/mnotifySmsProvider";

let cachedProvider: SmsProvider | undefined;

export function getSmsProvider(): SmsProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = process.env.SMS_PROVIDER ?? "console";

  switch (providerName) {
    case "mnotify":
      cachedProvider = new MnotifySmsProvider();
      break;
    case "console":
      cachedProvider = new ConsoleSmsProvider();
      break;
    default:
      throw new Error(`Unknown SMS_PROVIDER "${providerName}". Expected "console" or "mnotify".`);
  }

  return cachedProvider;
}
