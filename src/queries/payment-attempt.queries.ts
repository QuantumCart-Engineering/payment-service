export const CREATE_PAYMENT_ATTEMPT = `
    INSERT INTO payment_attempts (
        payment_id,
        attempt_number,
        status,
        provider
    )
    VALUES (?, ?, 'INITIATED', ?)
`;

export const FIND_LATEST_PAYMENT_ATTEMPT = `
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
`;

export const FIND_PAYMENT_ATTEMPTS = `
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
`;

export const UPDATE_PAYMENT_ATTEMPT_STATUS = `
    UPDATE payment_attempts
    SET status = ?
    WHERE id = ?
`;

export const UPDATE_PAYMENT_ATTEMPT_PROVIDER_DETAILS = `
    UPDATE payment_attempts
    SET
        provider_payment_id = ?,
        failure_code = ?,
        failure_reason = ?
    WHERE id = ?
`;