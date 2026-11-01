
/* ================= convex set ================= */
const SETS11 = {
  disk: { name: 'круг (выпуклое)', inC: (x, y) => x * x + y * y <= 1.44 },
  square: { name: 'квадрат (выпуклое)', inC: (x, y) => Math.abs(x) <= 1.1 && Math.abs(y) <= 1.1 },
  lens: { name: 'пересечение двух кругов (выпуклое)', inC: (x, y) => (x + 0.5) * (x + 0.5) + y * y <= 1.44 && (x - 0.5) * (x - 0.5) + y * y <= 1.44 },
  ring: { name: 'кольцо 0.6 ≤ ‖x‖ ≤ 1.3', inC: (x, y) => { const r = Math.hypot(x, y); return r >= 0.6 && r <= 1.3; } },
  moon: { name: 'полумесяц', inC: (x, y) => x * x + y * y <= 1.44 && (x - 0.6) * (x - 0.6) + y * y > 1.0 },
  star: { name: 'звезда', inC: (x, y) => { const r = Math.hypot(x, y), a = Math.atan2(y, x); return r <= 0.85 + 0.45 * Math.cos(5 * a); } },
  union: { name: 'объединение двух кругов', inC: (x, y) => (x + 0.85) * (x + 0.85) + y * y <= 0.36 || (x - 0.85) * (x - 0.85) + y * y <= 0.36 }
};
WIDGETS.convexset = (root, wid) => {
  let key = 'ring', S = SETS11.ring, A = [-1, 0.2], B = [1, 0.2], t = 0.5, mode = 'seg';
  let P3 = [[-1.2, -0.8], [1.3, -0.6], [0, 1.2]], th = [0.5, 0.25, 0.25];
  const c1 = row(root);
  selectBox(c1, wid, { name: 'mode', label: 'Режим', value: 'seg', options: [['seg', 'отрезок в множестве'], ['tri3', '3 точки и веса θ']], on: m => { mode = m; c2.hidden = m !== 'seg'; c3.hidden = m === 'seg'; upd(); } });
  const c2 = row(root), c3 = row(root);
  selectBox(c2, wid, { name: 'set', label: 'Множество', value: key, options: Object.keys(SETS11).map(k => [k, SETS11[k].name]), on: k => { key = k; S = SETS11[k]; upd(); } });
  const tSl = slider(c2, wid, { name: 't', label: 't', min: 0, max: 1, step: 0.01, value: t, on: z => { t = z; upd(); } });
  button(c2, 'Найти контрпример', () => {
    for (let it = 0; it < 6000; it++) {
      const a = [Math.random() * 3.6 - 1.8, Math.random() * 3 - 1.5], b = [Math.random() * 3.6 - 1.8, Math.random() * 3 - 1.5];
      if (!S.inC(a[0], a[1]) || !S.inC(b[0], b[1])) continue;
      for (let i = 1; i < 60; i++) {
        const s = i / 60;
        if (!S.inC((1 - s) * a[0] + s * b[0], (1 - s) * a[1] + s * b[1])) { A = a; B = b; t = s; tSl.set(t); msg = 'нашёлся: A и B в множестве, но точка при t = ' + num(s, 2) + ' вне его'; render(); return; }
      }
    }
    msg = 'за 6000 попыток контрпример не найден' + (['disk', 'square', 'lens'].indexOf(key) >= 0 ? ' — множество выпукло' : '');
    render();
  });
  const ths = [0, 1, 2].map(i => slider(c3, wid, { name: 'th' + i, label: 'θ' + '₁₂₃'[i], min: 0, max: 1, step: 0.01, value: th[i], on: z => { th[i] = z; upd(); } }));
  c3.hidden = true;
  const fig = new Fig(root, { aspect: 0.62, minH: 250, maxH: 400, label: 'Множество и отрезок между двумя его точками' });
  const ro = readout(root);
  let v = null, msg = '';
  const cache = {};
  fig.draw = c => {
    v = new View(fig, [-2, 2], [-1.6, 1.6], { equal: true, pad: { l: 30, b: 20 } });
    axes(c, v, {});
    if (mode === 'seg') {
      const k = key + v.W + 'x' + v.H + themeVer;
      if (cache.k !== k) {
        const nx = Math.ceil(v.W / 2), ny = Math.ceil(v.H / 2);
        const off = document.createElement('canvas'); off.width = nx; off.height = ny;
        const o = off.getContext('2d'), img = o.createImageData(nx, ny), g = hexRgb(T.green);
        for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
          const inside = S.inC(v.x0 + (v.x1 - v.x0) * (i + 0.5) / nx, v.y1 - (v.y1 - v.y0) * (j + 0.5) / ny);
          const q = 4 * (j * nx + i);
          img.data[q] = g[0]; img.data[q + 1] = g[1]; img.data[q + 2] = g[2]; img.data[q + 3] = inside ? 58 : 0;
        }
        o.putImageData(img, 0, 0); cache.k = k; cache.img = off;
      }
      c.drawImage(cache.img, v.pad.l, v.pad.t, v.W, v.H);
      const n = 160;
      for (let i = 0; i < n; i++) {
        const s0 = i / n, s1 = (i + 1) / n, sm = (s0 + s1) / 2;
        const inside = S.inC((1 - sm) * A[0] + sm * B[0], (1 - sm) * A[1] + sm * B[1]);
        c.strokeStyle = inside ? T.green : T.red; c.lineWidth = inside ? 3 : 4.5; c.lineCap = 'butt';
        c.beginPath(); c.moveTo(v.sx((1 - s0) * A[0] + s0 * B[0]), v.sy((1 - s0) * A[1] + s0 * B[1])); c.lineTo(v.sx((1 - s1) * A[0] + s1 * B[0]), v.sy((1 - s1) * A[1] + s1 * B[1])); c.stroke();
      }
      const P = [(1 - t) * A[0] + t * B[0], (1 - t) * A[1] + t * B[1]];
      dot(c, v.sx(P[0]), v.sy(P[1]), 5.5, S.inC(P[0], P[1]) ? T.green : T.red, T.surface, 1.5);
      for (const [p, nm] of [[A, 'A'], [B, 'B']]) { dot(c, v.sx(p[0]), v.sy(p[1]), 7, T.accent, T.surface, 2); label(c, nm, v.sx(p[0]) + 10, v.sy(p[1]) - 10, { color: T.accent, font: '600 13px ' + BODY }); }
    } else {
      const w = th.slice(), sw = w[0] + w[1] + w[2] || 1;
      const X = [0, 1].map(k => (w[0] * P3[0][k] + w[1] * P3[1][k] + w[2] * P3[2][k]) / sw);
      c.beginPath(); P3.forEach((p, i) => { if (i) c.lineTo(v.sx(p[0]), v.sy(p[1])); else c.moveTo(v.sx(p[0]), v.sy(p[1])); }); c.closePath();
      c.fillStyle = al(T.accent, 0.12); c.fill(); c.strokeStyle = al(T.accent, 0.7); c.lineWidth = 1.5; c.stroke();
      P3.forEach((p, i) => { c.save(); c.strokeStyle = al(T.orange, 0.5); c.setLineDash([3, 3]); c.beginPath(); c.moveTo(v.sx(p[0]), v.sy(p[1])); c.lineTo(v.sx(X[0]), v.sy(X[1])); c.stroke(); c.restore(); });
      P3.forEach((p, i) => { dot(c, v.sx(p[0]), v.sy(p[1]), 7, T.accent, T.surface, 2); label(c, 'x' + '₁₂₃'[i] + '  θ = ' + num(w[i] / sw, 2), v.sx(p[0]) + 10, v.sy(p[1]) - 12, { color: T.accent, font: '12px ' + BODY, bg: T.surface }); });
      star(c, v.sx(X[0]), v.sy(X[1]), 9, T.orange, T.surface);
    }
  };
  function render() {
    fig.render();
    if (mode === 'seg') {
      const P = [(1 - t) * A[0] + t * B[0], (1 - t) * A[1] + t * B[1]];
      let leaves = false;
      for (let i = 1; i < 400; i++) { const s = i / 400; if (!S.inC((1 - s) * A[0] + s * B[0], (1 - s) * A[1] + s * B[1])) { leaves = true; break; } }
      const aIn = S.inC(A[0], A[1]), bIn = S.inC(B[0], B[1]);
      let h = '<div class="row">A = ' + vec(A, 2) + ' ' + (aIn ? '∈ C' : '∉ C') + ', B = ' + vec(B, 2) + ' ' + (bIn ? '∈ C' : '∉ C') + '</div>';
      h += '<div class="row">(1 − t)A + tB = ' + vec(P, 3) + ' при t = ' + num(t, 2) + ': ' + (S.inC(P[0], P[1]) ? pill(true, '∈ C') : pill(false, '∉ C')) + '</div>';
      h += '<div class="row">' + (!(aIn && bIn) ? '<span class="k-mut">поставь оба конца внутрь множества, чтобы проверять определение</span>' : leaves ? pill(false, 'контрпример') + ' A, B ∈ C, но часть отрезка вне C ⇒ C не выпукло' : pill(true, 'отрезок целиком в C') + ' (для выпуклости это должно быть верно для любых A, B)') + '</div>';
      if (msg) h += '<div class="row k-warn">' + msg + '</div>';
      ro.innerHTML = h;
    } else {
      const sw = th[0] + th[1] + th[2];
      const w = th.map(z => sw ? z / sw : 1 / 3);
      const X = [0, 1].map(k => w[0] * P3[0][k] + w[1] * P3[1][k] + w[2] * P3[2][k]);
      ro.innerHTML = '<div class="row">веса после нормировки θ = (' + w.map(z => num(z, 3)).join(', ') + '), сумма = 1, все ≥ 0</div><div class="row">x = θ₁x₁ + θ₂x₂ + θ₃x₃ = ' + vec(X, 3) + ' — всегда внутри треугольника</div><div class="row k-mut">выпуклая оболочка трёх точек = все их выпуклые комбинации; ползунки задают θ до нормировки</div>';
    }
  }
  function upd() { msg = ''; render(); }
  drag(fig, {
    hit: (px, py, r) => {
      if (!v) return null;
      if (mode === 'seg') { if (near(px, py, v.sx(A[0]), v.sy(A[1]), r)) return 'A'; if (near(px, py, v.sx(B[0]), v.sy(B[1]), r)) return 'B'; }
      else for (let i = 0; i < 3; i++) if (near(px, py, v.sx(P3[i][0]), v.sy(P3[i][1]), r)) return i;
      return null;
    },
    move: (id, px, py) => {
      const q = [clamp(v.wx(px), v.x0, v.x1), clamp(v.wy(py), v.y0, v.y1)];
      if (id === 'A') A = q; else if (id === 'B') B = q; else P3[id] = q;
      upd();
    }
  });
  upd();
};

