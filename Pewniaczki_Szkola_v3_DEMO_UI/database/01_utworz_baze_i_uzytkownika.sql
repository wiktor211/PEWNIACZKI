-- W phpMyAdmin (konto administratora), podmien haslo przed wykonaniem.
-- Jesli konto juz istnieje, CREATE USER IF NOT EXISTS nie zmieni hasla.
CREATE DATABASE IF NOT EXISTS pewniaczki CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'pewniaczki_app'@'localhost' IDENTIFIED BY 'TWOJE_HASLO';
GRANT ALL PRIVILEGES ON pewniaczki.* TO 'pewniaczki_app'@'localhost';
-- Dla polaczenia TCP przez 127.0.0.1 (uzywanego w .env):
CREATE USER IF NOT EXISTS 'pewniaczki_app'@'127.0.0.1' IDENTIFIED BY 'TWOJE_HASLO';
GRANT ALL PRIVILEGES ON pewniaczki.* TO 'pewniaczki_app'@'127.0.0.1';
-- Przyklad zmiany hasla istniejacego konta:
-- ALTER USER 'pewniaczki_app'@'localhost' IDENTIFIED BY 'NOWE_HASLO';
