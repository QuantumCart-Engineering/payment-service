import {
    PoolConnection,
    ResultSetHeader,
    RowDataPacket
} from "mysql2/promise";

import { dbPool } from "../config/database";

import {
    PaymentIdempotency
} from "../entities/payment-idempotency.entity";

import {
    FIND_PAYMENT_IDEMPOTENCY_BY_KEY,
    CREATE_PAYMENT_IDEMPOTENCY
} from "../queries/payment-idempotency.queries";

interface PaymentIdempotencyRow
    extends RowDataPacket {

    id: number;
    idempotency_key: string;
    payment_id: number;
    request_hash: string;
    response: string | Record<string, unknown>;
    created_at: Date;
    expires_at: Date;
}

export class PaymentIdempotencyRepository {

    async findByKey(
        idempotencyKey: string,
        connection?: PoolConnection
    ): Promise<PaymentIdempotency | null> {

        const executor =
            connection ?? dbPool;

        const [rows] =
            await executor.execute<
                PaymentIdempotencyRow[]
            >(
                FIND_PAYMENT_IDEMPOTENCY_BY_KEY,
                [idempotencyKey]
            );

        if (rows.length === 0) {
            return null;
        }

        return this.toEntity(rows[0]);
    }

    async create(
        idempotencyKey: string,
        paymentId: number,
        requestHash: string,
        response: Record<string, unknown>,
        expiresAt: Date,
        connection?: PoolConnection
    ): Promise<number> {

        const executor =
            connection ?? dbPool;

        const [result] =
            await executor.execute<ResultSetHeader>(
                CREATE_PAYMENT_IDEMPOTENCY,
                [
                    idempotencyKey,
                    paymentId,
                    requestHash,
                    JSON.stringify(response),
                    expiresAt
                ]
            );

        return result.insertId;
    }

    private toEntity(
        row: PaymentIdempotencyRow
    ): PaymentIdempotency {

        const response =
            typeof row.response === "string"
                ? JSON.parse(row.response)
                : row.response;

        return {
            id: row.id,
            idempotencyKey:
                row.idempotency_key,
            paymentId:
                row.payment_id,
            requestHash:
                row.request_hash,
            response,
            createdAt:
                row.created_at,
            expiresAt:
                row.expires_at
        };
    }
}