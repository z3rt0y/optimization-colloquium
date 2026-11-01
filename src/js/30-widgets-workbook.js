
/* ================= workbook: error multipliers vs step (П5) ================= */
const ALS = [[1 / 6, '1/6'], [1 / 4, '1/4'], [1 / 3, '1/3'], [2 / 5, '2/5']];
function behav(m) {
  const e = 1e-9;
  if (Math.abs(m) < e) return { t: 'за 1 шаг в оптимум', ok: true };
  if (Math.abs(m - 1) < e) return { t: 'стоит на месте', ok: null };
  if (m > 1) return { t: 'монотонно растёт ×' + num(m, 3), ok: false };
  if (m > 0) return { t: 'монотонно, ×' + num(m, 3), ok: true };
  if (Math.abs(m + 1) < e) return { t: 'колебания без затухания', ok: null };
  if (m > -1) return { t: 'колебания, затухают ×' + num(-m, 3), ok: true };
  return { t: 'колебания, растут ×' + num(-m, 3), ok: false };
}
WIDGETS.mult = (root, wid) => {
  let a = 1, c = 3, alpha = 1 / 4, yz = false;
  const ks = 8;
  const lam = () => [2 * a, 2 * c];
  const Lmax = () => Math.max(Math.abs(2 * a), Math.abs(2 * c), 0.1);
  const amax = () => 1.35 * 2 / Lmax();
  const c1 = row(root);
  numBox(c1, wid, { name: 'a', label: 'a (при x²)', value: a, step: 0.5, on: z => { a = z; sA.range(0, amax()); upd(); } });
  numBox(c1, wid, { name: 'c', label: 'c (при y²)', value: c, step: 0.5, on: z => { c = z; sA.range(0, amax()); upd(); } });
  const sA = slider(c1, wid, { name: 'alpha', label: 'шаг α', min: 0, max: amax(), step: 0.001, value: alpha, fmt: z => num(z, 4), on: z => { alpha = z; upd(); } });
  checkbox(c1, wid, { name: 'yz', label: ' старт с y₀ = 0', checked: false, on: b => { yz = b; upd(); } });
  const c2 = row(root);
  ALS.forEach(pr => button(c2, 'α = ' + pr[1], () => { alpha = pr[0]; sA.set(alpha); upd(); }));
  button(c2, 'α = 2/L', () => { alpha = 2 / Lmax(); sA.set(alpha); upd(); });
  const fr = figsRow(root);
  const fM = new Fig(fr, { aspect: 0.72, minH: 240, maxH: 380, label: 'Множители ошибок 1 − αλ в зависимости от шага' });
  const fE = new Fig(fr, { aspect: 0.72, minH: 240, maxH: 380, label: 'Ошибки по координатам на первых шагах' });
  const lg = document.createElement('div'); lg.className = 'legend-row';
  lg.innerHTML = '<span><span class="sw a"></span>по x: 1 − 2aα</span><span><span class="sw o"></span>по y: 1 − 2cα</span><span><span class="sw band g"></span>|множитель| &lt; 1: ошибка сжимается</span><span><span class="sw dash m"></span>α = 2/L</span>';
  root.appendChild(lg);
  const ro = readout(root);
  fM.draw = ctx => {
    const L = lam(), A = amax();
    const mx = s => 1 - L[0] * s, my = s => 1 - L[1] * s;
    const lo = Math.min(-1.6, mx(A), my(A)) - 0.1;
    const v = new View(fM, [0, A], [Math.max(lo, -4), 1.25], { pad: { l: 40, b: 22 } });
    clipV(ctx, v); ctx.fillStyle = al(T.green, 0.12); ctx.fillRect(v.pad.l, v.sy(1), v.W, v.sy(-1) - v.sy(1)); ctx.restore();
    axes(ctx, v, { xlab: 'α', ylab: '1 − αλ' });
    hline(ctx, v, -1, al(T.red, 0.8), [4, 4], 1.2);
    hline(ctx, v, 1, al(T.muted, 0.7), [4, 4], 1.2);
    const a2 = 2 / Lmax();
    vline(ctx, v, a2, al(T.muted, 0.9), [5, 4], 1.3);
    label(ctx, '2/L', v.sx(a2) + 4, v.pad.t + 12, { color: T.muted, font: '11px ' + MATHF, bg: T.surface });
    ALS.forEach(pr => { if (pr[0] < A) { vline(ctx, v, pr[0], al(T.muted, 0.25), null, 1); label(ctx, pr[1], v.sx(pr[0]), v.pad.t + v.H - 10, { color: T.muted, font: '10px ' + MONO, align: 'center', bg: T.surface }); } });
    curve(ctx, v, mx, { color: T.accent, width: 2.4 });
    curve(ctx, v, my, { color: T.orange, width: 2.4 });
    vline(ctx, v, alpha, T.ink, null, 1.4);
    const px = mx(alpha), py = my(alpha);
    dot(ctx, v.sx(alpha), v.sy(clamp(px, v.y0, v.y1)), 5.5, T.accent, T.surface, 2);
    dot(ctx, v.sx(alpha), v.sy(clamp(py, v.y0, v.y1)), 5.5, T.orange, T.surface, 2);
    label(ctx, num(px, 3), v.sx(alpha) + 9, v.sy(clamp(px, v.y0, v.y1)) - 11, { color: T.accent, font: '11px ' + MONO, bg: T.surface });
    label(ctx, num(py, 3), v.sx(alpha) + 9, v.sy(clamp(py, v.y0, v.y1)) + 13, { color: T.orange, font: '11px ' + MONO, bg: T.surface });
  };
  fE.draw = ctx => {
    const L = lam(), m = [1 - L[0] * alpha, 1 - L[1] * alpha];
    const e0 = [1, yz ? 0 : 1];
    const ex = [], ey = [];
    for (let k = 0; k <= ks; k++) { ex.push(e0[0] * Math.pow(m[0], k)); ey.push(e0[1] * Math.pow(m[1], k)); }
    let Y = 1.35;
    ex.concat(ey).forEach(z => { if (isFinite(z)) Y = Math.max(Y, Math.abs(z) * 1.1); });
    Y = Math.min(Y, 40);
    const v = new View(fE, [-0.4, ks + 0.4], [-Y, Y], { pad: { l: 40, b: 22 } });
    axes(ctx, v, { xlab: 'k', ylab: 'ошибка' });
    const draw = (arr, col) => {
      clipV(ctx, v); ctx.strokeStyle = col; ctx.lineWidth = 1.8; ctx.beginPath();
      arr.forEach((z, k) => { const y = v.sy(clamp(z, -Y * 2, Y * 2)); if (k) ctx.lineTo(v.sx(k), y); else ctx.moveTo(v.sx(k), y); });
      ctx.stroke(); ctx.restore();
      arr.forEach((z, k) => { if (Math.abs(z) <= Y) dot(ctx, v.sx(k), v.sy(z), 3.6, col, T.surface, 1.2); });
    };
    draw(ex, T.accent);
    draw(ey, T.orange);
  };
  function upd() {
    fM.render(); fE.render();
    const L = lam();
    const rows = ALS.map(pr => pr[0]);
    if (!ALS.some(pr => Math.abs(pr[0] - alpha) < 1e-9)) rows.push(alpha);
    let h = '<div class="row">f = ' + linFmt([[a, 'x²'], [c, 'y²']]) + ': гессиан diag(' + num(L[0], 3) + ', ' + num(L[1], 3) + '), координаты не связаны ⇒ eₖ₊₁ = (1 − αλ)·eₖ отдельно по x и по y</div>';
    h += '<table><tr><th>α</th><th>по x: 1 − ' + num(L[0], 3) + 'α</th><th>по y: 1 − ' + num(L[1], 3) + 'α</th><th>поведение x</th><th>поведение y</th><th>из любой точки</th></tr>';
    rows.forEach(s => {
      const mx = 1 - L[0] * s, my = 1 - L[1] * s;
      const bx = behav(mx), by = behav(my);
      const g = Math.max(Math.abs(mx), Math.abs(my)) < 1 - 1e-9;
      const lab = ALS.filter(pr => Math.abs(pr[0] - s) < 1e-9);
      const cur = Math.abs(s - alpha) < 1e-9;
      h += '<tr' + (cur ? ' style="font-weight:700"' : '') + '><td>' + (lab.length ? lab[0][1] : num(s, 4)) + (cur ? ' ◂' : '') + '</td><td>' + num(mx, 4) + '</td><td>' + num(my, 4) + '</td><td>' + bx.t + '</td><td>' + by.t + '</td><td>' + yes(g, 'сходится', 'нет гарантии') + '</td></tr>';
    });
    h += '</table>';
    h += '<div class="row">гарантия из любой точки ⇔ max|1 − αλᵢ| &lt; 1 ⇔ 0 &lt; α &lt; 2/L = ' + num(2 / Lmax(), 4) + '</div>';
    if (yz) {
      const mx = 1 - L[0] * alpha;
      h += '<div class="row">y₀ = 0 ⇒ yₖ = 0 при любом α: судьбу решает только множитель по x (' + num(mx, 4) + ') ⇒ ' + (Math.abs(mx) < 1 ? pill(true, 'сходится') : pill(false, 'не сходится')) + '. Это частный старт, а не гарантия.</div>';
    }
    ro.innerHTML = h;
  }
  upd();
};

