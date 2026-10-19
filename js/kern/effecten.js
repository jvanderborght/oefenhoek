/* Kleine beloningen: geluidjes en confetti. */
(function () {
  const O = globalThis.Oefenhoek;
  let ctx = null;

  function toon(freq, start, duur, type) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
    g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + start + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + duur);
    o.connect(g).connect(ctx.destination);
    o.start(ctx.currentTime + start);
    o.stop(ctx.currentTime + start + duur + 0.05);
  }

  const GELUIDEN = {
    juist: () => [[660, 0, 0.12], [880, 0.1, 0.2]].forEach((t) => toon(...t)),
    fout: () => toon(220, 0, 0.25, 'triangle'),
    niveau: () => [[523, 0, 0.12], [659, 0.1, 0.12], [784, 0.2, 0.12], [1047, 0.3, 0.3]].forEach((t) => toon(...t)),
  };

  function speel(naam) {
    if (!O.opslag.profiel().geluid) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      GELUIDEN[naam]();
    } catch (e) {}
  }

  function confetti(aantal) {
    const c = document.getElementById('confetti');
    if (!c || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    c.width = innerWidth;
    c.height = innerHeight;
    const g = c.getContext('2d');
    const kleuren = ['#1b6ef3', '#00a86b', '#ffb300', '#ff5a5f', '#9b59ff'];
    const deeltjes = Array.from({ length: aantal || 90 }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 200,
      y: innerHeight * 0.45,
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 12 - 4,
      r: Math.random() * 6 + 4,
      k: kleuren[Math.floor(Math.random() * kleuren.length)],
      h: Math.random() * 6,
    }));
    const t0 = performance.now();
    (function frame(nu) {
      g.clearRect(0, 0, c.width, c.height);
      for (const d of deeltjes) {
        d.vy += 0.35;
        d.x += d.vx;
        d.y += d.vy;
        d.h += 0.2;
        g.fillStyle = d.k;
        g.fillRect(d.x, d.y, d.r, d.r * Math.abs(Math.sin(d.h)) + 1);
      }
      if (nu - t0 < 2200) requestAnimationFrame(frame);
      else g.clearRect(0, 0, c.width, c.height);
    })(t0);
  }

  O.effecten = { speel, confetti };
})();
