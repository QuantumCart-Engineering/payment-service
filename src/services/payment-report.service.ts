import {
    PaymentReportRepository
} from "../repositories/payment-report.repository";

import type {
    DateRange,
    ReportBucket
} from "../utils/date-range";

const roundMoney = (value: number): number =>
    Math.round(
        (value + Number.EPSILON) * 100
    ) / 100;

export class PaymentReportService {

    constructor(
        private readonly repository:
            PaymentReportRepository
    ) {}

    async getSummary(range: DateRange) {

        const summary =
            await this.repository.getSummary(
                range.start,
                range.endExclusive
            );

        const attempts =
            summary.success + summary.failed;

        const successRate =
            attempts > 0
                ? roundMoney(
                    (summary.success / attempts) * 100
                )
                : 0;

        return {
            range: {
                from: range.from,
                to: range.to
            },
            ...summary,
            successRate
        };
    }

    async getTimeseries(
        range: DateRange,
        bucket: ReportBucket
    ) {

        const points =
            await this.repository.getTimeseries(
                range.start,
                range.endExclusive,
                bucket
            );

        return {
            range: {
                from: range.from,
                to: range.to
            },
            bucket,
            points
        };
    }
}
