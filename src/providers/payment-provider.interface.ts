export interface PaymentProviderRequest {
    paymentId: number;
    orderId: string;
    amount: number;
    currency: string;
    paymentMethod: string;
}

export interface PaymentProviderResponse {
    success: boolean;
    providerPaymentId: string | null;
    failureCode: string | null;
    failureReason: string | null;
}

export interface PaymentProvider {
    processPayment(
        request: PaymentProviderRequest
    ): Promise<PaymentProviderResponse>;
}