import { Router } from "express";
import { z } from "zod";
import { db } from "../lib/db";
import { ApiError, intId, wrap } from "../lib/errors";
import { syncLeague } from "../services/sync";
import { requireAuth, requireAdmin } from "../lib/auth";
import { demoProviders, demoValuesForEvent } from "../services/demoValues";

const api = Router();
const eventInclude = { sport: true, league: true, homeTeam: true, awayTeam: true } as const;
const favoriteInclude = { event: { include: { sport: true, league: true, homeTeam: true, awayTeam: true } } } as const;
const noteSchema = z.object({ note: z.string().trim().max(250).nullable().optional() }).strict();

api.get("/health", wrap(async (_req, res) => {
  await db.$queryRaw`SELECT 1`;
  res.json({ ok: true, data: { service: "pewniaczki-api", db: "connected", timestamp: new Date().toISOString() } });
}));
api.use(requireAuth);
// Explicitly offline/synthetic data: no external sportsbook connections.
api.get("/demo-rates", wrap(async (req, res) => {
  const query = z.object({ eventId: z.coerce.number().int().positive() }).parse(req.query);
  const event = await db.event.findUnique({ where: { id: query.eventId }, select: { id: true } });
  if (!event) throw new ApiError(404, "Nie znaleziono wydarzenia", "NOT_FOUND");
  res.json({ ok: true, data: {
    source: "SYNTHETIC_DEMO",
    disclaimer: "Fikcyjne wartości szkolne. Nie są to rzeczywiste ani archiwalne kursy.",
    eventId: query.eventId,
    providers: demoProviders,
    rows: demoValuesForEvent(query.eventId)
  } });
}));
api.get("/sports", wrap(async (_req, res) => {
  const data = await db.sport.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { events: true } } } });
  res.json({ ok: true, data });
}));
api.get("/leagues", wrap(async (_req, res) => {
  const data = await db.league.findMany({ orderBy: { name: "asc" }, include: { sport: true, _count: { select: { events: true } } } });
  res.json({ ok: true, data });
}));
api.get("/events", wrap(async (req, res) => {
  const query = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(30),
    sportId: z.coerce.number().int().positive().optional(),
    leagueId: z.coerce.number().int().positive().optional(),
    search: z.string().trim().max(100).optional(),
    onlyUpcoming: z.enum(["0", "1"]).default("0")
  }).parse(req.query);
  const where = {
    ...(query.sportId ? { sportId: query.sportId } : {}),
    ...(query.leagueId ? { leagueId: query.leagueId } : {}),
    ...(query.onlyUpcoming === "1" ? { startAt: { gte: new Date() } } : {}),
    ...(query.search ? { OR: [
      { homeTeam: { name: { contains: query.search } } },
      { awayTeam: { name: { contains: query.search } } },
      { league: { name: { contains: query.search } } }
    ] } : {})
  };
  const [total, data] = await Promise.all([
    db.event.count({ where }),
    db.event.findMany({
      where, include: { ...eventInclude, favorites: { where: { userId: req.currentUser!.id } } }, orderBy: { startAt: "asc" },
      skip: (query.page - 1) * query.limit, take: query.limit
    })
  ]);
  res.json({ ok: true, data: data.map(({ favorites, ...event }) => ({ ...event, favorite: favorites[0] || null })), meta: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } });
}));
api.get("/events/:id", wrap(async (req, res) => {
  const data = await db.event.findUnique({ where: { id: intId(req.params.id) }, include: { ...eventInclude, favorites: { where: { userId: req.currentUser!.id } } } });
  if (!data) throw new ApiError(404, "Nie znaleziono wydarzenia", "NOT_FOUND");
  const { favorites, ...event } = data;
  res.json({ ok: true, data: { ...event, favorite: favorites[0] || null } });
}));
api.get("/favorites", wrap(async (_req, res) => {
  const data = await db.favorite.findMany({ where: { userId: _req.currentUser!.id }, include: favoriteInclude, orderBy: { createdAt: "desc" } });
  res.json({ ok: true, data });
}));
api.post("/favorites", wrap(async (req, res) => {
  const body = z.object({ eventId: z.number().int().positive(), note: z.string().trim().max(250).nullable().optional() }).strict().parse(req.body);
  if (!(await db.event.findUnique({ where: { id: body.eventId }, select: { id: true } }))) {
    throw new ApiError(404, "Nie znaleziono wydarzenia", "NOT_FOUND");
  }
  const data = await db.favorite.create({ data: { eventId: body.eventId, userId: req.currentUser!.id, note: body.note || null }, include: favoriteInclude });
  res.status(201).json({ ok: true, data });
}));
api.put("/favorites/:id", wrap(async (req, res) => {
  const parsed = noteSchema.parse(req.body);
  if (!("note" in parsed)) throw new ApiError(400, "Podaj pole note", "VALIDATION");
  const id = intId(req.params.id);
  const owned = await db.favorite.findFirst({ where: { id, userId: req.currentUser!.id } });
  if (!owned) throw new ApiError(404, "Nie znaleziono notatki", "NOT_FOUND");
  const data = await db.favorite.update({ where: { id }, data: { note: parsed.note || null }, include: favoriteInclude });
  res.json({ ok: true, data });
}));
api.delete("/favorites/:id", wrap(async (req, res) => {
  const id = intId(req.params.id);
  const result = await db.favorite.deleteMany({ where: { id, userId: req.currentUser!.id } });
  if (!result.count) throw new ApiError(404, "Nie znaleziono wpisu", "NOT_FOUND");
  res.status(204).end();
}));
api.post("/sync", requireAdmin, wrap(async (req, res) => {
  const body = z.object({ leagueId: z.number().int().positive() }).strict().parse(req.body);
  const result = await syncLeague(body.leagueId);
  res.json({ ok: true, data: result });
}));
api.get("/sync/logs", requireAdmin, wrap(async (_req, res) => {
  const data = await db.syncLog.findMany({ orderBy: { createdAt: "desc" }, take: 15, include: { league: { select: { name: true } } } });
  res.json({ ok: true, data });
}));
export default api;
