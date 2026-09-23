export class PaymentConflictError
    extends Error {
    constructor(message: string) {
        super(message);
        this.name =
            "PaymentConflictError";
    }
}

export class IdempotencyConflictError
    extends Error {
    constructor(message: string) {
        super(message);
        this.name =
            "IdempotencyConflictError";
    }
}