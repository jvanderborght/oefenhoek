/* Adaptieve moeilijkheid.
 *  - 3 keer na elkaar meteen juist  -> een niveau hoger
 *  - 2 fouten in de laatste 3 opgaven -> een niveau lager
 *  - juist na een hint of tweede poging telt niet mee voor omhoog, maar ook niet als fout
 */
(function () {
  const O = globalThis.Oefenhoek;
  const REEKS_OMHOOG = 3;
  const FOUTEN_OMLAAG = 2;

  function nieuw(niveau) {
    return { niveau: niveau || 1, reeks: 0, laatste: [] };
  }

  /* uitkomst: 'juist' | 'hulp' | 'fout'. Geeft 'omhoog' | 'omlaag' | 'top' | null terug. */
  function verwerk(s, uitkomst, maxNiveau) {
    s.laatste.push(uitkomst);
    if (s.laatste.length > 3) s.laatste.shift();
    if (uitkomst === 'juist') {
      s.reeks++;
      if (s.reeks >= REEKS_OMHOOG) {
        s.reeks = 0;
        s.laatste = [];
        if (s.niveau < maxNiveau) {
          s.niveau++;
          return 'omhoog';
        }
        return 'top';
      }
      return null;
    }
    s.reeks = 0;
    if (uitkomst === 'fout' && s.laatste.filter((x) => x === 'fout').length >= FOUTEN_OMLAAG && s.niveau > 1) {
      s.niveau--;
      s.laatste = [];
      return 'omlaag';
    }
    return null;
  }

  O.adaptief = { nieuw, verwerk };
})();
