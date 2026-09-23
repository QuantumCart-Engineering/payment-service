export const CREATE_PAYMENT = `
    INSERT INTO payments (
        order_id,
        amount,
        currency,
        payment_method,
        status,
        provider
    )
    VALUES (?, ?, ?, ?, 'INITIATED', ?)
`;

export const FIND_PAYMENT_BY_ID = `
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
`;

export const FIND_PAYMENT_BY_ORDER_ID = `
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
`;

export const UPDATE_PAYMENT_STATUS = `
    UPDATE payments
    SET status = ?
    WHERE id = ?
`;

export const UPDATE_PAYMENT_PROVIDER_DETAILS = `
    UPDATE payments
    SET
        provider_payment_id = ?,
        failure_code = ?,
        failure_reason = ?
    WHERE id = ?
`;