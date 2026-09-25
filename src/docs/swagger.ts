import { OpenAPIV3 } from "openapi-types";

export const swaggerSpec: OpenAPIV3.Document = {
    openapi: "3.0.3",

    info: {
        title: "QuantumCart Payment Service API",
        version: "1.0.0",
        description:
            "API documentation for the QuantumCart Payment Service."
    },

    servers: [
        {
            url: "http://localhost:8006",
            description: "Local Payment Service"
        }
    ],

    tags: [
        {
            name: "Health",
            description: "Payment service health"
        },
        {
            name: "Payments",
            description: "Payment APIs"
        }
    ],

    paths: {
        "/health": {
            get: {
                tags: ["Health"],
                summary: "Check payment service health",

                responses: {
                    "200": {
                        description:
                            "Payment service is healthy",

                        content: {
                            "application/json": {
                                schema: {
                                    $ref:
                                        "#/components/schemas/HealthResponse"
                                }
                            }
                        }
                    }
                }
            }
        },

        "/api/v1/payments": {
            post: {
                tags: ["Payments"],
                summary: "Create a payment",

                parameters: [
                    {
                        name: "Idempotency-Key",
                        in: "header",
                        required: true,

                        description:
                            "Unique key used to prevent duplicate payment processing.",

                        schema: {
                            type: "string"
                        },

                        example:
                            "payment-order-12345"
                    }
                ],

                requestBody: {
                    required: true,

                    content: {
                        "application/json": {
                            schema: {
                                $ref:
                                    "#/components/schemas/CreatePaymentRequest"
                            }
                        }
                    }
                },

                responses: {
                    "201": {
                        description:
                            "Payment created successfully",

                        content: {
                            "application/json": {
                                schema: {
                                    $ref:
                                        "#/components/schemas/PaymentSuccessResponse"
                                }
                            }
                        }
                    },

                    "400": {
                        description:
                            "Invalid payment request or missing Idempotency-Key",

                        content: {
                            "application/json": {
                                schema: {
                                    $ref:
                                        "#/components/schemas/ErrorResponse"
                                }
                            }
                        }
                    },

                    "409": {
                        description:
                            "Payment already exists or idempotency conflict",

                        content: {
                            "application/json": {
                                schema: {
                                    $ref:
                                        "#/components/schemas/ErrorResponse"
                                }
                            }
                        }
                    },

                    "500": {
                        description:
                            "Internal server error",

                        content: {
                            "application/json": {
                                schema: {
                                    $ref:
                                        "#/components/schemas/ErrorResponse"
                                }
                            }
                        }
                    }
                }
            }
        }
    },

    components: {
        schemas: {
            CreatePaymentRequest: {
                type: "object",

                required: [
                    "orderId",
                    "amount",
                    "paymentMethod"
                ],

                properties: {
                    orderId: {
                        type: "string",
                        example:
                            "3737f288-e899-4908-a164-b148cb5db3e0"
                    },

                    amount: {
                        type: "number",
                        format: "double",
                        example: 49999
                    },

                    paymentMethod: {
                        type: "string",

                        enum: [
                            "UPI",
                            "DEBIT_CARD",
                            "CREDIT_CARD"
                        ],

                        example: "UPI"
                    }
                }
            },

            PaymentResponse: {
                type: "object",

                properties: {
                    id: {
                        type: "string",
                        format: "uuid",
                        example:
                            "8c8c6c7a-4c8a-4b0d-9a3a-9e4f1c7b2d11"
                    },

                    orderId: {
                        type: "string",
                        format: "uuid",
                        example:
                            "3737f288-e899-4908-a164-b148cb5db3e0"
                    },

                    amount: {
                        type: "number",
                        format: "double",
                        example: 49999
                    },

                    currency: {
                        type: "string",
                        example: "INR"
                    },

                    paymentMethod: {
                        type: "string",
                        enum: [
                            "UPI",
                            "DEBIT_CARD",
                            "CREDIT_CARD"
                        ],

                        example: "UPI"
                    },

                    status: {
                        type: "string",

                        enum: [
                            "INITIATED",
                            "PROCESSING",
                            "SUCCESS",
                            "FAILED",
                            "REFUND_PENDING",
                            "REFUNDED"
                        ],

                        example: "SUCCESS"
                    }
                }
            },

            PaymentSuccessResponse: {
                type: "object",

                properties: {
                    success: {
                        type: "boolean",
                        example: true
                    },

                    data: {
                        $ref:
                            "#/components/schemas/PaymentResponse"
                    }
                }
            },

            HealthResponse: {
                type: "object",

                properties: {
                    success: {
                        type: "boolean",
                        example: true
                    },

                    data: {
                        type: "object",

                        properties: {
                            service: {
                                type: "string",
                                example:
                                    "payment-service"
                            },

                            status: {
                                type: "string",
                                example: "UP"
                            }
                        }
                    }
                }
            },

            ErrorResponse: {
                type: "object",

                properties: {
                    success: {
                        type: "boolean",
                        example: false
                    },

                    error: {
                        type: "object",

                        properties: {
                            message: {
                                type: "string",
                                example:
                                    "Validation failed"
                            },

                            details: {
                                type: "array",
                                items: {
                                    type: "string"
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};