/* ================= convex function ================= */
WIDGETS.convexfn = (root, wid) => {
  let key = 'exp', F = F1.exp, x = -1.5, y = 1.8, t = 0.4, tang = false;
  const c1 = row(root);
  selectBox(c1, wid, { name: 'fn', label: 'Функция', value: key, options: ['sq', 'abs', 'exp', 'sp', 'x4', 'w', 'sin'].map(k => [k, F1[k].name]), on: k => { key = k; F = F1[k]; upd(); } });
  slider(c1, wid, { name: 't', label: 't', min: 0, max: 1, step: 0.01, value: t, on: z => { t = z; upd(); } });
  checkbox(c1, wid, { name: 'tan', label: 'касательная в x (критерий 1-го порядка)', checked: false, on: b => { tang = b; upd(); } });
  const fig = new Fig(root, { aspect: 0.48, minH: 240, maxH: 360, label: 'График функции и хорда между точками x и y' });
  const fig2 = new Fig(root, { aspect: 0.16, minH: 110, maxH: 150, scroll: true, label: 'Вторая производная функции' });
  const ro = readout(root);
  let v = null;
  const X0 = -3, X1 = 3;
  const yr = () => key === 'exp' ? [-1, 8] : key === 'x4' ? [-0.5, 10] : yRange([F.f], X0, X1, { pad: 0.12 });
  fig.draw = c => {
    v = new View(fig, [X0, X1], yr());
    axes(c, v, { xlab: 'x', ylab: 'f' });
    if (tang) {
      const tl = s => F.f(x) + F.d1(x) * (s - x);
      fillBetween(c, v, F.f, tl, al(T.red, 0.25), { when: s => F.f(s) < tl(s) - 1e-9 });
      curve(c, v, tl, { color: T.orange, width: 1.6, dash: [6, 4] });
    }
    curve(c, v, F.f, { color: T.ink, width: 2.3 });
    const fx = F.f(x), fy = F.f(y), z = (1 - t) * x + t * y, fz = F.f(z), ch = (1 - t) * fx + t * fy;
    c.save(); c.strokeStyle = T.accent; c.lineWidth = 1.8; c.beginPath(); c.moveTo(v.sx(x), v.sy(fx)); c.lineTo(v.sx(y), v.sy(fy)); c.stroke(); c.restore();
    c.save(); c.strokeStyle = ch >= fz - 1e-12 ? T.green : T.red; c.lineWidth = 4; c.beginPath(); c.moveTo(v.sx(z), v.sy(fz)); c.lineTo(v.sx(z), v.sy(ch)); c.stroke(); c.restore();
    dot(c, v.sx(z), v.sy(ch), 4.5, T.accent);
    dot(c, v.sx(z), v.sy(fz), 4.5, T.ink);
    dot(c, v.sx(x), v.sy(fx), 7, T.accent, T.surface, 2);
    dot(c, v.sx(y), v.sy(fy), 7, T.accent, T.surface, 2);
    label(c, 'x', v.sx(x), v.sy(fx) - 15, { color: T.accent, font: 'italic 13px ' + MATHF, align: 'center' });
    label(c, 'y', v.sx(y), v.sy(fy) - 15, { color: T.accent, font: 'italic 13px ' + MATHF, align: 'center' });
  };
  fig2.draw = c => {
    const r = yRange([F.d2], X0, X1, { incl: 0, capHi: 40, capLo: -20 });
    const w = new View(fig2, [X0, X1], r, { pad: { t: 6, b: 18 } });
    axes(c, w, { ylab: 'f″' });
    fillBetween(c, w, F.d2, () => 0, al(T.red, 0.3), { when: s => F.d2(s) < -1e-12 });
    fillBetween(c, w, F.d2, () => 0, al(T.green, 0.2), { when: s => F.d2(s) >= -1e-12 });
    curve(c, w, F.d2, { color: T.violet, width: 2 });
    if (key === 'abs') label(c, 'в нуле f″ не существует (излом)', w.pad.l + 8, w.pad.t + 12, { color: T.muted, font: '11px ' + BODY });
  };
  function upd() {
    fig.render(); fig2.render();
    const fx = F.f(x), fy = F.f(y), z = (1 - t) * x + t * y, fz = F.f(z), ch = (1 - t) * fx + t * fy;
    let worst = Infinity;
    const N = 70;
    for (let i = 0; i <= N; i++) for (let j = i + 1; j <= N; j++) for (const s of [0.25, 0.5, 0.75]) {
      const a = X0 + (X1 - X0) * i / N, b = X0 + (X1 - X0) * j / N;
      worst = Math.min(worst, (1 - s) * F.f(a) + s * F.f(b) - F.f((1 - s) * a + s * b));
    }
    const minD2 = infOn(F.d2, X0, X1)[0];
    ro.innerHTML =
      '<div class="row">x = ' + num(x, 2) + ', y = ' + num(y, 2) + ', t = ' + num(t, 2) + ' → (1 − t)x + ty = ' + num(z, 3) + '</div>' +
      '<div class="row">f((1 − t)x + ty) = ' + num(fz, 4) + ' &nbsp; (1 − t)f(x) + t f(y) = ' + num(ch, 4) + ' &nbsp; зазор = ' + num(ch - fz, 4) + ' ' + (ch >= fz - 1e-12 ? pill(true, '≤ выполнено') : pill(false, 'нарушено')) + '</div>' +
      '<div class="row">по всем хордам на окне [−3, 3]: ' + (worst >= -1e-9 ? pill(true, 'выпукла') : pill(false, 'невыпукла')) + ' &nbsp; min f″ на окне = ' + (key === 'abs' ? '0 (вне нуля)' : num(minD2, 3)) + '</div>';
  }
  drag(fig, {
    hit: (px, py, r) => {
      if (!v) return null;
      if (near(px, py, v.sx(x), v.sy(F.f(x)), r)) return 'x';
      if (near(px, py, v.sx(y), v.sy(F.f(y)), r)) return 'y';
      return null;
    },
    move: (id, px) => { const q = clamp(v.wx(px), X0, X1); if (id === 'x') x = q; else y = q; upd(); }
  });
  upd();
};

/* ================= strong convexity ================= */
WIDGETS.strongcvx = (root, wid) => {
  let key = 'x4', F = F1.x4, mu = 1, x0 = 0.6, A = -2, B = 2;
  const c1 = row(root);
  selectBox(c1, wid, { name: 'fn', label: 'Функция', value: key, options: ['half', 'q23', 'cosh', 'x4', 'exp', 'sp'].map(k => [k, F1[k].name]), on: k => { key = k; F = F1[k]; upd(); } });
  slider(c1, wid, { name: 'mu', label: 'µ', min: 0, max: 6, step: 0.05, value: mu, on: z => { mu = z; upd(); } });
  slider(c1, wid, { name: 'x0', label: 'x₀', min: -3, max: 3, step: 0.01, value: x0, on: z => { x0 = z; upd(); } });
  const c2 = row(root);
  const sA = slider(c2, wid, { name: 'a', label: 'окно: от', min: -3, max: 2.8, step: 0.05, value: A, on: z => { A = Math.min(z, B - 0.2); upd(); } });
  const sB = slider(c2, wid, { name: 'b', label: 'окно: до', min: -2.8, max: 3, step: 0.05, value: B, on: z => { B = Math.max(z, A + 0.2); upd(); } });
  button(c2, 'окно [1, 2]', () => { A = 1; B = 2; sA.set(A); sB.set(B); x0 = 1.5; upd(); });
  button(c2, 'окно [−2, 2]', () => { A = -2; B = 2; sA.set(A); sB.set(B); upd(); });
  const fig = new Fig(root, { aspect: 0.45, minH: 230, maxH: 340, label: 'Функция и нижняя квадратичная модель' });
  const fig2 = new Fig(root, { aspect: 0.2, minH: 120, maxH: 170, scroll: true, label: 'Вторая производная и уровень µ' });
  const ro = readout(root);
  fig.draw = c => {
    const xx = clamp(x0, A, B);
    const lm = s => F.f(xx) + F.d1(xx) * (s - xx) + mu / 2 * (s - xx) * (s - xx);
    const v = new View(fig, [A, B], yRange([F.f], A, B, { pad: 0.15 }));
    axes(c, v, { xlab: 'x', ylab: 'f' });
    fillBetween(c, v, F.f, lm, al(T.red, 0.3), { when: s => lm(s) > F.f(s) + 1e-12 });
    curve(c, v, lm, { color: T.orange, width: 1.8, dash: [6, 4] });
    curve(c, v, F.f, { color: T.ink, width: 2.3 });
    dot(c, v.sx(xx), v.sy(F.f(xx)), 6, T.accent, T.surface, 2);
  };
  fig2.draw = c => {
    const r = yRange([F.d2], A, B, { incl: 0, capHi: 60 });
    const r2 = [Math.min(r[0], mu - 0.5), Math.max(r[1], mu + 0.8)];
    const w = new View(fig2, [A, B], r2, { pad: { t: 6, b: 18 } });
    axes(c, w, { ylab: 'f″' });
    fillBetween(c, w, F.d2, () => mu, al(T.red, 0.3), { when: s => F.d2(s) < mu });
    curve(c, w, F.d2, { color: T.violet, width: 2 });
    c.save(); c.strokeStyle = T.orange; c.setLineDash([5, 4]); c.lineWidth = 1.6; c.beginPath(); c.moveTo(w.pad.l, w.sy(mu)); c.lineTo(w.pad.l + w.W, w.sy(mu)); c.stroke(); c.restore();
    label(c, 'µ', w.pad.l + w.W - 14, w.sy(mu) - 9, { color: T.orange, font: 'italic 13px ' + MATHF });
  };
  function upd() {
    fig.render(); fig2.render();
    const best = infOn(F.d2, A, B)[0];
    const ok = best >= mu - 1e-9;
    const xx = clamp(x0, A, B);
    let worst = -Infinity;
    for (let i = 0; i <= 600; i++) { const s = A + (B - A) * i / 600; worst = Math.max(worst, F.f(xx) + F.d1(xx) * (s - xx) + mu / 2 * (s - xx) * (s - xx) - F.f(s)); }
    ro.innerHTML =
      '<div class="row">окно [' + num(A, 2) + ', ' + num(B, 2) + ']: min f″ = ' + num(best, 4) + ' ⇒ наибольшее µ на окне = ' + num(Math.max(0, best), 4) + '</div>' +
      '<div class="row">µ = ' + num(mu, 2) + ': f″ ≥ µ на окне ' + yes(ok) + ' &nbsp; нижняя модель в x₀ = ' + num(xx, 2) + ' не выше f ' + yes(worst <= 1e-9) + '</div>' +
      '<div class="row k-mut">на всём ℝ: ½x² — µ = 1; 2x² + 3x — µ = 4; cosh x — µ = 1 (cosh ≥ 1); x⁴, eˣ, softplus — сильной выпуклости нет (inf f″ = 0)</div>';
  }
  upd();
};

