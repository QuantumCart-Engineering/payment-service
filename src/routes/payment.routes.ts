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
    PaymentProviderFactory
} from "../providers/payment-provider.factory";

import {
    validateCreatePayment
} from "../middleware/validate-payment.middleware";

const router = Router();

const paymentRepository =
    new PaymentRepository();

const paymentAttemptRepository =
    new PaymentAttemptRepository();

const paymentProvider =
    PaymentProviderFactory.create();

const paymentService =
    new PaymentService(
        paymentRepository,
        paymentAttemptRepository,
        paymentProvider
    );

const paymentController =
    new PaymentController(
        paymentService
    );

router.post(
    "/",
    validateCreatePayment,
    paymentController.createPayment
);

export default router;