/* ================= workbook: when the Hessian does not decide (П2) ================= */
const ZERO2 = [[0, 0], [0, 0]];
const DEG = {
  h1: { name: 'x² − y²', f: (x, y) => x * x - y * y, H: [[2, 0], [0, -2]], kind: 'saddle', why: 'H(0) знаконеопределён: λ = 2 и −2. Тест 2-го порядка решает сразу: вдоль x функция растёт, вдоль y убывает ⇒ седло.' },
  h2: { name: '−x² − y²', f: (x, y) => -x * x - y * y, H: [[-2, 0], [0, -2]], kind: 'max', why: 'H(0) = −2I ≺ 0 ⇒ строгий локальный максимум. Он глобальный: f ≤ 0 = f(0) всюду.' },
  h3: { name: 'x⁴ + y⁴', f: (x, y) => x ** 4 + y ** 4, H: ZERO2, kind: 'min', why: 'H(0) = 0, тест молчит. Смотрим на саму функцию: f ≥ 0 = f(0), равенство только в 0 ⇒ строгий глобальный минимум.' },
  h4: { name: 'x⁴ − y⁴', f: (x, y) => x ** 4 - y ** 4, H: ZERO2, kind: 'saddle', why: 'H(0) = 0, такой же, как у x⁴ + y⁴. Но f(t, 0) = t⁴ &gt; 0 и f(0, t) = −t⁴ &lt; 0: рядом с 0 есть точки и выше, и ниже ⇒ седло, не экстремум.' },
  b5: { name: '−x⁴ − y⁴ (бонус)', f: (x, y) => -(x ** 4) - y ** 4, H: ZERO2, kind: 'max', why: 'Снова H(0) = 0, но f ≤ 0 = f(0) ⇒ строгий максимум. Нулевой гессиан совместим и с минимумом, и с максимумом, и с седлом.' },
  b1: { name: 'x² + y⁴ (бонус)', f: (x, y) => x * x + y ** 4, H: [[2, 0], [0, 0]], kind: 'min', why: 'H(0) = diag(2, 0) ⪰ 0, но вырожден: необходимое условие выполнено, достаточное — нет. f ≥ 0 = f(0), равенство только в 0 ⇒ строгий минимум.' },
  b2: { name: 'x² − y⁴ (бонус)', f: (x, y) => x * x - y ** 4, H: [[2, 0], [0, 0]], kind: 'saddle', why: 'Гессиан тот же, diag(2, 0), что у x² + y⁴. Но f(0, t) = −t⁴ &lt; 0 ⇒ седло: вдоль оси y квадратичный член молчит, решает член 4-го порядка.' },
  b3: { name: 'x³ − 3xy² (бонус: обезьянье седло)', f: (x, y) => x ** 3 - 3 * x * y * y, H: ZERO2, kind: 'saddle', why: 'H(0) = 0. В полярных координатах f = r³cos 3θ: три сектора с f &gt; 0 и три с f &lt; 0 ⇒ не экстремум.' }
};
const KIND_TXT = { min: 'строгий минимум', max: 'строгий максимум', saddle: 'седло (не экстремум)' };
WIDGETS.degen = (root, wid) => {
  let key = 'h3', th = 30;
  const c1 = row(root);
  selectBox(c1, wid, { name: 'fn', label: 'Функция', value: key, options: Object.keys(DEG).map(k => [k, DEG[k].name]), on: z => { key = z; upd(); } });
  slider(c1, wid, { name: 'th', label: 'направление u, угол', min: 0, max: 180, step: 1, value: th, fmt: z => Math.round(z) + '°', on: z => { th = z; upd(); } });
  const fr = figsRow(root);
  const fA = new Fig(fr, { aspect: 0.86, minH: 240, maxH: 380, label: 'Знак f(x) − f(0) вокруг начала координат' });
  const fB = new Fig(fr, { aspect: 0.86, minH: 240, maxH: 380, label: 'Срез вдоль направления u и квадратичная модель' });
  const lg = document.createElement('div'); lg.className = 'legend-row';
  lg.innerHTML = '<span>карта: синее — f &gt; f(0), оранжевое — f &lt; f(0), жирная линия — f = f(0)</span><span><span class="sw"></span>срез f(0 + su)</span><span><span class="sw dash o"></span>модель ½s²·uᵀH(0)u</span>';
  root.appendChild(lg);
  const ro = readout(root);
  const fld = {};
  const U = () => { const r = th * Math.PI / 180; return [Math.cos(r), Math.sin(r)]; };
  fA.draw = ctx => {
    const P = DEG[key], u = U();
    const v = new View(fA, [-1.2, 1.2], [-1.2, 1.2], { equal: true, pad: { l: 34, b: 20 } });
    drawField(ctx, v, cachedField(fld, key, v, P.f, { diverging: true }), { zeroBold: true });
    axes(ctx, v, { noGrid: true });
    lineWorld(ctx, v, [0, 0], u, al(T.ink, 0.55), 1.2, [5, 4]);
    arrow(ctx, v.sx(0), v.sy(0), v.sx(0.85 * u[0]), v.sy(0.85 * u[1]), T.ink, 2.2);
    label(ctx, 'u', v.sx(0.95 * u[0]), v.sy(0.95 * u[1]), { color: T.ink, font: 'italic 13px ' + MATHF, bg: T.surface, align: 'center' });
    dot(ctx, v.sx(0), v.sy(0), 5.5, T.surface, T.ink, 2);
  };
  fB.draw = ctx => {
    const P = DEG[key], u = U();
    const H = P.H, q = u[0] * (H[0][0] * u[0] + H[0][1] * u[1]) + u[1] * (H[1][0] * u[0] + H[1][1] * u[1]);
    const phi = s => P.f(s * u[0], s * u[1]), mod = s => 0.5 * s * s * q;
    const yr = yRange([phi, mod], -1.2, 1.2, { incl: 0, pad: 0.12 });
    const v = new View(fB, [-1.2, 1.2], [Math.max(yr[0], -3), Math.min(yr[1], 3)], { pad: { l: 40, b: 22 } });
    axes(ctx, v, { xlab: 's' });
    fillBetween(ctx, v, phi, () => 0, al(T.orange, 0.22), { when: s => phi(s) < -1e-12 });
    fillBetween(ctx, v, phi, () => 0, al(T.accent, 0.14), { when: s => phi(s) > 1e-12 });
    curve(ctx, v, mod, { color: T.orange, width: 1.8, dash: [6, 4] });
    curve(ctx, v, phi, { color: T.ink, width: 2.4 });
    dot(ctx, v.sx(0), v.sy(0), 4.5, T.ink);
  };
  function upd() {
    fA.render(); fB.render();
    const P = DEG[key], u = U(), H = P.H;
    const E = eig2(H[0][0], H[0][1], H[1][1]);
    const cl = classify(E.l1, E.l2, 1e-9).k;
    const q = u[0] * (H[0][0] * u[0] + H[0][1] * u[1]) + u[1] * (H[1][0] * u[0] + H[1][1] * u[1]);
    let test;
    if (cl === 'pd') test = pill(true, 'решает: H ≻ 0 ⇒ строгий минимум');
    else if (cl === 'nd') test = pill(true, 'решает: H ≺ 0 ⇒ строгий максимум');
    else if (cl === 'ind') test = pill(true, 'решает: H знаконеопределён ⇒ седло');
    else test = pill(null, 'не решает: H вырожден') + ' (есть λ = 0)';
    let lo = Infinity, hi = -Infinity;
    const r = 0.3;
    for (let i = 0; i < 720; i++) { const t = i * Math.PI / 360; const z = P.f(r * Math.cos(t), r * Math.sin(t)); lo = Math.min(lo, z); hi = Math.max(hi, z); }
    const s5 = P.f(0.5 * u[0], 0.5 * u[1]);
    let h = '<div class="row"><b>f = ' + P.name.replace(/ \(.*\)$/, '') + '</b> &nbsp; ∇f(0) = (0, 0) ⇒ 0 — стационарная точка, f(0) = 0</div>';
    h += '<div class="row">H(0) = ' + mat(H, 3) + ', λ = ' + num(E.l1, 3) + ', ' + num(E.l2, 3) + ' &nbsp; тест 2-го порядка: ' + test + '</div>';
    h += '<div class="row">вдоль u = ' + vec(u, 3) + ': uᵀH(0)u = ' + num(q, 3) + ', f(0.5·u) = ' + num(s5, 4) + '</div>';
    h += '<div class="row">на окружности ‖h‖ = 0.3 (720 направлений): f(h) − f(0) от ' + num(lo, 4) + ' до ' + num(hi, 4) + ' ⇒ ' + (lo > 1e-12 ? 'везде выше f(0)' : hi < -1e-12 ? 'везде ниже f(0)' : 'есть и выше, и ниже f(0)') + '</div>';
    h += '<div class="row">ответ: ' + pill(P.kind === 'saddle' ? false : true, KIND_TXT[P.kind]) + '</div>';
    h += '<div class="row k-mut" style="white-space:normal">' + P.why + '</div>';
    ro.innerHTML = h;
  }
  upd();
};

