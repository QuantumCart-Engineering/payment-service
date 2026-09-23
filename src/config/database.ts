import mysql from "mysql2/promise";

import { env } from "./env";

export const dbPool =
    mysql.createPool({
        host: env.db.host,
        port: env.db.port,
        user: env.db.user,
        password: env.db.password,
        database: env.db.name,
        connectionLimit:
            env.db.connectionLimit,
        waitForConnections: true,
        queueLimit: 0,
        multipleStatements: true
    });