/* ================= L-smoothness ================= */
const LS = { sp: { win: [-6, 6], L: 0.25 }, sin: { win: [-4, 4], L: 1 }, sq2: { win: [-2, 2], L: 4 }, lch: { win: [-4, 4], L: 1 }, x4: { win: [-1.6, 1.6], L: null } };
WIDGETS.lsmooth = (root, wid) => {
  let key = 'sp', F = F1.sp, W = LS.sp.win, lL = Math.log10(0.25), x0 = 2;
  const c1 = row(root);
  selectBox(c1, wid, { name: 'fn', label: 'Функция', value: key, options: Object.keys(LS).map(k => [k, F1[k].name]), on: k => { key = k; F = F1[k]; W = LS[k].win; x0 = clamp(x0, W[0], W[1]); sx.range(W[0], W[1]); sx.set(x0); upd(); } });
  const sL = slider(c1, wid, { name: 'L', label: 'L', min: -1.5, max: 1.5, step: 0.01, value: lL, fmt: z => num(Math.pow(10, z), 3), on: z => { lL = z; upd(); } });
  const sx = slider(c1, wid, { name: 'x0', label: 'x₀', min: W[0], max: W[1], step: 0.01, value: x0, on: z => { x0 = z; upd(); } });
  const c2 = row(root);
  button(c2, 'L = sup |f″| на окне', () => { const m = supOn(z => Math.abs(F.d2(z)), W[0], W[1])[0]; lL = Math.log10(Math.max(0.0317, m)); sL.set(lL); upd(); });
  const fig = new Fig(root, { aspect: 0.45, minH: 230, maxH: 340, label: 'Функция, верхняя парабола из леммы о спуске и шаг GD' });
  const fig2 = new Fig(root, { aspect: 0.2, minH: 120, maxH: 170, scroll: true, label: 'Модуль второй производной и уровень L' });
  const ro = readout(root);
  const L = () => Math.pow(10, lL);
  fig.draw = c => {
    const LL = L(), g = F.d1(x0), f0 = F.f(x0);
    const um = s => f0 + g * (s - x0) + LL / 2 * (s - x0) * (s - x0);
    const yr = yRange([F.f], W[0], W[1], { pad: 0.3 });
    const v = new View(fig, W, yr);
    axes(c, v, { xlab: 'x', ylab: 'f' });
    fillBetween(c, v, F.f, um, al(T.red, 0.3), { when: s => F.f(s) > um(s) + 1e-12 });
    curve(c, v, um, { color: T.orange, width: 1.8, dash: [6, 4] });
    curve(c, v, F.f, { color: T.ink, width: 2.3 });
    const xp = x0 - g / LL;
    arrow(c, v.sx(x0), v.sy(f0), v.sx(xp), v.sy(um(xp)), T.accent, 2);
    dot(c, v.sx(xp), v.sy(F.f(xp)), 5, T.green, T.surface, 1.5);
    dot(c, v.sx(x0), v.sy(f0), 6.5, T.accent, T.surface, 2);
    label(c, 'x⁺ = x₀ − f′(x₀)/L', v.sx(xp), v.sy(um(xp)) + 14, { color: T.accent, font: '11px ' + MATHF, align: 'center', bg: T.surface });
  };
  fig2.draw = c => {
    const LL = L();
    const r = yRange([z => Math.abs(F.d2(z))], W[0], W[1], { incl: 0 });
    const w = new View(fig2, W, [0, Math.max(r[1], LL * 1.25)], { pad: { t: 6, b: 18 } });
    axes(c, w, { ylab: '|f″|' });
    fillBetween(c, w, z => Math.abs(F.d2(z)), () => LL, al(T.red, 0.3), { when: z => Math.abs(F.d2(z)) > LL });
    curve(c, w, z => Math.abs(F.d2(z)), { color: T.violet, width: 2 });
    c.save(); c.strokeStyle = T.orange; c.setLineDash([5, 4]); c.lineWidth = 1.6; c.beginPath(); c.moveTo(w.pad.l, w.sy(LL)); c.lineTo(w.pad.l + w.W, w.sy(LL)); c.stroke(); c.restore();
    label(c, 'L', w.pad.l + w.W - 14, w.sy(LL) - 9, { color: T.orange, font: 'italic 13px ' + MATHF });
  };
  function upd() {
    fig.render(); fig2.render();
    const LL = L(), g = F.d1(x0), f0 = F.f(x0), xp = x0 - g / LL;
    const need = supOn(z => Math.abs(F.d2(z)), W[0], W[1])[0];
    let worst = -Infinity;
    for (let i = 0; i <= 800; i++) { const s = W[0] + (W[1] - W[0]) * i / 800; worst = Math.max(worst, F.f(s) - (f0 + g * (s - x0) + LL / 2 * (s - x0) * (s - x0))); }
    const glob = LS[key].L;
    ro.innerHTML =
      '<div class="row">sup |f″| на окне = ' + num(need, 4) + ' ⇒ на окне f L-гладкая при L ≥ ' + num(need, 4) + ' &nbsp; на всём ℝ: ' + (glob === null ? '<span class="k-bad">не L-гладкая (f″ неограничена)</span>' : 'L = ' + num(glob, 3)) + '</div>' +
      '<div class="row">L = ' + num(LL, 3) + ': парабола лежит над f на окне ' + yes(worst <= 1e-9) + '</div>' +
      '<div class="row">шаг GD с α = 1/L: x⁺ = ' + num(xp, 4) + ' &nbsp; гарантия f(x₀) − f(x⁺) ≥ f′²/(2L) = ' + num(g * g / (2 * LL), 4) + ' &nbsp; на деле: ' + num(f0 - F.f(xp), 4) + (f0 - F.f(xp) >= g * g / (2 * LL) - 1e-9 ? ' ✓' : ' <span class="k-bad">✗ гарантия нарушена: L слишком мало</span>') + '</div>';
  }
  upd();
};

/* ================= condition number ================= */
WIDGETS.condition = (root, wid) => {
  let lk = 1, aL = 1;
  const c1 = row(root);
  const sK = slider(c1, wid, { name: 'k', label: 'κ = L/µ (µ = 1)', min: 0, max: 3, step: 0.01, value: lk, fmt: z => num(Math.pow(10, z), 1), on: z => { lk = z; upd(); } });
  const sA = slider(c1, wid, { name: 'a', label: 'α·L', min: 0.02, max: 2.3, step: 0.005, value: aL, fmt: z => num(z, 3), on: z => { aL = z; upd(); } });
  const c2 = row(root);
  button(c2, 'α = 1/L', () => { aL = 1; sA.set(aL); upd(); });
  button(c2, 'α = 2/(L + µ)', () => { const k = Math.pow(10, lk); aL = 2 * k / (k + 1); sA.set(aL); upd(); });
  button(c2, 'α = 2/L', () => { aL = 2; sA.set(aL); upd(); });
  const fr = figsRow(root);
  const fig = new Fig(fr, { aspect: 0.62, minH: 230, maxH: 340, label: 'Множитель |1 − αλ| на спектре [µ, L]' });
  const fig2 = new Fig(fr, { aspect: 0.62, minH: 230, maxH: 340, label: 'Линии уровня квадратичной функции и шаги GD' });
  const ro = readout(root);
  const st = () => { const k = Math.pow(10, lk); const L = k, mu = 1, a = aL / L; const rho = Math.max(Math.abs(1 - a * mu), Math.abs(1 - a * L)); return { k, L, mu, a, rho }; };
  fig.draw = c => {
    const s = st();
    const v = new View(fig, [0, s.L * 1.08], [0, 1.6], { pad: { l: 34 } });
    axes(c, v, { xlab: 'λ', ylab: '|1 − αλ|' });
    clipV(c, v);
    c.fillStyle = al(T.accent, 0.12); c.fillRect(v.sx(s.mu), v.pad.t, v.sx(s.L) - v.sx(s.mu), v.H);
    c.strokeStyle = al(T.red, 0.8); c.setLineDash([5, 4]); c.lineWidth = 1.2; c.beginPath(); c.moveTo(v.pad.l, v.sy(1)); c.lineTo(v.pad.l + v.W, v.sy(1)); c.stroke();
    c.restore();
    curve(c, v, l => Math.abs(1 - s.a * l), { color: T.ink, width: 2.2, n: 600 });
    const worst = Math.abs(1 - s.a * s.mu) >= Math.abs(1 - s.a * s.L) ? s.mu : s.L;
    dot(c, v.sx(s.mu), v.sy(Math.abs(1 - s.a * s.mu)), 4.5, T.accent);
    dot(c, v.sx(s.L), v.sy(Math.min(1.6, Math.abs(1 - s.a * s.L))), 4.5, T.accent);
    dot(c, v.sx(worst), v.sy(Math.min(1.6, s.rho)), 7, s.rho < 1 ? T.orange : T.red, T.surface, 2);
    label(c, 'ρ(α) = ' + num(s.rho, 4), v.sx(worst) + (worst === s.mu ? 10 : -10), v.sy(Math.min(1.5, s.rho)) - 14, { color: s.rho < 1 ? T.orange : T.red, font: '12px ' + MONO, bg: T.surface, align: worst === s.mu ? 'left' : 'right' });
    label(c, 'спектр [µ, L]', v.sx((s.mu + s.L) / 2), v.pad.t + 12, { color: T.accent, font: '11px ' + BODY, align: 'center' });
  };
  fig2.draw = c => {
    const s = st();
    const ax = 1 / Math.sqrt(s.mu), ay = 1 / Math.sqrt(s.L);
    const v = new View(fig2, [-1.15 * ax, 1.15 * ax], [-0.75 * ax, 0.75 * ax], { equal: true, pad: { l: 30, b: 20 } });
    axes(c, v, { noGrid: true });
    c.save(); c.strokeStyle = al(T.accent, 0.5); c.lineWidth = 1;
    for (const lev of [0.05, 0.15, 0.3, 0.5, 0.75, 1]) { c.beginPath(); c.ellipse(v.sx(0), v.sy(0), ax * Math.sqrt(lev) * v.k, ay * Math.sqrt(lev) * v.k, 0, 0, 2 * Math.PI); c.stroke(); }
    c.restore();
    let p = [0.95 * ax, 0.9 * ay];
    c.save(); c.strokeStyle = T.orange; c.lineWidth = 1.6; c.beginPath(); c.moveTo(v.sx(p[0]), v.sy(p[1]));
    const pts = [p];
    for (let k = 0; k < 40; k++) { p = [(1 - s.a * s.mu) * p[0], (1 - s.a * s.L) * p[1]]; if (!isFinite(p[0]) || Math.abs(p[1]) > 50 * ax) break; pts.push(p); c.lineTo(v.sx(p[0]), v.sy(p[1])); }
    c.stroke(); c.restore();
    pts.forEach((q, i) => dot(c, v.sx(q[0]), v.sy(q[1]), i ? 2.5 : 5, T.orange));
    star(c, v.sx(0), v.sy(0), 7, T.green, T.surface);
    label(c, 'f = ½(µx² + Ly²), 40 шагов GD', v.pad.l + 6, v.pad.t + 12, { color: T.muted, font: '11px ' + BODY, bg: T.surface });
  };
  function upd() {
    fig.render(); fig2.render();
    const s = st();
    const its = r => r < 1 ? Math.ceil(Math.log(1e6) / -Math.log(r)) : Infinity;
    const r1 = 1 - 1 / s.k, r2 = (s.k - 1) / (s.k + 1), r3 = (Math.sqrt(s.k) - 1) / (Math.sqrt(s.k) + 1);
    ro.innerHTML =
      '<div class="row">κ = ' + num(s.k, 2) + ', µ = 1, L = ' + num(s.L, 2) + ', α = ' + num(s.a, 5) + ' &nbsp; ρ(α) = max(|1 − αµ|, |1 − αL|) = ' + num(s.rho, 5) + ' ' + (s.rho < 1 ? pill(true, 'сходится') : pill(false, s.rho === 1 ? 'на границе' : 'расходится')) + '</div>' +
      '<div class="row">итераций до уменьшения ошибки в 10⁶ раз при этом α: ' + (s.rho < 1 ? its(s.rho) : '∞') + '</div>' +
      '<table><tr><th>метод</th><th>множитель за шаг</th><th>итераций до 10⁻⁶</th></tr>' +
      '<tr><td>GD, α = 1/L</td><td>1 − 1/κ = ' + num(r1, 5) + '</td><td>' + (r1 > 0 ? its(r1) : 1) + '</td></tr>' +
      '<tr><td>GD, α* = 2/(L + µ)</td><td>(κ − 1)/(κ + 1) = ' + num(r2, 5) + '</td><td>' + (r2 > 0 ? its(r2) : 1) + '</td></tr>' +
      '<tr><td>тяжёлый шар / CG</td><td>(√κ − 1)/(√κ + 1) = ' + num(r3, 5) + '</td><td>' + (r3 > 0 ? its(r3) : 1) + '</td></tr></table>';
  }
  upd();
};

