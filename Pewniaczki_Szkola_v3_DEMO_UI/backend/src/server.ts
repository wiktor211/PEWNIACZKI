import "dotenv/config";
import express from "express";
import cors from "cors";
import { db } from "./lib/db";
import { ApiError, errorHandler } from "./lib/errors";
import api from "./routes/api";
import auth from "./routes/auth";
import admin from "./routes/admin";

const app = express();
app.disable("x-powered-by");
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "50kb" }));
app.use("/api/auth", auth);
app.use("/api/admin", admin);
app.use("/api", api);
app.use((_req, _res, next) => next(new ApiError(404, "Nieznany endpoint", "NOT_FOUND")));
app.use(errorHandler);
const port = Number(process.env.PORT) || 4000;
const server = app.listen(port, "127.0.0.1", () => {
  console.log(`Pewniaczki API -> http://localhost:${port}/api/health`);
});
async function shutdown() {
  server.close();
  await db.$disconnect();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
