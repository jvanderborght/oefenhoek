/* Logica-tests zonder browser:  node tests/test.js */
const assert = require('node:assert/strict');
const path = require('node:path');
const laad = (p) => require(path.join(__dirname, '..', p));

laad('js/kern/hulp.js');
laad('js/kern/opslag.js');
laad('js/kern/adaptief.js');
laad('js/onderwerpen/klok.js');
laad('js/onderwerpen/eenheden.js');
const O = globalThis.Oefenhoek;
const { normGetal, verschuif } = O.hulp;

let aantal = 0;
const test = (naam, fn) => { fn(); aantal++; console.log('ok  ', naam); };

test('normGetal', () => {
  assert.equal(normGetal('2,50'), '2,5');
  assert.equal(normGetal('2.5'), '2,5');
  assert.equal(normGetal('007'), '7');
  assert.equal(normGetal('1.000'), '1000');
  assert.equal(normGetal(' 0,50 '), '0,5');
  assert.equal(normGetal('abc'), null);
  assert.equal(normGetal(''), null);
  assert.deepEqual(O.hulp.getalKandidaten('1.255'), ['1255', '1,255']);
  assert.deepEqual(O.hulp.getalKandidaten('0.999'), ['0,999']);
});

test('verschuif', () => {
  assert.equal(verschuif('3', 1), '30');
  assert.equal(verschuif('2,5', 1), '25');
  assert.equal(verschuif('250', -2), '2,5');
  assert.equal(verschuif('3', -2), '0,03');
  assert.equal(verschuif('0,5', 2), '50');
  assert.equal(verschuif('2000', -3), '2');
  assert.equal(verschuif('1,25', 3), '1250');
});

test('adaptief: 3 juist -> omhoog, 2 fouten -> omlaag', () => {
  const s = O.adaptief.nieuw(1);
  assert.equal(O.adaptief.verwerk(s, 'juist', 5), null);
  assert.equal(O.adaptief.verwerk(s, 'juist', 5), null);
  assert.equal(O.adaptief.verwerk(s, 'juist', 5), 'omhoog');
  assert.equal(s.niveau, 2);
  assert.equal(O.adaptief.verwerk(s, 'fout', 5), null);
  assert.equal(O.adaptief.verwerk(s, 'fout', 5), 'omlaag');
  assert.equal(s.niveau, 1);
  assert.equal(O.adaptief.verwerk(s, 'fout', 5), null, 'niet onder niveau 1');
  assert.equal(O.adaptief.verwerk(s, 'fout', 5), null);
  assert.equal(s.niveau, 1);
});

test('adaptief: hulp breekt de reeks, maar telt niet als fout', () => {
  const s = O.adaptief.nieuw(2);
  O.adaptief.verwerk(s, 'juist', 5);
  O.adaptief.verwerk(s, 'juist', 5);
  O.adaptief.verwerk(s, 'hulp', 5);
  assert.equal(s.reeks, 0);
  assert.equal(s.niveau, 2);
  O.adaptief.verwerk(s, 'hulp', 5);
  O.adaptief.verwerk(s, 'hulp', 5);
  assert.equal(s.niveau, 2);
});

test('adaptief: bovenaan blijft het niveau staan', () => {
  const s = O.adaptief.nieuw(5);
  O.adaptief.verwerk(s, 'juist', 5);
  O.adaptief.verwerk(s, 'juist', 5);
  assert.equal(O.adaptief.verwerk(s, 'juist', 5), 'top');
  assert.equal(s.niveau, 5);
});

const per = (id) => O.onderwerpen.find((o) => o.id === id);
const N = 300;

test('alle onderwerpen zijn volledig geregistreerd', () => {
  assert.deepEqual(O.onderwerpen.map((o) => o.id).sort(), ['inhoud', 'klok', 'lengte']);
  assert.throws(() => O.registreer({ id: 'klok' }));
});

test('klok: elk niveau geeft geldige opgaven met een juist antwoord dat gecontroleerd wordt', () => {
  const k = per('klok');
  for (let niveau = 1; niveau <= k.niveaus.length; niveau++) {
    for (let i = 0; i < N; i++) {
      const o = k.genereer(niveau, {});
      assert.ok(o.vraag && o.hint && o.stappen.length >= 3 && o.antwoordTekst, `niveau ${niveau}`);
      assert.equal(o.controleer(o.juistAntwoord).juist, true, `niveau ${niveau}: ${o.antwoordTekst}`);
      const fout = { u: o.juistAntwoord.u + 1, m: o.juistAntwoord.m + 7 };
      assert.equal(o.controleer(fout).juist, false);
      const opnieuw = k.genereer(niveau, { soort: o.soort });
      assert.equal(opnieuw.soort, o.soort, 'herhaling houdt het opgavetype vast');
    }
  }
});

test('klok: minuten per niveau kloppen', () => {
  const k = per('klok');
  for (let i = 0; i < N; i++) {
    assert.equal(k.genereer(1, {}).juistAntwoord.m, 0);
    assert.ok([0, 15, 30, 45].includes(k.genereer(2, {}).juistAntwoord.m));
    assert.equal(k.genereer(3, {}).juistAntwoord.m % 5, 0);
  }
});

