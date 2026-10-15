import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db";
import { requireAdmin, requireAuth } from "../lib/auth";
import { ApiError, intId, wrap } from "../lib/errors";

const router = Router();
router.use(requireAuth, requireAdmin);
router.get("/users", wrap(async (_req, res) => {
  const data = await db.user.findMany({
    select: { id: true, username: true, email: true, role: true, isActive: true, createdAt: true, _count: { select: { favorites: true } } },
    orderBy: { createdAt: "desc" }
  });
  res.json({ ok: true, data });
}));
router.patch("/users/:id/status", wrap(async (req, res) => {
  const id = intId(req.params.id);
  const { isActive } = z.object({ isActive: z.boolean() }).strict().parse(req.body);
  if (id === req.currentUser!.id) throw new ApiError(400, "Nie możesz zablokować własnego konta", "SELF_CHANGE");
  const target = await db.user.findUnique({ where: { id } });
  if (!target) throw new ApiError(404, "Użytkownik nie istnieje", "NOT_FOUND");
  if (target.role === "ADMIN") throw new ApiError(403, "Nie można blokować administratorów z panelu", "FORBIDDEN");
  const updated = await db.user.update({ where: { id }, data: { isActive }, select: { id: true, username: true, isActive: true } });
  if (!isActive) await db.session.deleteMany({ where: { userId: id } });
  res.json({ ok: true, data: updated });
}));
router.get("/logs", wrap(async (_req, res) => {
  const data = await db.syncLog.findMany({ take: 25, orderBy: { createdAt: "desc" }, include: { league: { select: { name: true } } } });
  res.json({ ok: true, data });
}));
export default router;
