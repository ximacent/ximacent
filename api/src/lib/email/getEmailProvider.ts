import type { EmailProvider } from "./emailProvider";
import { ConsoleEmailProvider } from "./providers/consoleEmailProvider";
import { SmtpEmailProvider } from "./providers/smtpEmailProvider";

let cachedProvider: EmailProvider | undefined;

export function getEmailProvider(): EmailProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = process.env.EMAIL_PROVIDER ?? "console";

  switch (providerName) {
    case "smtp":
      cachedProvider = new SmtpEmailProvider();
      break;
    case "console":
      cachedProvider = new ConsoleEmailProvider();
      break;
    default:
      throw new Error(`Unknown EMAIL_PROVIDER "${providerName}". Expected "console" or "smtp".`);
  }

  return cachedProvider;
}
