import {
    ResultSetHeader,
    RowDataPacket
} from "mysql2";

import { dbPool } from "../config/database";

import {
    PaymentIdempotency
} from "../entities/payment-idempotency.entity";

interface PaymentIdempotencyRow
    extends RowDataPacket {
    id: number;
    idempotency_key: string;
    payment_id: number;
    request_hash: string;
    response: string;
    created_at: Date;
    expires_at: Date;
}

export class PaymentIdempotencyRepository {
    async findByKey(
        idempotencyKey: string
    ): Promise<PaymentIdempotency | null> {
        const [rows] =
            await dbPool.execute<
                PaymentIdempotencyRow[]
            >(
                `
                SELECT
                    id,
                    idempotency_key,
                    payment_id,
                    request_hash,
                    response,
                    created_at,
                    expires_at
                FROM payment_idempotency
                WHERE idempotency_key = ?
                AND expires_at > CURRENT_TIMESTAMP
                `,
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
        expiresAt: Date
    ): Promise<number> {
        const [result] =
            await dbPool.execute<ResultSetHeader>(
                `
                INSERT INTO payment_idempotency (
                    idempotency_key,
                    payment_id,
                    request_hash,
                    response,
                    expires_at
                )
                VALUES (?, ?, ?, ?, ?)
                `,
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
        return {
            id: row.id,
            idempotencyKey:
                row.idempotency_key,
            paymentId: row.payment_id,
            requestHash: row.request_hash,
            response:
                JSON.parse(row.response),
            createdAt: row.created_at,
            expiresAt: row.expires_at
        };
    }
}