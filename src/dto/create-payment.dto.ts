import {
    PaymentMethod
} from "../entities/payment.entity";

export interface CreatePaymentDto {
    orderId: string;
    amount: number;
    paymentMethod: PaymentMethod;
}