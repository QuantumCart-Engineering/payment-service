import {
    ResultSetHeader,
    RowDataPacket
} from "mysql2";

import { dbPool } from "../config/database";

import {
    PaymentAttempt,
    PaymentAttemptStatus
} from "../entities/payment-attempt.entity";

interface PaymentAttemptRow
    extends RowDataPacket {
    id: number;
    payment_id: number;
    attempt_number: number;
    status: PaymentAttemptStatus;
    provider: string;
    provider_payment_id: string | null;
    failure_code: string | null;
    failure_reason: string | null;
    created_at: Date;
    updated_at: Date;
}

export class PaymentAttemptRepository {
    async create(
        paymentId: number,
        attemptNumber: number,
        provider: string
    ): Promise<number> {
        const [result] =
            await dbPool.execute<ResultSetHeader>(
                `
                INSERT INTO payment_attempts (
                    payment_id,
                    attempt_number,
                    status,
                    provider
                )
                VALUES (?, ?, 'INITIATED', ?)
                `,
                [
                    paymentId,
                    attemptNumber,
                    provider
                ]
            );

        return result.insertId;
    }

    async findLatestByPaymentId(
        paymentId: number
    ): Promise<PaymentAttempt | null> {
        const [rows] =
            await dbPool.execute<
                PaymentAttemptRow[]
            >(
                `
                SELECT
                    id,
                    payment_id,
                    attempt_number,
                    status,
                    provider,
                    provider_payment_id,
                    failure_code,
                    failure_reason,
                    created_at,
                    updated_at
                FROM payment_attempts
                WHERE payment_id = ?
                ORDER BY attempt_number DESC
                LIMIT 1
                `,
                [paymentId]
            );

        if (rows.length === 0) {
            return null;
        }

        return this.toEntity(rows[0]);
    }

    async findByPaymentId(
        paymentId: number
    ): Promise<PaymentAttempt[]> {
        const [rows] =
            await dbPool.execute<
                PaymentAttemptRow[]
            >(
                `
                SELECT
                    id,
                    payment_id,
                    attempt_number,
                    status,
                    provider,
                    provider_payment_id,
                    failure_code,
                    failure_reason,
                    created_at,
                    updated_at
                FROM payment_attempts
                WHERE payment_id = ?
                ORDER BY attempt_number ASC
                `,
                [paymentId]
            );

        return rows.map((row) =>
            this.toEntity(row)
        );
    }

    async updateStatus(
        attemptId: number,
        status: PaymentAttemptStatus
    ): Promise<void> {
        await dbPool.execute(
            `
            UPDATE payment_attempts
            SET status = ?
            WHERE id = ?
            `,
            [status, attemptId]
        );
    }

    async updateProviderDetails(
        attemptId: number,
        providerPaymentId: string | null,
        failureCode: string | null,
        failureReason: string | null
    ): Promise<void> {
        await dbPool.execute(
            `
            UPDATE payment_attempts
            SET
                provider_payment_id = ?,
                failure_code = ?,
                failure_reason = ?
            WHERE id = ?
            `,
            [
                providerPaymentId,
                failureCode,
                failureReason,
                attemptId
            ]
        );
    }

    private toEntity(
        row: PaymentAttemptRow
    ): PaymentAttempt {
        return {
            id: row.id,
            paymentId: row.payment_id,
            attemptNumber: row.attempt_number,
            status: row.status,
            provider: row.provider,
            providerPaymentId:
                row.provider_payment_id,
            failureCode: row.failure_code,
            failureReason: row.failure_reason,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}