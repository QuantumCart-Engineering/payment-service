import { Router } from "express";

import paymentRoutes from "./payment.routes";

const router = Router();

router.use(
    "/api/v1/payments",
    paymentRoutes
);

export default router;