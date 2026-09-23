import {
    Request,
    Response,
    NextFunction
} from "express";

import {
    CreatePaymentDto
} from "../dto/create-payment.dto";

import {
    PaymentService
} from "../services/payment.service";

export class PaymentController {

    constructor(
        private readonly paymentService:
            PaymentService
    ) {}

    createPayment = async (
        request: Request,
        response: Response,
        next: NextFunction
    ): Promise<void> => {

        try {

            const dto =
                request.body as CreatePaymentDto;

            const idempotencyKey =
                request.idempotencyKey;

            if (!idempotencyKey) {
                response.status(400).json({
                    success: false,
                    error: {
                        message:
                            "Idempotency-Key header is required"
                    }
                });

                return;
            }

            const result =
                await this.paymentService.createPayment(
                    dto,
                    idempotencyKey
                );

            response.status(201).json({
                success: true,
                data: result
            });

        } catch (error) {
            next(error);
        }
    };
}