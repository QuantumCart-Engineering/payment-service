export type PaymentMethod =
    | "UPI"
    | "DEBIT_CARD"
    | "CREDIT_CARD";

export type PaymentStatus =
    | "INITIATED"
    | "PROCESSING"
    | "SUCCESS"
    | "FAILED"
    | "REFUND_PENDING"
    | "REFUNDED";

export interface Payment {
    id: number;
    orderId: string;
    amount: number;
    currency: string;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
    provider: string;
    providerPaymentId: string | null;
    failureCode: string | null;
    failureReason: string | null;
    createdAt: Date;
    updatedAt: Date;
}