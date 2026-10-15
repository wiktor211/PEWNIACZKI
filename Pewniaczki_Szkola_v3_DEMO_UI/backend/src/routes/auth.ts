import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "../lib/db";
import { ApiError, wrap } from "../lib/errors";
import { endSession, requireAuth, startSession } from "../lib/auth";
import { rateLimit } from "../lib/rateLimit";

const router = Router();
const username = z.string().trim().toLowerCase().regex(/^[a-z0-9_-]{3,30}$/, "Login: 3-30 znaków (litery a-z, cyfry, _ lub -)");
const email = z.string().trim().toLowerCase().email().max(190);
const password = z.string().min(10, "Hasło musi mieć co najmniej 10 znaków").max(72);
const publicUser = (user: { id: number; username: string; email: string; role: string; isActive: boolean }) => ({ id: user.id, username: user.username, email: user.email, role: user.role, isActive: user.isActive });

router.post("/register", rateLimit(8, 60 * 60 * 1000), wrap(async (req, res) => {
  const body = z.object({ username, email, password }).strict().parse(req.body);
  if (body.username === "admin" || body.email === "admin@pewniaczki.local") throw new ApiError(409, "Ten login lub adres jest zarezerwowany", "RESERVED");
  const passwordHash = await bcrypt.hash(body.password, 12);
  const user = await db.user.create({ data: { username: body.username, email: body.email, passwordHash, role: "USER" } });
  await startSession(res, user.id);
  res.status(201).json({ ok: true, data: publicUser(user) });
}));
router.post("/login", rateLimit(15, 15 * 60 * 1000), wrap(async (req, res) => {
  const body = z.object({ login: z.string().trim().min(1).max(190), password: z.string().min(1) }).strict().parse(req.body);
  const login = body.login.toLowerCase();
  const user = await db.user.findFirst({ where: { OR: [{ username: login }, { email: login }] } });
  const valid = user ? await bcrypt.compare(body.password, user.passwordHash) : false;
  if (!valid) throw new ApiError(401, "Nieprawidłowy login lub hasło", "INVALID_CREDENTIALS");
  if (!user!.isActive) throw new ApiError(403, "Konto zostało zablokowane", "BLOCKED");
  await startSession(res, user!.id);
  res.json({ ok: true, data: publicUser(user!) });
}));
router.get("/me", requireAuth, wrap(async (req, res) => res.json({ ok: true, data: req.currentUser })));
router.post("/logout", wrap(async (req, res) => {
  await endSession(req, res);
  res.json({ ok: true, data: { loggedOut: true } });
}));
export default router;
