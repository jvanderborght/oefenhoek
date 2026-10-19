# Oefenhoek 🦉

Een interactieve oefen-app voor kinderen, in het Nederlands. Gemaakt voor een meisje van 9, maar zo gebouwd dat er makkelijk onderwerpen en leeftijden bij kunnen.

Geen installatie, geen server, geen account: het is gewoon een webpagina. Dubbelklik op `index.html` en het werkt (ook offline).

## Wat zit er in?

| Onderwerp | Leeftijd | Niveaus |
|---|---|---|
| **Kloklezen** | 7–10 | 1 hele uren · 2 halve uren en kwartieren · 3 op 5 minuten · 4 op 5 minuten zonder minuutgetallen · 5 24-uursklok · 6 tijdsduur tussen twee klokken (hele/halve uren) · 7 tijdsduur op 5 minuten · 8 tijdsduur over het hele uur heen |
| **Inhoud omzetten** (l-dl-cl-ml) | 8–11 | 1 één stap (l → dl) · 2 één stap naar rechts · 3 ook terug · 4 twee stappen · 5 grote sprongen · 6 alle sprongen heen en terug · 7 met komma's |
| **Lengte omzetten** (m-dm-cm-mm) | 8–11 | zelfde zeven niveaus |

De eenheden worden uitgelegd met de **omzettingstabel** (kl hl dal l dl cl ml / km hm dam m dm cm mm), zoals ze die op school gebruiken.

## Hoe leert het kind hier?

- **Een ronde = 10 opgaven.** Daarna sterren (op basis van het aantal meteen juiste antwoorden) en een samenvatting.
- **Adaptieve moeilijkheid, per onderwerp.**
  3 keer na elkaar meteen juist → een niveau hoger. 2 fouten in de laatste 3 → een niveau lager.
  Juist na een hint of tweede poging breekt de reeks, maar telt niet als fout. De regels staan in [`js/kern/adaptief.js`](js/kern/adaptief.js) en zijn getest.
- **Feedback in drie stappen** in plaats van meteen het antwoord te tonen:
  1. Fout → vriendelijke melding met een **gerichte opmerking** (bv. "je hebt de wijzers omgewisseld", "let op de richting") en een hint. Tweede kans.
  2. Opnieuw fout → **stap-voor-stap animatie** van de oplossing (met vorige/volgende/nog eens), automatisch afgespeeld.
  3. Het opgavetype dat mislukte **komt 3 opgaven later terug met nieuwe getallen** (herhaling).
- **Hulp valt weg naarmate het beter gaat**: de minuutgetallen rond de klok verdwijnen op niveau 4, de omzettingstabel is vanaf niveau 5 verborgen achter een knop.
- Voortgang (niveau, sterren) wordt per onderwerp bewaard in de browser (`localStorage`).

## Lokaal draaien

Dubbelklik `index.html`, of start een kleine server:

```bash
python -m http.server 8000
```

en open <http://localhost:8000>.

## Tests

De logica (opgavegeneratie, antwoordcontrole, adaptieve regels) heeft tests zonder browser:

```bash
node tests/test.js
```

## Een nieuw onderwerp toevoegen

Een onderwerp is één bestand in `js/onderwerpen/` plus één `<script>`-regel in `index.html`. Het onderwerp levert enkel opgaven; het oefenscherm (invoer, feedback, hints, uitleg-speler, niveaus, sterren) komt gratis mee. Zie [`docs/NIEUW-ONDERWERP.md`](docs/NIEUW-ONDERWERP.md).

Een bijkomend stelsel eenheden (bv. gewicht) is nog eenvoudiger: één `stelsel({...})`-blok onderaan [`js/onderwerpen/eenheden.js`](js/onderwerpen/eenheden.js).

## Mapstructuur

```
index.html              pagina, laadt alle scripts
css/stijl.css           alle opmaak en animaties
js/kern/                onderwerp-onafhankelijk
  hulp.js                 register, DOM-helpers, getallen met komma
  opslag.js               voortgang bewaren
  adaptief.js             moeilijkheid omhoog/omlaag
  effecten.js             geluidjes en confetti
  oefenscherm.js          de ronde, invoer, feedback, uitleg-speler
  app.js                  startscherm en instellingen
js/onderwerpen/         één bestand per onderwerp
docs/                   uitleg voor wie verder bouwt
tests/test.js           logica-tests
```

## Ideeën voor later

- Digitaal → analoog: de wijzers zelf verslepen op de klok.
- Samengestelde eenheden ("3 l 2 dl = … dl"), gewicht (kg-hg-dag-g), tafels, breuken, geld.
- Voortgang delen tussen toestellen (export/import als bestand).
- Meerdere kinderen (profielen).
