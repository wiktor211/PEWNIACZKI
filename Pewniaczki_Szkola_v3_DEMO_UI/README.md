# PEWNIACZKI 3.0 — projekt szkolny (widok demonstracyjny)

Aplikacja React + Express + Prisma + MySQL/MariaDB (XAMPP) oparta na wersji 2.0. Po zalogowaniu interfejs ma układ nawiązujący do dostarczonej grafiki: boczny pasek, górne menu, filtry dyscyplin, tabela pięciu źródeł, panel wydarzenia i wykres. Zawiera także rejestrację, logowanie, oddzielne zapisane wydarzenia oraz panel administratora.

**WAŻNE: TABELA Z LICZBAMI TO FIKCYJNE DANE DEMONSTRACYJNE.** Nie są to aktualne, historyczne ani rzeczywiste kursy bukmacherskie. Nie ma integracji z The Odds API, linków do bukmacherów ani możliwości zawierania zakładów. Dla celów dydaktycznych endpoint `GET /api/demo-rates?eventId=1` zwraca wymyślone dane przypisane do wybranego identyfikatora wydarzenia. Prawdziwe terminarze sportowe można synchronizować z TheSportsDB (moduł z wersji 2).

## Zawartość

- `backend/` — REST API, konta użytkowników w MySQL, sesje, Prisma, logika walidacji i endpoint fikcyjnych próbek.
- `frontend/` — interfejs React/Vite, dopasowany do referencji, formularze logowania i rejestracji, panel admina.
- `database/` — początkowa konfiguracja SQL.
- `instalacja.bat` — instaluje zależności i tworzy `.env` z szablonu (bez hasła).
- `przygotuj_baze.bat` — wdraża migracje, tworzy dane testowe, umożliwia utworzenie konta administratora.
- `uruchom.bat` — otwiera backend i frontend w dwóch terminalach.
- `REFERENCJA_INTERFEJSU.png` — referencyjna grafika projektu (nie jest używana jako tło aplikacji).

## Instalacja na Windows — nowe środowisko / komputer szkolny

1. Zainstaluj Node.js LTS i XAMPP. Uruchom w XAMPP MySQL i Apache.
2. Jeśli nie masz jeszcze bazy i użytkownika, wykonaj z konta administracyjnego w phpMyAdmin `database/01_utworz_baze_i_uzytkownika.sql`, **po podmianie przykładowego hasła**. Nie ujawniaj hasła w repozytorium.
3. Otwórz ten folder w Visual Studio Code.
4. W Eksploratorze Windows uruchom `instalacja.bat` (w CMD, nie przez PowerShell).
5. W `backend/.env` wpisz swoje lokalne hasło `pewniaczki_app` w `DATABASE_URL`. Jeżeli hasło zawiera znaki takie jak `@`, `#`, `%` lub `:`, zakoduj je w adresie URL.
6. Uruchom `przygotuj_baze.bat`. Ustaw mocne hasło administratora, jeżeli konto `admin` jeszcze nie istnieje.
7. Uruchom `uruchom.bat` i otwórz `http://localhost:5173`.

## Aktualizacja ze starej wersji 2.0 (w której baza już działa)

- **Nie usuwaj bazy `pewniaczki` i nie kasuj istniejących kont.** Rozpakuj v3 do nowego folderu, uruchom `instalacja.bat`.
- Z pliku `.env` starego folderu przenieś **tylko swoje lokalne ustawienia** do nowego `backend/.env` (nie przesyłaj ich przez internet).
- Wykonaj `przygotuj_baze.bat`; użyte migracje są te same logicznie, ale skrypt drugiej migracji ma poprawioną kolejność operacji na indeksach dla nowych instalacji. Jeżeli druga migracja już była oznaczona jako zakończona, nie wykonuj jej ręcznie od nowa.
- W razie komunikatu o historii migracji, nie używaj `migrate reset` — wykonaj kopię zapasową i sprawdź `npx prisma migrate status` w folderze `backend`.
- Uruchom `uruchom.bat`. Dane kont pozostają w MySQL.

## Funkcjonalności

- Rejestracja i logowanie, hasła hashowane w bazie, bezpieczne sesje.
- Podział na zwykłych użytkowników i administratora.
- Admin: zarządzanie aktywnością kont oraz historia synchronizacji.
- Wydarzenia z MySQL, synchronizacja terminarza z TheSportsDB.
- Filtrowanie po dyscyplinie, lidze, dacie oraz wyszukiwanie.
- Przechowywanie indywidualnych zapisanych wydarzeń i notatek.
- Demonstracyjna tabela fikcyjnych wartości (pięć neutralnych źródeł) i wykres poglądowy.
- Zachowanie układu na telefonie i mniejszych ekranach, przewijanie szerokiej tabeli.

## Testy

W katalogu `backend` uruchom `npm test` oraz `npm run typecheck` po instalacji. W katalogu `frontend` uruchom `npm run build`. Używaj również `npx prisma migrate status` oraz sprawdź `GET /api/health` po uruchomieniu.

## Uwaga o instalacji

Paczka nie zawiera `node_modules` ani sekretów `.env`. Skrypty Windows są zapisane z zakończeniami linii CRLF. Do instalacji bibliotek potrzebne jest połączenie internetowe. Pomyślnie sprawdzono składnię plików; pełny test integracyjny wymaga Node.js, pobranych zależności oraz działającego MySQL.
