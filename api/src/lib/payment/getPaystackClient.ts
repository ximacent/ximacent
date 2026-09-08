import { PaystackClient } from "../paystack";

let client: PaystackClient | null = null;

export function getPaystackClient(): PaystackClient {
  if (!client) {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      throw new Error("PAYSTACK_SECRET_KEY environment variable is not set");
    }
    client = new PaystackClient({ secretKey });
  }
  return client;
}