/** Synthetic fixtures for UI demonstration only. No real bookmaker data. */
export const demoProviders = [
  { id: "a", label: "DEMO A", color: "blue" },
  { id: "b", label: "DEMO B", color: "red" },
  { id: "c", label: "DEMO C", color: "yellow" },
  { id: "d", label: "DEMO D", color: "dark" },
  { id: "e", label: "DEMO E", color: "coral" }
] as const;

export function demoValuesForEvent(eventId: number) {
  const baseline = [2.1, 3.4, 3.2];
  return demoProviders.map((provider, i) => ({
    providerId: provider.id,
    values: baseline.map((v, outcome) => {
      const offset = (((eventId * 13 + i * 7 + outcome * 17) % 17) - 8) * 0.025;
      return Number((v + offset + (eventId % 5) * 0.035).toFixed(2));
    })
  }));
}
