import { MockPaymentProvider } from "../../providers/mock-payment.provider";

describe("MockPaymentProvider", () => {
    const provider = new MockPaymentProvider();

    it("should successfully process a valid payment", async () => {
        const result = await provider.processPayment({
            paymentId: 1,
            orderId: "ORD-TEST-001",
            amount: 50000,
            currency: "INR",
            paymentMethod: "UPI"
        });

        expect(result.success).toBe(true);
        expect(result.providerPaymentId).toBe("MOCK-1");
        expect(result.failureCode).toBeNull();
        expect(result.failureReason).toBeNull();
    });

    it("should fail when payment amount is zero", async () => {
        const result = await provider.processPayment({
            paymentId: 2,
            orderId: "ORD-TEST-002",
            amount: 0,
            currency: "INR",
            paymentMethod: "UPI"
        });

        expect(result.success).toBe(false);
        expect(result.providerPaymentId).toBeNull();
        expect(result.failureCode).toBe("INVALID_AMOUNT");
        expect(result.failureReason).toBe(
            "Payment amount must be greater than zero"
        );
    });

    it("should fail when payment amount is negative", async () => {
        const result = await provider.processPayment({
            paymentId: 3,
            orderId: "ORD-TEST-003",
            amount: -100,
            currency: "INR",
            paymentMethod: "UPI"
        });

        expect(result.success).toBe(false);
        expect(result.providerPaymentId).toBeNull();
        expect(result.failureCode).toBe("INVALID_AMOUNT");
    });

    it("should deterministically fail when amount ends with 99", async () => {
        const result = await provider.processPayment({
            paymentId: 4,
            orderId: "ORD-TEST-004",
            amount: 49999,
            currency: "INR",
            paymentMethod: "UPI"
        });

        expect(result.success).toBe(false);
        expect(result.providerPaymentId).toBeNull();
        expect(result.failureCode).toBe(
            "MOCK_PAYMENT_FAILED"
        );
        expect(result.failureReason).toBe(
            "Mock provider rejected the payment"
        );
    });
});