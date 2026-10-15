import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, BarChart3, Bell, Bookmark, CalendarDays, Check, ChevronDown,
  CircleHelp, Clock3, Database, Filter, LayoutDashboard, LoaderCircle,
  LogOut, Menu, RefreshCw, Search, Settings2, ShieldCheck, SlidersHorizontal,
  Star, TrendingUp, UserRound, UsersRound, X
} from "lucide-react";
import { api } from "./api";
import type { AppUser, Event, Favorite, League, Sport } from "./types";
import AdminPanel from "./AdminPanel";
import { defaultProviders, demoFallback, type DemoResponse, type DemoProvider } from "./demoData";
import "./dashboard-v3.css";

type Screen = "events" | "saved" | "analysis" | "stats" | "admin" | "profile" | "sources";
type DetailTab = "values" | "stats" | "h2h" | "analysis";
const sportOptions = [
  { key: "all", label: "Wszystkie", emoji: "🌐" },
  { key: "soccer", label: "Piłka nożna", emoji: "⚽" },
  { key: "basketball", label: "Koszykówka", emoji: "🏀" },
  { key: "tennis", label: "Tenis", emoji: "🎾" },
  { key: "hockey", label: "Hokej", emoji: "🏒" },
  { key: "volleyball", label: "Siatkówka", emoji: "🏐" },
  { key: "esports", label: "eSport", emoji: "🎮" }
];
const datetime = (iso: string) => new Date(iso);
const timeText = (iso: string) => new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit" }).format(datetime(iso));
const shortDate = (iso: string) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "numeric" }).format(datetime(iso));
const dateLine = (iso: string) => new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(datetime(iso));
const sportIcon = (slug: string) => sportOptions.find(s => s.key === slug)?.emoji || "🏅";
const initial = (name: string) => (name.trim().split(/\s+/).at(-1) || name).slice(0, 1).toUpperCase();
const dateInputValue = (date: Date) => [date.getFullYear(),String(date.getMonth()+1).padStart(2,"0"),String(date.getDate()).padStart(2,"0")].join("-");
const humanOutcome = ["1", "X", "2"];

function Brand() {
  return <div className="pv3-brand"><span className="pv3-brand-icon"><Activity size={24}/></span><span><strong>pewniaczki<span>.</span></strong><small>SPORT DATA HUB</small></span></div>;
}
function ProviderMark({ provider }: { provider: DemoProvider }) {
  return <span className={`pv3-provider pv3-provider-${provider.color}`}>{provider.label}</span>;
}
function MiniChart({ eventId }: { eventId: number }) {
  const lines = [0, 1, 2].map((n) => Array.from({ length: 16 }, (_, i) => {
    const wave = Math.sin((i / 3) + n + eventId / 3) * (n === 0 ? 7 : 4);
    return `${14 + i * 17},${75 - n * 23 - wave - i*.2}`;
  }).join(" "));
  return <div className="pv3-chart">
    <div className="pv3-legend"><span><i style={{ background: "#26d2a8" }}/> Przykład 1</span><span><i style={{ background: "#359cff" }}/> Przykład X</span><span><i style={{ background: "#ff5266" }}/> Przykład 2</span></div>
    <svg viewBox="0 0 280 103" role="img" aria-label="Poglądowy wykres fikcyjnych wartości" preserveAspectRatio="none">
      {[18,40,62,84].map(y=><line key={y} x1="10" x2="275" y1={y} y2={y} stroke="#29405a" strokeWidth=".8" />)}
      {lines.map((line, i) => <polyline key={i} fill="none" stroke={["#26d2a8", "#359cff", "#ff5266"][i]} strokeWidth="2.3" points={line}/>)}
    </svg><div className="pv3-chart-axis"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>DEMO</span></div>
  </div>;
}

