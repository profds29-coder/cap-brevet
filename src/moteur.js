/* =====================================================================
   Cap Brevet – moteur mathématique
   Lecture des expressions saisies, calcul exact par valeur, correction
   déterministe (équivalences, forme demandée, unités, arrondis, erreurs
   fréquentes). Aucun appel réseau, aucune IA.
   ===================================================================== */
(function (G) {
  'use strict';

  /* ---------- Hasard reproductible (même graine = même question) ---------- */
  let _seed = 1;
  function setSeed(s) { _seed = (s >>> 0) || 1; }
  function rnd() { // mulberry32
    _seed = (_seed + 0x6D2B79F5) >>> 0;
    let t = _seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const R = (a, b) => a + Math.floor(rnd() * (b - a + 1));            // entier entre a et b
  const pick = arr => arr[Math.floor(rnd() * arr.length)];
  const nz = (a, b) => { let v; do { v = R(a, b); } while (v === 0); return v; };
  const sgn = () => (rnd() < 0.5 ? -1 : 1);
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  /* ---------- Arithmétique ---------- */
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const isPrime = n => { if (n < 2 || !Number.isInteger(n)) return false; for (let k = 2; k * k <= n; k++) if (n % k === 0) return false; return true; };
  const roundTo = (x, d) => { const p = Math.pow(10, d); return Math.round((x + Number.EPSILON * Math.sign(x)) * p) / p; };

  /* ---------- Lecture des expressions ---------- */
  const SUP = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-' };
  function norm(s) {
    s = String(s).trim();
    // Exposants tapés en petits chiffres (10⁴, x², 10⁻³) : on les écrit avec ^ sans ajouter
    // de parenthèses, sinon « 5x² » serait vu comme « pas encore réduit » ou 2³ × 3² comme « pas décomposé ».
    s = s.replace(/([⁻⁰¹²³⁴⁵⁶⁷⁸⁹])\s+(?=[⁰¹²³⁴⁵⁶⁷⁸⁹])/g, '$1');
    s = s.replace(/[⁻⁰¹²³⁴⁵⁶⁷⁸⁹]+(\s*)(?=([0-9.,]?))/g, (m, sp, nx) => '^' + [...m.trim()].map(c => SUP[c]).join('') + (nx ? '*' : sp));
    return s.replace(/[−–—]/g, '-').replace(/[×·∙]/g, '*').replace(/÷|:/g, '/').replace(/,/g, '.')
      .replace(/π/g, 'p').replace(/pi/gi, 'p').replace(/√/g, 'r').replace(/X/g, 'x').replace(/Y/g, 'y')
      .replace(/\s+/g, '');
  }
  function tokenize(s) {
    const t = []; let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/[0-9.]/.test(c)) {
        let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++;
        const str = s.slice(i, j);
        if ((str.match(/\./g) || []).length > 1 || str === '.') throw new Error('nombre');
        t.push({ k: 'n', v: parseFloat(str), s: str }); i = j;
      } else if ('xypr+-*/^()'.includes(c)) { t.push({ k: c }); i++; }
      else throw new Error('caractère');
    }
    return t;
  }
  function parse(src) {
    const t = tokenize(norm(src)); let i = 0;
    if (!t.length) throw new Error('vide');
    const peek = () => t[i], eat = k => { if (t[i] && t[i].k === k) { i++; return true; } return false; };
    function expr() { let n = term(); while (peek() && (peek().k === '+' || peek().k === '-')) { const op = t[i++].k; n = { t: 'b', op, a: n, b: term() }; } return n; }
    function term() {
      let n = unary();
      for (;;) {
        const p = peek(); if (!p) break;
        if (p.k === '*' || p.k === '/') { i++; n = { t: 'b', op: p.k, a: n, b: unary() }; }
        else if ('nxypr('.includes(p.k)) { n = { t: 'b', op: '*', a: n, b: power(), imp: true }; }
        else break;
      }
      return n;
    }
    function unary() { if (eat('-')) return { t: 'neg', a: unary() }; if (eat('+')) return unary(); return power(); }
    function power() { const base = atom(); if (eat('^')) return { t: 'pow', a: base, b: unary() }; return base; }
    function atom() {
      const p = t[i++]; if (!p) throw new Error('fin');
      if (p.k === 'n') return { t: 'n', v: p.v, s: p.s };
      if (p.k === 'x' || p.k === 'y') return { t: 'v', name: p.k };
      if (p.k === 'p') return { t: 'pi' };
      if (p.k === 'r') return { t: 'sqrt', a: power() };
      if (p.k === '(') { const e = expr(); if (!eat(')')) throw new Error('parenthèse'); return { t: 'par', a: e }; }
      throw new Error('symbole');
    }
    const r = expr(); if (i < t.length) throw new Error('reste');
    return r;
  }
  function ev(n, env) {
    env = env || {};
    switch (n.t) {
      case 'n': return n.v; case 'pi': return Math.PI; case 'v': return env[n.name] ?? NaN; case 'par': return ev(n.a, env);
      case 'neg': return -ev(n.a, env); case 'sqrt': return Math.sqrt(ev(n.a, env)); case 'pow': return Math.pow(ev(n.a, env), ev(n.b, env));
      case 'b': { const a = ev(n.a, env), b = ev(n.b, env); return n.op === '+' ? a + b : n.op === '-' ? a - b : n.op === '*' ? a * b : a / b; }
    }
    return NaN;
  }
  function val(s) { try { return ev(parse(s)); } catch (e) { return NaN; } }
  const close = (a, b, tol = 1e-9) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
  const has = (n, type) => !!n && (n.t === type || ['a', 'b'].some(k => n[k] && typeof n[k] === 'object' && has(n[k], type)));
  const isInt = n => n && n.t === 'n' && Number.isInteger(n.v);
  const isSInt = n => isInt(n) || (n && n.t === 'neg' && isInt(n.a));          // entier éventuellement précédé de −
  const sIntV = n => (n.t === 'neg' ? -n.a.v : n.v);

  /* Termes d'une somme (au premier niveau) */
  function terms(n, out) {
    out = out || [];
    if (n.t === 'b' && (n.op === '+' || n.op === '-')) { terms(n.a, out); terms(n.op === '-' ? { t: 'neg', a: n.b } : n.b, out); }
    else if (n.t === 'neg' && n.a.t === 'b' && (n.a.op === '+' || n.a.op === '-') ) out.push(n);
    else out.push(n);
    return out;
  }
  function degree(term) {
    const a = ev(term, { x: 2 }), b = ev(term, { x: 3 });
    if (!Number.isFinite(a) || !Number.isFinite(b) || a === 0) return 0;
    return Math.round(Math.log(Math.abs(b / a)) / Math.log(1.5));
  }

  /* ---------- Contrôle de la forme demandée ---------- */
  function formCheck(form, ast) {
    let n = ast; if (n.t === 'neg') n = n.a;
    if (form === 'irr') {
      if (isInt(n)) return { ok: true };
      if (n.t === 'b' && n.op === '/' && isSInt(n.a) && isSInt(n.b)) {
        const A = Math.abs(sIntV(n.a)), B = Math.abs(sIntV(n.b)), g = gcd(A, B);
        if (B === 1) return { ok: false, t: 'Juste, mais pas simplifié', m: 'Une fraction de dénominateur 1 s’écrit comme un nombre entier.' };
        if (g > 1) return { ok: false, t: 'Juste, mais pas simplifié', m: `${A} et ${B} sont tous les deux divisibles par ${g}. Simplifie la fraction.` };
        return { ok: true };
      }
      return { ok: false, t: 'Juste, mais pas sous la forme demandée', m: 'La consigne demande une fraction irréductible, par exemple 3/4.' };
    }
    if (form === 'frac') { // une fraction ou un entier, pas un décimal approché
      if (isInt(n) || (n.t === 'b' && n.op === '/' && isSInt(n.a) && isSInt(n.b))) return { ok: true };
      return { ok: false, t: 'Juste, mais pas sous la forme demandée', m: 'La consigne demande une fraction, par exemple 3/8.' };
    }
    if (form === 'dev' || form === 'red') {
      if (has(ast, 'par')) return { ok: false, t: form === 'dev' ? 'Pas encore développé' : 'Pas encore réduit', m: 'Il reste des parenthèses. Distribue sur chaque terme, puis regroupe les termes de même nature.' };
      const ds = terms(ast).map(degree); const seen = {};
      for (const d of ds) { if (seen[d]) return { ok: false, t: 'Juste, mais pas réduit', m: 'Regroupe les termes de même nature : les x² ensemble, les x ensemble, les nombres ensemble.' }; seen[d] = 1; }
      return { ok: true };
    }
    if (form === 'fac') {
      const prod = (n.t === 'b' && n.op === '*' && has(n, 'par')) || (n.t === 'pow' && n.a.t === 'par');
      if (!prod) return { ok: false, t: 'Pas encore factorisé', m: 'Une forme factorisée est un produit, par exemple 3(x + 2) ou (x − 3)(x + 3).' };
      return { ok: true };
    }
    if (form === 'pi') {
      if (!has(ast, 'pi')) return { ok: false, t: 'Valeur approchée', m: 'La consigne demande la valeur exacte, en fonction de π (par exemple 9π).' };
      return { ok: true };
    }
    if (form === 'sci') {
      const okSci = (n.t === 'b' && n.op === '*' && n.a.t === 'n' && n.a.v >= 1 && n.a.v < 10 && n.b.t === 'pow' && isInt(n.b.a) && n.b.a.v === 10);
      if (!okSci) return { ok: false, t: 'Juste, mais pas en notation scientifique', m: 'La notation scientifique s’écrit a × 10ⁿ avec 1 ≤ a < 10, par exemple 3,45 × 10^4.' };
      return { ok: true };
    }
    if (form === 'primes') {
      const facs = []; (function walk(m) { if (m.t === 'b' && m.op === '*') { walk(m.a); walk(m.b); } else facs.push(m); })(n);
      const okP = facs.every(f => (isInt(f) && isPrime(f.v)) || (f.t === 'pow' && isInt(f.a) && isPrime(f.a.v) && isInt(f.b)));
      if (!okP) return { ok: false, t: 'Juste, mais pas décomposé en facteurs premiers', m: 'Chaque facteur doit être un nombre premier (2, 3, 5, 7, 11…). Continue la décomposition.' };
      return { ok: true };
    }
    if (form === 'p10') {
      const okP = (n.t === 'pow' && isInt(n.a) && n.a.v === 10) || (isInt(n) && n.v === 10);
      if (!okP) return { ok: false, t: 'Juste, mais pas sous la forme demandée', m: 'La consigne demande une seule puissance de 10, par exemple 10^5 ou 10^-3.' };
      return { ok: true };
    }
    if (form === 'int') {
      if (!isInt(n)) return { ok: false, t: 'Juste, mais pas sous la forme demandée', m: 'Donne le résultat sous forme d’un nombre entier.' };
      return { ok: true };
    }
    return { ok: true };
  }

  /* ---------- Unités ---------- */
  const UNITS = {
    mm: ['L', 0.001], cm: ['L', 0.01], dm: ['L', 0.1], m: ['L', 1], km: ['L', 1000],
    'mm²': ['A', 1e-6], 'cm²': ['A', 1e-4], 'dm²': ['A', 0.01], 'm²': ['A', 1], 'km²': ['A', 1e6],
    'mm³': ['V', 1e-9], 'cm³': ['V', 1e-6], 'dm³': ['V', 1e-3], 'm³': ['V', 1], mL: ['V', 1e-6], cL: ['V', 1e-5], dL: ['V', 1e-4], L: ['V', 1e-3],
    mg: ['M', 0.001], g: ['M', 1], kg: ['M', 1000], s: ['T', 1], min: ['T', 60], h: ['T', 3600],
    'km/h': ['S', 1 / 3.6], 'm/s': ['S', 1], '€': ['E', 1], '%': ['P', 1], '°': ['D', 1]
  };
  const UNIT_RE = /\s*(km\/h|m\/s|mm²|cm²|dm²|km²|m²|mm³|cm³|dm³|m³|mm2|cm2|dm2|km2|m2|mm3|cm3|dm3|m3|mL|cL|dL|km|mm|cm|dm|kg|mg|min|m|L|g|h|s|€|%|°)\s*$/;
  function splitUnit(raw) {
    const m = raw.match(UNIT_RE);
    if (!m) return [raw, ''];
    let u = m[1].replace(/2$/, '²').replace(/3$/, '³');
    if (u === 'm²' && /cm2|mm2|dm2|km2/.test(m[1])) u = m[1].slice(0, 2) + '²';
    return [raw.slice(0, m.index), u];
  }

  /* ---------- Correction d'une réponse ---------- */
  const SAMPLES = [-1.7, 0.3, 2.9, 5.1];
  function stripVar(r) { return r.replace(/^\s*([a-zA-Z]{1,2}|[a-zA-Z]\s*\(\s*[x0-9,.\-−]*\s*\))\s*=\s*/, ''); }
  function equalVal(ast, q) {
    if (q.f) return SAMPLES.every(x => close(ev(ast, { x }), q.f(x), 1e-7));
    return close(ev(ast, {}), q.v, q.tol || 1e-9);
  }
  function grade(q, raw, unitSel) {
    const pts = q.pts || 1;
    raw = String(raw ?? '').trim();
    if (!raw) return { s: 'vide', pts: 0, t: 'Pas de réponse', m: '' };
    // Sans x dans la réponse attendue, un « x » entre deux nombres est un signe fois : 3,45 x 10^4, 2³ x 3².
    if (!q.f) raw = raw.replace(/([0-9⁰¹²³⁴⁵⁶⁷⁸⁹)])\s*[xX]\s*(?=[0-9(√])/g, '$1×');

    if (q.type === 'qcm') {
      const ok = Number(raw) === q.correct;
      if (ok) return { s: 'ok', pts, t: 'Juste', m: q.okm || '' };
      const e = (q.errs || []).find(e => e.i === Number(raw));
      return { s: 'ko', pts: 0, t: 'Faux', m: e ? e.m : (q.hint || 'Relis bien l’énoncé et reprends la propriété du cours.') };
    }

    let [r, uTyped] = splitUnit(raw);
    if (q.suffix && uTyped === q.suffix) uTyped = '';
    const unit = unitSel || uTyped || '';
    if (q.strip !== false) r = stripVar(r);

    if (q.type === 'set') {
      const parts = r.split(/;|\bou\b|\bet\b/).map(s => stripVar(s.trim())).filter(Boolean);
      const vals = parts.map(val);
      if (vals.some(v => !Number.isFinite(v))) return { s: 'ko', pts: 0, t: 'Écriture non reconnue', m: 'Sépare les solutions par « ou », par exemple : x = 2 ou x = −3.' };
      const want = q.set.slice(); let found = 0; const extra = [];
      for (const v of vals) { const k = want.findIndex(w => close(v, w)); if (k >= 0) { want.splice(k, 1); found++; } else extra.push(v); }
      if (!want.length && !extra.length) return { s: 'ok', pts, t: 'Juste', m: q.okm || '' };
      if (found && !extra.length) return { s: 'part', pts: pts / 2, t: 'Incomplet', m: 'Il manque au moins une solution. Un produit est nul si l’un de ses facteurs est nul : il y a un cas par facteur.' };
      for (const e of q.errs || []) if (e.set && e.set.length === vals.length && e.set.every(w => vals.some(v => close(v, w)))) return { s: 'ko', pts: 0, t: 'Faux', m: e.m };
      return { s: 'ko', pts: 0, t: 'Faux', m: q.hint || 'Résous chaque cas séparément et vérifie en remplaçant x.' };
    }

    let ast;
    try { ast = parse(r); } catch (e) {
      return { s: 'ko', pts: 0, t: 'Écriture non reconnue', m: 'Vérifie les parenthèses et les signes. Exemples d’écriture : 3/4 ; 2x + 1 ; 9π ; 3,5.' };
    }
    if (!q.f && has(ast, 'v')) return { s: 'ko', pts: 0, t: 'Faux', m: 'La réponse attendue est un nombre, sans lettre.' };

    let v = q.f ? NaN : ev(ast, {});
    // Conversion d'une unité équivalente (2,5 m = 250 cm)
    let unitNote = '';
    if (q.unit && unit && unit !== q.unit && UNITS[unit] && UNITS[q.unit] && UNITS[unit][0] === UNITS[q.unit][0]) {
      v = v * UNITS[unit][1] / UNITS[q.unit][1]; unitNote = 'conv';
    }
    let eq;
    if (q.f) eq = equalVal(ast, q);
    else if (q.round != null) {
      const target = roundTo(q.v, q.round);
      eq = close(v, target, 1e-9) || close(v, q.v, 1e-9);
      if (!eq && Math.abs(v - q.v) < Math.pow(10, -q.round)) {
        return { s: 'part', pts: pts / 2, t: 'Arrondi incorrect', m: `Le résultat est presque juste, mais la consigne demande un arrondi ${['à l’unité', 'au dixième', 'au centième', 'au millième'][q.round]}. Regarde le chiffre suivant pour arrondir.` };
      }
    } else eq = close(v, q.v, q.tol || 1e-9);

    if (eq) {
      if (q.form) { const fc = formCheck(q.form, ast); if (!fc.ok) return { s: 'part', pts: pts / 2, t: fc.t, m: fc.m }; }
      if (q.unit) {
        if (!unit) return { s: 'part', pts: pts / 2, t: 'Juste, mais l’unité manque', m: `Le résultat s’exprime en ${q.unit}. Choisis l’unité.` };
        if (unit !== q.unit && !unitNote) return { s: 'part', pts: pts / 2, t: 'Juste, mais l’unité est fausse', m: `Ce résultat s’exprime en ${q.unit}, pas en ${unit}.` };
      }
      return { s: 'ok', pts, t: 'Juste', m: unitNote ? 'Juste, avec une unité équivalente.' : (q.okm || '') };
    }
    if (q.unit && unit && UNITS[unit] && UNITS[q.unit] && UNITS[unit][0] !== UNITS[q.unit][0] && close(ev(ast, {}), q.v, 1e-9))
      return { s: 'part', pts: pts / 2, t: 'Juste, mais l’unité est fausse', m: `Ce résultat s’exprime en ${q.unit}, pas en ${unit}.` };
    if (!q.f && q.approx && Math.abs(v - q.v) < 0.01 * Math.abs(q.v)) return { s: 'part', pts: pts / 2, t: 'Valeur approchée', m: q.approx };
    for (const e of q.errs || []) {
      if (e.f ? SAMPLES.every(x => close(ev(ast, { x }), e.f(x), 1e-7)) : (e.v !== undefined && close(v, e.v, 1e-9))) return { s: 'ko', pts: 0, t: 'Faux', m: e.m };
    }
    return { s: 'ko', pts: 0, t: 'Faux', m: q.hint || 'Relis la consigne et reprends ton calcul étape par étape.' };
  }

  G.M = { setSeed, rnd, R, pick, nz, sgn, shuffle, gcd, isPrime, roundTo, parse, ev, val, close, has, isInt, terms, degree, formCheck, grade, splitUnit, UNITS };
})(typeof window !== 'undefined' ? window : globalThis);
