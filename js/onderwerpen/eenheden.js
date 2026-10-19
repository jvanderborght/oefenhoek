/* Onderwerp: eenheden omzetten met de omzettingstabel (inhoud en lengte).
 * Eén generator, twee stelsels. Een nieuw stelsel (bv. gewicht: kg-hg-dag-g-dg-cg-mg) toevoegen = één regel onderaan. */
(function () {
  const O = globalThis.Oefenhoek;
  const { el, rand, kies, normGetal, getalKandidaten, verschuif } = O.hulp;

  /* De tabel heeft 7 kolommen. Kolom 3 t/m 6 (l-dl-cl-ml) zijn de eenheden die geoefend worden. */
  const BEGIN = 3;
  const EIND = 6;
  const KOLOMMEN = 7;

  const SPEC = {
    1: [{ r: 'neer', d: [1, 1], w: 'klein', van: [3] }],
    2: [{ r: 'neer', d: [1, 1], w: 'middel' }],
    3: [{ r: 'neer', d: [1, 1], w: 'middel' }, { r: 'op', d: [1, 1], w: 'veelvoud' }],
    4: [{ r: 'neer', d: [2, 2], w: 'klein' }, { r: 'neer', d: [2, 2], w: 'middel' }, { r: 'op', d: [1, 1], w: 'veelvoud' }],
    5: [{ r: 'neer', d: [3, 3], w: 'klein' }, { r: 'op', d: [2, 2], w: 'veelvoud' }, { r: 'neer', d: [2, 2], w: 'middel' }],
    6: [{ r: 'op', d: [1, 3], w: 'veelvoud' }, { r: 'neer', d: [1, 3], w: 'middel' }],
    7: [{ r: 'neer', d: [1, 3], w: 'komma' }, { r: 'op', d: [1, 3], w: 'rest' }, { r: 'neer', d: [1, 3], w: 'komma' }],
  };

  function waarde(type, van, d) {
    switch (type) {
      case 'klein': return String(rand(1, 9));
      case 'middel': return String(rand(2, 25));
      case 'veelvoud': return String(rand(1, d === 1 ? 12 : 9) * 10 ** d);
      case 'komma': {
        const f = rand(1, Math.min(2, EIND - van));
        let frac = '';
        for (let i = 0; i < f; i++) frac += rand(i === f - 1 ? 1 : 0, 9);
        return `${rand(0, 9)},${frac}`;
      }
      case 'rest': {
        let v;
        do v = rand(11, 999); while (v % 10 ** d === 0);
        return String(v);
      }
    }
  }

  /* Het tabelmodel: in welke kolom staat welk cijfer, waar komt de komma, wat lees je af? */
  function model(van, naar, w) {
    const [i, f = ''] = w.split(',');
    const cijfers = {};
    (i + f).split('').forEach((c, j) => (cijfers[van - (i.length - 1) + j] = c));
    const kols = Object.keys(cijfers).map(Number);
    const lo = Math.min(naar, ...kols);
    const hi = Math.max(naar, ...kols);
    const nullen = [];
    let geheel = '';
    let deel = '';
    for (let k = lo; k <= hi; k++) {
      if (!(k in cijfers)) nullen.push(k);
      const c = cijfers[k] ?? '0';
      if (k <= naar) geheel += c;
      else deel += c;
    }
    const resultaat = normGetal(deel ? `${geheel},${deel}` : geheel);
    // kolommen die in het afgelezen getal zitten (zonder voorloop- en achterloopnullen)
    let a = lo;
    while (a < naar && (cijfers[a] ?? '0') === '0') a++;
    let b = hi;
    while (b > naar && (cijfers[b] ?? '0') === '0') b--;
    return { cijfers, nullen, resultaat, lees: [a, b] };
  }

  function maakOpgave(stelsel, niveau, opt) {
    const E = stelsel.eenheden;
    const specs = SPEC[niveau];
    let idx = rand(0, specs.length - 1);
    if (opt && opt.soort && opt.soort.startsWith(`${niveau}:`)) idx = +opt.soort.split(':')[1] % specs.length;
    const sp = specs[idx];

    const keuzes = [];
    for (let van = BEGIN; van <= EIND; van++) {
      if (sp.van && !sp.van.includes(van)) continue;
      for (let d = sp.d[0]; d <= sp.d[1]; d++) {
        const naar = sp.r === 'neer' ? van + d : van - d;
        if (naar < BEGIN || naar > EIND) continue;
        if (sp.w === 'komma' && van === EIND) continue;
        keuzes.push({ van, naar, d });
      }
    }
    const { van, naar, d } = kies(keuzes);
    const w = waarde(sp.w, van, d);
    const verschil = naar - van;
    const exp = verschuif(w, verschil);
    const m = model(van, naar, w);
    const rechts = verschil > 0;
    const stappenAantal = Math.abs(verschil);
    const factor = `${rechts ? '×' : '÷'} ${10 ** stappenAantal}`;
    const vE = E[van];
    const nE = E[naar];

    const stappen = [{
      tekst: `We gaan van <b>${vE}</b> naar <b>${nE}</b>: ${stappenAantal} ${stappenAantal === 1 ? 'stap' : 'stappen'} naar <b>${rechts ? 'rechts' : 'links'}</b>. Het getal wordt ${rechts ? 'groter' : 'kleiner'} (${factor}).`,
      toon: (doos) => {
        doos.querySelector('.tabel').classList.add('toon-pijl');
        doos.querySelectorAll('.kop-cel').forEach((c, k) => {
          c.classList.toggle('start', k === van);
          c.classList.toggle('doel', k === naar);
        });
      },
    }, {
      tekst: `Zet <b>${w}</b> in de tabel. Het laatste cijfer vóór de komma komt onder <b>${vE}</b>${w.includes(',') ? '; de cijfers na de komma komen in de vakjes daarnaast' : ''}.`,
      toon: (doos) => doos.querySelectorAll('.cijfer.orig').forEach((c) => c.classList.add('aan')),
    }, {
      tekst: `Zet de komma <b>achter ${nE}</b>: daar wil je naartoe.`,
      toon: (doos) => doos.querySelector('.komma').classList.add('aan'),
    }];
    if (m.nullen.length) {
      stappen.push({
        tekst: 'Vul de lege vakjes op met <b>nullen</b>.',
        toon: (doos) => doos.querySelectorAll('.cijfer.nul').forEach((c) => c.classList.add('aan')),
      });
    }
    stappen.push({
      tekst: `Lees af: <b>${w} ${vE} = ${exp} ${nE}</b>.`,
      toon: (doos) => {
        doos.querySelectorAll('.cel').forEach((c, k) => c.classList.toggle('lees', k >= m.lees[0] && k <= m.lees[1]));
        doos.querySelector('.tabel-uitkomst').classList.add('aan');
      },
    });

    function tabel(doos, modus) {
      const uitleg = modus === 'uitleg';
      const kop = stelsel.eenheden.map((e, k) =>
        el('div', { klasse: `kop-cel${k < BEGIN ? ' dim' : ''}${!uitleg && k === van ? ' start' : ''}${!uitleg && k === naar ? ' doel' : ''}` },
          el('b', {}, e), el('small', {}, stelsel.namen[k])));
      const cellen = stelsel.eenheden.map((_, k) => {
        const c = m.cijfers[k];
        const nul = m.nullen.includes(k);
        return el('div', { klasse: `cel${k < BEGIN ? ' dim' : ''}` },
          c !== undefined ? el('span', { klasse: `cijfer orig${uitleg ? '' : ' aan'}` }, c) : null,
          nul ? el('span', { klasse: 'cijfer nul' }, '0') : null);
      });
      const pijlLinks = (Math.min(van, naar) + 0.5) / KOLOMMEN * 100;
      const pijlBreed = (stappenAantal / KOLOMMEN) * 100;
      doos.append(el('div', { klasse: 'tabel' },
        el('div', { klasse: 'pijl-rij' },
          el('div', { klasse: `pijl ${rechts ? 'rechts' : 'links'}`, style: `left:${pijlLinks}%;width:${pijlBreed}%` }, factor)),
        el('div', { klasse: 'kop-rij' }, kop),
        el('div', { klasse: 'cel-rij' }, cellen,
          uitleg ? el('div', { klasse: 'komma', style: `left:${((naar + 1) / KOLOMMEN) * 100}%` }, ',') : null)),
        uitleg ? el('div', { klasse: 'tabel-uitkomst' }, `${w} ${vE} = ${exp} ${nE}`) : null);
    }

    return {
      soort: `${niveau}:${idx}`,
      sleutel: `${w}${vE}${nE}`,
      vraag: `Reken om met de tabel: <b>${w} ${vE}</b> in <b>${nE}</b>.`,
      visueel: tabel,
      verbergHulp: niveau >= 5,
      invoer: { type: 'getal', voor: `${w} ${vE} =`, eenheid: nE },
      controleer(raw) {
        const kandidaten = getalKandidaten(raw);
        if (!kandidaten.length) return { ongeldig: true, opmerking: 'Typ een getal: cijfers en eventueel een komma.' };
        if (kandidaten.includes(exp)) return { juist: true };
        const a = kandidaten[0];
        let opmerking = 'Gebruik de tabel: zet je getal erin en tel de stappen.';
        if (a === w) opmerking = 'Je getal is nog niet omgezet. Er moet iets veranderen!';
        else if (a === verschuif(w, -verschil)) opmerking = `Let op de richting: je gaat naar <b>${rechts ? 'rechts' : 'links'}</b>, dus het getal wordt ${rechts ? 'groter' : 'kleiner'}.`;
        else if ([-3, -2, -1, 1, 2, 3].some((k) => a === verschuif(exp, k))) opmerking = 'Je komma of je nullen staan niet op de juiste plaats. Tel de stappen in de tabel nog eens.';
        return { juist: false, opmerking };
      },
      juistAntwoord: exp,
      antwoordTekst: `${w} ${vE} = ${exp} ${nE}`,
      hint: `Zet het laatste cijfer onder <b>${vE}</b> en de komma achter <b>${nE}</b>. Je gaat ${stappenAantal} ${stappenAantal === 1 ? 'stap' : 'stappen'} naar ${rechts ? 'rechts: het getal wordt groter' : 'links: het getal wordt kleiner'}.`,
      stappen,
      model: m,
    };
  }

  function stelsel(def) {
    O.registreer({
      id: def.id,
      titel: def.titel,
      domein: 'Meten',
      icoon: def.icoon,
      leeftijd: [8, 11],
      beschrijving: def.beschrijving,
      niveaus: [
        { naam: `1 stap: ${def.eenheden[3]} → ${def.eenheden[4]}` },
        { naam: '1 stap naar rechts' },
        { naam: '1 stap, ook terug' },
        { naam: '2 stappen' },
        { naam: 'Grote sprongen' },
        { naam: 'Alle sprongen, heen en terug' },
        { naam: 'Met komma’s' },
      ],
      genereer: (niveau, opt) => maakOpgave(def, niveau, opt),
    });
  }

  stelsel({
    id: 'inhoud',
    titel: 'Inhoud omzetten',
    icoon: '🧪',
    beschrijving: 'Zet liter, deciliter, centiliter en milliliter om met de tabel.',
    eenheden: ['kl', 'hl', 'dal', 'l', 'dl', 'cl', 'ml'],
    namen: ['kiloliter', 'hectoliter', 'decaliter', 'liter', 'deciliter', 'centiliter', 'milliliter'],
  });
  stelsel({
    id: 'lengte',
    titel: 'Lengte omzetten',
    icoon: '📏',
    beschrijving: 'Zet meter, decimeter, centimeter en millimeter om met de tabel.',
    eenheden: ['km', 'hm', 'dam', 'm', 'dm', 'cm', 'mm'],
    namen: ['kilometer', 'hectometer', 'decameter', 'meter', 'decimeter', 'centimeter', 'millimeter'],
  });
})();