/* ================= workbook: Newton direction on a quadratic (П6, part 1) ================= */
const NW2 = {
  q: { name: '2(x − 3)² + (y + 2)²', opt: 'П6: 2(x − 3)² + (y + 2)²', f: (u, w) => 2 * u * u + w * w, g: (u, w) => [4 * u, 2 * w], H: () => [[4, 0], [0, 2]], quad: true },
  qm: { name: '2(x − 3)² + (x − 3)(y + 2) + (y + 2)²', opt: 'со смешанным членом (x − 3)(y + 2)', f: (u, w) => 2 * u * u + u * w + w * w, g: (u, w) => [4 * u + w, u + 2 * w], H: () => [[4, 1], [1, 2]], quad: true },
  nq: { name: '2(x − 3)² + (y + 2)² + ½(x − 3)⁴', opt: 'неквадратичная: + ½(x − 3)⁴', f: (u, w) => 2 * u * u + w * w + 0.5 * u ** 4, g: (u, w) => [4 * u + 2 * u ** 3, 2 * w], H: u => [[4 + 6 * u * u, 0], [0, 2]], quad: false }
};
WIDGETS.newton2 = (root, wid) => {
  let key = 'q', x0 = [5, 4], pts = [[5, 4]], showGD = true;
  const xs = [3, -2];
  const F = () => NW2[key];
  const fAt = p => F().f(p[0] - xs[0], p[1] - xs[1]);
  const gAt = p => F().g(p[0] - xs[0], p[1] - xs[1]);
  const HAt = p => F().H(p[0] - xs[0], p[1] - xs[1]);
  const c1 = row(root);
  selectBox(c1, wid, { name: 'fn', label: 'Функция', value: key, options: Object.keys(NW2).map(k => [k, NW2[k].opt]), on: z => { key = z; reset(); } });
  checkbox(c1, wid, { name: 'gd', label: ' показать шаг GD с α = 1/L', checked: true, on: b => { showGD = b; upd(); } });
  const c2 = row(root);
  button(c2, 'Шаг Ньютона', () => { step(); upd(); }, 'primary');
  button(c2, 'Сброс к x₀ = (5, 4)', () => { x0 = [5, 4]; reset(); });
  const fig = new Fig(root, { aspect: 0.62, minH: 260, maxH: 420, label: 'Линии уровня f, квадратичной модели и шаг Ньютона' });
  const lg = document.createElement('div'); lg.className = 'legend-row';
  lg.innerHTML = '<span><span class="sw a"></span>линии уровня f</span><span><span class="sw dash" style="border-top-color:var(--c-violet)"></span>те же уровни у модели Тейлора в текущей точке</span><span><span class="sw o"></span>шаг Ньютона d</span><span><span class="sw m"></span>шаг GD</span><span>★ x⋆ = (3, −2)</span>';
  root.appendChild(lg);
  const ro = readout(root);
  let v = null;
  const fld = {};
  function newtonDir(p) {
    const g = gAt(p), H = HAt(p);
    const det = H[0][0] * H[1][1] - H[0][1] * H[1][0];
    const d = [(-g[0] * H[1][1] + H[0][1] * g[1]) / det, (-H[0][0] * g[1] + H[1][0] * g[0]) / det];
    return { g, H, det, d };
  }
  function step() { const p = pts[pts.length - 1]; const N = newtonDir(p); if (pts.length < 8) pts.push([p[0] + N.d[0], p[1] + N.d[1]]); }
  function reset() { pts = [x0.slice()]; upd(); }
  fig.draw = ctx => {
    v = new View(fig, [-0.5, 7.5], [-6, 5.5], { equal: true, pad: { l: 34, b: 20 } });
    const p = pts[pts.length - 1], fp = fAt(p);
    const lev = [0.04, 0.15, 0.35, 0.65, 1].map(t => t * Math.max(fp, 1e-6));
    drawField(ctx, v, cachedField(fld, key + '|' + lev.map(z => z.toFixed(6)).join(','), v, (x, y) => fAt([x, y]), { levels: lev }), { contourAlpha: 0.85 });
    axes(ctx, v, { noGrid: true });
    const N = newtonDir(p), g = N.g, H = N.H;
    const model = (x, y) => { const dx = x - p[0], dy = y - p[1]; return fp + g[0] * dx + g[1] * dy + 0.5 * (H[0][0] * dx * dx + 2 * H[0][1] * dx * dy + H[1][1] * dy * dy); };
    lev.forEach(L => { const s = contourOf(v, model, L, 4); ctx.save(); drawSegs(ctx, s, T.violet, 1.6, [5, 4]); ctx.restore(); });
    star(ctx, v.sx(xs[0]), v.sy(xs[1]), 8, T.green, T.surface);
    if (showGD) {
      const Lg = Math.max(eig2(H[0][0], H[0][1], H[1][1]).l2, 1e-9);
      const q = [p[0] - g[0] / Lg, p[1] - g[1] / Lg];
      arrow(ctx, v.sx(p[0]), v.sy(p[1]), v.sx(q[0]), v.sy(q[1]), T.muted, 2, 9, [5, 3]);
      dot(ctx, v.sx(q[0]), v.sy(q[1]), 4, T.muted);
    }
    arrow(ctx, v.sx(p[0]), v.sy(p[1]), v.sx(p[0] + N.d[0]), v.sy(p[1] + N.d[1]), T.orange, 2.6, 11);
    pts.forEach((z, i) => { dot(ctx, v.sx(z[0]), v.sy(z[1]), i === pts.length - 1 ? 6.5 : 4, i === pts.length - 1 ? T.accent : al(T.accent, 0.6), T.surface, 2); if (i < 4) label(ctx, 'x' + subk(i), v.sx(z[0]) + 10, v.sy(z[1]) - 11, { color: T.accent, font: '12px ' + MATHF, bg: T.surface }); });
  };
  function upd() {
    fig.render();
    const p = pts[pts.length - 1], N = newtonDir(p), H = N.H, g = N.g;
    const nx = [p[0] + N.d[0], p[1] + N.d[1]];
    const k = pts.length - 1;
    let h = '<div class="row"><b>f = ' + F().name + '</b>, x⋆ = (3, −2), f⋆ = 0</div>';
    h += '<div class="row">k = ' + k + ': x' + subk(k) + ' = ' + vec(p, 4) + ', f = ' + num(fAt(p), 5) + ', ∇f = ' + vec(g, 4) + ', H = ' + mat(H, 4) + '</div>';
    h += '<div class="row">система H·d = −∇f: &nbsp;' + linFmt([[H[0][0], 'd₁'], [H[0][1], 'd₂']]) + ' = ' + num(-g[0], 4) + ', &nbsp;' + linFmt([[H[1][0], 'd₁'], [H[1][1], 'd₂']]) + ' = ' + num(-g[1], 4) + ' &nbsp;(det H = ' + num(N.det, 4) + ')</div>';
    h += '<div class="row">d = ' + vec(N.d, 4) + ' ⇒ x' + subk(k + 1) + ' = x' + subk(k) + ' + d = ' + vec(nx, 4) + ', f = ' + num(fAt(nx), 5) + ', ∇f = ' + vec(gAt(nx), 4) + '</div>';
    if (F().quad) h += '<div class="row" style="white-space:normal">' + pill(true, 'f квадратичная') + ' модель Тейлора 2-го порядка совпадает с f точно (пунктир лёг на сплошные линии). Шаг Ньютона ведёт в минимум модели, то есть сразу в x⋆. GD с α = 1/L делает только часть пути, если λ разные.</div>';
    else h += '<div class="row" style="white-space:normal">' + pill(null, 'f не квадратичная') + ' модель совпадает с f только около текущей точки (пунктир расходится со сплошными). Шаг ведёт в минимум модели, поэтому нужно несколько шагов; вблизи x⋆ ошибка примерно возводится в квадрат (теорема 6).</div>';
    if (pts.length > 1) {
      h += '<table><tr><th>k</th><th>xₖ</th><th>‖xₖ − x⋆‖</th><th>f(xₖ)</th></tr>';
      pts.forEach((z, i) => { h += '<tr><td>' + i + '</td><td>' + vec(z, 6) + '</td><td>' + num(Math.hypot(z[0] - xs[0], z[1] - xs[1]), 3) + '</td><td>' + num(fAt(z), 4) + '</td></tr>'; });
      h += '</table>';
    }
    ro.innerHTML = h;
  }
  drag(fig, { hit: (px, py, r) => (v && near(px, py, v.sx(pts[0][0]), v.sy(pts[0][1]), r)) ? 's' : null, move: (id, px, py) => { x0 = [+clamp(v.wx(px), v.x0, v.x1).toFixed(2), +clamp(v.wy(py), v.y0, v.y1).toFixed(2)]; pts = [x0.slice()]; upd(); } });
  upd();
};

