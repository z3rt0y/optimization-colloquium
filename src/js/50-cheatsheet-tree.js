
/* ================= cheat sheet: derivation tree ================= */
const CS_NODES = [
  [1, 'Задача оптимизации', 'optimization problem', 'd1', 'A', 0],
  [2, 'Глобальный минимум', 'global minimum', 'd4', 'A', 1],
  [3, 'Локальный минимум', 'local minimum', 'd2', 'A', 2],
  [4, 'Строгий лок. минимум', 'strict local minimum', 'd3', 'A', 3],
  [5, 'Градиент', 'gradient', 'd5', 'B', 0],
  [7, 'Произв. по направлению', 'directional derivative', 'd6', 'B', 1],
  [8, 'Направление спуска', 'descent direction', 'd17', 'B', 2],
  [10, 'Стационарная точка', 'stationary point', 'd8', 'B', 3],
  [6, 'Линейное приближение', 'first-order approx.', 'd5', 'B2', 1],
  [9, 'Допустимое направление', 'feasible direction', 'd9', 'B2', 2],
  [11, 'Гессиан', 'Hessian', 'd7', 'C', 0],
  [12, 'Кривизна dᵀHd', 'curvature along d', 'd7', 'C', 1],
  [13, 'PD / PSD матрица', 'positive (semi)definite', 'd10', 'C', 2],
  [15, 'Тип точки, седло', 'min / max / saddle', 'd8', 'C', 3],
  [14, 'Тейлор 2-го порядка', 'second-order approx.', 'd7', 'C2', 1],
  [16, 'Выпуклая комбинация', 'convex combination', 'd11', 'D', 0],
  [17, 'Выпуклое множество', 'convex set', 'd11', 'D', 1],
  [18, 'Выпуклая функция', 'convex function', 'd12', 'D', 2],
  [20, 'µ-сильно выпуклая', 'µ-strongly convex', 'd13', 'D', 3],
  [19, 'Строго выпуклая', 'strictly convex', 'd13', 'D2', 2],
  [22, 'Число обусловленности', 'condition number, κ = L/µ', 'd15', 'E', 2],
  [21, 'L-гладкость', 'L-smooth', 'd14', 'E', 3],
  [23, 'Условие PL', 'Polyak–Łojasiewicz', 'd16', 'E', 4],
  [28, 'Метод Ньютона', 'Newton’s method', 'd20', 'F', 0],
  [27, 'Бэктрекинг', 'backtracking', 'd19', 'F', 1],
  [26, 'Условие Армихо', 'Armijo condition', 'd19', 'F', 2],
  [24, 'GD, шаг 1/L', 'gradient descent', 'd18', 'F', 3],
  [25, 'Скорость GD', 'linear convergence', 't5', 'F', 4]
];
const CS_EDGES = [
  [1, 2, 'p', '«лучшая точка» буквально'], [2, 3, 'p', '«все x» заменили на «близкие x»'], [3, 4, 'p', '≥ → >, без самой точки'],
  [5, 6, 'p', 'h = y − x, выкинули o'], [5, 7, 'p', 'h = td, поделили на t'], [7, 8, 'p', 'знак числа ∇fᵀd'], [8, 9, 'p', 'то же, но условие на Ω'], [8, 10, 'p', 'в минимуме нет направления спуска'], [3, 10, 's', 'смотрим на локальный минимум при Ω = ℝⁿ'],
  [5, 11, 'p', 'то же разложение для ∇f вместо f'], [11, 12, 'p', 'φ″(0) = dᵀHd'], [7, 12, 's', 'производная по направлению ещё раз'], [12, 13, 'p', 'знак кривизны во всех направлениях'], [12, 14, 'p', 'поправка на изгиб ½hᵀHh'], [5, 14, 's', 'линейная часть из 5'],
  [13, 15, 'p', 'знак H решает тип'], [10, 15, 's', 'подставили ∇f = 0'], [14, 15, 's', 'при ∇f = 0 остаётся ½hᵀHh'],
  [16, 17, 'p', 'm = 2: θ = (1 − t, t)'], [17, 18, 'p', 'та же комбинация в аргументе и в значениях'], [13, 18, 's', '⇔ H ⪰ 0 везде'], [18, 19, 'p', '≤ → <, как 4 из 3'], [18, 20, 'p', 'добавили запас −(µ/2)t(1 − t)‖x − y‖²'], [13, 20, 's', '⇔ H ⪰ µI'],
  [20, 21, 'p', 'зеркало: изгиб сверху ≤ L'], [21, 22, 'p', 'κ = L/µ'], [20, 22, 's', 'µ — нижняя граница'], [20, 23, 'p', 'минимизировали касательную форму, выкинули выпуклость'],
  [21, 24, 'p', 'оценка сверху ⇒ α < 2/L, при α = 1/L убывание ‖∇f‖²/(2L)'], [8, 24, 's', 'd = −∇f'], [24, 25, 'p', 'подставили PL'], [23, 25, 's', 'PL'], [22, 25, 's', '1 − µ/L = 1 − 1/κ'],
  [24, 26, 'p', 'L не знаем — гарантию проверяем'], [26, 27, 'p', 'пока нарушено: α ← βα'], [8, 27, 's', 'конечен: o(α) проигрывает главному члену'],
  [14, 28, 'p', 'минимизируем 14 по h: ∇f + Hh = 0'], [13, 28, 's', 'нужно H ≻ 0'], [24, 28, 'lk', 'GD = Ньютон, где H заменили на LI']
];
const CS_ROWS = { A: 40, B: 160, B2: 232, C: 334, C2: 406, D: 524, D2: 596, E: 706, F: 826 };
const CS_BANDS = [
  [14, 100, 'Блок 1 · что ищем', ''],
  [134, 292, 'Блок 2 · первый порядок: наклон', '▼ как найти, не перебирая всё? смотрим локально'],
  [308, 466, 'Блок 3 · второй порядок: изгиб', '▼ ∇f = 0 не говорит, min это или седло'],
  [498, 656, 'Блок 4 · выпуклость', '▼ когда локальный min = глобальный?'],
  [680, 764, 'Блок 5 · кривизна сверху и PL', '▼ кривизна снизу (µ) есть, а сверху?'],
  [800, 914, 'Блок 6 · алгоритмы', '▼ как теперь искать минимум']
];
function initCheat(onNav) {
  const det = document.getElementById('cheat');
  const svg = document.getElementById('cs-svg');
  const info = document.getElementById('cs-info');
  if (!det || !svg) return;
  const NS = 'http://www.w3.org/2000/svg';
  const W = 180, H = 48, XS = [20, 214, 408, 602, 796];
  const pos = {};
  CS_NODES.forEach(n => { pos[n[0]] = { x: XS[n[5]], y: CS_ROWS[n[4]], d: n }; });
  const el = (tag, at, parent) => { const e = document.createElementNS(NS, tag); Object.keys(at || {}).forEach(k => e.setAttribute(k, at[k])); if (parent) parent.appendChild(e); return e; };
  let built = false, mode = 'go', sel = null;
  const edgeEls = [], nodeEls = {};
  function path(a, b, kind) {
    const A = pos[a], B = pos[b];
    const key = a + '-' + b;
    if (key === '14-28') return 'M ' + A.x + ' ' + (A.y + 24) + ' C ' + (A.x - 90) + ' ' + (A.y + 24) + ' 9 ' + (A.y + 36) + ' 9 ' + (A.y + 96) + ' L 9 ' + (B.y - 8) + ' C 9 ' + (B.y + 18) + ' 12 ' + (B.y + 24) + ' ' + (B.x - 1) + ' ' + (B.y + 24);
    if (key === '7-12') return 'M ' + (A.x + 170) + ' ' + (A.y + H) + ' L 401 ' + (A.y + H + 12) + ' L 401 ' + (B.y - 12) + ' L ' + (B.x + 170) + ' ' + B.y;
    if (key === '5-14') return 'M ' + (A.x + 172) + ' ' + (A.y + H) + ' L 207 ' + (A.y + H + 12) + ' L 207 ' + (B.y + 12) + ' L ' + B.x + ' ' + (B.y + 24);
    if (key === '20-22') return 'M ' + (A.x + 10) + ' ' + (A.y + H) + ' L 595 ' + (A.y + H + 12) + ' L 595 ' + (B.y - 12) + ' L ' + (B.x + 170) + ' ' + B.y;
    if (key === '8-24') return 'M ' + (A.x + 172) + ' ' + (A.y + H) + ' L 595 ' + (A.y + H + 12) + ' L 595 ' + (B.y + 12) + ' L ' + B.x + ' ' + (B.y + 24);
    if (key === '8-27') return 'M ' + (A.x + 8) + ' ' + (A.y + H) + ' L 401 ' + (A.y + H + 12) + ' L 401 ' + (B.y + 12) + ' L ' + (B.x + W) + ' ' + (B.y + 24);
    if (key === '13-28') return 'M ' + (A.x + 8) + ' ' + (A.y + H) + ' L 401 ' + (A.y + H + 12) + ' L 401 470 L 14 470 L 14 ' + (B.y + 18) + ' L ' + B.x + ' ' + (B.y + 30);
    if (key === '24-28') return 'M ' + (A.x + 90) + ' ' + (A.y + H) + ' C ' + (A.x + 90) + ' ' + (A.y + H + 44) + ' ' + (B.x + 90) + ' ' + (B.y + H + 44) + ' ' + (B.x + 90) + ' ' + (B.y + H);
    if (A.y === B.y) {
      if (B.x > A.x) return 'M ' + (A.x + W) + ' ' + (A.y + 24) + ' L ' + (B.x - 1) + ' ' + (B.y + 24);
      return 'M ' + A.x + ' ' + (A.y + 24) + ' L ' + (B.x + W + 1) + ' ' + (B.y + 24);
    }
    if (B.y > A.y) {
      const sx = A.x + 90, sy = A.y + H, tx = B.x + 90, ty = B.y - 1, m = (ty - sy) / 2;
      if (sx === tx) return 'M ' + sx + ' ' + sy + ' L ' + tx + ' ' + ty;
      return 'M ' + sx + ' ' + sy + ' C ' + sx + ' ' + (sy + m) + ' ' + tx + ' ' + (ty - m) + ' ' + tx + ' ' + ty;
    }
    const sx = B.x > A.x ? A.x + W : A.x, sy = A.y + 24, tx = B.x + 90, ty = B.y + H + 1;
    return 'M ' + sx + ' ' + sy + ' C ' + tx + ' ' + sy + ' ' + tx + ' ' + sy + ' ' + tx + ' ' + ty;
  }
  function build() {
    built = true;
    const defs = el('defs', {}, svg);
    [['m', 'cs-mk-m'], ['o', 'cs-mk-o'], ['a', 'cs-mk-a'], ['v', 'cs-mk-v']].forEach(p => {
      const mk = el('marker', { id: 'cs-ar-' + p[0], viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
      el('path', { d: 'M0,0 L10,5 L0,10 z', class: p[1] }, mk);
    });
    const gb = el('g', {}, svg), ge = el('g', {}, svg), gn = el('g', {}, svg), gh = el('g', {}, svg);
    CS_BANDS.forEach((b, i) => {
      if (i % 2) el('rect', { x: 0, y: b[0], width: 1000, height: b[1] - b[0], class: 'cs-band' }, gb);
      const t = el('text', { x: 140, y: b[0] + 14, class: 'cs-bh' }, gh);
      const t1 = el('tspan', {}, t); t1.textContent = b[2];
      if (b[3]) { const t2 = el('tspan', { class: 'cs-bq', dx: 14 }, t); t2.textContent = b[3]; }
    });
    CS_EDGES.forEach(e => {
      const p = el('path', { d: path(e[0], e[1], e[2]), class: 'cs-e ' + e[2], 'marker-end': e[2] === 'lk' ? 'url(#cs-ar-v)' : 'url(#cs-ar-m)' }, ge);
      if (e[2] === 'lk') p.setAttribute('marker-start', 'url(#cs-ar-v)');
      const tt = el('title', {}, p); tt.textContent = e[0] + ' → ' + e[1] + ': ' + e[3];
      edgeEls.push({ e, p });
    });
    const lk = CS_EDGES.filter(e => e[2] === 'lk')[0];
    if (lk) { const lt = el('text', { x: 401, y: CS_ROWS.F + H + 22, class: 'cs-lk', 'text-anchor': 'middle' }, gh); lt.textContent = 'GD = Ньютон, где H заменили на LI'; }
    CS_NODES.forEach(n => {
      const P = pos[n[0]];
      const exists = !!document.getElementById(n[3]);
      const a = exists ? el('a', { href: '#' + n[3], class: 'cs-node', 'data-n': n[0] }, gn) : el('g', { class: 'cs-node gone', 'data-n': n[0], tabindex: 0 }, gn);
      const tl = el('title', {}, a); tl.textContent = n[0] + '. ' + n[1] + ' — ' + (exists ? (n[3][0] === 't' ? 'теорема ' + n[3].slice(1) : 'карточка № ' + n[3].slice(1)) : 'карточка убрана с сайта');
      el('rect', { x: P.x, y: P.y, width: W, height: H, rx: 9 }, a);
      el('circle', { cx: P.x + 17, cy: P.y + 24, r: 11, class: 'b' }, a);
      const bn = el('text', { x: P.x + 17, y: P.y + 28, 'text-anchor': 'middle', class: 'bn' }, a); bn.textContent = n[0];
      const t = el('text', { x: P.x + 35, y: P.y + 21, class: 't' }, a); t.textContent = n[1];
      const en = el('text', { x: P.x + 35, y: P.y + 37, class: 'e' }, a); en.textContent = n[2];
      nodeEls[n[0]] = { a, t, en };
      a.addEventListener('mouseenter', () => { if (!sel) hl(n[0]); });
      a.addEventListener('mouseleave', () => { if (!sel) hl(null); });
      a.addEventListener('focus', () => { if (!sel) hl(n[0]); });
      a.addEventListener('blur', () => { if (!sel) hl(null); });
      a.addEventListener('click', ev => {
        if (mode === 'rel' || !exists) { ev.preventDefault(); sel = sel === n[0] ? null : n[0]; hl(sel); return; }
        if (onNav) onNav(n[3]);
      });
    });
    Object.keys(nodeEls).forEach(k => {
      ['t', 'en'].forEach(f => {
        const tx = nodeEls[k][f], avail = W - 42;
        try { if (tx.getComputedTextLength() > avail) { tx.setAttribute('textLength', avail); tx.setAttribute('lengthAdjust', 'spacingAndGlyphs'); } } catch (_) {}
      });
    });
    Array.from(gh.querySelectorAll('text.cs-bh')).forEach(t => {
      try { const bb = t.getBBox(); const r = el('rect', { x: bb.x - 6, y: bb.y - 2, width: bb.width + 12, height: bb.height + 4, rx: 4, class: 'cs-bhbg' }); gh.insertBefore(r, t); } catch (_) {}
    });
  }
  const nameOf = k => CS_NODES.filter(n => n[0] === k)[0];
  function hl(k) {
    svg.classList.toggle('hl', k != null);
    Object.keys(nodeEls).forEach(j => { nodeEls[j].a.classList.remove('rel', 'sel'); });
    edgeEls.forEach(o => {
      o.p.classList.remove('in', 'out', 'lkon');
      o.p.setAttribute('marker-end', o.e[2] === 'lk' ? 'url(#cs-ar-v)' : 'url(#cs-ar-m)');
    });
    if (k == null) { info.innerHTML = 'Наведи на понятие (на телефоне включи «показать связи» и нажми): оранжевым подсветится, из чего оно выводится, синим — что из него следует.'; return; }
    nodeEls[k].a.classList.add('sel');
    const ins = [], outs = [];
    const lks = [];
    edgeEls.forEach(o => {
      const e = o.e;
      if (e[2] === 'lk') {
        if (e[0] === k || e[1] === k) { const other = e[0] === k ? e[1] : e[0]; o.p.classList.add('lkon'); nodeEls[other].a.classList.add('rel'); lks.push([other, e[3]]); }
      } else if (e[1] === k) {
        o.p.classList.add('in'); o.p.setAttribute('marker-end', 'url(#cs-ar-o)');
        nodeEls[e[0]].a.classList.add('rel'); ins.push([e[0], e[3], e[2]]);
      } else if (e[0] === k) {
        o.p.classList.add('out'); o.p.setAttribute('marker-end', 'url(#cs-ar-a)');
        nodeEls[e[1]].a.classList.add('rel'); outs.push([e[1], e[3], e[2]]);
      }
    });
    const n = nameOf(k);
    const tgt = n[3][0] === 't' ? 'теорема ' + n[3].slice(1) : 'карточка № ' + n[3].slice(1);
    let h = '<b>' + k + '. ' + n[1] + '</b> <span class="en">(' + n[2] + ')</span>';
    h += ins.length ? '<br><span class="k-warn">откуда:</span> ' + ins.map(x => x[0] + ' ' + nameOf(x[0])[1] + ' — ' + x[1]).join('; ') : '<br><span class="k-warn">откуда:</span> начало блока';
    if (outs.length) h += '<br><span style="color:var(--accent)">куда ведёт:</span> ' + outs.map(x => x[0] + ' ' + nameOf(x[0])[1]).join(', ');
    if (lks.length) h += '<br><span style="color:var(--c-violet)">связка:</span> ' + lks.map(x => x[0] + ' ' + nameOf(x[0])[1] + ' — ' + x[1]).join('; ');
    h += document.getElementById(n[3]) ? '<br><a href="#' + n[3] + '" class="cs-go">→ открыть: ' + tgt + '</a>' : '<br><span class="k-mut">карточка убрана с сайта</span>';
    info.innerHTML = h;
    const go = info.querySelector('.cs-go');
    if (go && onNav) go.addEventListener('click', () => onNav(n[3]));
  }
  det.querySelectorAll('input[name="csmode"]').forEach(r => r.addEventListener('change', () => { mode = r.value; if (mode === 'go') { sel = null; hl(null); } }));
  const cl = document.getElementById('cs-close');
  if (cl) cl.addEventListener('click', () => { det.open = false; det.scrollIntoView({ block: 'start' }); });
  const ensure = () => { if (det.open && !built) build(); };
  det.addEventListener('toggle', ensure);
  ensure();
}
