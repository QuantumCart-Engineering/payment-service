import {
    Request,
    Response,
    NextFunction
} from "express";

export const requireIdempotencyKey = (
    request: Request,
    response: Response,
    next: NextFunction
): void => {
    const idempotencyKey =
        request.header(
            "Idempotency-Key"
        );

    if (
        !idempotencyKey ||
        idempotencyKey.trim().length === 0
    ) {
        response.status(400).json({
            success: false,
            error: {
                message:
                    "Idempotency-Key header is required"
            }
        });

        return;
    }

    request.idempotencyKey =
        idempotencyKey.trim();

    next();
};