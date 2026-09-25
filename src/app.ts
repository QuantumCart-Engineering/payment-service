import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import routes from "./routes";
import { errorMiddleware } from "./middleware/error.middleware";
import { swaggerSpec } from "./docs/swagger";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get(
    "/health",
    (_request, response) => {
        response.status(200).json({
            success: true,
            data: {
                service: "payment-service",
                status: "UP"
            }
        });
    }
);

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);

app.use(routes);

app.use(errorMiddleware);

export default app;