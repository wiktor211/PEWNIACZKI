import type { Request, Response, NextFunction } from "express";
import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";
import { ApiError } from "./errors";

const COOKIE = "pewniaczki_session";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export const digest = (token: string) => createHash("sha256").update(token).digest("hex");

function cookies(req: Request): Record<string, string> {
  const entries: Record<string, string> = {};
  for (const piece of (req.headers.cookie || "").split(";")) {
    const [name, ...value] = piece.trim().split("=");
    if (name && value.length) entries[name] = value.join("=");
  }
  return entries;
}

export function sessionToken(req: Request) {
  const token = cookies(req)[COOKIE];
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}

const cookieOptions = () => ({
  httpOnly: true, sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production", path: "/",
});
export async function startSession(res: Response, userId: number) {
  const token = randomBytes(32).toString("hex");
  await db.session.create({ data: { userId, tokenHash: digest(token), expiresAt: new Date(Date.now() + WEEK_MS) } });
  res.cookie(COOKIE, token, { ...cookieOptions(), maxAge: WEEK_MS });
}
export async function endSession(req: Request, res: Response) {
  const token = sessionToken(req);
  if (token) await db.session.deleteMany({ where: { tokenHash: digest(token) } });
  res.clearCookie(COOKIE, cookieOptions());
}
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = sessionToken(req);
    if (!token) throw new ApiError(401, "Zaloguj się, aby kontynuować", "UNAUTHORIZED");
    const session = await db.session.findUnique({ where: { tokenHash: digest(token) }, include: { user: true } });
    if (!session || session.expiresAt.getTime() <= Date.now()) throw new ApiError(401, "Sesja wygasła. Zaloguj się ponownie", "UNAUTHORIZED");
    if (!session.user.isActive) throw new ApiError(403, "Konto jest zablokowane", "BLOCKED");
    req.currentUser = { id: session.user.id, username: session.user.username, email: session.user.email, role: session.user.role, isActive: session.user.isActive };
    req.sessionId = session.id;
    next();
  } catch (err) { next(err); }
}
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.currentUser?.role !== "ADMIN") return next(new ApiError(403, "Dostęp tylko dla administratora", "FORBIDDEN"));
  next();
}
