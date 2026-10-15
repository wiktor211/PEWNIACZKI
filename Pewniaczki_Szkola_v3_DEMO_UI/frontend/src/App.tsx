import { useEffect, useState } from "react";
import { Activity, ArrowRight, Eye, EyeOff, LockKeyhole, UserRound, ShieldCheck, LoaderCircle } from "lucide-react";
import { api } from "./api";
import Dashboard from "./Dashboard";
import type { AppUser } from "./types";

type Screen = "login" | "register";
export default function App() {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<AppUser | null>(null);
  const [mode, setMode] = useState<Screen>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    api<AppUser>("/auth/me").then(r => setUser(r.data)).catch(() => setUser(null)).finally(() => setChecking(false));
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const result = mode === "login"
        ? await api<AppUser>("/auth/login", { method: "POST", body: JSON.stringify({ login: username, password }) })
        : await api<AppUser>("/auth/register", { method: "POST", body: JSON.stringify({ username, email, password }) });
      setPassword(""); setUser(result.data);
    } catch (e) { setError(e instanceof Error ? e.message : "Nie udało się połączyć z serwerem"); }
    finally { setBusy(false); }
  }
  async function logout() {
    try { await api("/auth/logout", { method: "POST" }); }
    finally { setUser(null); setPassword(""); setMode("login"); }
  }
  if (checking) return <div className="auth-loading"><LoaderCircle className="spin" size={32}/> Ładowanie Pewniaczków…</div>;
  if (user) return <Dashboard key={user.id} currentUser={user} onLogout={logout}/>;
  return <main className="auth-page">
    <div className="auth-decor"/><div className="auth-card">
      <div className="auth-brand"><span className="auth-logo"><Activity size={23}/></span><div><b>pewniaczki<span>.</span></b><small>SPORT DATA HUB</small></div></div>
      <div className="auth-icon"><LockKeyhole size={23}/></div>
      <p className="auth-overline">TWOJE CENTRUM SPORTOWE</p>
      <h1>{mode === "login" ? "Witaj ponownie." : "Utwórz konto."}</h1>
      <p className="auth-description">{mode === "login" ? "Zaloguj się, aby przeglądać mecze, przykładowe dane i swoje zapisane wydarzenia." : "Załóż konto, zapisuj wydarzenia i przeglądaj demonstracyjne zestawienia sportowe."}</p>
      <div className="auth-tabs"><button className={mode === "login" ? "active" : ""} onClick={() => {setMode("login");setError("");}}>Logowanie</button><button className={mode === "register" ? "active" : ""} onClick={() => {setMode("register");setError("");}}>Rejestracja</button></div>
      <form onSubmit={submit} className="auth-form">
        <label><span>{mode === "login" ? "Login lub e-mail" : "Login (3–30 znaków)"}</span><div className="auth-input"><UserRound size={18}/><input required value={username} onChange={e => setUsername(e.target.value)} placeholder={mode === "login" ? "Twój login lub adres e-mail" : "np. wiktor123"} autoComplete="username" minLength={mode === "register" ? 3 : 1}/></div></label>
        {mode === "register" && <label><span>Adres e-mail</span><div className="auth-input"><span>@</span><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="twoj@email.pl" autoComplete="email"/></div></label>}
        <label><span>Hasło {mode === "register" ? "(minimum 10 znaków)" : ""}</span><div className="auth-input"><LockKeyhole size={18}/><input required type={showPassword ? "text" : "password"} minLength={mode === "register" ? 10 : 1} value={password} onChange={e => setPassword(e.target.value)} placeholder="Wpisz hasło" autoComplete={mode === "login" ? "current-password" : "new-password"}/><button type="button" onClick={() => setShowPassword(v=>!v)} aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></label>
        {error && <div className="auth-error" role="alert">{error}</div>}
        <button className="auth-submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={18}/> : <ShieldCheck size={18}/>} {mode === "login" ? "Zaloguj się" : "Utwórz konto"}<ArrowRight size={18}/></button>
      </form>
      <p className="auth-foot">Projekt edukacyjny • Dane kont przechowywane w MySQL • Hasła zabezpieczone hashem</p>
    </div>
    <div className="auth-right"><div className="auth-pill">⚽ SPORT / WYDARZENIA / DANE DEMO</div><h2>Sportowe<br/>wydarzenia.<br/><em>Jeden panel.</em></h2><p>Terminarze, widok demonstracyjnych tabel, Twoje zapisane mecze i panel administratora.</p><div className="auth-features"><div>✓ &nbsp; Własne konto i notatki</div><div>✓ &nbsp; Bezpieczne sesje</div><div>✓ &nbsp; Dane w lokalnej bazie MySQL</div></div></div>
  </main>;
}