test('klok: 24-uursklok eist 13 voor 1 uur namiddag, 12-uursantwoord telt dan niet', () => {
  const k = per('klok');
  let gezien = 0;
  for (let i = 0; i < N; i++) {
    const o = k.genereer(5, {});
    const { u, m } = o.juistAntwoord;
    if (u >= 13) {
      gezien++;
      assert.equal(o.controleer({ u: u - 12, m }).juist, false);
      assert.match(o.controleer({ u: u - 12, m }).opmerking, /24-uursklok/);
    }
  }
  assert.ok(gezien > 0);
});

test('klok: 12-uursniveaus aanvaarden 15:20 niet als fout voor 3:20 (u%12)', () => {
  const o = per('klok').genereer(3, {});
  const { u, m } = o.juistAntwoord;
  assert.equal(o.controleer({ u: u + 12, m }).juist, true);
});

test('klok: veelgemaakte fout (getal bij de wijzer als minuten) krijgt een gerichte opmerking', () => {
  const k = per('klok');
  for (let i = 0; i < 100; i++) {
    const o = k.genereer(3, {});
    const { u, m } = o.juistAntwoord;
    if (m > 0 && m / 5 !== m) {
      assert.match(o.controleer({ u, m: m / 5 }).opmerking, /5 minuten/);
      return;
    }
  }
});

test('klok: tijdsduur klopt, geen negatieve of nulduur, eindtijd blijft voor 13 uur', () => {
  const k = per('klok');
  for (const niveau of [6, 7, 8]) {
    for (let i = 0; i < N; i++) {
      const o = k.genereer(niveau, {});
      const { u, m } = o.juistAntwoord;
      assert.ok(u * 60 + m > 0, 'duur > 0');
      assert.ok(u <= 3 || niveau === 6);
      assert.equal(o.controleer({ u, m }).juist, true);
      assert.equal(o.controleer({ u: 0, m: u * 60 + m }).juist, true, 'minuten alleen is ook juist');
      assert.equal(o.controleer({ u: u + 1, m }).juist, false);
      const [m1, m2] = o.soort.split(':')[1].split('-').map(Number);
      if (niveau === 8) assert.ok(m2 < m1, 'niveau 8: over het uur heen');
      if (niveau === 7) assert.ok(m2 >= m1);
      if (niveau === 6) assert.ok([0, 30].includes(m1) && [0, 30].includes(m2));
    }
  }
});

for (const id of ['inhoud', 'lengte']) {
  test(`${id}: antwoord klopt met onafhankelijke berekening en met het tabelmodel`, () => {
    const t = per(id);
    for (let niveau = 1; niveau <= t.niveaus.length; niveau++) {
      for (let i = 0; i < N; i++) {
        const o = t.genereer(niveau, {});
        const [links, rechts] = o.antwoordTekst.split(' = ');
        const [w, van] = links.split(' ');
        const [exp, naar] = rechts.split(' ');
        const E = t.id === 'inhoud' ? ['kl', 'hl', 'dal', 'l', 'dl', 'cl', 'ml'] : ['km', 'hm', 'dam', 'm', 'dm', 'cm', 'mm'];
        const stappen = E.indexOf(naar) - E.indexOf(van);
        const verwacht = Number(w.replace(',', '.')) * 10 ** stappen;
        assert.ok(Math.abs(verwacht - Number(exp.replace(',', '.'))) < 1e-9, o.antwoordTekst);
        assert.equal(o.model.resultaat, exp, `tabelmodel: ${o.antwoordTekst}`);
        assert.ok(E.indexOf(van) >= 3 && E.indexOf(naar) >= 3, 'enkel de geoefende eenheden');
        const kols = Object.keys(o.model.cijfers).map(Number);
        assert.ok(Math.min(...kols) >= 0 && Math.max(...kols) <= 6, 'cijfers passen in de tabel');
        assert.equal(o.controleer(exp).juist, true);
        assert.equal(o.controleer(exp.replace(',', '.')).juist, true);
        assert.equal(o.controleer('abc').ongeldig, true);
        assert.ok(o.stappen.length >= 4);
      }
    }
  });

  const eenhedenVan = (t) => (t.id === 'inhoud' ? ['kl', 'hl', 'dal', 'l', 'dl', 'cl', 'ml'] : ['km', 'hm', 'dam', 'm', 'dm', 'cm', 'mm']);
  const ontleed = (t, o) => {
    const [l, r] = o.antwoordTekst.split(' = ');
    const [w, van] = l.split(' ');
    const [exp, naar] = r.split(' ');
    const E = eenhedenVan(t);
    return { w, exp, verschil: E.indexOf(naar) - E.indexOf(van) };
  };

  test(`${id}: niveau 1 en 2 gaan enkel één stap naar rechts, niveau 7 gebruikt komma's`, () => {
    const t = per(id);
    for (let i = 0; i < N; i++) {
      for (const n of [1, 2]) assert.equal(ontleed(t, t.genereer(n, {})).verschil, 1);
    }
    let komma = 0;
    for (let i = 0; i < N; i++) if (t.genereer(7, {}).antwoordTekst.includes(',')) komma++;
    assert.ok(komma > N * 0.8, `komma's op niveau 7: ${komma}/${N}`);
  });

  test(`${id}: gerichte feedback bij richtingsfout en bij komma-fout`, () => {
    const t = per(id);
    for (let i = 0; i < 200; i++) {
      const o = t.genereer(6, {});
      const { w, exp, verschil } = ontleed(t, o);
      assert.match(o.controleer(verschuif(w, -verschil)).opmerking, /richting/, o.antwoordTekst);
      assert.equal(o.controleer(verschuif(exp, 1)).juist, false);
    }
  });
}

console.log(`\n${aantal} testgroepen geslaagd`);
