/* =====================================================================
   Cap Brevet – banque de questions (mathématiques, cycle 4)
   Chaque notion contient des générateurs paramétrés. Un générateur reçoit
   le niveau (1 Novice, 2 Débrouillé(e), 3 Averti(e), 4 Expert(e)) et tire
   ses valeurs au hasard (graine reproductible). Il renvoie une question :
   énoncé, réponse attendue, forme exigée, indices, correction, erreurs
   fréquentes. Les réponses sont vérifiées par les tests automatiques.
   ===================================================================== */
(function (G) {
  'use strict';
  const { R, pick, nz, sgn, shuffle, gcd, isPrime, roundTo } = G.M;

  /* ---------- Affichage ---------- */
  function plain(x) { // nombre sans notation scientifique, au plus 10 décimales
    let r = roundTo(x, 10); let s = Math.abs(r).toFixed(10).replace(/\.?0+$/, '');
    return (r < 0 ? '-' : '') + s;
  }
  function n(x) { // nombre à la française : 1 250,5 et −3
    if (!Number.isFinite(x)) return '?';
    const s = plain(x); const neg = s[0] === '-'; let [i, d] = s.replace('-', '').split('.');
    if (i.length > 4) i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (neg ? '−' : '') + i + (d ? ',' + d : '');
  }
  const a = x => plain(x).replace('.', ',');               // réponse attendue (format de saisie)
  const p = x => (x < 0 ? `(${n(x)})` : n(x));              // nombre entre parenthèses s'il est négatif
  const F = (u, v) => { if (typeof u !== 'number' || typeof v !== 'number') return `<span class="frac"><span>${u}</span><span>${v}</span></span>`; const neg = (u < 0) !== (v < 0) && u !== 0; return `${neg ? '−' : ''}<span class="frac"><span>${Math.abs(u)}</span><span>${Math.abs(v)}</span></span>`; };
  function red(u, v) { const g = gcd(u, v) || 1; let x = u / g, y = v / g; if (y < 0) { x = -x; y = -y; } return [x, y]; }
  const FR = (u, v) => { const [x, y] = red(u, v); return y === 1 ? n(x) : F(x, y); };
  const fa = (u, v) => { const [x, y] = red(u, v); return y === 1 ? String(x) : `${x}/${y}`; };
  const M_ = s => `<span class="math">${s}</span>`;
  // Polynômes : coefs du plus haut degré au plus bas
  function poly(c, v = 'x', ascii = false) {
    const deg = c.length - 1; let out = '';
    c.forEach((k, i) => {
      const d = deg - i; if (!k) return;
      const neg = k < 0, ab = Math.abs(k);
      const coef = (ab === 1 && d > 0) ? '' : (ascii ? plain(ab) : n(ab));
      const varp = d === 0 ? '' : d === 1 ? v : (ascii ? `${v}^${d}` : `${v}${d === 2 ? '²' : '³'}`);
      if (!out) out = (neg ? (ascii ? '-' : '−') : '') + coef + varp;
      else out += ascii ? (neg ? '-' : '+') + coef + varp : (neg ? ' − ' : ' + ') + coef + varp;
    });
    return out || '0';
  }
  const lin = (k, b, v) => poly([k, b], v);
  const linA = (k, b) => poly([k, b], 'x', true);
  const TRI = ['ABC', 'DEF', 'RST', 'MNP', 'IJK', 'EFG', 'KLM', 'GHI', 'UVW'];

  /* ---------- Figures (SVG) ---------- */
  function rightTri(P, Q, S, lab, ang) { // angle droit en Q ; P en haut, S à droite
    const A = { P: [50, 30], Q: [50, 140], S: [220, 140] };
    const arc = ang === 'S' ? `<path d="M190,140 A30,30 0 0 0 194.6,124" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--sun)"/>` :
      ang === 'P' ? `<path d="M50,60 A30,30 0 0 0 74.6,47.4" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--sun)"/>` : '';
    return `<div class="fig"><svg viewBox="0 0 260 175" role="img" aria-label="Triangle ${P}${Q}${S} rectangle en ${Q}">
      <polygon points="50,30 50,140 220,140" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--accent)"/>
      <polyline points="50,124 66,124 66,140" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--muted)"/>${arc}
      <text x="36" y="30">${P}</text><text x="34" y="158">${Q}</text><text x="226" y="158">${S}</text>
      <text x="4" y="90">${lab.PQ || ''}</text><text x="112" y="164">${lab.QS || ''}</text><text x="142" y="78">${lab.PS || ''}</text></svg>
      <span class="small muted">La figure n'est pas à l'échelle.</span></div>`;
  }
  function thalesFig(L) { // L = [A,B,C,M,N] ; M sur [AB], N sur [AC]
    return `<div class="fig"><svg viewBox="0 0 270 180" role="img" aria-label="Triangle ${L[0]}${L[1]}${L[2]} avec ${L[3]} sur [${L[0]}${L[1]}] et ${L[4]} sur [${L[0]}${L[2]}], droites (${L[3]}${L[4]}) et (${L[1]}${L[2]}) parallèles">
      <polygon points="130,22 30,160 240,160" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--accent)"/>
      <line x1="85" y1="98" x2="179" y2="98" stroke="currentColor" stroke-width="2.5" style="color:var(--sun)"/>
      <text x="124" y="16">${L[0]}</text><text x="14" y="172">${L[1]}</text><text x="244" y="172">${L[2]}</text><text x="66" y="98">${L[3]}</text><text x="186" y="98">${L[4]}</text></svg>
      <span class="small muted">La figure n'est pas à l'échelle.</span></div>`;
  }
  function papillonFig(L) { // L=[A,B,C,D,E] ; B,A,D alignés ; C,A,E alignés ; (BC)//(DE)
    return `<div class="fig"><svg viewBox="0 0 260 175" role="img" aria-label="Configuration papillon : points ${L[1]}, ${L[0]}, ${L[3]} alignés, points ${L[2]}, ${L[0]}, ${L[4]} alignés, droites (${L[1]}${L[2]}) et (${L[3]}${L[4]}) parallèles">
      <line x1="40" y1="30" x2="184" y2="129" stroke="currentColor" stroke-width="2.5" style="color:var(--accent)"/>
      <line x1="160" y1="30" x2="88" y2="129" stroke="currentColor" stroke-width="2.5" style="color:var(--accent)"/>
      <line x1="40" y1="30" x2="160" y2="30" stroke="currentColor" stroke-width="2.5" style="color:var(--sun)"/>
      <line x1="88" y1="129" x2="184" y2="129" stroke="currentColor" stroke-width="2.5" style="color:var(--sun)"/>
      <text x="26" y="26">${L[1]}</text><text x="166" y="26">${L[2]}</text><text x="104" y="92">${L[0]}</text><text x="190" y="146">${L[3]}</text><text x="72" y="146">${L[4]}</text></svg>
      <span class="small muted">La figure n'est pas à l'échelle.</span></div>`;
  }
  function graphFig(k, b) { // droite y = kx + b dans un repère de −5 à 5
    const X = x => 130 + x * 22, Y = y => 130 - y * 22; let grid = '';
    for (let i = -5; i <= 5; i++) {
      grid += `<line x1="${X(i)}" y1="${Y(5.5)}" x2="${X(i)}" y2="${Y(-5.5)}" stroke="var(--line)"/><line x1="${X(-5.5)}" y1="${Y(i)}" x2="${X(5.5)}" y2="${Y(i)}" stroke="var(--line)"/>`;
      if (i) grid += `<text x="${X(i)}" y="${Y(0) + 13}" text-anchor="middle" style="font-size:9px">${i < 0 ? '−' + -i : i}</text><text x="${X(0) - 4}" y="${Y(i) + 3}" text-anchor="end" style="font-size:9px">${i < 0 ? '−' + -i : i}</text>`;
    }
    return `<div class="fig"><svg viewBox="0 0 260 260" role="img" aria-label="Représentation graphique de la fonction f, une droite">
      ${grid}<line x1="${X(-5.5)}" y1="${Y(0)}" x2="${X(5.5)}" y2="${Y(0)}" stroke="var(--muted)" stroke-width="1.5"/><line x1="${X(0)}" y1="${Y(-5.5)}" x2="${X(0)}" y2="${Y(5.5)}" stroke="var(--muted)" stroke-width="1.5"/>
      <line x1="${X(-6)}" y1="${Y(-6 * k + b)}" x2="${X(6)}" y2="${Y(6 * k + b)}" stroke="currentColor" stroke-width="2.5" style="color:var(--accent)"/>
      <text x="${X(0) - 6}" y="${Y(0) + 13}" text-anchor="end" style="font-size:9px">0</text></svg>
      <span class="small muted">Chaque carreau mesure 1 unité.</span></div>`;
  }
  // Blocs de programmation (style « blocs » du collège)
  const SB = (k, t) => `<div class="sb sb-${k}">${t}</div>`;
  const SBloop = (head, inner) => `<div class="sb sb-ctl">${head}<div class="sb-in">${inner}</div><div class="sb-end"></div></div>`;
  const SBif = (cond, a1, a2) => `<div class="sb sb-ctl">si ${cond} alors<div class="sb-in">${a1}</div>sinon<div class="sb-in">${a2}</div><div class="sb-end"></div></div>`;
  const script = inner => `<div class="script" role="img" aria-label="Programme en blocs">${inner}</div>`;
  const table = (rows) => `<div class="tbl"><table class="res-table vt">${rows.map((r, i) => `<tr>${r.map(c => i === 0 || false ? `<th>${c}</th>` : `<td>${c}</td>`).join('')}</tr>`).join('')}</table></div>`;
  const htable = (h1, r1, h2, r2) => `<div class="tbl"><table class="res-table vt"><tr><th>${h1}</th>${r1.map(c => `<td class="num">${c}</td>`).join('')}</tr><tr><th>${h2}</th>${r2.map(c => `<td class="num">${c}</td>`).join('')}</tr></table></div>`;

  const H = (...h) => h; // indices : piste, méthode, exemple proche
  const errsF = (v, list) => list.filter(e => e.v === undefined || Math.abs(e.v - v) > 1e-9);
  const YN = ['Oui', 'Non'];

  /* =====================================================================
     NOMBRES ET CALCULS
     ===================================================================== */
  const calc = {
    id: 'calc', name: 'Nombres relatifs et priorités', dom: 'nc', cls: '5e',
    flash: `<b>L'essentiel.</b> Deux nombres de même signe ont un produit positif ; de signes contraires, un produit négatif. Soustraire un nombre, c'est ajouter son opposé.<br><b>Priorités.</b> D'abord les parenthèses, puis les puissances, puis × et ÷, enfin + et −, de gauche à droite.<br><b>Exemple.</b> 5 − 2 × (−3) = 5 + 6 = 11.<br><b>Piège.</b> 5 − 2 × 3 ne vaut pas 3 × 3 : la multiplication passe avant.`,
    gens: [
      { id: 'rel-add', lv: [1, 2], auto: true, f(L) {
        const x = nz(-20, 20), y = nz(-20, 20), op = pick(['+', '−']);
        if (L === 1) {
          const v = op === '+' ? x + y : x - y;
          return { html: `Calculer : ${M_(`${n(x)} ${op} ${p(y)}`)}`, v, ans: a(v), corr: `${n(x)} ${op} ${p(y)} = ${op === '−' ? `${n(x)} + ${p(-y)} = ` : ''}${n(v)}`,
            errs: errsF(v, [{ v: op === '+' ? x - y : x + y, m: 'Attention aux signes : soustraire un nombre, c’est ajouter son opposé.' }, { v: -v, m: 'Le signe du résultat est faux. Compare les distances à zéro pour trouver le signe.' }]),
            hints: H('Repère le signe de chaque nombre.', 'Soustraire un nombre, c’est ajouter son opposé : a − (−b) = a + b.', 'Exemple : −7 + 3 = −4 et 5 − (−2) = 5 + 2 = 7.') };
        }
        const z = nz(-15, 15), v = x + y - z;
        return { html: `Calculer : ${M_(`${n(x)} + ${p(y)} − ${p(z)}`)}`, v, ans: a(v), corr: `${n(x)} + ${p(y)} − ${p(z)} = ${n(x + y)} + ${p(-z)} = ${n(v)}`,
          errs: errsF(v, [{ v: x + y + z, m: 'Soustraire un nombre, c’est ajouter son opposé : − (' + n(z) + ') devient + ' + p(-z) + '.' }]),
          hints: H('Calcule de gauche à droite.', 'Transforme chaque soustraction en addition de l’opposé.', 'Exemple : 4 + (−6) − (−3) = 4 − 6 + 3 = 1.') };
      } },
      { id: 'rel-mul', lv: [1, 2], auto: true, f(L) {
        const x = nz(-12, 12), y = nz(-12, 12);
        if (L === 1 || R(0, 1)) {
          const v = x * y;
          return { html: `Calculer : ${M_(`${n(x)} × ${p(y)}`)}`, v, ans: a(v), corr: `Les signes sont ${(x < 0) === (y < 0) ? 'identiques : le produit est positif' : 'contraires : le produit est négatif'}. ${n(x)} × ${p(y)} = ${n(v)}`,
            errs: errsF(v, [{ v: -v, m: 'Revois la règle des signes : deux nombres de même signe donnent un produit positif.' }]),
            hints: H('Commence par le signe du résultat.', 'Même signe : positif. Signes contraires : négatif. Puis multiplie les distances à zéro.', 'Exemple : (−4) × (−5) = 20 et (−4) × 5 = −20.') };
        }
        const dvd = x * y, v = x;
        return { html: `Calculer : ${M_(`${n(dvd)} ÷ ${p(y)}`)}`, v, ans: a(v), corr: `${n(dvd)} ÷ ${p(y)} = ${n(v)} (règle des signes comme pour le produit).`,
          errs: errsF(v, [{ v: -v, m: 'La règle des signes de la division est la même que celle de la multiplication.' }]),
          hints: H('Commence par le signe du résultat.', 'Même signe : positif. Signes contraires : négatif.', 'Exemple : (−20) ÷ 4 = −5.') };
      } },
      { id: 'prio', lv: [2, 3, 4], auto: true, f(L) {
        if (L === 2) {
          const x = R(2, 15), y = R(2, 9), z = R(2, 9), v = x + y * z;
          return { html: `Calculer : ${M_(`${x} + ${y} × ${z}`)}`, v, ans: a(v), corr: `La multiplication est prioritaire : ${x} + ${y} × ${z} = ${x} + ${y * z} = ${v}`,
            errs: errsF(v, [{ v: (x + y) * z, m: 'La multiplication est prioritaire sur l’addition : calcule d’abord ' + y + ' × ' + z + '.' }]),
            hints: H('Quelle opération est prioritaire ?', 'Effectue d’abord les multiplications, puis les additions.', 'Exemple : 2 + 3 × 4 = 2 + 12 = 14.') };
        }
        if (L === 3) {
          const x = R(2, 20), y = R(2, 6), c = R(1, 9), d = R(2, 12), v = x - y * (c - d);
          return { html: `Calculer : ${M_(`${x} − ${y} × (${c} − ${d})`)}`, v, ans: a(v), corr: `${x} − ${y} × (${n(c - d)}) = ${x} − ${p(y * (c - d))} = ${n(v)}`,
            errs: errsF(v, [{ v: (x - y) * (c - d), m: 'On ne calcule pas de gauche à droite : la multiplication passe avant la soustraction.' }, { v: x + y * (c - d), m: 'Attention au signe : on soustrait un produit négatif.' }]),
            hints: H('Commence par la parenthèse.', 'Ordre : parenthèses, multiplication, puis soustraction.', 'Exemple : 10 − 2 × (3 − 5) = 10 − 2 × (−2) = 10 + 4 = 14.') };
        }
        const x = R(2, 5), b = R(1, 6), c = R(b + 1, b + 5), d = R(2, 20), v = x * (b - c) ** 2 - d;
        return { html: `Calculer : ${M_(`${x} × (${b} − ${c})² − ${d}`)}`, v, ans: a(v), corr: `${b} − ${c} = ${n(b - c)}, puis (${n(b - c)})² = ${(b - c) ** 2}. Donc ${x} × ${(b - c) ** 2} − ${d} = ${n(v)}`,
          errs: errsF(v, [{ v: -x * (b - c) ** 2 - d, m: 'Le carré d’un nombre négatif est positif.' }, { v: (x * (b - c)) ** 2 - d, m: 'Le carré ne porte que sur la parenthèse, pas sur ' + x + '.' }]),
          hints: H('Commence par la parenthèse, puis la puissance.', 'Ordre : parenthèses, puissances, multiplication, soustraction.', 'Exemple : 2 × (1 − 4)² = 2 × 9 = 18.') };
      } },
      { id: 'rel-cmp', lv: [1], auto: false, f() {
        const base = shuffle([R(-9, -1) - 0.5 * R(0, 1), R(1, 9), R(-9, -1), R(0, 9) + 0.5]);
        const vals = [...new Set(base.map(x => roundTo(x, 1)))]; while (vals.length < 4) vals.push(R(10, 20));
        const mn = Math.min(...vals), correct = vals.indexOf(mn);
        return { type: 'qcm', html: 'Quel est le plus petit de ces nombres ?', choices: vals.map(n), correct, ans: String(correct),
          corr: `Le plus petit est ${n(mn)} : parmi les nombres négatifs, le plus petit est celui qui est le plus loin de zéro.`,
          hints: H('Place les nombres sur une droite graduée.', 'Un nombre négatif est toujours plus petit qu’un nombre positif.', 'Exemple : −7 < −2 < 0 < 3.') };
      } }
    ]
  };

  const frac = {
    id: 'frac', name: 'Fractions', dom: 'nc', cls: '5e-4e',
    flash: `<b>Simplifier.</b> On divise le numérateur et le dénominateur par un même nombre.<br><b>Additionner.</b> On met au même dénominateur, puis on additionne les numérateurs : ${F(1, 4)} + ${F(2, 3)} = ${F(3, 12)} + ${F(8, 12)} = ${F(11, 12)}.<br><b>Multiplier.</b> Numérateurs entre eux, dénominateurs entre eux. <b>Diviser</b> par une fraction, c'est multiplier par son inverse.<br><b>Piège.</b> ${F(1, 2)} + ${F(1, 3)} n'est pas égal à ${F(2, 5)}.`,
    gens: [
      { id: 'fr-simp', lv: [1, 2], auto: true, f(L) {
        let d0, n0; do { d0 = R(2, L === 1 ? 9 : 15); n0 = R(1, d0 + (L === 1 ? -1 : 6)); } while (gcd(n0, d0) !== 1 || n0 === d0);
        const k = L === 1 ? R(2, 6) : R(4, 12);
        return { html: `Écrire ${F(n0 * k, d0 * k)} sous forme de fraction irréductible.`, v: n0 / d0, form: 'irr', ans: fa(n0, d0),
          corr: `On divise le numérateur et le dénominateur par ${k} : ${F(n0 * k, d0 * k)} = ${F(n0, d0)}`,
          hints: H(`Cherche un diviseur commun à ${n0 * k} et à ${d0 * k}.`, 'Divise le numérateur et le dénominateur par le même nombre, jusqu’à ne plus pouvoir.', 'Exemple : 12/18 = 6/9 = 2/3.') };
      } },
      { id: 'fr-add', lv: [1, 2, 3], auto: true, f(L) {
        let d1, d2;
        if (L === 1) { d1 = d2 = R(3, 12); } else if (L === 2) { d1 = R(2, 6); d2 = d1 * R(2, 4); } else { do { d1 = R(2, 7); d2 = R(2, 9); } while (gcd(d1, d2) !== 1); }
        const n1 = R(1, d1 + 2), n2 = R(1, d2 + 2), op = L === 1 ? '+' : pick(['+', '−']);
        const num = op === '+' ? n1 * (d2 / gcd(d1, d2)) * 1 : 0; // calcul exact ci-dessous
        const D = d1 * d2 / gcd(d1, d2), N1 = n1 * D / d1, N2 = n2 * D / d2, NN = op === '+' ? N1 + N2 : N1 - N2;
        const v = NN / D;
        return { html: `Calculer et donner le résultat sous forme de fraction irréductible :<br>${M_(`${F(n1, d1)} ${op} ${F(n2, d2)}`)}`, v, form: 'irr', ans: fa(NN, D),
          corr: `${F(n1, d1)} ${op} ${F(n2, d2)} = ${d1 !== D ? F(N1, D) : F(n1, d1)} ${op} ${d2 !== D ? F(N2, D) : F(n2, d2)} = ${F(NN, D)}${gcd(NN, D) > 1 ? ' = ' + FR(NN, D) : ''}`,
          errs: errsF(v, d1 !== d2 ? [{ v: op === '+' ? (n1 + n2) / (d1 + d2) : (d1 - d2 ? (n1 - n2) / (d1 - d2) : NaN), m: 'On n’additionne pas les dénominateurs. Mets d’abord les deux fractions au même dénominateur.' }] : [{ v: (n1 + n2) / (2 * d1), m: 'Quand les dénominateurs sont égaux, on garde le dénominateur commun.' }]),
          hints: H(d1 === d2 ? 'Les dénominateurs sont déjà égaux.' : `Cherche un dénominateur commun à ${d1} et à ${d2}.`, 'Écris les deux fractions avec ce dénominateur, puis additionne (ou soustrais) les numérateurs. Simplifie à la fin.', 'Exemple : 1/2 + 1/6 = 3/6 + 1/6 = 4/6 = 2/3.') };
      } },
      { id: 'fr-mul', lv: [2, 3], auto: true, f(L) {
        const n1 = R(1, 9), d1 = R(2, 9), n2 = R(1, 9), d2 = R(2, 9);
        if (L === 2) {
          const v = n1 * n2 / (d1 * d2);
          return { html: `Calculer et donner le résultat sous forme de fraction irréductible :<br>${M_(`${F(n1, d1)} × ${F(n2, d2)}`)}`, v, form: 'irr', ans: fa(n1 * n2, d1 * d2),
            corr: `${F(n1, d1)} × ${F(n2, d2)} = ${F(n1 * n2, d1 * d2)}${gcd(n1 * n2, d1 * d2) > 1 ? ' = ' + FR(n1 * n2, d1 * d2) : ''}`,
            errs: errsF(v, [{ v: (n1 * d2) / (d1 * n2), m: 'Pour multiplier, on multiplie les numérateurs entre eux et les dénominateurs entre eux.' }]),
            hints: H('Pas besoin de dénominateur commun pour multiplier.', 'Multiplie les numérateurs entre eux et les dénominateurs entre eux, puis simplifie.', 'Exemple : 2/3 × 3/4 = 6/12 = 1/2.') };
        }
        const v = (n1 / d1) / (n2 / d2);
        return { html: `Calculer et donner le résultat sous forme de fraction irréductible :<br>${M_(`${F(n1, d1)} ÷ ${F(n2, d2)}`)}`, v, form: 'irr', ans: fa(n1 * d2, d1 * n2),
          corr: `Diviser par ${F(n2, d2)}, c'est multiplier par ${F(d2, n2)} : ${F(n1, d1)} × ${F(d2, n2)} = ${F(n1 * d2, d1 * n2)}${gcd(n1 * d2, d1 * n2) > 1 ? ' = ' + FR(n1 * d2, d1 * n2) : ''}`,
          errs: errsF(v, [{ v: (n1 * n2) / (d1 * d2), m: 'Diviser par une fraction, c’est multiplier par son inverse : on retourne la deuxième fraction.' }]),
          hints: H('Que signifie diviser par une fraction ?', 'Multiplie par l’inverse de la deuxième fraction, puis simplifie.', 'Exemple : 2/3 ÷ 4/5 = 2/3 × 5/4 = 10/12 = 5/6.') };
      } },
      { id: 'fr-of', lv: [1, 2], auto: true, f(L) {
        let nn, d; do { d = R(2, 8); nn = R(1, d - 1); } while (gcd(nn, d) !== 1);
        if (L === 1) {
          const Q = d * R(2, 12), v = Q / d * nn;
          return { html: `Calculer ${F(nn, d)} de ${Q}.`, v, ans: a(v), corr: `${Q} ÷ ${d} = ${Q / d}, puis ${Q / d} × ${nn} = ${v}`,
            errs: errsF(v, [{ v: Q / d, m: 'Tu as calculé ' + F(1, d) + ' de ' + Q + '. Il faut encore multiplier par ' + nn + '.' }]),
            hints: H('Commence par diviser par le dénominateur.', `Prendre ${F(nn, d)} d’une quantité : diviser par ${d}, puis multiplier par ${nn}.`, 'Exemple : 3/4 de 20 = 20 ÷ 4 × 3 = 15.') };
        }
        const ctx = pick([['Dans un collège de', 'élèves,', 'sont demi-pensionnaires. Combien d’élèves sont demi-pensionnaires ?', 'élèves'], ['Un club de sport compte', 'adhérents.', 'pratiquent la compétition. Combien d’adhérents font de la compétition ?', 'adhérents'], ['Une bibliothèque possède', 'livres.', 'sont des romans. Combien y a-t-il de romans ?', 'livres']]);
        const Q = d * R(10, 80), v = Q / d * nn;
        return { html: `${ctx[0]} <b>${n(Q)}</b> ${ctx[1]} Les ${F(nn, d)} ${ctx[2]}`, v, ans: a(v), corr: `${n(Q)} ÷ ${d} × ${nn} = ${n(v)} ${ctx[3]}.`,
          errs: errsF(v, [{ v: Q / d, m: 'Tu as calculé ' + F(1, d) + ' de l’effectif. Multiplie encore par ' + nn + '.' }]),
          hints: H('Il s’agit de prendre une fraction d’une quantité.', `Divise par ${d}, puis multiplie par ${nn}.`, 'Exemple : 2/5 de 300 = 300 ÷ 5 × 2 = 120.') };
      } },
      { id: 'fr-pb', lv: [3, 4], auto: false, f(L) {
        const b = pick([3, 4, 5, 6]), aa = R(1, b - 1), dd = pick([2, 3, 4, 5]), cc = R(1, dd - 1);
        const restN = (b - aa) * (dd - cc), restD = b * dd, who = pick(['Léa', 'Noah', 'Inès', 'Yanis', 'Jade', 'Adam']);
        const it = pick([['un livre', 'un jeu vidéo'], ['une place de concert', 'des vêtements'], ['un cadeau', 'une sortie au cinéma']]);
        const base = `${who} dépense ${F(aa, b)} de son argent de poche pour ${it[0]}, puis ${F(cc, dd)} de ce qui lui reste pour ${it[1]}.`;
        const corrBase = `Après le premier achat, il reste 1 − ${F(aa, b)} = ${FR(b - aa, b)}. Le deuxième achat coûte ${F(cc, dd)} × ${FR(b - aa, b)} = ${FR(cc * (b - aa), dd * b)}. Il reste ${FR(b - aa, b)} − ${FR(cc * (b - aa), dd * b)} = ${FR(restN, restD)}.`;
        if (L === 3) return { html: base + '<br>Quelle fraction de son argent de poche lui reste-t-il ? Donner une fraction irréductible.', v: restN / restD, form: 'irr', ans: fa(restN, restD), corr: corrBase,
          errs: errsF(restN / restD, [{ v: 1 - aa / b - cc / dd, m: `${F(cc, dd)} porte sur ce qui reste, pas sur tout l’argent de poche.` }]),
          hints: H('Calcule d’abord la fraction qui reste après le premier achat.', `Le deuxième achat représente ${F(cc, dd)} du reste : multiplie les fractions.`, 'Exemple : 1/2 puis 1/3 du reste : il reste 1/2 × 2/3 = 1/3.') };
        const X = restD * R(2, 8), v = X * restN / restD;
        return { html: base + `<br>Elle avait <b>${X} €</b>. Combien d’euros lui reste-t-il ?`, v, suffix: '€', ans: a(v), corr: corrBase + ` Donc ${FR(restN, restD)} × ${X} = ${n(v)} €.`,
          errs: errsF(v, [{ v: X * (1 - aa / b - cc / dd), m: `${F(cc, dd)} porte sur ce qui reste après le premier achat, pas sur ${X} €.` }]),
          hints: H('Calcule d’abord combien coûte le premier achat.', 'Calcule ce qui reste, puis la fraction de ce reste dépensée ensuite.', '') };
      } },
      { id: 'fr-prio', lv: [3, 4], auto: true, f() {
        const n1 = R(1, 5), d1 = R(2, 6), n2 = R(1, 7), d2 = R(2, 7), n3 = R(1, 7), d3 = R(2, 7);
        const pN = n2 * n3, pD = d2 * d3, D = d1 * pD, N = n1 * pD + pN * d1, v = N / D;
        return { html: `Calculer et donner le résultat sous forme de fraction irréductible :<br>${M_(`${F(n1, d1)} + ${F(n2, d2)} × ${F(n3, d3)}`)}`, v, form: 'irr', ans: fa(N, D),
          corr: `La multiplication est prioritaire : ${F(n2, d2)} × ${F(n3, d3)} = ${FR(pN, pD)}. Puis ${F(n1, d1)} + ${FR(pN, pD)} = ${FR(N, D)}.`,
          errs: errsF(v, [{ v: (n1 / d1 + n2 / d2) * n3 / d3, m: 'La multiplication est prioritaire sur l’addition.' }]),
          hints: H('Quelle opération faut-il faire en premier ?', 'Calcule d’abord le produit, puis ajoute en mettant au même dénominateur.', 'Exemple : 1/2 + 1/3 × 3/4 = 1/2 + 1/4 = 3/4.') };
      } }
    ]
  };

  const pui = {
    id: 'pui', name: 'Puissances et notation scientifique', dom: 'nc', cls: '4e',
    flash: `<b>Définition.</b> aⁿ = a × a × … × a (n facteurs). 10⁻ⁿ = 0,0…01 (n chiffres après la virgule).<br><b>Règles avec 10.</b> 10ᵐ × 10ⁿ = 10ᵐ⁺ⁿ ; 10ᵐ ÷ 10ⁿ = 10ᵐ⁻ⁿ ; (10ᵐ)ⁿ = 10ᵐˣⁿ.<br><b>Notation scientifique.</b> a × 10ⁿ avec 1 ≤ a < 10. Exemple : 34 500 = 3,45 × 10⁴.<br><b>Piège.</b> (−3)² = 9 mais −3² = −9.`,
    gens: [
      { id: 'pw-calc', lv: [1, 2], auto: true, f(L) {
        if (L === 1) {
          const b = R(2, 5), e = b <= 3 ? R(2, 4) : R(2, 3), v = b ** e;
          return { html: `Calculer : ${M_(`${b}<sup>${e}</sup>`)}`, v, ans: a(v), corr: `${b}<sup>${e}</sup> = ${Array(e).fill(b).join(' × ')} = ${v}`,
            errs: errsF(v, [{ v: b * e, m: `${b}<sup>${e}</sup> ne veut pas dire ${b} × ${e}, mais ${b} multiplié ${e} fois par lui-même.` }]),
            hints: H('Que veut dire l’exposant ?', 'Écris le produit de facteurs égaux, puis calcule.', 'Exemple : 2⁴ = 2 × 2 × 2 × 2 = 16.') };
        }
        const b = R(2, 6), e = pick([2, 3]), par = R(0, 1), v = par ? (-b) ** e : -(b ** e);
        return { html: `Calculer : ${M_(par ? `(−${b})<sup>${e}</sup>` : `−${b}<sup>${e}</sup>`)}`, v, ans: a(v),
          corr: par ? `(−${b})<sup>${e}</sup> = ${Array(e).fill(`(−${b})`).join(' × ')} = ${n(v)}` : `L’exposant ne porte que sur ${b} : −${b}<sup>${e}</sup> = −(${Array(e).fill(b).join(' × ')}) = ${n(v)}`,
          errs: errsF(v, [{ v: -v, m: par ? 'Le signe moins est dans la parenthèse : il est lui aussi élevé à la puissance.' : 'Sans parenthèse, l’exposant ne porte que sur le nombre, pas sur le signe moins.' }]),
          hints: H('Regarde s’il y a des parenthèses autour du nombre négatif.', '(−a)ⁿ : le signe est élevé à la puissance. −aⁿ : seul a est élevé à la puissance.', 'Exemple : (−3)² = 9 et −3² = −9.') };
      } },
      { id: 'pw-10', lv: [1, 2, 3], auto: true, f(L) {
        if (L === 1) {
          const e = R(0, 1) ? R(2, 6) : -R(1, 4), v = 10 ** e;
          return { html: `Écrire ${M_(`10<sup>${e < 0 ? '−' + -e : e}</sup>`)} sous forme d’un nombre décimal.`, v, ans: a(v), corr: `10<sup>${e < 0 ? '−' + -e : e}</sup> = ${n(v)}`,
            errs: errsF(v, [{ v: 10 * e, m: 'Ce n’est pas 10 × ' + e + '. ' + (e > 0 ? 'C’est 1 suivi de ' + e + ' zéros.' : 'C’est ' + -e + ' chiffre(s) après la virgule, le dernier étant 1.') }]),
            hints: H('Compte les zéros.', e > 0 ? '10ⁿ s’écrit 1 suivi de n zéros.' : '10⁻ⁿ s’écrit avec n chiffres après la virgule : 0,0…01.', 'Exemple : 10³ = 1 000 et 10⁻² = 0,01.') };
        }
        let x = R(-5, 7), y = R(-5, 6), html, k, corr, err;
        const E = t => (t < 0 ? '−' + -t : t);
        if (L === 2) { k = x + y; html = `10<sup>${E(x)}</sup> × 10<sup>${E(y)}</sup>`; corr = `10<sup>${E(x)}</sup> × 10<sup>${E(y)}</sup> = 10<sup>${E(x)} + ${p(y)}</sup> = 10<sup>${E(k)}</sup>`; err = x * y; }
        else if (R(0, 1)) { k = x - y; html = `${F(`10<sup>${E(x)}</sup>`, `10<sup>${E(y)}</sup>`)}`; corr = `On soustrait les exposants : 10<sup>${E(x)} − ${p(y)}</sup> = 10<sup>${E(k)}</sup>`; err = x + y; }
        else { x = R(-3, 4) || 2; y = R(2, 3); k = x * y; html = `(10<sup>${E(x)}</sup>)<sup>${y}</sup>`; corr = `On multiplie les exposants : 10<sup>${E(x)} × ${y}</sup> = 10<sup>${E(k)}</sup>`; err = x + y; }
        return { html: `Écrire sous la forme d’une seule puissance de 10 :<br>${M_(html)}`, v: 10 ** k, form: 'p10', ans: `10^${k}`, tol: 1e-9, corr,
          errs: errsF(10 ** k, [{ v: 10 ** err, m: 'Revois la règle : pour un produit on ajoute les exposants, pour un quotient on les soustrait, pour une puissance de puissance on les multiplie.' }]),
          hints: H('Utilise les règles de calcul sur les puissances de 10.', '10ᵐ × 10ⁿ = 10ᵐ⁺ⁿ ; 10ᵐ ÷ 10ⁿ = 10ᵐ⁻ⁿ ; (10ᵐ)ⁿ = 10ᵐˣⁿ.', 'Exemple : 10⁵ × 10⁻² = 10³.'), kbdNote: 'Utilise la touche xⁿ pour écrire 10^5.' };
      } },
      { id: 'pw-sci', lv: [2, 3, 4], auto: true, f(L) {
        const digits = R(2, 3), m = roundTo(R(10 ** (digits - 1), 10 ** digits - 1) / 10 ** (digits - 1), 2);
        let e, html, corr, v;
        if (L === 2) { e = R(3, 7); v = roundTo(m * 10 ** e, 6); html = `Écrire ${M_(n(v))} en notation scientifique.`; corr = `${n(v)} = ${n(m)} × 10<sup>${e}</sup> (on a déplacé la virgule de ${e} rangs).`; }
        else if (L === 3) { e = -R(2, 5); v = roundTo(m * 10 ** e, 10); html = `Écrire ${M_(n(v))} en notation scientifique.`; corr = `${n(v)} = ${n(m)} × 10<sup>−${-e}</sup>`; }
        else {
          const m1 = R(2, 9), e1 = R(-4, 8), m2 = R(2, 9), e2 = R(-6, 6), pr = m1 * m2, ee = e1 + e2 + (pr >= 10 ? 1 : 0), mm = pr >= 10 ? pr / 10 : pr;
          v = pr * 10 ** (e1 + e2); e = ee;
          html = `Calculer et donner le résultat en notation scientifique :<br>${M_(`${m1} × 10<sup>${e1 < 0 ? '−' + -e1 : e1}</sup> × ${m2} × 10<sup>${e2 < 0 ? '−' + -e2 : e2}</sup>`)}`;
          corr = `${m1} × ${m2} = ${pr} et 10<sup>${e1}</sup> × 10<sup>${e2}</sup> = 10<sup>${e1 + e2}</sup>. Donc ${pr} × 10<sup>${e1 + e2}</sup>${pr >= 10 ? ` = ${n(mm)} × 10<sup>${ee}</sup>` : ''}.`;
          return { html, v, form: 'sci', ans: `${a(mm)}*10^${ee}`, tol: 1e-9, corr, hints: H('Calcule séparément les nombres et les puissances de 10.', 'Multiplie les nombres, ajoute les exposants, puis ajuste pour avoir un nombre entre 1 et 10.', 'Exemple : 4 × 10³ × 5 × 10² = 20 × 10⁵ = 2 × 10⁶.') };
        }
        return { html, v, form: 'sci', ans: `${a(m)}*10^${e}`, tol: 1e-9, corr,
          errs: [{ v: v * 100, m: 'L’exposant est faux : compte le nombre de rangs dont la virgule se déplace.' }, { v: v / 100, m: 'L’exposant est faux : compte le nombre de rangs dont la virgule se déplace.' }],
          hints: H('Place la virgule après le premier chiffre non nul.', 'Compte de combien de rangs la virgule s’est déplacée : c’est l’exposant (négatif pour un nombre inférieur à 1).', 'Exemple : 0,0052 = 5,2 × 10⁻³.'), kbdNote: 'Écris par exemple 3,45 × 10^4 avec la touche xⁿ.' };
      } },
      { id: 'pw-ctx', lv: [3, 4], auto: false, calc: true, f() {
        const t = pick([60, 120, 500, 1000, 3600]), v = 3e5 * t, pr = 3 * t, e = 5 + Math.floor(Math.log10(pr)), mm = pr / 10 ** Math.floor(Math.log10(pr));
        const lab = { 60: '1 minute', 120: '2 minutes', 500: '500 secondes (environ le temps entre le Soleil et la Terre)', 1000: '1 000 secondes', 3600: '1 heure' }[t];
        return { html: `La lumière parcourt environ <b>3 × 10<sup>5</sup> km</b> par seconde.<br>Quelle distance parcourt-elle en ${lab} ? Donner le résultat en km, en notation scientifique.`, v, form: 'sci', suffix: 'km', ans: `${a(mm)}*10^${e}`, tol: 1e-9,
          corr: `${lab.split(' (')[0]} = ${n(t)} s. Distance : 3 × 10<sup>5</sup> × ${n(t)} = ${n(v)} km = ${n(mm)} × 10<sup>${e}</sup> km.`,
          errs: [{ v: 3e5 * t / 60, m: 'Convertis la durée en secondes avant de multiplier.' }],
          hints: H('Convertis la durée en secondes.', 'Distance = vitesse × durée. Puis écris le résultat en notation scientifique.', '') };
      } }
    ]
  };

  const arith = {
    id: 'arith', name: 'Arithmétique', dom: 'nc', cls: '5e-3e',
    flash: `<b>Critères de divisibilité.</b> Par 2 : chiffre des unités pair. Par 5 : 0 ou 5. Par 10 : 0. Par 3 (ou 9) : somme des chiffres divisible par 3 (ou 9).<br><b>Nombre premier.</b> Il a exactement deux diviseurs : 1 et lui-même (2, 3, 5, 7, 11, 13…).<br><b>Décomposition.</b> 360 = 2³ × 3² × 5.<br><b>Problèmes de partage.</b> « Le plus grand nombre de lots identiques » : on cherche le plus grand diviseur commun.`,
    gens: [
      { id: 'ar-div', lv: [1, 2], auto: true, f(L) {
        const k = pick([2, 3, 5, 9, 10, 4]); let N = R(L === 1 ? 100 : 1000, L === 1 ? 999 : 9999);
        if (R(0, 1)) N = N - (N % k) + (N - (N % k) < 100 ? k : 0);
        const ok = N % k === 0, sd = String(N).split('').reduce((s, c) => s + +c, 0);
        const why = { 2: `son chiffre des unités, ${N % 10}, ${N % 2 === 0 ? 'est' : 'n’est pas'} pair`, 5: `son chiffre des unités ${N % 5 === 0 ? 'est' : 'n’est pas'} 0 ou 5`, 10: `son chiffre des unités ${N % 10 === 0 ? 'est' : 'n’est pas'} 0`, 3: `la somme de ses chiffres vaut ${sd}, qui ${sd % 3 === 0 ? 'est' : 'n’est pas'} divisible par 3`, 9: `la somme de ses chiffres vaut ${sd}, qui ${sd % 9 === 0 ? 'est' : 'n’est pas'} divisible par 9`, 4: `le nombre formé par ses deux derniers chiffres, ${N % 100}, ${N % 4 === 0 ? 'est' : 'n’est pas'} divisible par 4` }[k];
        return { type: 'qcm', html: `Le nombre ${M_(n(N))} est-il divisible par ${k} ?`, choices: YN, correct: ok ? 0 : 1, ans: ok ? '0' : '1',
          corr: `${ok ? 'Oui' : 'Non'} : ${why}.${ok ? ` ${n(N)} = ${k} × ${n(N / k)}.` : ''}`,
          hints: H('Utilise un critère de divisibilité.', 'Par 2, 5, 10 : regarde le chiffre des unités. Par 3 ou 9 : additionne les chiffres.', 'Exemple : 471 → 4 + 7 + 1 = 12, divisible par 3.') };
      } },
      { id: 'ar-prime', lv: [1, 2], auto: true, f() {
        const pr = pick([11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97]);
        const comp = shuffle([21, 27, 33, 39, 49, 51, 57, 63, 69, 77, 81, 87, 91, 93, 99, 15, 35, 45, 55, 65]).slice(0, 3);
        const ch = shuffle([pr, ...comp]), correct = ch.indexOf(pr);
        const dec = x => { for (let k = 2; k < x; k++) if (x % k === 0) return `${x} = ${k} × ${x / k}`; return ''; };
        return { type: 'qcm', html: 'Lequel de ces nombres est un nombre premier ?', choices: ch.map(String), correct, ans: String(correct),
          corr: `${pr} n’a que deux diviseurs : 1 et ${pr}. Les autres ne sont pas premiers : ${comp.map(dec).join(' ; ')}.`,
          errs: ch.map((c, i) => ({ i, m: c !== pr ? `${c} n’est pas premier : ${dec(c)}.` : '' })).filter(e => e.m),
          hints: H('Un nombre premier n’a que deux diviseurs.', 'Teste la divisibilité par 3, 5, 7.', 'Exemple : 91 = 7 × 13, donc 91 n’est pas premier.') };
      } },
      { id: 'ar-dec', lv: [2, 3, 4], auto: true, f(L) {
        let fs, N; do { fs = Array.from({ length: L === 2 ? 3 : R(4, 5) }, () => pick(L === 2 ? [2, 3, 5] : [2, 2, 3, 3, 5, 7, 11])); N = fs.reduce((x, y) => x * y, 1); } while (N > (L === 2 ? 200 : 2500) || N < 12);
        const cnt = {}; fs.forEach(f => (cnt[f] = (cnt[f] || 0) + 1));
        const ks = Object.keys(cnt).map(Number).sort((x, y) => x - y);
        const disp = ks.map(k => cnt[k] > 1 ? `${k}<sup>${cnt[k]}</sup>` : k).join(' × '), ans = ks.map(k => cnt[k] > 1 ? `${k}^${cnt[k]}` : k).join('*');
        return { html: `Décomposer ${M_(n(N))} en produit de facteurs premiers.`, v: N, form: 'primes', ans, strip: false, corr: `${n(N)} = ${disp}`,
          hints: H('Divise par le plus petit nombre premier possible.', 'Divise successivement par 2, puis 3, 5, 7… jusqu’à obtenir 1.', 'Exemple : 60 = 2 × 30 = 2 × 2 × 15 = 2² × 3 × 5.'), kbdNote: 'Écris le produit avec × ; par exemple 2^3 × 5.' };
      } },
      { id: 'ar-pb', lv: [3, 4], auto: false, f(L) {
        let m, k; do { m = R(2, 9); k = R(2, 9); } while (gcd(m, k) !== 1 || m === k);
        const g = R(4, 15), A = g * m, B = g * k;
        const c = pick([['Un fleuriste a', 'roses', 'tulipes', 'bouquets'], ['Une pâtissière a', 'macarons', 'chouquettes', 'boîtes'], ['Un professeur a', 'crayons', 'gommes', 'lots']]);
        const intro = `${c[0]} <b>${A} ${c[1]}</b> et <b>${B} ${c[2]}</b>. Il veut faire le plus grand nombre possible de ${c[3]} identiques en utilisant tout.`;
        if (L === 3) return { html: intro + `<br>Combien de ${c[3]} peut-il faire ?`, v: g, ans: String(g), corr: `On cherche le plus grand diviseur commun à ${A} et ${B}. ${A} = ${g} × ${m} et ${B} = ${g} × ${k}, avec ${m} et ${k} sans diviseur commun autre que 1. Il peut faire ${g} ${c[3]}.`,
          errs: errsF(g, [{ v: A + B, m: 'Ce n’est pas le nombre total d’objets : on cherche un diviseur commun aux deux quantités.' }]),
          hints: H(`Le nombre de ${c[3]} doit diviser ${A} et ${B}.`, 'Cherche le plus grand diviseur commun aux deux nombres, par exemple avec les décompositions en facteurs premiers.', 'Exemple : 12 et 18 → le plus grand diviseur commun est 6.') };
        return { html: intro + `<br>Combien de ${c[1]} y aura-t-il dans chaque ${c[3].replace(/s$/, '').replace('boîte', 'boîte')} ?`, v: m, ans: String(m), corr: `Le plus grand diviseur commun à ${A} et ${B} est ${g} : il y a ${g} ${c[3]}. Chacun contient ${A} ÷ ${g} = ${m} ${c[1]}.`,
          errs: errsF(m, [{ v: g, m: `${g} est le nombre de ${c[3]}. La question porte sur le contenu de chacun.` }]),
          hints: H(`Trouve d’abord le nombre de ${c[3]}.`, 'Le nombre de lots est le plus grand diviseur commun ; divise ensuite la quantité par ce nombre.', '') };
      } },
      { id: 'ar-eucl', lv: [1, 2], auto: true, f() {
        const b = R(3, 12), q = R(4, 30), r = R(0, b - 1), A = b * q + r;
        return { html: `Quel est le reste de la division euclidienne de ${M_(A)} par ${M_(b)} ?`, v: r, ans: String(r), corr: `${A} = ${b} × ${q} + ${r}, avec ${r} < ${b}. Le reste est ${r}.`,
          errs: errsF(r, [{ v: q, m: `${q} est le quotient. Le reste est ce qu’il reste après avoir retiré ${b} × ${q}.` }]),
          hints: H(`Cherche le plus grand multiple de ${b} inférieur ou égal à ${A}.`, `Écris ${A} = ${b} × q + r avec r < ${b}.`, 'Exemple : 47 = 6 × 7 + 5, le reste est 5.') };
      } }
    ]
  };

  const litt = {
    id: 'litt', name: 'Calcul littéral', dom: 'nc', cls: '4e-3e',
    flash: `<b>Développer.</b> k(a + b) = ka + kb ; (a + b)(c + d) = ac + ad + bc + bd.<br><b>Identités remarquables.</b> (a + b)² = a² + 2ab + b² ; (a − b)² = a² − 2ab + b² ; (a − b)(a + b) = a² − b².<br><b>Factoriser.</b> C'est l'inverse : écrire sous forme de produit. 6x + 9 = 3(2x + 3) ; x² − 25 = (x − 5)(x + 5).<br><b>Piège.</b> (x + 3)² n'est pas égal à x² + 9.`,
    gens: [
      { id: 'li-red', lv: [1, 2], auto: true, f(L) {
        if (L === 1) {
          let k1 = nz(-9, 9), b1 = nz(-9, 9), k2 = nz(-9, 9), b2 = nz(-9, 9); if (k1 + k2 === 0) k2 += 1 + (k2 === -1 ? 1 : 0);
          const K = k1 + k2, B = b1 + b2;
          return { html: `Réduire l’expression : ${M_(`${lin(k1, b1)} ${k2 < 0 ? '−' : '+'} ${lin(Math.abs(k2), 0)} ${b2 < 0 ? '−' : '+'} ${Math.abs(b2)}`)}`, f: x => K * x + B, form: 'red', ans: linA(K, B),
            corr: `On regroupe les x : ${n(k1)} ${k2 < 0 ? '−' : '+'} ${Math.abs(k2)} = ${n(K)}, puis les nombres : ${n(b1)} ${b2 < 0 ? '−' : '+'} ${Math.abs(b2)} = ${n(B)}. Résultat : ${lin(K, B)}`,
            errs: [{ f: x => (K + B) * x, m: 'On ne peut pas ajouter des x et des nombres : regroupe les x d’un côté, les nombres de l’autre.' }],
            hints: H('Regroupe les termes de même nature.', 'Additionne les coefficients des x, puis les nombres seuls.', 'Exemple : 3x + 2 + 5x − 7 = 8x − 5.') };
        }
        let a2 = nz(-6, 6), b2 = nz(-6, 6), a1 = nz(-9, 9), b1 = nz(-9, 9), c = nz(-9, 9); if (a2 + b2 === 0) b2++; if (!b2) b2 = 2;
        const A = a2 + b2, B = a1 + b1;
        return { html: `Réduire l’expression : ${M_(`${poly([a2, a1, c])} ${b2 < 0 ? '−' : '+'} ${poly([Math.abs(b2), 0, 0])} ${b1 < 0 ? '−' : '+'} ${poly([Math.abs(b1), 0])}`)}`, f: x => A * x * x + B * x + c, form: 'red', ans: poly([A, B, c], 'x', true),
          corr: `x² : ${n(a2)} ${b2 < 0 ? '−' : '+'} ${Math.abs(b2)} = ${n(A)} ; x : ${n(a1)} ${b1 < 0 ? '−' : '+'} ${Math.abs(b1)} = ${n(B)}. Résultat : ${poly([A, B, c])}`,
          errs: [{ f: x => (A + B) * x * x + c, m: 'Les termes en x² et les termes en x ne se regroupent pas ensemble.' }],
          hints: H('Repère les termes en x², en x et les nombres.', 'Regroupe chaque famille séparément.', 'Exemple : 2x² + 3x + 4x² − x = 6x² + 2x.') };
      } },
      { id: 'li-sub', lv: [1, 2, 3], auto: true, f(L) {
        if (L === 1) { const k = R(2, 9), b = nz(-9, 9), x = R(1, 8), v = k * x + b;
          return { html: `Calculer ${M_(lin(k, b))} pour ${M_(`x = ${x}`)}.`, v, ans: a(v), corr: `${k} × ${x} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${n(v)}`,
            errs: errsF(v, [{ v: Number(`${k}${x}`) + b, m: `${k}x signifie ${k} × x : remplace x par ${x} et multiplie.` }]),
            hints: H('Remplace x par sa valeur.', `${k}x signifie ${k} × x.`, 'Exemple : pour x = 3, 2x + 1 = 2 × 3 + 1 = 7.') }; }
        const x = -R(1, 5), A = L === 2 ? 1 : R(2, 3), B = nz(-6, 6), C = nz(-9, 9), v = A * x * x + B * x + C;
        return { html: `Calculer ${M_(poly([A, B, C]))} pour ${M_(`x = ${n(x)}`)}.`, v, ans: a(v),
          corr: `${A > 1 ? A + ' × ' : ''}(${n(x)})² ${B < 0 ? '−' : '+'} ${Math.abs(B)} × (${n(x)}) ${C < 0 ? '−' : '+'} ${Math.abs(C)} = ${A > 1 ? A + ' × ' : ''}${x * x} ${B * x < 0 ? '−' : '+'} ${Math.abs(B * x)} ${C < 0 ? '−' : '+'} ${Math.abs(C)} = ${n(v)}`,
          errs: errsF(v, [{ v: -A * x * x + B * x + C, m: `Attention : (${n(x)})² = ${x * x}, le carré d’un nombre négatif est positif.` }]),
          hints: H('Remplace x par (' + n(x) + ') avec des parenthèses.', 'Calcule d’abord le carré, puis les produits, enfin les additions.', 'Exemple : pour x = −2, x² = (−2)² = 4.') };
      } },
      { id: 'li-dev', lv: [1, 2, 3, 4], auto: true, f(L) {
        if (L === 1) { const k = R(2, 9), m = R(1, 6) * sgn(), b = nz(-9, 9);
          return { html: `Développer : ${M_(`${k}(${lin(m, b)})`)}`, f: x => k * (m * x + b), form: 'dev', ans: linA(k * m, k * b), corr: `${k} × ${lin(m, 0)} ${b < 0 ? '−' : '+'} ${k} × ${Math.abs(b)} = ${lin(k * m, k * b)}`,
            errs: [{ f: x => k * m * x + b, m: `Le facteur ${k} multiplie les deux termes de la parenthèse.` }],
            hints: H('Distribue le facteur sur chaque terme.', 'k(a + b) = k × a + k × b.', 'Exemple : 3(2x − 5) = 6x − 15.') }; }
        if (L === 2) { const k = R(2, 7), m = R(1, 6), b = nz(-9, 9);
          return { html: `Développer et réduire : ${M_(`−${k}(${lin(m, b)})`)}`, f: x => -k * (m * x + b), form: 'dev', ans: linA(-k * m, -k * b), corr: `−${k} × ${lin(m, 0)} − ${k} × ${p(b)} = ${lin(-k * m, -k * b)}`,
            errs: [{ f: x => -k * m * x + k * b * 0 + b * -1 * -1 * (b ? 1 : 0) * 0 - k * m * 0 + (-k * m * 0) + (-k * m) * 0 + (-k * m * x + k * b) - (-k * m * x), m: 'Attention au signe du deuxième terme : −' + k + ' × ' + p(b) + ' = ' + n(-k * b) + '.' }].map(e => ({ f: x => -k * m * x + k * b, m: e.m })),
            hints: H('Le facteur est négatif : attention aux signes.', 'Multiplie chaque terme par −' + k + ', en appliquant la règle des signes.', 'Exemple : −2(3x − 4) = −6x + 8.') }; }
        if (L === 3) { const p1 = nz(-5, 5), q1 = nz(-9, 9), p2 = nz(-5, 5), q2 = nz(-9, 9);
          const A = p1 * p2, B = p1 * q2 + q1 * p2, C = q1 * q2;
          return { html: `Développer et réduire : ${M_(`(${lin(p1, q1)})(${lin(p2, q2)})`)}`, f: x => (p1 * x + q1) * (p2 * x + q2), form: 'dev', ans: poly([A, B, C], 'x', true),
            corr: `(${lin(p1, q1)})(${lin(p2, q2)}) = ${poly([A, 0, 0])} ${p1 * q2 < 0 ? '−' : '+'} ${poly([Math.abs(p1 * q2), 0])} ${q1 * p2 < 0 ? '−' : '+'} ${poly([Math.abs(q1 * p2), 0])} ${C < 0 ? '−' : '+'} ${Math.abs(C)} = ${poly([A, B, C])}`,
            errs: [{ f: x => A * x * x + C, m: 'Il manque les deux produits « croisés » : chaque terme de la première parenthèse multiplie chaque terme de la seconde.' }],
            hints: H('Chaque terme de la première parenthèse multiplie chaque terme de la seconde.', '(a + b)(c + d) = ac + ad + bc + bd, puis réduis.', 'Exemple : (x + 2)(x − 3) = x² − 3x + 2x − 6 = x² − x − 6.') }; }
        const t = pick(['sq+', 'sq-', 'diff']), m = pick([1, 1, 2, 3]), b = R(1, 7);
        const f = t === 'sq+' ? (x => (m * x + b) ** 2) : t === 'sq-' ? (x => (m * x - b) ** 2) : (x => (m * x - b) * (m * x + b));
        const coefs = t === 'sq+' ? [m * m, 2 * m * b, b * b] : t === 'sq-' ? [m * m, -2 * m * b, b * b] : [m * m, 0, -b * b];
        const disp = t === 'sq+' ? `(${lin(m, b)})²` : t === 'sq-' ? `(${lin(m, -b)})²` : `(${lin(m, -b)})(${lin(m, b)})`;
        return { html: `Développer et réduire : ${M_(disp)}`, f, form: 'dev', ans: poly(coefs, 'x', true),
          corr: `${t === 'diff' ? '(a − b)(a + b) = a² − b²' : t === 'sq+' ? '(a + b)² = a² + 2ab + b²' : '(a − b)² = a² − 2ab + b²'} avec a = ${lin(m, 0)} et b = ${b} : ${poly(coefs)}`,
          errs: t === 'diff' ? [] : [{ f: x => m * m * x * x + b * b, m: 'Le carré d’une somme n’est pas la somme des carrés : il manque le double produit 2ab.' }, { f: x => m * m * x * x - b * b, m: 'Pour (a − b)², le dernier terme b² est positif, et il faut le double produit −2ab.' }],
          hints: H('Reconnais une identité remarquable.', '(a + b)² = a² + 2ab + b² ; (a − b)² = a² − 2ab + b² ; (a − b)(a + b) = a² − b².', 'Exemple : (x + 3)² = x² + 6x + 9.') };
      } },
      { id: 'li-fac', lv: [2, 3, 4], auto: true, f(L) {
        if (L === 2) { let k = R(2, 9), m, b; do { m = R(1, 7); b = nz(-9, 9); } while (gcd(m, b) !== 1);
          return { html: `Factoriser : ${M_(lin(k * m, k * b))}`, f: x => k * (m * x + b), form: 'fac', ans: `${k}(${linA(m, b)})`, corr: `${k} est un facteur commun : ${lin(k * m, k * b)} = ${k} × ${lin(m, 0)} ${b < 0 ? '−' : '+'} ${k} × ${Math.abs(b)} = ${k}(${lin(m, b)})`,
            hints: H('Cherche un facteur commun aux deux termes.', `Écris chaque terme comme un produit avec ce facteur, puis mets-le devant la parenthèse.`, 'Exemple : 6x + 15 = 3 × 2x + 3 × 5 = 3(2x + 5).') }; }
        if (L === 3) { let m = R(1, 7), b = nz(-9, 9);
          return { html: `Factoriser : ${M_(poly([m, b, 0]))}`, f: x => x * (m * x + b), form: 'fac', ans: `x(${linA(m, b)})`, corr: `x est un facteur commun : ${poly([m, b, 0])} = x(${lin(m, b)})`,
            hints: H('Les deux termes contiennent x.', 'Mets x en facteur.', 'Exemple : 3x² − 5x = x(3x − 5).') }; }
        const m = pick([1, 1, 2, 3]), b = R(1, 9);
        return { html: `Factoriser : ${M_(poly([m * m, 0, -b * b]))}`, f: x => m * m * x * x - b * b, form: 'fac', ans: `(${linA(m, -b)})(${linA(m, b)})`,
          corr: `On reconnaît a² − b² avec a = ${lin(m, 0)} et b = ${b} : ${poly([m * m, 0, -b * b])} = (${lin(m, -b)})(${lin(m, b)})`,
          errs: [{ f: x => (m * x - b) ** 2, m: '(a − b)² donne a² − 2ab + b², pas a² − b².' }],
          hints: H('Reconnais une différence de deux carrés.', 'a² − b² = (a − b)(a + b).', 'Exemple : x² − 49 = (x − 7)(x + 7).') };
      } },
      { id: 'li-prog', lv: [3, 4], auto: false, f(L) {
        const t = pick(['lin', 'sq']), aa = R(2, 9), k = R(2, 5);
        if (t === 'lin') {
          const steps = [`Choisir un nombre.`, `Ajouter ${aa}.`, `Multiplier le résultat par ${k}.`, `Soustraire ${k * aa}.`];
          const prog = `<ol class="prog">${steps.map(s => `<li>${s}</li>`).join('')}</ol>`;
          if (L === 3) { const x = R(-6, 9), v = k * x;
            return { html: `Voici un programme de calcul :${prog}Quel résultat obtient-on en choisissant ${M_(n(x))} ?`, v, ans: a(v), corr: `${n(x)} + ${aa} = ${n(x + aa)} ; ${n(x + aa)} × ${k} = ${n(k * (x + aa))} ; ${n(k * (x + aa))} − ${k * aa} = ${n(v)}`,
              hints: H('Applique les étapes une par une.', 'Écris le résultat de chaque étape avant de passer à la suivante.', '') }; }
          return { html: `Voici un programme de calcul :${prog}On choisit le nombre x. Exprimer le résultat en fonction de x, sous forme réduite.`, f: x => k * x, form: 'red', ans: `${k}x`,
            corr: `(x + ${aa}) × ${k} − ${k * aa} = ${k}x + ${k * aa} − ${k * aa} = ${k}x. Le résultat est toujours égal à ${k} fois le nombre choisi.`,
            errs: [{ f: x => k * x + k * aa, m: `N’oublie pas la dernière étape : soustraire ${k * aa}.` }, { f: x => x + aa * k - k * aa + (k - 1) * 0, m: `Le facteur ${k} multiplie x et ${aa} : utilise des parenthèses.` }],
            hints: H('Traduis chaque étape avec x.', `Écris (x + ${aa}) × ${k} − ${k * aa}, puis développe et réduis.`, '') };
        }
        const steps = [`Choisir un nombre.`, `Ajouter ${aa}.`, `Élever le résultat au carré.`, `Soustraire le carré du nombre de départ.`];
        const prog = `<ol class="prog">${steps.map(s => `<li>${s}</li>`).join('')}</ol>`;
        if (L === 3) { const x = R(-5, 8), v = (x + aa) ** 2 - x * x;
          return { html: `Voici un programme de calcul :${prog}Quel résultat obtient-on en choisissant ${M_(n(x))} ?`, v, ans: a(v), corr: `(${n(x)} + ${aa})² − (${n(x)})² = ${(x + aa) ** 2} − ${x * x} = ${n(v)}`,
            hints: H('Applique les étapes une par une.', 'Attention : le carré du nombre de départ est toujours positif.', '') }; }
        return { html: `Voici un programme de calcul :${prog}On choisit le nombre x. Exprimer le résultat en fonction de x, sous forme développée et réduite.`, f: x => 2 * aa * x + aa * aa, form: 'red', ans: linA(2 * aa, aa * aa),
          corr: `(x + ${aa})² − x² = x² + ${2 * aa}x + ${aa * aa} − x² = ${lin(2 * aa, aa * aa)}`,
          errs: [{ f: x => aa * aa, m: '(x + a)² n’est pas égal à x² + a² : il manque le double produit 2ax.' }],
          hints: H('Traduis chaque étape avec x.', `Écris (x + ${aa})² − x², développe avec une identité remarquable, puis réduis.`, '') };
      } }
    ]
  };

  const eq = {
    id: 'eq', name: 'Équations', dom: 'nc', cls: '4e-3e',
    flash: `<b>Principe.</b> On peut ajouter ou soustraire un même nombre aux deux membres, et les multiplier ou diviser par un même nombre non nul.<br><b>Méthode.</b> Je regroupe les x d'un côté, les nombres de l'autre, puis je divise.<br><b>Produit nul.</b> A × B = 0 si A = 0 ou B = 0 : (x − 2)(x + 5) = 0 donne x = 2 ou x = −5.<br><b>Piège.</b> Vérifie toujours ta solution en remplaçant x.`,
    gens: [
      { id: 'eq-1', lv: [1], auto: true, f() {
        const s = R(-10, 12);
        if (R(0, 1)) { const aa = nz(-15, 15), b = s + aa;
          return { html: `Résoudre l’équation : ${M_(`x ${aa < 0 ? '−' : '+'} ${Math.abs(aa)} = ${n(b)}`)}`, v: s, ans: `x=${s}`, corr: `x = ${n(b)} ${aa < 0 ? '+' : '−'} ${Math.abs(aa)} = ${n(s)}. Vérification : ${n(s)} ${aa < 0 ? '−' : '+'} ${Math.abs(aa)} = ${n(b)}.`,
            errs: errsF(s, [{ v: b + aa, m: `Pour isoler x, on ${aa < 0 ? 'ajoute' : 'soustrait'} ${Math.abs(aa)} aux deux membres.` }]),
            hints: H('Il faut isoler x.', `${aa < 0 ? 'Ajoute' : 'Soustrais'} ${Math.abs(aa)} aux deux membres.`, 'Exemple : x + 4 = 9 donne x = 9 − 4 = 5.') }; }
        const aa = pick([2, 3, 4, 5, 6, 7, 8, 9, -2, -3, -4, -5]), b = aa * s;
        return { html: `Résoudre l’équation : ${M_(`${n(aa)}x = ${n(b)}`)}`, v: s, ans: `x=${s}`, corr: `x = ${n(b)} ÷ ${p(aa)} = ${n(s)}`,
          errs: errsF(s, [{ v: b - aa, m: `${aa}x veut dire ${aa} × x : on divise par ${aa}, on ne soustrait pas.` }, { v: -s, m: 'Attention au signe du quotient.' }]),
          hints: H('x est multiplié par ' + n(aa) + '.', `Divise les deux membres par ${n(aa)}.`, 'Exemple : 3x = 12 donne x = 12 ÷ 3 = 4.') };
      } },
      { id: 'eq-2', lv: [2], auto: true, f() {
        const s = R(-10, 10), aa = pick([2, 3, 4, 5, 6, 7, 8, 9, -2, -3, -4, -5, -6]), b = nz(-20, 20), c = aa * s + b;
        return { html: `Résoudre l’équation : ${M_(`${lin(aa, b)} = ${n(c)}`)}`, v: s, ans: `x=${s}`,
          corr: `${n(aa)}x = ${n(c)} ${b < 0 ? '+' : '−'} ${Math.abs(b)} = ${n(c - b)}, donc x = ${n(c - b)} ÷ ${p(aa)} = ${n(s)}.`,
          errs: errsF(s, [{ v: (c + b) / aa, m: `Pour faire disparaître ${n(b)}, on ${b < 0 ? 'ajoute' : 'soustrait'} ${Math.abs(b)} aux deux membres.` }, { v: (c - b) - aa, m: 'Pour isoler x, on divise par son coefficient.' }]),
          hints: H('Commence par isoler le terme en x.', `${b < 0 ? 'Ajoute' : 'Soustrais'} ${Math.abs(b)} aux deux membres, puis divise par ${n(aa)}.`, 'Exemple : 2x + 5 = 17 → 2x = 12 → x = 6.') };
      } },
      { id: 'eq-3', lv: [3], auto: true, f() {
        const s = R(-9, 9);
        if (R(0, 2)) { let aa = nz(-9, 9), cc = nz(-9, 9); if (aa === cc) cc = aa + pick([1, 2, -1]); if (!cc) cc = 3; const b = nz(-15, 15), d = (aa - cc) * s + b;
          return { html: `Résoudre l’équation : ${M_(`${lin(aa, b)} = ${lin(cc, d)}`)}`, v: s, ans: `x=${s}`,
            corr: `${lin(aa, 0)} ${cc < 0 ? '+' : '−'} ${lin(Math.abs(cc), 0)} = ${n(d)} ${b < 0 ? '+' : '−'} ${Math.abs(b)}, soit ${lin(aa - cc, 0)} = ${n(d - b)}, donc x = ${n(s)}. Vérification : les deux membres valent ${n(aa * s + b)}.`,
            errs: errsF(s, [{ v: (d - b) / (aa + cc), m: `Pour regrouper les x, on ${cc < 0 ? 'ajoute ' + lin(-cc, 0) : 'soustrait ' + lin(cc, 0)} aux deux membres.` }, { v: (d + b) / (aa - cc), m: 'Attention au signe quand tu fais passer le nombre de l’autre côté.' }]),
            hints: H('Regroupe les x dans un membre et les nombres dans l’autre.', 'Soustrais le terme en x du membre de droite aux deux membres, puis isole x.', 'Exemple : 5x − 3 = 2x + 9 → 3x = 12 → x = 4.') }; }
        const k = pick([2, 3, 4, 5, -2, -3]), b = nz(-8, 8), c = k * (s + b);
        return { html: `Résoudre l’équation : ${M_(`${n(k)}(${lin(1, b)}) = ${n(c)}`)}`, v: s, ans: `x=${s}`, corr: `On divise par ${p(k)} : ${lin(1, b)} = ${n(c / k)}, donc x = ${n(s)}.`,
          errs: errsF(s, [{ v: (c - k * b * 0 - b) / k, m: `${n(k)} multiplie toute la parenthèse.` }]),
          hints: H('Tu peux d’abord diviser les deux membres par ' + n(k) + ', ou développer.', `Divise par ${n(k)}, puis isole x.`, 'Exemple : 3(x + 2) = 15 → x + 2 = 5 → x = 3.') };
      } },
      { id: 'eq-4', lv: [4], auto: true, f() {
        if (R(0, 2)) { const r1 = R(-9, 9); let q = pick([1, 1, 2, 3]), r2n = R(-9, 9) ; if (q === 1 && r2n === r1) r2n++;
          const r2 = r2n / q;
          const f1 = lin(1, -r1), f2 = lin(q, -r2n);
          return { type: 'set', html: `Résoudre l’équation : ${M_(`(${f1})(${f2}) = 0`)}`, set: [r1, r2], ans: `x=${a(r1)} ou x=${fa(r2n, q)}`,
            corr: `Un produit est nul si l’un de ses facteurs est nul : ${f1} = 0 ou ${f2} = 0, donc x = ${n(r1)} ou x = ${FR(r2n, q)}.`,
            errs: [{ set: [-r1, -r2], m: 'Attention au signe : x − 3 = 0 donne x = 3, et non −3.' }],
            hints: H('C’est une équation produit nul.', 'Résous séparément chaque facteur égal à 0.', 'Exemple : (x − 2)(x + 5) = 0 → x = 2 ou x = −5.'), kbdNote: 'Sépare les solutions par « ou » ou par « ; ».' }; }
        const r = R(2, 12), k = r * r;
        return { type: 'set', html: `Résoudre l’équation : ${M_(`x² = ${k}`)}`, set: [r, -r], ans: `x=${r} ou x=-${r}`, corr: `x² = ${k} a deux solutions : x = √${k} = ${r} ou x = −√${k} = −${r}.`,
          hints: H('Combien de nombres ont pour carré ' + k + ' ?', 'Si k > 0, x² = k a deux solutions : √k et −√k.', 'Exemple : x² = 49 → x = 7 ou x = −7.'), kbdNote: 'Sépare les solutions par « ou » ou par « ; ».' };
      } },
      { id: 'eq-pb', lv: [3, 4], auto: false, f(L) {
        const t = pick(['age', 'rect', 'tarif']);
        if (t === 'age') { const x = R(8, 16), k = pick([3, 4]), S = x + k * x;
          return { html: `Un parent a ${k} fois l’âge de son enfant. À eux deux, ils ont ${S} ans. Quel âge a l’enfant ?`, v: x, suffix: 'ans', ans: String(x),
            corr: `Si x est l’âge de l’enfant : x + ${k}x = ${S}, soit ${k + 1}x = ${S}, donc x = ${x}. L’enfant a ${x} ans.`,
            errs: errsF(x, [{ v: S / k, m: `Le parent a ${k}x ans : il faut résoudre x + ${k}x = ${S}.` }, { v: k * x, m: 'Ça, c’est l’âge du parent.' }]),
            hints: H('Appelle x l’âge de l’enfant.', `Écris l’équation x + ${k}x = ${S}, puis résous-la.`, '') }; }
        if (t === 'rect') { const x = R(3, 15), d = R(2, 9), P = 2 * (2 * x + d);
          return { html: `La longueur d’un rectangle mesure ${d} cm de plus que sa largeur. Son périmètre est ${P} cm. Quelle est sa largeur ?`, v: x, suffix: 'cm', ans: String(x),
            corr: `Si x est la largeur : 2(x + x + ${d}) = ${P}, soit 4x + ${2 * d} = ${P}, donc x = ${x}. La largeur est ${x} cm.`,
            errs: errsF(x, [{ v: x + d, m: 'Ça, c’est la longueur.' }, { v: (P - d) / 2, m: 'Le périmètre compte deux largeurs et deux longueurs.' }]),
            hints: H('Appelle x la largeur ; la longueur vaut x + ' + d + '.', 'Périmètre = 2 × (largeur + longueur) : écris l’équation et résous-la.', '') }; }
        const aa = R(2, 6), cc = aa + R(2, 5), x = R(4, 15), b = (cc - aa) * x;
        return { html: `Une salle de sport propose deux formules.<br>Formule A : abonnement de ${b} € par an, puis ${aa} € par séance.<br>Formule B : ${cc} € par séance, sans abonnement.<br>Pour combien de séances les deux formules coûtent-elles le même prix ?`, v: x, suffix: 'séances', ans: String(x),
          corr: `${b} + ${aa}x = ${cc}x, donc ${b} = ${cc - aa}x et x = ${x} séances.`,
          errs: errsF(x, [{ v: b / cc, m: 'Il faut égaler les deux prix : ' + b + ' + ' + aa + 'x = ' + cc + 'x.' }]),
          hints: H('Appelle x le nombre de séances.', `Prix A : ${b} + ${aa}x. Prix B : ${cc}x. Écris l’équation A = B.`, '') };
      } },
      { id: 'eq-test', lv: [1, 2], auto: true, f() {
        const s = R(-6, 8), aa = nz(-5, 6), cc = nz(-5, 6), b = nz(-9, 9), ok = R(0, 1), d = (aa - cc) * s + b + (ok ? 0 : nz(-3, 3));
        const L = aa * s + b, Rr = cc * s + d, good = L === Rr;
        return { type: 'qcm', html: `Le nombre ${M_(n(s))} est-il solution de l’équation ${M_(`${lin(aa, b)} = ${lin(cc, d)}`)} ?`, choices: YN, correct: good ? 0 : 1, ans: good ? '0' : '1',
          corr: `Membre de gauche : ${n(aa)} × ${p(s)} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${n(L)}. Membre de droite : ${n(cc)} × ${p(s)} ${d < 0 ? '−' : '+'} ${Math.abs(d)} = ${n(Rr)}. ${good ? 'Les deux membres sont égaux : c’est une solution.' : 'Les deux membres sont différents : ce n’est pas une solution.'}`,
          hints: H('Remplace x par ' + n(s) + ' dans chaque membre.', 'Calcule séparément les deux membres et compare.', '') };
      } }
    ]
  };

  const prop = {
    id: 'prop', name: 'Proportionnalité et pourcentages', dom: 'nc', cls: '5e-3e',
    flash: `<b>Quatrième proportionnelle.</b> Si 3 kg coûtent 7,50 €, 1 kg coûte 2,50 € et 5 kg coûtent 12,50 €.<br><b>Pourcentage.</b> t % de Q = Q × t ÷ 100.<br><b>Évolutions.</b> Augmenter de t % : multiplier par 1 + t/100. Baisser de t % : multiplier par 1 − t/100.<br><b>Piège.</b> Une hausse de 20 % suivie d'une baisse de 20 % ne ramène pas au prix de départ (× 1,2 × 0,8 = × 0,96).`,
    gens: [
      { id: 'pr-4e', lv: [1, 2], auto: true, f(L) {
        if (R(0, 1)) { const u = L === 1 ? R(2, 6) : R(3, 12) / 2, q1 = R(2, 6), q2 = R(2, 12) === q1 ? q1 + 1 : R(2, 12) + (R(0, 0)), Q2 = q2 === q1 ? q2 + 1 : q2, P1 = u * q1, v = u * Q2;
          const it = pick([['kg de pommes', 'kg'], ['cahiers', 'cahiers'], ['litres de jus', 'litres'], ['places de cinéma', 'places']]);
          return { html: `${q1} ${it[0]} coûtent ${n(P1)} €. Combien coûtent ${Q2} ${it[1]} au même tarif ?`, v, suffix: '€', ans: a(v), corr: `Prix unitaire : ${n(P1)} ÷ ${q1} = ${n(u)} €. Donc ${Q2} × ${n(u)} = ${n(v)} €.`,
            errs: errsF(v, [{ v: P1 + (Q2 - q1), m: 'Les prix sont proportionnels aux quantités : on multiplie, on n’ajoute pas.' }]),
            hints: H('Les prix sont proportionnels aux quantités.', 'Calcule le prix d’une unité, puis multiplie.', 'Exemple : 4 cahiers à 6 € → 1 cahier à 1,50 € → 7 cahiers à 10,50 €.') }; }
        const g = pick([50, 75, 100, 125, 150, 40]), p1 = pick([2, 4, 6]), p2 = pick([3, 5, 8, 10, 12].filter(x => x !== p1)), v = g * p2;
        const ing = pick(['farine', 'sucre', 'chocolat', 'beurre']);
        return { html: `Une recette pour ${p1} personnes demande ${g * p1} g de ${ing}. Quelle masse de ${ing} faut-il pour ${p2} personnes ?`, v, suffix: 'g', ans: String(v),
          corr: `Pour 1 personne : ${g * p1} ÷ ${p1} = ${g} g. Pour ${p2} personnes : ${g} × ${p2} = ${v} g.`,
          errs: errsF(v, [{ v: g * p1 + (p2 - p1), m: 'Il faut multiplier par le même coefficient, pas ajouter.' }]),
          hints: H('C’est une situation de proportionnalité.', 'Ramène à 1 personne, puis multiplie.', '') };
      } },
      { id: 'pr-pct-of', lv: [1, 2], auto: true, f(L) {
        const t = L === 1 ? pick([10, 20, 25, 50, 75]) : pick([5, 15, 30, 40, 60, 12, 35]), Q = L === 1 ? pick([20, 40, 60, 80, 120, 200, 360, 500]) : R(2, 40) * 20, v = Q * t / 100;
        return { html: `Calculer ${t} % de ${n(Q)}.`, v, ans: a(v), corr: `${t} % de ${n(Q)} = ${n(Q)} × ${t} ÷ 100 = ${n(v)}`,
          errs: errsF(v, [{ v: Q - t, m: `Prendre ${t} %, ce n’est pas soustraire ${t}.` }, { v: Q * t, m: 'N’oublie pas de diviser par 100.' }]),
          hints: H(`${t} %, c’est ${t} pour 100.`, `Multiplie par ${t} puis divise par 100 (ou multiplie par ${n(t / 100)}).`, 'Exemple : 25 % de 80 = 80 × 0,25 = 20.') };
      } },
      { id: 'pr-taux', lv: [2, 3], auto: true, f() {
        const tot = pick([20, 25, 40, 50, 200, 80]), part = R(1, tot - 1), v = part / tot * 100;
        if (!Number.isInteger(v * 10)) return prop.gens[2].f(2);
        const c = pick([['Dans une classe de', 'élèves,', 'font du sport en club'], ['Sur', 'personnes interrogées,', 'préfèrent le train'], ['Dans un sac de', 'billes,', 'sont rouges']]);
        return { html: `${c[0]} ${tot} ${c[1]} ${part} ${c[2]}. Quel pourcentage cela représente-t-il ?`, v, suffix: '%', ans: a(v), corr: `${part} ÷ ${tot} = ${n(part / tot)}, soit ${n(v)} %.`,
          errs: errsF(v, [{ v: part / tot, m: 'Tu as la proportion : multiplie par 100 pour l’écrire en pourcentage.' }, { v: tot / part * 100, m: 'On divise la partie par le total, pas l’inverse.' }]),
          hints: H('Calcule la proportion : partie ÷ total.', 'Multiplie ensuite par 100.', 'Exemple : 6 sur 24 → 6 ÷ 24 = 0,25 = 25 %.') };
      } },
      { id: 'pr-evol', lv: [2, 3], auto: true, f(L) {
        const up = R(0, 1), t = pick([10, 20, 25, 30, 40, 50, 5, 15]), P = pick([20, 40, 60, 80, 120, 150, 200, 240]), v = P * (1 + (up ? t : -t) / 100);
        const it = pick(['Un sweat', 'Une console', 'Un vélo', 'Une paire de baskets', 'Un abonnement']);
        return { html: `${it} coûte <b>${P} €</b>. Son prix ${up ? 'augmente' : 'baisse'} de <b>${t} %</b>.<br>Quel est son nouveau prix ?`, v, unit: '€', units: ['€', '%'], ans: a(v),
          corr: `${t} % de ${P} = ${n(P * t / 100)} €. Nouveau prix : ${P} ${up ? '+' : '−'} ${n(P * t / 100)} = ${n(v)} €. Plus rapide : ${P} × ${n(1 + (up ? t : -t) / 100)} = ${n(v)} €.`,
          errs: errsF(v, [{ v: P * t / 100, m: `${n(P * t / 100)} € est le montant ${up ? 'de la hausse' : 'de la réduction'}. Il faut encore ${up ? 'l’ajouter au' : 'le retirer du'} prix de départ.` }, { v: up ? P + t : P - t, m: `On ne ${up ? 'ajoute' : 'retire'} pas ${t} €, mais ${t} % du prix.` }, { v: P * (1 + (up ? -t : t) / 100), m: `Le prix ${up ? 'augmente' : 'baisse'} : relis l’énoncé.` }]),
          hints: H(`Calcule d’abord ${t} % de ${P} €.`, `${up ? 'Augmenter' : 'Baisser'} de ${t} %, c’est multiplier par ${n(1 + (up ? t : -t) / 100)}.`, 'Exemple : 80 € avec une baisse de 25 % → 80 × 0,75 = 60 €.') };
      } },
      { id: 'pr-coef', lv: [3], auto: true, f() {
        const up = R(0, 1), t = pick([3, 5, 8, 12, 15, 20, 30, 45, 60]), v = 1 + (up ? t : -t) / 100;
        return { html: `${up ? 'Augmenter' : 'Diminuer'} une quantité de ${t} % revient à la multiplier par quel nombre ?`, v, ans: a(v), corr: `${up ? '1 + ' : '1 − '}${t}/100 = ${n(v)}`,
          errs: errsF(v, [{ v: t / 100, m: 'Il faut garder la quantité de départ : 1 ' + (up ? '+' : '−') + ' ' + n(t / 100) + '.' }, { v: 1 + (up ? -t : t) / 100, m: up ? 'Pour une hausse, le coefficient est supérieur à 1.' : 'Pour une baisse, le coefficient est inférieur à 1.' }]),
          hints: H('Pense à la quantité de départ, qui vaut 100 %.', `${up ? 'Hausse' : 'Baisse'} de t % : coefficient 1 ${up ? '+' : '−'} t/100.`, 'Exemple : hausse de 7 % → × 1,07.') };
      } },
      { id: 'pr-init', lv: [4], auto: false, calc: true, f() {
        const t = pick([10, 20, 25, 30, 40, 15]), P = R(3, 30) * 4 * (t === 15 ? 20 : 5), N = P * (1 - t / 100);
        return { html: `Pendant les soldes, après une réduction de ${t} %, un article coûte <b>${n(N)} €</b>. Quel était son prix avant la réduction ?`, v: P, suffix: '€', ans: a(P),
          corr: `Prix initial × ${n(1 - t / 100)} = ${n(N)}, donc prix initial = ${n(N)} ÷ ${n(1 - t / 100)} = ${n(P)} €.`,
          errs: errsF(P, [{ v: N * (1 + t / 100), m: `Le ${t} % s’applique au prix de départ, pas au prix soldé : on divise par ${n(1 - t / 100)}.` }]),
          hints: H('Écris l’égalité : prix initial × coefficient = prix soldé.', `Le coefficient vaut ${n(1 - t / 100)} ; divise le prix soldé par ce coefficient.`, '') };
      } },
      { id: 'pr-succ', lv: [4], auto: false, calc: true, f() {
        const t1 = pick([10, 20, 25, 30, 50]), t2 = pick([10, 20, 25, 40, 50]), v = roundTo(((1 + t1 / 100) * (1 - t2 / 100) - 1) * 100, 6);
        return { html: `Le prix d’un article augmente de ${t1} %, puis baisse de ${t2} %.<br>Quel est le taux d’évolution global, en % ? (Écrire un nombre négatif s’il s’agit d’une baisse.)`, v, suffix: '%', ans: a(v),
          corr: `Coefficient global : ${n(1 + t1 / 100)} × ${n(1 - t2 / 100)} = ${n((1 + t1 / 100) * (1 - t2 / 100))}. ${v < 0 ? `C’est une baisse de ${n(-v)} %.` : v > 0 ? `C’est une hausse de ${n(v)} %.` : 'Le prix est inchangé.'}`,
          errs: errsF(v, [{ v: t1 - t2, m: 'Les pourcentages successifs ne s’additionnent pas : on multiplie les coefficients.' }]),
          hints: H('Les deux évolutions s’enchaînent.', 'Multiplie les deux coefficients multiplicateurs, puis traduis le résultat en pourcentage.', 'Exemple : +10 % puis −10 % → 1,1 × 0,9 = 0,99, soit −1 %.') };
      } },
      { id: 'pr-ratio', lv: [3], auto: true, f() {
        const x = R(1, 5), y = R(1, 5) === x ? x + 1 : R(1, 5), Y = y === x ? y + 1 : y, k = R(2, 15), N = (x + Y) * k, v = x * k;
        return { html: `Deux amis se partagent ${N} € dans le ratio ${x} : ${Y}. Combien reçoit le premier ?`, v, suffix: '€', ans: String(v),
          corr: `Il y a ${x} + ${Y} = ${x + Y} parts. Une part vaut ${N} ÷ ${x + Y} = ${k} €. Le premier reçoit ${x} × ${k} = ${v} €.`,
          errs: errsF(v, [{ v: N / x, m: `Il faut d’abord compter le nombre total de parts : ${x} + ${Y}.` }, { v: Y * k, m: 'Ça, c’est la part du second.' }]),
          hints: H(`Le ratio ${x} : ${Y} signifie ${x} parts pour l’un, ${Y} parts pour l’autre.`, 'Calcule la valeur d’une part, puis multiplie.', '') };
      } },
      { id: 'pr-tab', lv: [1, 2], auto: true, f() {
        const k = R(2, 9) * (R(0, 1) ? 1 : 0.5), xs = shuffle([1, 2, 3, 4, 5, 6, 8, 10]).slice(0, 4).sort((x, y) => x - y), ok = R(0, 1);
        const ys = xs.map(x => k * x); if (!ok) ys[R(1, 3)] += pick([1, 2, -1]);
        return { type: 'qcm', html: `Ce tableau est-il un tableau de proportionnalité ?${htable('Quantité', xs.map(n), 'Prix (€)', ys.map(n))}`, choices: YN, correct: ok ? 0 : 1, ans: ok ? '0' : '1',
          corr: ok ? `Oui : on passe de la première ligne à la deuxième en multipliant toujours par ${n(k)}.` : `Non : les quotients prix ÷ quantité ne sont pas tous égaux (${xs.map((x, i) => n(roundTo(ys[i] / x, 2))).join(' ; ')}).`,
          hints: H('Calcule le quotient de chaque colonne.', 'Si on multiplie toujours par le même nombre, le tableau est proportionnel.', '') };
      } }
    ]
  };

  /* =====================================================================
     ORGANISATION ET GESTION DE DONNÉES, FONCTIONS
     ===================================================================== */
  const fonc = {
    id: 'fonc', name: 'Fonctions', dom: 'df', cls: '3e',
    flash: `<b>Image et antécédent.</b> Si f(3) = 7, alors 7 est l'image de 3, et 3 est un antécédent de 7.<br><b>Fonction linéaire.</b> f(x) = ax : droite qui passe par l'origine (proportionnalité).<br><b>Fonction affine.</b> f(x) = ax + b : droite ; a est le coefficient directeur, b l'ordonnée à l'origine.<br><b>Piège.</b> Pour lire une image sur un graphique, on part de l'axe des abscisses.`,
    gens: [
      { id: 'fo-img', lv: [1, 2], auto: true, f(L) {
        if (L === 1) { const k = nz(-6, 7), b = nz(-9, 9), x = R(0, 8), v = k * x + b;
          return { html: `On considère la fonction ${M_(`f(x) = ${lin(k, b)}`)}. Calculer ${M_(`f(${x})`)}.`, v, ans: a(v), corr: `f(${x}) = ${n(k)} × ${x} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${n(v)}`,
            errs: errsF(v, [{ v: (x - b) / k, m: 'On demande l’image de ' + x + ' : remplace x par ' + x + ' dans l’expression.' }]),
            hints: H('Remplace x par ' + x + '.', 'Calcule f(' + x + ') en respectant les priorités.', 'Exemple : f(x) = 2x − 1, f(3) = 2 × 3 − 1 = 5.') }; }
        const A = pick([1, 2, -1, 3]), B = nz(-5, 5), C = nz(-9, 9), x = -R(1, 4), v = A * x * x + B * x + C;
        return { html: `On considère la fonction ${M_(`f(x) = ${poly([A, B, C])}`)}. Calculer ${M_(`f(${n(x)})`)}.`, v, ans: a(v), corr: `f(${n(x)}) = ${A === 1 ? '' : A === -1 ? '−' : A + ' × '}(${n(x)})² ${B < 0 ? '−' : '+'} ${Math.abs(B)} × (${n(x)}) ${C < 0 ? '−' : '+'} ${Math.abs(C)} = ${n(v)}`,
          errs: errsF(v, [{ v: -A * x * x + B * x + C, m: `(${n(x)})² = ${x * x} : le carré d’un nombre négatif est positif.` }]),
          hints: H('Remplace x par (' + n(x) + '), avec les parenthèses.', 'Calcule d’abord le carré, puis le reste.', '') };
      } },
      { id: 'fo-ant', lv: [2, 3], auto: true, f() {
        const k = pick([2, 3, 4, 5, -2, -3, -4]), b = nz(-9, 9), x = R(-6, 8), y = k * x + b;
        return { html: `On considère la fonction ${M_(`f(x) = ${lin(k, b)}`)}. Déterminer l’antécédent de ${M_(n(y))} par f.`, v: x, ans: a(x),
          corr: `On résout ${lin(k, b)} = ${n(y)} : ${n(k)}x = ${n(y - b)}, donc x = ${n(x)}. L’antécédent de ${n(y)} est ${n(x)}.`,
          errs: errsF(x, [{ v: k * y + b, m: `Tu as calculé l’image de ${n(y)}. On cherche le nombre x tel que f(x) = ${n(y)}.` }]),
          hints: H('On cherche x tel que f(x) = ' + n(y) + '.', 'Écris l’équation ' + lin(k, b) + ' = ' + n(y) + ' et résous-la.', 'Exemple : f(x) = 3x + 1 ; antécédent de 13 : 3x + 1 = 13 → x = 4.') };
      } },
      { id: 'fo-tab', lv: [1], auto: true, f() {
        const k = nz(-3, 3), b = nz(-4, 4), c2 = R(0, 1) ? 0 : pick([1, -1]), xs = [-2, -1, 0, 1, 2, 3], ys = xs.map(x => c2 * x * x + k * x + b), ask = R(0, 1), i = R(0, 5);
        const tbl = htable('x', xs.map(n), 'f(x)', ys.map(n));
        if (ask) return { html: `Voici un tableau de valeurs d’une fonction f :${tbl}Quelle est l’image de ${n(xs[i])} par f ?`, v: ys[i], ans: a(ys[i]), corr: `Dans la colonne x = ${n(xs[i])}, on lit f(${n(xs[i])}) = ${n(ys[i])}.`,
          errs: errsF(ys[i], [{ v: xs[ys.indexOf(xs[i])], m: 'L’image se lit dans la ligne f(x), sous la valeur de x.' }]), hints: H('L’image de x se lit sur la ligne f(x).', 'Repère la colonne où x = ' + n(xs[i]) + '.', '') };
        const y = ys[i]; if (ys.filter(t => t === y).length > 1) return fonc.gens[2].f(1);
        return { html: `Voici un tableau de valeurs d’une fonction f :${tbl}Quel nombre du tableau a pour image ${n(y)} ?`, v: xs[i], ans: a(xs[i]), corr: `On cherche ${n(y)} dans la ligne f(x) : il est sous x = ${n(xs[i])}. C’est un antécédent de ${n(y)}.`,
          hints: H('On cherche un antécédent.', 'Repère ' + n(y) + ' dans la ligne f(x) et lis la valeur de x au-dessus.', '') };
      } },
      { id: 'fo-graph', lv: [2, 3], auto: true, f(L) {
        let k, b, xs; do { k = pick([1, -1, 2, -2]); b = R(-3, 3); xs = [-4, -3, -2, -1, 0, 1, 2, 3, 4].filter(x => Math.abs(k * x + b) <= 4 && x !== 0); } while (xs.length < 2);
        const x = pick(xs), y = k * x + b;
        if (L === 2) return { html: `La droite ci-dessous représente une fonction f. Lire l’image de ${M_(n(x))} par f.${graphFig(k, b)}`, v: y, ans: a(y), corr: `On part de ${n(x)} sur l’axe des abscisses, on monte (ou on descend) jusqu’à la droite, puis on lit l’ordonnée : f(${n(x)}) = ${n(y)}.`,
          errs: errsF(y, [{ v: (x - b) / k, m: 'Tu as lu un antécédent. Pour une image, on part de l’axe horizontal.' }]),
          hints: H('L’image se lit sur l’axe vertical.', `Pars de x = ${n(x)} sur l’axe horizontal, rejoins la droite, puis lis l’ordonnée.`, '') };
        return { html: `La droite ci-dessous représente une fonction f. Lire l’antécédent de ${M_(n(y))} par f.${graphFig(k, b)}`, v: x, ans: a(x), corr: `On part de ${n(y)} sur l’axe des ordonnées, on rejoint la droite, puis on lit l’abscisse : l’antécédent est ${n(x)}.`,
          errs: errsF(x, [{ v: k * y + b, m: 'Tu as lu une image. Pour un antécédent, on part de l’axe vertical.' }]),
          hints: H('L’antécédent se lit sur l’axe horizontal.', `Pars de y = ${n(y)} sur l’axe vertical, rejoins la droite, puis lis l’abscisse.`, '') };
      } },
      { id: 'fo-type', lv: [1, 2], auto: true, f() {
        const t = R(0, 2), k = nz(-7, 7), b = nz(-9, 9);
        const ex = [`f(x) = ${lin(k, 0)}`, `f(x) = ${lin(k, b)}`, pick([`f(x) = ${poly([1, 0, b])}`, `f(x) = ${n(k)}x² ${b < 0 ? '−' : '+'} ${Math.abs(b)}x`, `f(x) = ${Math.abs(b)} ÷ x`])][t];
        return { type: 'qcm', html: `La fonction ${M_(ex)} est :`, choices: ['linéaire', 'affine, mais pas linéaire', 'ni linéaire, ni affine'], correct: t, ans: String(t),
          corr: ['Elle est de la forme f(x) = ax : elle est linéaire (et donc aussi affine).', 'Elle est de la forme f(x) = ax + b avec b ≠ 0 : affine, mais pas linéaire.', 'Elle ne s’écrit pas sous la forme ax + b : ni linéaire, ni affine.'][t],
          hints: H('Compare avec les formes ax et ax + b.', 'Linéaire : f(x) = ax. Affine : f(x) = ax + b. Un x² ou un x au dénominateur : ni l’une ni l’autre.', '') };
      } },
      { id: 'fo-expr', lv: [3, 4], auto: true, f(L) {
        if (L === 3) { const k = nz(-6, 7), x0 = R(2, 6), y0 = k * x0;
          return { html: `f est une fonction linéaire telle que ${M_(`f(${x0}) = ${n(y0)}`)}. Donner l’expression de f(x).`, f: x => k * x, ans: `f(x)=${linA(k, 0)}`, corr: `f(x) = ax avec a = ${n(y0)} ÷ ${x0} = ${n(k)}. Donc f(x) = ${lin(k, 0)}.`,
            errs: [{ f: x => x * x0 / y0, m: 'Le coefficient vaut f(x) ÷ x, et non x ÷ f(x).' }],
            hints: H('Une fonction linéaire s’écrit f(x) = ax.', `Calcule a = f(${x0}) ÷ ${x0}.`, 'Exemple : f(4) = 12 → a = 3 → f(x) = 3x.') }; }
        const k = nz(-4, 4), b = nz(-6, 6), x1 = R(-3, 1), x2 = x1 + R(1, 4), y1 = k * x1 + b, y2 = k * x2 + b;
        return { html: `f est une fonction affine telle que ${M_(`f(${n(x1)}) = ${n(y1)}`)} et ${M_(`f(${n(x2)}) = ${n(y2)}`)}. Donner l’expression de f(x).`, f: x => k * x + b, ans: `f(x)=${linA(k, b)}`,
          corr: `a = (${n(y2)} − ${p(y1)}) ÷ (${n(x2)} − ${p(x1)}) = ${n(y2 - y1)} ÷ ${x2 - x1} = ${n(k)}. Puis b = f(${n(x1)}) − a × ${p(x1)} = ${n(b)}. Donc f(x) = ${lin(k, b)}.`,
          errs: [{ f: x => (x2 - x1) / (y2 - y1) * x + b, m: 'Le coefficient a se calcule par (f(x₂) − f(x₁)) ÷ (x₂ − x₁).' }],
          hints: H('f(x) = ax + b : trouve d’abord a.', 'a = (f(x₂) − f(x₁)) ÷ (x₂ − x₁), puis b avec un des deux points.', 'Exemple : f(1) = 5 et f(3) = 9 → a = 2, b = 3.') };
      } },
      { id: 'fo-ctx', lv: [3, 4], auto: false, f(L) {
        const pc = pick([2, 3, 4, 5]), pk = pick([1.5, 2, 2.5, 1.2]), x = R(4, 30), v = roundTo(pc + pk * x, 2);
        const intro = `Un taxi facture ${n(pc)} € de prise en charge, puis ${n(pk)} € par kilomètre. On note f(x) le prix, en euros, d’un trajet de x km.`;
        if (L === 3) return { html: `${intro}<br>Combien coûte un trajet de ${x} km ?`, v, suffix: '€', ans: a(v), corr: `f(x) = ${n(pk)}x + ${n(pc)}. f(${x}) = ${n(pk)} × ${x} + ${n(pc)} = ${n(v)} €.`,
          errs: errsF(v, [{ v: pk * x, m: 'N’oublie pas la prise en charge.' }]), hints: H('Écris d’abord l’expression de f(x).', `f(x) = ${n(pk)}x + ${n(pc)} ; calcule f(${x}).`, '') };
        return { html: `${intro}<br>Un trajet a coûté ${n(v)} €. Quelle distance a été parcourue ?`, v: x, suffix: 'km', ans: String(x), corr: `On résout ${n(pk)}x + ${n(pc)} = ${n(v)} : ${n(pk)}x = ${n(v - pc)}, donc x = ${x} km.`,
          errs: errsF(x, [{ v: v / pk, m: 'Retire d’abord la prise en charge avant de diviser.' }]), hints: H('On cherche un antécédent.', `Résous ${n(pk)}x + ${n(pc)} = ${n(v)}.`, '') };
      } }
    ]
  };

  const stat = {
    id: 'stat', name: 'Statistiques', dom: 'df', cls: '4e-3e',
    flash: `<b>Moyenne.</b> Somme des valeurs ÷ nombre de valeurs. Avec des effectifs : Σ(valeur × effectif) ÷ effectif total.<br><b>Médiane.</b> On range les valeurs dans l'ordre : la médiane partage la série en deux groupes de même effectif.<br><b>Étendue.</b> Plus grande valeur − plus petite valeur.<br><b>Piège.</b> Pour la médiane, il faut d'abord ranger la série.`,
    gens: [
      { id: 'st-moy', lv: [1, 2], auto: true, f(L) {
        const cnt = L === 1 ? 5 : 4, m = R(8, 16) + (L === 2 ? 0.5 * R(0, 1) : 0); let vals;
        do { vals = Array.from({ length: cnt - 1 }, () => R(m - 6 > 0 ? Math.floor(m - 6) : 0, Math.ceil(m + 6))); vals.push(roundTo(m * cnt - vals.reduce((s, x) => s + x, 0), 6)); } while (vals[cnt - 1] < 0 || vals[cnt - 1] > 20 || !Number.isInteger(vals[cnt - 1]));
        return { html: `Voici les notes d’un élève : ${M_(vals.map(n).join(' ; '))}.<br>Calculer la moyenne de ces notes.`, v: m, ans: a(m), corr: `(${vals.join(' + ')}) ÷ ${cnt} = ${vals.reduce((s, x) => s + x, 0)} ÷ ${cnt} = ${n(m)}`,
          errs: errsF(m, [{ v: vals.slice().sort((x, y) => x - y)[Math.floor(cnt / 2)], m: 'Ça ressemble à la médiane. La moyenne se calcule avec la somme des valeurs.' }]),
          hints: H('Additionne toutes les notes.', 'Moyenne = somme ÷ nombre de notes.', 'Exemple : 10, 12, 14 → 36 ÷ 3 = 12.') };
      } },
      { id: 'st-med', lv: [1, 2, 3], auto: true, f(L) {
        const cnt = L === 3 ? pick([6, 8]) : pick([5, 7]); let vals;
        do { vals = Array.from({ length: cnt }, () => R(2, 30)); } while (new Set(vals).size < cnt);
        const s = vals.slice().sort((x, y) => x - y), med = cnt % 2 ? s[(cnt - 1) / 2] : (s[cnt / 2 - 1] + s[cnt / 2]) / 2;
        const ctx = pick(['Températures relevées (°C)', 'Nombre de SMS envoyés par jour', 'Temps de trajet (min)']);
        return { html: `${ctx} : ${M_(vals.join(' ; '))}.<br>Déterminer la médiane de cette série.`, v: med, ans: a(med),
          corr: `Série rangée : ${s.join(' ; ')}. ${cnt % 2 ? `Il y a ${cnt} valeurs : la médiane est la ${(cnt + 1) / 2}e valeur, ${med}.` : `Il y a ${cnt} valeurs : la médiane est entre la ${cnt / 2}e et la ${cnt / 2 + 1}e valeur : (${s[cnt / 2 - 1]} + ${s[cnt / 2]}) ÷ 2 = ${n(med)}.`}`,
          errs: errsF(med, [{ v: cnt % 2 ? vals[(cnt - 1) / 2] : (vals[cnt / 2 - 1] + vals[cnt / 2]) / 2, m: 'Il faut d’abord ranger les valeurs dans l’ordre croissant.' }, { v: s.reduce((x, y) => x + y, 0) / cnt, m: 'Ça, c’est la moyenne.' }]),
          hints: H('Range d’abord les valeurs dans l’ordre croissant.', cnt % 2 ? 'Avec un nombre impair de valeurs, la médiane est la valeur du milieu.' : 'Avec un nombre pair de valeurs, la médiane est la moyenne des deux valeurs du milieu.', 'Exemple : 3 ; 5 ; 8 ; 10 → (5 + 8) ÷ 2 = 6,5.') };
      } },
      { id: 'st-etd', lv: [1], auto: true, f() {
        const vals = Array.from({ length: R(6, 8) }, () => R(-5, 35)), mx = Math.max(...vals), mn = Math.min(...vals), v = mx - mn;
        return { html: `Températures relevées (°C) : ${M_(vals.map(n).join(' ; '))}.<br>Calculer l’étendue de cette série.`, v, ans: a(v), corr: `Étendue = ${n(mx)} − ${p(mn)} = ${n(v)}`,
          errs: errsF(v, [{ v: mx, m: 'L’étendue est la différence entre la plus grande et la plus petite valeur.' }, { v: mx + mn, m: 'Attention au signe : on soustrait la plus petite valeur.' }]),
          hints: H('Repère la plus grande et la plus petite valeur.', 'Étendue = maximum − minimum.', '') };
      } },
      { id: 'st-pond', lv: [3, 4], auto: false, calc: true, f(L) {
        const notes = shuffle([6, 8, 10, 12, 14, 15, 16, 18]).slice(0, 4).sort((x, y) => x - y), eff = notes.map(() => R(1, 8));
        const N = eff.reduce((s, x) => s + x, 0), S = notes.reduce((s, x, i) => s + x * eff[i], 0), v = S / N;
        return { html: `Voici les notes obtenues par une classe à un contrôle :${htable('Note', notes, 'Effectif', eff)}Calculer la note moyenne de la classe, arrondie au dixième.`, v, round: 1, ans: a(roundTo(v, 1)),
          corr: `Somme : ${notes.map((x, i) => `${x} × ${eff[i]}`).join(' + ')} = ${S}. Effectif total : ${N}. Moyenne : ${S} ÷ ${N} ≈ ${n(roundTo(v, 1))}.`,
          errs: errsF(v, [{ v: notes.reduce((s, x) => s + x, 0) / 4, m: 'Chaque note doit être comptée autant de fois que son effectif.' }]),
          hints: H('Chaque note compte autant de fois que son effectif.', 'Multiplie chaque note par son effectif, additionne, puis divise par l’effectif total.', '') };
      } },
      { id: 'st-need', lv: [4], auto: false, f() {
        let ns, M_t, v; do { ns = [R(6, 18), R(6, 18), R(6, 18)]; M_t = R(10, 15); v = 4 * M_t - ns.reduce((s, x) => s + x, 0); } while (v < 0 || v > 20);
        return { html: `Mila a obtenu ${ns.join(', ')} à ses trois premiers contrôles. Quelle note doit-elle obtenir au quatrième pour avoir exactement ${M_t} de moyenne ?`, v, ans: String(v),
          corr: `Pour une moyenne de ${M_t} sur 4 notes, la somme doit être 4 × ${M_t} = ${4 * M_t}. Elle a déjà ${ns.reduce((s, x) => s + x, 0)}. Il lui faut ${v}.`,
          errs: errsF(v, [{ v: M_t, m: 'Les trois premières notes ne sont pas toutes égales à ' + M_t + ' : calcule la somme nécessaire.' }]),
          hints: H('Quelle somme des 4 notes faut-il pour cette moyenne ?', `Somme nécessaire = 4 × ${M_t}. Soustrais la somme des trois premières notes.`, '') };
      } },
      { id: 'st-freq', lv: [2], auto: true, f() {
        const tot = pick([20, 25, 50]), vals = ['Bus', 'Vélo', 'À pied', 'Voiture']; let e = [R(1, 10), R(1, 10), R(1, 10)]; const last = tot - e.reduce((s, x) => s + x, 0);
        if (last < 1) return stat.gens[5].f(2); e.push(last); const i = R(0, 3), v = e[i] / tot * 100;
        return { html: `Moyen de transport des élèves d’un groupe :${htable('Transport', vals, 'Effectif', e)}Quelle est la fréquence, en %, des élèves qui viennent « ${vals[i]} » ?`, v, suffix: '%', ans: a(v), corr: `${e[i]} ÷ ${tot} = ${n(e[i] / tot)}, soit ${n(v)} %.`,
          errs: errsF(v, [{ v: e[i] / tot, m: 'Multiplie par 100 pour obtenir un pourcentage.' }]), hints: H('Fréquence = effectif ÷ effectif total.', 'Calcule l’effectif total, divise, puis multiplie par 100.', '') };
      } }
    ]
  };

  const proba = {
    id: 'proba', name: 'Probabilités', dom: 'df', cls: '5e-3e',
    flash: `<b>Équiprobabilité.</b> P(A) = nombre d'issues favorables ÷ nombre d'issues possibles.<br><b>Bornes.</b> 0 ≤ P(A) ≤ 1. Événement impossible : 0 ; certain : 1.<br><b>Événement contraire.</b> P(non A) = 1 − P(A).<br><b>Deux épreuves.</b> On peut utiliser un arbre ou un tableau à double entrée.`,
    gens: [
      { id: 'pb-urne', lv: [1, 2], auto: true, f(L) {
        const r = R(1, 9), b = R(1, 9), g = L === 2 ? R(1, 6) : 0, T = r + b + g, c = pick(['rouge', 'bleue', ...(g ? ['verte'] : [])]), fav = { rouge: r, bleue: b, verte: g }[c];
        return { html: `Une urne contient ${r} boule${r > 1 ? 's' : ''} rouge${r > 1 ? 's' : ''}, ${b} boule${b > 1 ? 's' : ''} bleue${b > 1 ? 's' : ''}${g ? ` et ${g} boule${g > 1 ? 's' : ''} verte${g > 1 ? 's' : ''}` : ''}, indiscernables au toucher. On tire une boule au hasard.<br>Quelle est la probabilité de tirer une boule ${c} ?`, v: fav / T, ans: `${fav}/${T}`,
          corr: `Il y a ${T} boules en tout, dont ${fav} ${c}${fav > 1 ? 's' : ''} : P = ${F(fav, T)}${gcd(fav, T) > 1 ? ' = ' + FR(fav, T) : ''}.`,
          errs: errsF(fav / T, [{ v: fav / (T - fav), m: `Le dénominateur est le nombre total de boules : ${T}.` }]),
          hints: H('Compte toutes les boules.', 'P = nombre de boules favorables ÷ nombre total de boules.', 'Exemple : 3 rouges et 5 bleues → P(rouge) = 3/8.') };
      } },
      { id: 'pb-de', lv: [1, 2], auto: true, f(L) {
        const fN = L === 1 ? 6 : pick([8, 10, 12, 20]), evs = [['un nombre pair', k => k % 2 === 0], ['un multiple de 3', k => k % 3 === 0], [`un nombre supérieur ou égal à ${Math.ceil(fN / 2) + 1}`, k => k >= Math.ceil(fN / 2) + 1], ['un nombre premier', isPrime], ['un diviseur de 12', k => 12 % k === 0]];
        const [lab, test] = pick(evs), fav = Array.from({ length: fN }, (_, i) => i + 1).filter(test);
        return { html: `On lance un dé équilibré à ${fN} faces, numérotées de 1 à ${fN}. Quelle est la probabilité d’obtenir ${lab} ?`, v: fav.length / fN, ans: `${fav.length}/${fN}`,
          corr: `Issues favorables : ${fav.join(', ')}, soit ${fav.length} issues sur ${fN}. P = ${F(fav.length, fN)}${gcd(fav.length, fN) > 1 ? ' = ' + FR(fav.length, fN) : ''}.`,
          hints: H('Liste les issues favorables.', `P = nombre d’issues favorables ÷ ${fN}.`, '') };
      } },
      { id: 'pb-contr', lv: [2, 3], auto: true, f() {
        if (R(0, 1)) { const pp = R(5, 95) / 100, v = roundTo(1 - pp, 2), ev = pick([['il pleuve demain', 'il ne pleuve pas demain'], ['un joueur gagne', 'il ne gagne pas'], ['le bus soit en retard', 'il ne soit pas en retard']]);
          return { html: `La probabilité qu’${ev[0]} est ${n(pp)}. Quelle est la probabilité qu’${ev[1]} ?`, v, ans: a(v), corr: `C’est l’événement contraire : 1 − ${n(pp)} = ${n(v)}.`,
            errs: errsF(v, [{ v: pp, m: 'On cherche la probabilité de l’événement contraire : 1 − P.' }]), hints: H('C’est l’événement contraire.', 'P(non A) = 1 − P(A).', '') }; }
        const d = R(3, 12), nn = R(1, d - 1);
        return { html: `La probabilité d’un événement A est ${F(nn, d)}. Quelle est la probabilité de l’événement contraire de A ?`, v: (d - nn) / d, ans: `${d - nn}/${d}`, corr: `P(non A) = 1 − ${F(nn, d)} = ${F(d - nn, d)}.`,
          errs: errsF((d - nn) / d, [{ v: nn / d, m: 'On cherche la probabilité de l’événement contraire : 1 − P(A).' }]), hints: H('Événement contraire.', 'P(non A) = 1 − P(A).', '') };
      } },
      { id: 'pb-2', lv: [3, 4], auto: false, f(L) {
        if (L === 3) { const r = R(1, 6), b = R(1, 6), T = r + b, v = (r / T) ** 2;
          return { html: `Une urne contient ${r} boule${r > 1 ? 's' : ''} rouge${r > 1 ? 's' : ''} et ${b} bleue${b > 1 ? 's' : ''}. On tire une boule, on note sa couleur, on la <b>remet</b> dans l’urne, puis on tire une deuxième boule.<br>Quelle est la probabilité de tirer deux boules rouges ?`, v, ans: `${r * r}/${T * T}`,
            corr: `Les deux tirages sont identiques et indépendants : P = ${F(r, T)} × ${F(r, T)} = ${F(r * r, T * T)}${gcd(r * r, T * T) > 1 ? ' = ' + FR(r * r, T * T) : ''}.`,
            errs: errsF(v, [{ v: 2 * r / T, m: 'Sur un chemin de l’arbre, on multiplie les probabilités, on ne les additionne pas.' }, { v: r / T, m: 'Ça, c’est la probabilité pour un seul tirage.' }]), hints: H('Dessine un arbre à deux niveaux.', 'La probabilité d’un chemin est le produit des probabilités de ses branches.', '') }; }
        const s = R(3, 11), fav = Array.from({ length: 6 }, (_, i) => i + 1).filter(i => s - i >= 1 && s - i <= 6).length;
        return { html: `On lance deux dés équilibrés à 6 faces et on additionne les deux nombres obtenus.<br>Quelle est la probabilité d’obtenir une somme égale à ${s} ?`, v: fav / 36, ans: `${fav}/36`,
          corr: `Il y a 6 × 6 = 36 issues équiprobables. Celles qui donnent ${s} : ${Array.from({ length: 6 }, (_, i) => i + 1).filter(i => s - i >= 1 && s - i <= 6).map(i => `(${i} ; ${s - i})`).join(', ')}, soit ${fav}. P = ${F(fav, 36)}${gcd(fav, 36) > 1 ? ' = ' + FR(fav, 36) : ''}.`,
          errs: errsF(fav / 36, [{ v: 1 / 11, m: 'Les 11 sommes possibles ne sont pas équiprobables : fais un tableau à double entrée.' }]), hints: H('Fais un tableau à double entrée 6 × 6.', 'Compte les cases dont la somme vaut ' + s + ', puis divise par 36.', '') };
      } },
      { id: 'pb-qcm', lv: [1], auto: true, f() {
        const t = R(0, 2);
        const Q = [['Quelle est la probabilité d’un événement certain ?', ['0', '0,5', '1', '100'], 2, 'Un événement certain a une probabilité de 1.'],
          ['Quelle est la probabilité d’un événement impossible ?', ['0', '0,5', '1', '−1'], 0, 'Un événement impossible a une probabilité de 0.'],
          ['Lequel de ces nombres ne peut pas être une probabilité ?', ['0,3', '1', '4/5', '1,2'], 3, 'Une probabilité est toujours comprise entre 0 et 1 : 1,2 est impossible.']][t];
        return { type: 'qcm', html: Q[0], choices: Q[1], correct: Q[2], ans: String(Q[2]), corr: Q[3], hints: H('Une probabilité est comprise entre 0 et 1.', '0 : impossible ; 1 : certain.', '') };
      } }
    ]
  };

  /* =====================================================================
     GRANDEURS ET MESURES
     ===================================================================== */
  const UL = ['cm', 'cm²', 'cm³'];
  const aire = {
    id: 'aire', name: 'Aires, périmètres et volumes', dom: 'gm', cls: '6e-3e',
    flash: `<b>Aires.</b> Rectangle : L × l. Triangle : base × hauteur ÷ 2. Disque : π × r².<br><b>Périmètre du cercle.</b> 2 × π × r.<br><b>Volumes.</b> Pavé : L × l × h. Cylindre : π × r² × h. Pyramide et cône : aire de la base × hauteur ÷ 3. Boule : 4/3 × π × r³.<br><b>Agrandissement de rapport k.</b> Longueurs × k, aires × k², volumes × k³.`,
    gens: [
      { id: 'ar-plane', lv: [1, 2], auto: true, f(L) {
        const t = L === 1 ? pick(['rect-a', 'rect-p', 'tri']) : pick(['disk-a', 'circ', 'tri']);
        if (t === 'rect-a' || t === 'rect-p') { const Lg = R(3, 15), lg = R(2, Lg - 1), area = t === 'rect-a', v = area ? Lg * lg : 2 * (Lg + lg);
          return { html: `Un rectangle mesure ${Lg} cm de long et ${lg} cm de large. Calculer son ${area ? 'aire' : 'périmètre'}.`, v, unit: area ? 'cm²' : 'cm', units: UL, ans: a(v),
            corr: area ? `Aire = ${Lg} × ${lg} = ${v} cm²` : `Périmètre = 2 × (${Lg} + ${lg}) = ${v} cm`,
            errs: errsF(v, [{ v: area ? 2 * (Lg + lg) : Lg * lg, m: area ? 'Tu as calculé le périmètre. L’aire est la surface : longueur × largeur.' : 'Tu as calculé l’aire. Le périmètre est le tour de la figure.' }, { v: Lg + lg, m: 'Le périmètre compte deux longueurs et deux largeurs.' }]),
            hints: H(area ? 'L’aire mesure la surface.' : 'Le périmètre est la longueur du tour.', area ? 'Aire = longueur × largeur.' : 'Périmètre = 2 × (longueur + largeur).', '') }; }
        if (t === 'tri') { const b = R(2, 14) * 2, h = R(2, 12), v = b * h / 2;
          return { html: `Un triangle a une base de ${b} cm et une hauteur relative à cette base de ${h} cm. Calculer son aire.`, v, unit: 'cm²', units: UL, ans: a(v), corr: `Aire = ${b} × ${h} ÷ 2 = ${v} cm²`,
            errs: errsF(v, [{ v: b * h, m: 'N’oublie pas de diviser par 2 pour un triangle.' }]), hints: H('Un triangle, c’est la moitié d’un rectangle.', 'Aire = base × hauteur ÷ 2.', '') }; }
        const r = R(2, 10), area = t === 'disk-a', v = area ? Math.PI * r * r : 2 * Math.PI * r;
        return { html: `Donner ${area ? 'l’aire d’un disque' : 'le périmètre d’un cercle'} de rayon ${r} cm, en valeur exacte (en fonction de π).`, v, form: 'pi', unit: area ? 'cm²' : 'cm', units: UL, ans: area ? `${r * r}pi` : `${2 * r}pi`,
          approx: 'La consigne demande la valeur exacte : garde π dans ta réponse.',
          corr: area ? `Aire = π × ${r}² = ${r * r}π cm²` : `Périmètre = 2 × π × ${r} = ${2 * r}π cm`,
          errs: [{ v: area ? 2 * Math.PI * r : Math.PI * r * r, m: area ? 'Tu as calculé le périmètre (2πr). L’aire est πr².' : 'Tu as calculé l’aire (πr²). Le périmètre est 2πr.' }, { v: area ? Math.PI * 2 * r : NaN, m: 'r² signifie r × r, pas 2 × r.' }],
          hints: H('Utilise la touche π.', area ? 'Aire d’un disque = π × r².' : 'Périmètre d’un cercle = 2 × π × r.', 'Exemple : rayon 3 cm → aire 9π cm².') };
      } },
      { id: 'ar-vol', lv: [1, 2, 3], auto: true, f(L) {
        if (L === 1) { const x = R(2, 10), y = R(2, 8), z = R(2, 6), v = x * y * z;
          return { html: `Un pavé droit mesure ${x} cm × ${y} cm × ${z} cm. Calculer son volume.`, v, unit: 'cm³', units: UL, ans: a(v), corr: `V = ${x} × ${y} × ${z} = ${v} cm³`,
            errs: errsF(v, [{ v: x + y + z, m: 'Le volume d’un pavé est le produit des trois dimensions.' }, { v: 2 * (x * y + y * z + x * z), m: 'Tu as calculé l’aire totale des faces, pas le volume.' }]), hints: H('Volume d’un pavé : produit des trois dimensions.', 'V = longueur × largeur × hauteur.', '') }; }
        if (L === 2) { const B = R(2, 12) * 3, h = R(2, 10), sq = pick(['pyramide à base carrée', 'pyramide']); const c = R(2, 6), v = c * c * h / 3;
          if (!Number.isInteger(v)) return aire.gens[1].f(2);
          return { html: `Une ${sq} a une base carrée de côté ${c} cm et une hauteur de ${h} cm. Calculer son volume.`, v, unit: 'cm³', units: UL, ans: a(v), corr: `Aire de la base : ${c}² = ${c * c} cm². V = ${c * c} × ${h} ÷ 3 = ${n(v)} cm³`,
            errs: errsF(v, [{ v: c * c * h, m: 'Pour une pyramide, on divise par 3.' }]), hints: H('Volume d’une pyramide = aire de la base × hauteur ÷ 3.', `Aire de la base : ${c} × ${c}.`, '') }; }
        const r = R(2, 8), h = R(3, 15), v = Math.PI * r * r * h;
        return { html: `Un cylindre a un rayon de ${r} cm et une hauteur de ${h} cm. Calculer son volume, arrondi au cm³.`, v, round: 0, unit: 'cm³', units: UL, ans: a(roundTo(v, 0)), calc: true,
          corr: `V = π × ${r}² × ${h} = ${r * r * h}π ≈ ${n(roundTo(v, 0))} cm³`,
          errs: errsF(v, [{ v: roundTo(2 * Math.PI * r * h, 0), m: 'Le volume d’un cylindre est π × r² × h.' }]), hints: H('Volume du cylindre = aire du disque de base × hauteur.', 'V = π × r² × h, puis arrondis.', '') };
      } },
      { id: 'ar-comp', lv: [3, 4], auto: false, calc: true, f(L) {
        if (L === 3) { const Lg = R(4, 12), lg = R(2, 8) * 2, v = Lg * lg + Math.PI * (lg / 2) ** 2 / 2;
          return { html: `Une figure est formée d’un rectangle de ${Lg} cm sur ${lg} cm, et d’un demi-disque de diamètre ${lg} cm accolé à la largeur. Calculer l’aire de la figure, arrondie au dixième de cm².`, v, round: 1, unit: 'cm²', units: UL, ans: a(roundTo(v, 1)),
            corr: `Rectangle : ${Lg} × ${lg} = ${Lg * lg} cm². Demi-disque de rayon ${lg / 2} : π × ${lg / 2}² ÷ 2 ≈ ${n(roundTo(Math.PI * (lg / 2) ** 2 / 2, 2))} cm². Total ≈ ${n(roundTo(v, 1))} cm².`,
            errs: errsF(v, [{ v: Lg * lg + Math.PI * lg * lg / 2, m: 'Le rayon est la moitié du diamètre.' }, { v: Lg * lg + Math.PI * (lg / 2) ** 2, m: 'C’est un demi-disque : divise l’aire du disque par 2.' }]),
            hints: H('Découpe la figure en deux parties.', 'Aire du rectangle + aire du demi-disque (π × r² ÷ 2, avec r = diamètre ÷ 2).', '') }; }
        if (R(0, 1)) { const r = R(2, 9), v = 4 / 3 * Math.PI * r ** 3;
          return { html: `Calculer le volume d’une boule de rayon ${r} cm, arrondi au cm³.`, v, round: 0, unit: 'cm³', units: UL, ans: a(roundTo(v, 0)), corr: `V = 4/3 × π × ${r}³ ≈ ${n(roundTo(v, 0))} cm³`,
            errs: errsF(v, [{ v: roundTo(4 * Math.PI * r * r, 0), m: 'Tu as calculé l’aire de la sphère. Le volume de la boule est 4/3 × π × r³.' }]), hints: H('Formule du volume d’une boule.', 'V = 4/3 × π × r³.', '') }; }
        const r = R(2, 8), h = R(4, 15), v = Math.PI * r * r * h / 3;
        return { html: `Un cône de révolution a un rayon de base de ${r} cm et une hauteur de ${h} cm. Calculer son volume, arrondi au cm³.`, v, round: 0, unit: 'cm³', units: UL, ans: a(roundTo(v, 0)), corr: `V = π × ${r}² × ${h} ÷ 3 ≈ ${n(roundTo(v, 0))} cm³`,
          errs: errsF(v, [{ v: roundTo(Math.PI * r * r * h, 0), m: 'Pour un cône, on divise par 3.' }]), hints: H('Un cône, c’est comme une pyramide.', 'V = aire de la base × hauteur ÷ 3 = π × r² × h ÷ 3.', '') };
      } },
      { id: 'ar-agr', lv: [4], auto: true, f() {
        const k = pick([2, 3, 0.5, 4]), t = R(0, 1);
        if (t) { const V = R(2, 20) * 8, v = V * k ** 3;
          return { html: `Un solide a un volume de ${V} cm³. On l’${k < 1 ? 'réduit' : 'agrandit'} avec un rapport ${n(k)}. Quel est le volume du nouveau solide ?`, v, unit: 'cm³', units: UL, ans: a(v), corr: `Les volumes sont multipliés par k³ = ${n(k)}³ = ${n(k ** 3)}. ${V} × ${n(k ** 3)} = ${n(v)} cm³.`,
            errs: errsF(v, [{ v: V * k, m: 'Les volumes ne sont pas multipliés par k, mais par k³.' }, { v: V * k * k, m: 'k² concerne les aires ; pour un volume, c’est k³.' }]), hints: H('Dans un agrandissement de rapport k, que deviennent les volumes ?', 'Volumes × k³.', '') }; }
        const A = R(2, 30) * 4, v = A * k * k;
        return { html: `Une figure a une aire de ${A} cm². On l’${k < 1 ? 'réduit' : 'agrandit'} avec un rapport ${n(k)}. Quelle est l’aire de la nouvelle figure ?`, v, unit: 'cm²', units: UL, ans: a(v), corr: `Les aires sont multipliées par k² = ${n(k * k)}. ${A} × ${n(k * k)} = ${n(v)} cm².`,
          errs: errsF(v, [{ v: A * k, m: 'Les aires ne sont pas multipliées par k, mais par k².' }]), hints: H('Dans un agrandissement de rapport k, que deviennent les aires ?', 'Aires × k².', '') };
      } }
    ]
  };

  const conv = {
    id: 'conv', name: 'Conversions et vitesses', dom: 'gm', cls: '6e-4e',
    flash: `<b>Longueurs.</b> 1 km = 1 000 m ; 1 m = 100 cm.<br><b>Aires.</b> 1 m² = 10 000 cm² (on multiplie par 100 à chaque rang).<br><b>Volumes.</b> 1 dm³ = 1 L ; 1 cm³ = 1 mL ; 1 m³ = 1 000 L.<br><b>Durées.</b> 1 h = 60 min : 0,5 h = 30 min ; 15 min = 0,25 h.<br><b>Vitesse.</b> v = d ÷ t ; d = v × t ; t = d ÷ v. 36 km/h = 10 m/s (diviser par 3,6).`,
    gens: [
      { id: 'cv-len', lv: [1, 2], auto: true, f(L) {
        const T1 = [['km', 'm', 1000], ['m', 'cm', 100], ['cm', 'mm', 10], ['m', 'km', 0.001], ['cm', 'm', 0.01], ['kg', 'g', 1000], ['g', 'kg', 0.001], ['L', 'mL', 1000], ['L', 'cL', 100]];
        const T2 = [['m²', 'cm²', 10000], ['cm²', 'mm²', 100], ['dm³', 'L', 1], ['cm³', 'mL', 1], ['m³', 'L', 1000], ['L', 'cm³', 1000], ['cm²', 'm²', 0.0001], ['km²', 'm²', 1000000]];
        const [u1, u2, f] = pick(L === 1 ? T1 : T2), x = pick([R(2, 95) / 10, R(2, 60), R(1, 9) / 2]), v = roundTo(x * f, 8);
        const lin1 = ['m²', 'cm²', 'km²', 'mm²'].includes(u1) ? Math.round(Math.sqrt(f >= 1 ? f : 1 / f)) : f >= 1 ? f : 1 / f;
        return { html: `Convertir : ${M_(`${n(x)} ${u1} = … ${u2}`)}`, v, suffix: u2, ans: a(v), corr: `${n(x)} ${u1} = ${n(v)} ${u2} (${f >= 1 ? '× ' + n(f) : '÷ ' + n(1 / f)})`,
          errs: errsF(v, [{ v: roundTo(x / f, 8), m: 'Tu as converti dans le mauvais sens : ' + (f >= 1 ? 'on passe à une unité plus petite, le nombre doit augmenter.' : 'on passe à une unité plus grande, le nombre doit diminuer.') }, ...(lin1 !== (f >= 1 ? f : 1 / f) ? [{ v: roundTo(f >= 1 ? x * lin1 : x / lin1, 8), m: 'Pour les aires, on multiplie par 100 (et non par 10) à chaque rang.' }] : [])]),
          hints: H(`Combien de ${u2} dans 1 ${u1} ?`, 'Utilise un tableau de conversion.', 'Exemple : 1 m² = 10 000 cm² ; 1 dm³ = 1 L.') };
      } },
      { id: 'cv-dur', lv: [1, 2, 3], auto: true, f(L) {
        if (L === 1) { const h = pick([0.5, 1.5, 2.5, 0.25, 0.75, 1.25, 3, 2]), v = h * 60;
          return { html: `Convertir ${M_(`${n(h)} h`)} en minutes.`, v, suffix: 'min', ans: a(v), corr: `${n(h)} × 60 = ${n(v)} min`,
            errs: errsF(v, [{ v: h * 100, m: '1 h = 60 min, pas 100 min.' }]), hints: H('1 h = 60 min.', 'Multiplie par 60.', 'Exemple : 1,5 h = 90 min.') }; }
        if (L === 2) { const m = pick([15, 30, 45, 6, 12, 18, 24, 36, 48, 54, 90]), v = m / 60;
          return { html: `Convertir ${M_(`${m} min`)} en heures (nombre décimal).`, v, suffix: 'h', ans: a(v), corr: `${m} ÷ 60 = ${n(v)} h`,
            errs: errsF(v, [{ v: m / 100, m: 'Une heure compte 60 minutes, pas 100 : divise par 60.' }]), hints: H('Divise par 60.', '1 min = 1/60 h.', 'Exemple : 45 min = 45/60 h = 0,75 h.') }; }
        const h = R(1, 4), m = pick([15, 30, 45, 12, 6, 24, 36]), v = h + m / 60;
        return { html: `Convertir ${M_(`${h} h ${m} min`)} en heures (nombre décimal).`, v, suffix: 'h', ans: a(v), corr: `${m} min = ${m} ÷ 60 = ${n(m / 60)} h, donc ${h} h ${m} min = ${n(v)} h.`,
          errs: errsF(v, [{ v: h + m / 100, m: `${h} h ${m} min ne s’écrit pas ${h},${m} h : les minutes se convertissent en divisant par 60.` }]), hints: H('Convertis seulement les minutes.', 'Minutes ÷ 60, puis ajoute les heures.', '') };
      } },
      { id: 'cv-vit', lv: [2, 3, 4], auto: true, f(L) {
        if (L === 2) { const v0 = pick([40, 50, 60, 80, 90, 100, 120]), t = pick([2, 3, 4, 0.5, 1.5]), d = v0 * t;
          return { html: `Une voiture parcourt ${n(d)} km en ${n(t)} h à vitesse constante. Quelle est sa vitesse ?`, v: v0, suffix: 'km/h', ans: String(v0), corr: `v = d ÷ t = ${n(d)} ÷ ${n(t)} = ${v0} km/h`,
            errs: errsF(v0, [{ v: d * t, m: 'La vitesse s’obtient par une division : distance ÷ durée.' }]), hints: H('Vitesse = distance ÷ durée.', 'Divise la distance (km) par la durée (h).', '') }; }
        if (L === 3) { const v0 = pick([30, 45, 60, 90, 120, 15]), mi = pick([10, 20, 30, 40, 45, 15]), d = v0 * mi / 60;
          if (!Number.isInteger(d * 2)) return conv.gens[2].f(3);
          return { html: `Un train roule à ${v0} km/h. Quelle distance parcourt-il en ${mi} minutes ?`, v: d, suffix: 'km', ans: a(d), corr: `${mi} min = ${n(mi / 60)} h. d = v × t = ${v0} × ${n(mi / 60)} = ${n(d)} km.`,
            errs: errsF(d, [{ v: v0 * mi, m: 'La vitesse est en km/h : convertis d’abord la durée en heures.' }, { v: v0 * mi / 100, m: '1 h = 60 min : ' + mi + ' min = ' + mi + '/60 h.' }]), hints: H('Convertis la durée en heures.', 'd = v × t, avec t en heures.', 'Exemple : 60 km/h pendant 20 min → 60 × 1/3 = 20 km.') }; }
        const v0 = pick([18, 36, 54, 72, 90, 108, 126]), w = v0 / 3.6;
        return { html: `Convertir une vitesse de ${v0} km/h en m/s.`, v: w, suffix: 'm/s', ans: a(w), corr: `${v0} km/h = ${v0} 000 m en 3 600 s, soit ${v0} ÷ 3,6 = ${n(w)} m/s.`,
          errs: errsF(w, [{ v: v0 * 3.6, m: 'On passe à une unité plus petite par seconde : le nombre diminue. Divise par 3,6.' }]), hints: H('1 km = 1 000 m et 1 h = 3 600 s.', 'Multiplie par 1 000 puis divise par 3 600 (soit diviser par 3,6).', '') };
      } }
    ]
  };

  /* =====================================================================
     ESPACE ET GÉOMÉTRIE
     ===================================================================== */
  const TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [7, 24, 25], [12, 16, 20], [20, 21, 29], [9, 40, 41], [15, 20, 25]];
  const pyth = {
    id: 'pyth', name: 'Théorème de Pythagore', dom: 'eg', cls: '4e', red: true,
    flash: `<b>Théorème.</b> Si un triangle est rectangle, le carré de l'hypoténuse est égal à la somme des carrés des deux autres côtés.<br><b>Réciproque.</b> Si le carré du plus grand côté est égal à la somme des carrés des deux autres, le triangle est rectangle.<br><b>Rédaction.</b> Dans le triangle ABC rectangle en B, d'après le théorème de Pythagore : AC² = AB² + BC².<br><b>Piège.</b> L'hypoténuse est le côté opposé à l'angle droit, c'est le plus long.`,
    gens: [
      { id: 'py-hyp', lv: [1, 2], auto: true, f(L) {
        const [x, y, z] = pick(TRIPLES), T = pick(TRI), [P, Q, S] = T.split(''), hyp = L === 1;
        if (hyp) return { html: `Le triangle ${T} est rectangle en ${Q}, avec ${P}${Q} = ${x} cm et ${Q}${S} = ${y} cm. Calculer ${P}${S}.${rightTri(P, Q, S, { PQ: x + ' cm', QS: y + ' cm', PS: '?' })}`, v: z, suffix: 'cm', ans: String(z),
          corr: `${P}${S}² = ${P}${Q}² + ${Q}${S}² = ${x}² + ${y}² = ${x * x} + ${y * y} = ${z * z}, donc ${P}${S} = √${z * z} = ${z} cm.`,
          errs: errsF(z, [{ v: x + y, m: 'Il faut additionner les carrés des côtés, puis prendre la racine carrée.' }, { v: x * x + y * y, m: `${z * z} est la valeur de ${P}${S}². Il reste à prendre la racine carrée.` }]),
          hints: H('Repère l’hypoténuse : le côté opposé à l’angle droit.', `${P}${S}² = ${P}${Q}² + ${Q}${S}², puis racine carrée.`, 'Exemple : côtés 3 et 4 → 9 + 16 = 25 → 5.') };
        return { html: `Le triangle ${T} est rectangle en ${Q}, avec ${P}${S} = ${z} cm et ${Q}${S} = ${y} cm. Calculer ${P}${Q}.${rightTri(P, Q, S, { PQ: '?', QS: y + ' cm', PS: z + ' cm' })}`, v: x, suffix: 'cm', ans: String(x),
          corr: `${P}${S}² = ${P}${Q}² + ${Q}${S}², donc ${P}${Q}² = ${z}² − ${y}² = ${z * z} − ${y * y} = ${x * x}, et ${P}${Q} = ${x} cm.`,
          errs: errsF(x, [{ v: roundTo(Math.sqrt(z * z + y * y), 1), m: `${P}${S} est l’hypoténuse : on cherche un côté de l’angle droit, donc on soustrait.` }, { v: z - y, m: 'On soustrait les carrés, pas les longueurs.' }]),
          hints: H('Le côté cherché n’est pas l’hypoténuse.', `${P}${Q}² = ${P}${S}² − ${Q}${S}², puis racine carrée.`, 'Exemple : hypoténuse 13 et côté 5 → 169 − 25 = 144 → 12.') };
      } },
      { id: 'py-arr', lv: [3, 4], auto: false, calc: true, f() {
        const x = R(2, 12), y = R(2, 12), T = pick(TRI), [P, Q, S] = T.split(''), hyp = R(0, 1);
        if (hyp) { const v = Math.sqrt(x * x + y * y); if (Number.isInteger(v)) return pyth.gens[1].f(3);
          return { html: `Le triangle ${T} est rectangle en ${Q}, avec ${P}${Q} = ${x} cm et ${Q}${S} = ${y} cm. Calculer ${P}${S}, arrondie au dixième.${rightTri(P, Q, S, { PQ: x + ' cm', QS: y + ' cm', PS: '?' })}`, v, round: 1, suffix: 'cm', ans: a(roundTo(v, 1)),
            corr: `${P}${S}² = ${x}² + ${y}² = ${x * x + y * y}, donc ${P}${S} = √${x * x + y * y} ≈ ${n(roundTo(v, 1))} cm.`,
            errs: errsF(v, [{ v: x * x + y * y, m: 'Prends la racine carrée pour obtenir la longueur.' }]), hints: H('Pythagore : somme des carrés.', `${P}${S}² = ${x}² + ${y}², puis √ et arrondi.`, '') }; }
        const z = Math.max(x, y) + R(1, 6), yy = Math.min(x, y), v = Math.sqrt(z * z - yy * yy);
        if (Number.isInteger(v)) return pyth.gens[1].f(3);
        return { html: `Le triangle ${T} est rectangle en ${Q}, avec ${P}${S} = ${z} cm et ${Q}${S} = ${yy} cm. Calculer ${P}${Q}, arrondie au dixième.${rightTri(P, Q, S, { PQ: '?', QS: yy + ' cm', PS: z + ' cm' })}`, v, round: 1, suffix: 'cm', ans: a(roundTo(v, 1)),
          corr: `${P}${Q}² = ${z}² − ${yy}² = ${z * z - yy * yy}, donc ${P}${Q} = √${z * z - yy * yy} ≈ ${n(roundTo(v, 1))} cm.`,
          errs: errsF(v, [{ v: roundTo(Math.sqrt(z * z + yy * yy), 1), m: `${P}${S} est l’hypoténuse : pour un côté de l’angle droit, on soustrait.` }]), hints: H('Le côté cherché n’est pas l’hypoténuse.', `${P}${Q}² = ${z}² − ${yy}², puis √ et arrondi.`, '') };
      } },
      { id: 'py-rec', lv: [3, 4], auto: true, f() {
        const T = pick(TRI), [A, B, C] = T.split(''), ok = R(0, 1); let [x, y, z] = pick(TRIPLES); if (!ok) z += pick([1, -1]);
        const sides = shuffle([[`${A}${B}`, x], [`${B}${C}`, y], [`${A}${C}`, z]]); const big = sides.reduce((m, s) => (s[1] > m[1] ? s : m)), others = sides.filter(s => s !== big);
        const opp = T.split('').find(ch => !big[0].includes(ch)), c = [`Oui, il est rectangle en ${opp}`, 'Non, il n’est pas rectangle', 'On ne peut pas savoir sans figure'];
        const s2 = others[0][1] ** 2 + others[1][1] ** 2;
        return { type: 'qcm', html: `Dans le triangle ${T} : ${sides.map(s => `${s[0]} = ${s[1]} cm`).join(', ')}.<br>Ce triangle est-il rectangle ?`, choices: c, correct: ok ? 0 : 1, ans: ok ? '0' : '1',
          corr: `Le plus grand côté est [${big[0]}]. ${big[0]}² = ${big[1] ** 2} et ${others[0][0]}² + ${others[1][0]}² = ${others[0][1] ** 2} + ${others[1][1] ** 2} = ${s2}. ${ok ? `Les deux résultats sont égaux : d’après la réciproque du théorème de Pythagore, le triangle est rectangle en ${opp}.` : 'Les deux résultats sont différents : le triangle n’est pas rectangle (contraposée du théorème de Pythagore).'}`,
          errs: [{ i: 2, m: 'La réciproque du théorème de Pythagore permet de conclure avec les seules longueurs.' }],
          hints: H('Repère le plus grand côté.', 'Compare le carré du plus grand côté avec la somme des carrés des deux autres.', '') };
      } },
      { id: 'py-ctx', lv: [4], auto: false, calc: true, f() {
        if (R(0, 1)) { const Lc = R(4, 9), d = roundTo(R(8, 25) / 10, 1), v = Math.sqrt(Lc * Lc - d * d);
          return { html: `Une échelle de ${Lc} m est appuyée contre un mur vertical. Son pied est à ${n(d)} m du mur. À quelle hauteur l’échelle touche-t-elle le mur ? Arrondir au dixième de mètre.`, v, round: 1, suffix: 'm', ans: a(roundTo(v, 1)),
            corr: `Le mur, le sol et l’échelle forment un triangle rectangle d’hypoténuse ${Lc} m. h² = ${Lc}² − ${n(d)}² = ${n(Lc * Lc - d * d)}, donc h ≈ ${n(roundTo(v, 1))} m.`,
            errs: errsF(v, [{ v: Math.sqrt(Lc * Lc + d * d), m: 'L’échelle est l’hypoténuse : on soustrait.' }]), hints: H('Repère le triangle rectangle : mur, sol, échelle.', 'L’échelle est l’hypoténuse : h² = L² − d².', '') }; }
        const w = R(40, 140), h = R(30, 90), v = Math.sqrt(w * w + h * h);
        return { html: `Un écran rectangulaire mesure ${w} cm de large et ${h} cm de haut. Calculer la longueur de sa diagonale, arrondie au centimètre.`, v, round: 0, suffix: 'cm', ans: a(roundTo(v, 0)),
          corr: `La diagonale est l’hypoténuse d’un triangle rectangle : d² = ${w}² + ${h}² = ${w * w + h * h}, donc d ≈ ${n(roundTo(v, 0))} cm.`,
          errs: errsF(v, [{ v: w + h, m: 'On additionne les carrés, puis on prend la racine carrée.' }]), hints: H('La diagonale coupe le rectangle en deux triangles rectangles.', 'd² = largeur² + hauteur².', '') };
      } }
    ]
  };

  const thales = {
    id: 'thales', name: 'Théorème de Thalès', dom: 'eg', cls: '4e-3e',
    flash: `<b>Théorème.</b> Si M ∈ [AB], N ∈ [AC] et (MN) // (BC), alors AM/AB = AN/AC = MN/BC.<br><b>Méthode.</b> J'écris les trois rapports égaux, je remplace par les valeurs connues, puis j'utilise un produit en croix.<br><b>Réciproque.</b> Si AM/AB = AN/AC (points alignés dans le même ordre), alors (MN) // (BC).<br><b>Piège.</b> Les longueurs du petit triangle vont toutes au numérateur.`,
    gens: [
      { id: 'th-calc', lv: [1, 2, 3], auto: true, f(L) {
        const [A, B, C, Mm, N] = pick([['A', 'B', 'C', 'M', 'N'], ['E', 'F', 'G', 'K', 'L'], ['R', 'S', 'T', 'U', 'V'], ['O', 'P', 'Q', 'I', 'J']]);
        let pp, q; do { pp = R(1, 5); q = R(pp + 1, 8); } while (gcd(pp, q) !== 1);
        const m = L === 3 ? R(2, 9) / 2 : R(1, 4), nn = L === 3 ? R(2, 9) / 2 : R(1, 4), l = L === 3 ? R(2, 9) / 2 : R(1, 4);
        const AB = m * q, AM = m * pp, AC = nn * q, AN = nn * pp, BC = l * q, MN = l * pp;
        const t = L === 1 ? 'MN' : pick(['AC', 'MN', 'AN', 'BC']);
        const data = { MN: [[`${A}${Mm}`, AM], [`${A}${B}`, AB], [`${B}${C}`, BC]], AC: [[`${A}${Mm}`, AM], [`${A}${B}`, AB], [`${A}${N}`, AN]], AN: [[`${A}${Mm}`, AM], [`${A}${B}`, AB], [`${A}${C}`, AC]], BC: [[`${A}${N}`, AN], [`${A}${C}`, AC], [`${Mm}${N}`, MN]] }[t];
        const v = { MN, AC, AN, BC }[t], lab = { MN: `${Mm}${N}`, AC: `${A}${C}`, AN: `${A}${N}`, BC: `${B}${C}` }[t];
        const rap = `${F(`${A}${Mm}`, `${A}${B}`)} = ${F(`${A}${N}`, `${A}${C}`)} = ${F(`${Mm}${N}`, `${B}${C}`)}`;
        return { html: `Les points ${A}, ${Mm}, ${B} sont alignés, ainsi que ${A}, ${N}, ${C}, et les droites (${Mm}${N}) et (${B}${C}) sont parallèles.<br>On donne ${data.map(d => `${d[0]} = ${n(d[1])} cm`).join(', ')}.<br>Calculer ${lab}.${thalesFig([A, B, C, Mm, N])}`, v, suffix: 'cm', ans: a(v), calc: L === 3,
          corr: `D’après le théorème de Thalès : ${rap}. En remplaçant : ${lab} = ${{ MN: `${n(BC)} × ${n(AM)} ÷ ${n(AB)}`, AC: `${n(AN)} × ${n(AB)} ÷ ${n(AM)}`, AN: `${n(AC)} × ${n(AM)} ÷ ${n(AB)}`, BC: `${n(MN)} × ${n(AC)} ÷ ${n(AN)}` }[t]} = ${n(v)} cm.`,
          errs: errsF(v, [{ v: { MN: BC * AB / AM, AC: AN * AM / AB, AN: AC * AB / AM, BC: MN * AN / AC }[t], m: 'Tu as inversé un rapport : les longueurs du petit triangle sont toutes au numérateur.' }, { v: { MN: BC - (AB - AM), AC: AN + (AB - AM), AN: AC - (AB - AM), BC: MN + (AC - AN) }[t], m: 'Les longueurs sont proportionnelles : on ne peut pas raisonner par différence.' }]),
          hints: H('Écris les trois rapports égaux du théorème de Thalès.', `${rap} ; remplace les longueurs connues, puis fais un produit en croix.`, 'Exemple : AM/AB = MN/BC avec 2/5 = MN/10 → MN = 4.') };
      } },
      { id: 'th-pap', lv: [4], auto: false, calc: true, f() {
        const [A, B, C, D, E] = pick([['A', 'B', 'C', 'D', 'E'], ['O', 'R', 'S', 'T', 'U'], ['I', 'K', 'L', 'M', 'N']]);
        const k = pick([1.5, 2, 2.5, 0.5, 3]), AB = R(2, 8), AC = R(2, 8), BC = R(3, 9), AD = AB * k, DE = BC * k;
        return { html: `Les points ${B}, ${A}, ${D} sont alignés, ainsi que ${C}, ${A}, ${E}, et (${B}${C}) // (${D}${E}).<br>On donne ${A}${B} = ${AB} cm, ${A}${D} = ${n(AD)} cm et ${B}${C} = ${BC} cm. Calculer ${D}${E}.${papillonFig([A, B, C, D, E])}`, v: DE, suffix: 'cm', ans: a(DE),
          corr: `D’après le théorème de Thalès : ${F(`${A}${D}`, `${A}${B}`)} = ${F(`${A}${E}`, `${A}${C}`)} = ${F(`${D}${E}`, `${B}${C}`)}. Donc ${D}${E} = ${BC} × ${n(AD)} ÷ ${AB} = ${n(DE)} cm.`,
          errs: errsF(DE, [{ v: BC * AB / AD, m: 'Vérifie l’ordre des rapports : chaque rapport compare les côtés correspondants des deux triangles.' }]),
          hints: H('C’est une configuration « papillon » : Thalès s’applique aussi.', `${F(`${A}${D}`, `${A}${B}`)} = ${F(`${D}${E}`, `${B}${C}`)}, puis produit en croix.`, '') };
      } },
      { id: 'th-rec', lv: [4], auto: true, f() {
        const [A, B, C, Mm, N] = ['A', 'B', 'C', 'M', 'N'], ok = R(0, 1), AB = R(5, 12), AM = R(2, AB - 2), AC = R(5, 12), AN0 = AM * AC / AB, AN = ok && Number.isInteger(AN0 * 10) ? AN0 : roundTo(AN0 + pick([0.5, -0.5, 1]), 1);
        const good = Math.abs(AM / AB - AN / AC) < 1e-9;
        return { type: 'qcm', html: `M est un point de [AB] et N un point de [AC]. On donne AM = ${AM} cm, AB = ${AB} cm, AN = ${n(AN)} cm et AC = ${AC} cm.<br>Les droites (MN) et (BC) sont-elles parallèles ?`, choices: YN, correct: good ? 0 : 1, ans: good ? '0' : '1',
          corr: `On compare AM/AB = ${AM}/${AB} et AN/AC = ${n(AN)}/${AC}. Produits en croix : ${AM} × ${AC} = ${AM * AC} et ${n(AN)} × ${AB} = ${n(roundTo(AN * AB, 4))}. ${good ? 'Les rapports sont égaux et les points sont alignés dans le même ordre : d’après la réciproque du théorème de Thalès, (MN) // (BC).' : 'Les rapports sont différents : les droites ne sont pas parallèles.'}`,
          hints: H('Compare les rapports AM/AB et AN/AC.', 'Utilise les produits en croix pour vérifier l’égalité.', '') };
      } },
      { id: 'th-ctx', lv: [3, 4], auto: false, calc: true, f() {
        const b = pick([1, 1.2, 1.5, 2]), o = pick([0.8, 1.6, 2, 2.4, 3]), O = o * R(3, 10), v = roundTo(b * O / o, 6);
        return { html: `Au même instant, un bâton vertical de ${n(b)} m projette une ombre de ${n(o)} m, et un arbre projette une ombre de ${n(O)} m. Les rayons du soleil sont parallèles. Quelle est la hauteur de l’arbre ?`, v, suffix: 'm', ans: a(v),
          corr: `Les triangles formés sont en situation de Thalès (rayons parallèles) : hauteur ÷ ${n(O)} = ${n(b)} ÷ ${n(o)}, donc hauteur = ${n(b)} × ${n(O)} ÷ ${n(o)} = ${n(v)} m.`,
          errs: errsF(v, [{ v: o * O / b, m: 'Garde le même ordre : hauteur ÷ ombre, pour le bâton comme pour l’arbre.' }]), hints: H('Les hauteurs sont proportionnelles aux ombres.', 'hauteur de l’arbre ÷ son ombre = hauteur du bâton ÷ son ombre.', '') };
      } }
    ]
  };

  const trigo = {
    id: 'trigo', name: 'Trigonométrie', dom: 'eg', cls: '3e',
    flash: `<b>Dans un triangle rectangle</b>, pour un angle aigu : cos = côté adjacent ÷ hypoténuse ; sin = côté opposé ÷ hypoténuse ; tan = côté opposé ÷ côté adjacent.<br><b>Moyen mnémotechnique.</b> CAH SOH TOA.<br><b>Calculatrice.</b> En mode degrés. Pour un angle : touches cos⁻¹, sin⁻¹, tan⁻¹ (ou Arccos…).<br><b>Piège.</b> Le côté adjacent dépend de l'angle choisi.`,
    gens: [
      { id: 'tr-form', lv: [1, 2], auto: true, f() {
        const T = pick(TRI), [P, Q, S] = T.split(''), fn = pick(['cos', 'sin', 'tan']), at = pick(['S', 'P']), V = at === 'S' ? S : P, other = at === 'S' ? P : S;
        const adj = `${Q}${V === S ? S : P}`.split('').sort().join(''), opp = `${Q}${other}`.split('').sort().join(''), hyp = `${P}${S}`;
        const fr = (u, w) => `${u} / ${w}`;
        const good = { cos: fr(adj, hyp), sin: fr(opp, hyp), tan: fr(opp, adj) }[fn];
        const ch = shuffle([...new Set([good, fr(adj, hyp), fr(opp, hyp), fr(opp, adj), fr(adj, opp)])]).slice(0, 4); if (!ch.includes(good)) ch[0] = good;
        const angle = at === 'S' ? `${P}${S}${Q}` : `${S}${P}${Q}`;
        return { type: 'qcm', html: `Le triangle ${T} est rectangle en ${Q}. Que vaut ${M_(`${fn}(${angle}̂)`)} ?${rightTri(P, Q, S, {}, at)}`, choices: ch, correct: ch.indexOf(good), ans: String(ch.indexOf(good)),
          corr: `Pour l’angle en ${V} : l’hypoténuse est [${hyp}], le côté adjacent est [${adj}], le côté opposé est [${opp}]. ${fn} = ${{ cos: 'adjacent ÷ hypoténuse', sin: 'opposé ÷ hypoténuse', tan: 'opposé ÷ adjacent' }[fn]} = ${good}.`,
          hints: H('Repère l’hypoténuse, puis les côtés adjacent et opposé à l’angle.', 'CAH : cos = adjacent/hypoténuse ; SOH : sin = opposé/hypoténuse ; TOA : tan = opposé/adjacent.', '') };
      } },
      { id: 'tr-side', lv: [2, 3], auto: false, calc: true, f() {
        const T = pick(TRI), [P, Q, S] = T.split(''), ang = R(20, 70), rad = ang * Math.PI / 180, t = pick(['cos', 'sin', 'tan']);
        if (t === 'tan') { const adj = R(3, 15), v = adj * Math.tan(rad);
          return { html: `Le triangle ${T} est rectangle en ${Q}, avec ${Q}${S} = ${adj} cm et l’angle ${P}${S}${Q}̂ = ${ang}°. Calculer ${P}${Q}, arrondie au dixième.${rightTri(P, Q, S, { QS: adj + ' cm', PQ: '?' }, 'S')}`, v, round: 1, suffix: 'cm', ans: a(roundTo(v, 1)),
            corr: `tan(${P}${S}${Q}̂) = ${P}${Q} ÷ ${Q}${S}, donc ${P}${Q} = ${adj} × tan(${ang}°) ≈ ${n(roundTo(v, 1))} cm.`,
            errs: errsF(v, [{ v: adj / Math.tan(rad), m: `${P}${Q} est au numérateur : on multiplie par tan(${ang}°).` }, { v: adj * Math.cos(rad), m: 'On connaît le côté adjacent et on cherche le côté opposé : c’est la tangente.' }]), hints: H('Quels côtés sont en jeu : opposé, adjacent, hypoténuse ?', 'On connaît le côté adjacent et on cherche l’opposé : utilise la tangente.', '') }; }
        const h = R(4, 15), v = t === 'cos' ? h * Math.cos(rad) : h * Math.sin(rad), lab = t === 'cos' ? `${Q}${S}` : `${P}${Q}`;
        return { html: `Le triangle ${T} est rectangle en ${Q}, avec ${P}${S} = ${h} cm et l’angle ${P}${S}${Q}̂ = ${ang}°. Calculer ${lab}, arrondie au dixième.${rightTri(P, Q, S, { PS: h + ' cm', [t === 'cos' ? 'QS' : 'PQ']: '?' }, 'S')}`, v, round: 1, suffix: 'cm', ans: a(roundTo(v, 1)),
          corr: `${t}(${P}${S}${Q}̂) = ${lab} ÷ ${P}${S}, donc ${lab} = ${h} × ${t}(${ang}°) ≈ ${n(roundTo(v, 1))} cm.`,
          errs: errsF(v, [{ v: t === 'cos' ? h * Math.sin(rad) : h * Math.cos(rad), m: 'Vérifie si le côté cherché est adjacent ou opposé à l’angle.' }, { v: h / (t === 'cos' ? Math.cos(rad) : Math.sin(rad)), m: 'Le côté cherché est au numérateur : on multiplie.' }]),
          hints: H('Repère le côté cherché par rapport à l’angle.', t === 'cos' ? 'Côté adjacent et hypoténuse : cosinus.' : 'Côté opposé et hypoténuse : sinus.', '') };
      } },
      { id: 'tr-angle', lv: [3, 4], auto: false, calc: true, f() {
        const T = pick(TRI), [P, Q, S] = T.split(''), t = pick(['cos', 'sin', 'tan']); let x = R(3, 12), y = R(3, 15);
        let v, txt, lab;
        if (t === 'tan') { v = Math.atan(x / y) * 180 / Math.PI; txt = `${P}${Q} = ${x} cm et ${Q}${S} = ${y} cm`; lab = { PQ: x + ' cm', QS: y + ' cm' }; }
        else { const h = Math.max(x, y) + R(1, 5), s = Math.min(x, y); v = (t === 'cos' ? Math.acos(s / h) : Math.asin(s / h)) * 180 / Math.PI; txt = `${P}${S} = ${h} cm et ${t === 'cos' ? `${Q}${S}` : `${P}${Q}`} = ${s} cm`; lab = { PS: h + ' cm', [t === 'cos' ? 'QS' : 'PQ']: s + ' cm' }; x = s; y = h; }
        return { html: `Le triangle ${T} est rectangle en ${Q}, avec ${txt}. Calculer la mesure de l’angle ${P}${S}${Q}̂, arrondie au degré.${rightTri(P, Q, S, lab, 'S')}`, v, round: 0, suffix: '°', ans: a(roundTo(v, 0)),
          corr: `${t}(${P}${S}${Q}̂) = ${t === 'tan' ? `${P}${Q} ÷ ${Q}${S} = ${x}/${y}` : t === 'cos' ? `${Q}${S} ÷ ${P}${S} = ${x}/${y}` : `${P}${Q} ÷ ${P}${S} = ${x}/${y}`}, donc ${P}${S}${Q}̂ = ${t}⁻¹(${x}/${y}) ≈ ${roundTo(v, 0)}°.`,
          errs: errsF(v, [{ v: roundTo(90 - v, 0), m: 'Tu as calculé l’autre angle aigu. Vérifie quel côté est adjacent à l’angle en ' + S + '.' }]),
          hints: H('Choisis la formule avec les deux côtés connus.', 'Calcule le rapport, puis utilise la touche cos⁻¹, sin⁻¹ ou tan⁻¹ de la calculatrice.', '') };
      } },
      { id: 'tr-ctx', lv: [4], auto: false, calc: true, f() {
        const Lr = R(4, 12), h = roundTo(R(3, 9) / 10 * Lr / 4, 1), v = Math.asin(h / Lr) * 180 / Math.PI;
        return { html: `Une rampe d’accès rectiligne mesure ${Lr} m de long et permet de monter de ${n(h)} m. Quel angle fait-elle avec le sol horizontal ? Arrondir au degré.`, v, round: 0, suffix: '°', ans: a(roundTo(v, 0)),
          corr: `La rampe est l’hypoténuse et la hauteur est le côté opposé à l’angle : sin(angle) = ${n(h)} ÷ ${Lr}, donc angle ≈ ${roundTo(v, 0)}°.`,
          errs: errsF(v, [{ v: roundTo(Math.atan(h / Lr) * 180 / Math.PI, 0), m: 'La longueur de la rampe est l’hypoténuse : utilise le sinus.' }]), hints: H('Dessine le triangle rectangle : sol, hauteur, rampe.', 'Côté opposé et hypoténuse : sinus.', '') };
      } }
    ]
  };

  const angles = {
    id: 'angles', name: 'Angles et triangles', dom: 'eg', cls: '5e',
    flash: `<b>Somme des angles.</b> Dans un triangle, la somme des angles vaut 180°.<br><b>Triangle isocèle.</b> Les deux angles à la base sont égaux. <b>Équilatéral.</b> Trois angles de 60°.<br><b>Inégalité triangulaire.</b> On peut construire un triangle si le plus grand côté est plus petit que la somme des deux autres.`,
    gens: [
      { id: 'an-sum', lv: [1, 2], auto: true, f(L) {
        if (L === 1) { const x = R(20, 100), y = R(15, 160 - x), v = 180 - x - y;
          return { html: `Dans un triangle, deux angles mesurent ${x}° et ${y}°. Quelle est la mesure du troisième angle ?`, v, suffix: '°', ans: String(v), corr: `180 − ${x} − ${y} = ${v}°`,
            errs: errsF(v, [{ v: 360 - x - y, m: 'La somme des angles d’un triangle vaut 180°, pas 360°.' }]), hints: H('Que vaut la somme des angles d’un triangle ?', '180° − les deux angles connus.', '') }; }
        const top = R(10, 85) * 2, v = (180 - top) / 2;
        return { html: `Un triangle est isocèle. L’angle formé par ses deux côtés égaux mesure ${top}°. Quelle est la mesure de chacun des deux autres angles ?`, v, suffix: '°', ans: a(v), corr: `Les deux angles à la base sont égaux : (180 − ${top}) ÷ 2 = ${n(v)}°.`,
          errs: errsF(v, [{ v: 180 - top, m: 'Il y a deux angles à la base, égaux : divise par 2.' }]), hints: H('Dans un triangle isocèle, les angles à la base sont égaux.', '(180 − angle principal) ÷ 2.', '') };
      } },
      { id: 'an-tri', lv: [1, 2], auto: true, f() {
        const x = R(2, 12), y = R(2, 12), ok = R(0, 1), z = ok ? R(Math.abs(x - y) + 1, x + y - 1) : x + y + R(0, 4);
        const good = Math.max(x, y, z) < x + y + z - Math.max(x, y, z);
        return { type: 'qcm', html: `Peut-on construire un triangle dont les côtés mesurent ${x} cm, ${y} cm et ${z} cm ?`, choices: YN, correct: good ? 0 : 1, ans: good ? '0' : '1',
          corr: `Le plus grand côté mesure ${Math.max(x, y, z)} cm et la somme des deux autres vaut ${x + y + z - Math.max(x, y, z)} cm. ${good ? 'Le plus grand côté est plus petit : le triangle est constructible.' : 'Le plus grand côté n’est pas plus petit : le triangle n’est pas constructible.'}`,
          hints: H('Compare le plus grand côté à la somme des deux autres.', 'Inégalité triangulaire.', '') };
      } }
    ]
  };

  /* =====================================================================
     ALGORITHMIQUE ET PROGRAMMATION
     ===================================================================== */
  const algo = {
    id: 'algo', name: 'Programmes en blocs', dom: 'ap', cls: '5e-3e',
    flash: `<b>Lire un script.</b> On exécute les blocs de haut en bas, un par un, en notant la valeur des variables.<br><b>Boucle « répéter n fois ».</b> Les blocs à l'intérieur sont exécutés n fois.<br><b>Polygone régulier à n côtés.</b> Répéter n fois : avancer, tourner de 360 ÷ n degrés.<br><b>Condition « si … alors … sinon ».</b> Un seul des deux blocs est exécuté.`,
    gens: [
      { id: 'al-calc', lv: [1, 2], auto: true, f(L) {
        const k = R(2, 9), b = nz(-9, 12), x = R(-5, 9);
        if (L === 1) { const v = k * x + b;
          return { html: `On exécute ce programme et on répond <b>${n(x)}</b> :${script(SB('ev', 'quand le drapeau est cliqué') + SB('se', 'demander « Choisis un nombre » et attendre') + SB('va', `mettre résultat à (réponse × ${k})`) + SB('va', `ajouter ${n(b)} à résultat`) + SB('lo', 'dire résultat'))}Quel nombre le programme affiche-t-il ?`, v, ans: a(v),
            corr: `résultat = ${n(x)} × ${k} = ${n(k * x)}, puis ${n(k * x)} + ${p(b)} = ${n(v)}.`, errs: errsF(v, [{ v: (x + b) * k, m: 'Respecte l’ordre des blocs : on multiplie d’abord, puis on ajoute.' }]),
            hints: H('Exécute les blocs un par un.', 'Note la valeur de « résultat » après chaque bloc.', '') }; }
        const c = R(1, 6), v = (x + c) * (x - b);
        return { html: `On exécute ce programme et on répond <b>${n(x)}</b> :${script(SB('ev', 'quand le drapeau est cliqué') + SB('se', 'demander « Choisis un nombre » et attendre') + SB('va', `mettre A à (réponse + ${c})`) + SB('va', `mettre B à (réponse − ${p(b)})`) + SB('lo', 'dire (A × B)'))}Quel nombre le programme affiche-t-il ?`, v, ans: a(v),
          corr: `A = ${n(x)} + ${c} = ${n(x + c)} ; B = ${n(x)} − ${p(b)} = ${n(x - b)} ; A × B = ${n(v)}.`, errs: errsF(v, [{ v: (x + c) + (x - b), m: 'Le dernier bloc affiche le produit A × B.' }]),
          hints: H('Calcule A, puis B.', 'Le programme affiche A × B.', '') };
      } },
      { id: 'al-loop', lv: [1, 2, 3], auto: true, f(L) {
        const k = pick([3, 4, 5, 6, 8]), d = pick([30, 40, 50, 60, 80, 100]), names = { 3: 'un triangle équilatéral', 4: 'un carré', 5: 'un pentagone régulier', 6: 'un hexagone régulier', 8: 'un octogone régulier' };
        const sc = script(SB('ev', 'quand le drapeau est cliqué') + SB('pe', 'stylo en position d’écriture') + SBloop(`répéter ${k} fois`, SB('mo', `avancer de ${d} pas`) + SB('mo', `tourner ↻ de ${L === 3 ? '?' : n(360 / k)} degrés`)));
        if (L === 1) return { html: `Voici un script :${sc}Quelle distance totale, en pas, le lutin parcourt-il ?`, v: k * d, suffix: 'pas', ans: String(k * d), corr: `La boucle est répétée ${k} fois, avec ${d} pas à chaque fois : ${k} × ${d} = ${k * d} pas.`,
          errs: errsF(k * d, [{ v: d, m: `Le bloc « avancer » est répété ${k} fois.` }]), hints: H('Combien de fois la boucle est-elle répétée ?', 'Multiplie le nombre de répétitions par la distance.', '') };
        if (L === 2) { const ks = [3, 4, 5, 6, 8], ch = shuffle(ks.filter(z => z !== k)).slice(0, 3).concat([k]).sort((x, y) => x - y);
          return { type: 'qcm', html: `Voici un script :${sc}Quelle figure le lutin trace-t-il ?`, choices: ch.map(z => names[z]), correct: ch.indexOf(k), ans: String(ch.indexOf(k)),
            corr: `Le lutin trace ${k} côtés de même longueur en tournant de 360 ÷ ${k} = ${n(360 / k)}° : c’est ${names[k]}.`, hints: H('Compte le nombre de côtés tracés.', 'Répéter n fois « avancer, tourner de 360/n » trace un polygone régulier à n côtés.', '') }; }
        return { html: `On veut que ce script trace ${names[k]} :${sc}Par quel angle, en degrés, faut-il remplacer « ? » ?`, v: 360 / k, suffix: '°', ans: a(360 / k), corr: `Le lutin fait un tour complet (360°) en ${k} virages : 360 ÷ ${k} = ${n(360 / k)}°.`,
          errs: errsF(360 / k, [{ v: 180 * (k - 2) / k, m: `C’est l’angle intérieur du polygone. Le lutin tourne de l’angle extérieur : 360 ÷ ${k}.` }]), hints: H('Le lutin revient à son point de départ après un tour complet.', `Un tour complet = 360°, réparti en ${k} virages.`, '') };
      } },
      { id: 'al-var', lv: [3, 4], auto: true, f(L) {
        const a0 = R(1, 6), c = R(1, 4), k = L === 3 ? R(3, 4) : R(4, 6); let S = 0, nn = a0; for (let i = 0; i < k; i++) { S += nn; nn += c; }
        return { html: `Voici un script :${script(SB('ev', 'quand le drapeau est cliqué') + SB('va', 'mettre S à 0') + SB('va', `mettre n à ${a0}`) + SBloop(`répéter ${k} fois`, SB('va', 'ajouter n à S') + SB('va', `ajouter ${c} à n`)) + SB('lo', 'dire S'))}Quel nombre le programme affiche-t-il ?`, v: S, ans: String(S),
          corr: `Valeurs successives de n : ${Array.from({ length: k }, (_, i) => a0 + i * c).join(', ')}. S = ${Array.from({ length: k }, (_, i) => a0 + i * c).join(' + ')} = ${S}.`,
          errs: errsF(S, [{ v: nn, m: 'Le programme affiche S, pas n.' }, { v: a0 * k, m: 'n augmente de ' + c + ' à chaque tour de boucle.' }]),
          hints: H('Fais un tableau avec les valeurs de S et de n à chaque tour.', 'À chaque tour : on ajoute n à S, puis on augmente n.', '') };
      } },
      { id: 'al-cond', lv: [4], auto: true, f() {
        const s = R(5, 15), k = R(2, 4), b = R(1, 9), x = R(0, 25), v = x > s ? k * x - b : x + b;
        return { html: `On exécute ce programme et on répond <b>${x}</b> :${script(SB('ev', 'quand le drapeau est cliqué') + SB('se', 'demander « Choisis un nombre » et attendre') + SBif(`réponse > ${s}`, SB('lo', `dire (réponse × ${k} − ${b})`), SB('lo', `dire (réponse + ${b})`)))}Quel nombre le programme affiche-t-il ?`, v, ans: a(v),
          corr: `${x} ${x > s ? '>' : '≤'} ${s}, donc on exécute le bloc ${x > s ? '« alors »' : '« sinon »'} : ${x > s ? `${x} × ${k} − ${b}` : `${x} + ${b}`} = ${n(v)}.`,
          errs: errsF(v, [{ v: x > s ? x + b : k * x - b, m: `Teste la condition : ${x} est-il strictement supérieur à ${s} ?` }]),
          hints: H('Teste d’abord la condition.', 'Si elle est vraie, on exécute le bloc « alors », sinon le bloc « sinon ».', '') };
      } }
    ]
  };

  /* ---------- Catalogue ---------- */
  const NOTIONS = [calc, frac, pui, arith, litt, eq, prop, fonc, stat, proba, aire, conv, pyth, thales, trigo, angles, algo];
  const DOMS = { nc: 'Nombres et calculs', df: 'Données et fonctions', gm: 'Grandeurs et mesures', eg: 'Espace et géométrie', ap: 'Algorithmique et programmation' };
  const byId = Object.fromEntries(NOTIONS.map(x => [x.id, x]));

  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }

  /* Fabrique une question reproductible à partir d'une référence */
  function make(ref) {
    const no = byId[ref.n], gen = no.gens.find(g => g.id === ref.g);
    G.M.setSeed(ref.s);
    const q = gen.f(ref.L);
    q.ref = ref; q.notion = no.id; q.dom = no.dom; q.lvl = ref.L; q.calc = !!(q.calc || gen.calc); q.gen = gen.id;
    q.hints = (q.hints || []).filter(Boolean);
    // Une « erreur fréquente » ne doit jamais coïncider avec la bonne réponse
    const S = [-1.7, 0.3, 2.9];
    q.errs = (q.errs || []).filter(e => !(e.f && q.f && S.every(x => Math.abs(e.f(x) - q.f(x)) < 1e-9)) && !(e.v !== undefined && !q.f && q.v !== undefined && Math.abs(e.v - q.v) < 1e-9) && !(e.v !== undefined && !Number.isFinite(e.v)));
    q.sig = gen.id + ':' + hash(q.html + (q.choices || []).join('|'));
    return q;
  }
  function gensFor(notionId, L) { return byId[notionId].gens.filter(g => g.lv.includes(L)); }
  function nearestLevelGens(notionId, L) {
    for (const d of [0, -1, 1, -2, 2, -3, 3]) { const gs = gensFor(notionId, L + d); if (gs.length) return { gs, L: L + d }; }
    return { gs: [], L };
  }
  /* Tire une question nouvelle pour une notion et un niveau, en évitant les versions déjà vues */
  function draw(notionId, L, seen, avoidGen) {
    let { gs, L: LL } = nearestLevelGens(notionId, L);
    let best = null;
    for (let tries = 0; tries < 25; tries++) {
      let pool = gs.filter(g => g.id !== avoidGen); if (!pool.length) pool = gs;
      const g = pool[Math.floor(Math.random() * pool.length)];
      const q = make({ n: notionId, g: g.id, L: g.lv.includes(LL) ? LL : g.lv[0], s: Math.floor(Math.random() * 2 ** 31) });
      if (!seen || !seen[q.sig]) return q;
      best = best || q;
    }
    return best;
  }

  G.BANK = { NOTIONS, DOMS, byId, make, draw, gensFor, n, F, FR, fa, plain, a, p, poly, lin, linA, htable, fig: { rightTri, thalesFig, graphFig }, script, SB, SBloop, TRI, TRIPLES };
})(typeof window !== 'undefined' ? window : globalThis);
