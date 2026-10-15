import "dotenv/config";
import bcrypt from "bcryptjs";
import readline from "node:readline";
import { stdin as input, stdout as output } from "node:process";
import { db } from "../lib/db";

// Haslo nigdy nie jest wpisane do repozytorium. Wybor nastepuje podczas konfiguracji.
async function askPassword(question: string): Promise<string> {
  if (!input.isTTY || !input.setRawMode) {
    const rl = readline.createInterface({ input, output });
    try { return await new Promise<string>(resolve => rl.question(question, resolve)); }
    finally { rl.close(); }
  }
  output.write(question);
  const wasRaw = input.isRaw;
  input.setRawMode(true);
  input.resume();
  return new Promise((resolve, reject) => {
    let value = "";
    const cleanup = () => { input.removeListener("data", onData); input.setRawMode(Boolean(wasRaw)); input.pause(); output.write("\n"); };
    const onData = (data: Buffer) => {
      const key = data.toString("utf8");
      if (key === "\u0003") { cleanup(); reject(new Error("Anulowano")); return; }
      if (key === "\r" || key === "\n") { cleanup(); resolve(value); return; }
      if (key === "\u007f" || key === "\b") { value = value.slice(0,-1); return; }
      if (/^[\x20-\x7e]$/.test(key)) value += key;
    };
    input.on("data", onData);
  });
}
async function main() {
  const present = await db.user.findUnique({ where: { username: "admin" } });
  if (present) { if (present.role !== "ADMIN") throw new Error("Nazwa admin jest zajeta przez konto nieadministracyjne"); console.log("Konto admin juz istnieje. Haslo nie zostalo zmienione."); return; }
  console.log("KONFIGURACJA ADMINA. Login: admin");
  console.log("Ustaw nowe haslo: minimum 12 znakow, wielka i mala litera, cyfra i znak specjalny.");
  const password = await askPassword("Nowe haslo administratora (nie wyswietla sie): ");
  if (password.length < 12 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password) || !/[^\w\s]/.test(password)) throw new Error("Haslo musi miec >=12 znakow, male i wielkie litery, cyfre i znak specjalny.");
  const confirm = await askPassword("Powtorz haslo: ");
  if (confirm !== password) throw new Error("Hasla nie sa identyczne");
  const hash = await bcrypt.hash(password, 12);
  const user = await db.user.create({ data: { username: "admin", email: "admin@pewniaczki.local", passwordHash: hash, role: "ADMIN" } });
  const transferred = await db.favorite.updateMany({ where: { userId: null }, data: { userId: user.id } });
  console.log(`Utworzono konto admin. Dawne zapisane wydarzenia przeniesiono: ${transferred.count}.`);
}
main().catch(e => { console.error("BLAD:", e instanceof Error ? e.message : e); process.exitCode = 1; }).finally(() => db.$disconnect());
