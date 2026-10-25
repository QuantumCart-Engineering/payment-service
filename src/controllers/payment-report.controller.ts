import {
    Request,
    Response,
    NextFunction
} from "express";

import {
    PaymentReportService
} from "../services/payment-report.service";

import {
    parseBucket,
    parseDateRange
} from "../utils/date-range";

export class PaymentReportController {

    constructor(
        private readonly reportService:
            PaymentReportService
    ) {}

    getSummary = async (
        request: Request,
        response: Response,
        next: NextFunction
    ): Promise<void> => {

        try {

            const range = parseDateRange(
                request.query.from,
                request.query.to
            );

            const data =
                await this.reportService.getSummary(
                    range
                );

            response.status(200).json({
                success: true,
                data
            });

        } catch (error) {
            next(error);
        }
    };

    getTimeseries = async (
        request: Request,
        response: Response,
        next: NextFunction
    ): Promise<void> => {

        try {

            const range = parseDateRange(
                request.query.from,
                request.query.to
            );

            const bucket = parseBucket(
                request.query.bucket
            );

            const data =
                await this.reportService.getTimeseries(
                    range,
                    bucket
                );

            response.status(200).json({
                success: true,
                data
            });

        } catch (error) {
            next(error);
        }
    };
}