/* ================= PL condition ================= */
const PLP = { plsin: { L: 8, mu: 0.17553, win: [-6, 6], x0: 5.3 }, sq3: { L: 6, mu: 6, win: [-3, 3], x0: 2.5 }, x4: { L: 48, mu: 0, win: [-2, 2], x0: 1.8 } };
WIDGETS.pl = (root, wid) => {
  let key = 'plsin', F = F1.plsin, P = PLP.plsin, x0 = P.x0, mu = 0.17, its = [x0];
  const c1 = row(root);
  selectBox(c1, wid, { name: 'fn', label: 'Функция', value: key, options: [['plsin', 'x² + 3sin²x (невыпуклая)'], ['sq3', '3x²'], ['x4', 'x⁴']], on: k => { key = k; F = F1[k]; P = PLP[k]; x0 = P.x0; sx.range(P.win[0], P.win[1]); sx.set(x0); reset(); } });
  const sx = slider(c1, wid, { name: 'x0', label: 'x₀', min: P.win[0], max: P.win[1], step: 0.01, value: x0, on: z => { x0 = z; reset(); } });
  slider(c1, wid, { name: 'mu', label: 'µ', min: 0.01, max: 8, step: 0.01, value: mu, on: z => { mu = z; upd(); } });
  const c2 = row(root);
  button(c2, 'Шаг GD', () => { an.stop(); step(); upd(); });
  const bRun = button(c2, '▶ Пуск', () => { if (an.running()) an.stop(); else { bRun.textContent = '❚❚ Пауза'; an.start(); } }, 'primary');
  button(c2, 'Сброс', () => reset());
  const fig = new Fig(root, { aspect: 0.42, minH: 230, maxH: 330, label: 'Функция и итерации градиентного спуска' });
  const fig2 = new Fig(root, { aspect: 0.2, minH: 120, maxH: 170, scroll: true, label: 'Отношение половины квадрата производной к f − f⋆' });
  const ro = readout(root);
  const ratio = z => { const fv = F.f(z); return fv > 1e-14 ? 0.5 * F.d1(z) * F.d1(z) / fv : NaN; };
  const an = animator(() => { step(); upd(); }, () => its.length > 400 || F.f(its[its.length - 1]) < 1e-15, () => { bRun.textContent = '▶ Пуск'; }, 180);
  function step() { const x = its[its.length - 1]; its.push(x - F.d1(x) / P.L); }
  function reset() { an.stop(); its = [x0]; upd(); }
  fig.draw = c => {
    const v = new View(fig, P.win, yRange([F.f], P.win[0], P.win[1], { pad: 0.08 }));
    axes(c, v, { xlab: 'x', ylab: 'f' });
    curve(c, v, F.f, { color: T.ink, width: 2.2 });
    c.save(); c.strokeStyle = al(T.orange, 0.7); c.lineWidth = 1.2; c.beginPath();
    its.forEach((x, i) => { if (i) c.lineTo(v.sx(x), v.sy(F.f(x))); else c.moveTo(v.sx(x), v.sy(F.f(x))); }); c.stroke(); c.restore();
    its.forEach((x, i) => dot(c, v.sx(x), v.sy(F.f(x)), i === its.length - 1 ? 6 : 3, T.orange, i === its.length - 1 ? T.surface : null, 1.5));
    star(c, v.sx(0), v.sy(0), 7, T.green, T.surface);
  };
  fig2.draw = c => {
    const top = key === 'sq3' ? 9 : key === 'plsin' ? 3 : 4;
    const w = new View(fig2, P.win, [0, Math.max(top, mu * 1.3)], { pad: { t: 6, b: 18 } });
    axes(c, w, { ylab: '½f′²/(f − f⋆)' });
    fillBetween(c, w, ratio, () => mu, al(T.red, 0.3), { when: z => ratio(z) < mu });
    curve(c, w, ratio, { color: T.violet, width: 2 });
    c.save(); c.strokeStyle = T.orange; c.setLineDash([5, 4]); c.lineWidth = 1.6; c.beginPath(); c.moveTo(w.pad.l, w.sy(mu)); c.lineTo(w.pad.l + w.W, w.sy(mu)); c.stroke(); c.restore();
    label(c, 'µ', w.pad.l + w.W - 14, w.sy(mu) - 9, { color: T.orange, font: 'italic 13px ' + MATHF });
  };
  function upd() {
    fig.render(); fig2.render();
    const infR = infOn(z => { const r = ratio(z); return isNaN(r) ? Infinity : r; }, P.win[0], P.win[1], 6000)[0];
    const minD2 = infOn(F.d2, P.win[0], P.win[1])[0];
    const f0 = F.f(its[0]);
    let h = '<div class="row">inf отношения на окне ≈ ' + num(infR, 4) + (key === 'plsin' ? ' (на всём ℝ ≈ 0.1755)' : key === 'x4' ? ' → 0 у минимума: PL нет' : '') + ' &nbsp; выбранное µ = ' + num(mu, 2) + ' ' + (infR >= mu - 1e-9 ? pill(true, 'PL выполнено') : pill(false, 'PL с таким µ нарушено')) + '</div>';
    h += '<div class="row">min f″ на окне = ' + num(minD2, 3) + ' ⇒ ' + (minD2 < -1e-9 ? '<span class="k-warn">функция невыпукла</span>' : 'выпукла') + ' &nbsp; L = ' + P.L + ', шаг α = 1/L</div>';
    h += '<table><tr><th>k</th><th>xₖ</th><th>f(xₖ) − f⋆</th><th>гарантия (1 − µ/L)ᵏ(f₀ − f⋆)</th></tr>';
    const start = Math.max(0, its.length - 6);
    for (let k = start; k < its.length; k++) h += '<tr><td>' + k + '</td><td>' + num(its[k], 5) + '</td><td>' + num(F.f(its[k]), 4) + '</td><td>' + (P.mu > 0 ? num(Math.pow(1 - P.mu / P.L, k) * f0, 4) : '—') + '</td></tr>';
    h += '</table>';
    ro.innerHTML = h;
  }
  upd();
};

