import fs from "node:fs/promises";
import path from "node:path";

import { dbPool } from "../config/database";

const migrate = async (): Promise<void> => {
    try {
        const migrationPath = path.join(
            process.cwd(),
            "migrations",
            "001_create_payment_tables.sql"
        );

        const sql = await fs.readFile(
            migrationPath,
            "utf-8"
        );

        const connection =
            await dbPool.getConnection();

        try {
            await connection.query(sql);

            console.log(
                "Payment Service database migration completed successfully"
            );
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error(
            "Payment Service database migration failed:",
            error
        );

        process.exitCode = 1;
    } finally {
        await dbPool.end();
    }
};

migrate();