import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const plusDays = (days: number, hour: number) => {
  const d = new Date();
  d.setUTCHours(hour, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
};

async function main() {
  const soccer = await db.sport.upsert({
    where: { slug: "soccer" }, create: { slug: "soccer", name: "Piłka nożna" }, update: { name: "Piłka nożna" }
  });
  const basketball = await db.sport.upsert({
    where: { slug: "basketball" }, create: { slug: "basketball", name: "Koszykówka" }, update: { name: "Koszykówka" }
  });
  const config = [
    { externalId: "4328", name: "Premier League", country: "Anglia", sportId: soccer.id },
    { externalId: "4335", name: "La Liga", country: "Hiszpania", sportId: soccer.id },
    { externalId: "4387", name: "NBA", country: "USA", sportId: basketball.id }
  ];
  const leagues = await Promise.all(config.map((row) => db.league.upsert({
    where: { externalId: row.externalId }, update: { name: row.name, country: row.country }, create: row
  })));
  const sportMap: Record<string, number> = { soccer: soccer.id, basketball: basketball.id };
  const demos = [
    ["Arsenal", "Chelsea", 0, "soccer", 1, 18, "Emirates Stadium"],
    ["Liverpool", "Manchester City", 0, "soccer", 3, 19, "Anfield"],
    ["Tottenham", "Newcastle", 0, "soccer", 4, 16, "Tottenham Stadium"],
    ["Real Madrid", "FC Barcelona", 1, "soccer", 2, 20, "Santiago Bernabéu"],
    ["Atlético Madryt", "Sevilla", 1, "soccer", 5, 19, "Metropolitano"],
    ["Valencia", "Villarreal", 1, "soccer", 6, 18, "Mestalla"],
    ["Boston Celtics", "Los Angeles Lakers", 2, "basketball", 1, 23, "TD Garden"],
    ["Golden State Warriors", "Chicago Bulls", 2, "basketball", 3, 22, "Chase Center"],
    ["Miami Heat", "New York Knicks", 2, "basketball", 4, 23, "Kaseya Center"]
  ] as const;
  for (let i = 0; i < demos.length; i++) {
    const [home, away, leagueIdx, sportKey, days, hour, venue] = demos[i];
    const sportId = sportMap[sportKey];
    const homeTeam = await db.team.upsert({
      where: { sportId_name: { sportId, name: home } }, update: {}, create: { sportId, name: home }
    });
    const awayTeam = await db.team.upsert({
      where: { sportId_name: { sportId, name: away } }, update: {}, create: { sportId, name: away }
    });
    await db.event.upsert({
      where: { externalId: `demo-${i+1}` },
      update: {},
      create: {
        externalId: `demo-${i+1}`, sportId, leagueId: leagues[leagueIdx].id,
        homeTeamId: homeTeam.id, awayTeamId: awayTeam.id,
        startAt: plusDays(days, hour), venue, source: "demo"
      }
    });
  }
  console.log("Dane demonstracyjne: 2 dyscypliny, 3 ligi, 9 wydarzen.");
}

main().catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(async () => db.$disconnect());
