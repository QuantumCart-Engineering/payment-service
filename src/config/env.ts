import dotenv from "dotenv";

dotenv.config();

const requiredEnv = (
    name: string
): string => {
    const value = process.env[name];

    if (!value) {
        throw new Error(
            `Missing required environment variable: ${name}`
        );
    }

    return value;
};

export const env = {
    nodeEnv: process.env.NODE_ENV ?? "development",

    port: Number(
        process.env.PORT ?? 8006
    ),

    db: {
        host: requiredEnv("DB_HOST"),
        port: Number(
            requiredEnv("DB_PORT")
        ),
        user: requiredEnv("DB_USER"),
        password: requiredEnv("DB_PASSWORD"),
        name: requiredEnv("DB_NAME"),
        connectionLimit: Number(
            process.env.DB_CONNECTION_LIMIT ?? 10
        ),
        rootUser: requiredEnv("DB_ROOT_USER"),
        rootPassword: requiredEnv("DB_ROOT_PASSWORD")
    },

    rabbitmqUrl: requiredEnv(
        "RABBITMQ_URL"
    ),

    paymentProvider:
        process.env.PAYMENT_PROVIDER ?? "mock"
};