export type InitiatePaymentDTO = {
    nomineeId: string;
    quantity: number;
    voterEmail?: string;
    voterPhone?: string;
};