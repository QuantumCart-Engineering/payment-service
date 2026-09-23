import { withTransaction } from "../config/database";

import {
    CreatePaymentDto
} from "../dto/create-payment.dto";

import {
    PaymentResponseDto
} from "../dto/payment-response.dto";

import {
    PaymentRepository
} from "../repositories/payment.repository";

import {
    PaymentAttemptRepository
} from "../repositories/payment-attempt.repository";

import {
    PaymentIdempotencyRepository
} from "../repositories/payment-idempotency.repository";

import {
    PaymentProvider
} from "../providers/payment-provider.interface";

import {
    createRequestHash
} from "../utils/request-hash.util";

import {
    IdempotencyConflictError
} from "../utils/payment.errors";

export class PaymentService {

    constructor(
        private readonly paymentRepository:
            PaymentRepository,

        private readonly paymentAttemptRepository:
            PaymentAttemptRepository,

        private readonly paymentIdempotencyRepository:
            PaymentIdempotencyRepository,

        private readonly paymentProvider:
            PaymentProvider
    ) {}

    async createPayment(
        dto: CreatePaymentDto,
        idempotencyKey: string
    ): Promise<PaymentResponseDto> {

        const requestHash =
            createRequestHash(dto);

        /*
         * First check whether this idempotency
         * key has already been processed.
         */
        const existingIdempotency =
            await this.paymentIdempotencyRepository
                .findByKey(idempotencyKey);

        if (existingIdempotency) {

            if (
                existingIdempotency.requestHash !==
                requestHash
            ) {
                throw new IdempotencyConflictError(
                    "Idempotency-Key was already used with a different request"
                );
            }

            return existingIdempotency
                .response as unknown as PaymentResponseDto;
        }

        /*
         * Use a transaction so payment,
         * attempt and idempotency record
         * are persisted consistently.
         */
        return withTransaction(
            async (connection) => {

                /*
                 * Re-check inside transaction.
                 *
                 * This protects against another request
                 * creating the same idempotency key between
                 * the first lookup and transaction start.
                 */
                const transactionIdempotency =
                    await this.paymentIdempotencyRepository
                        .findByKey(
                            idempotencyKey,
                            connection
                        );

                if (transactionIdempotency) {

                    if (
                        transactionIdempotency.requestHash !==
                        requestHash
                    ) {
                        throw new IdempotencyConflictError(
                            "Idempotency-Key was already used with a different request"
                        );
                    }

                    return transactionIdempotency
                        .response as unknown as PaymentResponseDto;
                }

                /*
                 * A payment can only exist once for
                 * an order.
                 */
                const existingPayment =
                    await this.paymentRepository
                        .findByOrderId(
                            dto.orderId,
                            connection
                        );

                if (existingPayment) {
                    throw new Error(
                        "Payment already exists for this order"
                    );
                }

                const providerName =
                    this.paymentProvider.constructor.name;

                /*
                 * Create payment.
                 */
                const paymentId =
                    await this.paymentRepository.create(
                        dto.orderId,
                        dto.amount,
                        "INR",
                        dto.paymentMethod,
                        providerName,
                        connection
                    );

                /*
                 * Create first payment attempt.
                 */
                const attemptId =
                    await this.paymentAttemptRepository.create(
                        paymentId,
                        1,
                        providerName,
                        connection
                    );

                /*
                 * Move both payment and attempt
                 * into PROCESSING state.
                 */
                await this.paymentRepository.updateStatus(
                    paymentId,
                    "PROCESSING",
                    connection
                );

                await this.paymentAttemptRepository.updateStatus(
                    attemptId,
                    "PROCESSING",
                    connection
                );

                /*
                 * Call payment provider.
                 *
                 * For MVP this is MockPaymentProvider.
                 */
                const providerResponse =
                    await this.paymentProvider.processPayment({
                        paymentId,
                        orderId: dto.orderId,
                        amount: dto.amount,
                        currency: "INR",
                        paymentMethod: dto.paymentMethod
                    });

                /*
                 * Save provider response.
                 */
                await this.paymentRepository
                    .updateProviderDetails(
                        paymentId,
                        providerResponse.providerPaymentId,
                        providerResponse.failureCode,
                        providerResponse.failureReason,
                        connection
                    );

                await this.paymentAttemptRepository
                    .updateProviderDetails(
                        attemptId,
                        providerResponse.providerPaymentId,
                        providerResponse.failureCode,
                        providerResponse.failureReason,
                        connection
                    );

                /*
                 * Update final payment state.
                 */
                const finalStatus =
                    providerResponse.success
                        ? "SUCCESS"
                        : "FAILED";

                await this.paymentRepository
                    .updateStatus(
                        paymentId,
                        finalStatus,
                        connection
                    );

                await this.paymentAttemptRepository
                    .updateStatus(
                        attemptId,
                        finalStatus,
                        connection
                    );

                const payment =
                    await this.paymentRepository.findById(
                        paymentId,
                        connection
                    );

                if (!payment) {
                    throw new Error(
                        "Payment could not be retrieved after processing"
                    );
                }

                const response: PaymentResponseDto = {
                    paymentId: payment.id,
                    orderId: payment.orderId,
                    amount: payment.amount,
                    currency: payment.currency,
                    paymentMethod: payment.paymentMethod,
                    status: payment.status
                };

                /*
                 * Idempotency record is stored together
                 * with payment state.
                 *
                 * 24-hour retention for MVP.
                 */
                const expiresAt =
                    new Date(
                        Date.now() +
                        24 * 60 * 60 * 1000
                    );

                await this.paymentIdempotencyRepository
                    .create(
                        idempotencyKey,
                        paymentId,
                        requestHash,
                        response as unknown as Record<
                            string,
                            unknown
                        >,
                        expiresAt,
                        connection
                    );

                return response;
            }
        );
    }
}