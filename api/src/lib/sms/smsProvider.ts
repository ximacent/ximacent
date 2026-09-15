export interface SmsMessage {
  to: string; // E.164-ish phone number, e.g. +233201234567
  body: string;
}

export interface SmsProvider {
  send(message: SmsMessage): Promise<void>;
}

// Providers throw this (rather than a plain Error) when they can tell
// whether the failure is worth retrying — e.g. a 5xx/timeout/network
// error is transient and retryable, but "sender ID not approved" or "bad
// API key" will fail identically on every retry and should stop
// immediately. If a provider throws a plain Error instead, SmsService
// treats it as retryable by default (safer to retry-and-eventually-fail
// than to silently give up on a transient blip).
export class SmsSendError extends Error {
  constructor(message: string, public readonly retryable: boolean) {
    super(message);
    this.name = "SmsSendError";
  }
}