/* ================= descent direction ================= */
WIDGETS.descentdir = (root, wid) => {
  let key = 'ell', F = F2.ell, p = F.p0.slice(), th = 225;
  const c1 = row(root);
  selectBox(c1, wid, { name: 'fn', label: 'Функция', value: key, options: [['ell', F2.ell.name], ['quad', F2.quad.name], ['rosen', F2.rosen.name]], on: k => { key = k; F = F2[k]; p = F.p0.slice(); upd(); } });
  const sT = slider(c1, wid, { name: 'th', label: 'угол d', min: 0, max: 359, step: 1, value: th, fmt: z => Math.round(z) + '°', on: z => { th = z; upd(); } });
  const fr = figsRow(root);
  const fm = new Fig(fr, { aspect: 0.8, minH: 250, maxH: 380, label: 'Карта уровней, полуплоскость направлений спуска' });
  const fs = new Fig(fr, { aspect: 0.8, minH: 250, maxH: 380, scroll: true, label: 'Функция вдоль луча x + αd' });
  const ro = readout(root);
  let v = null;
  const fld = {};
  const L = 0.75;
  const d = () => [Math.cos(th * Math.PI / 180), Math.sin(th * Math.PI / 180)];
  fm.draw = c => {
    v = new View(fm, F.xr, F.yr, { equal: true, pad: { l: 30, b: 20 } });
    drawField(c, v, cachedField(fld, key, v, F.f, {}));
    axes(c, v, { noGrid: true });
    const g = F.g(p[0], p[1]), gn = Math.hypot(g[0], g[1]) || 1, dd = d();
    const px = v.sx(p[0]), py = v.sy(p[1]);
    const ang = Math.atan2(-g[1], g[0]);
    c.save(); c.fillStyle = al(T.green, 0.22); c.beginPath(); c.moveTo(px, py); c.arc(px, py, 58, ang + Math.PI / 2, ang + 3 * Math.PI / 2); c.closePath(); c.fill(); c.restore();
    c.save(); c.strokeStyle = al(T.ink, 0.6); c.setLineDash([2, 3]); c.lineWidth = 1.3; c.beginPath();
    c.moveTo(px - 70 * (-g[1] / gn), py - 70 * (-g[0] / gn)); c.lineTo(px + 70 * (-g[1] / gn), py + 70 * (-g[0] / gn)); c.stroke(); c.restore();
    arrow(c, px, py, v.sx(p[0] + 0.6 * g[0] / gn), v.sy(p[1] + 0.6 * g[1] / gn), T.orange, 2.4);
    label(c, '∇f', v.sx(p[0] + 0.72 * g[0] / gn), v.sy(p[1] + 0.72 * g[1] / gn), { color: T.orange, font: '13px ' + MATHF, bg: T.surface, align: 'center' });
    const ok = g[0] * dd[0] + g[1] * dd[1] < 0;
    arrow(c, px, py, v.sx(p[0] + L * dd[0]), v.sy(p[1] + L * dd[1]), ok ? T.green : T.red, 2.6);
    dot(c, v.sx(p[0] + L * dd[0]), v.sy(p[1] + L * dd[1]), 5, ok ? T.green : T.red, T.surface, 1.5);
    dot(c, px, py, 7, T.accent, T.surface, 2);
  };
  fs.draw = c => {
    const dd = d(), g = F.g(p[0], p[1]), slope = g[0] * dd[0] + g[1] * dd[1], f0 = F.f(p[0], p[1]);
    const phi = a => F.f(p[0] + a * dd[0], p[1] + a * dd[1]);
    const am = key === 'rosen' ? 0.6 : 1.5;
    const w = new View(fs, [0, am], yRange([phi, a => f0 + slope * a], 0, am, { capHi: f0 + 3 * Math.max(1, Math.abs(f0)) }), { pad: { l: 42 } });
    axes(c, w, { xlab: 'α', ylab: 'φ(α) = f(x + αd)' });
    fillBetween(c, w, phi, () => f0, al(T.green, 0.2), { when: a => phi(a) < f0 });
    c.save(); c.strokeStyle = al(T.muted, 0.8); c.setLineDash([4, 4]); c.beginPath(); c.moveTo(w.pad.l, w.sy(f0)); c.lineTo(w.pad.l + w.W, w.sy(f0)); c.stroke(); c.restore();
    curve(c, w, a => f0 + slope * a, { color: T.orange, width: 1.6, dash: [6, 4] });
    curve(c, w, phi, { color: T.ink, width: 2.2 });
    dot(c, w.sx(0), w.sy(f0), 5, T.accent);
    label(c, 'наклон φ′(0) = ∇fᵀd', w.pad.l + 8, w.pad.t + 30, { color: T.orange, font: '11px ' + BODY });
  };
  function upd() {
    fm.render(); fs.render();
    const g = F.g(p[0], p[1]), dd = d(), sl = g[0] * dd[0] + g[1] * dd[1], gn = Math.hypot(g[0], g[1]);
    const ang = gn > 1e-12 ? Math.acos(clamp(-sl / gn, -1, 1)) * 180 / Math.PI : NaN;
    let abar = null;
    const f0 = F.f(p[0], p[1]);
    if (sl < 0) { for (let i = 1; i <= 3000; i++) { const a = 3 * i / 3000; if (F.f(p[0] + a * dd[0], p[1] + a * dd[1]) >= f0) { abar = a; break; } } }
    ro.innerHTML =
      '<div class="row">x = ' + vec(p, 3) + ', ∇f(x) = ' + vec(g, 3) + ', d = ' + vec(dd, 3) + '</div>' +
      '<div class="row">∇f(x)ᵀd = ' + num(sl, 4) + ' &nbsp; угол между d и −∇f = ' + num(ang, 1) + '° &nbsp; ' + (sl < 0 ? pill(true, 'направление спуска') : sl > 0 ? pill(false, 'направление подъёма') : pill(null, 'вдоль линии уровня')) + '</div>' +
      (sl < 0 ? '<div class="row">f(x + αd) &lt; f(x) при α ∈ (0, ' + (abar === null ? '3+' : num(abar, 3)) + ')</div>' : '');
  }
  drag(fm, {
    hit: (px, py, r) => {
      if (!v) return null;
      const dd = d();
      if (near(px, py, v.sx(p[0] + L * dd[0]), v.sy(p[1] + L * dd[1]), r)) return 'd';
      if (near(px, py, v.sx(p[0]), v.sy(p[1]), r)) return 'p';
      return null;
    },
    down: () => 'p',
    move: (id, px, py) => {
      const q = [v.wx(px), v.wy(py)];
      if (id === 'd') { th = ((Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI) + 360) % 360; sT.set(th); }
      else p = [clamp(q[0], F.xr[0], F.xr[1]), clamp(q[1], F.yr[0], F.yr[1])];
      upd();
    }
  });
  upd();
};

