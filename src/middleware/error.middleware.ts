import {
    Request,
    Response,
    NextFunction
} from "express";

export const errorMiddleware = (
    error: unknown,
    _request: Request,
    response: Response,
    _next: NextFunction
): void => {
    console.error(error);

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