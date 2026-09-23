export interface IdempotencyResponseDto {
    paymentId: number;
    orderId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    status: string;
}