/* ================= gradient descent playground ================= */
WIDGETS.gd = (root, wid) => {
  let prob = 'quad', Lc = 10, lk = 1, rot = 30, aL = 1, aR = Math.log10(0.004);
  let start = [-2.4, 1.3], path = [];
  const c1 = row(root);
  selectBox(c1, wid, { name: 'prob', label: 'Функция', value: prob, options: [['quad', 'квадратичная ½xᵀQx'], ['rosen', 'Розенброк (невыпуклая)']], on: s => { prob = s; c2.hidden = s !== 'quad'; c3.hidden = s === 'quad'; start = s === 'quad' ? [-2.4, 1.3] : [-1.5, 2.2]; reset(); } });
  const c2 = row(root), c3 = row(root);
  slider(c2, wid, { name: 'L', label: 'L = λmax', min: 1, max: 20, step: 0.5, value: Lc, on: z => { Lc = z; reset(); } });
  const sK = slider(c2, wid, { name: 'k', label: 'κ = L/µ', min: 0, max: 2, step: 0.01, value: lk, fmt: z => num(Math.pow(10, z), 1), on: z => { lk = z; reset(); } });
  slider(c2, wid, { name: 'rot', label: 'поворот долины', min: 0, max: 90, step: 1, value: rot, fmt: z => Math.round(z) + '°', on: z => { rot = z; reset(); } });
  const sA = slider(c2, wid, { name: 'a', label: 'α·L', min: 0.05, max: 2.3, step: 0.01, value: aL, on: z => { aL = z; reset(); } });
  const sR = slider(c3, wid, { name: 'ar', label: 'α', min: -4, max: -1.5, step: 0.01, value: aR, fmt: z => num(Math.pow(10, z), 5), on: z => { aR = z; reset(); } });
  c3.hidden = true;
  const c4 = row(root);
  const qa = (m, lbl) => button(c4, lbl, () => { if (prob !== 'quad') return; const mu = Lc / Math.pow(10, lk); aL = m(mu); sA.set(aL); reset(); });
  qa(() => 1, 'α = 1/L');
  qa(mu => 2 * Lc / (Lc + mu), 'α = 2/(L + µ)');
  qa(() => 1.98, 'α ≈ 2/L');
  button(c4, 'Шаг', () => { an.stop(); steps(1); render(); });
  const bRun = button(c4, '▶ Пуск', () => { if (an.running()) an.stop(); else { bRun.textContent = '❚❚ Пауза'; an.start(); } }, 'primary');
  button(c4, 'Сброс', () => reset());
  const fr = figsRow(root);
  const fm = new Fig(fr, { aspect: 0.75, minH: 260, maxH: 400, label: 'Траектория градиентного спуска на карте уровней' });
  const fl = new Fig(fr, { aspect: 0.75, minH: 260, maxH: 400, scroll: true, label: 'Логарифм невязки по значению функции' });
  const ro = readout(root);
  let v = null;
  const fld = {};
  function Q() {
    const mu = Lc / Math.pow(10, lk), c = Math.cos(rot * Math.PI / 180), s = Math.sin(rot * Math.PI / 180);
    return { mu, L: Lc, a: Lc * c * c + mu * s * s, b: (Lc - mu) * c * s, d: Lc * s * s + mu * c * c };
  }
  function fun() {
    if (prob === 'quad') { const q = Q(); return { f: (x, y) => 0.5 * (q.a * x * x + 2 * q.b * x * y + q.d * y * y), g: (x, y) => [q.a * x + q.b * y, q.b * x + q.d * y], fs: 0, xs: [0, 0], xr: [-3, 3], yr: [-2.1, 2.1], alpha: aL / q.L, q }; }
    const R = F2.rosen; return { f: R.f, g: R.g, fs: 0, xs: [1, 1], xr: [-2, 2], yr: [-1, 3], alpha: Math.pow(10, aR) };
  }
  function steps(n) {
    const F = fun();
    for (let i = 0; i < n; i++) {
      const p = path[path.length - 1], g = F.g(p[0], p[1]);
      const q = [p[0] - F.alpha * g[0], p[1] - F.alpha * g[1]];
      path.push(q);
      if (!isFinite(F.f(q[0], q[1])) || Math.abs(F.f(q[0], q[1])) > 1e12) break;
    }
  }
  const done = () => { const F = fun(), p = path[path.length - 1], fv = F.f(p[0], p[1]); return path.length > 4000 || !isFinite(fv) || fv > 1e12 || fv - F.fs < 1e-14; };
  const an = animator(() => { steps(path.length < 40 ? 1 : path.length < 300 ? 5 : 25); render(); }, done, () => { bRun.textContent = '▶ Пуск'; }, 110);
  function reset() { an.stop(); path = [start.slice()]; render(); }
  fm.draw = c => {
    const F = fun();
    v = new View(fm, F.xr, F.yr, { equal: true, pad: { l: 30, b: 20 } });
    const key = prob === 'quad' ? [Lc, lk, rot].join(',') : 'rosen';
    drawField(c, v, cachedField(fld, key, v, F.f, { nLev: 14 }));
    axes(c, v, { noGrid: true });
    clipV(c, v);
    c.strokeStyle = T.orange; c.lineWidth = 1.6; c.beginPath();
    path.forEach((p, i) => { const x = clamp(p[0], -1e4, 1e4), y = clamp(p[1], -1e4, 1e4); if (i) c.lineTo(v.sx(x), v.sy(y)); else c.moveTo(v.sx(x), v.sy(y)); });
    c.stroke();
    const n = path.length;
    path.forEach((p, i) => { if (n > 200 && i % Math.ceil(n / 200) && i !== n - 1) return; dot(c, v.sx(p[0]), v.sy(p[1]), i === n - 1 ? 6 : 2.6, T.orange, i === n - 1 ? T.surface : null, 1.5); });
    c.restore();
    star(c, v.sx(F.xs[0]), v.sy(F.xs[1]), 8, T.green, T.surface);
    dot(c, v.sx(start[0]), v.sy(start[1]), 6, T.accent, T.surface, 2);
    label(c, 'x₀', v.sx(start[0]) + 9, v.sy(start[1]) - 11, { color: T.accent, font: '13px ' + MATHF, bg: T.surface });
  };
  fl.draw = c => {
    const F = fun();
    const vals = path.map(p => Math.log10(Math.max(1e-16, F.f(p[0], p[1]) - F.fs)));
    const kmax = Math.max(30, path.length - 1);
    let lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    const f0 = F.f(start[0], start[1]) - F.fs;
    const rows = [];
    if (prob === 'quad') {
      const q = F.q, rho = Math.max(Math.abs(1 - F.alpha * q.mu), Math.abs(1 - F.alpha * q.L));
      rows.push({ f: k => Math.log10(f0) + 2 * k * Math.log10(Math.max(rho, 1e-300)), col: T.muted, dash: [2, 3], lab: 'ρ(α)²ᵏ(f₀ − f⋆) — оценка для квадратичной' });
      if (Math.abs(aL - 1) < 0.006) rows.push({ f: k => Math.log10(f0) + k * Math.log10(1 - q.mu / q.L), col: T.green, dash: [6, 4], lab: '(1 − µ/L)ᵏ — гарантия теоремы' });
    }
    hi = Math.max(hi, Math.log10(f0) + 0.5); lo = Math.min(lo, hi - 3);
    if (!isFinite(lo)) lo = -16;
    const w = new View(fl, [0, kmax], [Math.max(-16, Math.floor(lo)), Math.ceil(Math.min(hi, 14))], { pad: { l: 40 } });
    axes(c, w, { ylog: true, xlab: 'k', ylab: 'f(xₖ) − f⋆' });
    rows.forEach((r, i) => { curve(c, w, r.f, { color: r.col, width: 1.6, dash: r.dash, x0: 0, x1: kmax }); label(c, r.lab, w.pad.l + 8, w.pad.t + 14 + 16 * i, { color: r.col, font: '11px ' + BODY, bg: T.surface }); });
    clipV(c, w);
    c.strokeStyle = T.orange; c.lineWidth = 2; c.beginPath();
    vals.forEach((y, k) => { const py = w.sy(clamp(y, w.y0 - 5, w.y1 + 5)); if (k) c.lineTo(w.sx(k), py); else c.moveTo(w.sx(k), py); });
    c.stroke(); c.restore();
  };
  function render() {
    fm.render(); fl.render();
    const F = fun(), p = path[path.length - 1], g = F.g(p[0], p[1]), fv = F.f(p[0], p[1]);
    let st = '';
    if (prob === 'quad') {
      const q = F.q, rho = Math.max(Math.abs(1 - F.alpha * q.mu), Math.abs(1 - F.alpha * q.L));
      st = '<div class="row">µ = ' + num(q.mu, 3) + ', L = ' + num(q.L, 2) + ', κ = ' + num(q.L / q.mu, 2) + ', α = ' + num(F.alpha, 5) + ' (α·L = ' + num(aL, 3) + ') &nbsp; ρ(α) = ' + num(rho, 4) + ' ' +
        (aL >= 2 - 1e-9 ? pill(false, aL > 2 + 1e-9 ? 'α &gt; 2/L: расходится' : 'α = 2/L: колебания без затухания') : 1 - F.alpha * q.L < 0 ? pill(null, 'сходится с колебаниями (1 − αL &lt; 0)') : pill(true, 'сходится монотонно')) + '</div>';
    } else st = '<div class="row">α = ' + num(F.alpha, 5) + ' (L меняется по пространству; у дна долины λmax ≈ 102, поэтому α &gt; 0.02 опасен)</div>';
    ro.innerHTML = st + '<div class="row">k = ' + (path.length - 1) + ' &nbsp; xₖ = ' + vec(p, 4) + ' &nbsp; f(xₖ) − f⋆ = ' + num(fv - F.fs, 4) + ' &nbsp; ‖∇f(xₖ)‖ = ' + num(Math.hypot(g[0], g[1]), 4) + '</div>';
  }
  drag(fm, {
    hit: (px, py, r) => (v && near(px, py, v.sx(start[0]), v.sy(start[1]), r)) ? 's' : null,
    down: () => 's',
    move: (id, px, py) => { start = [clamp(v.wx(px), v.x0, v.x1), clamp(v.wy(py), v.y0, v.y1)]; reset(); }
  });
  reset();
};

/* ================= Armijo backtracking ================= */
const ARM = {
  ell10: { name: '½(x² + 10y²), x = (1, 1)', f: (x, y) => 0.5 * (x * x + 10 * y * y), g: (x, y) => [x, 10 * y], p: [1, 1], L: 10 },
  quad: { name: 'x² + 3y² + xy, x = (1.2, 0.8)', f: F2.quad.f, g: F2.quad.g, p: [1.2, 0.8], L: 4 + Math.sqrt(5) },
  rosen: { name: 'Розенброк, x = (−1, 1)', f: F2.rosen.f, g: F2.rosen.g, p: [-1, 1], L: null }
};
WIDGETS.armijo = (root, wid) => {
  let key = 'ell10', P = ARM.ell10, a0 = 1, beta = 0.5, lc = -4, shown = 0;
  const c1 = row(root);
  selectBox(c1, wid, { name: 'fn', label: 'Функция и точка', value: key, options: Object.keys(ARM).map(k => [k, ARM[k].name]), on: k => { key = k; P = ARM[k]; a0 = k === 'rosen' ? 0.1 : 1; sa.set(a0); reset(); } });
  const sa = slider(c1, wid, { name: 'a0', label: 'α₀', min: 0.02, max: 2, step: 0.01, value: a0, on: z => { a0 = z; reset(); } });
  slider(c1, wid, { name: 'b', label: 'β', min: 0.1, max: 0.9, step: 0.05, value: beta, on: z => { beta = z; reset(); } });
  slider(c1, wid, { name: 'c', label: 'c', min: -4, max: -0.05, step: 0.01, value: lc, fmt: z => num(Math.pow(10, z), 4), on: z => { lc = z; reset(); } });
  const c2 = row(root);
  const bRun = button(c2, '▶ Запустить бэктрекинг', () => { reset(); bRun.disabled = true; an.start(); }, 'primary');
  button(c2, 'Показать все пробы', () => { an.stop(); shown = trials().length; render(); });
  const fig = new Fig(root, { aspect: 0.48, minH: 240, maxH: 360, label: 'Функция вдоль антиградиента, касательная и прямая Армихо' });
  const ro = readout(root);
  const c = () => Math.pow(10, lc);
  function setup() {
    const g = P.g(P.p[0], P.p[1]), d = [-g[0], -g[1]], f0 = P.f(P.p[0], P.p[1]), sl = g[0] * d[0] + g[1] * d[1];
    return { g, d, f0, sl, phi: a => P.f(P.p[0] + a * d[0], P.p[1] + a * d[1]) };
  }
  function trials() {
    const S = setup(), out = [];
    let a = a0;
    for (let j = 0; j < 60; j++) {
      const ph = S.phi(a), rhs = S.f0 + c() * a * S.sl, ok = ph <= rhs;
      out.push({ j, a, ph, rhs, ok });
      if (ok) break;
      a *= beta;
    }
    return out;
  }
  const an = animator(() => { shown++; render(); }, () => shown >= trials().length, () => { bRun.disabled = false; }, () => RM ? 60 : 650);
  function reset() { an.stop(); shown = 0; render(); }
  fig.draw = ctx => {
    const S = setup(), amax = a0 * 1.06;
    const arm = a => S.f0 + c() * a * S.sl, tan = a => S.f0 + a * S.sl;
    const yr = yRange([S.phi, arm], 0, amax, { capHi: S.f0 + 4 * Math.max(1, Math.abs(S.f0)), incl: S.f0 + 0.3 * Math.abs(S.sl) * amax * 0.2 });
    yr[0] = Math.max(yr[0], Math.min(S.f0 - 2.2 * Math.abs(S.f0), yr[0]));
    const v = new View(fig, [0, amax], yr, { pad: { l: 44 } });
    axes(ctx, v, { xlab: 'α', ylab: 'φ(α) = f(x − α∇f)' });
    clipV(ctx, v);
    const n = 400;
    for (let i = 0; i < n; i++) { const a = amax * (i + 0.5) / n; if (S.phi(a) <= arm(a)) { ctx.fillStyle = al(T.green, 0.55); ctx.fillRect(v.sx(amax * i / n), v.pad.t + v.H - 7, v.W / n + 0.7, 7); } }
    ctx.restore();
    curve(ctx, v, tan, { color: T.muted, width: 1.4, dash: [3, 4] });
    curve(ctx, v, arm, { color: T.orange, width: 2, dash: [7, 4] });
    curve(ctx, v, S.phi, { color: T.ink, width: 2.3 });
    if (P.L) {
      const ab = 2 * (1 - c()) / P.L;
      if (ab < amax) { ctx.save(); ctx.strokeStyle = al(T.green, 0.9); ctx.setLineDash([2, 3]); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(v.sx(ab), v.pad.t); ctx.lineTo(v.sx(ab), v.pad.t + v.H); ctx.stroke(); ctx.restore(); label(ctx, '2(1 − c)/L', v.sx(ab) + 4, v.pad.t + 12, { color: T.green, font: '11px ' + MATHF, bg: T.surface }); }
    }
    const tr = trials().slice(0, shown);
    tr.forEach(t => {
      const py = v.sy(clamp(t.ph, v.y0, v.y1));
      if (t.ok) dot(ctx, v.sx(t.a), py, 7, T.green, T.surface, 2);
      else { ctx.save(); ctx.strokeStyle = T.red; ctx.lineWidth = 2.6; const x = v.sx(t.a); ctx.beginPath(); ctx.moveTo(x - 6, py - 6); ctx.lineTo(x + 6, py + 6); ctx.moveTo(x + 6, py - 6); ctx.lineTo(x - 6, py + 6); ctx.stroke(); ctx.restore(); }
      label(ctx, 'j=' + t.j, v.sx(t.a), py - 15, { color: t.ok ? T.green : T.red, font: '11px ' + MONO, align: 'center', bg: T.surface });
    });
    label(ctx, 'Армихо: f(x) + cα∇fᵀd', v.pad.l + v.W - 6, v.pad.t + 14, { color: T.orange, font: '11px ' + BODY, align: 'right', bg: T.surface });
    label(ctx, 'касательная (c = 1)', v.pad.l + v.W - 6, v.pad.t + 32, { color: T.muted, font: '11px ' + BODY, align: 'right', bg: T.surface });
  };
  function render() {
    fig.render();
    const S = setup(), tr = trials();
    let h = '<div class="row">x = ' + vec(P.p, 2) + ', ∇f(x) = ' + vec(S.g, 3) + ', d = −∇f, ∇fᵀd = ' + num(S.sl, 4) + (P.L ? ', L = ' + num(P.L, 3) + ', проверка заведомо проходит при α ≤ 2(1 − c)/L = ' + num(2 * (1 - c()) / P.L, 4) : '') + '</div>';
    h += '<table><tr><th>j</th><th>α = βʲα₀</th><th>φ(α)</th><th>f(x) + cα∇fᵀd</th><th></th></tr>';
    tr.slice(0, Math.max(shown, 0)).forEach(t => { h += '<tr><td>' + t.j + '</td><td>' + num(t.a, 5) + '</td><td>' + num(t.ph, 5) + '</td><td>' + num(t.rhs, 5) + '</td><td>' + (t.ok ? '<span class="k-ok">✓ принят</span>' : '<span class="k-bad">✗</span>') + '</td></tr>'; });
    h += '</table>';
    if (shown >= tr.length && tr.length) { const t = tr[tr.length - 1]; h += '<div class="row">итог: α = ' + num(t.a, 5) + ' после ' + (tr.length - 1) + ' уменьшений; f уменьшилась на ' + num(S.f0 - t.ph, 4) + ', Армихо требовало не меньше ' + num(-c() * t.a * S.sl, 4) + '</div>'; }
    else h += '<div class="row k-mut">зелёные отрезки на оси — все α, которые проходят проверку</div>';
    ro.innerHTML = h;
  }
  reset();
};

