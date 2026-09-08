declare module "@paystack/inline-js" {
  type TransactionCallback = () => void;
  type TransactionErrorCallback = (error: { message?: string }) => void;

  type ResumeTransactionOptions = {
    onSuccess?: TransactionCallback;
    onCancel?: TransactionCallback;
    onError?: TransactionErrorCallback;
  };

  export default class PaystackPop {
    resumeTransaction(accessCode: string, options?: ResumeTransactionOptions): void;
  }
}