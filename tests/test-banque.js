/* Tests automatiques : pour chaque générateur et chaque niveau, on tire
   de nombreuses versions et on vérifie que la réponse attendue est jugée
   juste, que la valeur est un nombre fini, et qu'aucune « erreur fréquente »
   ne coïncide avec la bonne réponse. */
require('../src/moteur.js'); require('../src/notions.js');
const { BANK, M } = globalThis;
let fails = 0, total = 0; const report = {};
for (const no of BANK.NOTIONS) for (const g of no.gens) for (const L of g.lv) {
  for (let s = 1; s <= 400; s++) {
    total++;
    let q; try { q = BANK.make({ n: no.id, g: g.id, L, s: s * 7919 }); } catch (e) { fails++; (report[g.id] ||= []).push(`L${L} s${s} EXCEPTION ${e.message}`); continue; }
    const pb = [];
    if (!q.html || /undefined|NaN|\?\?/.test(q.html + (q.corr || ''))) pb.push('texte: ' + (q.html + q.corr).match(/.{0,40}(undefined|NaN).{0,20}/)?.[0]);
    if (q.type === 'qcm') { if (!(q.correct >= 0 && q.correct < q.choices.length)) pb.push('qcm index'); if (new Set(q.choices).size !== q.choices.length) pb.push('qcm doublons ' + q.choices.join('|')); }
    else if (q.type === 'set') { if (!q.set.every(Number.isFinite)) pb.push('set non fini'); }
    else if (!q.f && !Number.isFinite(q.v)) pb.push('v non fini');
    const unit = q.unit || '';
    const g1 = M.grade(q, q.ans, unit);
    if (g1.s !== 'ok') pb.push(`réponse attendue "${q.ans}" jugée ${g1.s} (${g1.t} ${g1.m})`);
    for (const e of q.errs || []) {
      if (e.v !== undefined && !q.f && q.type !== 'set' && q.type !== 'qcm' && Number.isFinite(e.v) && Math.abs(e.v - q.v) < 1e-9) pb.push('erreur = bonne réponse');
      if (e.f && q.f && [-1.7, .3, 2.9].every(x => Math.abs(e.f(x) - q.f(x)) < 1e-9)) pb.push('erreur f = bonne réponse');
    }
    if (q.hints.length < 1 && q.lvl < 4) pb.push('pas d’indice');
    if (pb.length) { fails++; (report[g.id] ||= []).push(`L${L} s${s}: ${pb.join(' ; ')} | ${q.html.replace(/<[^>]+>/g, ' ').slice(0, 120)}`); }
  }
}
for (const [k, v] of Object.entries(report)) { console.log(`\n### ${k} : ${v.length} échecs`); console.log(v.slice(0, 4).join('\n')); }
console.log(`\n${total - fails}/${total} versions correctes, ${BANK.NOTIONS.length} notions, ${BANK.NOTIONS.reduce((s, x) => s + x.gens.length, 0)} générateurs`);
process.exit(fails ? 1 : 0);
