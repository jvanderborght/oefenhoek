/* Voortgang bewaren in de browser (localStorage). Valt netjes terug op geheugen als dat niet kan. */
(function () {
  const O = globalThis.Oefenhoek;
  const SLEUTEL = 'oefenhoek.v1';
  let data = null;

  function lees() {
    if (data) return data;
    let d = null;
    try {
      d = JSON.parse(localStorage.getItem(SLEUTEL));
    } catch (e) {}
    data = d && typeof d === 'object' ? d : {};
    data.profiel = Object.assign({ naam: '', leeftijd: 9, geluid: true }, data.profiel);
    data.onderwerpen = data.onderwerpen || {};
    return data;
  }
  function bewaar() {
    try {
      localStorage.setItem(SLEUTEL, JSON.stringify(lees()));
    } catch (e) {}
  }

  O.opslag = {
    profiel: () => lees().profiel,
    onderwerp(id) {
      const o = lees().onderwerpen;
      if (!o[id]) o[id] = { niveau: 1, beste: 1, juist: 0, totaal: 0, rondes: 0, sterren: 0 };
      return o[id];
    },
    bewaar,
    wisVoortgang() {
      lees().onderwerpen = {};
      bewaar();
    },
  };
})();
