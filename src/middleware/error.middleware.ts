import {
    Request,
    Response,
    NextFunction
} from "express";

import {
    IdempotencyConflictError,
    PaymentAlreadyExistsError
} from "../utils/payment.errors";

export const errorMiddleware = (
    error: unknown,
    _request: Request,
    response: Response,
    _next: NextFunction
): void => {

    console.error(error);

    /*
     * Idempotency conflict.
     */
    if (
        error instanceof IdempotencyConflictError
    ) {
        response.status(409).json({
            success: false,
            error: {
                message: error.message
            }
        });

        return;
    }

    /*
     * Payment already exists for order.
     */
    if (
        error instanceof PaymentAlreadyExistsError
    ) {
        response.status(409).json({
            success: false,
            error: {
                message: error.message
            }
        });

        return;
    }

    /*
     * Validation / known errors which
     * expose a statusCode.
     */
    if (
        typeof error === "object" &&
        error !== null &&
        "statusCode" in error &&
        typeof (
            error as {
                statusCode?: unknown
            }
        ).statusCode === "number"
    ) {
        const statusCode =
            (
                error as {
                    statusCode: number
                }
            ).statusCode;

        const message =
            "message" in error &&
            typeof (
                error as {
                    message?: unknown
                }
            ).message === "string"
                ? (
                    error as {
                        message: string
                    }
                ).message
                : "Request failed";

        response.status(statusCode).json({
            success: false,
            error: {
                message
            }
        });

        return;
    }

    /*
     * Unknown/unhandled error.
     */
    response.status(500).json({
        success: false,
        error: {
            message:
                "Internal server error"
        }
    });
};