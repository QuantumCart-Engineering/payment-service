import {
    PaymentProvider,
    PaymentProviderRequest,
    PaymentProviderResponse
} from "./payment-provider.interface";

export class MockPaymentProvider
    implements PaymentProvider {

    async processPayment(
        request: PaymentProviderRequest
    ): Promise<PaymentProviderResponse> {
        if (request.amount <= 0) {
            return {
                success: false,
                providerPaymentId: null,
                failureCode: "INVALID_AMOUNT",
                failureReason:
                    "Payment amount must be greater than zero"
            };
        }

        if (request.amount % 100 === 99) {
            return {
                success: false,
                providerPaymentId: null,
                failureCode: "MOCK_PAYMENT_FAILED",
                failureReason:
                    "Mock provider rejected the payment"
            };
        }

        return {
            success: true,
            providerPaymentId:
                `MOCK-${request.paymentId}`,
            failureCode: null,
            failureReason: null
        };
    }
}