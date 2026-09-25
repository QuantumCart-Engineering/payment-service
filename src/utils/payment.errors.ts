export class IdempotencyConflictError
    extends Error {

    constructor(
        message =
            "Idempotency-Key was already used with a different request"
    ) {
        super(message);

        this.name =
            "IdempotencyConflictError";
    }
}

export class PaymentAlreadyExistsError
    extends Error {

    constructor(
        message =
            "Payment already exists for this order"
    ) {
        super(message);

        this.name =
            "PaymentAlreadyExistsError";
    }
}