/* ================= workbook: Armijo backtracking in 1D (П6, part 2) ================= */
const AF = { sq: F1.sq, x4: F1.x4, lch: F1.lch };
WIDGETS.armijo1 = (root, wid) => {
  let key = 'sq', x = 2, d = -4, c = 0.25, a0 = 1, beta = 0.5, simple = false, shown = 99;
  const c1 = row(root);
  selectBox(c1, wid, { name: 'fn', label: 'Функция', value: key, options: Object.keys(AF).map(k => [k, AF[k].name]), on: z => { key = z; reset(); } });
  const bx = numBox(c1, wid, { name: 'x', label: 'точка x', value: x, step: 0.5, on: z => { x = z; reset(); } });
  const bd = numBox(c1, wid, { name: 'd', label: 'направление d', value: d, step: 0.5, on: z => { d = z; reset(); } });
  button(c1, 'd = −f′(x)', () => { d = -AF[key].d1(x); bd.set(d); reset(); });
  const c2 = row(root);
  const bc = numBox(c2, wid, { name: 'c', label: 'c', value: c, step: 0.05, on: z => { c = z; reset(); } });
  const ba = numBox(c2, wid, { name: 'a0', label: 'α₀', value: a0, step: 0.25, on: z => { a0 = z > 0 ? z : a0; reset(); } });
  const bb = numBox(c2, wid, { name: 'b', label: 'множитель β', value: beta, step: 0.1, on: z => { beta = z > 0 && z < 1 ? z : beta; reset(); } });
  checkbox(c2, wid, { name: 'simple', label: ' только «f уменьшилась» (без c)', checked: false, on: b => { simple = b; reset(); } });
  const c3 = row(root);
  const bRun = button(c3, '▶ Пробовать по очереди', () => { shown = 0; bRun.disabled = true; an.start(); }, 'primary');
  button(c3, 'Все попытки сразу', () => { an.stop(); shown = 99; upd(); });
  button(c3, 'Условие П6', () => { key = 'sq'; x = 2; d = -4; c = 0.25; a0 = 1; beta = 0.5; bx.set(x); bd.set(d); bc.set(c); ba.set(a0); bb.set(beta); document.getElementById(wid + '-fn').value = 'sq'; reset(); });
  const fig = new Fig(root, { aspect: 0.5, minH: 240, maxH: 360, label: 'f(x + αd) и прямая Армихо' });
  const lg = document.createElement('div'); lg.className = 'legend-row';
  lg.innerHTML = '<span><span class="sw"></span>φ(α) = f(x + αd)</span><span><span class="sw dash o"></span>правая часть Армихо f(x) + cαf′(x)d</span><span><span class="sw dash m"></span>уровень f(x)</span><span><span class="sw band g"></span>шаги, которые принимаются</span>';
  root.appendChild(lg);
  const ro = readout(root);
  const an = animator(() => { shown++; upd(); }, () => shown >= trials().length, () => { bRun.disabled = false; }, () => RM ? 60 : 800);
  function reset() { an.stop(); shown = 99; upd(); }
  const F = () => AF[key];
  const rhs = s => simple ? F().f(x) : F().f(x) + c * s * F().d1(x) * d;
  const accept = s => simple ? F().f(x + s * d) < F().f(x) : F().f(x + s * d) <= rhs(s) + 1e-12;
  function trials() {
    const out = [];
    let s = a0;
    for (let j = 0; j < 30; j++) { const ok = accept(s); out.push({ j, s, lhs: F().f(x + s * d), r: rhs(s), ok }); if (ok) break; s *= beta; }
    return out;
  }
  fig.draw = ctx => {
    const amax = a0 * 1.08, phi = s => F().f(x + s * d);
    const yr = yRange([phi, rhs], 0, amax, { incl: F().f(x), capHi: F().f(x) + 6 * Math.max(1, Math.abs(F().f(x))) });
    const v = new View(fig, [0, amax], yr, { pad: { l: 44 } });
    axes(ctx, v, { xlab: 'α', ylab: 'φ(α)' });
    const n = 300;
    clipV(ctx, v);
    for (let i = 0; i < n; i++) { const s = amax * (i + 0.5) / n; if (accept(s)) { ctx.fillStyle = al(T.green, 0.55); ctx.fillRect(v.sx(amax * i / n), v.pad.t + v.H - 7, v.W / n + 0.7, 7); } }
    ctx.restore();
    hline(ctx, v, F().f(x), al(T.muted, 0.9), [4, 4], 1.3);
    if (!simple) curve(ctx, v, rhs, { color: T.orange, width: 2, dash: [7, 4] });
    curve(ctx, v, phi, { color: T.ink, width: 2.4 });
    const tr = trials().slice(0, shown);
    tr.forEach((t, i) => {
      const py = v.sy(clamp(t.lhs, v.y0, v.y1));
      if (t.ok) dot(ctx, v.sx(t.s), py, 7, T.green, T.surface, 2);
      else { ctx.save(); ctx.strokeStyle = T.red; ctx.lineWidth = 2.6; const px = v.sx(t.s); ctx.beginPath(); ctx.moveTo(px - 6, py - 6); ctx.lineTo(px + 6, py + 6); ctx.moveTo(px + 6, py - 6); ctx.lineTo(px - 6, py + 6); ctx.stroke(); ctx.restore(); }
      label(ctx, String(i + 1), v.sx(t.s), py - 16, { color: t.ok ? T.green : T.red, font: '11px ' + MONO, align: 'center', bg: T.surface });
    });
  };
  function upd() {
    fig.render();
    const f0 = F().f(x), sl = F().d1(x) * d, tr = trials();
    let h = '<div class="row">f(x) = ' + num(f0, 4) + ', f′(x) = ' + num(F().d1(x), 4) + ', f′(x)·d = ' + num(sl, 4) + (sl >= 0 ? ' ' + pill(false, 'd не направление спуска: f′(x)d ≥ 0') : '') + '</div>';
    if (simple) h += '<div class="row">условие «просто уменьшилась»: f(x + αd) &lt; f(x) = ' + num(f0, 4) + '</div>';
    else h += '<div class="row">условие Армихо: f(x + αd) ≤ f(x) + c·α·f′(x)·d = ' + linFmt([[f0, ''], [c * sl, 'α']]) + '</div>';
    h += '<table><tr><th>попытка</th><th>шаг α</th><th>левая f(x + αd)</th><th>правая</th><th></th></tr>';
    tr.slice(0, shown).forEach((t, i) => { h += '<tr><td>' + (i + 1) + '</td><td>' + num(t.s, 5) + '</td><td>' + num(t.lhs, 5) + '</td><td>' + num(t.r, 5) + '</td><td>' + (t.ok ? '<span class="k-ok">принять</span>' : '<span class="k-bad">отклонить</span>') + '</td></tr>'; });
    h += '</table>';
    if (shown >= tr.length && tr.length) {
      const t = tr[tr.length - 1];
      if (t.ok) h += '<div class="row">итог: α = ' + num(t.s, 5) + ', x⁺ = x + αd = ' + num(x + t.s * d, 5) + ', f(x⁺) = ' + num(t.lhs, 5) + '</div>';
      else h += '<div class="row">' + pill(false, 'за 30 попыток шаг не найден') + '</div>';
    }
    ro.innerHTML = h;
  }
  upd();
};

