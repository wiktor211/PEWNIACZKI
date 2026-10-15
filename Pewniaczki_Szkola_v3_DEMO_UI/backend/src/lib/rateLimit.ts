import type { Request, Response, NextFunction } from "express";
import { ApiError } from "./errors";
// Proste ograniczenie ruchu do uzytku lokalnego / szkolnego.
// Dla wdrozenia publicznego nalezy uzyc trwalego magazynu typu Redis.
export function rateLimit(max: number, windowMs: number) {
  const buckets = new Map<string, { attempts: number; expires: number }>();
  return (req: Request, _res: Response, next: NextFunction) => {
    const now = Date.now();
    const ip = req.ip || "local";
    const old = buckets.get(ip);
    const data = !old || old.expires < now ? { attempts: 0, expires: now + windowMs } : old;
    data.attempts++;
    buckets.set(ip, data);
    if (buckets.size > 500) for (const [key, b] of buckets) if (b.expires < now) buckets.delete(key);
    if (data.attempts > max) return next(new ApiError(429, "Zbyt wiele prób. Spróbuj później", "RATE_LIMIT"));
    next();
  };
}
