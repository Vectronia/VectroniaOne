# Die Seite hochladen

Der Tarif führt Node.js-Anwendungen aus und nennt Next.js ausdrücklich als
unterstütztes Framework. Es gibt deshalb **zwei Wege**, und beide sind geprüft:

- **A — der Hoster baut selbst** aus dem Quellcode. Weniger Arbeit, empfohlen.
- **B — du lädst ein fertiges Paket hoch.** Nötig, falls Weg A nicht angeboten
  wird oder scheitert.

> **Node-Version: 22.x wählen.** Next.js verlangt mindestens 20.9 — die
> ebenfalls angebotene 18.x funktioniert **nicht**. Geprüft ist 22.
> Paketmanager: npm.

## Weg A — der Hoster baut

Repository verbinden (oder den Quellcode hochladen) und diese Befehle angeben:

| | |
|---|---|
| Installieren | `npm ci` |
| Bauen | `npm run build` |
| Starten | `npm start` |

Mehr ist nicht nötig. Geprüft in einem frischen Baum ohne `node_modules`:
Installation ohne Schwachstellen, Build ohne Warnungen, Start bedient
Startseite, Impressum, Datenschutz und das Kontaktformular.

Danach direkt weiter bei Schritt 5.

## Weg B — fertiges Paket

Die Schritte 3 und 4 unten.

## 1. Postfach anlegen

`kunst@vectronia-one.de` beim Hoster einrichten. Das dabei vergebene Passwort
ist zugleich das SMTP-Passwort; ein separates gibt es nicht.

## 2. Zugangsdaten prüfen — vor dem Hochladen

```bash
cp .env.example .env.local     # dann die vier Werte eintragen
node scripts/test-smtp.mjs --senden
```

Das Skript meldet im Klartext, was klemmt. `.env.local` bleibt auf deinem
Rechner und wird nie mit hochgeladen.

## 3. Paket bauen (nur Weg B)

```bash
bash scripts/package.sh
```

Ergebnis: `dist/` (etwa 33 MB) und `dist.zip` (etwa 15 MB). Darin steckt alles,
was der Server braucht — auch die Abhängigkeiten. Auf dem Server muss kein
`npm install` laufen.

## 4. Hochladen und starten (nur Weg B)

`dist.zip` in das Anwendungsverzeichnis entpacken. Der Startbefehl ist:

```
node server.js
```

Manche Oberflächen fragen stattdessen nach einer **Startdatei** — dann
`server.js` angeben.

Der Server nimmt den Port aus der Umgebungsvariablen `PORT`, die der Hoster
setzt. Daran muss nichts geändert werden.

## 5. Die vier Werte eintragen

In die **Umgebungsvariablen der Anwendung** (nicht ins DNS, nicht in eine
Datei im Paket):

| Name | Wert |
|---|---|
| `SMTP_HOST` | `smtp.hostinger.com` — bei Titan-Postfächern `smtp.titan.email` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | `kunst@vectronia-one.de` |
| `SMTP_PASSWORD` | das Passwort des Postfachs |

`CONTACT_TO` nur setzen, wenn Anfragen woanders landen sollen als im
Absenderpostfach.

## 6. Prüfen

- Seite aufrufen, bis nach unten scrollen
- `/impressum` und `/datenschutz` öffnen
- eine Testanfrage über das Formular schicken und im Postfach nachsehen

Kommt nichts an, steht der Grund im Protokoll der Anwendung. Das Formular
selbst sagt Besuchern absichtlich nichts über die Ursache.

## Bei Änderungen

**Weg A:** pushen, der Hoster baut neu.
**Weg B:** Schritt 3 und 4 wiederholen.

Die Umgebungsvariablen bleiben in beiden Fällen erhalten.
