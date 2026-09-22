# Die Seite hochladen

Vorausgesetzt ist ein Tarif, der **Node.js-Anwendungen** ausführen kann. Frag
beim Hoster nach: *„Kann ich auf diesem Tarif eine Node.js-Anwendung
betreiben?"* Lautet die Antwort nein, sag Bescheid — dann muss das
Kontaktformular auf PHP umgebaut werden.

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

## 3. Paket bauen

```bash
bash scripts/package.sh
```

Ergebnis: `dist/` (etwa 33 MB) und `dist.zip` (etwa 15 MB). Darin steckt alles,
was der Server braucht — auch die Abhängigkeiten. Auf dem Server muss kein
`npm install` laufen.

## 4. Hochladen und starten

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

Schritt 3 und 4 wiederholen. Die Umgebungsvariablen bleiben erhalten.
