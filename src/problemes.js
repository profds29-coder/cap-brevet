/* =====================================================================
   Cap Brevet – examen blanc de raisonnement et résolution de problèmes
   (partie 2 du DNB : 1 h 40, 14 points, calculatrice autorisée).
   Un sujet = 6 exercices indépendants tirés parmi des variantes
   paramétrées. Chaque question se rédige par blocs vérifiables :
   propriété choisie, calcul posé, résultat avec unité. La correction est
   déterministe et applique l'erreur reportée. La tâche ouverte se
   construit étape par étape ; les étapes pertinentes rapportent des points.
   ===================================================================== */
(function (G) {
  'use strict';
  const { R, pick, shuffle, roundTo, close } = G.M;
  const B = G.BANK, { n, F, a, p } = B;
  const M_ = s => `<span class="math">${s}</span>`;

  const PROP_GEO = ['Théorème de Pythagore', 'Réciproque du théorème de Pythagore', 'Théorème de Thalès', 'Réciproque du théorème de Thalès', 'Cosinus d’un angle aigu', 'Sinus d’un angle aigu', 'Tangente d’un angle aigu'];
  const YN = ['Oui', 'Non'];

  /* ---------------- Géométrie ---------------- */
  function geoPythTrigo() {
    let x, y; do { x = R(3, 12); y = R(3, 14); } while (x === y);
    const T = pick(['ABC', 'EFG', 'RST', 'MNP', 'IJK']), [A, Bv, C] = T.split('');
    const fig = B.fig.rightTri(A, Bv, C, { PQ: x + ' cm', QS: y + ' cm', PS: '?' }, 'S');
    const ac = Math.sqrt(x * x + y * y), ang = Math.atan(x / y) * 180 / Math.PI;
    return { id: 'geo-pt', title: 'Géométrie : Pythagore et trigonométrie', pts: 3.5, dom: 'eg',
      intro: `Le triangle ${T} est rectangle en ${Bv}. On donne ${A}${Bv} = ${x} cm et ${Bv}${C} = ${y} cm.${fig}`,
      parts: [
        { id: 'p1', q: `1. Calculer la longueur ${A}${C}, arrondie au dixième de centimètre.`, pts: { prop: .5, pose: .5, res: 1 },
          prop: { choices: PROP_GEO, ok: [0] }, pose: { lead: `${A}${C}² = ${A}${Bv}² + ${Bv}${C}² =`, exp: () => x * x + y * y, ans: `${x}^2+${y}^2` },
          res: { lead: `${A}${C} ≈`, exp: () => ac, round: 1, unit: 'cm', units: ['cm', 'cm²', 'm'], ans: a(roundTo(ac, 1)) },
          corr: `Dans le triangle ${T} rectangle en ${Bv}, d’après le théorème de Pythagore : ${A}${C}² = ${x}² + ${y}² = ${x * x + y * y}. Donc ${A}${C} = √${x * x + y * y} ≈ ${n(roundTo(ac, 1))} cm.` },
        { id: 'p2', q: `2. Calculer la mesure de l’angle ${A}${C}${Bv}̂, arrondie au degré.`, pts: { prop: .5, res: 1 },
          prop: { choices: PROP_GEO, ok: [4, 5, 6] },
          res: { lead: `${A}${C}${Bv}̂ ≈`, exp: () => ang, round: 0, suffix: '°', ans: a(roundTo(ang, 0)) },
          corr: `tan(${A}${C}${Bv}̂) = ${A}${Bv} ÷ ${Bv}${C} = ${x}/${y}, donc ${A}${C}${Bv}̂ ≈ ${roundTo(ang, 0)}°. (On pouvait aussi utiliser le cosinus ou le sinus avec ${A}${C}.)` }
      ] };
  }
  function geoThales() {
    const [tx, ty, tz] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [12, 16, 20]]), sc = pick([1, 1, 2]);
    const AB = tx * sc, BC = ty * sc, good = R(0, 1) === 1, ACs = good ? tz * sc : tz * sc + pick([1, -1]);
    const [rn, rd] = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5]]), AM = roundTo(AB * rn / rd, 6), MN = roundTo(BC * rn / rd, 6);
    return { id: 'geo-th', title: 'Géométrie : Thalès et triangle rectangle', pts: 3.5, dom: 'eg',
      intro: `Sur la figure, M est un point du segment [AB] et N un point du segment [AC]. Les droites (MN) et (BC) sont parallèles.<br>On donne AM = ${n(AM)} cm, AB = ${n(AB)} cm, BC = ${n(BC)} cm et AC = ${n(ACs)} cm.${B.fig.thalesFig(['A', 'B', 'C', 'M', 'N'])}`,
      parts: [
        { id: 'p1', q: '1. Calculer la longueur MN.', pts: { prop: .5, pose: .5, res: 1 },
          prop: { choices: PROP_GEO, ok: [2] }, pose: { lead: 'MN =', exp: () => BC * AM / AB, ans: `${a(BC)}*${a(AM)}/${a(AB)}` },
          res: { lead: 'MN =', exp: () => MN, unit: 'cm', units: ['cm', 'cm²', 'm'], ans: a(MN) },
          corr: `Les droites (BM) et (CN) sont sécantes en A et (MN) // (BC). D’après le théorème de Thalès : AM/AB = AN/AC = MN/BC, donc MN = ${n(BC)} × ${n(AM)} ÷ ${n(AB)} = ${n(MN)} cm.` },
        { id: 'p2', q: '2. Le triangle ABC est-il rectangle en B ? Justifier.', pts: { prop: .5, pose: .5, res: .5 },
          prop: { choices: PROP_GEO, ok: [1] }, pose: { lead: 'AB² + BC² =', exp: () => AB * AB + BC * BC, ans: `${a(AB)}^2+${a(BC)}^2` },
          res: { lead: 'Conclusion :', type: 'qcm', choices: ['Oui, ABC est rectangle en B', 'Non, ABC n’est pas rectangle en B'], correct: () => (good ? 0 : 1), ans: good ? '0' : '1' },
          corr: `[AC] est le plus grand côté. AC² = ${n(roundTo(ACs * ACs, 4))} et AB² + BC² = ${n(AB * AB)} + ${n(BC * BC)} = ${n(roundTo(AB * AB + BC * BC, 4))}. ${good ? 'Les deux résultats sont égaux : d’après la réciproque du théorème de Pythagore, ABC est rectangle en B.' : 'Les résultats sont différents : d’après la contraposée du théorème de Pythagore, ABC n’est pas rectangle.'}` }
      ] };
  }

  /* ---------------- Pourcentages ---------------- */
  function pctSoldes() {
    const P = R(4, 30) * 10, t1 = pick([20, 30, 40, 50]), t2 = pick([10, 20, 25]), it = pick(['un manteau', 'une trottinette', 'un casque audio', 'une paire de baskets']);
    const p1 = P * (1 - t1 / 100), p2 = p1 * (1 - t2 / 100), g = (1 - p2 / P) * 100;
    return { id: 'pct-s', title: 'Soldes et pourcentages', pts: 2.5, dom: 'nc',
      intro: `Pendant les soldes, ${it} affiché à <b>${P} €</b> bénéficie d’une première réduction de <b>${t1} %</b>. Le dernier jour, le magasin applique une réduction supplémentaire de <b>${t2} %</b> sur le prix déjà soldé.`,
      parts: [
        { id: 'p1', q: '1. Quel est le prix après la première réduction ?', pts: { pose: .25, res: .75 }, pose: { lead: 'Calcul :', exp: () => p1, ans: `${P}*${a(1 - t1 / 100)}` },
          res: { lead: 'Prix :', exp: () => p1, suffix: '€', ans: a(p1) }, corr: `${P} × (1 − ${t1}/100) = ${P} × ${n(1 - t1 / 100)} = ${n(p1)} €.` },
        { id: 'p2', q: '2. Quel est le prix payé le dernier jour ?', pts: { res: .75 }, res: { lead: 'Prix :', exp: V => V.p1 * (1 - t2 / 100), suffix: '€', ans: a(p2) },
          corr: `${n(p1)} × ${n(1 - t2 / 100)} = ${n(p2)} €.` },
        { id: 'p3', q: `3. Un client affirme : « Au total, la réduction est de ${t1 + t2} % ». A-t-il raison ? Calculer le pourcentage réel de réduction par rapport au prix affiché.`, pts: { res: .75 },
          res: { lead: 'Réduction réelle :', exp: V => (1 - V.p2 / P) * 100, suffix: '%', ans: a(roundTo(g, 6)) },
          corr: `Le client se trompe. Coefficient global : ${n(1 - t1 / 100)} × ${n(1 - t2 / 100)} = ${n(roundTo(p2 / P, 6))}, soit une réduction de ${n(roundTo(g, 4))} %, et non ${t1 + t2} %.` }
      ] };
  }
  function pctAbo() {
    let w, u, c; do { w = pick([8, 9, 10, 11, 12]); u = w - pick([3, 4, 5]); c = R(4, 12) * 5; } while (c % (w - u) === 0);
    const k = R(3, 8), s = Math.floor(c / (w - u)) + 1, lieu = pick(['Un cinéma', 'Une piscine', 'Une patinoire', 'Un bowling']);
    return { id: 'pct-a', title: 'Choisir le bon tarif', pts: 2.5, dom: 'nc',
      intro: `${lieu} propose deux tarifs.<br>Tarif plein : <b>${w} €</b> par entrée.<br>Tarif carte : une carte annuelle à <b>${c} €</b>, puis <b>${u} €</b> par entrée.`,
      parts: [
        { id: 'p1', q: `1. Combien paie-t-on pour ${k} entrées avec le tarif carte ?`, pts: { pose: .25, res: .5 }, pose: { lead: 'Calcul :', exp: () => c + u * k, ans: `${c}+${u}*${k}` }, res: { lead: 'Prix :', exp: () => c + u * k, suffix: '€', ans: String(c + u * k) }, corr: `${c} + ${u} × ${k} = ${c + u * k} €.` },
        { id: 'p2', q: `2. Combien paie-t-on pour ${k} entrées avec le tarif plein ?`, pts: { res: .5 }, res: { lead: 'Prix :', exp: () => w * k, suffix: '€', ans: String(w * k) }, corr: `${w} × ${k} = ${w * k} €.` },
        { id: 'p3', q: '3. À partir de combien d’entrées le tarif carte devient-il strictement moins cher que le tarif plein ?', pts: { res: 1.25 }, res: { lead: 'À partir de', exp: () => s, suffix: 'entrées', ans: String(s) },
          corr: `On cherche x tel que ${c} + ${u}x < ${w}x, soit ${c} < ${w - u}x, donc x > ${n(roundTo(c / (w - u), 2))}. Le tarif carte est moins cher à partir de ${s} entrées.` }
      ] };
  }

  /* ---------------- Statistiques ---------------- */
  function statSerie() {
    const cnt = pick([9, 10, 11]), ctx = pick([['températures maximales relevées pendant ' + cnt + ' jours, en °C', 2, 24], ['temps, en minutes, mis par ' + cnt + ' élèves pour venir au collège', 5, 45], ['tailles, en cm, de ' + cnt + ' joueurs d’une équipe', 158, 192]]);
    const vals = Array.from({ length: cnt }, () => R(ctx[1], ctx[2])), s = vals.slice().sort((x, y) => x - y);
    const mean = vals.reduce((t, x) => t + x, 0) / cnt, med = cnt % 2 ? s[(cnt - 1) / 2] : (s[cnt / 2 - 1] + s[cnt / 2]) / 2, et = s[cnt - 1] - s[0];
    return { id: 'stat-s', title: 'Statistiques', pts: 2, dom: 'df',
      intro: `Voici les ${ctx[0]} :<br>${M_(vals.join(' ; '))}`,
      parts: [
        { id: 'p1', q: '1. Calculer la moyenne de cette série, arrondie au dixième.', pts: { res: .75 }, res: { lead: 'Moyenne ≈', exp: () => mean, round: 1, ans: a(roundTo(mean, 1)) }, corr: `Somme : ${vals.reduce((t, x) => t + x, 0)}. Moyenne : ${vals.reduce((t, x) => t + x, 0)} ÷ ${cnt} ≈ ${n(roundTo(mean, 1))}.` },
        { id: 'p2', q: '2. Déterminer la médiane de cette série.', pts: { res: .75 }, res: { lead: 'Médiane =', exp: () => med, ans: a(med) }, corr: `Série rangée : ${s.join(' ; ')}. ${cnt % 2 ? `La médiane est la ${(cnt + 1) / 2}e valeur : ${med}.` : `La médiane est la moyenne des ${cnt / 2}e et ${cnt / 2 + 1}e valeurs : ${n(med)}.`}` },
        { id: 'p3', q: '3. Calculer l’étendue de cette série.', pts: { res: .5 }, res: { lead: 'Étendue =', exp: () => et, ans: String(et) }, corr: `${s[cnt - 1]} − ${s[0]} = ${et}.` }
      ] };
  }
  function statTable() {
    const xs = [0, 1, 2, 3, 4], ef = xs.map(() => R(1, 9)), N = ef.reduce((t, x) => t + x, 0), S = xs.reduce((t, x, i) => t + x * ef[i], 0), k = pick([2, 3]);
    const atl = ef.slice(k).reduce((t, x) => t + x, 0);
    return { id: 'stat-t', title: 'Statistiques : enquête', pts: 2, dom: 'df',
      intro: `On a demandé aux élèves d’une classe combien de frères et sœurs ils ont. Voici les résultats :${B.htable('Nombre de frères et sœurs', xs, 'Effectif', ef)}`,
      parts: [
        { id: 'p1', q: '1. Combien d’élèves ont répondu ?', pts: { res: .5 }, res: { lead: 'Effectif total :', exp: () => N, suffix: 'élèves', ans: String(N) }, corr: `${ef.join(' + ')} = ${N} élèves.` },
        { id: 'p2', q: '2. Calculer le nombre moyen de frères et sœurs, arrondi au dixième.', pts: { res: .75 }, res: { lead: 'Moyenne ≈', exp: V => S / V.p1, round: 1, ans: a(roundTo(S / N, 1)) }, corr: `(${xs.map((x, i) => `${x} × ${ef[i]}`).join(' + ')}) ÷ ${N} = ${S} ÷ ${N} ≈ ${n(roundTo(S / N, 1))}.` },
        { id: 'p3', q: `3. Quel pourcentage des élèves ont au moins ${k} frères et sœurs ? Arrondir à l’unité.`, pts: { res: .75 }, res: { lead: 'Pourcentage ≈', exp: V => atl / V.p1 * 100, round: 0, suffix: '%', ans: a(roundTo(atl / N * 100, 0)) }, corr: `${ef.slice(k).join(' + ')} = ${atl} élèves sur ${N}, soit ${atl} ÷ ${N} × 100 ≈ ${roundTo(atl / N * 100, 0)} %.` }
      ] };
  }

  /* ---------------- Fonctions ---------------- */
  function foncTarifs() {
    let aa, b, c, sol; do { aa = R(6, 15); b = R(2, aa - 2); sol = R(4, 15); c = (aa - b) * sol; } while (c > 120);
    const k = R(2, sol - 1), m = sol + R(2, 6), cheaperB = m > sol;
    return { id: 'fonc-t', title: 'Fonctions : deux tarifs', pts: 3, dom: 'df',
      intro: `Un club de sport propose deux formules. On note x le nombre de séances.<br>Formule A : ${aa} € la séance. Son prix est donné par ${M_(`f(x) = ${aa}x`)}.<br>Formule B : un abonnement de ${c} € puis ${b} € la séance. Son prix est donné par ${M_(`g(x) = ${b}x + ${c}`)}.`,
      parts: [
        { id: 'p1', q: `1. Calculer f(${k}).`, pts: { res: .5 }, res: { lead: `f(${k}) =`, exp: () => aa * k, ans: String(aa * k) }, corr: `f(${k}) = ${aa} × ${k} = ${aa * k}.` },
        { id: 'p2', q: `2. Calculer g(${k}).`, pts: { res: .5 }, res: { lead: `g(${k}) =`, exp: () => b * k + c, ans: String(b * k + c) }, corr: `g(${k}) = ${b} × ${k} + ${c} = ${b * k + c}.` },
        { id: 'p3', q: '3. Résoudre l’équation f(x) = g(x). Que représente la solution ?', pts: { pose: .25, res: .75 }, pose: { lead: 'Équation réduite : x =', exp: () => sol, ans: `${c}/${aa - b}` },
          res: { lead: 'x =', exp: () => sol, ans: String(sol) }, corr: `${aa}x = ${b}x + ${c} ⇔ ${aa - b}x = ${c} ⇔ x = ${sol}. Pour ${sol} séances, les deux formules coûtent le même prix.` },
        { id: 'p4', q: `4. Une personne prévoit ${m} séances. Quelle formule est la plus avantageuse ?`, pts: { res: 1 }, res: { lead: 'Réponse :', type: 'qcm', choices: ['Formule A', 'Formule B', 'Les deux coûtent le même prix'], correct: () => (cheaperB ? 1 : 0), ans: cheaperB ? '1' : '0' },
          corr: `f(${m}) = ${aa * m} € et g(${m}) = ${b * m + c} €. La formule ${cheaperB ? 'B' : 'A'} est la plus avantageuse.` }
      ] };
  }
  function foncProgramme() {
    let k, aa, mm, c, sol; do { k = R(2, 5); aa = R(1, 6); mm = R(1, 6); sol = R(-5, 9); c = (k - mm) * sol + k * aa; } while (k === mm || c === 0);
    const x0 = R(2, 6), progA = `<ol class="prog"><li>Choisir un nombre.</li><li>Lui ajouter ${aa}.</li><li>Multiplier le résultat par ${k}.</li></ol>`, progB = `<ol class="prog"><li>Choisir un nombre.</li><li>Le multiplier par ${mm}.</li><li>Ajouter ${n(c)} au résultat.</li></ol>`;
    return { id: 'fonc-p', title: 'Programmes de calcul', pts: 3, dom: 'nc',
      intro: `<div class="grid2"><div><b>Programme A</b>${progA}</div><div><b>Programme B</b>${progB}</div></div>`,
      parts: [
        { id: 'p1', q: `1. Quel résultat donne le programme A avec le nombre ${x0} ?`, pts: { res: .5 }, res: { lead: 'Résultat :', exp: () => (x0 + aa) * k, ans: String((x0 + aa) * k) }, corr: `(${x0} + ${aa}) × ${k} = ${(x0 + aa) * k}.` },
        { id: 'p2', q: `2. Quel résultat donne le programme B avec le nombre ${x0} ?`, pts: { res: .5 }, res: { lead: 'Résultat :', exp: () => mm * x0 + c, ans: a(mm * x0 + c) }, corr: `${x0} × ${mm} + ${p(c)} = ${n(mm * x0 + c)}.` },
        { id: 'p3', q: '3. On choisit le nombre x. Exprimer le résultat du programme A en fonction de x, sous forme développée.', pts: { res: 1 }, res: { lead: 'Résultat =', f: x => k * (x + aa), form: 'dev', ans: `${k}x+${k * aa}` }, corr: `(x + ${aa}) × ${k} = ${k}x + ${k * aa}.` },
        { id: 'p4', q: '4. Quel nombre faut-il choisir pour que les deux programmes donnent le même résultat ?', pts: { res: 1 }, res: { lead: 'Nombre :', exp: () => sol, ans: String(sol) }, corr: `${k}x + ${k * aa} = ${mm}x + ${n(c)} ⇔ ${k - mm}x = ${n(c - k * aa)} ⇔ x = ${n(sol)}.` }
      ] };
  }

  /* ---------------- Probabilités ---------------- */
  function probaUrne() {
    let r, b, v; do { r = R(2, 8); b = R(2, 8); v = R(1, 6); } while (b + v - r < 1);
    const T = r + b + v, add = b + v - r;
    return { id: 'proba-u', title: 'Probabilités', pts: 1.5, dom: 'df',
      intro: `Un sac contient ${r} jetons rouges, ${b} jetons bleus et ${v} jeton${v > 1 ? 's' : ''} vert${v > 1 ? 's' : ''}, indiscernables au toucher. On tire un jeton au hasard.`,
      parts: [
        { id: 'p1', q: '1. Quelle est la probabilité de tirer un jeton rouge ?', pts: { res: .5 }, res: { lead: 'P =', exp: () => r / T, ans: `${r}/${T}` }, corr: `${r} jetons rouges sur ${T} : P = ${F(r, T)}.` },
        { id: 'p2', q: '2. Quelle est la probabilité de ne pas tirer un jeton vert ?', pts: { res: .5 }, res: { lead: 'P =', exp: () => 1 - v / T, ans: `${T - v}/${T}` }, corr: `1 − ${F(v, T)} = ${F(T - v, T)}.` },
        { id: 'p3', q: '3. Combien de jetons rouges faut-il ajouter pour que la probabilité de tirer un rouge soit égale à 1/2 ?', pts: { res: .5 }, res: { lead: 'Il faut ajouter', exp: () => add, suffix: 'jetons', ans: String(add) }, corr: `Il faut autant de rouges que de non-rouges : ${b} + ${v} = ${b + v}. On ajoute ${b + v} − ${r} = ${add} jetons rouges.` }
      ] };
  }
  function probaRoue() {
    const N = pick([8, 10, 12]), m = pick([3, 4, 5]), nm = Math.floor(N / m), pr = Array.from({ length: N }, (_, i) => i + 1).filter(G.M.isPrime).length;
    return { id: 'proba-r', title: 'Probabilités : la roue', pts: 1.5, dom: 'df',
      intro: `Une roue de loterie est partagée en ${N} secteurs identiques, numérotés de 1 à ${N}. On fait tourner la roue et on lit le numéro obtenu.`,
      parts: [
        { id: 'p1', q: `1. Quelle est la probabilité d’obtenir un multiple de ${m} ?`, pts: { res: .5 }, res: { lead: 'P =', exp: () => nm / N, ans: `${nm}/${N}` }, corr: `Multiples de ${m} : ${Array.from({ length: nm }, (_, i) => m * (i + 1)).join(', ')}. P = ${F(nm, N)}.` },
        { id: 'p2', q: '2. Quelle est la probabilité d’obtenir un nombre premier ?', pts: { res: .5 }, res: { lead: 'P =', exp: () => pr / N, ans: `${pr}/${N}` }, corr: `Nombres premiers : ${Array.from({ length: N }, (_, i) => i + 1).filter(G.M.isPrime).join(', ')}. P = ${F(pr, N)}.` },
        { id: 'p3', q: '3. On fait tourner la roue deux fois. Quelle est la probabilité d’obtenir deux nombres pairs ?', pts: { res: .5 }, res: { lead: 'P =', exp: () => 0.25, ans: '1/4' }, corr: `P(pair) = ${F(N / 2, N)} = ${F(1, 2)} à chaque tour, donc ${F(1, 2)} × ${F(1, 2)} = ${F(1, 4)}.` }
      ] };
  }

  /* ---------------- Tâches ouvertes ---------------- */
  function openCarrelage() {
    const c = pick([20, 25, 30, 40, 50]), i = R(8, 16), j = R(6, 12), L = c * i / 100, l = c * j / 100, Nb = pick([10, 12, 15, 20, 25]), prix = R(15, 45);
    const tiles = i * j, boxes = Math.ceil(tiles / Nb);
    return { id: 'open-c', type: 'open', title: 'Tâche ouverte : le carrelage', pts: 1.5, dom: 'gm',
      intro: `Une pièce rectangulaire mesure <b>${n(L)} m</b> sur <b>${n(l)} m</b>. On veut la recouvrir de carreaux carrés de <b>${c} cm</b> de côté, sans découpe. Les carreaux sont vendus par boîtes de <b>${Nb}</b>, au prix de <b>${prix} €</b> la boîte.<br><b>Combien va coûter le carrelage ?</b> Toute trace de recherche, même incomplète, sera prise en compte.`,
      qty: [
        { key: 'aP', label: 'Aire de la pièce', unit: 'm²', units: ['m²', 'cm²'], exp: () => L * l },
        { key: 'aC', label: 'Aire d’un carreau', unit: 'cm²', units: ['cm²', 'm²'], exp: () => c * c },
        { key: 'nC', label: 'Nombre de carreaux', suffix: 'carreaux', exp: V => V.aP * 10000 / V.aC },
        { key: 'nB', label: 'Nombre de boîtes', suffix: 'boîtes', exp: V => Math.ceil(V.nC / Nb - 1e-9) },
        { key: 'cost', label: 'Prix total', suffix: '€', exp: V => V.nB * prix }
      ], final: 'cost',
      model: `Aire de la pièce : ${n(L)} × ${n(l)} = ${n(roundTo(L * l, 4))} m² = ${n(roundTo(L * l * 10000, 2))} cm². Aire d’un carreau : ${c} × ${c} = ${c * c} cm². Nombre de carreaux : ${n(roundTo(L * l * 10000, 2))} ÷ ${c * c} = ${tiles}. Boîtes : ${tiles} ÷ ${Nb} ${tiles % Nb ? `≈ ${n(roundTo(tiles / Nb, 2))}, il faut donc ${boxes} boîtes` : `= ${boxes} boîtes`}. Prix : ${boxes} × ${prix} = ${boxes * prix} €.` };
  }
  function openPeinture() {
    const Lg = R(30, 60) / 10, lg = R(25, 45) / 10, h = pick([2.4, 2.5, 2.6]), ouv = pick([2, 3, 3.5, 4]), rend = pick([8, 10, 12]), cap = pick([2.5, 3, 5]), couches = 2, prix = R(18, 40);
    const surf = 2 * (Lg + lg) * h - ouv, litres = surf * couches / rend, pots = Math.ceil(litres / cap - 1e-9);
    return { id: 'open-p', type: 'open', title: 'Tâche ouverte : repeindre une chambre', pts: 1.5, dom: 'gm',
      intro: `On veut repeindre les quatre murs d’une chambre rectangulaire de <b>${n(Lg)} m</b> sur <b>${n(lg)} m</b>, haute de <b>${n(h)} m</b>. La porte et la fenêtre occupent au total <b>${n(ouv)} m²</b>, qu’on ne peint pas. Il faut <b>deux couches</b>. Un litre de peinture couvre <b>${rend} m²</b> pour une couche. La peinture est vendue en pots de <b>${n(cap)} L</b> à <b>${prix} €</b>.<br><b>Combien va coûter la peinture ?</b> Toute trace de recherche, même incomplète, sera prise en compte.`,
      qty: [
        { key: 'sM', label: 'Surface des murs à peindre', unit: 'm²', units: ['m²', 'cm²'], exp: () => surf },
        { key: 'lit', label: 'Litres de peinture nécessaires', unit: 'L', units: ['L', 'mL'], exp: V => V.sM * couches / rend },
        { key: 'pots', label: 'Nombre de pots', suffix: 'pots', exp: V => Math.ceil(V.lit / cap - 1e-9) },
        { key: 'cost', label: 'Prix total', suffix: '€', exp: V => V.pots * prix }
      ], final: 'cost',
      model: `Surface des murs : 2 × (${n(Lg)} + ${n(lg)}) × ${n(h)} − ${n(ouv)} = ${n(roundTo(surf, 3))} m². Deux couches : ${n(roundTo(surf, 3))} × 2 ÷ ${rend} ≈ ${n(roundTo(litres, 2))} L. Pots : ${n(roundTo(litres, 2))} ÷ ${n(cap)} ≈ ${n(roundTo(litres / cap, 2))}, il faut ${pots} pots. Prix : ${pots} × ${prix} = ${pots * prix} €.` };
  }
  function openTrajet() {
    const d = R(12, 90) * 10, conso = pick([4.5, 5, 5.5, 6, 6.5, 7]), pl = pick([1.75, 1.8, 1.85, 1.9]), v = pick([80, 90, 100, 110]);
    const L = d * conso / 100, cost = L * pl;
    return { id: 'open-t', type: 'open', title: 'Tâche ouverte : le voyage', pts: 1.5, dom: 'gm',
      intro: `Une famille part en vacances à <b>${d} km</b>. Sa voiture consomme <b>${n(conso)} L</b> de carburant pour 100 km, et le carburant coûte <b>${n(pl)} €</b> le litre. Elle roule à <b>${v} km/h</b> de moyenne.<br><b>Combien coûtera le carburant pour l’aller ? Arrondir au centime.</b> Toute trace de recherche, même incomplète, sera prise en compte.`,
      qty: [
        { key: 'lit', label: 'Carburant consommé', unit: 'L', units: ['L', 'mL'], exp: () => L },
        { key: 'cost', label: 'Prix du carburant', suffix: '€', round: 2, exp: V => V.lit * pl },
        { key: 'tps', label: 'Durée du trajet (inutile ici)', unit: 'h', units: ['h', 'min'], exp: () => d / v, useless: true }
      ], final: 'cost',
      model: `Carburant : ${d} × ${n(conso)} ÷ 100 = ${n(roundTo(L, 3))} L. Prix : ${n(roundTo(L, 3))} × ${n(pl)} ≈ ${n(roundTo(cost, 2))} €. La vitesse ne sert pas pour cette question.` };
  }

  const SLOTS = [
    { name: 'Géométrie', gens: [geoPythTrigo, geoThales] },
    { name: 'Pourcentages', gens: [pctSoldes, pctAbo] },
    { name: 'Statistiques', gens: [statSerie, statTable] },
    { name: 'Fonctions', gens: [foncTarifs, foncProgramme] },
    { name: 'Probabilités', gens: [probaUrne, probaRoue] },
    { name: 'Tâche ouverte', gens: [openCarrelage, openPeinture, openTrajet] }
  ];
  const GENS = Object.fromEntries(SLOTS.flatMap(s => s.gens).map(g => { G.M.setSeed(1); return [g().id, g]; }));

  function makeEx(ref) {
    G.M.setSeed(ref.s); const ex = GENS[ref.g](); ex.ref = ref;
    // L'ordre des propriétés change à chaque sujet : la position ne trahit jamais la bonne réponse
    (ex.parts || []).forEach(pt => { if (!pt.prop) return; const order = shuffle(pt.prop.choices.map((_, i) => i)); pt.prop = { choices: order.map(i => pt.prop.choices[i]), ok: pt.prop.ok.map(o => order.indexOf(o)) }; });
    return ex;
  }
  function buildSubject(lastIds) {
    return SLOTS.map(sl => { let pool = sl.gens.map(g => { G.M.setSeed(1); return g().id; }); const fresh = pool.filter(id => !(lastIds || []).includes(id)); if (fresh.length) pool = fresh; return { g: pool[Math.floor(Math.random() * pool.length)], s: Math.floor(Math.random() * 2 ** 31) }; });
  }

  /* ---------------- Correction ---------------- */
  const onlyNum = nd => !['b', 'neg', 'sqrt', 'pow', 'par', 'pi', 'v'].includes(nd.t);
  function numOf(raw) { if (raw == null || String(raw).trim() === '') return NaN; const [r] = G.M.splitUnit(String(raw)); return G.M.val(r.replace(/^\s*[a-zA-Z]\s*=\s*/, '')); }
  const qFrom = (spec, v, pts) => ({ v, pts, round: spec.round, unit: spec.unit, units: spec.units, suffix: spec.suffix, form: spec.form, f: spec.f, errs: spec.errs });

  function gradeEx(ex, ans) {
    ans = ans || {};
    if (ex.type === 'open') return gradeOpen(ex, ans);
    const T = {}, Sv = {}, out = [];
    let score = 0;
    for (const pt of ex.parts) {
      const A = ans[pt.id] || {}, it = {};
      if (pt.prop) { const ok = A.prop !== undefined && A.prop !== '' && pt.prop.ok.includes(+A.prop); it.prop = ok ? { s: 'ok', p: pt.pts.prop, m: '' } : { s: 'ko', p: 0, m: A.prop === undefined || A.prop === '' ? 'Aucune propriété choisie.' : `Ce n’est pas la bonne propriété : ${pt.prop.choices[pt.prop.ok[0]]} convient ici.` }; }
      if (pt.pose) {
        let ast = null, v = NaN; try { ast = G.M.parse(String(A.pose || '')); v = G.M.ev(ast); } catch (e) { }
        const e1 = pt.pose.exp(T), e2 = pt.pose.exp({ ...T, ...Sv });
        if (!ast) it.pose = { s: 'ko', p: 0, m: 'Le calcul n’est pas posé.' };
        else if (onlyNum(ast) && !(Number.isInteger(e1) && false)) it.pose = { s: 'part', p: 0, m: 'Écris le calcul, pas seulement le résultat.' };
        else if (close(v, e1, 1e-6)) it.pose = { s: 'ok', p: pt.pts.pose, m: '' };
        else if (close(v, e2, 1e-6)) it.pose = { s: 'rep', p: pt.pts.pose, m: 'Juste avec ta valeur précédente.' };
        else it.pose = { s: 'ko', p: 0, m: 'Ce calcul ne correspond pas à la méthode attendue.' };
      }
      const rs = pt.res, P = pt.pts.res;
      if (rs.type === 'qcm') {
        const c = rs.correct(T), ok = A.res !== undefined && A.res !== '' && +A.res === c;
        it.res = ok ? { s: 'ok', p: P, m: '' } : { s: A.res === undefined || A.res === '' ? 'vide' : 'ko', p: 0, m: A.res === undefined || A.res === '' ? 'Pas de réponse.' : 'Conclusion fausse.' };
      } else {
        const tv = rs.f ? NaN : rs.exp(T);
        let g = G.M.grade(qFrom(rs, tv, P), A.res || '', A.unit || '');
        if (g.s !== 'ok' && !rs.f) {
          const sv = rs.exp({ ...T, ...Sv });
          if (Number.isFinite(sv) && !close(sv, tv, 1e-9)) { const g2 = G.M.grade(qFrom(rs, sv, P), A.res || '', A.unit || ''); if (g2.s === 'ok') g = { s: 'rep', pts: P, t: 'Erreur reportée', m: 'Juste avec ta valeur de la question précédente.' }; else if (g2.s === 'part' && g.s === 'ko') g = { ...g2, m: g2.m }; }
        }
        it.res = { s: g.s, p: g.pts, m: g.s === 'ok' ? '' : g.m || g.t };
        if (!rs.f) { T[pt.id] = tv; const nv = numOf(A.res); if (Number.isFinite(nv) && !(A.unit && rs.unit && A.unit !== rs.unit)) Sv[pt.id] = nv; }
      }
      const sc = Object.values(it).reduce((t, x) => t + x.p, 0); score += sc;
      out.push({ id: pt.id, it, score: sc, max: Object.values(pt.pts).reduce((t, x) => t + x, 0) });
    }
    return { parts: out, score: Math.round(score * 100) / 100, max: ex.pts };
  }
  function gradeOpen(ex, ans) {
    const T = {}; ex.qty.forEach(q => { T[q.key] = q.exp(T); });
    const steps = (ans.steps || []).filter(s => s && s.k), Sv = {}, res = [], okKeys = new Set();
    for (const st of steps) {
      const q = ex.qty.find(x => x.key === st.k); if (!q) continue;
      const tv = T[q.key], sv = q.exp({ ...T, ...Sv }), spec = { round: q.round, unit: q.unit, units: q.units, suffix: q.suffix };
      let g = G.M.grade(qFrom(spec, tv, 1), st.val || '', st.unit || ''), s = g.s;
      if (s !== 'ok' && Number.isFinite(sv) && !close(sv, tv, 1e-9)) { const g2 = G.M.grade(qFrom(spec, sv, 1), st.val || '', st.unit || ''); if (g2.s === 'ok') s = 'rep'; }
      const pertinent = !q.useless;
      if ((s === 'ok' || s === 'rep') && pertinent) okKeys.add(q.key);
      res.push({ k: q.key, s: q.useless && (s === 'ok' || s === 'rep') ? 'part' : s, m: q.useless ? 'Calcul juste, mais inutile pour répondre à la question.' : s === 'ok' ? 'Étape juste.' : s === 'rep' ? 'Juste avec tes valeurs précédentes.' : g.m || 'Valeur fausse.' });
      let nv = numOf(st.val); if (Number.isFinite(nv)) { if (q.unit && st.unit && st.unit !== q.unit && G.M.UNITS[st.unit] && G.M.UNITS[q.unit]) nv = nv * G.M.UNITS[st.unit][1] / G.M.UNITS[q.unit][1]; Sv[q.key] = nv; }
    }
    const fq = ex.qty.find(q => q.key === ex.final), ftv = T[fq.key], fsv = fq.exp({ ...T, ...Sv }), fspec = { round: fq.round, suffix: fq.suffix };
    let gf = G.M.grade(qFrom(fspec, ftv, 1), ans.final || '', ''), fs = gf.s;
    if (fs !== 'ok' && Number.isFinite(fsv) && !close(fsv, ftv, 1e-9) && G.M.grade(qFrom(fspec, fsv, 1), ans.final || '', '').s === 'ok') fs = 'rep';
    let score;
    if (fs === 'ok') score = ex.pts;
    else { const useful = okKeys.size, need = ex.qty.filter(q => !q.useless).length; score = Math.min(ex.pts - 0.5, useful * (ex.pts - 0.5) / Math.max(need - 1, 1)) + (fs === 'rep' ? 0.5 : 0); }
    score = Math.round(Math.max(0, score) * 4) / 4;
    return { open: true, steps: res, final: { s: fs, m: fs === 'ok' ? 'Réponse juste.' : fs === 'rep' ? 'Réponse cohérente avec tes calculs, mais une étape contient une erreur.' : fs === 'vide' ? 'Pas de réponse finale.' : 'Réponse finale fausse.' }, score, max: ex.pts };
  }

  /* Réponses modèles (pour les tests et la correction affichée) */
  function modelAnswers(ex) {
    if (ex.type === 'open') { const T = {}; ex.qty.forEach(q => { T[q.key] = q.exp(T); }); return { steps: ex.qty.filter(q => !q.useless).map(q => ({ k: q.key, pose: '', val: a(q.round != null ? roundTo(T[q.key], q.round) : roundTo(T[q.key], 6)), unit: q.unit || '' })), final: a(roundTo(T[ex.final], ex.qty.find(q => q.key === ex.final).round ?? 6)) }; }
    const o = {}; ex.parts.forEach(pt => { o[pt.id] = { prop: pt.prop ? String(pt.prop.ok[0]) : undefined, pose: pt.pose ? pt.pose.ans : undefined, res: pt.res.ans, unit: pt.res.unit || '' }; }); return o;
  }

  G.PB = { SLOTS, GENS, makeEx, buildSubject, gradeEx, modelAnswers, DURATION: 100 };
})(typeof window !== 'undefined' ? window : globalThis);
