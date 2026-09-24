import {
    Request,
    Response,
    NextFunction
} from "express";

import {
    requireIdempotencyKey
} from "../../middleware/idempotency.middleware";

describe("requireIdempotencyKey", () => {

    const createMockResponse = () => {
        return {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        } as unknown as Response;
    };

    const createMockNext = (): NextFunction =>
        jest.fn();

    it("should call next when Idempotency-Key is present", () => {

        const request = {
            header: jest.fn()
                .mockReturnValue("payment-key-001")
        } as unknown as Request;

        const response =
            createMockResponse();

        const next =
            createMockNext();

        requireIdempotencyKey(
            request,
            response,
            next
        );

        expect(next)
            .toHaveBeenCalledTimes(1);

        expect(request.idempotencyKey)
            .toBe("payment-key-001");

        expect(response.status)
            .not.toHaveBeenCalled();
    });

    it("should trim whitespace from Idempotency-Key", () => {

        const request = {
            header: jest.fn()
                .mockReturnValue("  payment-key-002  ")
        } as unknown as Request;

        const response =
            createMockResponse();

        const next =
            createMockNext();

        requireIdempotencyKey(
            request,
            response,
            next
        );

        expect(request.idempotencyKey)
            .toBe("payment-key-002");

        expect(next)
            .toHaveBeenCalledTimes(1);
    });

    it("should reject request when Idempotency-Key is missing", () => {

        const request = {
            header: jest.fn()
                .mockReturnValue(undefined)
        } as unknown as Request;

        const response =
            createMockResponse();

        const next =
            createMockNext();

        requireIdempotencyKey(
            request,
            response,
            next
        );

        expect(response.status)
            .toHaveBeenCalledWith(400);

        expect(response.json)
            .toHaveBeenCalledWith({
                success: false,
                error: {
                    message:
                        "Idempotency-Key header is required"
                }
            });

        expect(next)
            .not.toHaveBeenCalled();
    });

    it("should reject an empty Idempotency-Key", () => {

        const request = {
            header: jest.fn()
                .mockReturnValue("   ")
        } as unknown as Request;

        const response =
            createMockResponse();

        const next =
            createMockNext();

        requireIdempotencyKey(
            request,
            response,
            next
        );

        expect(response.status)
            .toHaveBeenCalledWith(400);

        expect(response.json)
            .toHaveBeenCalledWith({
                success: false,
                error: {
                    message:
                        "Idempotency-Key header is required"
                }
            });

        expect(next)
            .not.toHaveBeenCalled();
    });
});