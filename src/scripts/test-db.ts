import { dbPool } from "../config/database";

const testDatabaseConnection =
    async (): Promise<void> => {
        try {
            const connection =
                await dbPool.getConnection();

            console.log(
                "Payment Service MySQL connection successful"
            );

            connection.release();
        } catch (error) {
            console.error(
                "Payment Service MySQL connection failed:",
                error
            );

            process.exitCode = 1;
        } finally {
            await dbPool.end();
        }
    };

testDatabaseConnection();