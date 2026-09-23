import mysql from "mysql2/promise";
import { PoolConnection } from "mysql2/promise";

import { env } from "./env";

export const dbPool = mysql.createPool({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.name,
    connectionLimit: env.db.connectionLimit,
    waitForConnections: true,
    queueLimit: 0,
    multipleStatements: true
});

export const withTransaction = async <T>(
    callback: (connection: PoolConnection) => Promise<T>
): Promise<T> => {
    const connection = await dbPool.getConnection();

    try {
        await connection.beginTransaction();

        const result = await callback(connection);

        await connection.commit();

        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};