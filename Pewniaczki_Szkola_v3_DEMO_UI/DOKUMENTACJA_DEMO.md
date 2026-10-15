# API demonstracyjnych wartości — Pewniaczki v3

Przykładowy endpoint REST:

`GET http://localhost:4000/api/demo-rates?eventId=1`

Wymaga sesji (zalogowanego użytkownika). Zwraca jednolitą odpowiedź `{ ok: true, data: ... }`:

```json
{
  "ok": true,
  "data": {
    "source": "SYNTHETIC_DEMO",
    "disclaimer": "Fikcyjne wartości szkolne. Nie są to rzeczywiste ani archiwalne kursy.",
    "eventId": 1,
    "providers": [{ "id": "a", "label": "DEMO A", "color": "blue" }],
    "rows": [{ "providerId": "a", "values": [2.03, 3.43, 3.25] }]
  }
}
```

Liczby w przykładzie JSON są ilustracyjne; faktyczne wartości oblicza deterministyczna funkcja `demoValuesForEvent`.

- Brak połączenia z serwisami bukmacherskimi.
- Brak prawdziwych kursów, ofert lub linków do zakładów.
- Dane używane do oceny wyglądu interfejsu, obsługi parametrów i jednolitego formatu odpowiedzi API.
- Błędy parametrów, np. `eventId=abc`, skutkują walidacją HTTP 400 przez Zod.
- Ekran React używa endpointu, a w razie niedostępności API przechodzi na identyczne wartości lokalnego trybu pokazowego.
