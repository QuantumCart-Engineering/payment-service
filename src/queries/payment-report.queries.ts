/**
 * Reporting queries for the payment domain.
 *
 * `successfulAmount` counts only SUCCESS payments. Refunded payments
 * never contribute to successful revenue (the money was returned), and
 * failed payments are excluded entirely.
 */

export const PAYMENT_SUMMARY = `
    SELECT
        COUNT(*) AS total_payments,
        COALESCE(SUM(status = 'INITIATED'), 0) AS initiated,
        COALESCE(SUM(status = 'PROCESSING'), 0) AS processing,
        COALESCE(SUM(status = 'SUCCESS'), 0) AS success,
        COALESCE(SUM(status = 'FAILED'), 0) AS failed,
        COALESCE(SUM(status = 'REFUND_PENDING'), 0) AS refund_pending,
        COALESCE(SUM(status = 'REFUNDED'), 0) AS refunded,
        COALESCE(SUM(
            CASE WHEN status = 'SUCCESS' THEN amount ELSE 0 END
        ), 0) AS successful_amount
    FROM payments
    WHERE created_at >= ?
      AND created_at < ?
`;

export const PAYMENT_TIMESERIES_DAY = `
    SELECT
        DATE_FORMAT(created_at, '%Y-%m-%d') AS period,
        COALESCE(SUM(status = 'SUCCESS'), 0) AS success,
        COALESCE(SUM(status = 'FAILED'), 0) AS failed,
        COALESCE(SUM(
            CASE WHEN status = 'SUCCESS' THEN amount ELSE 0 END
        ), 0) AS amount
    FROM payments
    WHERE created_at >= ?
      AND created_at < ?
    GROUP BY period
    ORDER BY period ASC
`;

export const PAYMENT_TIMESERIES_MONTH = `
    SELECT
        DATE_FORMAT(created_at, '%Y-%m') AS period,
        COALESCE(SUM(status = 'SUCCESS'), 0) AS success,
        COALESCE(SUM(status = 'FAILED'), 0) AS failed,
        COALESCE(SUM(
            CASE WHEN status = 'SUCCESS' THEN amount ELSE 0 END
        ), 0) AS amount
    FROM payments
    WHERE created_at >= ?
      AND created_at < ?
    GROUP BY period
    ORDER BY period ASC
`;
