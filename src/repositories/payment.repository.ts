import { ResultSetHeader, RowDataPacket } from "mysql2";

import { dbPool } from "../config/database";
import {
    Payment,
    PaymentMethod,
    PaymentStatus
} from "../entities/payment.entity";

import {
    CREATE_PAYMENT,
    FIND_PAYMENT_BY_ID,
    FIND_PAYMENT_BY_ORDER_ID,
    UPDATE_PAYMENT_STATUS,
    UPDATE_PAYMENT_PROVIDER_DETAILS
} from "../queries/payment.queries";

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
                CREATE_PAYMENT,
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
                FIND_PAYMENT_BY_ID,
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
                FIND_PAYMENT_BY_ORDER_ID,
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
            UPDATE_PAYMENT_STATUS,
            [
                status,
                paymentId
            ]
        );
    }

    async updateProviderDetails(
        paymentId: number,
        providerPaymentId: string | null,
        failureCode: string | null,
        failureReason: string | null
    ): Promise<void> {
        await dbPool.execute(
            UPDATE_PAYMENT_PROVIDER_DETAILS,
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
            failureCode:
                row.failure_code,
            failureReason:
                row.failure_reason,
            createdAt:
                row.created_at,
            updatedAt:
                row.updated_at
        };
    }
}