/* ================= workbook: KKT and duality in 1D (П7) ================= */
WIDGETS.kkt1 = (root, wid) => {
  let a = 3, b = 1, lam = 1;
  const c1 = row(root);
  const sa = slider(c1, wid, { name: 'a', label: 'a в f = (x − a)²', min: -1, max: 5, step: 0.05, value: a, on: z => { a = z; upd(); } });
  const sb = slider(c1, wid, { name: 'b', label: 'b в ограничении x ≤ b', min: -1, max: 5, step: 0.05, value: b, on: z => { b = z; upd(); } });
  const sl = slider(c1, wid, { name: 'lam', label: 'множитель λ', min: 0, max: 8, step: 0.01, value: lam, on: z => { lam = z; upd(); } });
  const c2 = row(root);
  const pre = (A, B) => { a = A; b = B; sa.set(a); sb.set(b); upd(); };
  button(c2, 'П7: (x − 3)², x ≤ 1', () => pre(3, 1));
  button(c2, 'доп.: x ≤ 4', () => pre(3, 4));
  button(c2, 'нулевой множитель: (x − 1)², x ≤ 1', () => pre(1, 1));
  button(c2, 'λ = λ⋆', () => { lam = S().ls; sl.set(lam); upd(); }, 'primary');
  const fr = figsRow(root);
  const fP = new Fig(fr, { aspect: 0.72, minH: 240, maxH: 380, label: 'f, лагранжиан и допустимое множество' });
  const fD = new Fig(fr, { aspect: 0.72, minH: 240, maxH: 380, label: 'Двойственная функция q(λ)' });
  const lg = document.createElement('div'); lg.className = 'legend-row';
  lg.innerHTML = '<span><span class="sw m"></span>f(x) = (x − a)²</span><span><span class="sw a"></span>ℒ(x, λ) = f + λ(x − b)</span><span><span class="sw band g"></span>x ≤ b</span><span><span class="sw a"></span>справа: q(λ)</span><span><span class="sw dash g"></span>p⋆</span>';
  root.appendChild(lg);
  const ro = readout(root);
  function S() {
    const inact = a <= b + 1e-12;
    const xs = inact ? a : b, ls = inact ? 0 : 2 * (a - b), ps = (xs - a) * (xs - a);
    const q = l => -l * l / 4 + (a - b) * l;
    return { inact, xs, ls, ps, q };
  }
  fP.draw = ctx => {
    const s = S();
    const f = x => (x - a) * (x - a), L = x => f(x) + lam * (x - b);
    const v = new View(fP, [-1.5, 6], [-3, 12], { pad: { l: 36 } });
    clipV(ctx, v); ctx.fillStyle = al(T.green, 0.12); ctx.fillRect(v.pad.l, v.pad.t, v.sx(b) - v.pad.l, v.H); ctx.restore();
    axes(ctx, v, { xlab: 'x' });
    vline(ctx, v, b, T.green, null, 1.6);
    curve(ctx, v, f, { color: T.muted, width: 2 });
    curve(ctx, v, L, { color: T.accent, width: 2.4 });
    const xl = a - lam / 2;
    dot(ctx, v.sx(xl), v.sy(clamp(L(xl), v.y0, v.y1)), 5.5, T.accent, T.surface, 2);
    star(ctx, v.sx(s.xs), v.sy(s.ps), 8, T.green, T.surface);
    label(ctx, 'x⋆', v.sx(s.xs) + 9, v.sy(s.ps) - 12, { color: T.green, font: '12px ' + MATHF, bg: T.surface });
  };
  fD.draw = ctx => {
    const s = S();
    const lo = Math.min(s.q(8), s.q(0), s.ps) - 1, hi = Math.max(s.ps, s.q(s.ls)) + 1.5;
    const v = new View(fD, [0, 8], [Math.max(lo, s.ps - 14), hi], { pad: { l: 36 } });
    axes(ctx, v, { xlab: 'λ', ylab: 'q(λ)' });
    hline(ctx, v, s.ps, T.green, [6, 4], 1.6);
    curve(ctx, v, s.q, { color: T.accent, width: 2.4 });
    const ql = s.q(lam);
    seg(ctx, v, lam, clamp(ql, v.y0, v.y1), lam, s.ps, T.orange, 2.6);
    star(ctx, v.sx(s.ls), v.sy(s.q(s.ls)), 8, T.green, T.surface);
    dot(ctx, v.sx(lam), v.sy(clamp(ql, v.y0, v.y1)), 5.5, T.accent, T.surface, 2);
  };
  function upd() {
    fP.render(); fD.render();
    const s = S(), tol = 1e-9;
    const stat = 2 * (s.xs - a) + s.ls;
    let h = '<div class="row"><b>min (x − ' + num(a, 2) + ')² при x ≤ ' + num(b, 2) + '</b> ⇒ g(x) = x − ' + num(b, 2) + ' ≤ 0, &nbsp; ℒ(x, λ) = (x − ' + num(a, 2) + ')² + λ(x − ' + num(b, 2) + ')</div>';
    h += '<div class="row">неактивный случай: λ = 0 ⇒ 2(x − a) = 0 ⇒ x = ' + num(a, 3) + '; допустимо? ' + yes(a <= b + tol) + '</div>';
    h += '<div class="row">активный случай: x = b = ' + num(b, 3) + ' ⇒ λ = 2(a − b) = ' + num(2 * (a - b), 3) + '; λ ≥ 0? ' + yes(2 * (a - b) >= -tol) + '</div>';
    h += '<table><tr><th>группа ККТ</th><th>условие</th><th>в (x⋆, λ⋆) = (' + num(s.xs, 3) + ', ' + num(s.ls, 3) + ')</th></tr>';
    h += '<tr><td>стационарность</td><td>2(x − a) + λ = 0</td><td>' + num(stat, 4) + ' ' + ok(Math.abs(stat) < 1e-9) + '</td></tr>';
    h += '<tr><td>прямая допустимость</td><td>x − b ≤ 0</td><td>' + num(s.xs - b, 4) + ' ' + ok(s.xs - b <= tol) + '</td></tr>';
    h += '<tr><td>двойственная допустимость</td><td>λ ≥ 0</td><td>' + num(s.ls, 4) + ' ' + ok(s.ls >= -tol) + '</td></tr>';
    h += '<tr><td>дополняющая нежёсткость</td><td>λ(x − b) = 0</td><td>' + num(s.ls * (s.xs - b), 4) + ' ' + ok(Math.abs(s.ls * (s.xs - b)) < 1e-9) + '</td></tr></table>';
    const act = Math.abs(s.xs - b) < tol;
    h += '<div class="row">x⋆ = ' + num(s.xs, 3) + ', λ⋆ = ' + num(s.ls, 3) + ', f⋆ = ' + num(s.ps, 4) + '; ограничение ' + (act ? 'активно' : 'неактивно') + (act && s.ls < tol ? ' ' + pill(null, 'активно, но λ⋆ = 0') : '') + '</div>';
    h += '<div class="row">глобальность: f выпукла, g аффинна ⇒ ККТ достаточны (теорема 7)</div>';
    h += '<div class="row">q(λ) = minₓ ℒ: x(λ) = a − λ/2 ⇒ q(λ) = −λ²/4 + ' + num(a - b, 3) + 'λ; max при λ ≥ 0: λ⋆ = ' + num(s.ls, 3) + ', d⋆ = ' + num(s.q(s.ls), 4) + ' = p⋆ ' + ok(Math.abs(s.q(s.ls) - s.ps) < 1e-9) + '</div>';
    h += '<div class="row">сейчас λ = ' + num(lam, 2) + ': argminₓ ℒ = ' + num(a - lam / 2, 3) + ', q(λ) = ' + num(s.q(lam), 4) + ' ≤ p⋆ (слабая двойственность), зазор ' + num(s.ps - s.q(lam), 4) + '</div>';
    ro.innerHTML = h;
  }
  upd();
};

