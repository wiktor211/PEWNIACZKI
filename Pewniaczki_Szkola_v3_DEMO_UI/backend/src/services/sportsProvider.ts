import { ApiError } from "../lib/errors";
import { parseFeed } from "./parser";

export async function getLeagueSchedule(externalId: string) {
  const base = process.env.SPORTS_API_BASE ?? "https://www.thesportsdb.com/api/v1/json/123";
  // Stały host, brak przyjmowania adresów URL od użytkownika (ochrona przed SSRF).
  if (!/^https:\/\/www\.thesportsdb\.com\/api\/v1\/json\/[A-Za-z0-9_-]+\/?$/.test(base)) {
    throw new ApiError(500, "Nieprawidłowa konfiguracja SPORTS_API_BASE", "CONFIG");
  }
  const timeout = Math.min(Math.max(Number(process.env.REQUEST_TIMEOUT_MS) || 8000, 1000), 20000);
  const url = new URL(`${base.replace(/\/$/, "")}/eventsnextleague.php`);
  url.searchParams.set("id", externalId);
  let response: Response;
  try {
    response = await fetch(url, { headers: { "Accept": "application/json" }, signal: AbortSignal.timeout(timeout) });
  } catch (cause) {
    throw new ApiError(503, "Nie można połączyć się ze sportowym API (sieć lub timeout)", "PROVIDER_UNAVAILABLE");
  }
  if (response.status === 429) throw new ApiError(429, "Limit zapytań do API. Spróbuj później.", "RATE_LIMIT");
  if (!response.ok) throw new ApiError(502, `Zewnętrzne API zwróciło HTTP ${response.status}`, "PROVIDER_HTTP");
  let payload: unknown;
  try { payload = await response.json(); }
  catch { throw new ApiError(502, "API zwróciło nieprawidłowy JSON", "PROVIDER_JSON"); }
  try { return parseFeed(payload); }
  catch { throw new ApiError(502, "API zwróciło dane o nieznanym formacie", "PROVIDER_DATA"); }
}