/* ================= Newton's method (1D) ================= */
const NEWT = { expm: { x0: 0, xs: Math.log(2), win: [-1.2, 2.2] }, sqrt1: { x0: 0.9, xs: 0, win: [-2.6, 2.6] }, quart: { x0: 0.4, xs: null, win: [-2.1, 2.1] } };
WIDGETS.newton = (root, wid) => {
  let key = 'expm', F = F1.expm, P = NEWT.expm, x0 = P.x0, damped = false, xs = [x0], notes = [''];
  const c1 = row(root);
  selectBox(c1, wid, { name: 'fn', label: 'Функция', value: key, options: Object.keys(NEWT).map(k => [k, F1[k].name]), on: k => { key = k; F = F1[k]; P = NEWT[k]; x0 = P.x0; sx.range(P.win[0], P.win[1]); sx.set(x0); reset(); } });
  const sx = slider(c1, wid, { name: 'x0', label: 'x₀', min: P.win[0], max: P.win[1], step: 0.01, value: x0, on: z => { x0 = z; reset(); } });
  checkbox(c1, wid, { name: 'damp', label: 'демпфирование (Армихо) + регуляризация', checked: false, on: b => { damped = b; reset(); } });
  const c2 = row(root);
  button(c2, 'Шаг', () => { an.stop(); step(); upd(); });
  const bRun = button(c2, '▶ Пуск', () => { if (an.running()) an.stop(); else { bRun.textContent = '❚❚ Пауза'; an.start(); } }, 'primary');
  button(c2, 'Сброс', () => reset());
  const fig = new Fig(root, { aspect: 0.48, minH: 240, maxH: 360, label: 'Функция и квадратичная модель метода Ньютона' });
  const ro = readout(root);
  const an = animator(() => { step(); upd(); }, () => { const x = xs[xs.length - 1]; const still = xs.length > 1 && Math.abs(x - xs[xs.length - 2]) < 1e-13; return xs.length > 14 || still || !isFinite(x) || Math.abs(x) > 1e6 || Math.abs(F.d1(x)) < 1e-12; }, () => { bRun.textContent = '▶ Пуск'; }, () => RM ? 80 : 700);
  function reset() { an.stop(); xs = [x0]; notes = ['']; upd(); }
  function step() {
    const x = xs[xs.length - 1];
    if (!isFinite(x) || Math.abs(x) > 1e6) return;
    const g = F.d1(x), h = F.d2(x);
    if (!damped) {
      if (Math.abs(h) < 1e-12) { notes.push('f″ = 0: шаг не определён'); xs.push(x); return; }
      xs.push(x - g / h); notes.push(h < 0 ? 'f″ &lt; 0: модель — купол, шаг к её максимуму' : ''); return;
    }
    let p, note;
    if (h > 1e-12) { p = -g / h; note = 'ньютоновский шаг'; }
    else { const lam = Math.abs(h) + 1; p = -g / (h + lam); note = 'f″ ≤ 0 ⇒ (f″ + λ)p = −f′, λ = ' + num(lam, 2); }
    let a = 1;
    if (Math.abs(g * p) > 1e-13) for (let j = 0; j < 50 && F.f(x + a * p) > F.f(x) + 1e-4 * a * g * p; j++) a *= 0.5;
    xs.push(x + a * p); notes.push(note + (a < 1 ? ', Армихо: α = ' + num(a, 4) : ', α = 1'));
  }
  fig.draw = c => {
    const yr = yRange([F.f], P.win[0], P.win[1], { pad: 0.2 });
    const v = new View(fig, P.win, yr);
    axes(c, v, { xlab: 'x', ylab: 'f' });
    curve(c, v, F.f, { color: T.ink, width: 2.3 });
    const x = xs[xs.length - 1];
    if (isFinite(x) && Math.abs(x) < 1e6) {
      const g = F.d1(x), h = F.d2(x), f0 = F.f(x);
      curve(c, v, s => f0 + g * (s - x) + 0.5 * h * (s - x) * (s - x), { color: T.orange, width: 1.8, dash: [6, 4] });
      if (Math.abs(h) > 1e-12) {
        const xn = x - g / h, qn = f0 - 0.5 * g * g / h;
        arrow(c, v.sx(x), v.sy(f0), v.sx(clamp(xn, v.x0, v.x1)), v.sy(clamp(qn, v.y0, v.y1)), h > 0 ? T.accent : T.red, 1.8, 8, [4, 3]);
        if (xn > v.x0 && xn < v.x1) dot(c, v.sx(xn), v.sy(clamp(qn, v.y0, v.y1)), 4, h > 0 ? T.orange : T.red);
      }
      dot(c, v.sx(x), v.sy(f0), 7, T.accent, T.surface, 2);
    }
    xs.slice(0, -1).forEach(z => { if (isFinite(z) && z > v.x0 && z < v.x1) dot(c, v.sx(z), v.sy(F.f(z)), 3, al(T.accent, 0.6)); });
    if (P.xs !== null) star(c, v.sx(P.xs), v.sy(F.f(P.xs)), 7, T.green, T.surface);
  };
  function upd() {
    fig.render();
    let h = '<table><tr><th>k</th><th>xₖ</th><th>f′(xₖ)</th><th>f″(xₖ)</th>' + (P.xs !== null ? '<th>|xₖ − x⋆|</th><th>верных знаков</th>' : '') + '<th></th></tr>';
    xs.forEach((x, k) => {
      const e = P.xs !== null ? Math.abs(x - P.xs) : null;
      h += '<tr><td>' + k + '</td><td>' + num(x, 8) + '</td><td>' + num(F.d1(x), 3) + '</td><td>' + num(F.d2(x), 3) + '</td>' +
        (e !== null ? '<td>' + num(e, 3) + '</td><td>' + (e > 0 ? Math.max(0, Math.floor(-Math.log10(e))) : '≥ 16') + '</td>' : '') +
        '<td class="k-mut">' + (notes[k] || '') + '</td></tr>';
    });
    h += '</table>';
    const x = xs[xs.length - 1];
    if (!isFinite(x) || Math.abs(x) > 1e5) h += '<div class="row">' + pill(false, 'расходится') + (key === 'sqrt1' ? ' здесь x⁺ = −x³: при |x₀| &gt; 1 ошибки растут' : '') + '</div>';
    else if (key === 'quart' && Math.abs(F.d1(x)) < 1e-8) h += '<div class="row">сошлось к стационарной точке, f″ = ' + num(F.d2(x), 3) + ' ⇒ ' + (F.d2(x) > 0 ? pill(true, 'минимум') : pill(false, 'максимум: чистый Ньютон ищет нули f′, а не минимумы')) + '</div>';
    ro.innerHTML = h;
  }
  reset();
};

