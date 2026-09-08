import crypto from "crypto";
import { validateInitiatePayment } from "@/modules/payment/payment.validator";
import { AppDataSource } from "@/database/data-source";
import { Payment, PaymentStatus } from "@/database/entities/Payment";
import { Nominee } from "@/database/entities/Nominee";
import { Vote } from "@/database/entities/Vote";
import { ElectionStatus } from "@/database/entities/Election";
import { InitiatePaymentDTO } from "@/types/payment.type";
import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";
import { getPaystackClient } from "@/lib/payment/getPaystackClient";
import { initializeTransaction, verifyTransactionMatches, toSubunit, PaystackApiError } from "@/lib/paystack";

function generatePlaceholderEmail(): string {
  const domain = process.env.GUEST_VOTER_EMAIL_DOMAIN ?? "example.com";
  return `guest.${crypto.randomUUID().slice(0, 10)}@${domain}`;
}

export class PaymentService {
  private static async repo() {
    const db = await AppDataSource();
    return db.getRepository(Payment);
  }

  static async getByReference(reference: string) {
    if (!reference?.trim()) {
      throw new CustomAppError( "Payment reference is required", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request" );
    }

    const repo = await this.repo();
    const payment = await repo.findOne({ where: { providerReference: reference } });

    if (!payment) {
      throw new CustomAppError( "No payment found with this reference", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "payment_not_found" );
    }

    return payment;
  }

  /**
   * Starts a vote purchase. Amount is ALWAYS computed server-side from the
   * election's pricePerVote — never accepted from the client. Voter email/phone
   * are optional; a placeholder email is generated when none is given, since
   * Paystack's initialize call requires an email regardless.
   */
  static async initiate(data: InitiatePaymentDTO) {
    validateInitiatePayment(data);

    const db = await AppDataSource();
    const nomineeRepo = db.getRepository(Nominee);
    const paymentRepo = db.getRepository(Payment);

    const nominee = await nomineeRepo.findOne({
      where: { id: data.nomineeId, isDeleted: false },
      relations: { category: { election: true } },
    });

    if (!nominee) {
      throw new CustomAppError( "No nominee found with this nomineeId", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "nominee_not_found" );
    }

    const election = nominee.category.election;

    if (election.status !== ElectionStatus.ACTIVE) {
      throw new CustomAppError( "This election is not currently open for voting", 400, ErrorCodes.VALIDATION_FAILED.code, ErrorCodes.VALIDATION_FAILED.label, "election_not_active" );
    }

    const now = new Date();
    if (now > election.endDate) {
      throw new CustomAppError( "This election is outside its voting period", 400, ErrorCodes.VALIDATION_FAILED.code, ErrorCodes.VALIDATION_FAILED.label, "election_out_of_window" );
    }

    const amount = (parseFloat(election.pricePerVote) * data.quantity).toFixed(2);
    const reference = `PAY_${crypto.randomUUID().replace(/-/g, "")}`;
    const paystackEmail = data.voterEmail ?? generatePlaceholderEmail();

    const payment = paymentRepo.create({
      provider: "paystack",
      providerReference: reference,
      amount,
      currency: "GHS",
      status: PaymentStatus.PENDING,
      nominee,
      quantity: data.quantity,
      voterEmail: data.voterEmail,
      voterPhone: data.voterPhone,
    });

    await paymentRepo.save(payment);

    try {
      // const { authorization_url } = await initializeTransaction(getPaystackClient(), {
      //   amount: toSubunit(parseFloat(amount)),
      //   email: paystackEmail,
      //   currency: "GHS",
      //   reference,
      //   metadata: { paymentId: payment.id, nomineeId: nominee.id },
      // });

      // return { authorizationUrl: authorization_url, reference, paymentId: payment.id, amount };

        const { authorization_url, access_code } = await initializeTransaction(getPaystackClient(), {
          amount: toSubunit(parseFloat(amount)),
          email: paystackEmail,
          currency: "GHS",
          reference,
          metadata: { paymentId: payment.id, nomineeId: nominee.id },
        });

        return {
          authorizationUrl: authorization_url,
          accessCode: access_code,  // ← add this line
          reference,
          paymentId: payment.id,
          amount,
        };

    } catch (err) {
      payment.status = PaymentStatus.FAILED;
      await paymentRepo.save(payment);

      const message = err instanceof PaystackApiError ? err.message : "Failed to start payment";
      throw new CustomAppError( message, 502, ErrorCodes.VALIDATION_FAILED.code, ErrorCodes.VALIDATION_FAILED.label, "payment_init_failed" );
    }
  }

  /**
   * The single, idempotent entry point for confirming a payment and creating its
   * Vote — called by both the webhook handler and the manual verify fallback.
   *
   * Concurrency/idempotency strategy: a pessimistic row lock on the Payment row
   * for the duration of the transaction. A second concurrent call for the same
   * reference blocks until the first commits, then sees status is no longer
   * PENDING and returns immediately — no double vote, no double-processing.
   */
  static async confirmByReference(reference: string) {
    const db = await AppDataSource();

    return await db.transaction(async (manager) => {
      const paymentRepo = manager.getRepository(Payment);

      const lockedPayment = await paymentRepo
        .createQueryBuilder("payment")
        .setLock("pessimistic_write")
        .where("payment.provider_reference = :reference", { reference })
        .getOne();

      if (!lockedPayment) {
        throw new CustomAppError( "No payment found with this reference", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "payment_not_found" );
      }

      if (lockedPayment.status !== PaymentStatus.PENDING) {
        return lockedPayment; // already processed by an earlier call
      }

      try {
        await verifyTransactionMatches(getPaystackClient(), reference, {
          amount: toSubunit(parseFloat(lockedPayment.amount)),
          currency: lockedPayment.currency,
        });
      } catch {
        lockedPayment.status = PaymentStatus.FAILED;
        return await paymentRepo.save(lockedPayment);
      }

      // Re-fetch the nominee fresh, with its current category/election — not
      // trusted from initiate-time, so a category/election reassignment between
      // initiation and confirmation can't land a vote in the wrong place.
      const paymentWithNominee = await manager.getRepository(Payment).findOne({
        where: { id: lockedPayment.id },
        relations: { nominee: { category: { election: true } } },
      });

      const currentNominee = paymentWithNominee?.nominee;

      if (!currentNominee || currentNominee.isDeleted) {
        lockedPayment.status = PaymentStatus.FAILED;
        await paymentRepo.save(lockedPayment);
        throw new CustomAppError( "Nominee no longer exists; payment cannot be completed", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "nominee_not_found" );
      }

      lockedPayment.status = PaymentStatus.SUCCESS;
      const savedPayment = await paymentRepo.save(lockedPayment);

      const voteRepo = manager.getRepository(Vote);
      const vote = voteRepo.create({
        election: currentNominee.category.election,
        category: currentNominee.category,
        nominee: currentNominee,
        quantity: savedPayment.quantity,
        payment: savedPayment,
        voterEmail: savedPayment.voterEmail,
        voterPhone: savedPayment.voterPhone,
      });
      await voteRepo.save(vote);

      return savedPayment;
    });
  }
}