import { useEffect, useState } from "react";
import { UsersRound, Shield, RefreshCw, CheckCircle2, Ban, LoaderCircle } from "lucide-react";
import { api } from "./api";
import type { AdminUser } from "./types";

type SyncLog = { id: number; status: string; received: number; imported: number; skipped: number; createdAt: string; league: { name: string } };
export default function AdminPanel() {
  const [users,setUsers] = useState<AdminUser[]>([]);
  const [logs,setLogs] = useState<SyncLog[]>([]);
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState<number | null>(null);
  const [error,setError] = useState("");
  const [notice,setNotice] = useState("");
  async function reload() {
    setError("");
    try { const [u,l] = await Promise.all([api<AdminUser[]>("/admin/users"), api<SyncLog[]>("/admin/logs")]); setUsers(u.data);setLogs(l.data); }
    catch(e) {setError(e instanceof Error ? e.message : "Błąd pobierania użytkowników");}
    finally {setLoading(false);}
  }
  useEffect(() => {void reload();},[]);
  async function change(user: AdminUser) {
    if (user.role === "ADMIN" || !confirm(`Czy ${user.isActive ? "zablokować" : "odblokować"} konto ${user.username}?`)) return;
    setBusy(user.id);setNotice("");setError("");
    try { await api(`/admin/users/${user.id}/status`, {method:"PATCH", body:JSON.stringify({isActive:!user.isActive})}); setNotice(`Zmieniono status konta ${user.username}`); await reload(); }
    catch(e) {setError(e instanceof Error ? e.message : "Błąd zmiany statusu");}
    finally {setBusy(null);}
  }
  return <div className="admin-layout">
    <div className="section-heading"><div><div className="section-eyebrow">DOSTĘP ADMINISTRATORA</div><h2>Panel administratora</h2><p>Użytkownicy są zapisani w MySQL; hasła nigdy nie są wyświetlane.</p></div><button className="refresh-btn" onClick={()=>void reload()}><RefreshCw size={16}/> Odśwież</button></div>
    {error && <div className="notice error" role="alert">{error}</div>}
    {notice && <div className="notice success">{notice}</div>}
    <div className="admin-stats"><div><UsersRound size={20}/><strong>{users.length}</strong><span>Użytkowników</span></div><div><CheckCircle2 size={20}/><strong>{users.filter(u=>u.isActive).length}</strong><span>Aktywnych</span></div><div><Shield size={20}/><strong>{users.filter(u=>u.role==="ADMIN").length}</strong><span>Administratorów</span></div></div>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Login</th><th>E-mail</th><th>Rola</th><th>Status</th><th>Zapisane</th><th>Akcja</th></tr></thead><tbody>
      {users.map(u=><tr key={u.id}><td><b>{u.username}</b></td><td>{u.email}</td><td>{u.role==="ADMIN"?"Administrator":"Użytkownik"}</td><td><span className={u.isActive?"state state-ok":"state state-off"}>{u.isActive?"Aktywny":"Zablokowany"}</span></td><td>{u._count.favorites}</td><td>{u.role==="ADMIN"?"—":<button className="admin-action" disabled={busy===u.id} onClick={()=>void change(u)}>{busy===u.id?<LoaderCircle className="spin" size={14}/>:u.isActive?<Ban size={14}/>:<CheckCircle2 size={14}/>} {u.isActive?"Zablokuj":"Odblokuj"}</button>}</td></tr>)}
      {!loading&&!users.length&&<tr><td colSpan={6}>Brak użytkowników</td></tr>}
    </tbody></table></div>
    <h3 className="admin-logs-title">Historia synchronizacji terminarzy</h3>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Data</th><th>Liga</th><th>Status</th><th>Odebrane</th><th>Zapisane</th><th>Pominięte</th></tr></thead><tbody>{logs.map(l=><tr key={l.id}><td>{new Date(l.createdAt).toLocaleString("pl-PL")}</td><td>{l.league.name}</td><td>{l.status}</td><td>{l.received}</td><td>{l.imported}</td><td>{l.skipped}</td></tr>)}{!logs.length&&<tr><td colSpan={6}>Brak operacji synchronizacji</td></tr>}</tbody></table></div>
  </div>;
}
