/* Tests des sujets de problèmes : la copie modèle obtient la note maximale,
   une copie vide obtient 0, et une erreur de calcul à la question 1 est
   reportée sans faire perdre les points des questions suivantes. */
require('../src/moteur.js'); require('../src/notions.js'); require('../src/banque-plus.js'); require('../src/problemes.js');
const { PB } = globalThis; let fails = 0, total = 0; const rep = {};
const bad = (id, m) => { fails++; (rep[id] ||= []).push(m); };
for (const id of Object.keys(PB.GENS)) for (let s = 1; s <= 500; s++) {
  total++; const ex = PB.makeEx({ g: id, s: s * 104729 });
  const txt = JSON.stringify(ex, (k, v) => typeof v === 'function' ? undefined : v);
  if (/NaN|undefined|Infinity/.test(txt)) bad(id, `s${s} texte invalide ${txt.match(/.{0,60}(NaN|undefined|Infinity).{0,20}/)[0]}`);
  const ans = PB.modelAnswers(ex), g = PB.gradeEx(ex, ans);
  if (Math.abs(g.score - ex.pts) > 1e-9) bad(id, `s${s} copie modèle ${g.score}/${ex.pts} ${JSON.stringify(g.parts || g.steps).slice(0, 300)}`);
  const g0 = PB.gradeEx(ex, {}); if (g0.score !== 0) bad(id, `s${s} copie vide ${g0.score}`);
  if (ex.type !== 'open') {
    // Erreur de calcul volontaire à la question 1 : réponse + 1
    const p1 = ex.parts[0]; if (p1.res.type === 'qcm' || p1.res.f) continue;
    const wrong = JSON.parse(JSON.stringify(ans)); const v = globalThis.M.val(String(ans.p1.res).replace(',', '.')) + 1; wrong.p1.res = String(v).replace('.', ',');
    const gw = PB.gradeEx(ex, wrong); const lost = ex.pts - gw.score;
    if (lost > p1.pts.res + 1e-9) bad(id, `s${s} erreur reportée : ${lost} points perdus pour une seule erreur (${JSON.stringify(gw.parts.slice(1).map(x => x.it))})`.slice(0, 400));
  } else {
    const part = { steps: ans.steps.slice(0, 2), final: '' }; const gp = PB.gradeEx(ex, part);
    if (!(gp.score > 0 && gp.score < ex.pts)) bad(id, `s${s} démarche partielle ${gp.score}`);
  }
}
for (const [k, v] of Object.entries(rep)) console.log(`### ${k} : ${v.length}\n` + v.slice(0, 3).join('\n'));
console.log(`${total - fails}/${total} sujets d’exercices corrects (${Object.keys(PB.GENS).length} modèles)`); process.exit(fails ? 1 : 0);
