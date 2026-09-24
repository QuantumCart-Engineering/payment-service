jest.mock("../../config/database", () => ({
    withTransaction: jest.fn()
}));

import { withTransaction } from "../../config/database";

import { PaymentService } from "../../services/payment.service";

import {
    IdempotencyConflictError
} from "../../utils/payment.errors";

describe("PaymentService", () => {

    const paymentRepository = {
        findByOrderId: jest.fn(),
        create: jest.fn(),
        updateStatus: jest.fn(),
        updateProviderDetails: jest.fn(),
        findById: jest.fn()
    };

    const paymentAttemptRepository = {
        create: jest.fn(),
        updateStatus: jest.fn(),
        updateProviderDetails: jest.fn()
    };

    const paymentIdempotencyRepository = {
        findByKey: jest.fn(),
        create: jest.fn()
    };

    const paymentProvider = {
        processPayment: jest.fn()
    };

    let service: PaymentService;

    const paymentDto = {
        orderId: "ORD-TEST-001",
        amount: 50000,
        paymentMethod: "UPI" as const
    };

    beforeEach(() => {
        jest.clearAllMocks();

        /*
         * Do not create/use a real MySQL connection
         * during unit tests.
         *
         * Execute the transaction callback directly
         * with a mocked connection.
         */
        (withTransaction as jest.Mock)
            .mockImplementation(
                async (callback) => {
                    return callback({} as any);
                }
            );

        service = new PaymentService(
            paymentRepository as any,
            paymentAttemptRepository as any,
            paymentIdempotencyRepository as any,
            paymentProvider as any
        );
    });

    it("should create and successfully process a new payment", async () => {

        paymentIdempotencyRepository.findByKey
            .mockResolvedValue(null);

        paymentRepository.findByOrderId
            .mockResolvedValue(null);

        paymentRepository.create
            .mockResolvedValue(1);

        paymentAttemptRepository.create
            .mockResolvedValue(1);

        paymentProvider.processPayment
            .mockResolvedValue({
                success: true,
                providerPaymentId: "MOCK-1",
                failureCode: null,
                failureReason: null
            });

        paymentRepository.findById
            .mockResolvedValue({
                id: 1,
                orderId: "ORD-TEST-001",
                amount: 50000,
                currency: "INR",
                paymentMethod: "UPI",
                status: "SUCCESS"
            });

        paymentIdempotencyRepository.create
            .mockResolvedValue(1);

        const result =
            await service.createPayment(
                paymentDto,
                "payment-key-001"
            );

        expect(result).toEqual({
            paymentId: 1,
            orderId: "ORD-TEST-001",
            amount: 50000,
            currency: "INR",
            paymentMethod: "UPI",
            status: "SUCCESS"
        });

        expect(withTransaction)
            .toHaveBeenCalledTimes(1);

        expect(paymentRepository.create)
            .toHaveBeenCalledTimes(1);

        expect(paymentAttemptRepository.create)
            .toHaveBeenCalledTimes(1);

        expect(paymentProvider.processPayment)
            .toHaveBeenCalledTimes(1);

        expect(paymentIdempotencyRepository.create)
            .toHaveBeenCalledTimes(1);
    });

    it("should return the existing response for the same idempotency key", async () => {

        const {
            createRequestHash
        } = await import(
            "../../utils/request-hash.util"
        );

        const existingResponse = {
            paymentId: 1,
            orderId: "ORD-TEST-001",
            amount: 50000,
            currency: "INR",
            paymentMethod: "UPI",
            status: "SUCCESS"
        };

        paymentIdempotencyRepository.findByKey
            .mockResolvedValue({
                id: 1,
                idempotencyKey: "payment-key-002",
                paymentId: 1,
                requestHash:
                    createRequestHash(paymentDto),
                response: existingResponse,
                createdAt: new Date(),
                expiresAt: new Date(
                    Date.now() + 86400000
                )
            });

        const result =
            await service.createPayment(
                paymentDto,
                "payment-key-002"
            );

        expect(result)
            .toEqual(existingResponse);

        expect(withTransaction)
            .not.toHaveBeenCalled();

        expect(paymentRepository.create)
            .not.toHaveBeenCalled();

        expect(paymentProvider.processPayment)
            .not.toHaveBeenCalled();
    });

    it("should reject the same idempotency key with a different request", async () => {

        const {
            createRequestHash
        } = await import(
            "../../utils/request-hash.util"
        );

        paymentIdempotencyRepository.findByKey
            .mockResolvedValue({
                id: 1,
                idempotencyKey: "payment-key-003",
                paymentId: 1,
                requestHash:
                    createRequestHash({
                        ...paymentDto,
                        amount: 60000
                    }),
                response: {
                    paymentId: 1,
                    orderId: "ORD-TEST-001",
                    amount: 60000,
                    currency: "INR",
                    paymentMethod: "UPI",
                    status: "SUCCESS"
                },
                createdAt: new Date(),
                expiresAt: new Date(
                    Date.now() + 86400000
                )
            });

        await expect(
            service.createPayment(
                paymentDto,
                "payment-key-003"
            )
        ).rejects.toBeInstanceOf(
            IdempotencyConflictError
        );

        expect(withTransaction)
            .not.toHaveBeenCalled();

        expect(paymentRepository.create)
            .not.toHaveBeenCalled();

        expect(paymentProvider.processPayment)
            .not.toHaveBeenCalled();
    });

    it("should reject payment when payment already exists for the order", async () => {

        paymentIdempotencyRepository.findByKey
            .mockResolvedValue(null);

        paymentRepository.findByOrderId
            .mockResolvedValue({
                id: 10,
                orderId: "ORD-TEST-001",
                amount: 50000,
                currency: "INR",
                paymentMethod: "UPI",
                status: "SUCCESS"
            });

        await expect(
            service.createPayment(
                paymentDto,
                "payment-key-004"
            )
        ).rejects.toThrow(
            "Payment already exists for this order"
        );

        expect(withTransaction)
            .toHaveBeenCalledTimes(1);

        expect(paymentRepository.create)
            .not.toHaveBeenCalled();

        expect(paymentProvider.processPayment)
            .not.toHaveBeenCalled();
    });

    it("should create a FAILED payment when provider rejects the payment", async () => {

        const failedPaymentDto = {
            ...paymentDto,
            amount: 49999
        };

        paymentIdempotencyRepository.findByKey
            .mockResolvedValue(null);

        paymentRepository.findByOrderId
            .mockResolvedValue(null);

        paymentRepository.create
            .mockResolvedValue(2);

        paymentAttemptRepository.create
            .mockResolvedValue(2);

        paymentProvider.processPayment
            .mockResolvedValue({
                success: false,
                providerPaymentId: null,
                failureCode:
                    "MOCK_PAYMENT_FAILED",
                failureReason:
                    "Mock provider rejected the payment"
            });

        paymentRepository.findById
            .mockResolvedValue({
                id: 2,
                orderId: "ORD-TEST-001",
                amount: 49999,
                currency: "INR",
                paymentMethod: "UPI",
                status: "FAILED"
            });

        paymentIdempotencyRepository.create
            .mockResolvedValue(2);

        const result =
            await service.createPayment(
                failedPaymentDto,
                "payment-key-005"
            );

        expect(result).toEqual({
            paymentId: 2,
            orderId: "ORD-TEST-001",
            amount: 49999,
            currency: "INR",
            paymentMethod: "UPI",
            status: "FAILED"
        });

        expect(paymentProvider.processPayment)
            .toHaveBeenCalledTimes(1);

        expect(paymentRepository.updateStatus)
            .toHaveBeenCalledWith(
                2,
                "PROCESSING",
                expect.anything()
            );

        expect(paymentAttemptRepository.updateStatus)
            .toHaveBeenCalledWith(
                2,
                "PROCESSING",
                expect.anything()
            );

        expect(paymentRepository.updateProviderDetails)
            .toHaveBeenCalledWith(
                2,
                null,
                "MOCK_PAYMENT_FAILED",
                "Mock provider rejected the payment",
                expect.anything()
            );

        expect(paymentAttemptRepository.updateProviderDetails)
            .toHaveBeenCalledWith(
                2,
                null,
                "MOCK_PAYMENT_FAILED",
                "Mock provider rejected the payment",
                expect.anything()
            );

        expect(paymentRepository.updateStatus)
            .toHaveBeenCalledWith(
                2,
                "FAILED",
                expect.anything()
            );

        expect(paymentAttemptRepository.updateStatus)
            .toHaveBeenCalledWith(
                2,
                "FAILED",
                expect.anything()
            );

        expect(paymentIdempotencyRepository.create)
            .toHaveBeenCalledTimes(1);
    });
});