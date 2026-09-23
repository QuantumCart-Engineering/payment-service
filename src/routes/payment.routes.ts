import { Router } from "express";

import {
    PaymentController
} from "../controllers/payment.controller";

import {
    PaymentService
} from "../services/payment.service";

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
    PaymentProviderFactory
} from "../providers/payment-provider.factory";

import {
    validateCreatePayment
} from "../middleware/validate-payment.middleware";

import {
    requireIdempotencyKey
} from "../middleware/idempotency.middleware";

const router = Router();

const paymentRepository =
    new PaymentRepository();

const paymentAttemptRepository =
    new PaymentAttemptRepository();

const paymentIdempotencyRepository =
    new PaymentIdempotencyRepository();

const paymentProvider =
    PaymentProviderFactory.create();

const paymentService =
    new PaymentService(
        paymentRepository,
        paymentAttemptRepository,
        paymentIdempotencyRepository,
        paymentProvider
    );

const paymentController =
    new PaymentController(
        paymentService
    );

router.post(
    "/",
    validateCreatePayment,
    requireIdempotencyKey,
    paymentController.createPayment
);

export default router;