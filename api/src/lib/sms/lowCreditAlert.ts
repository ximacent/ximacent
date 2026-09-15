import { checkRateLimit } from "@/lib/rateLimit/inMemoryRateLimiter";
import { AppDataSource } from "@/database/data-source";
import { User, UserRole } from "@/database/entities/User";
import { EmailService } from "@/lib/email/email.service";

const DEFAULT_THRESHOLD = 20;
const ALERT_DEDUPE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Call after every successful SMS send with the credit_left mNotify
 * reports. If below threshold, emails every admin/super_admin account —
 * at most once per hour (in-memory dedupe), so a burst of OTP sends while
 * low on credit doesn't flood every admin's inbox with the same warning.
 *
 * Fire-and-forget by design (see call site in mnotifySmsProvider.ts) — a
 * failure here must never affect the SMS send that triggered it.
 */
export async function checkLowCreditAlert(creditLeft: number): Promise<void> {
  const threshold = Number(process.env.SMS_LOW_CREDIT_THRESHOLD) || DEFAULT_THRESHOLD;
  if (creditLeft > threshold) return;

  const { allowed } = checkRateLimit("sms:low-credit-alert", 1, ALERT_DEDUPE_WINDOW_MS);
  if (!allowed) return; // already alerted recently

  try {
    const db = await AppDataSource();
    const admins = await db.getRepository(User).find({
      where: [{ role: UserRole.ADMIN, isDeleted: false }, { role: UserRole.SUPER_ADMIN, isDeleted: false }],
    });

    await Promise.all(admins.map((admin) => EmailService.sendLowSmsCredit(admin.email, creditLeft)));
  } catch (err) {
    console.error("checkLowCreditAlert: failed to notify admins of low SMS credit", err);
  }
}
