export type PaymentAttemptStatus =
    | "INITIATED"
    | "PROCESSING"
    | "SUCCESS"
    | "FAILED";

export interface PaymentAttempt {
    id: number;
    paymentId: number;
    attemptNumber: number;
    status: PaymentAttemptStatus;
    provider: string;
    providerPaymentId: string | null;
    failureCode: string | null;
    failureReason: string | null;
    createdAt: Date;
    updatedAt: Date;
}