import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(public status: number, message: string, public code = "API_ERROR") {
    super(message);
  }
}
export const wrap = (handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => Promise.resolve(handler(req, res, next)).catch(next);

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) return res.status(400).json({ ok: false, error: { code: "VALIDATION", message: "Niepoprawne dane wejściowe", details: err.flatten() } });
  if (err instanceof ApiError) return res.status(err.status).json({ ok: false, error: { code: err.code, message: err.message } });
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") return res.status(409).json({ ok: false, error: { code: "DUPLICATE", message: "Taki wpis już istnieje" } });
    if (err.code === "P2025") return res.status(404).json({ ok: false, error: { code: "NOT_FOUND", message: "Nie znaleziono wpisu" } });
  }
  console.error("Błąd backendu:", err);
  return res.status(500).json({ ok: false, error: { code: "SERVER_ERROR", message: "Błąd serwera. Sprawdź terminal backendu." } });
}
export function intId(value: unknown, label = "id") {
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n <= 0) throw new ApiError(400, `Niepoprawny parametr ${label}`, "VALIDATION");
  return n;
}
