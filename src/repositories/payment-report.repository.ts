import { RowDataPacket } from "mysql2/promise";

import { dbPool } from "../config/database";

import {
    PAYMENT_SUMMARY,
    PAYMENT_TIMESERIES_DAY,
    PAYMENT_TIMESERIES_MONTH
} from "../queries/payment-report.queries";

import type { ReportBucket } from "../utils/date-range";

export interface PaymentReportSummary {
    totalPayments: number;
    initiated: number;
    processing: number;
    success: number;
    failed: number;
    refundPending: number;
    refunded: number;
    successfulAmount: number;
}

export interface PaymentReportPoint {
    period: string;
    success: number;
    failed: number;
    amount: number;
}

interface PaymentSummaryRow extends RowDataPacket {
    total_payments: number | string;
    initiated: number | string;
    processing: number | string;
    success: number | string;
    failed: number | string;
    refund_pending: number | string;
    refunded: number | string;
    successful_amount: number | string;
}

interface PaymentTimeseriesRow extends RowDataPacket {
    period: string;
    success: number | string;
    failed: number | string;
    amount: number | string;
}

const roundMoney = (value: number): number =>
    Math.round(
        (value + Number.EPSILON) * 100
    ) / 100;

export class PaymentReportRepository {

    async getSummary(
        start: string,
        endExclusive: string
    ): Promise<PaymentReportSummary> {

        const [rows] =
            await dbPool.execute<PaymentSummaryRow[]>(
                PAYMENT_SUMMARY,
                [start, endExclusive]
            );

        const row = rows[0];

        return {
            totalPayments: Number(
                row?.total_payments ?? 0
            ),
            initiated: Number(row?.initiated ?? 0),
            processing: Number(
                row?.processing ?? 0
            ),
            success: Number(row?.success ?? 0),
            failed: Number(row?.failed ?? 0),
            refundPending: Number(
                row?.refund_pending ?? 0
            ),
            refunded: Number(
                row?.refunded ?? 0
            ),
            successfulAmount: roundMoney(
                Number(row?.successful_amount ?? 0)
            )
        };
    }

    async getTimeseries(
        start: string,
        endExclusive: string,
        bucket: ReportBucket
    ): Promise<PaymentReportPoint[]> {

        const query =
            bucket === "month"
                ? PAYMENT_TIMESERIES_MONTH
                : PAYMENT_TIMESERIES_DAY;

        const [rows] =
            await dbPool.execute<PaymentTimeseriesRow[]>(
                query,
                [start, endExclusive]
            );

        return rows.map((row) => ({
            period: row.period,
            success: Number(row.success),
            failed: Number(row.failed),
            amount: roundMoney(
                Number(row.amount)
            )
        }));
    }
}
