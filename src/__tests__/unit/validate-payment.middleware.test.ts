import { Request, Response, NextFunction } from "express";

import {
    validateCreatePayment
} from "../../middleware/validate-payment.middleware";

describe("validateCreatePayment", () => {

    const createMockResponse = () => {
        const response = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        } as unknown as Response;

        return response;
    };

    const createMockNext = (): NextFunction =>
        jest.fn();

    it("should call next for a valid payment request", () => {

        const request = {
            body: {
                orderId: "ORD-TEST-001",
                amount: 50000,
                paymentMethod: "UPI"
            }
        } as Request;

        const response =
            createMockResponse();

        const next =
            createMockNext();

        validateCreatePayment(
            request,
            response,
            next
        );

        expect(next).toHaveBeenCalledTimes(1);

        expect(response.status)
            .not.toHaveBeenCalled();
    });

    it("should reject when orderId is missing", () => {

        const request = {
            body: {
                amount: 50000,
                paymentMethod: "UPI"
            }
        } as Request;

        const response =
            createMockResponse();

        const next =
            createMockNext();

        validateCreatePayment(
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
                    message: "Validation failed",
                    details: [
                        "orderId is required and must be a non-empty string"
                    ]
                }
            });

        expect(next)
            .not.toHaveBeenCalled();
    });

    it("should reject when amount is invalid", () => {

        const request = {
            body: {
                orderId: "ORD-TEST-002",
                amount: -100,
                paymentMethod: "UPI"
            }
        } as Request;

        const response =
            createMockResponse();

        const next =
            createMockNext();

        validateCreatePayment(
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
                    message: "Validation failed",
                    details: [
                        "amount must be a valid number greater than zero"
                    ]
                }
            });

        expect(next)
            .not.toHaveBeenCalled();
    });

    it("should reject an unsupported payment method", () => {

        const request = {
            body: {
                orderId: "ORD-TEST-003",
                amount: 50000,
                paymentMethod: "ABC"
            }
        } as Request;

        const response =
            createMockResponse();

        const next =
            createMockNext();

        validateCreatePayment(
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
                    message: "Validation failed",
                    details: [
                        "paymentMethod must be one of: UPI, DEBIT_CARD, CREDIT_CARD"
                    ]
                }
            });

        expect(next)
            .not.toHaveBeenCalled();
    });

    it("should return all validation errors together", () => {

        const request = {
            body: {
                orderId: "",
                amount: -100,
                paymentMethod: "ABC"
            }
        } as Request;

        const response =
            createMockResponse();

        const next =
            createMockNext();

        validateCreatePayment(
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
                    message: "Validation failed",
                    details: [
                        "orderId is required and must be a non-empty string",
                        "amount must be a valid number greater than zero",
                        "paymentMethod must be one of: UPI, DEBIT_CARD, CREDIT_CARD"
                    ]
                }
            });

        expect(next)
            .not.toHaveBeenCalled();
    });
});