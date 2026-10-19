/* Onderwerp: kloklezen (analoog -> digitaal) en tijdsduur tussen twee klokken. */
(function () {
  const O = globalThis.Oefenhoek;
  const { el, svgEl, rand, kies, pad2 } = O.hulp;

  const NIVEAUS = [
    { naam: 'Hele uren' },
    { naam: 'Halve uren en kwartieren' },
    { naam: 'Op 5 minuten' },
    { naam: 'Op 5 minuten, zonder minuutgetallen' },
    { naam: '24-uursklok' },
    { naam: 'Tijdsduur: hele en halve uren' },
    { naam: 'Tijdsduur op 5 minuten' },
    { naam: 'Tijdsduur over het hele uur heen' },
  ];
  const MIN_ALLE = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  const MIN_PER_NIVEAU = { 1: [0], 2: [0, 15, 30, 45], 3: MIN_ALLE, 4: MIN_ALLE, 5: MIN_ALLE };

  const digi = (u, m) => `${u}:${pad2(m)}`;
  const tijdTekst = (t) => digi(Math.floor(t / 60), t % 60);
  const duurTekst = (min) => {
    const u = Math.floor(min / 60);
    const m = min % 60;
    const delen = [];
    if (u) delen.push(`${u} uur`);
    if (m) delen.push(`${m} minuten`);
    return delen.join(' en ');
  };
  const soortParam = (opt, niveau) => {
    if (!opt || !opt.soort || !opt.soort.startsWith(`${niveau}:`)) return null;
    return opt.soort.slice(String(niveau).length + 1);
  };

  /* ---------- de klok (SVG) ---------- */
  function klok(u, m, { minuten = false } = {}) {
    const s = svgEl('svg', { viewBox: '0 0 200 200', klasse: 'klok', role: 'img', 'aria-label': 'Een analoge klok' });
    s.append(svgEl('circle', { cx: 100, cy: 100, r: 86, klasse: 'wijzerplaat' }));
    const pt = (r, deg) => [100 + r * Math.sin((deg * Math.PI) / 180), 100 - r * Math.cos((deg * Math.PI) / 180)];
    for (let i = 0; i < 60; i++) {
      const [x1, y1] = pt(86, i * 6);
      const [x2, y2] = pt(i % 5 ? 81 : 75, i * 6);
      s.append(svgEl('line', { x1, y1, x2, y2, klasse: i % 5 ? 'tik' : 'tik groot' }));
    }
    for (let n = 1; n <= 12; n++) {
      const [x, y] = pt(61, n * 30);
      s.append(svgEl('text', { x, y, klasse: 'uurgetal', 'data-uur': n }, n));
    }
    if (minuten) {
      for (let k = 1; k <= 12; k++) {
        const [x, y] = pt(94, k * 30);
        s.append(svgEl('text', { x, y, klasse: 'mingetal', 'data-k': k }, k * 5));
      }
    }
    if (m > 0) {
      const [x, y] = pt(86, m * 6);
      s.append(svgEl('path', { klasse: 'sector', d: `M100 100 L100 14 A86 86 0 ${m > 30 ? 1 : 0} 1 ${x} ${y} Z` }));
    }
    const wijzer = (klasse, lengte, staart, graden) =>
      svgEl('g', { klasse: `wijzer ${klasse}`, style: `transform:rotate(${graden}deg)` },
        svgEl('line', { x1: 100, y1: 100 + staart, x2: 100, y2: 100 - lengte }));
    s.append(wijzer('uurwijzer', 44, 8, ((u % 12) + m / 60) * 30), wijzer('minwijzer', 70, 12, m * 6),
      svgEl('circle', { cx: 100, cy: 100, r: 5, klasse: 'middenpunt' }));
    return s;
  }
  const lcd = (u, m, klasse) => el('div', { klasse: `lcd ${klasse || ''}` }, digi(u, m));
  const licht = (node, aan = true) => node && node.classList.toggle('licht', aan);

  /* ---------- analoog -> digitaal (niveau 1 t/m 5) ---------- */
  function uurStap(klokEl, u, m) {
    const u12 = ((u - 1) % 12) + 1; // 12-uurs getal zoals op de klok
    const volgend = (u12 % 12) + 1;
    const tekst = m === 0
      ? `De <b>korte</b> wijzer wijst precies naar de <b>${u12}</b>. Het uur is dus <b>${u12}</b>.`
      : `De <b>korte</b> wijzer staat voorbij de <b>${u12}</b>${m >= 40 ? `, maar bijna bij de ${volgend}` : ''}. Het uur is dus <b>${u12}</b>: dat uur is al geweest.`;
    return {
      tekst,
      toon: (doos) => {
        licht(doos.querySelector('.uurwijzer'));
        licht(doos.querySelector(`.uurgetal[data-uur="${u12}"]`));
      },
    };
  }
  function minStap(m) {
    const k = m / 5;
    const sprongen = Array.from({ length: k }, (_, i) => (i + 1) * 5).join(', ');
    const tekst = m === 0
      ? 'De <b>lange</b> wijzer wijst naar de <b>12</b>. Dat is precies op het uur: <b>0 minuten</b>.'
      : `De <b>lange</b> wijzer wijst naar de <b>${k}</b>. Tel in sprongen van 5: ${sprongen}. Dat zijn <b>${m} minuten</b>.`;
    return {
      tekst,
      toon: (doos) => {
        licht(doos.querySelector('.uurwijzer'), false);
        doos.querySelectorAll('.uurgetal').forEach((n) => licht(n, false));
        licht(doos.querySelector('.minwijzer'));
        const sector = doos.querySelector('.sector');
        sector && sector.classList.add('aan');
        doos.querySelectorAll('.mingetal').forEach((n) => licht(n, +n.dataset.k <= k && k > 0));
      },
    };
  }

  function analoogOpgave(niveau, opt) {
    const minuten = MIN_PER_NIVEAU[niveau];
    const forceer = soortParam(opt, niveau);
    const m = forceer !== null ? +forceer : kies(minuten);
    let u;
    let periode = '';
    if (niveau === 5) {
      u = Math.random() < 0.75 ? rand(13, 23) : rand(6, 12);
      periode = u === 12 ? "'s middags" : u < 12 ? "'s ochtends" : u < 18 ? "'s namiddags" : "'s avonds";
    } else {
      u = rand(1, 12);
    }
    const strikt = niveau === 5;
    const toonMinuten = niveau <= 3 || niveau === 5;
    const vraag = strikt
      ? `Het is <b>${periode}</b>. Hoe laat is het? Schrijf de tijd met de <b>24-uursklok</b>.`
      : 'Hoe laat is het? Schrijf de tijd zoals op een digitale klok.';
    const stappen = [uurStap(null, u > 12 ? u - 12 : u, m), minStap(m)];
    if (strikt) {
      stappen.push({
        tekst: u >= 13
          ? `${periode}: het is al na de middag. Tel er <b>12</b> bij: ${u - 12} + 12 = <b>${u}</b>.`
          : `${periode}: het is nog voor 13 uur, dus het uur blijft <b>${u}</b>.`,
        toon: () => {},
      });
    }
    stappen.push({
      tekst: `Zet het samen: <b>${digi(u, m)}</b>.`,
      toon: (doos) => {
        doos.querySelector('.lcd').classList.add('aan');
        doos.querySelectorAll('.klok .licht').forEach((n) => licht(n, false));
      },
    });
    const exp = { u, m };
    return {
      soort: `${niveau}:${m}`,
      sleutel: `${u}:${m}`,
      vraag,
      visueel(doos, modus) {
        const wrap = el('div', { klasse: 'klokken' }, klok(u > 12 ? u - 12 : u, m, { minuten: toonMinuten }));
        doos.append(wrap);
        if (modus === 'uitleg') {
          doos.append(el('div', { klasse: 'lcd-rij' }, lcd(u, m)));
        }
      },
      invoer: { type: 'tijd' },
      controleer: (a) => controleerTijd(a, exp, strikt),
      juistAntwoord: exp,
      antwoordTekst: digi(u, m),
      hint: strikt
        ? 'Lees eerst de klok zoals gewoonlijk. Is het na de middag? Dan tel je er 12 bij.'
        : 'Kijk eerst naar de korte wijzer voor het uur. Kijk dan naar de lange wijzer: elk getal is 5 minuten.',
      stappen,
    };
  }

  function controleerTijd(a, exp, strikt) {
    const uOk = strikt ? a.u === exp.u : a.u % 12 === exp.u % 12;
    if (uOk && a.m === exp.m) return { juist: true };
    let opmerking = 'Kijk nog eens goed naar beide wijzers.';
    if (strikt && a.m === exp.m && a.u % 12 === exp.u % 12) {
      opmerking = 'Het klopt bijna! Denk aan de 24-uursklok: na de middag tel je er 12 bij.';
    } else if (uOk && exp.m !== 0 && a.m === exp.m / 5) {
      opmerking = 'Het uur klopt! Maar het getal bij de lange wijzer is niet het aantal minuten: elke stap is <b>5 minuten</b>.';
    } else if (exp.m !== 0 && a.u % 12 === (exp.m / 5) % 12 && a.m === (exp.u % 12) * 5) {
      opmerking = 'Het lijkt alsof je de wijzers hebt omgewisseld. De <b>korte</b> wijzer geeft het uur, de <b>lange</b> de minuten.';
    } else if (uOk) {
      opmerking = 'Het uur klopt! Kijk nog eens naar de lange wijzer.';
    } else if (a.m === exp.m) {
      opmerking = 'De minuten kloppen! Kijk nog eens naar de korte wijzer voor het uur.';
    }
    return { juist: false, opmerking };
  }

  /* ---------- tijdsduur tussen twee klokken (niveau 6 t/m 8) ---------- */
  const VERHALEN = [
    { a: 'De film begint', b: 'De film is gedaan', v: 'Hoe lang duurt de film?' },
    { a: 'De trein vertrekt', b: 'De trein komt aan', v: 'Hoe lang duurt de treinrit?' },
    { a: 'Je begint aan je huiswerk', b: 'Je bent klaar', v: 'Hoe lang werkte je aan je huiswerk?' },
    { a: 'De les begint', b: 'De les is gedaan', v: 'Hoe lang duurt de les?' },
    { a: 'De taart gaat in de oven', b: 'De taart komt uit de oven', v: 'Hoe lang zat de taart in de oven?' },
    { a: 'De training begint', b: 'De training is gedaan', v: 'Hoe lang duurt de training?' },
    { a: 'Het feestje begint', b: 'Het feestje is gedaan', v: 'Hoe lang duurt het feestje?' },
  ];

  /* Delen van de tijdsduur: eerst naar het volgende hele uur (als dat nodig is), dan hele uren, dan minuten. */
  function segmenten(t1, t2) {
    const m1 = t1 % 60;
    const m2 = t2 % 60;
    const seg = [];
    if (m2 >= m1) {
      const uren = t2 - t1 - (m2 - m1);
      if (uren > 0) seg.push({ van: t1, tot: t1 + uren, soort: 'uur' });
      if (m2 > m1) seg.push({ van: t1 + uren, tot: t2, soort: 'min' });
    } else {
      const heel = t1 + (60 - m1);
      seg.push({ van: t1, tot: heel, soort: 'min' });
      if (t2 - m2 > heel) seg.push({ van: heel, tot: t2 - m2, soort: 'uur' });
      seg.push({ van: t2 - m2, tot: t2, soort: 'min' });
    }
    return seg;
  }
  const segLabel = (g) => (g.soort === 'uur' ? `${(g.tot - g.van) / 60} uur` : `${g.tot - g.van} min`);

  function tijdlijn(t1, t2, seg) {
    const X0 = 40;
    const B = 380;
    const x = (t) => X0 + ((t - t1) / (t2 - t1)) * B;
    const s = svgEl('svg', { viewBox: '0 0 460 120', klasse: 'tijdlijn', role: 'img', 'aria-label': 'Tijdlijn' });
    s.append(svgEl('line', { x1: X0, y1: 75, x2: X0 + B, y2: 75, klasse: 'lijn' }));
    const punten = [t1, ...seg.map((g) => g.tot)];
    punten.forEach((t) => {
      s.append(svgEl('circle', { cx: x(t), cy: 75, r: 4.5, klasse: 'punt' }),
        svgEl('text', { x: x(t), y: 100, klasse: 'tl-tijd' }, tijdTekst(t)));
    });
    seg.forEach((g, i) => {
      const a = x(g.van);
      const b = x(g.tot);
      s.append(svgEl('path', { klasse: `sprong ${g.soort}`, 'data-seg': i, pathLength: 1, d: `M${a} 71 Q${(a + b) / 2} 14 ${b} 71` }),
        svgEl('text', { x: (a + b) / 2, y: 36, klasse: `sprongtekst ${g.soort}`, 'data-seg': i }, `+ ${segLabel(g)}`));
    });
    return s;
  }

  function duurOpgave(niveau, opt) {
    const forceer = soortParam(opt, niveau);
    let m1;
    let m2;
    if (forceer) {
      [m1, m2] = forceer.split('-').map(Number);
    } else if (niveau === 6) {
      [m1, m2] = kies([[0, 0], [0, 30], [30, 0], [30, 30]]);
    } else if (niveau === 7) {
      m1 = kies(MIN_ALLE);
      m2 = kies(MIN_ALLE.filter((x) => x >= m1));
    } else {
      m1 = kies(MIN_ALLE.slice(1));
      m2 = kies(MIN_ALLE.filter((x) => x < m1));
    }
    const minU = m2 > m1 ? 0 : 1; // zelfde of kleinere minuten: er moet minstens 1 uur bij
    const dU = rand(minU, 3);
    const u1 = rand(1, 12 - dU);
    const u2 = u1 + dU;
    const t1 = u1 * 60 + m1;
    const t2 = u2 * 60 + m2;
    const exp = t2 - t1;
    const verhaal = kies(VERHALEN);
    const seg = segmenten(t1, t2);
    const toonMinuten = niveau !== 8;

    const stappen = [
      { tekst: `Lees de eerste klok: <b>${digi(u1, m1)}</b>. ${verhaal.a} om die tijd.`, toon: (d) => { licht(d.querySelector('[data-klok="a"] .klok')); d.querySelector('[data-klok="a"] .bijschrift').classList.add('aan'); } },
      { tekst: `Lees de tweede klok: <b>${digi(u2, m2)}</b>. ${verhaal.b} om die tijd.`, toon: (d) => { licht(d.querySelector('[data-klok="a"] .klok'), false); licht(d.querySelector('[data-klok="b"] .klok')); d.querySelector('[data-klok="b"] .bijschrift').classList.add('aan'); } },
    ];
    seg.forEach((g, i) => {
      const lab = g.soort === 'uur' ? `<b>${(g.tot - g.van) / 60} uur</b>` : `<b>${g.tot - g.van} minuten</b>`;
      let tekst;
      if (g.soort === 'uur') tekst = `Spring in hele uren: van ${tijdTekst(g.van)} naar ${tijdTekst(g.tot)} is ${lab}.`;
      else if (i === 0 && m2 < m1) tekst = `Spring eerst naar het volgende hele uur: van ${tijdTekst(g.van)} naar ${tijdTekst(g.tot)} is ${lab}.`;
      else tekst = `Tel de minuten: van ${tijdTekst(g.van)} naar ${tijdTekst(g.tot)} is ${lab}.`;
      stappen.push({
        tekst,
        toon: (d) => {
          d.querySelectorAll('.klok.licht').forEach((n) => licht(n, false));
          d.querySelectorAll(`[data-seg="${i}"]`).forEach((n) => n.classList.add('aan'));
        },
      });
    });
    stappen.push({
      tekst: `Samen: <b>${duurTekst(exp)}</b>.`,
      toon: (d) => d.querySelector('.duur-uitkomst').classList.add('aan'),
    });

    return {
      soort: `${niveau}:${m1}-${m2}`,
      sleutel: `${t1}-${t2}`,
      vraag: `${verhaal.a} bij de <b>eerste</b> klok. ${verhaal.b} bij de <b>tweede</b> klok. <b>${verhaal.v}</b>`,
      visueel(doos, modus) {
        const blok = (id, label, u, m) =>
          el('div', { klasse: 'klokblok', 'data-klok': id },
            el('div', { klasse: 'klok-label' }, label),
            klok(u, m, { minuten: toonMinuten }),
            modus === 'uitleg' ? el('div', { klasse: 'bijschrift' }, digi(u, m)) : null);
        doos.append(el('div', { klasse: 'klokken twee' }, blok('a', 'Begin', u1, m1), el('div', { klasse: 'pijl-tussen' }, '➜'), blok('b', 'Einde', u2, m2)));
        if (modus === 'uitleg') {
          doos.append(tijdlijn(t1, t2, seg), el('div', { klasse: 'duur-uitkomst' }, duurTekst(exp)));
        }
      },
      invoer: { type: 'duur' },
      controleer: (a) => {
        const totaal = a.u * 60 + a.m;
        if (totaal === exp) return { juist: true };
        let opmerking = 'Tel de tijd tussen de twee klokken nog eens na. Gebruik de tijdlijn: eerst hele uren, dan minuten.';
        if (a.u === u2 && a.m === m2) opmerking = 'Dat is het <b>eindtijdstip</b>. Je zoekt de tijd die <b>tussen</b> de twee klokken zit.';
        else if (a.u === Math.floor(exp / 60)) opmerking = 'De uren kloppen! Tel de minuten nog eens na.';
        else if (a.m === exp % 60) opmerking = 'De minuten kloppen! Tel de uren nog eens na.';
        return { juist: false, opmerking };
      },
      juistAntwoord: { u: Math.floor(exp / 60), m: exp % 60 },
      antwoordTekst: duurTekst(exp),
      hint: m2 < m1
        ? 'De minuten van de tweede klok zijn kleiner. Spring eerst naar het volgende hele uur, tel dan de hele uren en daarna de minuten.'
        : 'Lees beide klokken af. Tel eerst de hele uren en dan de minuten die erbij komen.',
      stappen,
    };
  }

  O.registreer({
    id: 'klok',
    titel: 'Kloklezen',
    domein: 'Tijd',
    icoon: '🕒',
    leeftijd: [7, 10],
    beschrijving: 'Lees de klok af en bereken hoe lang iets duurt.',
    niveaus: NIVEAUS,
    genereer: (niveau, opt) => (niveau <= 5 ? analoogOpgave(niveau, opt) : duurOpgave(niveau, opt)),
  });
})();
