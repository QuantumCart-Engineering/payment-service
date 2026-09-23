import { env } from "../config/env";

import { PaymentProvider } from "./payment-provider.interface";
import { MockPaymentProvider } from "./mock-payment.provider";

export class PaymentProviderFactory {
    static create(): PaymentProvider {
        switch (env.paymentProvider) {
            case "mock":
                return new MockPaymentProvider();

            default:
                throw new Error(
                    `Unsupported payment provider: ${env.paymentProvider}`
                );
        }
    }
}