import { ResultSetHeader, RowDataPacket } from "mysql2";

import { dbPool } from "../config/database";
import {
    Payment,
    PaymentMethod,
    PaymentStatus
} from "../entities/payment.entity";

interface PaymentRow extends RowDataPacket {
    id: number;
    order_id: string;
    amount: number;
    currency: string;
    payment_method: PaymentMethod;
    status: PaymentStatus;
    provider: string;
    provider_payment_id: string | null;
    failure_code: string | null;
    failure_reason: string | null;
    created_at: Date;
    updated_at: Date;
}

export class PaymentRepository {
    async create(
        orderId: string,
        amount: number,
        currency: string,
        paymentMethod: PaymentMethod,
        provider: string
    ): Promise<number> {
        const [result] =
            await dbPool.execute<ResultSetHeader>(
                `
                INSERT INTO payments (
                    order_id,
                    amount,
                    currency,
                    payment_method,
                    status,
                    provider
                )
                VALUES (?, ?, ?, ?, 'INITIATED', ?)
                `,
                [
                    orderId,
                    amount,
                    currency,
                    paymentMethod,
                    provider
                ]
            );

        return result.insertId;
    }

    async findById(
        paymentId: number
    ): Promise<Payment | null> {
        const [rows] =
            await dbPool.execute<PaymentRow[]>(
                `
                SELECT
                    id,
                    order_id,
                    amount,
                    currency,
                    payment_method,
                    status,
                    provider,
                    provider_payment_id,
                    failure_code,
                    failure_reason,
                    created_at,
                    updated_at
                FROM payments
                WHERE id = ?
                `,
                [paymentId]
            );

        if (rows.length === 0) {
            return null;
        }

        return this.toEntity(rows[0]);
    }

    async findByOrderId(
        orderId: string
    ): Promise<Payment | null> {
        const [rows] =
            await dbPool.execute<PaymentRow[]>(
                `
                SELECT
                    id,
                    order_id,
                    amount,
                    currency,
                    payment_method,
                    status,
                    provider,
                    provider_payment_id,
                    failure_code,
                    failure_reason,
                    created_at,
                    updated_at
                FROM payments
                WHERE order_id = ?
                `,
                [orderId]
            );

        if (rows.length === 0) {
            return null;
        }

        return this.toEntity(rows[0]);
    }

    async updateStatus(
        paymentId: number,
        status: PaymentStatus
    ): Promise<void> {
        await dbPool.execute(
            `
            UPDATE payments
            SET status = ?
            WHERE id = ?
            `,
            [status, paymentId]
        );
    }

    async updateProviderDetails(
        paymentId: number,
        providerPaymentId: string | null,
        failureCode: string | null,
        failureReason: string | null
    ): Promise<void> {
        await dbPool.execute(
            `
            UPDATE payments
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
                paymentId
            ]
        );
    }

    private toEntity(
        row: PaymentRow
    ): Payment {
        return {
            id: row.id,
            orderId: row.order_id,
            amount: Number(row.amount),
            currency: row.currency,
            paymentMethod: row.payment_method,
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