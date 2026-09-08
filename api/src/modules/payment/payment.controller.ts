import { PaymentService } from "./payment.service";
import type { InitiatePaymentDTO } from "@/types/payment.type";

export class PaymentController {
  static async initiatePayment(data: InitiatePaymentDTO) {
    return await PaymentService.initiate(data);
  }

  static async getPayment(reference: string) {
    return await PaymentService.getByReference(reference);
  }

  static async confirmPayment(reference: string) {
    return await PaymentService.confirmByReference(reference);
  }
}