/* Startscherm: onderwerpen kiezen, instellingen. Sorteert onderwerpen op leeftijd van het kind. */
(function () {
  const O = globalThis.Oefenhoek;
  const { el } = O.hulp;
  const root = document.getElementById('app');

  const passend = (o, leeftijd) => leeftijd >= o.leeftijd[0] - 1 && leeftijd <= o.leeftijd[1] + 1;

  function kaartje(o) {
    const v = O.opslag.onderwerp(o.id);
    const gestart = v.totaal > 0;
    return el('button', { klasse: 'kaart onderwerp', type: 'button', onclick: () => O.oefenscherm(root, o, menu) },
      el('div', { klasse: 'onderwerp-icoon', 'aria-hidden': 'true' }, o.icoon),
      el('div', { klasse: 'onderwerp-tekst' },
        el('h3', {}, o.titel),
        el('p', {}, o.beschrijving),
        el('div', { klasse: 'onderwerp-meta' },
          el('span', { klasse: 'badge' }, `${o.domein} · ${o.leeftijd[0]}-${o.leeftijd[1]} jaar`),
          gestart ? el('span', { klasse: 'sterren-mini', title: 'Beste ronde' }, [0, 1, 2].map((i) => el('span', { klasse: i < v.sterren ? 'aan' : '' }, '★'))) : null),
        el('div', { klasse: 'niveau-balk mini', title: `Niveau ${v.niveau} van ${o.niveaus.length}` },
          o.niveaus.map((_, i) => el('span', { klasse: `blok${i < v.niveau && gestart ? ' vol' : ''}` })))),
      el('span', { klasse: 'knop groen start' }, gestart ? 'Verder' : 'Start'));
  }

  function menu() {
    const p = O.opslag.profiel();
    const eigen = O.onderwerpen.filter((o) => passend(o, p.leeftijd));
    const overig = O.onderwerpen.filter((o) => !passend(o, p.leeftijd));
    root.replaceChildren(
      el('header', { klasse: 'kop hoofd' },
        el('div', { klasse: 'logo' }, el('span', { klasse: 'uil', 'aria-hidden': 'true' }, '🦉'), 'Oefenhoek'),
        el('button', { klasse: 'icoonknop', type: 'button', title: 'Instellingen', onclick: instellingen }, '⚙️')),
      el('section', { klasse: 'welkom' },
        el('h1', {}, p.naam ? `Hoi ${p.naam}!` : 'Hoi!'),
        el('p', {}, 'Kies wat je wil oefenen. Het wordt vanzelf moeilijker als het goed gaat, en makkelijker als je even hulp nodig hebt.')),
      el('section', { klasse: 'raster' }, eigen.map(kaartje)),
      ...(overig.length
        ? [el('h2', { klasse: 'tussentitel' }, 'Voor andere leeftijden'), el('section', { klasse: 'raster dim' }, overig.map(kaartje))]
        : []),
      el('footer', {}, 'Je voortgang wordt bewaard in deze browser.'));
    if (!p.naam && !p.gevraagd) {
      p.gevraagd = true;
      O.opslag.bewaar();
      instellingen();
    }
  }

  function instellingen() {
    const p = O.opslag.profiel();
    const naam = el('input', { type: 'text', value: p.naam, maxlength: 20, id: 'in-naam', autocomplete: 'off' });
    const leeftijd = el('select', { id: 'in-leeftijd' },
      [6, 7, 8, 9, 10, 11, 12].map((l) => el('option', { value: l, selected: l === p.leeftijd }, `${l} jaar`)));
    const geluid = el('input', { type: 'checkbox', id: 'in-geluid', checked: p.geluid });
    const dlg = el('dialog', { klasse: 'dialoog' },
      el('h2', {}, 'Instellingen'),
      el('label', { for: 'in-naam' }, 'Hoe heet je?'), naam,
      el('label', { for: 'in-leeftijd' }, 'Hoe oud ben je?'), leeftijd,
      el('label', { klasse: 'rij', for: 'in-geluid' }, geluid, ' Geluidjes aan'),
      el('div', { klasse: 'knoppen' },
        el('button', { klasse: 'knop ghost klein', type: 'button', onclick: () => {
          if (confirm('Alle voortgang wissen?')) {
            O.opslag.wisVoortgang();
            dlg.close();
            menu();
          }
        } }, 'Voortgang wissen'),
        el('button', { klasse: 'knop groen', type: 'button', onclick: () => {
          p.naam = naam.value.trim();
          p.leeftijd = +leeftijd.value;
          p.geluid = geluid.checked;
          O.opslag.bewaar();
          dlg.close();
          menu();
        } }, 'Klaar')));
    dlg.addEventListener('close', () => dlg.remove());
    document.body.append(dlg);
    dlg.showModal();
    naam.focus();
  }

  menu();
})();
