/* =====================================================================
   Cap Brevet – enrichissements hebdomadaires de la banque de questions
   Ce fichier ajoute des générateurs aux notions de notions.js, et de
   nouvelles notions. Même contrat que dans notions.js : chaque générateur
   tire ses valeurs au hasard et renvoie énoncé, réponse attendue,
   correction, indices et erreurs fréquentes. Les tests automatiques
   (tests/test-banque.js) vérifient chaque générateur sur 400 tirages.
   ===================================================================== */
(function (G) {
  'use strict';
  const { R, pick, nz, sgn, shuffle, gcd, roundTo } = G.M;
  const B = G.BANK, { n, F, FR, fa, a, p, poly, lin, linA, htable, script, SB, SBloop, TRIPLES } = B;
  const { rightTri, thalesFig, graphFig } = B.fig;
  const M_ = s => `<span class="math">${s}</span>`;
  const H = (...h) => h;
  const errsF = (v, list) => list.filter(e => e.v === undefined || Math.abs(e.v - v) > 1e-9);
  const YN = ['Oui', 'Non'];
  const UL = ['cm', 'cm²', 'cm³'];
  const pt = (x, y) => `(${n(x)} ; ${n(y)})`;
  const sup = e => `<sup>${e < 0 ? '−' + -e : e}</sup>`;
  /* QCM : la bonne réponse et jusqu'à trois distracteurs distincts, mélangés */
  function qcm(html, good, wrong, corr, hints, keep) {
    const w = [...new Set(wrong.map(String))].filter(x => x !== String(good)).slice(0, 3);
    const choices = keep ? keep : shuffle([String(good), ...w]);
    const correct = choices.indexOf(String(good));
    return { type: 'qcm', html, choices, correct, ans: String(correct), corr, hints };
  }
  function add(id, gens) { B.byId[id].gens.push(...gens); }

  /* =====================================================================
     Semaine du 22 novembre 2026
     ===================================================================== */

  /* ---------- Nouvelle notion : transformations et repérage ---------- */
  const transfo = {
    id: 'transfo', name: 'Transformations et repérage', dom: 'eg', cls: '5e-3e',
    flash: `<b>Symétrie centrale</b> de centre O : O est le milieu de [AA′]. Le symétrique de A(x ; y) par rapport à l’origine est A′(−x ; −y).<br><b>Translation</b> : un glissement, sans tourner. Elle conserve les longueurs, les angles et les aires, comme les symétries et les rotations.<br><b>Homothétie de rapport k</b> : longueurs × |k|, aires × k². Si k est négatif, l’image est de l’autre côté du centre.<br><b>Milieu</b> de [AB] : on fait la moyenne des abscisses et la moyenne des ordonnées.`,
    gens: [
      { id: 'tf-sym', lv: [1, 2], auto: true, f(L) {
        const x = nz(-9, 9), y = nz(-9, 9);
        if (L === 1) {
          const t = pick(['O', 'abs', 'ord']);
          const good = t === 'O' ? pt(-x, -y) : t === 'abs' ? pt(x, -y) : pt(-x, y);
          const txt = t === 'O' ? 'par la symétrie centrale de centre O, l’origine du repère' : t === 'abs' ? 'par la symétrie axiale d’axe l’axe des abscisses' : 'par la symétrie axiale d’axe l’axe des ordonnées';
          const corr = t === 'O' ? `O est le milieu de [AA′] : les deux coordonnées changent de signe. A′${good}.` : t === 'abs' ? `L’abscisse ne change pas, l’ordonnée change de signe : A′${good}.` : `L’ordonnée ne change pas, l’abscisse change de signe : A′${good}.`;
          return qcm(`Dans un repère, on considère le point A${pt(x, y)}. Quelles sont les coordonnées de son image A′ ${txt} ?`, good, [pt(-x, -y), pt(x, -y), pt(-x, y), pt(y, x), pt(-y, -x)], corr,
            H('Fais un petit schéma dans le repère.', 'Symétrie par rapport à O : deux signes changent. Par rapport à un axe : seule l’autre coordonnée change de signe.', 'Exemple : A(2 ; −3) a pour symétrique (−2 ; 3) par rapport à O.'));
        }
        const cx = nz(-4, 4), cy = nz(-4, 4), good = pt(2 * cx - x, 2 * cy - y);
        return qcm(`Dans un repère, on considère les points A${pt(x, y)} et I${pt(cx, cy)}. Quelles sont les coordonnées de l’image A′ de A par la symétrie centrale de centre I ?`, good,
          [pt(cx - x, cy - y), pt(x - 2 * cx, y - 2 * cy), pt(-x, -y), pt(2 * cx + x, 2 * cy + y), pt(x + cx, y + cy)],
          `I est le milieu de [AA′]. Donc x′ = 2 × ${p(cx)} − ${p(x)} = ${n(2 * cx - x)} et y′ = 2 × ${p(cy)} − ${p(y)} = ${n(2 * cy - y)}.`,
          H('I est le milieu du segment [AA′].', 'Pour aller de A à I, on ajoute un certain déplacement ; pour aller de I à A′, on ajoute le même.', 'Exemple : A(1 ; 0), I(2 ; 1) : A′(3 ; 2).'));
      } },
      { id: 'tf-trans', lv: [2, 3], auto: true, f(L) {
        const xa = R(-5, 5), ya = R(-5, 5), dx = nz(-6, 6), dy = nz(-6, 6), xb = xa + dx, yb = ya + dy, xc = R(-6, 6), yc = R(-6, 6);
        const img = L === 2, good = img ? pt(xc + dx, yc + dy) : pt(xc - dx, yc - dy);
        return qcm(`Dans un repère, la translation qui transforme A${pt(xa, ya)} en B${pt(xb, yb)} transforme ${img ? `le point C${pt(xc, yc)} en D. Quelles sont les coordonnées de D` : `un point E en C${pt(xc, yc)}. Quelles sont les coordonnées de E`} ?`, good,
          [pt(xc + dx, yc + dy), pt(xc - dx, yc - dy), pt(xc + dy, yc + dx), pt(dx, dy), pt(xc + xb, yc + yb), pt(xc + dx, yc - dy)],
          `Pour aller de A à B, on ajoute ${n(dx)} à l’abscisse et ${n(dy)} à l’ordonnée. ${img ? `D${good}` : `On fait le déplacement inverse à partir de C : E${good}`}.`,
          H('Calcule le déplacement de A vers B.', 'Déplacement : xB − xA et yB − yA. On applique le même déplacement au point.', 'Exemple : A(0 ; 0) → B(2 ; 1), alors C(3 ; 3) → (5 ; 4).'));
      } },
      { id: 'tf-homo', lv: [2, 3, 4], auto: true, f(L) {
        if (L === 3) {
          const k = pick([2, 3, 0.5, 1.5]), A = 4 * R(1, 15), v = A * k * k;
          return { html: `Le triangle A′B′C′ est l’image du triangle ABC par une homothétie de rapport ${n(k)}. L’aire du triangle ABC est ${A} cm². Quelle est l’aire du triangle A′B′C′ ?`, v, suffix: 'cm²', ans: a(v),
            corr: `Les aires sont multipliées par k² = ${n(k)}² = ${n(k * k)}. ${A} × ${n(k * k)} = ${n(v)} cm².`,
            errs: errsF(v, [{ v: A * k, m: 'Les longueurs sont multipliées par k, mais les aires par k².' }]),
            hints: H('Que deviennent les aires dans une homothétie ?', 'Aires × k².', 'Exemple : rapport 3, aire 5 cm² → 45 cm².') };
        }
        const k = L === 2 ? pick([2, 3, 4, 0.5, 1.5]) : pick([-2, -3, -0.5, -1.5]), l = 2 * R(1, 10), v = l * Math.abs(k);
        return { html: `Le triangle A′B′C′ est l’image du triangle ABC par une homothétie de rapport ${n(k)}. On sait que AB = ${l} cm. Calculer A′B′.`, v, suffix: 'cm', ans: a(v),
          corr: `Les longueurs sont multipliées par ${k < 0 ? `|k| = ${n(-k)} (une longueur est toujours positive)` : n(k)} : ${l} × ${n(Math.abs(k))} = ${n(v)} cm.`,
          errs: errsF(v, [{ v: l * k, m: 'Une longueur est toujours positive : on multiplie par la distance à zéro du rapport.' }, { v: l + Math.abs(k), m: 'On multiplie par le rapport, on n’ajoute pas.' }, { v: l / Math.abs(k), m: 'L’image s’obtient en multipliant par le rapport, pas en divisant.' }, { v: l * k * k, m: 'k² concerne les aires ; pour une longueur, on multiplie par |k|.' }]),
          hints: H('Que deviennent les longueurs dans une homothétie ?', 'Longueurs × |k|.', 'Exemple : rapport −2, AB = 3 cm → A′B′ = 6 cm.') };
      } },
      { id: 'tf-homo-k', lv: [3, 4], auto: true, f(L) {
        if (L === 3) {
          const k = pick([2, 3, 4, 0.5, 0.25, 1.5, 2.5, 0.75]), AB = 4 * R(1, 6), A2 = AB * k;
          return { html: `Le triangle A′B′C′ est l’image du triangle ABC par une homothétie de rapport positif. On sait que AB = ${AB} cm et A′B′ = ${n(A2)} cm. Quel est le rapport de l’homothétie ?`, v: k, ans: a(k),
            corr: `k = A′B′ ÷ AB = ${n(A2)} ÷ ${AB} = ${n(k)}. ${k < 1 ? 'Le rapport est plus petit que 1 : c’est une réduction.' : 'Le rapport est plus grand que 1 : c’est un agrandissement.'}`,
            errs: errsF(k, [{ v: 1 / k, m: 'Tu as fait le quotient à l’envers : longueur de l’image ÷ longueur de départ.' }, { v: A2 - AB, m: 'Le rapport est un quotient, pas une différence.' }]),
            hints: H('Le rapport compare l’image à la figure de départ.', 'k = A′B′ ÷ AB.', 'Exemple : AB = 4 cm, A′B′ = 6 cm → k = 1,5.') };
        }
        const k = pick([2, 3, 0.5]), S = 4 * R(2, 12), S2 = S * k * k;
        return { html: `Une figure a une aire de ${S} cm². Son image par une homothétie de rapport positif a une aire de ${n(S2)} cm². Quel est le rapport de l’homothétie ?`, v: k, ans: a(k),
          corr: `Les aires sont multipliées par k² = ${n(S2)} ÷ ${S} = ${n(k * k)}. Donc k = √${n(k * k)} = ${n(k)}.`,
          errs: errsF(k, [{ v: k * k, m: 'Le quotient des aires donne k², pas k : prends la racine carrée.' }, { v: 1 / k, m: 'Fais le quotient image ÷ départ.' }]),
          hints: H('Les aires sont multipliées par k².', 'Calcule le quotient des aires, puis sa racine carrée.', '') };
      } },
      { id: 'tf-mil', lv: [1, 2], auto: true, f(L) {
        const xa = R(-8, 8), ya = R(-8, 8);
        const xb = L === 1 ? xa + 2 * nz(-6, 6) : xa + nz(-9, 9), yb = L === 1 ? ya + 2 * nz(-6, 6) : ya + nz(-9, 9);
        const abs = R(0, 1) === 1, v = abs ? (xa + xb) / 2 : (ya + yb) / 2, u = abs ? [xa, xb] : [ya, yb];
        return { html: `Dans un repère, on considère les points A${pt(xa, ya)} et B${pt(xb, yb)}. Quelle est l’${abs ? 'abscisse' : 'ordonnée'} du milieu M du segment [AB] ?`, v, ans: a(v),
          corr: `${abs ? 'x' : 'y'}M = (${n(u[0])} + ${p(u[1])}) ÷ 2 = ${n(u[0] + u[1])} ÷ 2 = ${n(v)}.`,
          errs: errsF(v, [{ v: u[0] + u[1], m: 'N’oublie pas de diviser la somme par 2.' }, { v: (u[1] - u[0]) / 2, m: 'Pour le milieu, on additionne les coordonnées, on ne les soustrait pas.' }]),
          hints: H('Le milieu est « au centre » : on fait une moyenne.', `${abs ? 'xM = (xA + xB) ÷ 2' : 'yM = (yA + yB) ÷ 2'}.`, 'Exemple : A(1 ; 4) et B(5 ; −2) : M(3 ; 1).') };
      } },
      { id: 'tf-dist', lv: [3, 4], auto: true, f(L) {
        const xa = R(-5, 5), ya = R(-5, 5);
        let dx, dy, v, q = {};
        if (L === 3) { const t = pick(TRIPLES.slice(0, 6)), sw = R(0, 1); dx = sgn() * t[sw]; dy = sgn() * t[1 - sw]; v = t[2]; }
        else { do { dx = nz(-7, 7); dy = nz(-7, 7); } while (Number.isInteger(Math.sqrt(dx * dx + dy * dy))); v = Math.sqrt(dx * dx + dy * dy); q = { round: 1, calc: true }; }
        const xb = xa + dx, yb = ya + dy, s2 = dx * dx + dy * dy;
        return { ...q, html: `Dans un repère orthonormé, on considère les points A${pt(xa, ya)} et B${pt(xb, yb)}. Calculer la longueur AB${L === 4 ? ', arrondie au dixième' : ''}.`, v, ans: a(L === 4 ? roundTo(v, 1) : v),
          corr: `On utilise le théorème de Pythagore dans le triangle rectangle formé avec les déplacements horizontal (${n(dx)}) et vertical (${n(dy)}) : AB² = ${p(dx)}² + ${p(dy)}² = ${s2}, donc AB = √${s2} ${L === 4 ? '≈ ' + n(roundTo(v, 1)) : '= ' + n(v)}.`,
          errs: errsF(v, [{ v: Math.abs(dx) + Math.abs(dy), m: 'AB est la diagonale, pas la somme des déplacements : utilise le théorème de Pythagore.' }, { v: s2, m: 'Tu as trouvé AB². Il reste à prendre la racine carrée.' }]),
          hints: H('Trace le triangle rectangle qui a [AB] pour hypoténuse.', 'AB² = (xB − xA)² + (yB − yA)².', '') };
      } },
      { id: 'tf-prop', lv: [1, 2], auto: true, f(L) {
        const T = ['Une symétrie axiale', 'Une symétrie centrale', 'Une translation', 'Une rotation', 'Une homothétie'];
        const I1 = [
          ['Quelle transformation fait glisser une figure, sans la tourner ni la retourner ?', 'Une translation', T, 'Une translation est un glissement : tous les points se déplacent de la même façon.'],
          ['Quelle transformation peut agrandir ou réduire une figure ?', 'Une homothétie', T, 'Seule l’homothétie (de rapport différent de 1 et de −1) change les longueurs.'],
          ['Quelle transformation « retourne » une figure comme un pliage ?', 'Une symétrie axiale', T, 'La symétrie axiale correspond au pliage le long de l’axe.'],
          ['Une rotation de 180° autour d’un point O est la même transformation que :', 'la symétrie centrale de centre O', ['la symétrie centrale de centre O', 'une symétrie axiale', 'une translation', 'une homothétie de rapport 2'], 'Faire un demi-tour autour de O, c’est la symétrie centrale de centre O.'],
          ['Une rotation conserve :', 'les longueurs et les angles', ['les longueurs et les angles', 'seulement les angles', 'seulement les longueurs', 'ni les longueurs, ni les angles'], 'Symétries, translations et rotations conservent les longueurs, les angles et les aires.']
        ];
        const I2 = [
          ['Par une homothétie de rapport 3, les aires sont multipliées par :', '9', ['3', '6', '9', '27'], 'Les aires sont multipliées par k² = 3² = 9.'],
          ['Par une homothétie de rapport 0,5, les longueurs sont :', 'divisées par 2', ['divisées par 2', 'multipliées par 5', 'divisées par 4', 'inchangées'], 'Multiplier par 0,5, c’est diviser par 2.'],
          ['Une homothétie de rapport −1 est la même transformation que :', 'une symétrie centrale', ['une symétrie centrale', 'une symétrie axiale', 'une translation', 'une homothétie de rapport 1'], 'Rapport −1 : chaque point va de l’autre côté du centre, à la même distance. C’est la symétrie centrale.'],
          ['Par une homothétie de rapport 2, les volumes sont multipliés par :', '8', ['2', '4', '6', '8'], 'Les volumes sont multipliés par k³ = 2³ = 8.'],
          ['Par une homothétie de rapport −2, la longueur d’un segment de 3 cm devient :', '6 cm', ['6 cm', '−6 cm', '1,5 cm', '12 cm'], 'Les longueurs sont multipliées par |k| = 2 : 3 × 2 = 6 cm.'],
          ['Par une translation, l’image d’un triangle d’aire 12 cm² a une aire de :', '12 cm²', ['12 cm²', '24 cm²', '6 cm²', '144 cm²'], 'Une translation conserve les aires.']
        ];
        const [q, good, ch, corr] = pick(L === 1 ? I1 : I2);
        return qcm(q, good, ch, corr, H('Pense à l’effet de la transformation sur une figure simple.', 'Symétries, translation, rotation : rien ne change de taille. Homothétie de rapport k : longueurs × |k|, aires × k².', ''));
      } }
    ]
  };
  B.NOTIONS.push(transfo); B.byId.transfo = transfo;

  /* ---------- Angles ---------- */
  add('angles', [
    { id: 'an-par', lv: [2, 3], auto: true, f(L) {
      if (L === 2) {
        let x; do { x = R(25, 155); } while (x === 90);
        const rel = pick(['alt', 'corr', 'opp', 'supp']), v = rel === 'supp' ? 180 - x : x;
        const lab = { alt: 'qui lui est alterne-interne', corr: 'qui lui est correspondant', opp: 'qui lui est opposé par le sommet', supp: 'adjacent qui lui est supplémentaire' }[rel];
        return { html: `Les droites (d) et (d′) sont parallèles et coupées par une sécante (s). Un des angles formés mesure ${x}°. Quelle est la mesure de l’angle ${lab} ?`, v, suffix: '°', ans: String(v),
          corr: rel === 'supp' ? `Deux angles adjacents supplémentaires forment un angle plat : 180 − ${x} = ${v}°.` : rel === 'opp' ? `Deux angles opposés par le sommet ont la même mesure : ${v}°.` : `Les droites sont parallèles, donc deux angles ${rel === 'alt' ? 'alternes-internes' : 'correspondants'} ont la même mesure : ${v}°.`,
          errs: errsF(v, [{ v: 180 - v, m: rel === 'supp' ? 'Des angles supplémentaires ont une somme de 180°.' : 'Ces deux angles ont la même mesure : ils ne sont pas supplémentaires.' }, { v: Math.abs(90 - x), m: 'On ne cherche pas l’angle complémentaire.' }]),
          hints: H('Repère la position des deux angles sur une figure.', 'Avec des parallèles : alternes-internes et correspondants sont égaux. Opposés par le sommet : toujours égaux. Adjacents supplémentaires : somme 180°.', '') };
      }
      const x = R(30, 150), good = R(0, 1) === 1, y = good ? x : x + pick([-3, -2, -1, 1, 2, 3]);
      return qcm(`Deux droites (d) et (d′) sont coupées par une sécante. Deux angles alternes-internes mesurent ${x}° et ${y}°.<br>Les droites (d) et (d′) sont-elles parallèles ?`, good ? 'Oui' : 'Non', ['Oui', 'Non'],
        good ? 'Les angles alternes-internes ont la même mesure, donc les droites sont parallèles.' : `Les angles alternes-internes n’ont pas la même mesure (${x}° ≠ ${y}°), donc les droites ne sont pas parallèles.`,
        H('Compare les deux mesures.', 'Si deux angles alternes-internes sont égaux, les droites sont parallèles. S’ils sont différents, elles ne le sont pas.', ''), YN);
    } },
    { id: 'an-comp', lv: [1], auto: true, f() {
      const su = R(0, 1) === 1, x = su ? R(15, 165) : R(5, 85), v = (su ? 180 : 90) - x;
      return { html: `Un angle mesure ${x}°. Quelle est la mesure de son angle ${su ? 'supplémentaire' : 'complémentaire'} ?`, v, suffix: '°', ans: String(v),
        corr: `Deux angles ${su ? 'supplémentaires ont une somme de 180°' : 'complémentaires ont une somme de 90°'} : ${su ? 180 : 90} − ${x} = ${v}°.`,
        errs: errsF(v, [{ v: (su ? 90 : 180) - x, m: su ? 'Supplémentaires : somme 180° (et non 90°).' : 'Complémentaires : somme 90° (et non 180°).' }]),
        hints: H('Complémentaires ou supplémentaires ?', 'Complémentaires : somme 90°. Supplémentaires : somme 180°.', 'Exemple : le complémentaire de 30° mesure 60°.') };
    } },
    { id: 'an-rect', lv: [1, 2], auto: true, f(L) {
      if (L === 1) { const x = R(12, 78), v = 90 - x;
        return { html: `Le triangle ABC est rectangle en A, et l’angle ABĈ mesure ${x}°. Quelle est la mesure de l’angle ACB̂ ?`, v, suffix: '°', ans: String(v),
          corr: `La somme des angles vaut 180° et l’angle droit mesure 90° : 180 − 90 − ${x} = ${v}°.`,
          errs: errsF(v, [{ v: 180 - x, m: 'N’oublie pas l’angle droit : il mesure 90°.' }]),
          hints: H('La somme des angles d’un triangle vaut 180°.', 'Dans un triangle rectangle, les deux angles aigus ont une somme de 90°.', '') }; }
      const C = R(15, 50), Bv = 2 * C, A = 180 - 3 * C;
      return { html: `Dans un triangle ABC, l’angle Â mesure ${A}° et l’angle B̂ est le double de l’angle Ĉ. Quelle est la mesure de l’angle Ĉ ?`, v: C, suffix: '°', ans: String(C),
        corr: `B̂ + Ĉ = 180 − ${A} = ${180 - A}°. Comme B̂ = 2Ĉ, on a 3Ĉ = ${180 - A}, donc Ĉ = ${C}° (et B̂ = ${Bv}°).`,
        errs: errsF(C, [{ v: (180 - A) / 2, m: 'B̂ et Ĉ ne sont pas égaux : B̂ vaut deux fois Ĉ, donc B̂ + Ĉ = 3 fois Ĉ.' }, { v: Bv, m: 'Tu as trouvé B̂. On demande Ĉ.' }]),
        hints: H('Calcule d’abord B̂ + Ĉ.', 'B̂ + Ĉ = Ĉ + 2Ĉ = 3Ĉ.', '') };
    } },
    { id: 'an-poly', lv: [3, 4], auto: true, f(L) {
      const k = pick([3, 4, 5, 6, 8, 9, 10, 12]), nm = { 3: 'un triangle équilatéral', 4: 'un carré', 5: 'un pentagone régulier', 6: 'un hexagone régulier', 8: 'un octogone régulier', 9: 'un ennéagone régulier (9 côtés)', 10: 'un décagone régulier (10 côtés)', 12: 'un dodécagone régulier (12 côtés)' }[k];
      const c = 360 / k, i = 180 * (k - 2) / k;
      if (L === 3) return { html: `On veut construire ${nm} inscrit dans un cercle de centre O. Quelle est la mesure de l’angle au centre entre deux sommets consécutifs ?`, v: c, suffix: '°', ans: String(c),
        corr: `Les ${k} angles au centre sont égaux et font un tour complet : 360 ÷ ${k} = ${c}°.`,
        errs: errsF(c, [{ v: i, m: 'C’est l’angle intérieur du polygone. L’angle au centre vaut 360 ÷ nombre de côtés.' }, { v: 180 / k, m: 'Un tour complet mesure 360°, pas 180°.' }]),
        hints: H('Un tour complet autour de O mesure 360°.', `Partage 360° en ${k} angles égaux.`, '') };
      return { html: `Quelle est la mesure de chaque angle intérieur d’${nm} ?`, v: i, suffix: '°', ans: String(i),
        corr: `Angle au centre : 360 ÷ ${k} = ${c}°. Chaque triangle formé avec O est isocèle, ses angles à la base mesurent (180 − ${c}) ÷ 2 = ${n(i / 2)}°. L’angle intérieur vaut 2 × ${n(i / 2)} = ${i}°.`,
        errs: errsF(i, [{ v: c, m: 'C’est l’angle au centre. L’angle intérieur vaut 180° − angle au centre.' }]), hints: [] };
    } },
    { id: 'an-para', lv: [2, 3], auto: true, f(L) {
      let x; do { x = R(35, 145); } while (x === 90);
      if (L === 2) { const opp = R(0, 1) === 1, v = opp ? x : 180 - x;
        return { html: `ABCD est un parallélogramme et l’angle Â mesure ${x}°. Quelle est la mesure de l’angle ${opp ? 'Ĉ' : 'B̂'} ?`, v, suffix: '°', ans: String(v),
          corr: opp ? `Dans un parallélogramme, les angles opposés ont la même mesure : Ĉ = Â = ${x}°.` : `Dans un parallélogramme, deux angles consécutifs sont supplémentaires : B̂ = 180 − ${x} = ${v}°.`,
          errs: errsF(v, [{ v: 180 - v, m: opp ? 'Â et Ĉ sont opposés : ils sont égaux.' : 'Â et B̂ sont consécutifs : leur somme vaut 180°.' }]),
          hints: H('Fais un schéma du parallélogramme ABCD.', 'Angles opposés : égaux. Angles consécutifs : somme 180°.', '') }; }
      const v = 360 - x;
      return { html: `ABCD est un parallélogramme et l’angle Â mesure ${x}°. Calculer la somme B̂ + Ĉ + D̂.`, v, suffix: '°', ans: String(v),
        corr: `La somme des angles d’un quadrilatère vaut 360° : 360 − ${x} = ${v}°. (Vérification : B̂ = D̂ = ${180 - x}° et Ĉ = ${x}°.)`,
        errs: errsF(v, [{ v: 180 - x, m: 'La somme des angles d’un quadrilatère vaut 360°, pas 180°.' }]),
        hints: H('Un quadrilatère se découpe en deux triangles.', 'Somme des angles d’un quadrilatère : 360°.', '') };
    } }
  ]);

  /* ---------- Conversions et grandeurs ---------- */
  const hm = t => `${Math.floor(t / 60)} h ${String(t % 60).padStart(2, '0')}`;
  add('conv', [
    { id: 'cv-hor', lv: [1, 2], auto: true, f(L) {
      const t1 = R(7, 17) * 60 + 5 * R(0, 11), dur = L === 1 ? 5 * R(5, 30) : 6 * R(12, 50), t2 = t1 + dur;
      const naive = (Math.floor(t2 / 60) * 100 + t2 % 60) - (Math.floor(t1 / 60) * 100 + t1 % 60);
      if (L === 1) return { html: `Un film commence à ${hm(t1)} et se termine à ${hm(t2)}. Combien de minutes dure-t-il ?`, v: dur, suffix: 'min', ans: String(dur),
        corr: `De ${hm(t1)} à ${hm(t2)}, il s’écoule ${dur >= 60 ? `${Math.floor(dur / 60)} h ${dur % 60} min, soit ${dur} min` : `${dur} min`}.`,
        errs: errsF(dur, [{ v: naive, m: 'Une heure compte 60 minutes : on ne soustrait pas les horaires comme des nombres décimaux. Compte jusqu’à l’heure pile, puis ajoute.' }]),
        hints: H('Compte d’abord jusqu’à l’heure pile suivante.', '1 h = 60 min.', 'Exemple : de 9 h 50 à 10 h 15, il y a 10 + 15 = 25 min.') };
      const v = dur / 60, bad = Math.floor(dur / 60) + (dur % 60) / 100;
      return { html: `Un trajet commence à ${hm(t1)} et se termine à ${hm(t2)}. Quelle est sa durée en heures, sous forme d’un nombre décimal ?`, v, suffix: 'h', ans: a(v),
        corr: `La durée est ${Math.floor(dur / 60)} h ${dur % 60} min = ${dur} min. ${dur} ÷ 60 = ${n(v)} h.`,
        errs: errsF(v, [{ v: bad, m: `${Math.floor(dur / 60)} h ${dur % 60} min ne s’écrit pas ${n(bad)} h : divise les minutes par 60.` }]),
        hints: H('Calcule d’abord la durée en minutes.', 'Puis divise par 60.', 'Exemple : 1 h 30 min = 90 min = 1,5 h.') };
    } },
    { id: 'cv-ech', lv: [2, 3], auto: true, f(L) {
      const k = pick([10000, 20000, 25000, 50000, 100000, 200000]), d = pick([R(2, 15), R(3, 29) / 2]), D = roundTo(d * k / 100000, 8);
      if (L === 2) return { html: `Sur une carte à l’échelle 1/${n(k)}, deux villages sont distants de ${n(d)} cm. Quelle est la distance réelle, en km ?`, v: D, suffix: 'km', ans: a(D),
        corr: `1 cm sur la carte représente ${n(k)} cm en réalité. ${n(d)} × ${n(k)} = ${n(d * k)} cm = ${n(D)} km (1 km = 100 000 cm).`,
        errs: errsF(D, [{ v: d * k / 1000, m: '1 km = 100 000 cm (et non 1 000 cm).' }, { v: d * k / 100, m: 'Tu as obtenu des mètres. Convertis en km.' }, { v: d * k, m: 'Ce résultat est en cm : convertis-le en km.' }]),
        hints: H('Que représente 1 cm sur la carte ?', 'Multiplie par le dénominateur de l’échelle, puis convertis les cm en km.', 'Exemple : 1/50 000, 3 cm → 150 000 cm = 1,5 km.') };
      return { html: `Sur une carte à l’échelle 1/${n(k)}, quelle longueur, en cm, représente une distance réelle de ${n(D)} km ?`, v: d, suffix: 'cm', ans: a(d),
        corr: `${n(D)} km = ${n(d * k)} cm. ${n(d * k)} ÷ ${n(k)} = ${n(d)} cm sur la carte.`,
        errs: errsF(d, [{ v: D * 1000 / k, m: '1 km = 100 000 cm.' }, { v: D * k, m: 'Sur la carte, la longueur est plus petite : on divise.' }]),
        hints: H('Convertis d’abord la distance réelle en cm.', 'Puis divise par le dénominateur de l’échelle.', '') };
    } },
    { id: 'cv-cont', lv: [2, 3], auto: true, f(L) {
      if (L === 2) { const x = 10 * R(3, 10), y = 10 * R(2, 5), z = 10 * R(2, 6), V = x * y * z, v = V / 1000;
        return { html: `Un aquarium a la forme d’un pavé droit de ${x} cm de long, ${y} cm de large et ${z} cm de haut. Quelle est sa contenance, en litres ?`, v, suffix: 'L', ans: a(v),
          corr: `V = ${x} × ${y} × ${z} = ${n(V)} cm³. Or 1 L = 1 dm³ = 1 000 cm³, donc ${n(V)} cm³ = ${n(v)} L.`,
          errs: errsF(v, [{ v: V, m: 'Ce résultat est en cm³. 1 L = 1 000 cm³.' }, { v: V / 100, m: '1 L = 1 000 cm³ (et non 100).' }]),
          hints: H('Calcule le volume en cm³.', '1 L = 1 dm³ = 1 000 cm³.', '') }; }
      const x = R(10, 40) / 10, y = R(5, 20) / 10, z = R(5, 15) / 10, V = roundTo(x * y * z, 6), v = roundTo(V * 1000, 6);
      return { html: `Un bac à eau a la forme d’un pavé droit de ${n(x)} m de long, ${n(y)} m de large et ${n(z)} m de profondeur. Combien de litres d’eau contient-il quand il est plein ?`, v, suffix: 'L', ans: a(v),
        corr: `V = ${n(x)} × ${n(y)} × ${n(z)} = ${n(V)} m³. 1 m³ = 1 000 L, donc ${n(v)} L.`,
        errs: errsF(v, [{ v: V, m: 'Ce résultat est en m³. 1 m³ = 1 000 L.' }, { v: V * 100, m: '1 m³ = 1 000 L (et non 100).' }]),
        hints: H('Calcule le volume en m³.', '1 m³ = 1 000 dm³ = 1 000 L.', '') };
    } },
    { id: 'cv-debit', lv: [3, 4], auto: true, f(L) {
      if (L === 3) { const q = pick([5, 6, 8, 10, 12, 15, 20, 25]), t = R(4, 30), V = q * t;
        return { html: `Un robinet a un débit de ${q} L par minute. Combien de minutes faut-il pour remplir une cuve de ${V} L ?`, v: t, suffix: 'min', ans: String(t),
          corr: `t = volume ÷ débit = ${V} ÷ ${q} = ${t} min.`,
          errs: errsF(t, [{ v: V * q, m: 'Le temps s’obtient par une division : volume ÷ débit.' }]),
          hints: H('Chaque minute, ' + q + ' L coulent.', 'Durée = volume ÷ débit.', '') }; }
      const q = pick([0.5, 2, 2.5, 4, 5]), t = R(2, 20), V = q * 60 * t;
      return { html: `Une pompe a un débit de ${n(q)} L par seconde. Combien de minutes faut-il pour vider une citerne de ${n(V)} L ?`, v: t, suffix: 'min', ans: String(t),
        corr: `Durée = ${n(V)} ÷ ${n(q)} = ${n(V / q)} s. ${n(V / q)} ÷ 60 = ${t} min.`,
        errs: errsF(t, [{ v: V / q, m: 'Ce résultat est en secondes : convertis-le en minutes.' }, { v: V / q / 100, m: '1 min = 60 s.' }]), hints: [] };
    } },
    { id: 'cv-mv', lv: [3, 4], auto: true, f(L) {
      const [mat, nom, rho] = pick([['de l’aluminium', 'aluminium', 2.7], ['du fer', 'fer', 7.8], ['du cuivre', 'cuivre', 8.9], ['de l’or', 'or', 19.3], ['du verre', 'verre', 2.5], ['du chêne', 'chêne', 0.7]]);
      const V = R(5, 40), m = roundTo(rho * V, 6);
      if (L === 3) return { html: `La masse volumique ${mat} est ${n(rho)} g/cm³. Quelle est la masse d’un objet plein en ${nom} de ${V} cm³ ?`, v: m, suffix: 'g', ans: a(m),
        corr: `1 cm³ pèse ${n(rho)} g. m = ${n(rho)} × ${V} = ${n(m)} g.`,
        errs: errsF(m, [{ v: roundTo(V / rho, 6), m: 'La masse s’obtient par une multiplication : masse volumique × volume.' }]),
        hints: H('Que signifie « ' + n(rho) + ' g/cm³ » ?', 'Masse = masse volumique × volume.', '') };
      return { html: `La masse volumique ${mat} est ${n(rho)} g/cm³. Un objet plein en ${nom} a une masse de ${n(m)} g. Quel est son volume, en cm³ ?`, v: V, suffix: 'cm³', ans: String(V),
        corr: `V = masse ÷ masse volumique = ${n(m)} ÷ ${n(rho)} = ${V} cm³.`,
        errs: errsF(V, [{ v: roundTo(m * rho, 6), m: 'Le volume s’obtient en divisant la masse par la masse volumique.' }]), hints: [] };
    } }
  ]);

  /* ---------- Pythagore ---------- */
  add('pyth', [
    { id: 'py-diag', lv: [2, 3], auto: true, f(L) {
      if (L === 2) { const c = R(2, 12), v = c * Math.SQRT2;
        return { html: `Un carré a des côtés de ${c} cm. Donner la valeur exacte de la longueur de sa diagonale.`, v, suffix: 'cm', ans: `${c}√2`,
          approx: 'La consigne demande la valeur exacte : écris-la avec le symbole √.',
          corr: `La diagonale est l’hypoténuse d’un triangle rectangle isocèle : d² = ${c}² + ${c}² = ${2 * c * c}, donc d = √${2 * c * c} = ${c}√2 cm (environ ${n(roundTo(v, 2))} cm).`,
          errs: errsF(v, [{ v: 2 * c, m: 'La diagonale n’est pas le double du côté : utilise le théorème de Pythagore.' }, { v: 2 * c * c, m: 'Tu as trouvé d². Il reste à prendre la racine carrée.' }]),
          hints: H('La diagonale coupe le carré en deux triangles rectangles.', 'd² = côté² + côté², puis d = √(…).', 'Exemple : côté 3 cm → d = √18 = 3√2 cm.') }; }
      const t = pick(TRIPLES.slice(0, 7)), k = pick([1, 1, 2, 3]), x = t[0] * k, y = t[1] * k, v = t[2] * k;
      return { html: `Un rectangle mesure ${x} cm sur ${y} cm. Calculer la longueur de sa diagonale.`, v, suffix: 'cm', ans: String(v),
        corr: `d² = ${x}² + ${y}² = ${x * x + y * y}, donc d = √${x * x + y * y} = ${v} cm.`,
        errs: errsF(v, [{ v: x + y, m: 'La diagonale est plus courte que le chemin par les côtés : utilise le théorème de Pythagore.' }, { v: x * x + y * y, m: 'Tu as trouvé d². Prends la racine carrée.' }]),
        hints: H('La diagonale est l’hypoténuse d’un triangle rectangle.', 'd² = longueur² + largeur².', '') };
    } },
    { id: 'py-terr', lv: [3, 4], auto: false, f(L) {
      let x, y, z, q = {};
      if (L === 3) { const t = pick(TRIPLES.slice(0, 7)), k = pick([2, 3, 4, 5, 10]); [x, y, z] = [t[0] * k, t[1] * k, t[2] * k]; }
      else { do { x = R(15, 80); y = R(15, 80); } while (Number.isInteger(Math.sqrt(x * x + y * y))); z = Math.sqrt(x * x + y * y); q = { round: 0, calc: true }; }
      const v = x + y - z;
      return { ...q, html: `Un terrain a la forme d’un rectangle ABCD avec AB = ${x} m et BC = ${y} m. Pour aller de A à C, Noa longe les côtés [AB] puis [BC]. Combien de mètres économiserait-il en traversant tout droit de A à C ?${L === 4 ? ' Arrondir au mètre.' : ''}`, v, suffix: 'm', ans: a(L === 4 ? roundTo(v, 0) : v),
        corr: `AC² = ${x}² + ${y}² = ${x * x + y * y}, donc AC ${L === 4 ? '≈ ' + n(roundTo(z, 2)) : '= ' + z} m. Le chemin par les côtés mesure ${x + y} m. Économie : ${x + y} − ${L === 4 ? n(roundTo(z, 2)) : z} ${L === 4 ? '≈ ' + n(roundTo(v, 0)) : '= ' + v} m.`,
        errs: errsF(v, [{ v: z, m: 'Tu as calculé AC. On demande la distance économisée : (AB + BC) − AC.' }, { v: x + y, m: 'C’est la longueur du chemin par les côtés. Calcule AC, puis la différence.' }]),
        hints: H('Calcule d’abord la diagonale AC.', 'Distance économisée = (AB + BC) − AC.', '') };
    } }
  ]);

  /* ---------- Thalès ---------- */
  add('thales', [
    { id: 'th-seg', lv: [2, 3], auto: true, f(L) {
      const k = pick([2, 3, 4, 1.5, 2.5]), AM = 2 * R(1, 6), AB = AM * k, AN = 2 * R(1, 7), AC = AN * k, NC = AC - AN, v = L === 2 ? AC : NC;
      return { html: `M est un point du segment [AB] et N un point du segment [AC]. Les droites (MN) et (BC) sont parallèles. On donne AM = ${AM} cm, AB = ${n(AB)} cm et AN = ${AN} cm. Calculer ${L === 2 ? 'AC' : 'NC'}.${thalesFig(['A', 'B', 'C', 'M', 'N'])}`, v, suffix: 'cm', ans: a(v),
        corr: `D’après le théorème de Thalès : AM/AB = AN/AC, soit ${AM}/${n(AB)} = ${AN}/AC. AC = ${AN} × ${n(AB)} ÷ ${AM} = ${n(AC)} cm.${L === 3 ? ` Comme N est sur [AC] : NC = ${n(AC)} − ${AN} = ${n(NC)} cm.` : ''}`,
        errs: errsF(v, [{ v: AC, m: 'Tu as trouvé AC. Il reste à calculer NC = AC − AN.' }, { v: AN * AM / AB, m: 'Vérifie l’égalité des rapports : AM/AB = AN/AC (petit côté sur grand côté des deux côtés).' }, { v: NC, m: 'NC est une partie de [AC]. On demande AC entier.' }]),
        hints: H('Écris l’égalité des rapports de Thalès.', 'AM/AB = AN/AC, puis produit en croix.', '') };
    } },
    { id: 'th-red', lv: [2, 3], auto: true, f(L) {
      if (L === 2) { const AM = R(2, 9), AB = AM + R(1, 9);
        return { html: `M est sur [AB], N est sur [AC] et (MN) // (BC). On donne AM = ${AM} cm et AB = ${AB} cm. Le triangle AMN est une réduction du triangle ABC. Quel est le coefficient de réduction ? Donner une fraction irréductible.`, v: AM / AB, ans: fa(AM, AB), form: 'irr',
          corr: `Coefficient = AM ÷ AB = ${F(AM, AB)}${gcd(AM, AB) > 1 ? ' = ' + FR(AM, AB) : ''}.`,
          errs: errsF(AM / AB, [{ v: AB / AM, m: 'Une réduction a un coefficient plus petit que 1 : petite longueur ÷ grande longueur.' }]),
          hints: H('Compare une longueur du petit triangle à la longueur correspondante du grand.', 'k = AM ÷ AB.', '') }; }
      const [u, d] = pick([[1, 2], [1, 3], [2, 3], [3, 4], [2, 5], [3, 5]]), S = d * d * R(1, 6), v = S * u * u / (d * d);
      return { html: `Dans une configuration de Thalès, le triangle AMN est une réduction de coefficient ${F(u, d)} du triangle ABC. L’aire du triangle ABC est ${S} cm². Quelle est l’aire du triangle AMN ?`, v, suffix: 'cm²', ans: a(v),
        corr: `Les aires sont multipliées par k² = (${F(u, d)})² = ${F(u * u, d * d)}. ${S} × ${F(u * u, d * d)} = ${n(v)} cm².`,
        errs: errsF(v, [{ v: S * u / d, m: 'Les aires sont multipliées par k², pas par k.' }]),
        hints: H('Les aires d’une réduction de coefficient k sont multipliées par k².', `Calcule ${S} × (${u}/${d})².`, '') };
    } }
  ]);

  /* ---------- Trigonométrie ---------- */
  add('trigo', [
    { id: 'tr-choix', lv: [1, 2], auto: true, f() {
      const T = pick(['ABC', 'EFG', 'RST', 'MNP', 'IJK']), [P, Q, S] = T.split(''), ang = `l’angle ${P}${S}${Q}̂`;
      const C = [[`${Q}${S} et ${P}${S}`, ang, 0], [`${P}${Q} et ${P}${S}`, ang, 1], [`${P}${Q} et ${Q}${S}`, ang, 2], [`${ang} et ${Q}${S}`, `${P}${Q}`, 2], [`${ang} et ${P}${S}`, `${Q}${S}`, 0], [`${ang} et ${P}${S}`, `${P}${Q}`, 1], [`${Q}${S} et ${P}${S}`, `${P}${Q}`, 3]];
      const [k, w, g] = pick(C), O = ['le cosinus', 'le sinus', 'la tangente', 'le théorème de Pythagore'];
      return qcm(`Le triangle ${T} est rectangle en ${Q}. On connaît ${k}, et on cherche ${w}. Quel outil faut-il utiliser ?${rightTri(P, Q, S, {}, 'S')}`, O[g], O,
        g === 3 ? 'On connaît deux côtés et on cherche le troisième, sans angle : c’est le théorème de Pythagore.' : `Par rapport à l’angle en ${S} : [${P}${S}] est l’hypoténuse, [${Q}${S}] le côté adjacent, [${P}${Q}] le côté opposé. On utilise ${O[g]} (${['adjacent ÷ hypoténuse', 'opposé ÷ hypoténuse', 'opposé ÷ adjacent'][g]}).`,
        H('Repère l’hypoténuse, puis les côtés adjacent et opposé à l’angle.', 'CAH : cos = adjacent ÷ hypoténuse ; SOH : sin = opposé ÷ hypoténuse ; TOA : tan = opposé ÷ adjacent.', ''));
    } },
    { id: 'tr-hyp', lv: [3, 4], auto: false, calc: true, f() {
      const T = pick(['ABC', 'EFG', 'RST', 'MNP']), [P, Q, S] = T.split(''), ang = R(20, 70), t = pick(['cos', 'sin']), s = R(3, 15);
      const rad = ang * Math.PI / 180, v = t === 'cos' ? s / Math.cos(rad) : s / Math.sin(rad), side = t === 'cos' ? `${Q}${S}` : `${P}${Q}`;
      return { html: `Le triangle ${T} est rectangle en ${Q}, avec ${side} = ${s} cm et l’angle ${P}${S}${Q}̂ = ${ang}°. Calculer l’hypoténuse ${P}${S}, arrondie au dixième.${rightTri(P, Q, S, { [t === 'cos' ? 'QS' : 'PQ']: s + ' cm', PS: '?' }, 'S')}`, v, round: 1, suffix: 'cm', ans: a(roundTo(v, 1)),
        corr: `${t}(${P}${S}${Q}̂) = ${side} ÷ ${P}${S}, donc ${P}${S} = ${s} ÷ ${t}(${ang}°) ≈ ${n(roundTo(v, 1))} cm.`,
        errs: errsF(v, [{ v: t === 'cos' ? s * Math.cos(rad) : s * Math.sin(rad), m: `L’hypoténuse est au dénominateur : ${P}${S} = ${side} ÷ ${t}(${ang}°).` }]),
        hints: H(`Quel côté connais-tu par rapport à l’angle en ${S} ?`, `${t} = ${t === 'cos' ? 'adjacent' : 'opposé'} ÷ hypoténuse, donc hypoténuse = ${t === 'cos' ? 'adjacent' : 'opposé'} ÷ ${t}.`, '') };
    } },
    { id: 'tr-haut', lv: [4], auto: false, calc: true, f() {
      const d = R(10, 60), ang = R(20, 60), e = pick([0, 1.5, 1.6, 1.7]), t = Math.tan(ang * Math.PI / 180), v = d * t + e;
      return { html: `Pour estimer la hauteur d’un arbre vertical, Inès se place à ${d} m de son pied, sur un sol horizontal. Elle vise le sommet avec un angle de ${ang}° par rapport à l’horizontale${e ? `, ses yeux étant à ${n(e)} m du sol` : ', depuis le sol'}. Quelle est la hauteur de l’arbre ? Arrondir au dixième de mètre.`, v, round: 1, suffix: 'm', ans: a(roundTo(v, 1)),
        corr: `Dans le triangle rectangle formé : tan(${ang}°) = hauteur au-dessus des yeux ÷ ${d}, donc cette hauteur vaut ${d} × tan(${ang}°) ≈ ${n(roundTo(d * t, 2))} m.${e ? ` On ajoute la hauteur des yeux : ${n(roundTo(d * t, 2))} + ${n(e)} ≈ ${n(roundTo(v, 1))} m.` : ''}`,
        errs: errsF(v, [...(e ? [{ v: d * t, m: 'N’oublie pas d’ajouter la hauteur des yeux d’Inès.' }] : []), { v: d * Math.sin(ang * Math.PI / 180) + e, m: 'On connaît le côté adjacent : utilise la tangente.' }]), hints: [] };
    } }
  ]);

  /* ---------- Nombres relatifs ---------- */
  add('calc', [
    { id: 'rel-signe', lv: [2, 3], auto: true, f(L) {
      let expr, neg, corr;
      if (L === 2) { const f = Array.from({ length: R(3, 5) }, () => nz(-9, 9)); neg = f.filter(x => x < 0).length;
        expr = f.map(p).join(' × '); corr = `Il y a ${neg} facteur${neg > 1 ? 's' : ''} négatif${neg > 1 ? 's' : ''}. ${neg % 2 ? 'Ce nombre est impair' : 'Ce nombre est pair'} : le produit est ${neg % 2 ? 'négatif' : 'positif'}.`; }
      else { const b = R(2, 9), e = R(2, 7), c = nz(-9, 9), d = nz(-9, 9); neg = (e % 2) + (c < 0) + (d < 0);
        expr = `(−${b})${sup(e)} × ${p(c)} ÷ ${p(d)}`; corr = `(−${b})${sup(e)} est ${e % 2 ? 'négatif (exposant impair)' : 'positif (exposant pair)'}. Avec ${p(c)} et ${p(d)}, il y a ${neg} nombre${neg > 1 ? 's' : ''} négatif${neg > 1 ? 's' : ''} : le résultat est ${neg % 2 ? 'négatif' : 'positif'}.`; }
      const good = neg % 2 ? 'négatif' : 'positif';
      return qcm(`Sans effectuer le calcul, donner le signe de : ${M_(expr)}`, good, ['positif', 'négatif'], corr,
        H('Compte les nombres négatifs.', 'Un nombre pair de facteurs négatifs donne un résultat positif ; un nombre impair, un résultat négatif.', 'Exemple : (−2) × (−3) × (−1) est négatif (3 facteurs négatifs).'), ['positif', 'négatif']);
    } },
    { id: 'rel-ctx', lv: [1, 2], auto: true, f(L) {
      if (L === 1) { const t0 = R(-12, 4), d = R(3, 15), up = R(0, 1) === 1, v = up ? t0 + d : t0 - d;
        return { html: `Le matin, il fait ${n(t0)} °C. La température ${up ? 'monte' : 'baisse'} de ${d} °C dans la journée. Quelle température fait-il le soir ?`, v, suffix: '°C', ans: a(v),
          corr: `${n(t0)} ${up ? '+' : '−'} ${d} = ${n(v)} °C.`,
          errs: errsF(v, [{ v: up ? t0 - d : t0 + d, m: up ? 'La température monte : on ajoute.' : 'La température baisse : on soustrait.' }, { v: -v, m: 'Attention au signe du résultat. Aide-toi d’un thermomètre.' }]),
          hints: H('Imagine un thermomètre.', up ? 'Monter, c’est ajouter.' : 'Baisser, c’est soustraire.', 'Exemple : −3 °C, puis +5 °C → 2 °C.') }; }
      const ctx = R(0, 1);
      if (ctx) { const mn = R(-25, -1), mx = R(1, 30), v = mx - mn;
        return { html: `Dans une ville, la température la plus basse de l’année a été ${n(mn)} °C et la plus haute ${mx} °C. Quel est l’écart entre ces deux températures ?`, v, suffix: '°C', ans: String(v),
          corr: `Écart = ${mx} − ${p(mn)} = ${mx} + ${-mn} = ${v} °C.`,
          errs: errsF(v, [{ v: mx + mn, m: 'Soustraire un nombre négatif, c’est ajouter son opposé : ' + mx + ' − ' + p(mn) + ' = ' + mx + ' + ' + -mn + '.' }]),
          hints: H('L’écart = la plus grande valeur − la plus petite.', 'Soustraire un nombre négatif revient à ajouter son opposé.', '') }; }
      const z = -R(5, 60), d = R(2, 40), v = z + d;
      return { html: `Un plongeur se trouve à l’altitude ${n(z)} m (sous le niveau de la mer). Il remonte de ${d} m. À quelle altitude se trouve-t-il ?`, v, suffix: 'm', ans: a(v),
        corr: `${n(z)} + ${d} = ${n(v)} m.${v > 0 ? ' Il est sorti de l’eau… sur un plongeoir !' : ''}`,
        errs: errsF(v, [{ v: z - d, m: 'Remonter, c’est ajouter.' }, { v: -v, m: 'Attention au signe du résultat.' }]),
        hints: H('Le niveau de la mer correspond à 0.', 'Remonter : on ajoute.', '') };
    } },
    { id: 'rel-chain', lv: [2, 3], auto: true, f(L) {
      if (L === 2) { const x = nz(-9, 9), y = nz(-9, 9), z = nz(-5, 5), v = x * y * z;
        return { html: `Calculer : ${M_(`${n(x)} × ${p(y)} × ${p(z)}`)}`, v, ans: a(v), corr: `${n(x)} × ${p(y)} = ${n(x * y)}, puis ${n(x * y)} × ${p(z)} = ${n(v)}.`,
          errs: errsF(v, [{ v: -v, m: 'Revois le signe : compte les facteurs négatifs.' }]),
          hints: H('Commence par le signe.', 'Compte les facteurs négatifs, puis multiplie les distances à zéro.', '') }; }
      const z = nz(-6, 6), x = z * nz(-5, 5), y = nz(-9, 9), v = x * y / z;
      return { html: `Calculer : ${M_(`${n(x)} × ${p(y)} ÷ ${p(z)}`)}`, v, ans: a(v), corr: `${n(x)} × ${p(y)} = ${n(x * y)}, puis ${n(x * y)} ÷ ${p(z)} = ${n(v)}.`,
        errs: errsF(v, [{ v: -v, m: 'Revois le signe : compte les nombres négatifs.' }]),
        hints: H('Calcule de gauche à droite (× et ÷ ont la même priorité).', 'Signe : compte les nombres négatifs.', '') };
    } }
  ]);

  /* ---------- Puissances ---------- */
  add('pui', [
    { id: 'pw-prefix', lv: [2, 3], auto: true, f(L) {
      const [nom, sym, base, e] = pick([['kilomètre', 'km', 'm', 3], ['mégawatt', 'MW', 'W', 6], ['gigaoctet', 'Go', 'octets', 9], ['téraoctet', 'To', 'octets', 12], ['milligramme', 'mg', 'g', -3], ['micromètre', 'µm', 'm', -6], ['nanomètre', 'nm', 'm', -9], ['mégaoctet', 'Mo', 'octets', 6]]);
      if (L === 2) return { html: `1 ${nom} (${sym}) = 10<sup>?</sup> ${base}. Quel est l’exposant ?`, v: e, ans: String(e),
        corr: `Le préfixe ${nom.replace(/(mètre|watt|octet|gramme)$/, '')} correspond à 10${sup(e)} : 1 ${sym} = 10${sup(e)} ${base}.`,
        errs: errsF(e, [{ v: -e, m: e > 0 ? 'Ce préfixe désigne un multiple : l’exposant est positif.' : 'Ce préfixe désigne une petite partie : l’exposant est négatif.' }]),
        hints: H('kilo, méga, giga, téra : 3, 6, 9, 12.', 'milli, micro, nano : −3, −6, −9.', '') };
      const x = R(2, 9), v = x * 10 ** e;
      return { html: `Écrire ${x} ${sym} en ${base}, en notation scientifique.`, v, form: 'sci', suffix: base, ans: `${x}*10^${e}`, tol: 1e-9 * v / Math.max(1, v),
        corr: `1 ${sym} = 10${sup(e)} ${base}, donc ${x} ${sym} = ${x} × 10${sup(e)} ${base}.`,
        errs: errsF(v, [{ v: x * 10 ** -e, m: 'Vérifie le signe de l’exposant du préfixe.' }]),
        hints: H('Commence par 1 ' + sym + ' en ' + base + '.', 'kilo 10³, méga 10⁶, giga 10⁹, téra 10¹², milli 10⁻³, micro 10⁻⁶, nano 10⁻⁹.', '') };
    } },
    { id: 'pw-cmp', lv: [3, 4], auto: true, f(L) {
      let vals; do {
        vals = Array.from({ length: 4 }, () => { const m = R(11, 99) / 10, e = R(-4, 8); return { m, e, v: m * 10 ** e }; });
        if (L === 4) { const k = R(0, 3), sh = pick([1, -1]); vals[k] = { m: vals[k].m * 10 ** sh, e: vals[k].e - sh, v: vals[k].v }; }
      } while (new Set(vals.map(x => x.v.toPrecision(6))).size < 4);
      const big = R(0, 1) === 1, t = vals.reduce((b, x) => (big ? x.v > b.v : x.v < b.v) ? x : b);
      const lab = x => `${n(roundTo(x.m, 6))} × 10${sup(x.e)}`;
      return qcm(`Quel est le plus ${big ? 'grand' : 'petit'} de ces nombres ?`, lab(t), vals.map(lab),
        `On compare d’abord les puissances de 10 (quand les nombres sont en notation scientifique), puis les premiers facteurs. Le plus ${big ? 'grand' : 'petit'} est ${lab(t)}.`,
        H('Écris chaque nombre en notation scientifique.', 'Le nombre qui a la plus grande puissance de 10 est le plus grand.', ''));
    } }
  ]);

  /* ---------- Aires et volumes ---------- */
  add('aire', [
    { id: 'ar-prisme', lv: [2, 3], auto: true, f(L) {
      if (L === 2) { const x = R(2, 10), y = 2 * R(1, 6), h = R(3, 15), v = x * y / 2 * h;
        return { html: `Un prisme droit a pour base un triangle rectangle dont les côtés de l’angle droit mesurent ${x} cm et ${y} cm. Sa hauteur est ${h} cm. Calculer son volume.`, v, unit: 'cm³', units: UL, ans: a(v),
          corr: `Aire de la base : ${x} × ${y} ÷ 2 = ${x * y / 2} cm². V = ${x * y / 2} × ${h} = ${v} cm³.`,
          errs: errsF(v, [{ v: x * y * h, m: 'La base est un triangle : son aire est la moitié de ' + x + ' × ' + y + '.' }, { v: v / 3, m: 'On ne divise par 3 que pour les pyramides et les cônes.' }]),
          hints: H('Volume d’un prisme = aire de la base × hauteur.', 'Aire d’un triangle rectangle = produit des côtés de l’angle droit ÷ 2.', '') }; }
      const x = R(2, 12), y = R(2, 10), h = 3 * R(1, 6), v = x * y * h / 3;
      return { html: `Une pyramide a pour base un rectangle de ${x} cm sur ${y} cm, et une hauteur de ${h} cm. Calculer son volume.`, v, unit: 'cm³', units: UL, ans: a(v),
        corr: `Aire de la base : ${x} × ${y} = ${x * y} cm². V = ${x * y} × ${h} ÷ 3 = ${n(v)} cm³.`,
        errs: errsF(v, [{ v: x * y * h, m: 'Pour une pyramide, on divise par 3.' }]),
        hints: H('Volume d’une pyramide = aire de la base × hauteur ÷ 3.', `Aire de la base : ${x} × ${y}.`, '') };
    } },
    { id: 'ar-inv', lv: [2, 3], auto: true, f(L) {
      if (L === 2) { const c = R(2, 15);
        if (R(0, 1)) return { html: `Un carré a une aire de ${c * c} cm². Quelle est la longueur de son côté ?`, v: c, unit: 'cm', units: UL, ans: String(c),
          corr: `Côté × côté = ${c * c}, donc côté = √${c * c} = ${c} cm.`, errs: errsF(c, [{ v: c * c / 4, m: 'L’aire n’est pas le périmètre : cherche le nombre qui, multiplié par lui-même, donne ' + c * c + '.' }, { v: c * c / 2, m: 'L’aire d’un carré est côté × côté, pas côté × 2.' }]),
          hints: H('Aire d’un carré = côté × côté.', `Quel nombre multiplié par lui-même donne ${c * c} ?`, '') };
        return { html: `Un carré a un périmètre de ${4 * c} cm. Quelle est son aire ?`, v: c * c, unit: 'cm²', units: UL, ans: String(c * c),
          corr: `Côté = ${4 * c} ÷ 4 = ${c} cm. Aire = ${c} × ${c} = ${c * c} cm².`, errs: errsF(c * c, [{ v: 16 * c * c, m: 'Calcule d’abord le côté : périmètre ÷ 4.' }, { v: c, m: 'Tu as trouvé le côté. Calcule l’aire.' }]),
          hints: H('Commence par la longueur du côté.', 'Côté = périmètre ÷ 4, puis aire = côté².', '') }; }
      if (R(0, 1)) { const r = R(2, 12);
        return { html: `Un disque a une aire de ${r * r}π cm². Quel est son rayon ?`, v: r, unit: 'cm', units: UL, ans: String(r),
          corr: `π × r² = ${r * r}π, donc r² = ${r * r} et r = ${r} cm.`, errs: errsF(r, [{ v: r * r / 2, m: 'r² signifie r × r : cherche le nombre dont le carré vaut ' + r * r + '.' }, { v: r * r, m: 'Tu as trouvé r². Prends la racine carrée.' }]),
          hints: H('Aire d’un disque = π × r².', `r² = ${r * r}.`, '') }; }
      const l = R(2, 12), Lg = l + R(1, 10), A = l * Lg, P = 2 * (l + Lg);
      return { html: `Un rectangle a une aire de ${A} cm² et une longueur de ${Lg} cm. Quel est son périmètre ?`, v: P, unit: 'cm', units: UL, ans: String(P),
        corr: `Largeur = ${A} ÷ ${Lg} = ${l} cm. Périmètre = 2 × (${Lg} + ${l}) = ${P} cm.`, errs: errsF(P, [{ v: l, m: 'Tu as trouvé la largeur. Calcule ensuite le périmètre.' }, { v: Lg + l, m: 'Le périmètre compte deux longueurs et deux largeurs.' }]),
        hints: H('Commence par la largeur.', 'Largeur = aire ÷ longueur, puis périmètre = 2 × (L + l).', '') };
    } },
    { id: 'ar-litre', lv: [3, 4], auto: false, calc: true, f(L) {
      if (L === 3) { const r = R(3, 15), h = R(10, 40), V = Math.PI * r * r * h, v = V / 1000;
        return { html: `Une casserole cylindrique a un rayon intérieur de ${r} cm et une hauteur de ${h} cm. Quelle est sa contenance, en litres, arrondie au dixième ?`, v, round: 1, suffix: 'L', ans: a(roundTo(v, 1)),
          corr: `V = π × ${r}² × ${h} = ${r * r * h}π ≈ ${n(roundTo(V, 0))} cm³. 1 L = 1 000 cm³, donc ≈ ${n(roundTo(v, 1))} L.`,
          errs: errsF(v, [{ v: V, m: 'Ce résultat est en cm³ : divise par 1 000 pour obtenir des litres.' }, { v: 2 * Math.PI * r * h / 1000, m: 'Le volume d’un cylindre est π × r² × h.' }]),
          hints: H('Calcule le volume en cm³.', 'V = π × r² × h, puis 1 L = 1 000 cm³.', '') }; }
      const d = 2 * R(2, 8), v = 4 / 3 * Math.PI * (d / 2) ** 3;
      return { html: `Une balle a la forme d’une boule de ${d} cm de diamètre. Calculer son volume, arrondi au cm³.`, v, round: 0, unit: 'cm³', units: UL, ans: a(roundTo(v, 0)),
        corr: `Le rayon vaut ${d / 2} cm. V = 4/3 × π × ${d / 2}³ ≈ ${n(roundTo(v, 0))} cm³.`,
        errs: errsF(v, [{ v: roundTo(4 / 3 * Math.PI * d ** 3, 0), m: 'La formule utilise le rayon, qui est la moitié du diamètre.' }]), hints: [] };
    } }
  ]);

  /* ---------- Calcul littéral ---------- */
  add('litt', [
    { id: 'li-model', lv: [2, 3], auto: true, f(L) {
      const c = R(1, 9);
      if (L === 2) { const t = pick(['rect', 'tri', 'prix']);
        if (t === 'rect') return { html: `Un rectangle a une largeur de x cm et une longueur de (x + ${c}) cm. Exprimer son périmètre en fonction de x, sous forme réduite.`, f: x => 4 * x + 2 * c, form: 'red', ans: linA(4, 2 * c),
          corr: `P = 2 × (x + x + ${c}) = 2 × (2x + ${c}) = ${lin(4, 2 * c)}.`,
          errs: [{ f: x => 2 * x + c, m: 'Le périmètre compte deux longueurs et deux largeurs.' }, { f: x => 2 * x + 2 * c, m: 'Il y a deux largeurs (x) et deux longueurs (x + ' + c + ') : cela fait 4x.' }],
          hints: H('Périmètre d’un rectangle = 2 × (longueur + largeur).', 'Additionne, puis réduis.', '') };
        if (t === 'tri') return { html: `Un triangle équilatéral a des côtés de (x + ${c}) cm. Exprimer son périmètre en fonction de x, sous forme réduite.`, f: x => 3 * x + 3 * c, form: 'red', ans: linA(3, 3 * c),
          corr: `P = 3 × (x + ${c}) = ${lin(3, 3 * c)}.`,
          errs: [{ f: x => 3 * x + c, m: 'Le 3 multiplie tout le côté, donc aussi ' + c + '.' }],
          hints: H('Un triangle équilatéral a trois côtés égaux.', 'P = 3 × côté, puis développe.', '') };
        const pu = R(2, 6), s = R(5, 30);
        return { html: `Un cahier coûte ${pu} € et un sac coûte ${s} €. Exprimer, en fonction de x, le prix de x cahiers et d’un sac.`, f: x => pu * x + s, form: 'red', ans: linA(pu, s),
          corr: `x cahiers coûtent ${pu} × x = ${pu}x €. Avec le sac : ${lin(pu, s)}.`,
          errs: [{ f: x => (pu + s) * x, m: 'Il n’y a qu’un seul sac : ' + s + ' n’est pas multiplié par x.' }],
          hints: H('Combien coûtent x cahiers ?', 'Prix = (prix d’un cahier) × x + prix du sac.', '') }; }
      if (R(0, 1)) return { html: `Un rectangle a une largeur de x cm et une longueur de (x + ${c}) cm. Exprimer son aire en fonction de x, sous forme développée.`, f: x => x * x + c * x, form: 'dev', ans: poly([1, c, 0], 'x', true),
        corr: `A = x × (x + ${c}) = ${poly([1, c, 0])}.`,
        errs: [{ f: x => 4 * x + 2 * c, m: 'Tu as calculé le périmètre. L’aire = longueur × largeur.' }, { f: x => x * x + c, m: 'Distribue x sur les deux termes : x × ' + c + ' = ' + c + 'x.' }],
        hints: H('Aire = longueur × largeur.', 'Développe x(x + ' + c + ').', '') };
      return { html: `Un carré a des côtés de (x + ${c}) cm. Exprimer son aire en fonction de x, sous forme développée et réduite.`, f: x => (x + c) ** 2, form: 'dev', ans: poly([1, 2 * c, c * c], 'x', true),
        corr: `A = (x + ${c})² = x² + 2 × x × ${c} + ${c}² = ${poly([1, 2 * c, c * c])}.`,
        errs: [{ f: x => x * x + c * c, m: '(a + b)² = a² + 2ab + b² : il manque le double produit.' }, { f: x => 4 * x + 4 * c, m: 'Tu as calculé le périmètre. L’aire = côté².' }],
        hints: H('Aire d’un carré = côté².', '(a + b)² = a² + 2ab + b².', '') };
    } },
    { id: 'li-prod', lv: [1, 2], auto: true, f(L) {
      if (L === 1) { const k1 = R(2, 9), k2 = R(2, 9), sq = R(0, 1) === 1, K = k1 * k2;
        return { html: `Réduire : ${M_(sq ? `${k1}x × ${k2}x` : `${k1}x × ${k2}`)}`, f: sq ? x => K * x * x : x => K * x, form: 'red', ans: sq ? `${K}x^2` : `${K}x`,
          corr: sq ? `${k1} × ${k2} = ${K} et x × x = x², donc ${K}x².` : `${k1} × ${k2} = ${K}, donc ${K}x.`,
          errs: sq ? [{ f: x => K * x, m: 'x × x = x².' }, { f: x => (k1 + k2) * x * x, m: 'On multiplie les nombres, on ne les additionne pas.' }, { f: x => (k1 + k2) * x, m: 'C’est un produit, pas une somme.' }] : [{ f: x => (k1 + k2) * x, m: 'On multiplie les nombres, on ne les additionne pas.' }],
          hints: H('Multiplie les nombres entre eux, puis les lettres entre elles.', 'x × x = x².', 'Exemple : 3x × 4x = 12x².') }; }
      const k1 = nz(-9, 9), k2 = nz(-9, 9), cube = R(0, 1) === 1, K = k1 * k2;
      const t2 = k2 < 0 ? `(${n(k2)}x)` : `${n(k2)}x`;
      return { html: `Réduire : ${M_(cube ? `${n(k1)}x² × ${t2}` : `${n(k1)}x × ${t2}`)}`, f: cube ? x => K * x ** 3 : x => K * x * x, form: 'red', ans: cube ? `${K}x^3` : `${K}x^2`,
        corr: `${n(k1)} × ${p(k2)} = ${n(K)} et ${cube ? 'x² × x = x³' : 'x × x = x²'}, donc ${n(K)}x${cube ? '³' : '²'}.`,
        errs: [{ f: cube ? x => -K * x ** 3 : x => -K * x * x, m: 'Revois la règle des signes.' }, { f: cube ? x => K * x * x : x => K * x, m: cube ? 'x² × x = x³.' : 'x × x = x².' }],
        hints: H('Commence par le signe.', 'Multiplie les nombres, puis les puissances de x (on additionne les exposants).', 'Exemple : −2x² × 3x = −6x³.') };
    } }
  ]);

  /* ---------- Équations ---------- */
  add('eq', [
    { id: 'eq-frac', lv: [3], auto: true, f() {
      const k = pick([2, 3, 4, 5]), b = nz(-9, 9), c = R(-10, 10), s = k * (c - b);
      return { html: `Résoudre l’équation : ${M_(`${F('x', k)} ${b < 0 ? '−' : '+'} ${Math.abs(b)} = ${n(c)}`)}`, v: s, ans: `x=${s}`,
        corr: `${F('x', k)} = ${n(c)} ${b < 0 ? '+' : '−'} ${Math.abs(b)} = ${n(c - b)}, donc x = ${n(c - b)} × ${k} = ${n(s)}.`,
        errs: errsF(s, [{ v: c - b, m: 'Il reste à multiplier par ' + k + ' pour trouver x.' }, { v: (c - b) / k, m: 'x divisé par ' + k + ' vaut ' + n(c - b) + ' : on multiplie par ' + k + ', on ne divise pas.' }, { v: k * (c + b), m: 'Attention au signe quand tu changes ' + n(b) + ' de membre.' }]),
        hints: H('Isole d’abord la fraction.', `Puis multiplie les deux membres par ${k}.`, '') };
    } },
    { id: 'eq-model', lv: [2, 3], auto: true, f(L) {
      const k = R(2, 9), b = R(1, 12), c = R(15, 60);
      const E = { ax: `${k}x + ${b} = ${c}`, par: `${k}(x + ${b}) = ${c}`, swap: `${b}x + ${k} = ${c}`, sum: `x + ${k} + ${b} = ${c}`, mul: `${k}x × ${b} = ${c}` };
      if (L === 2) return qcm(`Je choisis un nombre x. Je le multiplie par ${k}, puis j’ajoute ${b}. J’obtiens ${c}.<br>Quelle équation traduit ce problème ?`, E.ax, [E.par, E.swap, E.sum, E.mul],
        `On multiplie x par ${k} : ${k}x. Puis on ajoute ${b} : ${k}x + ${b}. Le résultat est ${c} : ${E.ax}.`,
        H('Traduis les étapes dans l’ordre.', '« Multiplier x par ' + k + ' » s’écrit ' + k + 'x.', ''));
      return qcm(`Je choisis un nombre x. J’ajoute ${b}, puis je multiplie le résultat par ${k}. J’obtiens ${c}.<br>Quelle équation traduit ce problème ?`, E.par, [E.ax, E.swap, E.sum, E.mul],
        `On ajoute d’abord ${b} : x + ${b}. Puis on multiplie tout le résultat par ${k} : ${E.par}. Les parenthèses sont indispensables.`,
        H('Traduis les étapes dans l’ordre.', 'Quand on multiplie « le résultat », il faut des parenthèses.', ''));
    } }
  ]);

  /* ---------- Fonctions ---------- */
  add('fonc', [
    { id: 'fo-coef', lv: [2, 3], auto: true, f(L) {
      if (L === 2) { const k = nz(-9, 9), b = nz(-9, 9), askA = R(0, 1) === 1, v = askA ? k : b;
        return { html: `f est la fonction affine définie par ${M_(`f(x) = ${n(b)} ${k < 0 ? '−' : '+'} ${Math.abs(k) === 1 ? '' : Math.abs(k)}x`)}. On écrit f(x) = ax + b. Quelle est la valeur de ${askA ? 'a (le coefficient directeur)' : 'b (l’ordonnée à l’origine)'} ?`, v, ans: a(v),
          corr: `f(x) = ${lin(k, b)} : a = ${n(k)} et b = ${n(b)}.`,
          errs: errsF(v, [{ v: askA ? b : k, m: askA ? 'a est le nombre qui multiplie x, même s’il est écrit en second.' : 'b est le nombre seul, sans x.' }, { v: -v, m: 'Garde le signe qui précède le nombre.' }]),
          hints: H('Réécris f(x) sous la forme ax + b.', 'a multiplie x ; b est le nombre seul.', '') }; }
      const k = pick([-2, -1, 1, 2, 0.5, -0.5]), b = R(-3, 3);
      return { html: `La droite ci-dessous représente une fonction affine f. Lire son coefficient directeur.${graphFig(k, b)}`, v: k, ans: a(k),
        corr: `Quand x augmente de ${Math.abs(k) < 1 ? 2 : 1}, f(x) ${k > 0 ? 'augmente' : 'diminue'} de ${n(Math.abs(k) < 1 ? 1 : Math.abs(k))}. Le coefficient directeur vaut ${n(k)}.`,
        errs: errsF(k, [{ v: b, m: 'C’est l’ordonnée à l’origine (là où la droite coupe l’axe vertical). Le coefficient directeur mesure la pente.' }, { v: -k, m: 'La droite ' + (k > 0 ? 'monte' : 'descend') + ' : le coefficient est ' + (k > 0 ? 'positif.' : 'négatif.') }, { v: 1 / k, m: 'On divise le déplacement vertical par le déplacement horizontal.' }]),
        hints: H('Choisis deux points de la droite sur des nœuds du quadrillage.', 'Coefficient = déplacement vertical ÷ déplacement horizontal.', '') };
    } },
    { id: 'fo-cmp', lv: [3, 4], auto: true, f(L) {
      const [quoi, u] = pick([['séances de piscine', 'séance'], ['heures de location de vélo', 'heure'], ['places de cinéma', 'place']]);
      const pB = R(5, 12), pA = R(2, pB - 2), aA = (pB - pA) * R(3, 12) + R(0, pB - pA - 1);
      const intro = `Tarif A : abonnement de ${aA} € puis ${pA} € par ${u}.<br>Tarif B : ${pB} € par ${u}, sans abonnement.`;
      if (L === 3) { const x = R(2, 25), cA = aA + pA * x, cB = pB * x, g = cA < cB ? 'Le tarif A' : cA > cB ? 'Le tarif B' : 'Les deux coûtent autant';
        return qcm(`${intro}<br>Pour ${x} ${quoi}, quel tarif est le plus avantageux ?`, g, ['Le tarif A', 'Le tarif B', 'Les deux coûtent autant'],
          `Tarif A : ${aA} + ${pA} × ${x} = ${cA} €. Tarif B : ${pB} × ${x} = ${cB} €. ${g === 'Les deux coûtent autant' ? 'Les deux prix sont égaux.' : g + ' est le moins cher.'}`,
          H('Calcule le prix avec chaque tarif.', 'Tarif A : abonnement + prix unitaire × nombre ; tarif B : prix unitaire × nombre.', ''), ['Le tarif A', 'Le tarif B', 'Les deux coûtent autant']); }
      const v = Math.floor(aA / (pB - pA)) + 1;
      return { html: `${intro}<br>À partir de combien de ${quoi} le tarif A devient-il strictement moins cher que le tarif B ?`, v, ans: String(v),
        corr: `On cherche x tel que ${aA} + ${pA}x &lt; ${pB}x, soit ${aA} &lt; ${pB - pA}x, donc x &gt; ${n(roundTo(aA / (pB - pA), 2))}. Le premier nombre entier qui convient est ${v}. (Pour ${v} : A = ${aA + pA * v} €, B = ${pB * v} €.)`,
        errs: errsF(v, [{ v: v - 1, m: `Pour ${v - 1}, le tarif A n’est pas strictement moins cher : vérifie en calculant les deux prix.` }, { v: Math.round(aA / pB), m: 'Compare les deux tarifs : la différence de prix par ' + u + ' est ' + (pB - pA) + ' €.' }]), hints: [] };
    } }
  ]);

  /* ---------- Statistiques ---------- */
  function barFig(labs, vals) {
    const mx = Math.max(...vals), top = mx + (mx % 2 ? 1 : 2), h = 140 / top, w = 200 / labs.length; let g = '';
    for (let i = 0; i <= top; i++) g += `<line x1="40" y1="${160 - i * h}" x2="250" y2="${160 - i * h}" stroke="var(--line)"/>${i % 2 === 0 ? `<text x="34" y="${163 - i * h}" text-anchor="end" style="font-size:9px">${i}</text>` : ''}`;
    const bars = vals.map((v, i) => `<rect x="${48 + i * w}" y="${160 - v * h}" width="${w - 14}" height="${v * h}" fill="currentColor" style="color:var(--accent)" opacity=".85"/><text x="${48 + i * w + (w - 14) / 2}" y="174" text-anchor="middle" style="font-size:10px">${labs[i]}</text>`).join('');
    return `<div class="fig"><svg viewBox="0 0 260 180" role="img" aria-label="Diagramme en barres : ${labs.map((l, i) => l + ' ' + vals[i]).join(', ')}">${g}<line x1="40" y1="160" x2="250" y2="160" stroke="var(--muted)" stroke-width="1.5"/>${bars}</svg><span class="small muted">Chaque ligne horizontale correspond à 1.</span></div>`;
  }
  add('stat', [
    { id: 'st-circ', lv: [2, 3], auto: true, f(L) {
      const T = pick([20, 24, 30, 36, 40, 60, 72, 90, 120, 180]), g = T / gcd(T, 360), m = T / g;
      const k1 = R(1, m - 2), k2 = R(1, m - 1 - k1), k3 = m - k1 - k2, e = [k1 * g, k2 * g, k3 * g];
      const cats = pick([['Football', 'Basket', 'Natation'], ['Rap', 'Pop', 'Rock'], ['Bus', 'Vélo', 'À pied'], ['Chat', 'Chien', 'Aucun animal']]), i = R(0, 2), ang = 360 * e[i] / T;
      if (L === 2) return { html: `Voici les réponses de ${T} élèves à un sondage :${htable('Réponse', cats, 'Effectif', e)}On représente cette série par un diagramme circulaire. Quelle est la mesure de l’angle du secteur « ${cats[i]} » ?`, v: ang, suffix: '°', ans: a(ang),
        corr: `Les ${T} élèves correspondent à 360°. Angle = ${e[i]} ÷ ${T} × 360 = ${n(ang)}°.`,
        errs: errsF(ang, [{ v: e[i] / T * 100, m: 'Tu as calculé un pourcentage. Le disque entier fait 360°, pas 100.' }, { v: 360 / e[i], m: 'L’angle est proportionnel à l’effectif : effectif ÷ total × 360.' }]),
        hints: H('Le disque entier (360°) représente tous les élèves.', 'Angle = effectif ÷ effectif total × 360.', '') };
      return { html: `Un diagramme circulaire représente les réponses de ${T} élèves. Le secteur « ${cats[i]} » a un angle de ${n(ang)}°. Combien d’élèves ont répondu « ${cats[i]} » ?`, v: e[i], ans: String(e[i]),
        corr: `360° correspondent à ${T} élèves. ${n(ang)} ÷ 360 × ${T} = ${e[i]} élèves.`,
        errs: errsF(e[i], [{ v: ang / 100 * T, m: 'Le disque entier fait 360°, pas 100.' }]),
        hints: H('Le disque entier représente les ' + T + ' élèves.', 'Effectif = angle ÷ 360 × total.', '') };
    } },
    { id: 'st-bar', lv: [1, 2], auto: true, f(L) {
      const labs = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'];
      if (L === 1) { const vals = labs.map(() => R(1, 12)), tot = vals.reduce((s, x) => s + x, 0);
        return { html: `Le diagramme indique le nombre de livres empruntés au CDI chaque jour d’une semaine. Combien de livres ont été empruntés en tout ?${barFig(labs, vals)}`, v: tot, ans: String(tot),
          corr: `${vals.join(' + ')} = ${tot} livres.`, errs: errsF(tot, [{ v: Math.max(...vals), m: 'On demande le total de la semaine : additionne les cinq barres.' }]),
          hints: H('Lis la hauteur de chaque barre.', 'Additionne les cinq effectifs.', '') }; }
      const T = pick([20, 25, 40, 50]); let vals, tries = 0;
      const q5 = T / 5, lo = Math.max(1, q5 - 4), hi = q5 + 4, okv = x => x >= 1 && x <= hi + 2;
      do { const v4 = [R(lo, hi), R(lo, hi), R(lo, hi), R(lo, hi)]; vals = [...v4, T - v4.reduce((s, x) => s + x, 0)]; tries++; } while (!okv(vals[4]) && tries < 300);
      if (!okv(vals[4])) { vals = T === 20 ? [3, 5, 4, 2, 6] : T === 25 ? [4, 6, 5, 3, 7] : T === 40 ? [8, 9, 7, 6, 10] : [10, 11, 9, 8, 12]; }
      const i = R(0, 4), v = vals[i] / T * 100;
      return { html: `Le diagramme indique le nombre de livres empruntés au CDI chaque jour d’une semaine (${T} livres en tout). Quel pourcentage des livres a été emprunté le ${['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'][i]} ?${barFig(labs, vals)}`, v, suffix: '%', ans: a(v),
        corr: `${vals[i]} ÷ ${T} = ${n(vals[i] / T)}, soit ${n(v)} %.`, errs: errsF(v, [{ v: vals[i], m: 'C’est l’effectif. La fréquence en % = effectif ÷ total × 100.' }]),
        hints: H('Lis la hauteur de la barre.', 'Pourcentage = effectif ÷ total × 100.', '') };
    } }
  ]);

  /* ---------- Probabilités ---------- */
  add('proba', [
    { id: 'pb-mot', lv: [1, 2], auto: true, f(L) {
      const w = pick(['MATHEMATIQUES', 'BREVET', 'COLLEGE', 'PROBABILITE', 'GEOMETRIE', 'TRIANGLE', 'PYTHAGORE', 'FONCTION', 'EQUATION']), len = w.length;
      let k, what;
      if (L === 1) { const letters = [...new Set(w)]; const c = pick(letters); k = [...w].filter(x => x === c).length; what = `la lettre ${c}`; }
      else { k = [...w].filter(x => 'AEIOUY'.includes(x)).length; what = 'une voyelle (A, E, I, O, U, Y)'; }
      const v = k / len;
      return { html: `On écrit chaque lettre du mot <b>${w}</b> sur un carton, puis on tire un carton au hasard. Quelle est la probabilité de tirer ${what} ?`, v, ans: `${k}/${len}`,
        corr: `Le mot compte ${len} lettres, dont ${k} favorable${k > 1 ? 's' : ''}. P = ${F(k, len)}${gcd(k, len) > 1 ? ' = ' + FR(k, len) : ''}.`,
        errs: errsF(v, [{ v: 1 / len, m: 'Compte combien de fois l’issue apparaît dans le mot.' }, { v: k / new Set(w).size, m: 'Chaque carton compte, même si une lettre est répétée : le total est ' + len + '.' }]),
        hints: H('Combien y a-t-il de cartons en tout ?', 'P = nombre de cartons favorables ÷ nombre total de cartons.', '') };
    } },
    { id: 'pb-inv', lv: [3, 4], auto: true, f(L) {
      if (L === 3) { const r = R(2, 9), T = r * pick([2, 3, 4, 5]) + (R(0, 1) ? 0 : r), bl = T - r;
        return { html: `Une urne contient ${r} boules rouges et des boules bleues, indiscernables au toucher. La probabilité de tirer une boule rouge est ${FR(r, T)}. Combien y a-t-il de boules bleues ?`, v: bl, ans: String(bl),
          corr: `${r} boules rouges représentent ${FR(r, T)} des boules : il y a ${r} ÷ ${FR(r, T)} = ${T} boules en tout, donc ${T} − ${r} = ${bl} bleues.`,
          errs: errsF(bl, [{ v: T, m: 'C’est le nombre total de boules. Enlève les rouges.' }]),
          hints: H('Trouve d’abord le nombre total de boules.', 'Total = nombre de rouges ÷ probabilité.', '') }; }
      const r = R(1, 6), b = r + R(2, 10), half = R(0, 1) === 1, x = half ? b - r : 2 * b - r;
      return { html: `Une urne contient ${r} boule${r > 1 ? 's' : ''} rouge${r > 1 ? 's' : ''} et ${b} boules bleues. Combien de boules rouges faut-il ajouter pour que la probabilité de tirer une boule rouge soit égale à ${half ? F(1, 2) : F(2, 3)} ?`, v: x, ans: String(x),
        corr: half ? `Il faut autant de rouges que de bleues : ${b} rouges, donc ajouter ${b} − ${r} = ${x} boules.` : `Il faut deux fois plus de rouges que de bleues : ${2 * b} rouges, donc ajouter ${2 * b} − ${r} = ${x} boules.`,
        errs: errsF(x, [{ v: half ? b : 2 * b, m: 'C’est le nombre de rouges nécessaire. Il y en a déjà ' + r + '.' }]), hints: [] };
    } }
  ]);

  /* ---------- Arithmétique ---------- */
  add('arith', [
    { id: 'ar-crit', lv: [1], auto: true, f() {
      const d = pick([2, 3, 4, 5, 9, 10]), good = R(0, 1) === 1; let N;
      do { N = R(100, 9999); if (good) N -= N % d; } while (N < 100 || (N % d === 0) !== good);
      const s = [...String(N)].reduce((t, c) => t + +c, 0);
      const why = { 2: `son chiffre des unités est ${N % 10}`, 5: `son chiffre des unités est ${N % 10}`, 10: `son chiffre des unités est ${N % 10}`, 3: `la somme de ses chiffres vaut ${s}`, 9: `la somme de ses chiffres vaut ${s}`, 4: `le nombre formé par ses deux derniers chiffres est ${N % 100}` }[d];
      const rule = { 2: 'unités 0, 2, 4, 6 ou 8', 5: 'unités 0 ou 5', 10: 'unités 0', 3: 'somme des chiffres divisible par 3', 9: 'somme des chiffres divisible par 9', 4: 'deux derniers chiffres divisibles par 4' }[d];
      return qcm(`Le nombre ${n(N)} est-il divisible par ${d} ?`, good ? 'Oui' : 'Non', YN, `${good ? 'Oui' : 'Non'} : ${why} (critère : ${rule}).`,
        H(`Quel est le critère de divisibilité par ${d} ?`, `Divisible par ${d} : ${rule}.`, ''), YN);
    } }
  ]);

  /* ---------- Fractions ---------- */
  add('frac', [
    { id: 'fr-cmp', lv: [1, 2], auto: true, f(L) {
      let n1, d1, n2, d2;
      if (L === 1) { if (R(0, 1)) { d1 = d2 = R(3, 15); n1 = R(1, 20); do { n2 = R(1, 20); } while (n2 === n1); } else { n1 = n2 = R(1, 9); d1 = R(2, 15); do { d2 = R(2, 15); } while (d2 === d1); } }
      else { d1 = R(2, 8); d2 = d1 * R(2, 4); n1 = R(1, 2 * d1); n2 = R(1, 2 * d2); if (R(0, 1)) [n1, d1, n2, d2] = [n2, d2, n1, d1]; }
      const c = n1 * d2 - n2 * d1, s = c < 0 ? '<' : c > 0 ? '>' : '=';
      const corr = d1 === d2 ? `Même dénominateur : on compare les numérateurs, ${n1} ${s} ${n2}.` : n1 === n2 ? `Même numérateur : la fraction qui a le plus petit dénominateur est la plus grande (on partage en moins de parts).` : `On met au même dénominateur : ${d1 < d2 ? `${F(n1, d1)} = ${F(n1 * d2 / d1, d2)}, à comparer avec ${F(n2, d2)}` : `${F(n2, d2)} = ${F(n2 * d1 / d2, d1)}, à comparer avec ${F(n1, d1)}`}.`;
      return qcm(`Comparer les deux fractions : ${M_(`${F(n1, d1)} … ${F(n2, d2)}`)}<br>Quel symbole remplace les points ?`, s, ['<', '>', '='], `${corr} Donc ${F(n1, d1)} ${s} ${F(n2, d2)}.`,
        H('Les dénominateurs sont-ils égaux ?', 'Mets les fractions au même dénominateur, puis compare les numérateurs.', 'Exemple : 2/3 = 4/6, et 4/6 > 3/6.'), ['<', '>', '=']);
    } }
  ]);

  /* ---------- Programmes en blocs ---------- */
  add('algo', [
    { id: 'al-xy', lv: [2, 3], auto: true, f(L) {
      const x0 = R(-100, 100) * 1, y0 = R(-100, 100), k = R(3, 8), dx = 5 * nz(-6, 6), dy = L === 2 ? 5 * nz(-4, 4) : -5 * R(1, 6), extra = L === 3 ? 10 * R(1, 5) : 0;
      const sc = script(SB('ev', 'quand le drapeau est cliqué') + SB('mo', `aller à x : ${n(x0)} y : ${n(y0)}`) + SBloop(`répéter ${k} fois`, SB('mo', `ajouter ${n(dx)} à x`) + SB('mo', `ajouter ${n(dy)} à y`)) + (L === 3 ? SB('mo', `ajouter ${extra} à y`) : ''));
      const askX = L === 2, v = askX ? x0 + k * dx : y0 + k * dy + extra;
      return { html: `Voici un script :${sc}Quelle est ${askX ? 'l’abscisse x' : 'l’ordonnée y'} du lutin à la fin du programme ?`, v, ans: a(v),
        corr: askX ? `x part de ${n(x0)} et augmente de ${n(dx)} à chaque tour, ${k} fois : ${n(x0)} + ${k} × ${p(dx)} = ${n(v)}.` : `y part de ${n(y0)}, change de ${n(dy)} à chaque tour (${k} fois), puis augmente de ${extra} : ${n(y0)} + ${k} × ${p(dy)} + ${extra} = ${n(v)}.`,
        errs: errsF(v, [{ v: askX ? x0 + dx : y0 + dy + extra, m: 'La boucle est répétée ' + k + ' fois.' }, ...(L === 3 ? [{ v: y0 + k * dy, m: 'N’oublie pas le dernier bloc, après la boucle.' }] : [])]),
        hints: H('Combien de fois la boucle est-elle répétée ?', 'Valeur finale = valeur de départ + nombre de tours × ajout.', '') };
    } },
    { id: 'al-until', lv: [3, 4], auto: true, f(L) {
      const s0 = R(0, 10), c = R(3, 9), lim = R(30, 80); let S = s0, k = 0; while (!(S > lim)) { S += c; k++; }
      const sc = script(SB('ev', 'quand le drapeau est cliqué') + SB('va', `mettre S à ${s0}`) + SB('va', 'mettre n à 0') + SBloop(`répéter jusqu’à S > ${lim}`, SB('va', `ajouter ${c} à S`) + SB('va', 'ajouter 1 à n')) + SB('lo', L === 3 ? 'dire n' : 'dire S'));
      const v = L === 3 ? k : S;
      return { html: `Voici un script :${sc}Quel nombre le programme affiche-t-il ?`, v, ans: String(v),
        corr: `S prend les valeurs ${Array.from({ length: Math.min(k, 6) + 1 }, (_, i) => s0 + i * c).join(', ')}${k > 6 ? ', …' : ''}, ${S}. La boucle s’arrête dès que S > ${lim}, c’est-à-dire après ${k} tours : S = ${S} et n = ${k}. Le programme dit ${v}.`,
        errs: errsF(v, L === 3 ? [{ v: k - 1, m: 'La boucle continue tant que S n’est pas strictement plus grand que ' + lim + '.' }, { v: S, m: 'Le programme dit n, pas S.' }] : [{ v: S - c, m: 'La boucle continue tant que S n’est pas strictement plus grand que ' + lim + '.' }, { v: k, m: 'Le programme dit S, pas n.' }]),
        hints: H('Fais un tableau des valeurs de S et de n.', `On s’arrête dès que S dépasse ${lim}.`, '') };
    } }
  ]);
})(typeof window !== 'undefined' ? window : globalThis);
