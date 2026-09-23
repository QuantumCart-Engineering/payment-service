import {
    PaymentStatus
} from "../entities/payment.entity";

export interface PaymentStatusDto {
    paymentId: number;
    orderId: string;
    status: PaymentStatus;
}