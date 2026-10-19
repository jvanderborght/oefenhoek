# Een nieuw onderwerp toevoegen

1. Maak `js/onderwerpen/mijn-onderwerp.js`.
2. Voeg in `index.html` een regel toe, **vóór** `js/kern/app.js`:
   ```html
   <script src="js/onderwerpen/mijn-onderwerp.js"></script>
   ```
3. Klaar. Het verschijnt op het startscherm, gesorteerd volgens de leeftijd die in de instellingen staat.

## Het onderwerp registreren

```js
(function () {
  const O = globalThis.Oefenhoek;
  const { el, rand, kies } = O.hulp;   // handige helpers, zie js/kern/hulp.js

  O.registreer({
    id: 'tafels',                       // uniek, wordt gebruikt om voortgang te bewaren
    titel: 'Tafels van vermenigvuldiging',
    domein: 'Rekenen',                  // label op de kaart
    icoon: '✖️',
    leeftijd: [7, 9],                   // [min, max]: buiten dit bereik (±1 jaar) komt het onder 'andere leeftijden'
    beschrijving: 'Oefen de tafels van 1 tot 10.',
    niveaus: [{ naam: 'Tafel van 2 en 10' }, { naam: 'Tafel van 5' } /* ... */],
    genereer(niveau, opt) { /* geef een opgave terug, zie hieronder */ },
  });
})();
```

`niveaus` bepaalt hoeveel niveaus er zijn. De adaptieve regels (omhoog/omlaag) doet de kern; jouw `genereer` moet enkel per niveau een passende opgave maken. Niveau 1 is het makkelijkst.

## Het contract van een opgave

`genereer(niveau, opt)` geeft een object terug:

| Veld | Verplicht | Betekenis |
|---|---|---|
| `vraag` | ja | HTML-tekst, wordt door de uil uitgesproken |
| `visueel(doos, modus)` | ja | tekent iets in `doos` (een DOM-element). `modus` is `'vraag'` of `'uitleg'`. In `'uitleg'` begin je met een "lege" tekening die de stappen invullen |
| `invoer` | ja | `{type:'getal', voor:'3 dl =', eenheid:'cl'}`, `{type:'tijd'}`, `{type:'duur'}` of `{type:'keuze', opties:[...]}` |
| `controleer(antwoord)` | ja | geeft `{juist:true}` of `{juist:false, opmerking:'gerichte tip'}`. `{ongeldig:true, opmerking}` telt niet als poging |
| `antwoordTekst` | ja | het juiste antwoord als tekst, wordt getoond na twee fouten |
| `stappen` | ja | lijst van `{tekst:'html', toon(doos)}`, de stap-voor-stap uitleg |
| `soort` | ja | tekst die het *type* opgave beschrijft, bv. `'3:15'`. Bij een fout vraagt de kern later `genereer(niveau, {soort})` om hetzelfde type met nieuwe getallen |
| `sleutel` | aanbevolen | identiteit van de opgave, om twee keer dezelfde na elkaar te vermijden |
| `hint` | aanbevolen | tekst achter de 💡-knop en na de eerste fout |
| `verbergHulp` | optioneel | `true`: de tekening staat verborgen achter een knop (hulp die wegvalt) |
| `juistAntwoord` | optioneel | voor tests |

Antwoordvorm per invoertype: `getal` → tekst zoals getypt, `tijd` en `duur` → `{u, m}`, `keuze` → de gekozen optie.

### De stappen-animatie

`toon(doos)` wordt in volgorde uitgevoerd, en mag **cumulatief** werken: stap 3 komt altijd nadat stap 1 en 2 al zijn toegepast. Laat de animatie over aan CSS-transities: zet gewoon een klasse (`classList.add('aan')`). Gaat het kind terug naar een eerdere stap, dan bouwt de speler `visueel(doos,'uitleg')` opnieuw op, past de vorige stappen toe zonder animatie (klasse `snel` schakelt transities uit) en speelt dan pas de huidige stap af. Dat werkt dus vanzelf zolang je `toon` idempotent houdt.

## Goede gewoonten

- Zet de logica die niet van de DOM afhangt (genereren, controleren) los van het tekenen, zodat `tests/test.js` ze kan testen. Laad het bestand bovenaan de test en schrijf een test per niveau: het `juistAntwoord` moet door `controleer` als juist beoordeeld worden.
- Geef bij `controleer` een **gerichte opmerking** voor de fouten die kinderen echt maken (bv. richting omgekeerd, wijzers omgewisseld) in plaats van een algemene "fout".
- Laat de hulp wegvallen met het niveau (zoals de minuutgetallen op de klok).
- Test in de browser elke stap van de uitleg, niet enkel de vraag.
