import { z } from "zod";

const sourceEvent = z.object({
  idEvent: z.union([z.string(), z.number()]).nullable().optional(),
  strHomeTeam: z.string().nullable().optional(),
  strAwayTeam: z.string().nullable().optional(),
  strTimestamp: z.string().nullable().optional(),
  dateEvent: z.string().nullable().optional(),
  strTime: z.string().nullable().optional(),
  strVenue: z.string().nullable().optional()
}).passthrough();

const feed = z.object({ events: z.array(z.unknown()).nullable() });
export type NormalizedEvent = {
  externalId: string;
  home: string;
  away: string;
  startAt: Date;
  venue: string | null;
};
const tidy = (s: string) => s.trim().replace(/\s+/g, " ");

export function parseFeed(payload: unknown): { events: NormalizedEvent[]; received: number; skipped: number } {
  const parsed = feed.safeParse(payload);
  if (!parsed.success) throw new Error("Nieprawidłowa struktura odpowiedzi API (events)");
  const raw = parsed.data.events ?? [];
  const seen = new Set<string>();
  const events: NormalizedEvent[] = [];
  for (const item of raw) {
    const record = sourceEvent.safeParse(item);
    if (!record.success) continue;
    const v = record.data;
    const id = String(v.idEvent ?? "").trim();
    const home = tidy(v.strHomeTeam ?? "");
    const away = tidy(v.strAwayTeam ?? "");
    // Prefer ISO UTC timestamp; dateEvent + strTime is normally UTC in the v1 feed.
    const timeText = v.strTimestamp?.trim() || (v.dateEvent && v.strTime ? `${v.dateEvent}T${v.strTime.replace(/Z$/i, "")}Z` : "");
    const date = new Date(timeText);
    if (!id || !home || !away || home === away || !timeText || Number.isNaN(date.valueOf()) || seen.has(id)) continue;
    seen.add(id);
    events.push({ externalId: `tsdb-${id}`, home, away, startAt: date, venue: tidy(v.strVenue ?? "") || null });
  }
  return { events, received: raw.length, skipped: raw.length - events.length };
}
