import {
    Request,
    Response,
    NextFunction
} from "express";

import {
    IdempotencyConflictError,
    PaymentConflictError
} from "../utils/payment.errors";

export const errorMiddleware = (
    error: unknown,
    _request: Request,
    response: Response,
    _next: NextFunction
): void => {

    console.error(error);

    if (
        error instanceof IdempotencyConflictError ||
        error instanceof PaymentConflictError
    ) {
        response.status(409).json({
            success: false,
            error: {
                message: error.message
            }
        });

        return;
    }

    const message =
        error instanceof Error
            ? error.message
            : "Internal server error";

    response.status(500).json({
        success: false,
        error: {
            message
        }
    });
};