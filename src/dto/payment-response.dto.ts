import {
    PaymentMethod,
    PaymentStatus
} from "../entities/payment.entity";

export interface PaymentResponseDto {
    paymentId: number;
    orderId: string;
    amount: number;
    currency: string;
    paymentMethod: PaymentMethod;
    status: PaymentStatus;
}