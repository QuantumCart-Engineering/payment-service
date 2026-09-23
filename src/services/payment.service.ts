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
    PaymentProvider
} from "../providers/payment-provider.interface";

export class PaymentService {
    constructor(
        private readonly paymentRepository: PaymentRepository,
        private readonly paymentAttemptRepository: PaymentAttemptRepository,
        private readonly paymentProvider: PaymentProvider
    ) {}

    async createPayment(
        dto: CreatePaymentDto
    ): Promise<PaymentResponseDto> {
        const existingPayment =
            await this.paymentRepository.findByOrderId(
                dto.orderId
            );

        if (existingPayment) {
            throw new Error(
                "Payment already exists for this order"
            );
        }

        const providerName =
            this.paymentProvider.constructor.name;

        const paymentId =
            await this.paymentRepository.create(
                dto.orderId,
                dto.amount,
                "INR",
                dto.paymentMethod,
                providerName
            );

        const attemptNumber = 1;

        const attemptId =
            await this.paymentAttemptRepository.create(
                paymentId,
                attemptNumber,
                providerName
            );

        await this.paymentRepository.updateStatus(
            paymentId,
            "PROCESSING"
        );

        await this.paymentAttemptRepository.updateStatus(
            attemptId,
            "PROCESSING"
        );

        const providerResponse =
            await this.paymentProvider.processPayment({
                paymentId,
                orderId: dto.orderId,
                amount: dto.amount,
                currency: "INR",
                paymentMethod: dto.paymentMethod
            });

        await this.paymentRepository
            .updateProviderDetails(
                paymentId,
                providerResponse.providerPaymentId,
                providerResponse.failureCode,
                providerResponse.failureReason
            );

        await this.paymentAttemptRepository
            .updateProviderDetails(
                attemptId,
                providerResponse.providerPaymentId,
                providerResponse.failureCode,
                providerResponse.failureReason
            );

        if (providerResponse.success) {
            await this.paymentRepository.updateStatus(
                paymentId,
                "SUCCESS"
            );

            await this.paymentAttemptRepository
                .updateStatus(
                    attemptId,
                    "SUCCESS"
                );
        } else {
            await this.paymentRepository.updateStatus(
                paymentId,
                "FAILED"
            );

            await this.paymentAttemptRepository
                .updateStatus(
                    attemptId,
                    "FAILED"
                );
        }

        const payment =
            await this.paymentRepository.findById(
                paymentId
            );

        if (!payment) {
            throw new Error(
                "Payment could not be retrieved after processing"
            );
        }

        return {
            paymentId: payment.id,
            orderId: payment.orderId,
            amount: payment.amount,
            currency: payment.currency,
            paymentMethod: payment.paymentMethod,
            status: payment.status
        };
    }
}