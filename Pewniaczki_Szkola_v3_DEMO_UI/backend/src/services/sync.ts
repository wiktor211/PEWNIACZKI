import { db } from "../lib/db";
import { ApiError } from "../lib/errors";
import { getLeagueSchedule } from "./sportsProvider";

const pending = new Map<number, Promise<SyncResult>>();
type SyncResult = { cached: boolean; imported: number; received: number; skipped: number; updatedAt: string | null };
export function syncLeague(leagueId: number): Promise<SyncResult> {
  const running = pending.get(leagueId);
  if (running) return running;
  const task = performSync(leagueId).finally(() => pending.delete(leagueId));
  pending.set(leagueId, task);
  return task;
}
async function performSync(leagueId: number): Promise<SyncResult> {
  const league = await db.league.findUnique({ where: { id: leagueId } });
  if (!league) throw new ApiError(404, "Nie znaleziono ligi", "NOT_FOUND");
  const ttlMinutes = Math.min(Math.max(Number(process.env.SYNC_TTL_MINUTES) || 30, 1), 1440);
  if (league.lastSyncedAt && Date.now() - league.lastSyncedAt.getTime() < ttlMinutes * 60000) {
    return { cached: true, imported: 0, received: 0, skipped: 0, updatedAt: league.lastSyncedAt.toISOString() };
  }
  let received = 0;
  let skipped = 0;
  let imported = 0;
  try {
    const feed = await getLeagueSchedule(league.externalId);
    received = feed.received;
    skipped = feed.skipped;
    // Atomiczność jednego wydarzenia: nie pozostawiamy częściowo zapisanych relacji.
    for (const item of feed.events) {
      await db.$transaction(async (tx) => {
        const home = await tx.team.upsert({
          where: { sportId_name: { sportId: league.sportId, name: item.home } },
          update: {}, create: { sportId: league.sportId, name: item.home }
        });
        const away = await tx.team.upsert({
          where: { sportId_name: { sportId: league.sportId, name: item.away } },
          update: {}, create: { sportId: league.sportId, name: item.away }
        });
        await tx.event.upsert({
          where: { externalId: item.externalId },
          create: {
            externalId: item.externalId, sportId: league.sportId, leagueId: league.id,
            homeTeamId: home.id, awayTeamId: away.id,
            startAt: item.startAt, venue: item.venue, source: "thesportsdb"
          },
          update: { startAt: item.startAt, venue: item.venue, homeTeamId: home.id, awayTeamId: away.id }
        });
      });
      imported++;
    }
    const now = new Date();
    await db.$transaction([
      db.league.update({ where: { id: leagueId }, data: { lastSyncedAt: now } }),
      db.syncLog.create({ data: { leagueId, status: "success", received, imported, skipped } })
    ]);
    return { cached: false, imported, received, skipped, updatedAt: now.toISOString() };
  } catch (e) {
    await db.syncLog.create({ data: {
      leagueId, status: "error", received, imported, skipped,
      error: e instanceof Error ? e.message.slice(0, 250) : "Unknown error"
    }}).catch(() => undefined);
    throw e;
  }
}
