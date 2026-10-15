export type DemoProvider = { id: string; label: string; color: string };
export type DemoRow = { providerId: string; values: number[] };
export type DemoResponse = {
  source: "SYNTHETIC_DEMO";
  disclaimer: string;
  eventId: number;
  providers: DemoProvider[];
  rows: DemoRow[];
};
export const defaultProviders: DemoProvider[] = [
  { id: "a", label: "DEMO A", color: "blue" },
  { id: "b", label: "DEMO B", color: "red" },
  { id: "c", label: "DEMO C", color: "yellow" },
  { id: "d", label: "DEMO D", color: "dark" },
  { id: "e", label: "DEMO E", color: "coral" }
];

/** Display-only local fallback for offline demonstration; same formula as the API. */
export const demoFallback = (eventId: number): DemoResponse => ({
  source: "SYNTHETIC_DEMO",
  disclaimer: "Fikcyjne wartości szkolne. Nie są to rzeczywiste ani archiwalne kursy.",
  eventId,
  providers: defaultProviders,
  rows: defaultProviders.map((p, i) => ({
    providerId: p.id,
    values: [2.1, 3.4, 3.2].map((v, n) => Number((v + (((eventId * 13 + i * 7 + n * 17) % 17) - 8) * .025 + (eventId % 5) * .035).toFixed(2)))
  }))
});
