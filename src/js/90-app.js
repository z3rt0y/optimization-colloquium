
/* ================= tickets ================= */
const DEFN = ['', 'Задача оптимизации', 'Локальный минимум', 'Строгий локальный минимум', 'Глобальный минимум', 'Градиент через линейное приближение', 'Производная по направлению', 'Гессиан', 'Стационарная и седловая точки', 'Допустимое направление', 'Положительно (полу)определённая матрица', 'Выпуклая комбинация и выпуклое множество', 'Выпуклая функция', 'Строго и µ-сильно выпуклая функция', 'L-гладкость', 'Число обусловленности', 'Условие Поляка–Лоясевича', 'Направление спуска', 'GD с постоянным шагом', 'Условие Армихо (бэктрекинг)', 'Метод Ньютона (направление Ньютона)', 'Активное ограничение', 'Лагранжиан', 'Условия ККТ', 'Двойственная функция и двойственная задача'];
const TICKETS = {
  1: [3, 10, 14, 22, 23, 24], 2: [1, 2, 4, 5, 8, 12], 3: [6, 7, 9, 11, 13, 15], 4: [16, 17, 18, 19, 21, 20], 5: [5, 12, 15, 18, 19, 23],
  6: [3, 10, 9, 11, 14, 16], 7: [6, 7, 8, 13, 21, 24], 8: [1, 2, 4, 17, 22, 20], 9: [3, 6, 13, 15, 19, 24], 10: [2, 7, 9, 12, 17, 20],
  11: [1, 5, 8, 11, 22, 21], 12: [4, 10, 14, 16, 18, 23], 13: [8, 10, 9, 17, 18, 23], 14: [1, 3, 6, 12, 16, 21], 15: [4, 5, 11, 14, 19, 24],
  16: [2, 7, 13, 15, 22, 20], 17: [5, 8, 10, 14, 22, 20], 18: [3, 9, 11, 17, 23, 24], 19: [4, 7, 12, 13, 19, 21], 20: [1, 2, 6, 16, 15, 18]
};
const THM_OF = { 1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E', 6: 'F', 7: 'F', 8: 'C', 9: 'F', 10: 'E', 11: 'D', 12: 'A', 13: 'B', 14: 'D', 15: 'C', 16: 'A', 17: 'G', 18: 'B', 19: 'G', 20: 'G' };
const THMS = {
  A: { t: 'Линейная сходимость GD (linear convergence of GD)', s: 'если f µ-сильно выпукла и L-гладкая, то при α = 1/L: f(xₖ) − f⋆ ≤ (1 − µ/L)ᵏ (f(x₀) − f⋆).', w: 'Доказательство: лекция 3, сл. 14. Опора — лемма о спуске (f(x⁺) ≤ f(x) − ‖∇f‖²/(2L)) и неравенство f⋆ ≥ f(x) − ‖∇f‖²/(2µ) из лекции 2, сл. 34–37.', rel: [14, 13, 18, 16] },
  B: { t: 'Критерий выпуклости 2-го порядка (second-order convexity criterion)', s: 'f ∈ C² на открытом выпуклом C выпукла ⇔ ∇²f(x) ⪰ 0 для всех x ∈ C.', w: 'Доказательство: лекция 2, сл. 16–20 (сужение на прямую φ(t) = f(x + td) и формула Тейлора с интегральным остатком); то же в Renegar, Prop. 1.4.1.', rel: [12, 10, 7] },
  C: { t: 'Достаточное условие 2-го порядка (second-order sufficient condition)', s: 'если f ∈ C², ∇f(x⋆) = 0 и ∇²f(x⋆) ≻ 0, то x⋆ — строгий локальный минимум.', w: 'Формулировка: лекция 1, сл. 19. Доказательство строится на формуле Тейлора 2-го порядка и оценке pᵀ∇²f(x⋆)p ≥ λmin‖p‖² с λmin &gt; 0.', rel: [3, 7, 10, 8] },
  D: { t: 'Критерий выпуклости 1-го порядка (first-order convexity criterion)', s: 'дифференцируемая f на открытом выпуклом C выпукла ⇔ f(y) ≥ f(x) + ⟨∇f(x), y − x⟩ для всех x, y ∈ C.', w: 'Доказательство: лекция 2, сл. 11–15 (⇒ через предел разностного отношения, ⇐ через сумму двух неравенств в точке z = (1 − t)x + ty).', rel: [12, 5, 6] },
  E: { t: 'Локальная квадратичная сходимость метода Ньютона (local quadratic convergence)', s: 'если ∇f(x⋆) = 0, ∇²f(x⋆) ≻ 0 и гессиан M-липшицев, то вблизи x⋆: ‖x⁺ − x⋆‖ ≤ (M/2m)‖x − x⋆‖².', w: 'Доказательство: лекция 5, сл. 7 (∇f(x) = ∫H(x⋆ + te)e dt, затем ‖H⁻¹‖ ≤ 1/m и липшицевость гессиана); близкая оценка — Renegar §1.6.', rel: [20, 7, 10] },
  F: { t: 'Достаточность условий ККТ (sufficiency of the KKT conditions)', s: 'если f, gᵢ выпуклы, hⱼ аффинны и (x⋆, λ⋆, ν⋆) удовлетворяет ККТ, то x⋆ — глобальный минимум.', w: 'Слайды второй части лекции 2 (39–64) в твоём PDF отсутствуют. Идея: L(·, λ⋆, ν⋆) выпукла по x и стационарна в x⋆, значит x⋆ её минимизирует; для допустимого x: f(x) ≥ L(x, λ⋆, ν⋆) ≥ L(x⋆, λ⋆, ν⋆) = f(x⋆) по дополняющей нежёсткости.', rel: [23, 22, 12, 21] },
  G: { t: 'Лемма о спуске и следствие (descent lemma and its corollary)', s: 'если ∇f L-липшицев, то f(y) ≤ f(x) + ⟨∇f(x), y − x⟩ + (L/2)‖y − x‖²; для шага GD f(x⁺) ≤ f(x) − α(1 − Lα/2)‖∇f(x)‖².', w: 'Доказательство: лекция 2, сл. 27–31 и лекция 3, сл. 7–8 (формула Ньютона–Лейбница, Коши–Буняковский, интеграл ∫Lt dt = L/2).', rel: [14, 18, 5] }
};

const STEPS = [];
const THM_TID = { A: 5, B: 2, C: 3, D: 1, E: 6, F: 7, G: 4 };

function initApp() {
  const cards = Array.from(document.querySelectorAll('.card[data-d]'));
  const byD = {};
  cards.forEach(c => { byD[+c.dataset.d] = c; });
  const ticketsOf = d => Object.keys(TICKETS).map(Number).filter(t => TICKETS[t].indexOf(d) >= 0);
  const sel = document.getElementById('ticket-sel') || document.createElement('select');
  const lk = (id, text) => document.getElementById(id) ? '<a href="#' + id + '">' + text + '</a>' : text;
  cards.forEach(c => {
    const d = +c.dataset.d, tg = c.querySelector('.tickets');
    if (!tg) return;
    const ts = ticketsOf(d);
    tg.innerHTML = 'Билеты ' + ts.map(t => '<a href="#ticket-panel" data-t="' + t + '">' + t + '</a>').join(' · ');
    tg.querySelectorAll('a').forEach(a => a.addEventListener('click', e => { e.preventDefault(); sel.value = a.dataset.t; applyTicket(); document.getElementById('ticket-panel').scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' }); }));
  });
  const panel = document.getElementById('ticket-panel') || document.createElement('section');
  function applyTicket() {
    const t = +sel.value;
    const set = t ? TICKETS[t] : null;
    cards.forEach(c => { c.hidden = !!set && set.indexOf(+c.dataset.d) < 0; });
    const tid = t ? THM_TID[THM_OF[t]] : 0;
    document.querySelectorAll('.card.proof').forEach(c => { c.hidden = !!t && +c.dataset.t !== tid; });
    document.querySelectorAll('.toc li[data-t]').forEach(li => li.classList.toggle('dim', !!t && +li.dataset.t !== tid));
    document.querySelectorAll('.cards').forEach(box => {
      const any = Array.from(box.children).some(ch => !ch.hidden);
      box.hidden = !any;
      const h = box.previousElementSibling;
      if (h && h.classList.contains('block-h')) h.hidden = !any;
    });
    document.querySelectorAll('.toc li[data-d]').forEach(li => li.classList.toggle('dim', !!set && set.indexOf(+li.dataset.d) < 0));
    if (!t) { panel.hidden = true; panel.innerHTML = ''; return; }
    const th = THMS[THM_OF[t]];
    panel.innerHTML =
      '<h2>Билет ' + t + '</h2>' +
      '<div class="k-mut">Часть 1 · 6 определений по 0.5 балла, нужно не меньше 4 верных</div>' +
      '<ol>' + set.map(d => '<li>' + (byD[d] ? lk('d' + d, DEFN[d]) : DEFN[d] + ' <span class="k-mut">(убрано с сайта)</span>') + '</li>').join('') + '</ol>' +
      '<div class="thm"><div class="lbl">Часть 2 · сформулировать и доказать (3 балла)</div>' +
      '<p><b>' + th.t + '</b>: <span class="m">' + th.s + '</span></p>' +
      '<p class="k-mut">' + th.w + '</p>' +
      '<p>' + [lk('t' + THM_TID[THM_OF[t]], 'Разбор доказательства по шагам: теорема ' + THM_TID[THM_OF[t]]), lk('practice', 'задачи части 3'), lk('workbook', 'рабочая тетрадь')].filter(x => x.indexOf('<a') === 0).join(' · ') + '</p>' +
      '<p>Нужные определения: ' + th.rel.map(d => '<a href="#d' + d + '">№ ' + d + '</a>').join(', ') + '</p></div>' +
      '<p class="k-mut" style="margin:10px 0 0">Ниже оставлены только определения и теорема этого билета; задачи части 3 общие для всех билетов. Чтобы вернуть всё, выбери «все 24 определения».</p>';
    panel.hidden = false;
    FIGS.forEach(f => f.resize());
  }
  sel.addEventListener('change', applyTicket);

  /* cheat sheet: links to hidden (filtered) cards reset the filter first */
  const csNav = id => { const t = document.getElementById(id); if (t && (t.hidden || t.closest('[hidden]'))) { sel.value = '0'; applyTicket(); } };
  document.querySelectorAll('#cheat .cheat-body a[href^="#"]').forEach(a => a.addEventListener('click', () => csNav(a.getAttribute('href').slice(1))));
  document.querySelectorAll('a[href="#cheat"]').forEach(a => a.addEventListener('click', () => { const d = document.getElementById('cheat'); if (d) d.open = true; }));
  initCheat(csNav);

  const body = document.body;
  const dummy = () => document.createElement('input');
  const qz = document.getElementById('opt-quiz') || dummy(), cp = document.getElementById('opt-compact') || dummy(), hd = document.getElementById('opt-hide') || dummy();
  qz.addEventListener('change', () => { body.classList.toggle('quiz', qz.checked); document.querySelectorAll('.exam.open').forEach(e => e.classList.remove('open')); STEPS.forEach(s => s.reset(qz.checked)); });
  cp.addEventListener('change', () => { body.classList.toggle('compact', cp.checked); if (!cp.checked) setTimeout(() => FIGS.forEach(f => f.resize()), 30); });
  hd.addEventListener('change', () => body.classList.toggle('hide-known', hd.checked));
  document.querySelectorAll('.exam').forEach(e => {
    e.addEventListener('click', () => { if (body.classList.contains('quiz')) e.classList.add('open'); });
    e.setAttribute('tabindex', '0');
    e.addEventListener('keydown', ev => { if ((ev.key === 'Enter' || ev.key === ' ') && body.classList.contains('quiz')) { ev.preventDefault(); e.classList.add('open'); } });
  });

  const KEY = 'optdefs-known-v1';
  let known = [];
  try { known = JSON.parse(localStorage.getItem(KEY) || '[]'); if (!Array.isArray(known)) known = []; } catch (_) { known = []; }
  function syncKnown() {
    cards.forEach(c => {
      const d = +c.dataset.d, k = known.indexOf(d) >= 0;
      c.classList.toggle('is-known', k);
      const cb = c.querySelector('.known input');
      if (cb) cb.checked = k;
      const li = document.querySelector('.toc li[data-d="' + d + '"] .k');
      if (li) li.textContent = k ? '✓' : '';
    });
    const pn = document.getElementById('prog-n');
    if (pn) pn.textContent = known.filter(d => byD[d]).length;
    try { localStorage.setItem(KEY, JSON.stringify(known)); } catch (_) {}
  }
  cards.forEach(c => {
    const cb = c.querySelector('.known input');
    if (!cb) return;
    cb.addEventListener('change', () => {
      const d = +c.dataset.d;
      known = known.filter(z => z !== d);
      if (cb.checked) known.push(d);
      syncKnown();
    });
  });
  syncKnown();


  /* proofs: step-by-step reveal */
  document.querySelectorAll('.card.proof .steps-wrap').forEach(w => {
    const items = Array.from(w.querySelectorAll('ol.steps > li:not(.part)'));
    const parts = Array.from(w.querySelectorAll('ol.steps > li.part'));
    let mode = false, shown = items.length;
    const bar = document.createElement('div'); bar.className = 'steps-ctl';
    const bMode = button(bar, 'По шагам', () => { mode = !mode; shown = mode ? 0 : items.length; apply(); });
    const bNext = button(bar, 'Следующий шаг', () => { shown = Math.min(items.length, shown + 1); apply(); }, 'primary');
    const cnt = document.createElement('span'); cnt.className = 'cnt'; bar.appendChild(cnt);
    w.insertBefore(bar, w.firstChild);
    function apply() {
      items.forEach((li, i) => { li.hidden = mode && i >= shown; });
      parts.forEach(p => { let nx = p.nextElementSibling; while (nx && nx.classList.contains('part')) nx = nx.nextElementSibling; p.hidden = !!nx && nx.hidden; });
      bNext.hidden = !mode || shown >= items.length;
      bMode.textContent = mode ? 'Показать всё' : 'По шагам';
      cnt.textContent = mode ? 'открыто шагов: ' + shown + ' из ' + items.length : '';
    }
    STEPS.push({ reset: on => { mode = on; shown = on ? 0 : items.length; apply(); } });
    apply();
  });

  /* practice: answer checkers and calculator links */
  document.querySelectorAll('.qa[data-task]').forEach(renderQA);
  document.querySelectorAll('[data-load]').forEach(b => b.addEventListener('click', () => {
    const parts = b.dataset.load.split(':');
    const api = WAPI[parts[0]];
    if (!api) return;
    api.load(parts[1]);
    const el = document.getElementById(parts[0]);
    if (el) el.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
  }));

  /* known theorems and solved tasks */
  function marks(sel, attr, key, cbPrefix, progId, countSet) {
    const els = Array.from(document.querySelectorAll(sel));
    let list = [];
    try { list = JSON.parse(localStorage.getItem(key) || '[]'); if (!Array.isArray(list)) list = []; } catch (_) { list = []; }
    const sync = () => {
      els.forEach(c => {
        const id = c.dataset[attr], k = list.indexOf(id) >= 0;
        c.classList.toggle('is-known', k);
        const cb = document.getElementById(cbPrefix + id);
        if (cb) cb.checked = k;
        const li = document.querySelector('.toc li[data-' + attr + '="' + id + '"] .k');
        if (li) li.textContent = k ? '✓' : '';
      });
      const pe = document.getElementById(progId);
      if (pe) pe.textContent = list.filter(z => countSet.indexOf(z) >= 0).length;
      try { localStorage.setItem(key, JSON.stringify(list)); } catch (_) {}
    };
    els.forEach(c => {
      const id = c.dataset[attr], cb = document.getElementById(cbPrefix + id);
      if (!cb) return;
      cb.addEventListener('change', () => { list = list.filter(z => z !== id); if (cb.checked) list.push(id); sync(); });
    });
    sync();
  }
  const thmSet = Array.from(document.querySelectorAll('.card.proof[data-t]')).map(c => c.dataset.t).filter(t => +t <= 7);
  const taskSet = Array.from(document.querySelectorAll('.card.taskc[data-p]')).map(c => c.dataset.p).filter(p => document.getElementById('solved-' + p));
  const setTot = (id, n) => { const e = document.getElementById(id); if (e) e.textContent = n; const g = document.getElementById(id.replace('prog-', 'pg-').replace('-tot', '')); if (g) g.hidden = n === 0; };
  setTot('prog-n-tot', cards.length);
  setTot('prog-t-tot', thmSet.length);
  setTot('prog-p-tot', taskSet.length);
  marks('.card.proof[data-t]', 't', 'optdefs-known-t-v1', 'known-t', 'prog-t', thmSet);
  marks('.card.taskc[data-p]', 'p', 'optdefs-solved-v1', 'solved-', 'prog-p', taskSet);

  /* parts removed from the site: hide buttons that point to them */
  document.querySelectorAll('[data-load]').forEach(bt => { if (!document.getElementById(bt.dataset.load.split(':')[0])) bt.hidden = true; });
  if (!document.getElementById('lightbox')) document.querySelectorAll('[data-photo]').forEach(bt => { bt.hidden = true; });

  /* theme switch (auto / light / dark) */
  const th = document.getElementById('opt-theme');
  if (th) {
    let cur = 'auto';
    try { cur = localStorage.getItem('optdefs-theme') || 'auto'; } catch (_) {}
    th.value = cur;
    th.addEventListener('change', () => {
      if (th.value === 'auto') document.documentElement.removeAttribute('data-theme');
      else document.documentElement.setAttribute('data-theme', th.value);
      try { localStorage.setItem('optdefs-theme', th.value); } catch (_) {}
    });
  }

  /* mock tickets: definition self-check */
  document.querySelectorAll('.defcheck[data-defs]').forEach(ol => {
    const ds = ol.dataset.defs.split(',').map(Number), id = ol.dataset.id;
    const boxes = [];
    ds.forEach(d => {
      const li = document.createElement('li');
      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.id = 'dc-' + id + '-' + d;
      cb.setAttribute('aria-label', 'написал верно: ' + DEFN[d]);
      const det = document.createElement('details');
      const sm = document.createElement('summary'); sm.textContent = '№ ' + d + ' · ' + DEFN[d];
      const body = document.createElement('div'); body.className = 'dc-body';
      const src = document.querySelector('#d' + d + ' .exam .body');
      body.innerHTML = src ? src.innerHTML + '<p class="k-mut"><a href="#d' + d + '">открыть карточку № ' + d + '</a></p>' : '<p class="k-mut">Карточка № ' + d + ' убрана с сайта.</p>';
      det.append(sm, body);
      li.append(cb, det);
      ol.appendChild(li);
      boxes.push(cb);
    });
    const sum = document.createElement('div'); sum.className = 'dc-sum';
    const txt = document.createElement('span');
    sum.appendChild(txt);
    button(sum, 'Сбросить', () => { boxes.forEach(b => { b.checked = false; }); upd(); }, 'small');
    ol.after(sum);
    function upd() {
      const n = boxes.filter(b => b.checked).length;
      txt.innerHTML = 'верно ' + n + ' из ' + ds.length + ' &nbsp;' + (n >= 4 ? pill(true, 'блокирующая часть пройдена (≥ 4)') : pill(false, 'нужно ещё ' + (4 - n) + ' до порога 4'));
    }
    boxes.forEach(b => b.addEventListener('change', upd));
    upd();
  });

  document.querySelectorAll('.codebox').forEach(box => {
    const pre = box.querySelector('pre');
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'copy'; b.textContent = 'копировать';
    b.addEventListener('click', () => {
      const text = pre.textContent;
      const done = () => { b.textContent = 'скопировано'; setTimeout(() => { b.textContent = 'копировать'; }, 1400); };
      const fallback = () => { const r = document.createRange(); r.selectNodeContents(pre); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'выделено, Ctrl+C'; setTimeout(() => { b.textContent = 'копировать'; }, 2000); };
      try { navigator.clipboard.writeText(text).then(done, fallback); } catch (_) { fallback(); }
    });
    box.appendChild(b);
  });

  /* workbook photos: lightbox */
  const lb = document.getElementById('lightbox');
  if (lb) {
    const thumbs = Array.from(document.querySelectorAll('#wb-photos [data-photo]'));
    const shots = thumbs.map(t => ({ src: t.querySelector('img').getAttribute('src'), alt: t.querySelector('img').alt, cap: t.parentElement.querySelector('figcaption').textContent }));
    const img = lb.querySelector('img'), cap = lb.querySelector('.lb-cap');
    let cur = 0, back = null;
    const show = i => { cur = (i + shots.length) % shots.length; img.src = shots[cur].src; img.alt = shots[cur].alt; cap.textContent = shots[cur].cap + ' · ' + (cur + 1) + ' из ' + shots.length; lb.querySelector('[data-lb="orig"]').href = shots[cur].src; };
    const open = (i, from) => { back = from || null; show(i); lb.hidden = false; document.body.style.overflow = 'hidden'; lb.querySelector('[data-lb="close"]').focus(); };
    const close = () => { lb.hidden = true; document.body.style.overflow = ''; if (back) back.focus(); };
    document.querySelectorAll('[data-photo]').forEach(b => b.addEventListener('click', () => open(+b.dataset.photo, b)));
    lb.querySelector('[data-lb="close"]').addEventListener('click', close);
    lb.querySelector('[data-lb="prev"]').addEventListener('click', () => show(cur - 1));
    lb.querySelector('[data-lb="next"]').addEventListener('click', () => show(cur + 1));
    lb.addEventListener('click', e => { if (e.target === lb) close(); });
    document.addEventListener('keydown', e => {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(cur - 1);
      else if (e.key === 'ArrowRight') show(cur + 1);
    });
  }

  const tocd = document.getElementById('toc-details');
  if (tocd && window.innerWidth < 1060) tocd.open = false;
}

/* ================= boot ================= */
function boot() {
  readTokens();
  initApp();
  document.querySelectorAll('.widget[data-w]').forEach(el => {
    const fn = WIDGETS[el.dataset.w];
    if (!fn) return;
    try { fn(el, el.id, el.dataset); }
    catch (err) { console.error('widget', el.id, err); const p = document.createElement('p'); p.className = 'how'; p.textContent = 'Виджет не загрузился: ' + err.message; el.appendChild(p); }
  });
  const hero = heroArt();
  const rerender = () => { readTokens(); FIGS.forEach(f => f.render()); if (hero) hero(); };
  if (window.matchMedia) {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', rerender);
  }
  new MutationObserver(rerender).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { FIGS.forEach(f => f.render()); if (hero) hero(); });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
