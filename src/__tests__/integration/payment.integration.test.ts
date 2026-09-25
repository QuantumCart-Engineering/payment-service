import request from "supertest";

import app from "../../app";

import { dbPool } from "../../config/database";

describe("Payment API - Integration Tests", () => {

    const orderId =
        `ORD-INT-${Date.now()}`;

    const idempotencyKey =
        `payment-int-${Date.now()}`;

    afterAll(async () => {
        await dbPool.end();
    });

    describe("GET /health", () => {

        it(
            "should return payment service health status",
            async () => {

                const response =
                    await request(app)
                        .get("/health");

                expect(response.status)
                    .toBe(200);

                expect(response.body)
                    .toEqual({
                        success: true,
                        data: {
                            service:
                                "payment-service",
                            status: "UP"
                        }
                    });
            }
        );
    });

    describe("POST /api/v1/payments", () => {

        it(
            "should create a successful payment and persist it in the database",
            async () => {

                const response =
                    await request(app)
                        .post("/api/v1/payments")
                        .set(
                            "Idempotency-Key",
                            idempotencyKey
                        )
                        .send({
                            orderId,
                            amount: 50000,
                            paymentMethod: "UPI"
                        });

                expect(response.status)
                    .toBe(201);

                expect(response.body.success)
                    .toBe(true);

                expect(response.body.data)
                    .toMatchObject({
                        orderId,
                        amount: 50000,
                        currency: "INR",
                        paymentMethod: "UPI",
                        status: "SUCCESS"
                    });

                const paymentId =
                    response.body.data.paymentId;

                /*
                 * Verify payment record.
                 */
                const [payments] =
                    await dbPool.execute(
                        `
                        SELECT
                            id,
                            order_id,
                            amount,
                            currency,
                            payment_method,
                            status,
                            provider,
                            provider_payment_id
                        FROM payments
                        WHERE id = ?
                        `,
                        [paymentId]
                    );

                const payment =
                    (payments as any[])[0];

                expect(payment)
                    .toBeDefined();

                expect(payment.id)
                    .toBe(paymentId);

                expect(payment.order_id)
                    .toBe(orderId);

                /*
                 * MySQL DECIMAL values are returned
                 * as strings by mysql2.
                 */
                expect(Number(payment.amount))
                    .toBe(50000);

                expect(payment.currency)
                    .toBe("INR");

                expect(payment.payment_method)
                    .toBe("UPI");

                expect(payment.status)
                    .toBe("SUCCESS");

                expect(payment.provider)
                    .toBe("MockPaymentProvider");

                /*
                 * Mock provider generates the provider
                 * payment ID using the actual payment ID.
                 */
                expect(payment.provider_payment_id)
                    .toBe(`MOCK-${paymentId}`);

                /*
                 * Verify payment attempt.
                 */
                const [attempts] =
                    await dbPool.execute(
                        `
                        SELECT
                            payment_id,
                            attempt_number,
                            status,
                            provider,
                            provider_payment_id
                        FROM payment_attempts
                        WHERE payment_id = ?
                        `,
                        [paymentId]
                    );

                const attempt =
                    (attempts as any[])[0];

                expect(attempt)
                    .toBeDefined();

                expect(attempt.payment_id)
                    .toBe(paymentId);

                expect(attempt.attempt_number)
                    .toBe(1);

                expect(attempt.status)
                    .toBe("SUCCESS");

                expect(attempt.provider)
                    .toBe("MockPaymentProvider");

                expect(attempt.provider_payment_id)
                    .toBe(`MOCK-${paymentId}`);

                /*
                 * Verify idempotency record.
                 */
                const [idempotencyRecords] =
                    await dbPool.execute(
                        `
                        SELECT
                            idempotency_key,
                            payment_id
                        FROM payment_idempotency
                        WHERE idempotency_key = ?
                        `,
                        [idempotencyKey]
                    );

                const idempotencyRecord =
                    (idempotencyRecords as any[])[0];

                expect(idempotencyRecord)
                    .toBeDefined();

                expect(
                    idempotencyRecord.idempotency_key
                ).toBe(idempotencyKey);

                expect(
                    idempotencyRecord.payment_id
                ).toBe(paymentId);
            }
        );

        it(
            "should create a failed payment and persist the failed state in the database",
            async () => {

                const orderId =
                    `ORD-INT-FAILED-${Date.now()}`;

                const idempotencyKey =
                    `payment-int-failed-${Date.now()}`;

                const amount = 49999;

                const response =
                    await request(app)
                        .post("/api/v1/payments")
                        .set(
                            "Idempotency-Key",
                            idempotencyKey
                        )
                        .send({
                            orderId,
                            amount,
                            paymentMethod: "UPI"
                        });

                expect(response.status)
                    .toBe(201);

                expect(response.body.success)
                    .toBe(true);

                expect(response.body.data)
                    .toMatchObject({
                        orderId,
                        amount,
                        currency: "INR",
                        paymentMethod: "UPI",
                        status: "FAILED"
                    });

                const paymentId =
                    response.body.data.paymentId;

                /*
                 * Verify payment record.
                 */
                const [payments] =
                    await dbPool.execute(
                        `
                        SELECT
                            id,
                            order_id,
                            amount,
                            currency,
                            payment_method,
                            status,
                            provider,
                            provider_payment_id,
                            failure_code,
                            failure_reason
                        FROM payments
                        WHERE id = ?
                        `,
                        [paymentId]
                    );

                const payment =
                    (payments as any[])[0];

                expect(payment)
                    .toBeDefined();

                expect(payment.id)
                    .toBe(paymentId);

                expect(payment.order_id)
                    .toBe(orderId);

                expect(Number(payment.amount))
                    .toBe(amount);

                expect(payment.currency)
                    .toBe("INR");

                expect(payment.payment_method)
                    .toBe("UPI");

                expect(payment.status)
                    .toBe("FAILED");

                expect(payment.provider)
                    .toBe("MockPaymentProvider");

                expect(payment.provider_payment_id)
                    .toBeNull();

                expect(payment.failure_code)
                    .toBe("MOCK_PAYMENT_FAILED");

                expect(payment.failure_reason)
                    .toBe(
                        "Mock provider rejected the payment"
                    );

                /*
                 * Verify payment attempt.
                 */
                const [attempts] =
                    await dbPool.execute(
                        `
                        SELECT
                            payment_id,
                            attempt_number,
                            status,
                            provider,
                            provider_payment_id,
                            failure_code,
                            failure_reason
                        FROM payment_attempts
                        WHERE payment_id = ?
                        `,
                        [paymentId]
                    );

                const attempt =
                    (attempts as any[])[0];

                expect(attempt)
                    .toBeDefined();

                expect(attempt.payment_id)
                    .toBe(paymentId);

                expect(attempt.attempt_number)
                    .toBe(1);

                expect(attempt.status)
                    .toBe("FAILED");

                expect(attempt.provider)
                    .toBe("MockPaymentProvider");

                expect(attempt.provider_payment_id)
                    .toBeNull();

                expect(attempt.failure_code)
                    .toBe("MOCK_PAYMENT_FAILED");

                expect(attempt.failure_reason)
                    .toBe(
                        "Mock provider rejected the payment"
                    );

                /*
                 * Verify idempotency record.
                 */
                const [idempotencyRecords] =
                    await dbPool.execute(
                        `
                        SELECT
                            idempotency_key,
                            payment_id
                        FROM payment_idempotency
                        WHERE idempotency_key = ?
                        `,
                        [idempotencyKey]
                    );

                const idempotencyRecord =
                    (idempotencyRecords as any[])[0];

                expect(idempotencyRecord)
                    .toBeDefined();

                expect(
                    idempotencyRecord.idempotency_key
                ).toBe(idempotencyKey);

                expect(
                    idempotencyRecord.payment_id
                ).toBe(paymentId);
            }
        );

        it(
            "should reject payment creation when Idempotency-Key is missing",
            async () => {

                const response =
                    await request(app)
                        .post("/api/v1/payments")
                        .send({
                            orderId:
                                `ORD-INT-NOKEY-${Date.now()}`,
                            amount: 50000,
                            paymentMethod: "UPI"
                        });

                expect(response.status)
                    .toBe(400);

                expect(response.body.success)
                    .toBe(false);

                expect(
                    response.body.error.message
                ).toBe(
                    "Idempotency-Key header is required"
                );
            }
        );

        it(
            "should return the existing payment when the same idempotency key is reused with the same request",
            async () => {

                const orderId =
                    `ORD-INT-IDEMPOTENT-${Date.now()}`;

                const idempotencyKey =
                    `payment-int-idempotent-${Date.now()}`;

                const payload = {
                    orderId,
                    amount: 50000,
                    paymentMethod: "UPI"
                };

                const firstResponse =
                    await request(app)
                        .post("/api/v1/payments")
                        .set(
                            "Idempotency-Key",
                            idempotencyKey
                        )
                        .send(payload);

                expect(firstResponse.status)
                    .toBe(201);

                expect(firstResponse.body.success)
                    .toBe(true);

                const firstPayment =
                    firstResponse.body.data;

                const secondResponse =
                    await request(app)
                        .post("/api/v1/payments")
                        .set(
                            "Idempotency-Key",
                            idempotencyKey
                        )
                        .send(payload);

                expect(secondResponse.status)
                    .toBe(201);

                expect(secondResponse.body.success)
                    .toBe(true);

                expect(secondResponse.body.data)
                    .toEqual(firstPayment);

                /*
                 * Verify that only one payment
                 * was created.
                 */
                const [payments] =
                    await dbPool.execute(
                        `
                        SELECT COUNT(*) AS count
                        FROM payments
                        WHERE order_id = ?
                        `,
                        [orderId]
                    );

                expect(
                    Number(
                        (payments as any[])[0].count
                    )
                ).toBe(1);

                /*
                 * Verify that only one payment
                 * attempt was created.
                 */
                const [attempts] =
                    await dbPool.execute(
                        `
                        SELECT COUNT(*) AS count
                        FROM payment_attempts
                        WHERE payment_id = ?
                        `,
                        [firstPayment.paymentId]
                    );

                expect(
                    Number(
                        (attempts as any[])[0].count
                    )
                ).toBe(1);

                /*
                 * Verify that only one idempotency
                 * record exists.
                 */
                const [idempotencyRecords] =
                    await dbPool.execute(
                        `
                        SELECT COUNT(*) AS count
                        FROM payment_idempotency
                        WHERE idempotency_key = ?
                        `,
                        [idempotencyKey]
                    );

                expect(
                    Number(
                        (idempotencyRecords as any[])[0].count
                    )
                ).toBe(1);
            }
        );

        it(
            "should reject a different request when the same idempotency key is reused",
            async () => {

                const orderId =
                    `ORD-INT-IDEMPOTENCY-CONFLICT-${Date.now()}`;

                const idempotencyKey =
                    `payment-int-conflict-${Date.now()}`;

                const firstResponse =
                    await request(app)
                        .post("/api/v1/payments")
                        .set(
                            "Idempotency-Key",
                            idempotencyKey
                        )
                        .send({
                            orderId,
                            amount: 50000,
                            paymentMethod: "UPI"
                        });

                expect(firstResponse.status)
                    .toBe(201);

                expect(firstResponse.body.success)
                    .toBe(true);

                const secondResponse =
                    await request(app)
                        .post("/api/v1/payments")
                        .set(
                            "Idempotency-Key",
                            idempotencyKey
                        )
                        .send({
                            orderId,
                            amount: 60000,
                            paymentMethod: "UPI"
                        });

                expect(secondResponse.status)
                    .toBe(409);

                expect(secondResponse.body.success)
                    .toBe(false);

                expect(
                    secondResponse.body.error.message
                ).toBe(
                    "Idempotency-Key was already used with a different request"
                );
            }
        );

        it(
            "should reject payment creation when a payment already exists for the order",
            async () => {

                const orderId =
                    `ORD-INT-DUPLICATE-${Date.now()}`;

                const firstIdempotencyKey =
                    `payment-int-duplicate-first-${Date.now()}`;

                const secondIdempotencyKey =
                    `payment-int-duplicate-second-${Date.now()}`;

                const firstResponse =
                    await request(app)
                        .post("/api/v1/payments")
                        .set(
                            "Idempotency-Key",
                            firstIdempotencyKey
                        )
                        .send({
                            orderId,
                            amount: 50000,
                            paymentMethod: "UPI"
                        });

                expect(firstResponse.status)
                    .toBe(201);

                expect(firstResponse.body.success)
                    .toBe(true);

                const secondResponse =
                    await request(app)
                        .post("/api/v1/payments")
                        .set(
                            "Idempotency-Key",
                            secondIdempotencyKey
                        )
                        .send({
                            orderId,
                            amount: 50000,
                            paymentMethod: "UPI"
                        });

                expect(secondResponse.status)
                    .toBe(409);

                expect(secondResponse.body.success)
                    .toBe(false);

                expect(
                    secondResponse.body.error.message
                ).toBe(
                    "Payment already exists for this order"
                );
            }
        );

        it(
            "should reject invalid payment data",
            async () => {

                const response =
                    await request(app)
                        .post("/api/v1/payments")
                        .set(
                            "Idempotency-Key",
                            `payment-int-invalid-${Date.now()}`
                        )
                        .send({
                            orderId: "",
                            amount: -100,
                            paymentMethod: "ABC"
                        });

                expect(response.status)
                    .toBe(400);

                expect(response.body.success)
                    .toBe(false);

                expect(
                    response.body.error.message
                ).toBe("Validation failed");

                expect(
                    response.body.error.details
                ).toEqual(
                    expect.arrayContaining([
                        "orderId is required and must be a non-empty string",
                        "amount must be a valid number greater than zero",
                        "paymentMethod must be one of: UPI, DEBIT_CARD, CREDIT_CARD"
                    ])
                );
            }
        );

        it(
            "should reject payment when orderId is missing",
            async () => {

                const response =
                    await request(app)
                        .post("/api/v1/payments")
                        .set(
                            "Idempotency-Key",
                            `payment-int-no-order-${Date.now()}`
                        )
                        .send({
                            amount: 50000,
                            paymentMethod: "UPI"
                        });

                expect(response.status)
                    .toBe(400);

                expect(response.body.success)
                    .toBe(false);

                expect(
                    response.body.error.message
                ).toBe("Validation failed");

                expect(
                    response.body.error.details
                ).toContain(
                    "orderId is required and must be a non-empty string"
                );
            }
        );

        it(
            "should reject payment when amount is zero",
            async () => {

                const response =
                    await request(app)
                        .post("/api/v1/payments")
                        .set(
                            "Idempotency-Key",
                            `payment-int-zero-${Date.now()}`
                        )
                        .send({
                            orderId:
                                `ORD-INT-ZERO-${Date.now()}`,
                            amount: 0,
                            paymentMethod: "UPI"
                        });

                expect(response.status)
                    .toBe(400);

                expect(response.body.success)
                    .toBe(false);

                expect(
                    response.body.error.message
                ).toBe("Validation failed");

                expect(
                    response.body.error.details
                ).toContain(
                    "amount must be a valid number greater than zero"
                );
            }
        );

        it(
            "should reject payment when amount is negative",
            async () => {

                const response =
                    await request(app)
                        .post("/api/v1/payments")
                        .set(
                            "Idempotency-Key",
                            `payment-int-negative-${Date.now()}`
                        )
                        .send({
                            orderId:
                                `ORD-INT-NEGATIVE-${Date.now()}`,
                            amount: -500,
                            paymentMethod: "UPI"
                        });

                expect(response.status)
                    .toBe(400);

                expect(response.body.success)
                    .toBe(false);

                expect(
                    response.body.error.message
                ).toBe("Validation failed");

                expect(
                    response.body.error.details
                ).toContain(
                    "amount must be a valid number greater than zero"
                );
            }
        );

        it(
            "should reject payment when paymentMethod is invalid",
            async () => {

                const response =
                    await request(app)
                        .post("/api/v1/payments")
                        .set(
                            "Idempotency-Key",
                            `payment-int-invalid-method-${Date.now()}`
                        )
                        .send({
                            orderId:
                                `ORD-INT-INVALID-METHOD-${Date.now()}`,
                            amount: 50000,
                            paymentMethod: "ABC"
                        });

                expect(response.status)
                    .toBe(400);

                expect(response.body.success)
                    .toBe(false);

                expect(
                    response.body.error.message
                ).toBe("Validation failed");

                expect(
                    response.body.error.details
                ).toContain(
                    "paymentMethod must be one of: UPI, DEBIT_CARD, CREDIT_CARD"
                );
            }
        );
    });
});