# Gym-Logbuch

Eine installierbare Web-App zum Mitschreiben im Gym: Übungen mit Geräte-Einstellungen (Sitzhöhe, Griff …), Sätze, Wiederholungen und Gewicht, dazu Verlauf und Fortschrittskurve.

Läuft auf Android und iPhone, funktioniert offline und speichert alle Daten nur auf dem jeweiligen Handy.

## Installieren

- **Android (Chrome):** Seite öffnen → Menü ⋮ → „App installieren“.
- **iPhone (Safari):** Seite öffnen → Teilen-Symbol → „Zum Home-Bildschirm“.

## Dateien

- `index.html` – die komplette App
- `report.js` – erstellt den PDF-Fortschrittsbericht (ohne externe Bibliotheken)
- `anatomy.js` – anatomische Körperzeichnung (Mann/Frau, vorne/hinten) für den Abschluss-Screen
- `sw.js` – sorgt dafür, dass die App offline startet
- `manifest.webmanifest` – Name, Farben und Icon für die Installation
- `icons/` – App-Icons

## Neue Version veröffentlichen

1. Änderungen an `index.html` machen.
2. In `sw.js` die `VERSION` hochzählen (z. B. `gym-logbuch-1.1`).
3. Hochladen. Die App zeigt beim nächsten Öffnen „Neue Version verfügbar“.
