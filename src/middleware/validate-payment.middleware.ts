import {
    Request,
    Response,
    NextFunction
} from "express";

import {
    PaymentMethod
} from "../entities/payment.entity";

const PAYMENT_METHODS: PaymentMethod[] = [
    "UPI",
    "DEBIT_CARD",
    "CREDIT_CARD"
];

export const validateCreatePayment = (
    request: Request,
    response: Response,
    next: NextFunction
): void => {
    const {
        orderId,
        amount,
        paymentMethod
    } = request.body;

    const errors: string[] = [];

    if (
        typeof orderId !== "string" ||
        orderId.trim().length === 0
    ) {
        errors.push(
            "orderId is required and must be a non-empty string"
        );
    }

    if (
        typeof amount !== "number" ||
        !Number.isFinite(amount) ||
        amount <= 0
    ) {
        errors.push(
            "amount must be a valid number greater than zero"
        );
    }

    if (
        !PAYMENT_METHODS.includes(
            paymentMethod
        )
    ) {
        errors.push(
            "paymentMethod must be one of: UPI, DEBIT_CARD, CREDIT_CARD"
        );
    }

    if (errors.length > 0) {
        response.status(400).json({
            success: false,
            error: {
                message: "Validation failed",
                details: errors
            }
        });

        return;
    }

    next();
};