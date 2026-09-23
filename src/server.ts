import app from "./app";
import { env } from "./config/env";

app.listen(
    env.port,
    () => {
        console.log(
            `Payment service running on port ${env.port}`
        );
    }
);