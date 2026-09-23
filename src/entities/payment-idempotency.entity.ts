export interface PaymentIdempotency {
    id: number;
    idempotencyKey: string;
    paymentId: number;
    requestHash: string;
    response: Record<string, unknown>;
    createdAt: Date;
    expiresAt: Date;
}