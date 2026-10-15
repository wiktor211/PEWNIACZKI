import type { ApiEnvelope } from "./types";
export async function api<T>(path: string, options: RequestInit = {}): Promise<ApiEnvelope<T>> {
  const resp = await fetch(`/api${path}`, {
    ...options, credentials: "same-origin", headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  if (resp.status === 204) return { ok: true, data: undefined as T };
  let result: any;
  try { result = await resp.json(); } catch { throw new Error("Serwer zwrócił niepoprawną odpowiedź"); }
  if (!resp.ok || result.ok !== true) throw new Error(result?.error?.message || `HTTP ${resp.status}`);
  return result as ApiEnvelope<T>;
}
