import {
    PoolConnection,
    ResultSetHeader,
    RowDataPacket
} from "mysql2/promise";

import { dbPool } from "../config/database";

import {
    PaymentAttempt,
    PaymentAttemptStatus
} from "../entities/payment-attempt.entity";

import {
    CREATE_PAYMENT_ATTEMPT,
    FIND_LATEST_PAYMENT_ATTEMPT,
    FIND_PAYMENT_ATTEMPTS,
    UPDATE_PAYMENT_ATTEMPT_STATUS,
    UPDATE_PAYMENT_ATTEMPT_PROVIDER_DETAILS
} from "../queries/payment-attempt.queries";

interface PaymentAttemptRow extends RowDataPacket {
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
        provider: string,
        connection?: PoolConnection
    ): Promise<number> {

        const executor = connection ?? dbPool;

        const [result] =
            await executor.execute<ResultSetHeader>(
                CREATE_PAYMENT_ATTEMPT,
                [
                    paymentId,
                    attemptNumber,
                    provider
                ]
            );

        return result.insertId;
    }

    async findLatestByPaymentId(
        paymentId: number,
        connection?: PoolConnection
    ): Promise<PaymentAttempt | null> {

        const executor = connection ?? dbPool;

        const [rows] =
            await executor.execute<PaymentAttemptRow[]>(
                FIND_LATEST_PAYMENT_ATTEMPT,
                [paymentId]
            );

        if (rows.length === 0) {
            return null;
        }

        return this.toEntity(rows[0]);
    }

    async findByPaymentId(
        paymentId: number,
        connection?: PoolConnection
    ): Promise<PaymentAttempt[]> {

        const executor = connection ?? dbPool;

        const [rows] =
            await executor.execute<PaymentAttemptRow[]>(
                FIND_PAYMENT_ATTEMPTS,
                [paymentId]
            );

        return rows.map((row) =>
            this.toEntity(row)
        );
    }

    async updateStatus(
        attemptId: number,
        status: PaymentAttemptStatus,
        connection?: PoolConnection
    ): Promise<void> {

        const executor = connection ?? dbPool;

        await executor.execute(
            UPDATE_PAYMENT_ATTEMPT_STATUS,
            [status, attemptId]
        );
    }

    async updateProviderDetails(
        attemptId: number,
        providerPaymentId: string | null,
        failureCode: string | null,
        failureReason: string | null,
        connection?: PoolConnection
    ): Promise<void> {

        const executor = connection ?? dbPool;

        await executor.execute(
            UPDATE_PAYMENT_ATTEMPT_PROVIDER_DETAILS,
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
            failureReason:
                row.failure_reason,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}