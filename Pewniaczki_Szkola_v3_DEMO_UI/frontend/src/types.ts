export type Sport = { id: number; name: string; slug: string; _count?: { events: number } };
export type League = { id: number; name: string; country: string | null; externalId: string; lastSyncedAt: string | null; sportId: number; sport: Sport; _count?: { events: number } };
export type Team = { id: number; name: string };
export type Favorite = { id: number; eventId: number; note: string | null; createdAt: string; event?: Event };
export type Event = { id: number; externalId: string; source: string; startAt: string; status: string; venue: string | null; sport: Sport; league: League; homeTeam: Team; awayTeam: Team; favorite: Favorite | null };
export type ApiEnvelope<T> = { ok: boolean; data: T; meta?: { page: number; limit: number; total: number; pages: number } };

export type AppUser = { id: number; username: string; email: string; role: "USER" | "ADMIN"; isActive: boolean };
export type AdminUser = AppUser & { createdAt: string; _count: { favorites: number } };
