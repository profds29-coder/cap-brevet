/* =====================================================================
   Cap Brevet – interface
   Écrans : profil, accueil, entraînement par niveaux, série d'exercices,
   révision du jour, rédaction par blocs, examen blanc d'automatismes,
   progrès, réglages et sauvegarde. Toutes les données restent sur
   l'appareil (stockage local du navigateur).
   ===================================================================== */
(function () {
  'use strict';
  const { M, BANK } = window; const { n, F } = BANK;
  const LVN = ['Non commencé', 'Novice', 'Débrouillé(e)', 'Averti(e)', 'Expert(e)'];
  const RULES = ['8 bonnes réponses sur les 10 dernières', '8 bonnes réponses sur les 10 dernières, avec au plus 2 indices en tout', '8 bonnes réponses sur les 10 dernières, sans indice', '8 bonnes réponses sur les 10 dernières, chronomètre lancé'];
  const MAXH = [3, 3, 2, 1, 0];
  const PRIORITY = ['frac', 'eq', 'prop', 'calc', 'litt', 'pyth', 'fonc', 'stat', 'proba', 'pui', 'aire', 'conv', 'thales', 'trigo', 'arith', 'angles', 'algo'];
  const BREVET = new Date('2027-06-24T08:00:00');
  const KEY = 'capbrevet.v1';
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = x => n(Math.round(x * 100) / 100);
  const today = () => new Date().toISOString().slice(0, 10);
  const dayDiff = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);

  /* ---------- Stockage ---------- */
  let DB = { v: 1, cur: null, profiles: {} };
  let storageOK = true;
  function load() { try { const raw = localStorage.getItem(KEY); if (raw) DB = JSON.parse(raw); } catch (e) { storageOK = false; } if (!DB.profiles) DB = { v: 1, cur: null, profiles: {} }; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(DB)); storageOK = true; markSaved(); } catch (e) { storageOK = false; } }
  const P = () => DB.profiles[DB.cur];
  function newProfile(pseudo) {
    const id = 'p' + Date.now().toString(36);
    DB.profiles[id] = { pseudo, created: Date.now(), xp: 0, streak: { n: 0, last: '' }, days: {}, notions: {}, exams: [], cur: null, settings: { tiers: false } };
    DB.cur = id; save();
  }
  function NS(id) { const p = P(); return (p.notions[id] ||= { L: 1, hist: [], val: false, seen: {}, last: 0, tot: 0, ok: 0, fragile: false, okRun: 0 }); }

  /* ---------- Progression ---------- */
  function touchDay() {
    const p = P(), d = today();
    if (p.streak.last !== d) { p.streak.n = p.streak.last && dayDiff(p.streak.last, d) === 1 ? p.streak.n + 1 : 1; p.streak.last = d; }
    p.days[d] = (p.days[d] || 0) + 1;
  }
  function levelOf(id) { const s = P().notions[id]; if (!s || !s.tot) return 0; return s.L; }
  function recent(id) { const s = P().notions[id]; return s ? s.hist.filter(h => h.ok).length : 0; }
  function isWeak(id) { const s = P().notions[id]; if (!s) return false; if (s.fragile) return true; const h = s.hist; return h.length >= 5 && h.filter(x => x.ok).length / h.length < 0.6; }
  /* Enregistre une réponse d'entraînement et applique les règles de passage de niveau */
  function record(q, res, hints, fresh) {
    const s = NS(q.notion), p = P(); touchDay();
    s.tot++; s.last = Date.now(); s.seen[q.sig] = Date.now();
    const ok = res.s === 'ok';
    if (ok) { s.ok++; s.okRun++; if (s.okRun >= 3) s.fragile = false; } else s.okRun = 0;
    p.xp += ok ? (hints ? 6 : 10) : res.s === 'part' ? 4 : 1;
    let up = false;
    if (q.lvl === s.L && fresh !== false) {
      s.hist.push({ ok, h: hints }); if (s.hist.length > 10) s.hist.shift();
      const h = s.hist, good = h.filter(x => x.ok).length;
      const pass = h.length >= 10 && (s.L === 1 ? good >= 8 : s.L === 2 ? good >= 8 && h.reduce((t, x) => t + x.h, 0) <= 2 : s.L === 3 ? h.filter(x => x.ok && !x.h).length >= 8 : good >= 8);
      if (pass) { if (s.L < 4) { s.L++; s.hist = []; up = 'level'; } else if (!s.val) { s.val = true; up = 'valid'; } }
    }
    // Nettoyage des versions vues il y a plus de 6 semaines
    const lim = Date.now() - 42 * 864e5; for (const k in s.seen) if (s.seen[k] < lim) delete s.seen[k];
    save(); return up;
  }

  /* ---------- État de l'écran ---------- */
  const S = { notion: 'frac', flash: false, series: null, red: null, showModel: false, del: false, imp: '', impMsg: '', expMsg: '', copy: null, pickL: null };

  function newSeries(mode, notion, L) {
    const p = P(); let list = [];
    if (mode === 'daily') {
      const worked = BANK.NOTIONS.filter(x => p.notions[x.id] && p.notions[x.id].tot).map(x => x.id);
      const score = id => { const s = p.notions[id]; const days = (Date.now() - s.last) / 864e5; return (isWeak(id) ? 5 : 0) + Math.min(days, 10) + (s.val ? 0 : 1) + Math.random(); };
      let ids = worked.sort((a, b) => score(b) - score(a)).slice(0, 4);
      for (const id of PRIORITY) { if (ids.length >= 4) break; if (!ids.includes(id)) ids.push(id); }
      const order = []; for (let i = 0; i < 6; i++) order.push(ids[i % ids.length]);
      list = order.map(id => BANK.draw(id, Math.min(Math.max(levelOf(id), 1), 3), NS(id).seen));
    } else {
      let prev = null;
      for (let i = 0; i < 5; i++) { const q = BANK.draw(notion, L, NS(notion).seen, prev); prev = q.gen; list.push(q); }
    }
    S.series = { mode, notion, L, list, i: 0, ans: '', unit: '', hints: 0, fb: null, show: false, res: [], start: Date.now(), qStart: Date.now(), xp0: p.xp, ups: [] };
  }

  /* ---------- Composants ---------- */
  const lvChip = (l, val) => `<span class="lv" data-l="${l}"><i aria-hidden="true">${[1, 2, 3, 4].map(k => `<b class="${k <= l ? 'on' : ''}"></b>`).join('')}</i>${LVN[l]}${val ? ' ✓' : ''}</span>`;
  const KEYS = [['7'], ['8'], ['9'], ['÷', 'op'], ['('], [')'], ['⌫', 'op', 'del'],
    ['4'], ['5'], ['6'], ['×', 'op'], ['/', 'op', 'frac'], ['²'], ['^', '', 'pow'],
    ['1'], ['2'], ['3'], ['−', 'op'], ['√'], ['π'], ['°'],
    ['0'], [','], ['+', 'op'], ['x'], ['y'], ['◀', '', 'left'], ['▶', '', 'right'],
    ['<'], ['='], ['>'], ['%'], ['ou', '', 'ou'], [';'], ['cm']];
  const LAB = { del: 'Effacer', frac: 'Fraction', pow: 'Puissance', left: 'Curseur à gauche', right: 'Curseur à droite', ou: 'ou' };
  const kbd = () => `<div class="kbd" role="group" aria-label="Clavier mathématique">${KEYS.map(([k, c, a]) => `<button type="button" class="${c || ''}" data-act="key" data-k="${a || k}" aria-label="${LAB[a] || k}">${a === 'frac' ? 'a/b' : a === 'pow' ? 'xⁿ' : k === '²' ? 'x²' : k}</button>`).join('')}</div>`;
  const fbBox = (g, extra = '') => { const mk = { ok: '✓', part: '≈', ko: '✗' }[g.s] || '•'; return `<div class="fb ${g.s}" role="status"><span class="mk" aria-hidden="true">${mk}</span><div class="body"><b>${g.t}</b>${g.m ? `<p>${g.m}</p>` : ''}${extra}</div></div>`; };
  const clock = ms => { ms = Math.max(0, ms); const s = Math.ceil(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60, pp = v => String(v).padStart(2, '0'); return h ? `${h}:${pp(m)}:${pp(x)}` : `${pp(m)}:${pp(x)}`; };
  const daysTo = () => Math.max(0, Math.ceil((BREVET - new Date()) / 864e5));

  function answerBox(q, val, unit, ro, bindKey) {
    if (q.type === 'qcm') return `<div class="choices" role="radiogroup" aria-label="Choix de réponse">${q.choices.map((c, i) => `<button type="button" class="choice" role="radio" aria-checked="${String(val) === String(i)}" data-act="choose" data-bind="${bindKey}" data-i="${i}" ${ro ? 'disabled' : ''}><span class="dot" aria-hidden="true"></span><span>${c}</span></button>`).join('')}</div>`;
    return `<div class="ansrow"><input id="ans-${bindKey}" class="mathin" data-bind="${bindKey}" autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(val)}" ${ro ? 'readonly' : ''} placeholder="${q.type === 'set' ? 'x = … ou x = …' : '…'}" aria-label="Ta réponse">
      ${q.units ? `<select id="unit-${bindKey}" data-bind="${bindKey}-u" aria-label="Unité" ${ro ? 'disabled' : ''}><option value="">Unité</option>${q.units.map(u => `<option ${unit === u ? 'selected' : ''}>${u}</option>`).join('')}</select>` : ''}
      ${q.suffix ? `<span class="suffix">${q.suffix}</span>` : ''}</div>${ro ? '' : kbd()}${q.kbdNote && !ro ? `<p class="small muted">${q.kbdNote}</p>` : ''}`;
  }

  /* ---------- Écran : profil ---------- */
  function scrWelcome() {
    const list = Object.entries(DB.profiles);
    return `<div class="wrap narrow"><section class="hero pop"><p class="eyebrow">Cap Brevet · mathématiques</p><h1>Révise le brevet à ton rythme</h1>
      <p>Des exercices qui changent à chaque fois, une correction immédiate et des examens blancs chronométrés comme le jour J.</p></section>
      ${list.length ? `<section class="card"><h3>Choisis ton profil</h3><ul class="list">${list.map(([id, p]) => `<li><button class="rowbtn" data-act="pickProfile" data-id="${id}"><span class="t"><b>${esc(p.pseudo)}</b><span class="small muted">${p.xp} points d'expérience</span></span></button></li>`).join('')}</ul></section>` : ''}
      <section class="card"><h3>${list.length ? 'Nouveau profil' : 'Crée ton profil'}</h3>
        <form id="pform" class="col"><label for="pseudo" class="eyebrow">Ton pseudo</label>
        <input id="pseudo" class="mathin" maxlength="20" autocomplete="off" placeholder="Par exemple : Comète" required>
        <p class="notice small">Choisis un pseudo qui ne permet pas de te reconnaître. N'écris ni ton prénom, ni ton nom.</p>
        <p class="small" id="pwarn" role="alert" style="color:var(--ko)"></p>
        <button class="btn primary" type="submit">Commencer</button></form>
        <p class="small muted">Tes réponses et tes progrès restent sur cet appareil. Rien n'est envoyé sur Internet. <a href="#confidentialite">Confidentialité</a></p></section>
      ${!storageOK ? `<p class="notice">Ce navigateur bloque l'enregistrement : tes progrès seront perdus en fermant la page. Évite la navigation privée.</p>` : ''}</div>`;
  }

  /* ---------- Écran : accueil ---------- */
  function scrHome() {
    const p = P(); const weekAgo = Date.now() - 7 * 864e5;
    const weekQ = Object.entries(p.days).filter(([d]) => new Date(d).getTime() > weekAgo).reduce((s, [, c]) => s + c, 0);
    const weekExam = p.exams.some(e => e.date > weekAgo);
    const weak = BANK.NOTIONS.filter(x => isWeak(x.id)).slice(0, 3);
    const started = BANK.NOTIONS.filter(x => p.notions[x.id] && p.notions[x.id].tot).sort((a, b) => p.notions[b.id].last - p.notions[a.id].last)[0];
    const nextNew = BANK.NOTIONS.find(x => PRIORITY.indexOf(x.id) === PRIORITY.findIndex(id => !(p.notions[id] && p.notions[id].tot)));
    return `<div class="wrap">
    <section class="hero pop"><p class="eyebrow">Bonjour ${esc(p.pseudo)}</p>
      <div class="row" style="align-items:flex-end;gap:14px"><span class="big num">J-${daysTo()}</span><h1 style="font-size:1.3rem;padding-bottom:4px">avant le brevet</h1></div>
      <p class="small" style="opacity:.85">Date indicative : fin juin 2027, à confirmer par le calendrier officiel.</p>
      <div class="stats"><div class="stat"><b class="num">${p.streak.last && dayDiff(p.streak.last, today()) <= 1 ? p.streak.n : 0} jour${p.streak.n > 1 ? 's' : ''}</b>de révision d'affilée</div><div class="stat"><b class="num">${n(p.xp)}</b>points d'expérience</div><div class="stat"><b class="num">${weekQ}</b>questions cette semaine</div></div></section>
    <section class="card daily"><p class="eyebrow">Révision du jour</p><h2>6 questions, environ 10 minutes</h2>
      <p class="muted">${Object.keys(p.notions).length ? 'Choisies parmi tes notions à consolider et celles que tu n’as pas revues depuis longtemps.' : 'Pour commencer : fractions, équations, pourcentages et nombres relatifs.'}</p>
      <a class="btn sun block" href="#serie" data-act="daily">Commencer la révision du jour</a></section>
    <div class="grid2">
      <section class="card"><h3>${weak.length ? 'Notions à renforcer' : 'Pour continuer'}</h3><ul class="list">
        ${(weak.length ? weak : [started, nextNew].filter(Boolean)).filter((x, i, a) => a.indexOf(x) === i).map(no => `<li><a class="rowbtn" href="#entrainer" data-act="notion" data-id="${no.id}"><span class="t"><b>${no.name}</b><span class="small muted">${p.notions[no.id] && p.notions[no.id].tot ? `${recent(no.id)} justes sur les ${p.notions[no.id].hist.length} dernières` : 'Pas encore commencé'}</span></span>${lvChip(levelOf(no.id), p.notions[no.id] && p.notions[no.id].val)}</a></li>`).join('') || '<li class="muted">Lance ta première révision !</li>'}
      </ul></section>
      <section class="card exam-card"><p class="eyebrow">Objectif de la semaine</p><h3>${weekExam ? '✓ Examen blanc fait cette semaine' : 'Faire un examen blanc d’automatismes'}</h3><p class="muted">15 questions en 20 minutes, sans calculatrice, sur 6 points.</p><a class="btn" href="#brevet">Voir les examens blancs</a></section>
    </div></div>`;
  }

  /* ---------- Écran : s'entraîner ---------- */
  function scrTrain() {
    const p = P(); const no = BANK.byId[S.notion] || BANK.NOTIONS[0]; const st = p.notions[no.id];
    const L = st ? st.L : 1, h = st ? st.hist : [], good = h.filter(x => x.ok).length;
    const pickL = Math.min(S.pickL || L, L);
    const detail = `<section class="card detail pop" id="detail" aria-live="polite">
      <p class="eyebrow">${BANK.DOMS[no.dom]} · ${no.cls}</p><h2>${no.name}</h2>
      <div class="ladder">${[1, 2, 3, 4].map(k => `<div class="step ${k < L || (k === 4 && st && st.val) ? 'done' : ''} ${k === L && !(st && st.val) ? 'cur' : ''}"><span class="ico">${k < L || (k === 4 && st && st.val) ? '✓' : k}</span><b>${LVN[k]}</b></div>`).join('')}</div>
      <div><div class="row small"><span>${st && st.val ? 'Notion validée. Continue à la réviser de temps en temps.' : `Niveau ${LVN[L]} : <b class="num">${good} bonne${good > 1 ? 's' : ''} réponse${good > 1 ? 's' : ''}</b> sur les ${h.length} dernières`}</span></div>
      <div class="bar" style="margin-top:6px" role="img" aria-label="${good} sur 10"><span style="width:${good * 10}%"></span></div>
      <p class="small muted" style="margin-top:6px">Pour passer au niveau suivant : ${RULES[L - 1]}. Seules les questions jamais vues comptent.</p></div>
      ${L > 1 ? `<div class="row small"><span class="muted">Niveau de la série :</span>${[1, 2, 3, 4].filter(k => k <= L).map(k => `<button class="chip ${k === pickL ? 'on' : ''}" data-act="pickL" data-l="${k}" aria-pressed="${k === pickL}">${LVN[k]}</button>`).join('')}</div>` : ''}
      <div class="row">
        <button class="btn" data-act="flash" aria-expanded="${S.flash}">Fiche de cours flash</button>
        <a class="btn primary" href="#serie" data-act="series" data-l="${pickL}">S'entraîner · 5 questions</a>
        ${no.red ? `<a class="btn" href="#redaction" data-act="redNew">Problème rédigé par blocs</a>` : ''}
      </div>
      ${S.flash ? `<div class="flash">${no.flash}</div>` : ''}
      <p class="small muted">${MAXH[pickL] ? `Au niveau ${LVN[pickL]} : ${MAXH[pickL]} indice${MAXH[pickL] > 1 ? 's' : ''} par question.` : 'Au niveau Expert(e) : pas d’indice, chronomètre lancé, comme à l’examen.'}${pickL >= 3 ? ' Calculatrice autorisée seulement quand la question l’indique.' : ''}</p>
    </section>`;
    const doms = Object.keys(BANK.DOMS);
    return `<div class="wrap"><div><p class="eyebrow">S'entraîner</p><h1>Choisis une notion</h1></div>
    <div class="train"><div class="col">${doms.map(d => `<section class="card"><h3>${BANK.DOMS[d]}</h3><ul class="list">${BANK.NOTIONS.filter(x => x.dom === d).map(it => `<li><button class="rowbtn" data-act="notion" data-id="${it.id}" aria-pressed="${it.id === no.id}"><span class="t"><b>${it.name}</b>${isWeak(it.id) ? '<span class="small" style="color:var(--ko)">À renforcer</span>' : ''}</span>${lvChip(levelOf(it.id), p.notions[it.id] && p.notions[it.id].val)}</button></li>`).join('')}</ul></section>`).join('')}</div>
    ${detail}</div></div>`;
  }

  /* ---------- Écran : série d'exercices ---------- */
  function scrSeries() {
    const se = S.series; if (!se) { location.hash = 'entrainer'; return ''; }
    const p = P();
    if (se.i >= se.list.length) {
      const ok = se.res.filter(r => r === 'ok').length, gain = p.xp - se.xp0;
      const no = se.mode === 'notion' ? BANK.byId[se.notion] : null, st = no && p.notions[no.id];
      return `<div class="wrap narrow"><section class="card pop"><p class="eyebrow">${se.mode === 'daily' ? 'Révision du jour terminée' : 'Série terminée'}</p><h1><span class="num">${ok}</span> juste${ok > 1 ? 's' : ''} sur ${se.list.length}</h1>
        <p>Tu gagnes <b class="num">${gain} points d'expérience</b>. Temps : ${clock(Date.now() - se.start)}.</p>
        ${se.ups.map(u => `<p class="notice"><b>${u.t === 'valid' ? 'Notion validée' : 'Niveau supérieur atteint'} !</b> ${BANK.byId[u.n].name} : ${u.t === 'valid' ? 'tu maîtrises la notion en conditions d’examen.' : 'tu passes au niveau ' + LVN[p.notions[u.n].L] + '.'}</p>`).join('')}
        ${st ? `<p class="muted">${no.name} : ${LVN[st.L]}, ${st.hist.filter(x => x.ok).length} bonnes réponses sur les ${st.hist.length} dernières.</p>` : ''}
        <div class="row"><a class="btn primary" href="#serie" data-act="${se.mode === 'daily' ? 'daily' : 'series'}" data-l="${se.L || ''}">Encore une série</a><a class="btn" href="${se.mode === 'daily' ? '#accueil' : '#entrainer'}">Terminer</a></div></section></div>`;
    }
    const q = se.list[se.i]; const maxH = MAXH[q.lvl]; const done = !!se.fb && (se.fb.s !== 'ko' || se.show || se.retried);
    const timed = q.lvl >= 3;
    return `<div class="wrap">
    <div class="row"><div><p class="eyebrow">${se.mode === 'daily' ? 'Révision du jour' : BANK.byId[q.notion].name} · question ${se.i + 1} sur ${se.list.length}</p><h1>${se.mode === 'daily' ? BANK.byId[q.notion].name : LVN[q.lvl]}</h1></div><span class="spacer"></span>
      ${timed ? `<span class="chrono num" id="chrono" role="timer" aria-label="Temps écoulé">${clock(Date.now() - se.qStart)}</span>` : ''}${lvChip(q.lvl)}</div>
    <div class="ex-grid">
      <section class="card"><p class="eyebrow">Énoncé ${q.calc ? '· calculatrice autorisée' : '· sans calculatrice'}</p><div class="enonce">${q.html}</div>
        ${se.hints ? `<ol class="hints">${q.hints.slice(0, se.hints).map((h, k) => `<li><b>Indice ${k + 1}.</b> ${h}</li>`).join('')}</ol>` : ''}
        <details class="draft"><summary>Brouillon (jamais corrigé)</summary><textarea id="draft" aria-label="Brouillon" placeholder="Tes calculs au brouillon…"></textarea></details></section>
      <section class="card"><p class="eyebrow">Ta réponse</p>
        ${answerBox(q, se.ans, se.unit, done, 'ex')}
        ${se.empty ? '<p class="notice small" role="alert">Écris d’abord ta réponse, avec le clavier mathématique ou celui de ton appareil.</p>' : ''}
        ${se.fb ? fbBox(se.fb, done ? `<div class="corr"><b>Correction.</b> ${q.corr}</div>` : '') : ''}
        <div class="row">
          ${!done && !se.fb && maxH ? `<button class="btn" data-act="hint" ${se.hints >= Math.min(maxH, q.hints.length) ? 'disabled' : ''}>Indice (${Math.min(maxH, q.hints.length) - se.hints} restant${Math.min(maxH, q.hints.length) - se.hints > 1 ? 's' : ''})</button>` : ''}<span class="spacer"></span>
          ${!done && se.fb ? `<button class="btn" data-act="show">Voir la correction</button><button class="btn primary" data-act="retry">Réessayer</button>` : ''}
          ${!se.fb ? `<button class="btn primary" data-act="check">Valider</button>` : ''}
          ${done ? `<button class="btn primary" data-act="next">${se.i + 1 < se.list.length ? 'Question suivante' : 'Voir le bilan'}</button>` : ''}
        </div>
        ${se.fb && se.fb.s === 'ko' && !done ? '<p class="small muted">Tu peux réessayer pour comprendre ton erreur. Seule ta première réponse compte pour ta progression.</p>' : ''}
        ${q.lvl === 2 && !se.fb ? '<p class="small muted">Au niveau Débrouillé(e), chaque indice réduit les points gagnés.</p>' : ''}
        ${q.calc ? calculator() : ''}
      </section></div></div>`;
  }

  /* ---------- Calculatrice (collège) ---------- */
  let calcOut = '';
  function calculator() {
    return `<details class="draft calc"><summary>Calculatrice</summary><label for="calcin" class="small muted">Écris le calcul, par exemple √(5²+12²) ou 8×cos(35). Les angles sont en degrés.</label>
      <input id="calcin" class="mathin" data-bind="calc" autocomplete="off" placeholder="Calcul…"><output id="calcout" class="num">${calcOut}</output></details>`;
  }
  function calcEval(s) {
    try {
      const t = s.replace(/(arccos|arcsin|arctan|acos|asin|atan|cos⁻¹|sin⁻¹|tan⁻¹|cos|sin|tan)\s*\(([^()]*)\)/g, (m, f, inner) => {
        const v = M.val(inner); const d = Math.PI / 180;
        const r = /^(arccos|acos|cos⁻¹)$/.test(f) ? Math.acos(v) / d : /^(arcsin|asin|sin⁻¹)$/.test(f) ? Math.asin(v) / d : /^(arctan|atan|tan⁻¹)$/.test(f) ? Math.atan(v) / d : f === 'cos' ? Math.cos(v * d) : f === 'sin' ? Math.sin(v * d) : Math.tan(v * d);
        return '(' + String(r) + ')';
      });
      return M.val(t);
    } catch (e) { return NaN; }
  }

  /* ---------- Rédaction structurée par blocs (Pythagore) ---------- */
  const PROPS = [['', 'Choisis la propriété…'], ['rpyth', 'Réciproque du théorème de Pythagore'], ['thales', 'Théorème de Thalès'], ['cos', 'Cosinus d’un angle aigu'], ['pyth', 'Théorème de Pythagore'], ['rthales', 'Réciproque du théorème de Thalès'], ['tan', 'Tangente d’un angle aigu']];
  const C1 = [['', 'Choisis la phrase…'], ['rect', 'Donc le triangle ABC est rectangle en B.'], ['val', 'Donc la longueur AC est égale à la valeur trouvée.'], ['par', 'Donc les droites (AB) et (BC) sont parallèles.']];
  const C2 = [['', 'Choisis la phrase…'], ['aire', "Donc l'aire du triangle ABC est égale à la valeur trouvée."], ['per', 'Donc le périmètre du triangle ABC est égal à la valeur trouvée.'], ['rect', 'Donc le triangle ABC est rectangle.']];
  const UN = [['', 'unité'], ['cm', 'cm'], ['cm²', 'cm²'], ['m', 'm']];
  const r1 = x => Math.round(x * 10) / 10;
  const opt = (list, v) => list.map(([k, l]) => `<option value="${k}" ${k === v ? 'selected' : ''}>${l}</option>`).join('');
  const sel = (f, list, v, label) => `<select id="red-${f}" data-bind="red:${f}" aria-label="${label}">${opt(list, v)}</select>`;
  const inp = (f, v, label, ph = '') => `<input id="red-${f}" class="mathin" data-bind="red:${f}" value="${esc(v)}" aria-label="${label}" placeholder="${ph}" autocomplete="off">`;
  function newRed() {
    const T = [[5, 12], [4, 7], [9, 12], [5, 9], [8, 15], [6, 8], [3, 7], [7, 10], [6, 11], [10, 24], [2, 9], [12, 16]];
    const c = T[Math.floor(Math.random() * T.length)];
    S.red = { a: c[0], b: c[1], f: { prop: '', tri: '', rect: '', hyp: '', pose1: '', ac2: '', ac: '', u1: '', conc1: '', pose2: '', p: '', u2: '', conc2: '' }, g: null }; S.showModel = false;
  }
  const onlyNum = nd => !['b', 'neg', 'sqrt', 'pow', 'par', 'pi', 'v'].includes(nd.t);
  function gradeRed(st) {
    const { a, b, f } = st, T2 = a * a + b * b, T = Math.sqrt(T2), Rr = {}, close = M.close, val = M.val, ff = x => fmt(x);
    const pm = { '': 'Choisis une propriété.', rpyth: "La réciproque sert à prouver qu'un triangle est rectangle. Ici, on le sait déjà : on utilise le théorème.", thales: "Thalès demande deux droites parallèles : il n'y en a pas ici.", rthales: 'La réciproque de Thalès sert à prouver que des droites sont parallèles.', cos: 'La trigonométrie demande un angle connu. Ici, on connaît deux longueurs.', tan: 'La trigonométrie demande un angle connu. Ici, on connaît deux longueurs.' };
    Rr.prop = f.prop === 'pyth' ? { s: 'ok', p: .5, m: 'Triangle rectangle, deux côtés connus : c’est bien Pythagore.' } : { s: 'ko', p: 0, m: pm[f.prop] };
    if (f.tri === 'ABC' && f.rect === 'B' && f.hyp === 'AC') Rr.hyp = { s: 'ok', p: .5, m: 'Triangle, angle droit et hypoténuse conformes à l’énoncé.' };
    else Rr.hyp = { s: 'ko', p: 0, m: f.rect && f.rect !== 'B' ? "L'énoncé dit que le triangle est rectangle en B." : f.hyp && f.hyp !== 'AC' ? "L'hypoténuse est le côté opposé à l'angle droit B : c'est [AC]." : 'Complète les trois éléments.' };
    let P1 = NaN, ast = null; try { ast = M.parse(f.pose1); P1 = M.ev(ast); } catch (e) { }
    if (!ast) Rr.pose1 = { s: 'ko', p: 0, m: 'Écris le calcul, par exemple ' + a + '² + ' + b + '².' };
    else if (onlyNum(ast)) Rr.pose1 = { s: 'part', p: 0, m: 'Pose le calcul avant de donner le résultat, par exemple ' + a + '² + ' + b + '².' };
    else if (close(P1, T2)) Rr.pose1 = { s: 'ok', p: .5, m: `${a}² + ${b}² correspond bien à AB² + BC².` };
    else if (close(P1, Math.abs(a * a - b * b))) Rr.pose1 = { s: 'ko', p: 0, m: 'On soustrait quand on cherche un côté de l’angle droit. Ici, on cherche l’hypoténuse : on additionne.' };
    else if (close(P1, a + b)) Rr.pose1 = { s: 'ko', p: 0, m: 'Il faut élever les longueurs au carré.' };
    else Rr.pose1 = { s: 'ko', p: 0, m: 'Ce calcul ne correspond pas à AB² + BC².' };
    const ok1 = Rr.pose1.s === 'ok' || Rr.pose1.s === 'part';
    const A2 = val(f.ac2), ref2 = ok1 ? (Number.isFinite(P1) && Rr.pose1.s === 'ok' ? P1 : T2) : P1;
    if (!Number.isFinite(A2)) Rr.ac2 = { s: 'ko', p: 0, m: 'Donne la valeur de AC².' };
    else if (close(A2, ref2, 1e-6) && close(A2, T2)) Rr.ac2 = { s: 'ok', p: .5, m: '' };
    else if (close(A2, ref2, 1e-6)) Rr.ac2 = { s: 'rep', p: .5, m: 'Calcul juste à partir de ton calcul posé.' };
    else Rr.ac2 = { s: 'ko', p: 0, m: `Erreur de calcul : ${a}² + ${b}² = ${a * a} + ${b * b} = ${T2}.` };
    const AC = val(f.ac), expAC = Number.isFinite(A2) ? Math.sqrt(A2) : NaN;
    if (!Number.isFinite(AC)) Rr.ac = { s: 'ko', p: 0, m: 'Donne la longueur AC.' };
    else if (Math.abs(AC - r1(expAC)) < 0.051 || close(AC, expAC)) { Rr.ac = close(A2, T2) ? { s: 'ok', p: .5, m: '' } : { s: 'rep', p: .5, m: `Erreur reportée : √${ff(A2)} ≈ ${ff(r1(expAC))}, c'est juste avec ta valeur de AC².` }; }
    else if (close(AC, A2 / 2)) Rr.ac = { s: 'ko', p: 0, m: 'Tu as divisé par 2. Il faut prendre la racine carrée : AC = √AC².' };
    else Rr.ac = { s: 'ko', p: 0, m: `AC = √${ff(A2)} ≈ ${ff(r1(expAC))} (arrondi au dixième).` };
    const u1 = f.u1 === 'cm', c1 = f.conc1 === 'val';
    Rr.conc1 = { s: u1 && c1 ? 'ok' : (u1 || c1) ? 'part' : 'ko', p: (u1 ? .25 : 0) + (c1 ? .25 : 0), m: u1 && c1 ? 'La conclusion répond à la question, avec l’unité.' : !u1 ? (f.u1 ? 'Une longueur s’exprime en cm, pas en ' + f.u1 + '.' : 'L’unité est absente.') : 'La phrase de conclusion ne répond pas à la question posée.' };
    const stAC = Number.isFinite(AC) ? AC : T; let P2 = NaN, ast2 = null; try { ast2 = M.parse(f.pose2); P2 = M.ev(ast2); } catch (e) { }
    if (!ast2) Rr.pose2 = { s: 'ko', p: 0, m: 'Écris le calcul du périmètre.' };
    else if (close(P2, a + b + r1(T), 1e-6) || close(P2, a + b + T, 1e-6)) Rr.pose2 = { s: 'ok', p: 1, m: 'Somme des trois côtés.' };
    else if (close(P2, a + b + stAC, 1e-6)) Rr.pose2 = { s: 'rep', p: 1, m: `Erreur reportée : ta démarche est juste avec AC = ${ff(stAC)} cm.` };
    else if (close(P2, a * b / 2)) Rr.pose2 = { s: 'ko', p: 0, m: 'Tu as calculé l’aire, pas le périmètre.' };
    else if (close(P2, a + b)) Rr.pose2 = { s: 'ko', p: 0, m: 'Le périmètre est la somme des trois côtés : il manque AC.' };
    else Rr.pose2 = { s: 'ko', p: 0, m: 'Le périmètre est AB + BC + AC.' };
    const PV = val(f.p), u2 = f.u2 === 'cm';
    if (!Number.isFinite(PV)) Rr.p = { s: 'ko', p: 0, m: 'Donne la valeur du périmètre.' };
    else if (Number.isFinite(P2) && Math.abs(PV - r1(P2)) < 0.051) { const base = Rr.pose2.s === 'ok' ? 'ok' : 'rep'; Rr.p = u2 ? { s: base, p: .5, m: base === 'rep' ? 'Calcul juste avec tes valeurs.' : '' } : { s: 'part', p: .25, m: 'Résultat juste, mais l’unité manque ou est fausse.' }; }
    else Rr.p = { s: 'ko', p: 0, m: `Erreur de calcul : ${esc(f.pose2) || '…'} ≈ ${ff(r1(P2))}.` };
    Rr.conc2 = f.conc2 === 'per' ? { s: 'ok', p: .5, m: '' } : { s: 'ko', p: 0, m: 'La question porte sur le périmètre.' };
    const s1 = ['prop', 'hyp', 'pose1', 'ac2', 'ac', 'conc1'].reduce((t, k) => t + Rr[k].p, 0), s2 = ['pose2', 'p', 'conc2'].reduce((t, k) => t + Rr[k].p, 0);
    return { R: Rr, s1, s2, tot: s1 + s2 };
  }
  const STL = { ok: 'Juste', rep: 'Erreur reportée', part: 'Incomplet', ko: 'Faux' };
  function blk(g, key, title, pts, inner) {
    const r = g && g.R[key];
    return `<div class="blk ${r ? r.s : ''}"><div class="bh"><span class="eyebrow">${title}</span>${r ? `<span class="st ${r.s}">${STL[r.s]}</span><span class="small num"><b>${fmt(r.p)}</b> / ${fmt(pts)} pt</span>` : `<span class="small muted num">${fmt(pts)} pt</span>`}</div>${inner}${r && r.m ? `<p class="msg">${r.m}</p>` : ''}</div>`;
  }
  function figure(a, b) {
    return `<div class="fig"><svg viewBox="0 0 260 170" role="img" aria-label="Triangle ABC rectangle en B, AB = ${a} cm, BC = ${b} cm">
    <polygon points="50,30 50,140 220,140" fill="none" stroke="currentColor" stroke-width="2.5" style="color:var(--accent)"/>
    <polyline points="50,124 66,124 66,140" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--muted)"/>
    <text x="34" y="30">A</text><text x="34" y="156">B</text><text x="226" y="156">C</text>
    <text x="4" y="90">${a} cm</text><text x="118" y="162">${b} cm</text><text x="140" y="78">?</text></svg><span class="small muted">La figure n'est pas à l'échelle.</span></div>`;
  }
  function modelText(st) {
    const { a, b } = st, T2 = a * a + b * b, T = Math.sqrt(T2), ex = Number.isInteger(T), ACv = ex ? T : r1(T);
    return `<div class="model"><p class="eyebrow">Rédaction modèle</p><p>Dans le triangle ABC rectangle en B, l'hypoténuse est [AC]. D'après le théorème de Pythagore :</p>
    <p>AC² = AB² + BC² = ${a}² + ${b}² = ${a * a} + ${b * b} = ${T2}</p><p>Donc AC = √${T2} ${ex ? '= ' + T : '≈ ' + fmt(ACv)} cm.</p>
    <p>P = AB + BC + AC ${ex ? '=' : '≈'} ${a} + ${b} + ${fmt(ACv)} ${ex ? '=' : '≈'} ${fmt(a + b + ACv)} cm.</p><p>Le périmètre du triangle ABC est ${ex ? 'égal à' : "d'environ"} ${fmt(a + b + ACv)} cm.</p></div>`;
  }
  function scrRed() {
    if (!S.red) newRed(); const st = S.red, g = st.g, f = st.f, { a, b } = st;
    return `<div class="wrap">
    <div class="row"><div><p class="eyebrow">Rédaction structurée · Théorème de Pythagore</p><h1>Problème rédigé par blocs</h1></div><span class="spacer"></span>${lvChip(3)}</div>
    ${g ? `<section class="card pop"><div class="total"><span class="big num">${fmt(g.tot)}</span><span>/ 5 points</span><span class="spacer"></span><span class="small muted">Barème fixe, identique pour tous.</span></div>
      <div class="legend"><span><b style="color:var(--ok)">✓ Juste</b></span><span><b style="color:var(--part)">↪ Erreur reportée</b> : juste avec ta valeur précédente</span><span><b style="color:var(--part)">≈ Incomplet</b></span><span><b style="color:var(--ko)">✗ Faux</b></span></div></section>` : `<p class="notice">Complète chaque bloc comme sur ta copie. La correction suit ta démarche : une erreur de calcul n'empêche pas de gagner les points suivants.</p>`}
    <div class="ex-grid"><section class="card"><p class="eyebrow">Énoncé</p>
      <div class="enonce" style="font-size:1.05rem">ABC est un triangle rectangle en B tel que AB = ${a} cm et BC = ${b} cm.<br>1. Calculer la longueur AC, arrondie au dixième si nécessaire.<br>2. Calculer le périmètre du triangle ABC, arrondi au dixième.</div>
      ${figure(a, b)}<p class="small muted">Calculatrice autorisée.</p>${calculator()}
      <details class="draft"><summary>Rédaction libre (jamais notée)</summary><textarea id="redlibre" aria-label="Rédaction libre" placeholder="Rédige comme sur ta copie…"></textarea></details>
      ${g ? `<button class="btn" data-act="model" aria-expanded="${S.showModel}">${S.showModel ? 'Masquer' : 'Voir'} la rédaction modèle</button>${S.showModel ? modelText(st) : ''}` : ''}</section>
    <section class="card">
      <div class="stepbox"><h3>1. Calculer la longueur AC ${g ? `<span class="spacer"></span><span class="num">${fmt(g.s1)} / 3 pts</span>` : ''}</h3><div class="blocks">
        ${blk(g, 'prop', 'Propriété utilisée', .5, `<div class="line">${sel('prop', PROPS, f.prop, 'Propriété')}</div>`)}
        ${blk(g, 'hyp', 'Hypothèses', .5, `<div class="line">Dans le triangle ${sel('tri', [['', '…'], ['ABC', 'ABC'], ['ABD', 'ABD']], f.tri, 'Triangle')} rectangle en ${sel('rect', [['', '…'], ['A', 'A'], ['B', 'B'], ['C', 'C']], f.rect, 'Sommet de l’angle droit')}, l'hypoténuse est ${sel('hyp', [['', '…'], ['AB', '[AB]'], ['BC', '[BC]'], ['AC', '[AC]']], f.hyp, 'Hypoténuse')}.</div>`)}
        ${blk(g, 'pose1', 'Calcul posé', .5, `<div class="line"><span>AC² = AB² + BC² =</span>${inp('pose1', f.pose1, 'Calcul posé', a + '² + ' + b + '²')}</div>`)}
        ${blk(g, 'ac2', 'Résultat intermédiaire', .5, `<div class="line"><span>AC² =</span>${inp('ac2', f.ac2, 'Valeur de AC²')}</div>`)}
        ${blk(g, 'ac', 'Résultat', .5, `<div class="line"><span>AC = √AC² ≈</span>${inp('ac', f.ac, 'Longueur AC')}${sel('u1', UN, f.u1, 'Unité')}</div>`)}
        ${blk(g, 'conc1', 'Conclusion et unité', .5, `<div class="line">${sel('conc1', C1, f.conc1, 'Conclusion')}</div>`)}
      </div></div>
      <div class="stepbox"><h3>2. Calculer le périmètre ${g ? `<span class="spacer"></span><span class="num">${fmt(g.s2)} / 2 pts</span>` : ''}</h3><div class="blocks">
        ${blk(g, 'pose2', 'Calcul posé', 1, `<div class="line"><span>P = AB + BC + AC =</span>${inp('pose2', f.pose2, 'Calcul du périmètre')}</div>`)}
        ${blk(g, 'p', 'Résultat avec unité', .5, `<div class="line"><span>P ≈</span>${inp('p', f.p, 'Périmètre')}${sel('u2', UN, f.u2, 'Unité')}</div>`)}
        ${blk(g, 'conc2', 'Conclusion', .5, `<div class="line">${sel('conc2', C2, f.conc2, 'Conclusion')}</div>`)}
      </div></div>
      ${kbd()}
      <div class="row"><button class="btn" data-act="redNew">Nouvelles valeurs</button><span class="spacer"></span><button class="btn primary" data-act="redGrade">${g ? 'Corriger à nouveau' : 'Corriger ma rédaction'}</button></div>
    </section></div></div>`;
  }

  /* ---------- Examen blanc d'automatismes ---------- */
  const QUOTA = { nc: 6, df: 3, gm: 3, eg: 2, ap: 1 };
  function buildExam() {
    const p = P(), lastGens = new Set((p.exams.filter(e => e.type === 'auto').slice(-1)[0]?.items || []).map(it => it.ref.g));
    const refs = [];
    for (const [d, k] of Object.entries(QUOTA)) {
      let pool = []; BANK.NOTIONS.filter(x => x.dom === d).forEach(no => no.gens.filter(g => g.auto && !g.calc && g.lv.some(l => l <= 3)).forEach(g => pool.push({ no, g })));
      pool = M.shuffle ? pool.sort(() => Math.random() - 0.5) : pool;
      pool.sort((x, y) => (lastGens.has(x.g.id) ? 1 : 0) - (lastGens.has(y.g.id) ? 1 : 0));
      const usedN = {};
      for (const it of pool) {
        if (refs.filter(r => BANK.byId[r.n].dom === d).length >= k) break;
        if ((usedN[it.no.id] || 0) >= 2) continue; usedN[it.no.id] = (usedN[it.no.id] || 0) + 1;
        const L = it.g.lv.includes(2) ? 2 : it.g.lv.filter(l => l <= 3).pop();
        let q, tries = 0; do { q = BANK.make({ n: it.no.id, g: it.g.id, L, s: Math.floor(Math.random() * 2 ** 31) }); tries++; } while (q.calc && tries < 5);
        refs.push(q.ref);
      }
    }
    return refs.sort(() => Math.random() - 0.5);
  }
  function startExam(chain) {
    const p = P(), dur = 20 * 60000 * (p.settings.tiers ? 4 / 3 : 1);
    p.cur = { type: 'auto', start: Date.now(), end: Date.now() + dur, refs: buildExam(), ans: {}, units: {}, i: 0, confirm: false, warn: '', chain: !!chain };
    save();
  }
  let examQs = null, examKey = '';
  function examQuestions() { const c = P().cur; const k = c.start + ':' + c.refs.length; if (examKey !== k) { examQs = c.refs.map(BANK.make); examKey = k; } return examQs; }
  function submitExam(timeout) {
    const p = P(), c = p.cur; if (!c) return; const qs = examQuestions();
    const items = qs.map((q, i) => { const r = M.grade({ ...q, pts: 0.4 }, c.ans[i] || '', c.units[i] || ''); return { ref: q.ref, ans: c.ans[i] || '', unit: c.units[i] || '', s: r.s, pts: r.pts }; });
    const score = Math.round(items.reduce((t, it) => t + it.pts, 0) * 100) / 100;
    p.exams.push({ type: 'auto', date: Date.now(), dur: Date.now() - c.start, score, max: 6, items, timeout: !!timeout, tiers: !!p.settings.tiers });
    items.forEach((it, i) => { const s = NS(qs[i].notion); s.seen[qs[i].sig] = Date.now(); if (it.s !== 'ok') { s.fragile = true; s.okRun = 0; } });
    p.cur = null; touchDay(); p.xp += Math.round(score * 10);
    if (c.chain) { startExamPb({ auto: p.exams.length - 1 }); location.hash = 'examen-pb'; render(); return; }
    save(); S.copy = p.exams.length - 1; location.hash = 'copie'; render();
  }
  function band(title, timeLeft, done) {
    return `<div class="band"><div class="in"><div class="lbl">Examen blanc<span>${title}</span></div>
      <span class="timer num ${!done && timeLeft < 300000 ? 'low' : ''}" id="timer" role="timer" aria-label="Temps restant">${done ? 'Terminé' : clock(timeLeft)}</span>
      ${done ? `<a class="btn" href="#progres">Fermer</a>` : `<button class="btn" data-act="askSubmit">Rendre la copie</button>`}</div></div>`;
  }
  function scrBrevet() {
    const p = P(), c = p.cur;
    const last = p.exams.slice(-3).reverse();
    return `<div class="wrap"><div><p class="eyebrow">Brevet blanc</p><h1>Conditions d'examen</h1><p class="muted">Pas d'aide, pas de correction avant la fin. Le temps continue de s'écouler si tu quittes l'application.</p></div>
    ${c ? `<div class="notice"><b>Épreuve en cours :</b> il reste <b class="num">${clock(c.end - Date.now())}</b>. <a href="#${c.type === 'pb' ? 'examen-pb' : 'examen'}">Reprendre l'épreuve</a></div>` : ''}
    <div class="grid2">
      <section class="card exam-card"><p class="eyebrow">Partie 1</p><h2>Automatismes</h2>
        <ul class="rules"><li><b>15 questions</b> courtes en <b>${p.settings.tiers ? '26 min 40 s (tiers-temps)' : '20 minutes'}</b></li><li>Noté sur <b>6 points</b> (0,4 point par question)</li><li>Sans calculatrice, tous les domaines mélangés</li><li>Navigation libre entre les questions, réponses enregistrées</li><li>Un sujet nouveau à chaque fois</li></ul>
        <button class="btn primary" data-act="startExam" ${c ? 'disabled' : ''}>Commencer l'épreuve</button></section>
      <section class="card exam-card"><p class="eyebrow">Partie 2</p><h2>Raisonnement et résolution de problèmes</h2>
        <ul class="rules"><li><b>6 exercices</b> indépendants en <b>${p.settings.tiers ? '2 h 13 min (tiers-temps)' : '1 h 40'}</b></li><li>Noté sur <b>14 points</b></li><li>Calculatrice autorisée, brouillon disponible</li><li>Démarches rédigées par blocs : propriété, calcul posé, résultat, unité</li><li>Une tâche ouverte où tu construis ta démarche</li></ul>
        <button class="btn primary" data-act="startExamPb" ${c ? 'disabled' : ''}>Commencer l'épreuve</button></section>
    </div>
    <section class="card exam-card"><p class="eyebrow">Parties 1 et 2 enchaînées</p><h2>Brevet blanc complet, sur 20 points</h2><p class="muted">Comme le jour de l'examen : les automatismes (20 min), puis les problèmes (1 h 40) juste après. Prévois 2 heures au calme.</p><button class="btn primary" data-act="startFull" ${c ? 'disabled' : ''}>Commencer le brevet blanc complet</button></section>
    <p class="small muted">Le nombre d'exercices et leur barème suivent la structure générale de l'épreuve. Ils seront ajustés quand les sujets zéro officiels de la session 2027 seront publiés.</p>
    ${last.length ? `<section class="card"><h3>Dernières copies</h3><ul class="list">${last.map((e, k) => `<li><a class="rowbtn" href="#copie" data-act="copy" data-i="${p.exams.length - 1 - k}"><span class="t"><b>${{ auto: 'Automatismes', pb: 'Problèmes', full: 'Brevet blanc complet' }[e.type]} · ${fmt(e.score)} / ${e.max}</b><span class="small muted">${new Date(e.date).toLocaleDateString('fr-FR')}${e.dur ? ' · ' + clock(e.dur) : ''}${e.timeout ? ' · rendue à la fin du temps' : ''}</span></span><span class="small">Voir la copie</span></a></li>`).join('')}</ul></section>` : ''}
    </div>`;
  }
  function scrExam() {
    const p = P(), c = p.cur; if (!c) { location.hash = 'brevet'; return ''; }
    const qs = examQuestions(), q = qs[c.i], missing = qs.filter((_, i) => !(c.ans[i] || '').toString().trim()).length;
    return band('Automatismes · sans calculatrice', c.end - Date.now(), false) + `<div class="wrap">
      ${c.warn ? `<p class="notice" role="alert">${c.warn}</p>` : ''}
      ${c.confirm ? `<div class="confirm" role="alertdialog" aria-label="Confirmation"><b>Rendre la copie maintenant ?</b><p>${missing ? `${missing} question${missing > 1 ? 's' : ''} sans réponse. ` : ''}Tu ne pourras plus modifier tes réponses.</p><div class="row"><button class="btn primary" data-act="submit">Rendre la copie</button><button class="btn" data-act="cancelSubmit">Continuer l'épreuve</button></div></div>` : ''}
      <nav class="qnav" aria-label="Questions">${qs.map((_, i) => `<button data-act="goq" data-i="${i}" class="${(c.ans[i] || '').toString().trim() ? 'ans' : ''}" aria-current="${i === c.i}" aria-label="Question ${i + 1}${(c.ans[i] || '').toString().trim() ? ', répondue' : ''}">${i + 1}</button>`).join('')}</nav>
      <div class="legend"><span>Souligné : question répondue</span><span>Encadré : question affichée</span><span class="num">${15 - missing} / 15 réponses</span></div>
      <div class="ex-grid">
        <section class="card"><p class="eyebrow">Question ${c.i + 1} sur 15 · 0,4 point</p><div class="enonce">${q.html}</div>
          <details class="draft"><summary>Brouillon (jamais corrigé)</summary><textarea id="draft-exam-${c.i}" aria-label="Brouillon" placeholder="Brouillon…"></textarea></details></section>
        <section class="card"><p class="eyebrow">Ta réponse</p>${answerBox(q, c.ans[c.i] ?? '', c.units[c.i] || '', false, 'exam')}
          <div class="row"><button class="btn" data-act="prevq" ${c.i === 0 ? 'disabled' : ''}>Précédente</button><span class="spacer"></span><button class="btn primary" data-act="nextq" ${c.i === 14 ? 'disabled' : ''}>Suivante</button></div>
        </section></div>
      <div class="row small"><span class="saved">Réponses enregistrées automatiquement</span><span class="spacer"></span><a class="btn ghost small" href="#brevet">Quitter (le temps continue)</a></div></div>`;
  }
  function scrCopy() {
    const p = P(), e = p.exams[S.copy ?? p.exams.length - 1]; if (!e) { location.hash = 'brevet'; return ''; }
    if (e.type === 'pb') return copyPb(e);
    if (e.type === 'full') return copyFull(e);
    const qs = e.items.map(it => BANK.make(it.ref));
    const doms = {}; qs.forEach((q, i) => { doms[q.dom] = doms[q.dom] || [0, 0]; doms[q.dom][0] += e.items[i].pts; doms[q.dom][1] += 0.4; });
    return band('Automatismes · copie corrigée', 0, true) + `<div class="wrap">
      <section class="card"><p class="eyebrow">Copie du ${new Date(e.date).toLocaleDateString('fr-FR')} ${e.timeout ? '· rendue automatiquement à la fin du temps' : ''}</p><div class="total"><span class="big num">${fmt(e.score)}</span><span>/ 6 points</span><span class="spacer"></span><span class="small muted">Durée : ${clock(e.dur)}${e.tiers ? ' (tiers-temps)' : ''}</span></div>
        <p class="muted">Les notions où tu t'es trompée sont ajoutées à ta révision du jour.</p></section>
      <section class="card"><h3>Bilan par domaine</h3>${Object.entries(doms).map(([d, [o, m]]) => `<div class="comp"><span>${BANK.DOMS[d]}</span><div class="bar"><span style="width:${o / m * 100}%"></span></div><span class="num small">${fmt(o)}/${fmt(m)}</span></div>`).join('')}</section>
      <section class="card"><h3>Correction détaillée</h3><div class="corrlist">
        ${qs.map((q, i) => { const it = e.items[i]; const lab = { ok: '✓ Juste', part: '≈ Partiellement juste', ko: '✗ Faux', vide: '— Sans réponse' }[it.s]; const col = { ok: 'var(--ok)', part: 'var(--part)', ko: 'var(--ko)', vide: 'var(--muted)' }[it.s];
          const shown = q.type === 'qcm' ? (it.ans !== '' ? q.choices[+it.ans] : '') : esc(it.ans) + (it.unit ? ' ' + esc(it.unit) : q.suffix && it.ans ? ' ' + q.suffix : '');
          const g = M.grade(q, it.ans, it.unit);
          return `<details class="citem ${it.s}"><summary><span class="num">${i + 1}.</span> <b style="color:${col}">${lab}</b> <span class="small muted num">${fmt(it.pts)} / 0,4</span> <span class="small muted">· ${BANK.byId[q.notion].name}</span></summary>
            <div class="enonce small-enonce">${q.html}</div><p><b>Ta réponse :</b> ${shown || '<span class="muted">aucune</span>'}</p>${it.s !== 'ok' && g.m ? `<p class="small">${g.m}</p>` : ''}<div class="corr"><b>Correction.</b> ${q.corr}</div></details>`; }).join('')}
      </div></section>
      <div class="row"><a class="btn primary" href="#progres">Voir mes progrès</a><a class="btn" href="#brevet">Retour aux examens blancs</a></div></div>`;
  }

  /* ---------- Examen blanc de problèmes (1 h 40, 14 points) ---------- */
  const STL2 = { ok: 'Juste', rep: 'Erreur reportée', part: 'Incomplet', ko: 'Faux', vide: 'Sans réponse' };
  function startExamPb(chain) {
    const p = P(), dur = window.PB.DURATION * 60000 * (p.settings.tiers ? 4 / 3 : 1);
    const lastPb = p.exams.filter(e => e.type === 'pb').slice(-1)[0], lastIds = lastPb ? lastPb.items.map(it => it.ref.g) : [];
    p.cur = { type: 'pb', start: Date.now(), end: Date.now() + dur, refs: window.PB.buildSubject(lastIds), ans: {}, ex: 0, confirm: false, warn: '', chain: chain || null };
    save();
  }
  let pbExs = null, pbKey = '';
  function pbExercises(c) { const k = c.start + ':pb'; if (pbKey !== k) { pbExs = c.refs.map(window.PB.makeEx); pbKey = k; } return pbExs; }
  function submitExamPb(timeout) {
    const p = P(), c = p.cur; if (!c) return; const exs = pbExercises(c);
    const items = exs.map((ex, i) => { const g = window.PB.gradeEx(ex, c.ans[i] || {}); return { ref: ex.ref, ans: c.ans[i] || {}, score: g.score, max: ex.pts }; });
    const score = Math.round(items.reduce((t, it) => t + it.score, 0) * 100) / 100;
    p.exams.push({ type: 'pb', date: Date.now(), dur: Date.now() - c.start, score, max: 14, items, timeout: !!timeout, tiers: !!p.settings.tiers });
    const pbIdx = p.exams.length - 1;
    if (c.chain && c.chain.auto != null) { const au = p.exams[c.chain.auto]; p.exams.push({ type: 'full', date: Date.now(), score: Math.round((au.score + score) * 100) / 100, max: 20, auto: c.chain.auto, pb: pbIdx }); }
    p.cur = null; touchDay(); p.xp += Math.round(score * 10); save();
    S.copy = p.exams.length - 1; location.hash = 'copie'; render();
  }
  const pbSel = (bind, choices, v, label, ro) => `<select id="${bind.replace(/\|/g, '-')}" data-bind="${bind}" aria-label="${label}" ${ro ? 'disabled' : ''}><option value="">Choisis…</option>${choices.map((ch, i) => `<option value="${i}" ${String(v) === String(i) ? 'selected' : ''}>${ch}</option>`).join('')}</select>`;
  const pbInp = (bind, v, label, ro, ph = '') => `<input id="${bind.replace(/\|/g, '-')}" class="mathin" data-bind="${bind}" value="${esc(v ?? '')}" aria-label="${label}" placeholder="${ph}" autocomplete="off" ${ro ? 'readonly' : ''}>`;
  const pbStatus = (r, pts) => r ? `<span class="st ${r.s === 'vide' ? 'ko' : r.s}">${STL2[r.s] || r.s}</span><span class="small num"><b>${fmt(r.p)}</b> / ${fmt(pts)} pt</span>` : `<span class="small muted num">${fmt(pts)} pt</span>`;
  function pbBlock(title, r, pts, inner) { return `<div class="blk ${r ? (r.s === 'vide' ? 'ko' : r.s) : ''}"><div class="bh"><span class="eyebrow">${title}</span>${pbStatus(r, pts)}</div>${inner}${r && r.m && r.s !== 'ok' ? `<p class="msg">${r.m}</p>` : ''}</div>`; }
  function pbBody(ex, i, A, g, ro) {
    A = A || {};
    if (ex.type === 'open') {
      const steps = A.steps || [];
      return `<div class="stepbox"><h3>Ma démarche ${g ? `<span class="spacer"></span><span class="num">${fmt(g.score)} / ${fmt(ex.pts)} pts</span>` : ''}</h3>
        <p class="small muted">Ajoute les étapes de ton choix, dans l'ordre que tu veux. Chaque étape juste et utile rapporte des points, même si tu ne termines pas.</p>
        <div class="blocks">${steps.map((st, k) => { const q = ex.qty.find(x => x.key === st.k), r = g && g.steps[k];
          return `<div class="blk ${r ? (r.s === 'vide' ? 'ko' : r.s) : ''}"><div class="bh"><span class="eyebrow">Étape ${k + 1}</span>${r ? `<span class="st ${r.s === 'vide' ? 'ko' : r.s}">${STL2[r.s] || r.s}</span>` : ''}${ro ? '' : `<button class="btn ghost small" data-act="pbDelStep" data-i="${k}" aria-label="Supprimer l'étape ${k + 1}">Supprimer</button>`}</div>
            <div class="line"><span>Je calcule</span>${pbSel(`pbs|${i}|${k}|k`, ex.qty.map(x => x.label), ex.qty.findIndex(x => x.key === st.k) < 0 ? '' : ex.qty.findIndex(x => x.key === st.k), 'Grandeur calculée', ro)}</div>
            <div class="line"><span>Calcul :</span>${pbInp(`pbs|${i}|${k}|pose`, st.pose, 'Calcul posé', ro, 'par exemple 4,2 × 3,5')}</div>
            <div class="line"><span>Résultat :</span>${pbInp(`pbs|${i}|${k}|val`, st.val, 'Résultat', ro)}${q && q.units ? `<select id="pbs-${i}-${k}-unit" data-bind="pbs|${i}|${k}|unit" aria-label="Unité" ${ro ? 'disabled' : ''}><option value="">unité</option>${q.units.map(u => `<option ${st.unit === u ? 'selected' : ''}>${u}</option>`).join('')}</select>` : q && q.suffix ? `<span class="suffix">${q.suffix}</span>` : ''}</div>
            ${r && r.m ? `<p class="msg">${r.m}</p>` : ''}</div>`; }).join('')}</div>
        ${ro ? '' : `<button class="btn" data-act="pbAddStep">+ Ajouter une étape</button>`}
        ${pbBlock('Réponse à la question', g ? { s: g.final.s, p: g.final.s === 'ok' ? ex.pts : 0, m: g.final.m } : null, ex.pts, `<div class="line"><span>Réponse :</span>${pbInp(`pbf|${i}`, A.final, 'Réponse finale', ro)}<span class="suffix">${ex.qty.find(x => x.key === ex.final).suffix || ''}</span></div>`)}</div>`;
    }
    return ex.parts.map(pt => { const a = A[pt.id] || {}, r = g && g.parts.find(x => x.id === pt.id), it = r ? r.it : {};
      return `<div class="stepbox"><h3>${pt.q} ${r ? `<span class="spacer"></span><span class="num">${fmt(r.score)} / ${fmt(r.max)}</span>` : ''}</h3><div class="blocks">
        ${pt.prop ? pbBlock('Propriété utilisée', it.prop, pt.pts.prop, `<div class="line">${pbSel(`pb|${i}|${pt.id}|prop`, pt.prop.choices, a.prop, 'Propriété', ro)}</div>`) : ''}
        ${pt.pose ? pbBlock('Calcul posé', it.pose, pt.pts.pose, `<div class="line"><span>${pt.pose.lead}</span>${pbInp(`pb|${i}|${pt.id}|pose`, a.pose, 'Calcul posé', ro)}</div>`) : ''}
        ${pbBlock(pt.res.type === 'qcm' ? 'Conclusion' : 'Résultat', it.res, pt.pts.res, pt.res.type === 'qcm'
          ? `<div class="choices">${pt.res.choices.map((ch, k) => `<button type="button" class="choice" role="radio" aria-checked="${String(a.res) === String(k)}" data-act="pbChoose" data-ex="${i}" data-part="${pt.id}" data-i="${k}" ${ro ? 'disabled' : ''}><span class="dot" aria-hidden="true"></span><span>${ch}</span></button>`).join('')}</div>`
          : `<div class="line"><span>${pt.res.lead}</span>${pbInp(`pb|${i}|${pt.id}|res`, a.res, 'Résultat', ro)}${pt.res.units ? `<select id="pb-${i}-${pt.id}-unit" data-bind="pb|${i}|${pt.id}|unit" aria-label="Unité" ${ro ? 'disabled' : ''}><option value="">unité</option>${pt.res.units.map(u => `<option ${a.unit === u ? 'selected' : ''}>${u}</option>`).join('')}</select>` : pt.res.suffix ? `<span class="suffix">${pt.res.suffix}</span>` : ''}</div>`)}
        ${g ? `<div class="corr"><b>Correction.</b> ${pt.corr}</div>` : ''}</div></div>`; }).join('');
  }
  function scrExamPb() {
    const p = P(), c = p.cur; if (!c || c.type !== 'pb') { location.hash = 'brevet'; return ''; }
    const exs = pbExercises(c), ex = exs[c.ex];
    return band(`Problèmes · calculatrice autorisée${c.chain ? ' · brevet complet' : ''}`, c.end - Date.now(), false) + `<div class="wrap">
      ${c.warn ? `<p class="notice" role="alert">${c.warn}</p>` : ''}
      ${c.confirm ? `<div class="confirm" role="alertdialog" aria-label="Confirmation"><b>Rendre la copie maintenant ?</b><p>Tu ne pourras plus modifier tes réponses.</p><div class="row"><button class="btn primary" data-act="submit">Rendre la copie</button><button class="btn" data-act="cancelSubmit">Continuer l'épreuve</button></div></div>` : ''}
      <nav class="exnav" aria-label="Exercices">${exs.map((e, k) => `<button data-act="goex" data-i="${k}" aria-current="${k === c.ex}">Ex. ${k + 1} · ${fmt(e.pts)} pts</button>`).join('')}</nav>
      <div class="ex-grid">
        <section class="card"><p class="eyebrow">Exercice ${c.ex + 1} · ${fmt(ex.pts)} points</p><h2>${ex.title}</h2><div class="enonce small-enonce">${ex.intro}</div>
          ${calculator()}
          <details class="draft"><summary>Brouillon (jamais corrigé)</summary><textarea id="draft-pb-${c.ex}" aria-label="Brouillon" placeholder="Brouillon…"></textarea></details></section>
        <section class="card">${pbBody(ex, c.ex, c.ans[c.ex], null, false)}${kbd()}
          <div class="row"><button class="btn" data-act="goex" data-i="${c.ex - 1}" ${c.ex === 0 ? 'disabled' : ''}>Exercice précédent</button><span class="spacer"></span><button class="btn primary" data-act="goex" data-i="${c.ex + 1}" ${c.ex === exs.length - 1 ? 'disabled' : ''}>Exercice suivant</button></div>
          <p class="small muted">Aucune correction avant la remise de la copie.</p></section></div>
      <div class="row small"><span class="saved">Réponses enregistrées automatiquement</span><span class="spacer"></span><a class="btn ghost small" href="#brevet">Quitter (le temps continue)</a></div></div>`;
  }
  function copyPb(e) {
    const exs = e.items.map(it => window.PB.makeEx(it.ref));
    return band('Problèmes · copie corrigée', 0, true) + `<div class="wrap">
      <section class="card"><p class="eyebrow">Copie du ${new Date(e.date).toLocaleDateString('fr-FR')} ${e.timeout ? '· rendue automatiquement à la fin du temps' : ''}</p><div class="total"><span class="big num">${fmt(e.score)}</span><span>/ 14 points</span><span class="spacer"></span><span class="small muted">Durée : ${clock(e.dur)}${e.tiers ? ' (tiers-temps)' : ''}</span></div>
        <div class="legend"><span><b style="color:var(--ok)">Juste</b></span><span><b style="color:var(--part)">Erreur reportée</b> : juste avec ta valeur précédente</span><span><b style="color:var(--part)">Incomplet</b></span><span><b style="color:var(--ko)">Faux</b></span></div></section>
      <section class="card"><h3>Bilan par exercice</h3>${exs.map((ex, k) => `<div class="comp"><span>Ex. ${k + 1}</span><div class="bar"><span style="width:${e.items[k].score / ex.pts * 100}%"></span></div><span class="num small">${fmt(e.items[k].score)}/${fmt(ex.pts)}</span></div>`).join('')}</section>
      ${exs.map((ex, k) => { const g = window.PB.gradeEx(ex, e.items[k].ans);
        return `<details class="citem card ${g.score >= ex.pts ? 'ok' : g.score > 0 ? 'part' : 'ko'}" ${k === 0 ? 'open' : ''}><summary><b>Exercice ${k + 1} · ${ex.title}</b> <span class="num small muted">${fmt(g.score)} / ${fmt(ex.pts)}</span></summary>
          <div class="ex-grid"><div class="col"><div class="enonce small-enonce">${ex.intro}</div>${ex.type === 'open' ? `<div class="model"><p class="eyebrow">Démarche modèle</p><p>${ex.model}</p></div>` : ''}</div><div class="col">${pbBody(ex, k, e.items[k].ans, g, true)}</div></div></details>`; }).join('')}
      <div class="row"><a class="btn primary" href="#progres">Voir mes progrès</a><a class="btn" href="#brevet">Retour aux examens blancs</a></div></div>`;
  }
  function copyFull(e) {
    const p = P(), au = p.exams[e.auto], pb = p.exams[e.pb];
    return band('Brevet blanc complet', 0, true) + `<div class="wrap narrow"><section class="card pop"><p class="eyebrow">Brevet blanc complet du ${new Date(e.date).toLocaleDateString('fr-FR')}</p>
      <div class="total"><span class="big num">${fmt(e.score)}</span><span>/ 20 points</span></div>
      <div class="comp"><span>Automatismes</span><div class="bar"><span style="width:${au.score / 6 * 100}%"></span></div><span class="num small">${fmt(au.score)}/6</span></div>
      <div class="comp"><span>Problèmes</span><div class="bar"><span style="width:${pb.score / 14 * 100}%"></span></div><span class="num small">${fmt(pb.score)}/14</span></div>
      <div class="row"><a class="btn" href="#copie" data-act="copy" data-i="${e.auto}">Copie d'automatismes</a><a class="btn" href="#copie" data-act="copy" data-i="${e.pb}">Copie de problèmes</a></div></section>
      <div class="row"><a class="btn primary" href="#progres">Voir mes progrès</a></div></div>`;
  }

  /* ---------- Mes progrès ---------- */
  function scrProg() {
    const p = P(), ex = p.exams.filter(e => e.type === 'auto'), last3 = ex.slice(-3), avg = last3.length ? last3.reduce((s, e) => s + e.score, 0) / last3.length : null;
    const pex = p.exams.filter(e => e.type === 'pb').slice(-3), pavg = pex.length ? pex.reduce((s, e) => s + e.score, 0) / pex.length : null;
    const W = 320, H = 150, N = Math.max(ex.length, 2), px = i => 34 + i * (W - 54) / (N - 1), py = v => H - 24 - (v / 6) * (H - 40);
    const pts = ex.map((e, i) => `${px(i)},${py(e.score)}`).join(' ');
    const tot = Object.values(p.notions).reduce((s, x) => s + x.tot, 0), good = Object.values(p.notions).reduce((s, x) => s + x.ok, 0);
    return `<div class="wrap"><div><p class="eyebrow">Mes progrès</p><h1>Où j'en suis</h1></div>
    <div class="grid2">
      <section class="card"><p class="eyebrow">Note estimée en mathématiques</p><div class="score20"><span class="big num">${avg != null && pavg != null ? fmt(Math.round((avg + pavg) * 2) / 2) : '–'}</span><span>/ 20</span></div>
        <div class="comp"><span>Automatismes</span><div class="bar"><span style="width:${(avg || 0) / 6 * 100}%"></span></div><span class="num small">${avg == null ? '–' : fmt(avg)}/6</span></div>
        <div class="comp"><span>Problèmes</span><div class="bar"><span style="width:${(pavg || 0) / 14 * 100}%"></span></div><span class="num small">${pavg == null ? '–' : fmt(pavg)}/14</span></div>
        <p class="muted small">${avg == null || pavg == null ? 'Fais au moins un examen blanc de chaque partie pour obtenir une note estimée.' : 'Moyenne des 3 derniers examens blancs de chaque partie.'} ${tot ? `En entraînement : ${good} réponses justes sur ${tot}.` : ''}</p></section>
      <section class="card chart"><p class="eyebrow">Examens blancs d'automatismes, note sur 6</p>
        ${ex.length ? `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Évolution des notes : ${ex.map(e => fmt(e.score)).join(', ')}">
          ${[0, 3, 6].map(v => `<line x1="30" x2="${W - 10}" y1="${py(v)}" y2="${py(v)}" stroke="var(--line)"/><text x="8" y="${py(v) + 4}">${v}</text>`).join('')}
          ${ex.length > 1 ? `<polygon points="${px(0)},${py(0)} ${pts} ${px(ex.length - 1)},${py(0)}" fill="var(--accent-soft)"/><polyline points="${pts}" fill="none" stroke="var(--accent)" stroke-width="2.5"/>` : ''}
          ${ex.map((e, i) => `<circle cx="${px(i)}" cy="${py(e.score)}" r="${i === ex.length - 1 ? 5 : 3.5}" fill="${i === ex.length - 1 ? 'var(--sun)' : 'var(--accent)'}" stroke="var(--surface)" stroke-width="1.5"/>`).join('')}
          <text x="${px(ex.length - 1)}" y="${py(ex[ex.length - 1].score) - 10}" text-anchor="middle" style="fill:var(--ink);font-weight:700">${fmt(ex[ex.length - 1].score)}</text></svg>` : '<p class="muted small">Aucun examen blanc pour l’instant.</p>'}</section>
    </div>
    <section class="card"><h3>Carte des notions</h3><div class="legend">${[1, 2, 3, 4].map(l => lvChip(l)).join('')}<span>Fond rosé : à renforcer</span></div>
      ${Object.keys(BANK.DOMS).map(d => `<div><p class="small muted" style="margin:6px 0">${BANK.DOMS[d]}</p><div class="map">${BANK.NOTIONS.filter(x => x.dom === d).map(it => { const st = p.notions[it.id]; return `<button class="tile ${isWeak(it.id) ? 'weak' : ''}" data-l="${levelOf(it.id)}" data-act="notion" data-id="${it.id}" data-go="entrainer"><b>${it.name}</b>${lvChip(levelOf(it.id), st && st.val)}<span class="small muted num">${st && st.tot ? `${st.hist.filter(x => x.ok).length} / ${st.hist.length} récentes` : 'Pas commencé'}</span></button>`; }).join('')}</div></div>`).join('')}
    </section>
    ${p.exams.length ? `<section class="card"><h3>Historique des examens blancs</h3><div class="tbl"><table class="res-table"><thead><tr><th>Date</th><th>Épreuve</th><th>Note</th><th></th></tr></thead><tbody>${p.exams.map((e, i) => ({ e, i })).reverse().map(({ e, i }) => `<tr><td class="num">${new Date(e.date).toLocaleDateString('fr-FR')}</td><td>${{ auto: 'Automatismes', pb: 'Problèmes', full: 'Brevet complet' }[e.type]}</td><td class="num"><b>${fmt(e.score)} / ${e.max}</b></td><td><a href="#copie" data-act="copy" data-i="${i}">Voir la copie</a></td></tr>`).join('')}</tbody></table></div></section>` : ''}
    </div>`;
  }

  /* ---------- Réglages, sauvegarde, confidentialité ---------- */
  function exportCode() { const json = JSON.stringify({ app: 'capbrevet', v: 1, profile: P() }); return btoa(unescape(encodeURIComponent(json))); }
  function scrSettings() {
    const p = P();
    return `<div class="wrap narrow"><div><p class="eyebrow">Réglages</p><h1>Mon profil</h1></div>
    <section class="card"><h3>Profil</h3><p>Pseudo : <b>${esc(p.pseudo)}</b> · créé le ${new Date(p.created).toLocaleDateString('fr-FR')}</p>
      <div class="row"><button class="btn" data-act="switchProfile">Changer de profil</button></div></section>
    <section class="card"><h3>Sauvegarde et changement d'appareil</h3>
      <p class="small muted">Tes progrès sont enregistrés dans ce navigateur. Pour les garder en sécurité ou les retrouver sur un autre appareil, copie ton code de sauvegarde et colle-le de l'autre côté. Pense à le faire de temps en temps.</p>
      <div class="row"><button class="btn primary" data-act="export">Copier mon code de sauvegarde</button></div>
      ${S.expMsg ? `<p class="small" role="status">${S.expMsg}</p><textarea id="expcode" readonly aria-label="Code de sauvegarde">${exportCode()}</textarea>` : ''}
      <label for="impcode" class="eyebrow">Restaurer une sauvegarde</label><textarea id="impcode" data-bind="imp" placeholder="Colle ici un code de sauvegarde…">${esc(S.imp)}</textarea>
      <div class="row"><button class="btn" data-act="import">Restaurer</button></div>${S.impMsg ? `<p class="small" role="status">${S.impMsg}</p>` : ''}</section>
    <section class="card"><h3>Aménagement (pour l'adulte)</h3>
      <label class="row"><input type="checkbox" id="tiers" data-act="tiers" ${p.settings.tiers ? 'checked' : ''}> <span>Tiers-temps aux examens blancs (20 min deviennent 26 min 40 s)</span></label>
      <p class="small muted">À activer seulement si l'élève bénéficie d'un tiers-temps à l'examen.</p></section>
    <section class="card"><h3>Supprimer ce profil</h3><p class="small muted">Efface définitivement les réponses, copies et progrès de ce profil sur cet appareil.</p>
      ${S.del ? `<div class="confirm"><b>Supprimer « ${esc(p.pseudo)} » ?</b><p>Cette action est définitive.</p><div class="row"><button class="btn primary" data-act="delYes">Supprimer</button><button class="btn" data-act="delNo">Annuler</button></div></div>` : `<button class="btn" data-act="delAsk">Supprimer le profil</button>`}</section>
    <p class="small"><a href="#confidentialite">Confidentialité</a></p></div>`;
  }
  function scrPrivacy() {
    return `<div class="wrap narrow"><div><p class="eyebrow">Confidentialité</p><h1>Tes données restent chez toi</h1></div>
    <section class="card"><ul class="rules">
      <li>Tu utilises seulement un <b>pseudo</b>. On ne te demande jamais ton nom, ton e-mail, ton âge, ton collège, ta photo ou ta position.</li>
      <li>Tes réponses, tes copies d'examen et tes progrès sont enregistrés <b>uniquement sur cet appareil</b>, dans ce navigateur.</li>
      <li>Rien n'est envoyé à personne : pas de publicité, pas de mesure d'audience, pas de traceur.</li>
      <li>La correction est faite par l'application elle-même, avec des règles mathématiques. Aucune intelligence artificielle ne lit tes réponses.</li>
      <li>Tu peux copier ta sauvegarde pour changer d'appareil, et supprimer ton profil à tout moment dans les réglages.</li>
      <li>Attention : si tu effaces les données de ton navigateur, tes progrès sont effacés aussi. Garde ton code de sauvegarde.</li>
    </ul><p class="small muted">Seule la police d'écriture est chargée depuis Internet dans cette version. Elle sera intégrée à l'application dans la version installable.</p></section>
    <a class="btn" href="${DB.cur ? '#reglages' : '#accueil'}">Retour</a></div>`;
  }

  /* =====================================================================
     Routeur et évènements
     ===================================================================== */
  const ROUTES = { accueil: scrHome, entrainer: scrTrain, serie: scrSeries, redaction: scrRed, brevet: scrBrevet, examen: scrExam, 'examen-pb': scrExamPb, copie: scrCopy, progres: scrProg, reglages: scrSettings, confidentialite: scrPrivacy };
  const TAB = { accueil: 'accueil', entrainer: 'entrainer', serie: 'entrainer', redaction: 'entrainer', brevet: 'brevet', examen: 'brevet', 'examen-pb': 'brevet', copie: 'brevet', progres: 'progres', reglages: '', confidentialite: '' };
  const view = document.getElementById('view');
  const coarse = matchMedia('(pointer:coarse)').matches;
  function route() { const h = location.hash.slice(1); return ROUTES[h] ? h : 'accueil'; }
  let last = '', active = null;
  function render(keep) {
    let r = route();
    if (!DB.cur || !P()) { document.body.classList.remove('exam'); document.body.classList.add('noprofile'); view.innerHTML = r === 'confidentialite' ? scrPrivacy() : scrWelcome(); bindForm(); return; }
    document.body.classList.remove('noprofile');
    const c = P().cur;
    if (c && Date.now() >= c.end) { if (c.type === 'pb') submitExamPb(true); else submitExam(true); return; }
    const er = c ? (c.type === 'pb' ? 'examen-pb' : 'examen') : null;
    if (c && r !== er && r !== 'brevet' && r !== 'confidentialite') { /* épreuve en cours : on y retourne */ location.hash = er; return; }
    const y = window.scrollY;
    document.body.classList.toggle('exam', r === 'examen' || r === 'examen-pb' || r === 'copie');
    document.querySelectorAll('nav.tabs a').forEach(a => { if (a.dataset.r === TAB[r]) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    view.innerHTML = ROUTES[r]();
    if (coarse) view.querySelectorAll('.mathin').forEach(i => i.setAttribute('inputmode', 'none'));
    if (keep && r === last) window.scrollTo(0, y); else window.scrollTo(0, 0);
    last = r; active = null;
    const pb = document.getElementById('pbadge'); if (pb) pb.textContent = P().pseudo;
  }
  function bindForm() {
    const f = document.getElementById('pform'); if (!f) return;
    const inpt = document.getElementById('pseudo'), warn = document.getElementById('pwarn');
    inpt.addEventListener('input', () => { warn.textContent = /^[A-ZÀ-Ý][a-zà-ÿ]+[\s-]+[A-ZÀ-Ý][a-zà-ÿ]+$/.test(inpt.value.trim()) ? 'Ce pseudo ressemble à un prénom suivi d’un nom. Choisis plutôt un surnom.' : ''; });
    f.addEventListener('submit', e => { e.preventDefault(); const v = inpt.value.trim().slice(0, 20); if (!v) return; newProfile(v); location.hash = 'accueil'; render(); });
  }
  window.addEventListener('hashchange', () => render());
  window.addEventListener('pagehide', () => { if (DB.cur) save(); });

  let savedTimer = null;
  function markSaved() { const el = document.getElementById('saved'); if (!el) return; const d = new Date(); el.hidden = false; el.textContent = `Enregistré à ${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`; }
  document.addEventListener('focusin', e => { if (e.target.classList && e.target.classList.contains('mathin')) active = e.target; });
  function bind(el) {
    const k = el.dataset.bind; if (!k) return; const v = el.value;
    if (k === 'ex') S.series.ans = v;
    else if (k === 'ex-u') S.series.unit = v;
    else if (k === 'exam') { const c = P().cur; c.ans[c.i] = v; const b = document.querySelector(`.qnav button[data-i="${c.i}"]`); if (b) b.classList.toggle('ans', !!v.trim()); save(); }
    else if (k === 'exam-u') { const c = P().cur; c.units[c.i] = v; save(); }
    else if (k === 'calc') { const r = calcEval(v); calcOut = v.trim() ? (Number.isFinite(r) ? '= ' + n(Math.round(r * 1e6) / 1e6) : '…') : ''; const o = document.getElementById('calcout'); if (o) o.textContent = calcOut; }
    else if (k === 'imp') S.imp = v;
    else if (k.startsWith('red:')) S.red.f[k.slice(4)] = v;
    else if (k.startsWith('pb|')) { const [, i, pid, f] = k.split('|'); const c = P().cur; const A = (c.ans[i] ||= {}); (A[pid] ||= {})[f] = v; save(); }
    else if (k.startsWith('pbs|')) { const [, i, j, f] = k.split('|'); const c = P().cur; const A = (c.ans[i] ||= {}); A.steps ||= []; const st = (A.steps[j] ||= {}); if (f === 'k') { const ex = pbExercises(c)[i]; st.k = v === '' ? '' : ex.qty[+v].key; st.unit = ''; save(); render(true); return; } st[f] = v; save(); }
    else if (k.startsWith('pbf|')) { const i = k.split('|')[1]; const c = P().cur; (c.ans[i] ||= {}).final = v; save(); }
  }
  document.addEventListener('input', e => bind(e.target));
  document.addEventListener('change', e => { if (e.target.tagName === 'SELECT') bind(e.target); });
  document.addEventListener('pointerdown', e => { if (e.target.closest('.kbd button')) e.preventDefault(); });
  document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('mathin') && route() === 'serie') { const b = document.querySelector('[data-act="check"],[data-act="next"]'); if (b) { e.preventDefault(); b.click(); } } });

  function key(k) {
    let el = active && document.body.contains(active) ? active : view.querySelector('.mathin:not([readonly]):not([disabled])'); if (!el) return;
    const s = el.selectionStart ?? el.value.length, t = el.selectionEnd ?? s, v = el.value;
    if (k === 'left' || k === 'right') { const pp = Math.max(0, Math.min(v.length, s + (k === 'left' ? -1 : 1))); el.focus(); el.setSelectionRange(pp, pp); return; }
    let nv, c;
    if (k === 'del') { if (s !== t) { nv = v.slice(0, s) + v.slice(t); c = s; } else if (s > 0) { nv = v.slice(0, s - 1) + v.slice(s); c = s - 1; } else return; }
    else { const ins = k === 'pow' ? '^' : k === '√' ? '√(' : k === 'frac' ? '/' : k === 'ou' ? ' ou ' : k === ';' ? ' ; ' : k === 'cm' ? ' cm' : k; nv = v.slice(0, s) + ins + v.slice(t); c = s + ins.length; if (k === '√') nv = nv.slice(0, c) + ')' + nv.slice(c); }
    el.value = nv; el.focus(); try { el.setSelectionRange(c, c); } catch (_) { }
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act; const p = P();
    switch (a) {
      case 'key': key(b.dataset.k); break;
      case 'size': { const cur = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scale')) || 1; const nn = cur >= 1.24 ? 1 : cur >= 1.11 ? 1.25 : 1.12; document.documentElement.style.setProperty('--scale', nn); try { localStorage.setItem('capbrevet.scale', nn); } catch (_) { } break; }
      case 'theme': { const r = document.documentElement, c = r.dataset.theme; const nn = !c ? 'dark' : c === 'dark' ? 'light' : ''; if (nn) r.dataset.theme = nn; else delete r.dataset.theme; b.title = 'Thème : ' + (nn === 'dark' ? 'sombre' : nn === 'light' ? 'clair' : 'automatique'); try { localStorage.setItem('capbrevet.theme', nn); } catch (_) { } break; }
      case 'pickProfile': DB.cur = b.dataset.id; save(); location.hash = 'accueil'; render(); break;
      case 'switchProfile': DB.cur = null; save(); render(); break;
      case 'daily': newSeries('daily'); if (route() === 'serie') render(); break;
      case 'series': newSeries('notion', S.notion, +b.dataset.l || levelOf(S.notion) || 1); if (route() === 'serie') render(); break;
      case 'pickL': S.pickL = +b.dataset.l; render(true); break;
      case 'notion': S.notion = b.dataset.id; S.flash = false; S.pickL = null; if (b.dataset.go) { location.hash = b.dataset.go; break; } if (route() === 'entrainer') { render(true); if (innerWidth < 1100) document.getElementById('detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } break;
      case 'flash': S.flash = !S.flash; render(true); break;
      case 'choose': { const k = b.dataset.bind, v = b.dataset.i; if (k === 'ex') S.series.ans = v; else { const c = p.cur; c.ans[c.i] = v; save(); } render(true); break; }
      case 'check': { const se = S.series, q = se.list[se.i]; const g = M.grade(q, se.ans, se.unit); if (g.s === 'vide') { se.empty = true; render(true); se.empty = false; break; }
        se.fb = g; se.first = g.s; const up = record(q, g, se.hints); if (up) se.ups.push({ t: up, n: q.notion }); render(true); break; }
      case 'retry': { const se = S.series; se.fb = null; se.retried = true; se.ans = ''; se.unit = ''; render(true); break; }
      case 'hint': S.series.hints++; render(true); break;
      case 'show': S.series.show = true; render(true); break;
      case 'next': { const se = S.series; se.res.push(se.first === 'ok' ? 'ok' : 'ko'); Object.assign(se, { i: se.i + 1, ans: '', unit: '', hints: 0, fb: null, show: false, retried: false, first: null, qStart: Date.now() }); render(); break; }
      case 'redNew': newRed(); if (route() === 'redaction') render(); break;
      case 'redGrade': S.red.g = gradeRed(S.red); render(true); break;
      case 'model': S.showModel = !S.showModel; render(true); break;
      case 'startExam': startExam(); location.hash = 'examen'; break;
      case 'startExamPb': startExamPb(null); location.hash = 'examen-pb'; break;
      case 'startFull': startExam(true); location.hash = 'examen'; break;
      case 'goex': p.cur.ex = Math.max(0, Math.min(5, +b.dataset.i)); save(); render(); break;
      case 'pbChoose': { const c = p.cur, A = (c.ans[b.dataset.ex] ||= {}); (A[b.dataset.part] ||= {}).res = b.dataset.i; save(); render(true); break; }
      case 'pbAddStep': { const c = p.cur, A = (c.ans[c.ex] ||= {}); (A.steps ||= []).push({ k: '', pose: '', val: '', unit: '' }); save(); render(true); break; }
      case 'pbDelStep': { const c = p.cur, A = (c.ans[c.ex] ||= {}); A.steps.splice(+b.dataset.i, 1); save(); render(true); break; }
      case 'goq': p.cur.i = +b.dataset.i; save(); render(true); break;
      case 'prevq': p.cur.i--; save(); render(true); break;
      case 'nextq': p.cur.i++; save(); render(true); break;
      case 'askSubmit': p.cur.confirm = true; render(); break;
      case 'cancelSubmit': p.cur.confirm = false; render(true); break;
      case 'submit': if (p.cur.type === 'pb') submitExamPb(false); else submitExam(false); break;
      case 'copy': S.copy = +b.dataset.i; break;
      case 'export': { const code = exportCode(); S.expMsg = 'Code copié. Colle-le dans un message ou un fichier pour le garder.'; try { navigator.clipboard.writeText(code).catch(() => { S.expMsg = 'Sélectionne le code ci-dessous et copie-le.'; render(true); }); } catch (_) { S.expMsg = 'Sélectionne le code ci-dessous et copie-le.'; } render(true); break; }
      case 'import': { try { const o = JSON.parse(decodeURIComponent(escape(atob(S.imp.trim())))); if (o.app !== 'capbrevet' || !o.profile) throw 0; const id = 'p' + Date.now().toString(36); o.profile.cur = null; DB.profiles[id] = o.profile; DB.cur = id; save(); S.imp = ''; S.impMsg = `Sauvegarde de « ${esc(o.profile.pseudo)} » restaurée.`; } catch (err) { S.impMsg = 'Ce code n’est pas valide. Vérifie que tu l’as copié en entier.'; } render(true); break; }
      case 'tiers': p.settings.tiers = b.checked; save(); break;
      case 'delAsk': S.del = true; render(true); break;
      case 'delNo': S.del = false; render(true); break;
      case 'delYes': delete DB.profiles[DB.cur]; DB.cur = null; S.del = false; save(); location.hash = 'accueil'; render(); break;
    }
  });

  /* Chronomètres : examen (heure de fin fixée au départ) et séries Averti(e)/Expert(e) */
  function tick() {
    if (!DB.cur || !P()) return; const c = P().cur, r = route();
    if (c) {
      const left = c.end - Date.now();
      const er = c.type === 'pb' ? 'examen-pb' : 'examen';
      if (left <= 0) { if (r === er) { if (c.type === 'pb') submitExamPb(true); else submitExam(true); } return; }
      let w = ''; if (left <= 60000) w = 'Il reste moins d’1 minute. Tes réponses sont enregistrées.'; else if (left <= 300000) w = 'Il reste moins de 5 minutes.';
      if (w !== c.warn) { c.warn = w; if (r === er) { render(true); return; } }
      const t = document.getElementById('timer'); if (t && r === er) { t.textContent = clock(left); t.classList.toggle('low', left < 300000); }
    }
    const ch = document.getElementById('chrono'); if (ch && S.series && !S.series.fb) ch.textContent = clock(Date.now() - S.series.qStart);
  }
  setInterval(tick, 1000);

  load();
  try { const th = localStorage.getItem('capbrevet.theme'); if (th) document.documentElement.dataset.theme = th; const sc = localStorage.getItem('capbrevet.scale'); if (sc) document.documentElement.style.setProperty('--scale', sc); } catch (_) { }
  render();
})();
