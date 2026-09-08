import { PaymentMethod } from "@/database/entities/Payment";
import type { PaymentMetaItem } from "@/database/entities/PaymentMeta";

// re-export so the rest of the codebase can import from one place
export type { PaymentMetaItem };

// ─── Base DTO ─────────────────────────────────────────────────────────────────

export type CreatePaymentDTO = {
  userId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  customerNumber: string;
  description?: string | null;
};

// ─── Ticket Purchase ──────────────────────────────────────────────────────────

export type PurchaseTicketItem = {
  ticketTypeId: string;
  quantity: number;
  seatIds?: string[];         // optional in the DTO (user may not pick seats)
};

export type PurchaseTicketDTO = {
  userId: string;
  currency: string;
  method: PaymentMethod;
  customerNumber: string;
  items: PurchaseTicketItem[];
};

// ─── Webhook Payload (from RobsPay) ──────────────────────────────────────────

export type WebhookPayload = {
  trans_id: string;
  telco_tran_id?: string;
  reference?: string;
  status: "SUCCESS" | "FAILED";
  timestamp: string;
  amount?: number;
  customer_number?: string;
};

export type GatewayCollectResult = {
  transactionId: string;
  data: Record<string, any>;
};

// ─── PaymentMeta Context ──────────────────────────────────────────────────────

export type PaymentMetaContext = {
  items: PaymentMetaItem[];   // uses the single source of truth from the entity
};