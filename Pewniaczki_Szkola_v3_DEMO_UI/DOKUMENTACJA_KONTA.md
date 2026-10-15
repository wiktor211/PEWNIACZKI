# Pewniaczki v2 — konta i panel admina

## Architektura

- React + Vite: ekrany logowania, rejestracji, lista meczów, zapisane wydarzenia, panel admina.
- Express: sesje HTTP-only cookie, walidacja Zod, hashowanie haseł bcryptjs (12 rund), ograniczanie prób.
- MySQL/MariaDB (XAMPP) + Prisma: `users`, `sessions`, `favorites` (własność per-user) i poprzednie tabele sportowe.
- Zewnętrzne API: TheSportsDB (terminarze). Aplikacja NIE pobiera kursów bukmacherskich i nie porównuje zakładów.

## Endpointy

| Metoda | URL | Dostęp | Działanie |
|---|---|---|---|
| POST | `/api/auth/register` | Publiczny | Rejestracja |
| POST | `/api/auth/login` | Publiczny | Logowanie |
| GET | `/api/auth/me` | Użytkownik | Dane konta |
| POST | `/api/auth/logout` | Publiczny | Wylogowanie i usunięcie sesji |
| GET | `/api/events` | Użytkownik | Terminarz i własne zapisane |
| POST | `/api/favorites` | Użytkownik | Zapis wydarzenia |
| PUT | `/api/favorites/:id` | Właściciel | Zmiana notatki |
| DELETE | `/api/favorites/:id` | Właściciel | Usuń zapisane |
| GET | `/api/admin/users` | ADMIN | Lista kont bez haseł |
| PATCH | `/api/admin/users/:id/status` | ADMIN | Blokuj/odblokuj konto |
| GET | `/api/admin/logs` | ADMIN | Logi synchronizacji |
| POST | `/api/sync` | ADMIN | Aktualizacja terminarzy |

### Zabezpieczenia

- Hasła nigdy nie wracają z REST API, w bazie są wyłącznie hashe.
- Serwer przechowuje hash losowego tokena sesji, a przeglądarka otrzymuje tylko cookie HttpOnly i SameSite=Strict.
- Rejestracja przyznaje wyłącznie rolę USER. Administrator może być założony tylko lokalnym skryptem CLI.
- Konto admin ma login `admin`, ale nie ma żadnego hasła domyślnego. Hasło ustawiane jest podczas uruchamiania `przygotuj_baze.bat`.
- Uprawnienia sprawdzane są po stronie serwera, nie w React.
- Dane ulubionych i notatek są izolowane per użytkownik (`userId`).
- Zablokowanie konta kasuje jego sesje.
- Prosty lokalny limiter logowania i rejestracji; dla wdrożenia internetowego potrzebne dodatkowe zabezpieczenia (CSRF, trwałe rate limits, HTTPS, obsługa resetu haseł, audyt).

### Migracje

- `20261014000100_init`: początkowa struktura sportowa.
- `20261014000200_users_sessions`: tabela `users`, `sessions`, powiązanie ulubionych z użytkownikiem.
- Migracja nie usuwa istniejących wydarzeń. Stare ulubione, dla których `userId` jest NULL, przejmuje administrator przy pierwszym tworzeniu konta.

### Testy manualne na zaliczeniu

1. Zarejestruj dwa konta. Zapisz wydarzenie na pierwszym — nie powinno pojawić się w zapisanych na drugim.
2. Zaloguj się jako admin i sprawdź zakładkę `Administrator`.
3. Zablokuj konto użytkownika. Jego istniejące sesje powinny przestać działać.
4. Spróbuj wejść na `/api/admin/users` zwykłym użytkownikiem — HTTP 403.
5. Wyślij za krótkie hasło podczas rejestracji — HTTP 400.
6. Spróbuj edytować ulubiony wpis należący do innego użytkownika — HTTP 404.
7. Wykonaj ponownie `npx prisma migrate deploy` — nie powinno tworzyć zduplikowanych tabel.