/* ================= Lagrangian (1D) ================= */
WIDGETS.lagrangian = (root, wid) => {
  let b = 1, lam = 1;
  const c1 = row(root);
  slider(c1, wid, { name: 'b', label: 'b (ограничение x ≥ b)', min: -1.5, max: 2, step: 0.05, value: b, on: z => { b = z; upd(); } });
  const sl = slider(c1, wid, { name: 'lam', label: 'λ', min: 0, max: 5, step: 0.01, value: lam, on: z => { lam = z; upd(); } });
  const c2 = row(root);
  button(c2, 'λ = λ⋆', () => { lam = Math.max(0, 2 * b); sl.set(lam); upd(); });
  const fig = new Fig(root, { aspect: 0.48, minH: 240, maxH: 360, label: 'Целевая функция, лагранжиан и допустимая зона' });
  const ro = readout(root);
  fig.draw = c => {
    const v = new View(fig, [-2.5, 3.2], [-3, 7]);
    axes(c, v, { xlab: 'x' });
    clipV(c, v); c.fillStyle = al(T.green, 0.1); c.fillRect(v.sx(b), v.pad.t, v.pad.l + v.W - v.sx(b), v.H); c.restore();
    c.save(); c.strokeStyle = T.green; c.lineWidth = 1.6; c.beginPath(); c.moveTo(v.sx(b), v.pad.t); c.lineTo(v.sx(b), v.pad.t + v.H); c.stroke(); c.restore();
    label(c, 'x ≥ b', v.sx(b) + 6, v.pad.t + 12, { color: T.green, font: '12px ' + MATHF });
    const f = x => x * x, L = x => x * x + lam * (b - x);
    fillBetween(c, v, f, L, al(T.accent, 0.16), { x0: b });
    curve(c, v, f, { color: T.muted, width: 2 });
    curve(c, v, L, { color: T.accent, width: 2.4 });
    const xl = lam / 2, q = lam * b - lam * lam / 4, xstar = Math.max(b, 0), ps = xstar * xstar;
    c.save(); c.strokeStyle = T.accent; c.setLineDash([5, 4]); c.lineWidth = 1.2; c.beginPath(); c.moveTo(v.pad.l, v.sy(q)); c.lineTo(v.pad.l + v.W, v.sy(q)); c.stroke();
    c.strokeStyle = T.green; c.beginPath(); c.moveTo(v.pad.l, v.sy(ps)); c.lineTo(v.pad.l + v.W, v.sy(ps)); c.stroke(); c.restore();
    label(c, 'q(λ) = min L', v.pad.l + 6, v.sy(q) + 11, { color: T.accent, font: '11px ' + BODY, bg: T.surface });
    label(c, 'p⋆', v.pad.l + v.W - 22, v.sy(ps) - 10, { color: T.green, font: '12px ' + MATHF, bg: T.surface });
    star(c, v.sx(xstar), v.sy(ps), 8, T.green, T.surface);
    dot(c, v.sx(xl), v.sy(q), 6, T.accent, T.surface, 2);
    label(c, 'f(x) = x²', v.sx(-2.1), v.sy(4.41) - 12, { color: T.muted, font: '12px ' + MATHF });
  };
  function upd() {
    fig.render();
    const xl = lam / 2, q = lam * b - lam * lam / 4, xstar = Math.max(b, 0), ps = xstar * xstar, ls = Math.max(0, 2 * b);
    ro.innerHTML =
      '<div class="row">min x² при g(x) = b − x ≤ 0 &nbsp; L(x, λ) = x² + λ(b − x) = x² + ' + num(lam, 2) + '·(' + num(b, 2) + ' − x)</div>' +
      '<div class="row">argminₓ L = λ/2 = ' + num(xl, 3) + (xl >= b - 1e-9 ? ' (допустима)' : ' <span class="k-warn">(вне допустимой зоны)</span>') + ' &nbsp; q(λ) = λb − λ²/4 = ' + num(q, 4) + ' ≤ p⋆ = ' + num(ps, 4) + ' ✓</div>' +
      '<div class="row">λ⋆ = max(0, 2b) = ' + num(ls, 3) + ', x⋆ = ' + num(xstar, 3) + ' &nbsp; ' + (b > 0 ? 'ограничение активно, λ⋆ &gt; 0' : 'ограничение неактивно ⇒ λ⋆ = 0 (дополняющая нежёсткость)') + '</div>' +
      '<div class="row">' + (Math.abs(lam - ls) < 0.011 ? pill(true, 'λ = λ⋆: минимум лагранжиана совпал с x⋆, q(λ⋆) = p⋆') : '<span class="k-mut">на допустимой зоне синяя кривая ниже серой: λ(b − x) ≤ 0 при x ≥ b</span>') + '</div>';
  }
  upd();
};

/* ================= dual function ================= */
WIDGETS.dual = (root, wid) => {
  let prob = 'p1', b = 1, s = 3, lam = 1;
  const c1 = row(root);
  selectBox(c1, wid, { name: 'prob', label: 'Задача', value: prob, options: [['p1', 'min x² при x ≥ b'], ['pP', 'задача P: x₁ + x₂ ≤ s']], on: z => { prob = z; c2.hidden = z !== 'p1'; c3.hidden = z === 'p1'; upd(); } });
  const sl = slider(c1, wid, { name: 'lam', label: 'λ', min: 0, max: 6, step: 0.01, value: lam, on: z => { lam = z; upd(); } });
  const c2 = row(root), c3 = row(root);
  slider(c2, wid, { name: 'b', label: 'b', min: -1.5, max: 2, step: 0.05, value: b, on: z => { b = z; upd(); } });
  slider(c3, wid, { name: 's', label: 's', min: 1, max: 6, step: 0.05, value: s, on: z => { s = z; upd(); } });
  c3.hidden = true;
  const c4 = row(root);
  button(c4, 'λ = λ⋆', () => { lam = cur().ls; sl.set(lam); upd(); });
  const fig = new Fig(root, { aspect: 0.46, minH: 240, maxH: 350, label: 'Двойственная функция и оптимальное значение прямой задачи' });
  const ro = readout(root);
  function cur() {
    if (prob === 'p1') { const q = l => l * b - l * l / 4; const ls = Math.max(0, 2 * b); return { q, ls, ps: Math.max(b, 0) ** 2, ds: q(ls), txt: 'q(λ) = λb − λ²/4' }; }
    const q = l => l * (5 - s) - l * l / 2; const ls = Math.max(0, 5 - s); return { q, ls, ps: Math.max(0, 5 - s) ** 2 / 2, ds: q(ls), txt: 'q(λ) = λ(5 − s) − λ²/2' };
  }
  fig.draw = c => {
    const C = cur();
    let lo = Math.min(C.q(6), C.q(0)), hi = Math.max(C.ps, C.ds);
    lo = Math.max(lo, C.ps - 8);
    const v = new View(fig, [0, 6], [lo - 0.5, hi + 1.2], { pad: { l: 40 } });
    axes(c, v, { xlab: 'λ', ylab: 'q(λ)' });
    c.save(); c.strokeStyle = T.green; c.lineWidth = 1.8; c.setLineDash([6, 4]); c.beginPath(); c.moveTo(v.pad.l, v.sy(C.ps)); c.lineTo(v.pad.l + v.W, v.sy(C.ps)); c.stroke(); c.restore();
    label(c, 'p⋆ = ' + num(C.ps, 3), v.pad.l + v.W - 8, v.sy(C.ps) - 11, { color: T.green, font: '12px ' + MATHF, align: 'right', bg: T.surface });
    curve(c, v, C.q, { color: T.accent, width: 2.4 });
    const ql = C.q(lam);
    c.save(); c.strokeStyle = T.orange; c.lineWidth = 3; c.beginPath(); c.moveTo(v.sx(lam), v.sy(clamp(ql, v.y0, v.y1))); c.lineTo(v.sx(lam), v.sy(C.ps)); c.stroke(); c.restore();
    star(c, v.sx(C.ls), v.sy(C.ds), 8, T.green, T.surface);
    dot(c, v.sx(lam), v.sy(clamp(ql, v.y0, v.y1)), 6.5, T.accent, T.surface, 2);
    label(c, 'зазор p⋆ − q(λ)', v.sx(lam) + 8, (v.sy(clamp(ql, v.y0, v.y1)) + v.sy(C.ps)) / 2, { color: T.orange, font: '11px ' + BODY, bg: T.surface });
  };
  function upd() {
    fig.render();
    const C = cur(), ql = C.q(lam);
    ro.innerHTML =
      '<div class="row">' + C.txt + ' &nbsp; при λ = ' + num(lam, 2) + ': q(λ) = ' + num(ql, 4) + ' ≤ p⋆ = ' + num(C.ps, 4) + ' ' + pill(true, 'слабая двойственность') + '</div>' +
      '<div class="row">двойственная задача: max q(λ) при λ ≥ 0 ⇒ λ⋆ = ' + num(C.ls, 3) + ', d⋆ = ' + num(C.ds, 4) + ' &nbsp; зазор p⋆ − d⋆ = ' + num(C.ps - C.ds, 4) + ' ' + pill(true, 'сильная двойственность') + '</div>' +
      '<div class="row k-mut">задача выпуклая и есть строго допустимая точка (условие Слейтера), поэтому d⋆ = p⋆</div>';
  }
  upd();
};

/* ================= hero art ================= */
function heroArt() {
  const cv = document.getElementById('hero-cv');
  if (!cv) return;
  const wrap = cv.parentElement;
  const draw = () => {
    const w = wrap.clientWidth, h = wrap.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = w * dpr; cv.height = h * dpr;
    const c = cv.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = T.surface; c.fillRect(0, 0, w, h);
    const L = 9, mu = 1, ang = -0.42, cx = w * 0.56, cy = h * 0.52, sc = Math.min(w, h) * 0.36;
    c.save(); c.translate(cx, cy); c.rotate(ang);
    for (let i = 1; i <= 9; i++) {
      const lev = Math.pow(i / 9, 2) * 1.6;
      c.beginPath(); c.ellipse(0, 0, Math.sqrt(2 * lev / mu) * sc * 0.75, Math.sqrt(2 * lev / L) * sc * 0.75, 0, 0, 2 * Math.PI);
      c.strokeStyle = al(T.accent, 0.12 + 0.05 * (9 - i) / 9 * 4); c.lineWidth = 1; c.stroke();
    }
    let p = [-1.55, 0.5];
    const a = 1.75 / L;
    c.beginPath();
    const pts = [p];
    for (let k = 0; k < 26; k++) { p = [p[0] - a * mu * p[0], p[1] - a * L * p[1]]; pts.push(p); }
    pts.forEach((q, i) => { const X = q[0] * sc * 0.75, Y = -q[1] * sc * 0.75; if (i) c.lineTo(X, Y); else c.moveTo(X, Y); });
    c.strokeStyle = T.orange; c.lineWidth = 1.6; c.stroke();
    pts.forEach((q, i) => dot(c, q[0] * sc * 0.75, -q[1] * sc * 0.75, i ? 2.2 : 4.5, T.orange));
    star(c, 0, 0, 7, T.green);
    c.restore();
    c.fillStyle = T.muted; c.font = '11px ' + MONO; c.textAlign = 'left';
    c.fillText('xₖ₊₁ = xₖ − α∇f(xₖ),  κ = 9', 12, h - 14);
  };
  draw();
  new ResizeObserver(draw).observe(wrap);
  return draw;
}
