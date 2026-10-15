# Pewniaczki — dokumentacja REST API

Adres bazowy: `http://localhost:4000/api`

Format sukcesu: `{ "ok": true, "data": ... }`
Format błędu: `{ "ok": false, "error": { "code": "VALIDATION", "message": "..." } }`

| Metoda | Ścieżka | Opis | Kod sukcesu |
|---|---|---|---|
| GET | `/health` | Sprawdzenie połączenia z bazą | 200 |
| GET | `/sports` | Dyscypliny wraz z liczbą wydarzeń | 200 |
| GET | `/leagues` | Ligi, z czasem ostatniej synchronizacji | 200 |
| GET | `/events?search=Arsenal&limit=20` | Szukanie i stronicowanie wydarzeń; `sportId`, `leagueId`, `page`, `onlyUpcoming=1` | 200 |
| GET | `/events/1` | Szczegóły wydarzenia | 200 |
| GET | `/favorites` | Lista obserwowanych wydarzeń | 200 |
| POST | `/favorites` | Dodanie obserwowanego wydarzenia | 201 |
| PUT | `/favorites/1` | Zmiana notatki | 200 |
| DELETE | `/favorites/1` | Usunięcie obserwowanego | 204 |
| POST | `/sync` | Synchronizacja terminarza wybranej ligi; TTL | 200 |
| GET | `/sync/logs` | Ostatnie 15 logów synchronizacji | 200 |

## Przykładowe zapytania do wykonania w Postmanie

POST `http://localhost:4000/api/favorites`
```json
{ "eventId": 1, "note": "Chcę obejrzeć ten mecz" }
```

PUT `http://localhost:4000/api/favorites/1`
```json
{ "note": "Mecz o 20:00" }
```

POST `http://localhost:4000/api/sync`
```json
{ "leagueId": 1 }
```

Przykład zapytania GET:
`http://localhost:4000/api/events?search=Barcelona&onlyUpcoming=1&limit=10&page=1`

## Kody błędów

- `400` — błędne parametry lub treść (Zod)
- `404` — nie znaleziono zasobu
- `409` — istniejący duplikat (np. drugie zapisanie tego samego wydarzenia)
- `429` — limit zewnętrznego serwisu
- `500` — błąd wewnętrzny aplikacji
- `502` — błędna odpowiedź zewnętrznego serwisu
- `503` — timeout albo niedostępność zewnętrznego serwisu

## Cache i integralność

- Ponowne wywołanie synchronizacji w ciągu `SYNC_TTL_MINUTES` minut nie pobiera kolejny raz danych.
- Współbieżne synchronizacje jednej ligi w procesie Node.js są scalane do jednego żądania.
- Rekordy wydarzeń są aktualizowane przez `upsert`; zduplikowane rekordy API są odrzucane.
- Niepoprawne rekordy są pomijane, bez usuwania poprawnych danych z bazy.
- Operacje zapisujące drużyny i wydarzenia wykonywane są w transakcji dla danego meczu.
- Historyczne dane nie są kasowane automatycznie.


## v3 — fikcyjne dane demonstracyjne

`GET /api/demo-rates?eventId=<id>` — tylko dla zalogowanych. Zwraca pięć neutralnych, syntetycznych zestawów liczb; dane **nie są** rzeczywistymi ani archiwalnymi kursami bukmacherskimi. Walidacja Zod: 400 dla błędnego identyfikatora, 404 dla nieistniejącego wydarzenia. Zobacz `DOKUMENTACJA_DEMO.md`.
