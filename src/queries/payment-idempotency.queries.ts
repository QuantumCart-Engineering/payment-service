export const FIND_PAYMENT_IDEMPOTENCY_BY_KEY = `
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
`;

export const CREATE_PAYMENT_IDEMPOTENCY = `
    INSERT INTO payment_idempotency (
        idempotency_key,
        payment_id,
        request_hash,
        response,
        expires_at
    )
    VALUES (?, ?, ?, ?, ?)
`;