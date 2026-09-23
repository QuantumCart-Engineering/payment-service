CREATE TABLE IF NOT EXISTS payments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    order_id VARCHAR(100) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    payment_method ENUM(
        'UPI',
        'DEBIT_CARD',
        'CREDIT_CARD'
    ) NOT NULL,
    status ENUM(
        'INITIATED',
        'PROCESSING',
        'SUCCESS',
        'FAILED',
        'REFUND_PENDING',
        'REFUNDED'
    ) NOT NULL DEFAULT 'INITIATED',
    provider VARCHAR(50) NOT NULL,
    provider_payment_id VARCHAR(150) NULL,
    failure_code VARCHAR(100) NULL,
    failure_reason VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uk_payments_order_id (order_id),

    KEY idx_payments_status (status),
    KEY idx_payments_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS payment_attempts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    payment_id BIGINT UNSIGNED NOT NULL,
    attempt_number INT UNSIGNED NOT NULL,
    status ENUM(
        'INITIATED',
        'PROCESSING',
        'SUCCESS',
        'FAILED'
    ) NOT NULL DEFAULT 'INITIATED',
    provider VARCHAR(50) NOT NULL,
    provider_payment_id VARCHAR(150) NULL,
    failure_code VARCHAR(100) NULL,
    failure_reason VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),

    UNIQUE KEY uk_payment_attempt (
        payment_id,
        attempt_number
    ),

    KEY idx_attempts_payment_id (payment_id),

    CONSTRAINT fk_attempts_payment
        FOREIGN KEY (payment_id)
        REFERENCES payments(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS payment_idempotency (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    idempotency_key VARCHAR(255) NOT NULL,
    payment_id BIGINT UNSIGNED NOT NULL,
    request_hash CHAR(64) NOT NULL,
    response JSON NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,

    PRIMARY KEY (id),

    UNIQUE KEY uk_payment_idempotency_key (
        idempotency_key
    ),

    KEY idx_idempotency_payment_id (payment_id),
    KEY idx_idempotency_expires_at (expires_at),

    CONSTRAINT fk_idempotency_payment
        FOREIGN KEY (payment_id)
        REFERENCES payments(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);