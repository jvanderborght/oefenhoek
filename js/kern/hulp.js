/* Hulpfuncties: onderwerp-register, DOM-helpers, getallen met decimale komma. */
(function () {
  const O = (globalThis.Oefenhoek = globalThis.Oefenhoek || {});
  O.onderwerpen = [];

  /* Een onderwerp registreren. Zie docs/NIEUW-ONDERWERP.md voor het contract. */
  O.registreer = function (o) {
    for (const k of ['id', 'titel', 'domein', 'icoon', 'leeftijd', 'niveaus', 'genereer']) {
      if (!(k in o)) throw new Error(`Onderwerp mist '${k}'`);
    }
    if (O.onderwerpen.some((x) => x.id === o.id)) throw new Error(`Dubbel onderwerp-id '${o.id}'`);
    O.onderwerpen.push(o);
  };

  const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const kies = (lijst) => lijst[rand(0, lijst.length - 1)];
  const pad2 = (n) => String(n).padStart(2, '0');

  function vul(node, kids) {
    for (const k of kids.flat(Infinity)) {
      if (k === null || k === undefined || k === false) continue;
      node.append(k.nodeType ? k : document.createTextNode(String(k)));
    }
    return node;
  }
  function zet(node, attrs) {
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'html') node.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else node.setAttribute(k === 'klasse' ? 'class' : k, v === true ? '' : v);
    }
    return node;
  }
  const el = (tag, attrs, ...kids) => vul(zet(document.createElement(tag), attrs), kids);
  const svgEl = (tag, attrs, ...kids) =>
    vul(zet(document.createElementNS('http://www.w3.org/2000/svg', tag), attrs), kids);

  /* Getallen als tekst met komma ("2,5"). Geeft null terug als het geen getal is. */
  function normGetal(s) {
    s = String(s).trim().replace(/\s/g, '');
    if (/^[1-9]\d{0,2}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, ''); // 1.000 = duizend
    s = s.replace(',', '.');
    if (!/^\d+(\.\d+)?$/.test(s)) return null;
    let [i, f = ''] = s.split('.');
    i = i.replace(/^0+(?=\d)/, '');
    f = f.replace(/0+$/, '');
    return f ? `${i},${f}` : i;
  }

  /* "1.255" kan duizend-tweehonderdvijfenvijftig of 1,255 zijn: geef alle mogelijke lezingen terug. */
  function getalKandidaten(s) {
    const t = String(s).trim().replace(/\s/g, '');
    const alles = [normGetal(t)];
    if (/^\d+\.\d{3}$/.test(t)) alles.push(normGetal(t.replace('.', ',')));
    return [...new Set(alles.filter((x) => x !== null))];
  }

  /* Schuif de komma n plaatsen naar rechts (n > 0: getal wordt 10^n keer groter). */
  function verschuif(w, n) {
    const [i, f = ''] = w.split(',');
    let cijfers = i + f;
    let punt = i.length + n;
    if (punt > cijfers.length) cijfers = cijfers.padEnd(punt, '0');
    if (punt < 0) {
      cijfers = '0'.repeat(-punt) + cijfers;
      punt = 0;
    }
    const geheel = cijfers.slice(0, punt) || '0';
    const deel = cijfers.slice(punt);
    return normGetal(deel ? `${geheel},${deel}` : geheel);
  }

  O.hulp = { rand, kies, pad2, el, svgEl, normGetal, getalKandidaten, verschuif };
})();