export default function Dashboard({ currentUser, onLogout }: { currentUser: AppUser; onLogout: () => Promise<void> }) {
  const [events,setEvents] = useState<Event[]>([]);
  const [sports,setSports] = useState<Sport[]>([]);
  const [leagues,setLeagues] = useState<League[]>([]);
  const [screen,setScreen] = useState<Screen>("events");
  const [sport,setSport] = useState("all");
  const [leagueId,setLeagueId] = useState("all");
  const [search,setSearch] = useState("");
  const [dateFilter,setDateFilter] = useState("");
  const [upcoming,setUpcoming] = useState(false);
  const [selectedId,setSelectedId] = useState<number|null>(null);
  const [detailTab,setDetailTab] = useState<DetailTab>("values");
  const [demoData,setDemoData] = useState<DemoResponse|null>(null);
  const [loading,setLoading] = useState(true);
  const [working,setWorking] = useState<number|null>(null);
  const [syncing,setSyncing] = useState(false);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  const [menuOpen,setMenuOpen] = useState(false);
  const [noteTarget,setNoteTarget] = useState<Favorite|null>(null);
  const [note,setNote] = useState("");
  const [filterOpen,setFilterOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [e,s,l] = await Promise.all([api<Event[]>("/events?limit=100"),api<Sport[]>("/sports"),api<League[]>("/leagues")]);
      setEvents(e.data); setSports(s.data); setLeagues(l.data); setError("");
    } catch(err) { setError(err instanceof Error ? err.message : "Nie udało się połączyć z bazą danych"); }
    finally { setLoading(false); }
  },[]);
  useEffect(()=>{void refresh();},[refresh]);
  const visible = useMemo(()=>events.filter(e => {
    if(screen === "saved" && !e.favorite) return false;
    if(sport !== "all" && e.sport.slug !== sport) return false;
    if(leagueId !== "all" && e.league.id !== Number(leagueId)) return false;
    if(dateFilter && dateInputValue(datetime(e.startAt)) !== dateFilter) return false;
    if(upcoming && datetime(e.startAt).getTime() < Date.now()) return false;
    const text=`${e.homeTeam.name} ${e.awayTeam.name} ${e.league.name}`.toLocaleLowerCase("pl");
    return text.includes(search.trim().toLocaleLowerCase("pl"));
  }),[events,screen,sport,leagueId,dateFilter,upcoming,search]);
  const selected = visible.find(e=>e.id===selectedId) || visible[0] || null;
  useEffect(()=>{
    if(!selected) {setDemoData(null); return;}
    setDemoData(demoFallback(selected.id));
    api<DemoResponse>(`/demo-rates?eventId=${selected.id}`).then(r=>setDemoData(r.data)).catch(()=>{/* Local preview still available */});
  },[selected?.id]);
  const displayedDemo = selected ? (demoData?.eventId===selected.id ? demoData : demoFallback(selected.id)) : null;
  const savedCount=events.filter(e=>e.favorite).length;
  const demoCount=events.filter(e=>e.source === "demo").length;

  async function toggleFavorite(event:Event) {
    setWorking(event.id);
    try {
      if(event.favorite) await api(`/favorites/${event.favorite.id}`,{method:"DELETE"});
      else await api("/favorites",{method:"POST",body:JSON.stringify({eventId:event.id})});
      await refresh();setNotice(event.favorite?"Usunięto z zapisanych":"Zapisano wydarzenie");
    } catch(err) {setError(err instanceof Error?err.message:"Błąd zapisywania");}
    finally {setWorking(null);}
  }
  async function saveNote(){
    if(!noteTarget) return;setWorking(noteTarget.eventId);
    try {await api(`/favorites/${noteTarget.id}`,{method:"PUT",body:JSON.stringify({note})});await refresh();setNoteTarget(null);setNotice("Notatka zapisana");}
    catch(err){setError(err instanceof Error?err.message:"Nie udało się zapisać notatki");}
    finally {setWorking(null);}
  }
  async function doSync(){
    setSyncing(true);setError("");
    try {
      const subset=leagueId==="all"?leagues:leagues.filter(l=>l.id===Number(leagueId));
      for(const l of subset) await api("/sync",{method:"POST",body:JSON.stringify({leagueId:l.id})});
      await refresh();setNotice("Zaktualizowano terminarze sportowe");
    } catch(err){setError(err instanceof Error?err.message:"Nie udało się zsynchronizować terminarza");}
    finally {setSyncing(false);}
  }
  const nav=(name:Screen)=>{setScreen(name);setMenuOpen(false);setDetailTab("values");};
  const providers=displayedDemo?.providers || defaultProviders;
  const demoRow=(id:number) => (selected?.id===id && displayedDemo ? displayedDemo : demoFallback(id));
  return <div className="pv3-app">
    <aside className={`pv3-sidebar ${menuOpen?"pv3-sidebar-open":""}`}>
      <Brand/>
      <div className="pv3-side-section">PANEL GŁÓWNY</div>
      <button className={`pv3-side-link ${screen==="events"?"active":""}`} onClick={()=>nav("events")}><LayoutDashboard size={20}/>Przegląd wydarzeń</button>
      <button className={`pv3-side-link ${screen==="analysis"?"active":""}`} onClick={()=>nav("analysis")}><BarChart3 size={20}/>Analizy</button>
      <button className={`pv3-side-link ${screen==="saved"?"active":""}`} onClick={()=>nav("saved")}><Bookmark size={20}/>Zapisane wydarzenia <b className="pv3-side-count">{savedCount}</b></button>
      {currentUser.role==="ADMIN" && <button className={`pv3-side-link ${screen==="admin"?"active":""}`} onClick={()=>nav("admin")}><UsersRound size={20}/>Administrator</button>}
      <div className="pv3-side-section pv3-side-sport-heading">DYSCYPLINY</div>
      {sportOptions.map(s=><button key={s.key} className={`pv3-sport-side ${sport===s.key?"selected":""}`} onClick={()=>{setSport(s.key);setLeagueId("all");nav("events");}}><span>{s.emoji}</span>{s.label}</button>)}
      <div className="pv3-side-section pv3-side-settings-heading">USTAWIENIA</div>
      <button className={`pv3-side-link pv3-side-compact ${screen==="profile"?"active":""}`} onClick={()=>nav("profile")}><UserRound size={19}/>Profil</button>
      <button className={`pv3-side-link pv3-side-compact ${screen==="sources"?"active":""}`} onClick={()=>nav("sources")}><Database size={19}/>API i źródła danych</button>
      <button className="pv3-side-link pv3-side-compact" onClick={()=>{setNotice("Pomoc znajdziesz w README.md oraz INSTRUKCJA_SZKOLA.txt.");nav("events");}}><CircleHelp size={19}/>Pomoc</button>
      <button className="pv3-side-link pv3-side-compact" onClick={()=>void onLogout()}><LogOut size={19}/>Wyloguj się</button>
      <div className="pv3-sidebar-bottom"><div><i/> Środowisko lokalne</div><span>Projekt szkolny · wersja 3.0 (DEMO)</span></div>
    </aside>
    {menuOpen && <button className="pv3-shade" aria-label="Zamknij menu" onClick={()=>setMenuOpen(false)}/>}
    <div className="pv3-workspace">
      <header className="pv3-topbar">
        <button className="pv3-mobile-menu" onClick={()=>setMenuOpen(true)} aria-label="Otwórz menu"><Menu size={22}/></button>
        <div className="pv3-primary-nav">
          <button className={screen==="events"?"selected":""} onClick={()=>nav("events")}><LayoutDashboard size={18}/>Przegląd wydarzeń</button>
          <button className={screen==="saved"?"selected":""} onClick={()=>nav("saved")}>Zapisane</button>
          <button className={screen==="analysis"?"selected":""} onClick={()=>nav("analysis")}>Analizy</button>
          <button className={screen==="stats"?"selected":""} onClick={()=>nav("stats")}>Statystyki</button>
        </div>
        <div className="pv3-header-right"><label className="pv3-header-search"><Search size={19}/><input aria-label="Szukaj drużyny, ligi lub meczu" value={search} onChange={e=>{setSearch(e.target.value);setScreen("events");}} placeholder="Szukaj drużyny, ligi lub meczu…"/></label><button className="pv3-round-btn" onClick={()=>nav("sources")} aria-label="Ustawienia danych"><Settings2 size={19}/></button><span className="pv3-user-avatar">{initial(currentUser.username)}</span><span className="pv3-header-user">{currentUser.username}</span><ChevronDown size={14}/></div>
      </header>
      {screen==="admin" ? <div className="pv3-admin-container"><AdminPanel/></div> : screen==="profile" || screen==="sources" ? <section className="pv3-info-view"><p className="pv3-eyebrow">PEWNIACZKI · USTAWIENIA</p><h1>{screen==="profile"?"Twój profil":"Źródła danych"}</h1>{screen==="profile"?<div className="pv3-info-card"><p><b>Login:</b> {currentUser.username}</p><p><b>E-mail:</b> {currentUser.email}</p><p><b>Rola:</b> {currentUser.role}</p><p>Twoje zapisane wydarzenia: {savedCount}</p></div>:<div className="pv3-info-card"><p><b>Wydarzenia sportowe:</b> MySQL + TheSportsDB (terminarze).</p><p><b>Tabela demonstracyjna:</b> lokalny endpoint <code>/api/demo-rates</code> — fikcyjne wartości, nie kursy rynkowe.</p><p><b>Dane testowe:</b> {demoCount} wydarzeń oznaczonych jako pokazowe.</p><p><b>Uwierzytelnianie:</b> lokalna baza MySQL i bezpieczne sesje.</p></div>}<button className="pv3-outline-btn" onClick={()=>nav("events")}>Wróć do wydarzeń</button></section> : <>
        <div className="pv3-sportbar"><div className="pv3-sportchips">{sportOptions.map(s=><button key={s.key} className={sport===s.key?"active":""} onClick={()=>{setSport(s.key);setLeagueId("all");nav("events");}}><span>{s.emoji}</span>{s.label}</button>)}</div><div className="pv3-sort"><label className="pv3-select-date"><SlidersHorizontal size={16}/><select aria-label="Wybierz ligę" value={leagueId} onChange={e=>setLeagueId(e.target.value)}><option value="all">Wszystkie ligi</option>{leagues.filter(l=>sport==="all"||l.sport.slug===sport).map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select><ChevronDown size={13}/></label><label className="pv3-date-button"><CalendarDays size={17}/><input aria-label="Wybierz datę" type="date" value={dateFilter} onChange={e=>setDateFilter(e.target.value)}/></label></div></div>
        <div className="pv3-demo-disclaimer"><ShieldCheck size={14}/> Wersja edukacyjna · Wszystkie liczby w tabeli są fikcyjnymi danymi DEMO, nie aktualnymi ani archiwalnymi ofertami bukmacherskimi.</div>
        {notice && <div className="pv3-banner success"><Check size={17}/>{notice}<button aria-label="Zamknij komunikat" onClick={()=>setNotice("")}><X size={15}/></button></div>}
        {error && <div className="pv3-banner error"><CircleHelp size={17}/>{error}<button aria-label="Zamknij komunikat" onClick={()=>setError("")}><X size={15}/></button></div>}
        <div className="pv3-dashboard-grid">
          <div className="pv3-main-column">
            <div className="pv3-list-title"><div><span>PRZEGLĄD SPORTOWY</span><h1>{screen==="saved"?"Zapisane wydarzenia":screen==="analysis"?"Analizy wydarzeń":screen==="stats"?"Statystyki wydarzeń":"Nadchodzące wydarzenia"}</h1><p>Terminarz z bazy MySQL · przykładowe wartości demonstracyjne</p></div><div className="pv3-list-controls"><span className="pv3-status-pill"><i/> {events.length} wydarzeń</span><button onClick={()=>setFilterOpen(!filterOpen)} aria-expanded={filterOpen}><Filter size={18}/> Filtry</button></div></div>
            {filterOpen && <div className="pv3-extra-filters"><label><input type="checkbox" checked={upcoming} onChange={e=>setUpcoming(e.target.checked)}/> Tylko przyszłe wydarzenia</label><button onClick={()=>{setUpcoming(false);setDateFilter("");setSport("all");setLeagueId("all");setSearch("");}}>Wyczyść filtry</button>{currentUser.role==="ADMIN"&&<button onClick={()=>void doSync()} disabled={syncing}>{syncing?<LoaderCircle size={14} className="pv3-spin"/>:<RefreshCw size={14}/>} Synchronizuj terminarz</button>}</div>}
            <section className="pv3-comparison-panel"><div className="pv3-table-head"><span>WYDARZENIE</span>{providers.map(p=><ProviderMark key={p.id} provider={p}/>)}</div>
              <div className="pv3-event-rows">{loading?<div className="pv3-empty"><LoaderCircle className="pv3-spin" size={25}/> Ładowanie wydarzeń…</div>:visible.length?visible.map(e=>{
                const quote=demoRow(e.id);
                return <article key={e.id} className={`pv3-event-row ${selected?.id===e.id?"pv3-event-selected":""}`}>
                  <button className="pv3-event-select" onClick={()=>{setSelectedId(e.id);setDetailTab("values");}} aria-label={`Pokaż szczegóły wydarzenia ${e.homeTeam.name} – ${e.awayTeam.name}`}>
                    <span className="pv3-time"><strong>{timeText(e.startAt)}</strong><small>{shortDate(e.startAt)}</small></span><span className="pv3-teamicons"><span>{initial(e.homeTeam.name)}</span><span>{initial(e.awayTeam.name)}</span></span><span className="pv3-event-info"><strong>{e.homeTeam.name}</strong><strong>{e.awayTeam.name}</strong><small>{sportIcon(e.sport.slug)} {e.league.name}</small></span>
                  </button>
                  <div className="pv3-row-values">{quote.rows.map(row=><div key={row.providerId} className="pv3-double-number"><span>{row.values[0].toFixed(2)}</span><span>{row.values[2].toFixed(2)}</span></div>)}</div>
                  <button className={`pv3-star ${e.favorite?"pv3-star-active":""}`} title={e.favorite?"Usuń z zapisanych":"Zapisz wydarzenie"} onClick={()=>void toggleFavorite(e)} disabled={working===e.id}><Star size={20} fill={e.favorite?"currentColor":"none"}/></button>
                </article>;
              }):<div className="pv3-empty"><Search size={27}/><h3>Brak wydarzeń</h3><p>Zmień filtry lub wprowadź dane testowe w MySQL.</p><button onClick={()=>{setSport("all");setLeagueId("all");setSearch("");setDateFilter("");setUpcoming(false);setScreen("events");}}>Wyczyść filtry</button></div>}</div>
            </section>
            <div className="pv3-footnote"><span><Database size={14}/> Wydarzenia: MySQL / TheSportsDB</span><span>Wartości kolumn: lokalne DEMO</span></div>
          </div>
          <aside className="pv3-details">
            {selected ? <><div className="pv3-match-heading"><div className="pv3-match-meta"><span>{sportIcon(selected.sport.slug)} {selected.league.name}</span><span>{dateLine(selected.startAt)}</span></div><div className="pv3-match-teams"><div><span className="pv3-big-avatar">{initial(selected.homeTeam.name)}</span><strong>{selected.homeTeam.name}</strong></div><b>VS</b><div><span className="pv3-big-avatar away">{initial(selected.awayTeam.name)}</span><strong>{selected.awayTeam.name}</strong></div></div></div>
            <div className="pv3-detail-tabs">{([{key:"values",title:"Przykład"},{key:"stats",title:"Statystyki"},{key:"h2h",title:"H2H"},{key:"analysis",title:"Analiza"}] as const).map(t=><button key={t.key} onClick={()=>setDetailTab(t.key)} className={detailTab===t.key?"active":""}>{t.title}</button>)}</div>
            {detailTab==="values"&&displayedDemo?<div className="pv3-detail-content"><h3>Fikcyjne zestawienie · DEMO</h3><div className="pv3-detail-table"><div className="pv3-detail-table-head"><span>Próbka</span>{humanOutcome.map(o=><span key={o}>{o}</span>)}</div>{displayedDemo.rows.map((r,i)=><div className="pv3-detail-table-row" key={r.providerId}><ProviderMark provider={providers[i]}/>{r.values.map((v,n)=><span key={n} className="pv3-demo-cell">{v.toFixed(2)}</span>)}</div>)}</div><h3>Przykładowe wartości</h3><div className="pv3-summary-numbers">{humanOutcome.map((o,n)=><div key={o}><strong>{displayedDemo.rows[0].values[n].toFixed(2)}</strong><span>{o==="1"?selected.homeTeam.name:o==="2"?selected.awayTeam.name:"Remis"}</span></div>)}</div><h3>Wykres demonstracyjny</h3><MiniChart eventId={selected.id}/></div>:<div className="pv3-detail-content pv3-detail-information">{detailTab==="stats"?<><h3>Informacje o wydarzeniu</h3><p><strong>Dyscyplina:</strong> {selected.sport.name}</p><p><strong>Liga:</strong> {selected.league.name}</p><p><strong>Data:</strong> {dateLine(selected.startAt)}</p><p><strong>Miejsce:</strong> {selected.venue||"Brak informacji"}</p><p><strong>Źródło wydarzenia:</strong> {selected.source==="demo"?"Dane pokazowe":"TheSportsDB"}</p></>:detailTab==="h2h"?<><h3>Bezpośrednie spotkania</h3><p>Ta wersja nie pobiera historii spotkań H2H. Zakładka pozostaje elementem prezentacji układu.</p></>:<><h3>Analiza techniczna danych</h3><p>Wydarzenie zapisano w MySQL. Można wyszukiwać je według ligi, dyscypliny oraz daty.</p><p>Widoczne wartości są generowane lokalnie na potrzeby prezentacji szkolnej. Nie są związane z żadną rzeczywistą ofertą.</p></>}</div>}
            <div className="pv3-details-footer">{selected.favorite?<button onClick={()=>{setNoteTarget(selected.favorite);setNote(selected.favorite?.note||"");}}><Bookmark size={16}/> {selected.favorite.note?"Edytuj notatkę":"Dodaj notatkę"}</button>:<button onClick={()=>void toggleFavorite(selected)}><Bookmark size={16}/> Zapisz wydarzenie</button>}</div>
            </>:<div className="pv3-empty">Wybierz wydarzenie, aby zobaczyć szczegóły.</div>}
          </aside>
        </div>
        <footer className="pv3-footer">Pewniaczki · edukacyjny projekt webowy <span>React · Express · Prisma · MySQL · DEMO</span></footer>
      </>}
    </div>
    {noteTarget && <div className="pv3-modal-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setNoteTarget(null);}}><div className="pv3-modal" role="dialog" aria-modal="true" aria-label="Edycja notatki"><div><h2>Notatka do wydarzenia</h2><button onClick={()=>setNoteTarget(null)} aria-label="Zamknij"><X size={20}/></button></div><textarea maxLength={250} value={note} onChange={e=>setNote(e.target.value)} placeholder="Twoja notatka…"/><small>{note.length}/250 znaków</small><button className="pv3-save-note" onClick={()=>void saveNote()} disabled={working!==null}>Zapisz notatkę</button></div></div>}
  </div>;
}
