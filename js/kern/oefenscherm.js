/* Het oefenscherm: een ronde van 10 opgaven met hint, tweede kans, stap-voor-stap uitleg,
 * herhaling van gemiste opgavetypes en adaptieve moeilijkheid.
 * Onderwerpen weten niets van dit scherm; ze leveren enkel opgaven (zie docs/NIEUW-ONDERWERP.md). */
(function () {
  const O = globalThis.Oefenhoek;
  const { el, rand, kies } = O.hulp;
  const RONDE = 10;
  const HERHAAL_NA = 3; // een gemist opgavetype komt na zoveel opgaven terug (met nieuwe getallen)

  const LOF = ['Super!', 'Goed gedaan!', 'Juist!', 'Top!', 'Prachtig!', 'Zo mag het!'];
  const BIJNA = ['Bijna!', 'Net niet.', 'Nog niet helemaal.'];

  /* ---------- invoervelden ---------- */
  function cijferveld(klasse, max, enter) {
    return el('input', {
      klasse: `veld ${klasse}`,
      type: 'text',
      inputmode: 'numeric',
      autocomplete: 'off',
      maxlength: max,
      oninput: (e) => (e.target.value = e.target.value.replace(/\D/g, '')),
      onkeydown: (e) => e.key === 'Enter' && (e.preventDefault(), enter()),
    });
  }

  function bouwInvoer(spec, enter) {
    let doos, lees, focus, velden;
    if (spec.type === 'tijd') {
      const u = cijferveld('uur', 2, enter);
      const m = cijferveld('min', 2, enter);
      velden = [u, m];
      doos = el('div', { klasse: 'invoer-tijd' }, u, el('span', { klasse: 'dubbelepunt' }, ':'), m);
      lees = () => (u.value === '' || m.value === '' ? null : { u: +u.value, m: +m.value });
      focus = () => u.focus();
    } else if (spec.type === 'duur') {
      const u = cijferveld('uur', 2, enter);
      const m = cijferveld('min', 3, enter);
      velden = [u, m];
      doos = el('div', { klasse: 'invoer-duur' }, u, el('span', {}, 'uur'), m, el('span', {}, 'min'));
      lees = () => (u.value === '' && m.value === '' ? null : { u: +u.value || 0, m: +m.value || 0 });
      focus = () => u.focus();
    } else if (spec.type === 'getal') {
      const v = el('input', {
        klasse: 'veld getal',
        type: 'text',
        inputmode: 'decimal',
        autocomplete: 'off',
        maxlength: 12,
        onkeydown: (e) => e.key === 'Enter' && (e.preventDefault(), enter()),
      });
      velden = [v];
      doos = el('div', { klasse: 'invoer-getal' }, spec.voor && el('span', { klasse: 'som' }, spec.voor), v,
        spec.eenheid && el('span', { klasse: 'eenheid' }, spec.eenheid));
      lees = () => (v.value.trim() === '' ? null : v.value.trim());
      focus = () => v.focus();
    } else if (spec.type === 'keuze') {
      let gekozen = null;
      const knoppen = spec.opties.map((o) =>
        el('button', {
          klasse: 'keuze',
          type: 'button',
          onclick: () => {
            gekozen = o;
            knoppen.forEach((k) => k.classList.toggle('gekozen', k === knop(o)));
            enter();
          },
        }, String(o)));
      const knop = (o) => knoppen[spec.opties.indexOf(o)];
      velden = knoppen;
      doos = el('div', { klasse: 'invoer-keuze' }, knoppen);
      lees = () => gekozen;
      focus = () => {};
    } else {
      throw new Error(`Onbekend invoertype '${spec.type}'`);
    }
    return {
      el: doos,
      lees,
      focus,
      uit: () => velden.forEach((v) => (v.disabled = true)),
      schud() {
        doos.classList.remove('schud');
        void doos.offsetWidth;
        doos.classList.add('schud');
      },
      wis() {
        velden.forEach((v) => 'value' in v && (v.value = ''));
        focus();
      },
    };
  }

  /* ---------- stap-voor-stap speler ---------- */
  function bouwSpeler(opgave, doos) {
    const stappen = opgave.stappen;
    const tekst = el('div', { klasse: 'stap-tekst', 'aria-live': 'polite' });
    let k = -1;
    let timer = null;
    const knop = (label, titel, fn) => el('button', { klasse: 'knop klein ghost', type: 'button', title: titel, onclick: fn }, label);
    const terug = knop('◀', 'Vorige stap', () => { stop(); ga(k - 1); });
    const verder = knop('▶', 'Volgende stap', () => { stop(); ga(k + 1); });
    const opnieuw = knop('↻ Nog eens', 'Opnieuw bekijken', () => { ga(0); speelAf(); });

    function ga(naar) {
      naar = Math.max(0, Math.min(stappen.length - 1, naar));
      if (k >= 0 && naar === k + 1) {
        stappen[naar].toon(doos);
      } else {
        doos.replaceChildren();
        opgave.visueel(doos, 'uitleg');
        doos.classList.add('snel');
        for (let i = 0; i < naar; i++) stappen[i].toon(doos);
        void doos.offsetWidth;
        doos.classList.remove('snel');
        stappen[naar].toon(doos);
      }
      k = naar;
      tekst.innerHTML = `<span class="stapnr">Stap ${k + 1} van ${stappen.length}</span> ${stappen[k].tekst}`;
      terug.disabled = k === 0;
      verder.disabled = k === stappen.length - 1;
    }
    function stop() {
      clearInterval(timer);
      timer = null;
    }
    function speelAf() {
      stop();
      timer = setInterval(() => (k >= stappen.length - 1 ? stop() : ga(k + 1)), 3600);
    }
    ga(0);
    speelAf();
    const root = el('div', { klasse: 'speler' }, tekst, el('div', { klasse: 'speler-knoppen' }, terug, verder, opnieuw));
    root.stop = stop;
    return root;
  }

  /* ---------- het scherm zelf ---------- */
  O.oefenscherm = function (root, onderwerp, naarMenu) {
    const opslag = O.opslag.onderwerp(onderwerp.id);
    const maxNiveau = onderwerp.niveaus.length;
    const adapt = O.adaptief.nieuw(Math.min(opslag.niveau, maxNiveau));
    const s = { nr: 0, herhaal: [], eerstJuist: 0, uitkomsten: [], opgave: null, vorige: null, poging: 0, hint: false, speler: null, fase: 'vraag', startNiveau: adapt.niveau };

    const niveauTekst = el('span', { klasse: 'niveau-tekst' });
    const niveauBalk = el('div', { klasse: 'niveau-balk' });
    const bolletjes = Array.from({ length: RONDE }, () => el('span', { klasse: 'bol' }));
    const bubbel = el('div', { klasse: 'bubbel' });
    const visueel = el('div', { klasse: 'visueel' });
    const toonHulp = el('button', { klasse: 'knop klein ghost', type: 'button', onclick: () => visueel.classList.toggle('verborgen') }, '👀 Toon / verberg hulp');
    const invoerPlek = el('div', { klasse: 'invoer-plek' });
    const controleKnop = el('button', { klasse: 'knop groen', type: 'button', onclick: controleer }, 'Controleer');
    const hintKnop = el('button', { klasse: 'knop ghost', type: 'button', onclick: toonHint }, '💡 Hint');
    const feedback = el('div', { klasse: 'feedback verborgen', 'aria-live': 'polite' });
    const geluidKnop = el('button', { klasse: 'icoonknop', type: 'button', title: 'Geluid aan/uit', onclick: () => {
      const p = O.opslag.profiel();
      p.geluid = !p.geluid;
      O.opslag.bewaar();
      geluidKnop.textContent = p.geluid ? '🔊' : '🔇';
    } }, O.opslag.profiel().geluid ? '🔊' : '🔇');

    const kaart = el('div', { klasse: 'kaart oefenkaart' },
      el('div', { klasse: 'praat' }, el('div', { klasse: 'uil', 'aria-hidden': 'true' }, '🦉'), bubbel),
      visueel, el('div', { klasse: 'hulpknop-rij' }, toonHulp), invoerPlek,
      el('div', { klasse: 'knoppen' }, hintKnop, controleKnop), feedback);

    root.replaceChildren(
      el('header', { klasse: 'kop' },
        el('button', { klasse: 'knop klein ghost', type: 'button', onclick: stopEnTerug }, '← Menu'),
        el('div', { klasse: 'kop-titel' }, `${onderwerp.icoon} ${onderwerp.titel}`),
        geluidKnop),
      el('div', { klasse: 'niveau' }, niveauTekst, niveauBalk),
      el('div', { klasse: 'ronde', 'aria-label': 'Voortgang van de ronde' }, bolletjes),
      kaart);

    let invoer = null;
    const toets = (e) => {
      if (e.key === 'Enter' && s.fase === 'feedback') {
        const b = feedback.querySelector('[data-volgende]');
        if (b && document.activeElement === document.body) b.click();
      }
    };
    document.addEventListener('keydown', toets);
    function stopEnTerug() {
      document.removeEventListener('keydown', toets);
      s.speler && s.speler.stop();
      naarMenu();
    }

    function updateNiveau(animatie) {
      niveauTekst.textContent = `Niveau ${adapt.niveau} van ${maxNiveau}: ${onderwerp.niveaus[adapt.niveau - 1].naam}`;
      niveauBalk.replaceChildren(...onderwerp.niveaus.map((_, i) => el('span', { klasse: `blok${i < adapt.niveau ? ' vol' : ''}` })));
      if (animatie) {
        niveauBalk.classList.remove('puls');
        void niveauBalk.offsetWidth;
        niveauBalk.classList.add('puls');
      }
    }

    function genereer() {
      let soort;
      const i = s.herhaal.findIndex((h) => s.nr >= h.na);
      if (i >= 0) soort = s.herhaal.splice(i, 1)[0].soort;
      let o;
      for (let poging = 0; poging < 6; poging++) {
        o = onderwerp.genereer(adapt.niveau, { soort });
        if (!s.vorige || o.sleutel !== s.vorige) break;
      }
      s.vorige = o.sleutel;
      return o;
    }

    function volgende() {
      if (s.nr >= RONDE) return eind();
      if (s.speler) {
        s.speler.stop();
        s.speler.remove();
        s.speler = null;
      }
      s.opgave = genereer();
      s.poging = 0;
      s.hint = false;
      s.fase = 'vraag';
      const o = s.opgave;
      bubbel.innerHTML = o.vraag;
      visueel.replaceChildren();
      visueel.classList.remove('verborgen');
      o.visueel(visueel, 'vraag');
      if (o.verbergHulp) visueel.classList.add('verborgen');
      toonHulp.parentElement.classList.toggle('verborgen', !o.verbergHulp);
      invoer = bouwInvoer(o.invoer, controleer);
      invoerPlek.replaceChildren(invoer.el);
      feedback.className = 'feedback verborgen';
      feedback.replaceChildren();
      controleKnop.classList.remove('verborgen');
      hintKnop.classList.toggle('verborgen', !o.hint);
      hintKnop.disabled = false;
      kaart.classList.remove('juist-kaart', 'fout-kaart');
      bolletjes.forEach((b, j) => b.classList.toggle('nu', j === s.nr));
      updateNiveau(false);
      invoer.focus();
    }

    function toonHint() {
      s.hint = true;
      hintKnop.disabled = true;
      meld('hint', '💡 Tip', s.opgave.hint);
    }

    function meld(soort, titel, tekst, ...extra) {
      feedback.className = `feedback ${soort}`;
      feedback.replaceChildren(
        el('div', { klasse: 'feedback-titel' }, titel),
        tekst && el('div', { klasse: 'feedback-tekst', html: tekst }),
        ...extra);
    }

    function controleer() {
      if (s.fase !== 'vraag') return;
      const antwoord = invoer.lees();
      if (antwoord === null) return invoer.schud();
      const res = s.opgave.controleer(antwoord);
      if (res.ongeldig) {
        invoer.schud();
        return meld('hint', 'Let op', res.opmerking);
      }
      s.poging++;
      if (res.juist) {
        const uitkomst = s.poging === 1 && !s.hint ? 'juist' : 'hulp';
        return afronden(uitkomst, true);
      }
      O.effecten.speel('fout');
      invoer.schud();
      if (s.poging === 1) {
        const hint = s.opgave.hint && !s.hint ? `<br>💡 ${s.opgave.hint}` : '';
        meld('fout', kies(BIJNA) + ' Probeer nog eens.', (res.opmerking || 'Kijk nog eens goed.') + hint);
        invoer.wis();
      } else {
        afronden('fout', false);
      }
    }

    function afronden(uitkomst, juist) {
      s.fase = 'feedback';
      invoer.uit();
      controleKnop.classList.add('verborgen');
      hintKnop.classList.add('verborgen');
      bolletjes[s.nr].classList.remove('nu');
      bolletjes[s.nr].classList.add(uitkomst);
      s.uitkomsten.push(uitkomst);
      if (uitkomst === 'juist') s.eerstJuist++;
      opslag.totaal++;
      if (juist) opslag.juist++;
      if (uitkomst === 'fout') s.herhaal.push({ soort: s.opgave.soort, na: s.nr + 1 + HERHAAL_NA });
      s.nr++;

      const wissel = O.adaptief.verwerk(adapt, uitkomst, maxNiveau);
      opslag.niveau = adapt.niveau;
      opslag.beste = Math.max(opslag.beste, adapt.niveau);
      O.opslag.bewaar();

      const laatste = s.nr >= RONDE;
      const door = el('button', { klasse: 'knop groen groot', type: 'button', 'data-volgende': '1', onclick: volgende }, laatste ? 'Klaar! Bekijk je resultaat →' : 'Volgende →');
      let extra = [];
      if (wissel) extra.push(niveauBericht(wissel));

      if (juist) {
        kaart.classList.add('juist-kaart');
        O.effecten.speel(wissel === 'omhoog' ? 'niveau' : 'juist');
        O.effecten.confetti(wissel === 'omhoog' ? 160 : uitkomst === 'juist' ? 40 : 0);
        const titel = uitkomst === 'juist' ? `🎉 ${kies(LOF)}` : '✅ Juist! Die tweede poging was goed.';
        meld('juist', titel, uitkomst === 'hulp' ? 'Je hebt het zelf gevonden, dat is knap.' : '', ...extra, door);
      } else {
        kaart.classList.add('fout-kaart');
        visueel.classList.remove('verborgen');
        const speler = bouwSpeler(s.opgave, visueel);
        s.speler = speler;
        meld('uitleg', 'Geen probleem, we bekijken het samen',
          `Het juiste antwoord is: <b>${s.opgave.antwoordTekst}</b>. Hetzelfde soort oefening komt straks nog eens terug.`,
          ...extra, door);
        kaart.insertBefore(speler, visueel); // uitleg en tekening naast elkaar in beeld houden
        speler.scrollIntoView({ block: 'start', behavior: 'smooth' });
        return updateNiveau(wissel === 'omlaag' || wissel === 'omhoog');
      }
      if (wissel === 'omlaag' || wissel === 'omhoog') updateNiveau(true);
      door.focus({ preventScroll: false });
    }

    function niveauBericht(wissel) {
      const n = onderwerp.niveaus[adapt.niveau - 1].naam;
      const tekst = {
        omhoog: `🚀 <b>Niveau omhoog!</b> Je zit nu op niveau ${adapt.niveau}: ${n}`,
        omlaag: `🌱 We oefenen eerst iets makkelijker (niveau ${adapt.niveau}: ${n}). Zo word je zeker.`,
        top: '🏆 Je zit op het hoogste niveau en bent er nog steeds goed in!',
      }[wissel];
      return el('div', { klasse: `niveau-bericht ${wissel}`, html: tekst });
    }

    function eind() {
      document.removeEventListener('keydown', toets);
      const sterren = s.eerstJuist >= 9 ? 3 : s.eerstJuist >= 7 ? 2 : s.eerstJuist >= 4 ? 1 : 0;
      opslag.rondes++;
      opslag.sterren = Math.max(opslag.sterren, sterren);
      O.opslag.bewaar();
      if (sterren >= 2) O.effecten.confetti(200);
      const boodschap = ['Oefening baart kunst! Probeer het zo meteen nog eens.', 'Goed bezig, je bent op weg!', 'Heel mooi gedaan!', 'Fantastisch! Een echte kampioen!'][sterren];
      const niveauZin = adapt.niveau > s.startNiveau ? `Je bent gestegen naar niveau ${adapt.niveau}. 🚀`
        : adapt.niveau < s.startNiveau ? `We gaan volgende keer rustig verder op niveau ${adapt.niveau}.`
        : `Je zit op niveau ${adapt.niveau}.`;
      root.replaceChildren(
        el('div', { klasse: 'kaart eind' },
          el('div', { klasse: 'uil groot', 'aria-hidden': 'true' }, '🦉'),
          el('h2', {}, 'Ronde klaar!'),
          el('div', { klasse: 'sterren', 'aria-label': `${sterren} van 3 sterren` },
            [0, 1, 2].map((i) => el('span', { klasse: `ster${i < sterren ? ' aan' : ''}`, style: `animation-delay:${0.2 + i * 0.25}s` }, '★'))),
          el('p', {}, boodschap),
          el('p', { klasse: 'klein-tekst' }, `${s.eerstJuist} van ${RONDE} meteen juist. ${niveauZin}`),
          el('div', { klasse: 'knoppen midden' },
            el('button', { klasse: 'knop ghost', type: 'button', onclick: naarMenu }, 'Naar het menu'),
            el('button', { klasse: 'knop groen', type: 'button', onclick: () => O.oefenscherm(root, onderwerp, naarMenu) }, 'Nog een ronde'))));
    }

    volgende();
  };
})();