/* ================= workbook: mock ticket timer ================= */
WIDGETS.timer = (root, wid) => {
  const total = [20 * 60, 5 * 60], names = ['письменная часть', 'защита в паре'];
  let phase = 0, left = total[0], timer = null, last = 0;
  const face = document.createElement('div'); face.className = 'timer-face';
  const tm = document.createElement('span'); tm.className = 'tm';
  const ph = document.createElement('span'); ph.className = 'ph';
  face.append(tm, ph);
  const bar = document.createElement('div'); bar.className = 'timer-bar'; const fill = document.createElement('i'); bar.appendChild(fill);
  const msg = document.createElement('div'); msg.className = 'k-mut'; msg.setAttribute('aria-live', 'polite');
  root.append(face, bar);
  const c1 = row(root);
  const bGo = button(c1, '▶ Старт', () => { if (timer) pause(); else start(); }, 'primary');
  button(c1, 'К защите (5 мин)', () => { pause(); phase = 1; left = total[1]; msg.textContent = ''; show(); });
  button(c1, 'Сброс', () => { pause(); phase = 0; left = total[0]; msg.textContent = ''; show(); });
  root.appendChild(msg);
  const fmt = s => { s = Math.max(0, Math.ceil(s)); const m = Math.floor(s / 60), r = s % 60; return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r; };
  function show() {
    tm.textContent = fmt(left);
    ph.textContent = names[phase];
    fill.style.width = (100 * (1 - left / total[phase])).toFixed(2) + '%';
    face.classList.toggle('late', left <= 60);
    bGo.textContent = timer ? '❚❚ Пауза' : '▶ Старт';
  }
  function start() { last = Date.now(); timer = setInterval(tick, 250); show(); }
  function pause() { if (timer) { clearInterval(timer); timer = null; } show(); }
  function tick() {
    const now = Date.now();
    left -= (now - last) / 1000; last = now;
    if (left <= 0) {
      pause();
      if (phase === 0) { phase = 1; left = total[1]; msg.textContent = 'Письменная часть закончилась. Дальше 5 минут защиты: расскажи решение напарнику.'; }
      else { left = 0; msg.textContent = 'Время вышло.'; }
    }
    show();
  }
  show();
};
