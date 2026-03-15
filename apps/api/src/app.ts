import express from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { vehiclesRouter } from "./routes/vehicles.js";
import { inventoryRouter } from "./routes/inventory.js";
import { ordersRouter } from "./routes/orders.js";
import { savedVehiclesRouter } from "./routes/savedVehicles.js";
import { shippingRouter } from "./routes/shipping.js";
import { financingRouter } from "./routes/financing.js";
import { appraisalsRouter } from "./routes/appraisals.js";
import { notificationsRouter } from "./routes/notifications.js";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
  })
);

// Quick root route so the base URL actually responds with something useful
app.get("/", (_req, res) => {
  res.json({
    api: "@vex/api",
    status: "running hot 🔥",
    message: "VEX backend is live — luxury whips, no cap",
    endpoints: {
      health: "GET /health → server check",
      auth: [
        "POST /auth/register → create account",
        "POST /auth/login → get JWT",
        "GET /auth/me → current user (needs token)"
      ],
      note: "Hit /health to confirm everything's breathing"
    },
    timestamp: new Date().toISOString()
  });
});

app.use("/health", healthRouter);
app.use("/auth", authRouter);
app.use("/vehicles", vehiclesRouter);
app.use("/inventory", inventoryRouter);
app.use("/orders", ordersRouter);
app.use("/saved-vehicles", savedVehiclesRouter);
app.use("/shipping", shippingRouter);
app.use("/financing", financingRouter);
app.use("/appraisals", appraisalsRouter);
app.use("/notifications", notificationsRouter);

export { app };