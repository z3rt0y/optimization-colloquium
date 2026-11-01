
/* ================= helpers for proofs & practice ================= */
const WAPI = {};
function numBox(parent, wid, o) {
  const id = wid + '-' + o.name;
  const lab = document.createElement('label'); lab.className = 'numin'; lab.htmlFor = id;
  const sp = document.createElement('span'); sp.innerHTML = o.label;
  const inp = document.createElement('input'); inp.type = 'number'; inp.id = id; inp.step = o.step || 'any'; inp.value = o.value; inp.inputMode = 'decimal';
  lab.append(sp, inp);
  parent.appendChild(lab);
  inp.addEventListener('input', () => { const v = parseFloat(inp.value); if (isFinite(v) && o.on) o.on(v); });
  return { inp, get v() { const v = parseFloat(inp.value); return isFinite(v) ? v : 0; }, set(x) { inp.value = String(+(+x).toFixed(6)); } };
}
function parseAns(s) {
  s = String(s).trim().replace(/−/g, '-').replace(/,/g, '.').replace(/\s+/g, '');
  const m = s.match(/^(-?\d*\.?\d+)\/(-?\d*\.?\d+)$/);
  if (m) return parseFloat(m[1]) / parseFloat(m[2]);
  if (/^-?\d*\.?\d+(e-?\d+)?$/i.test(s)) return parseFloat(s);
  return NaN;
}
function linFmt(terms, d) {
  if (d === undefined) d = 4;
  let s = '';
  for (const t of terms) {
    const k = t[0], v = t[1];
    if (Math.abs(k) < 1e-12) continue;
    const neg = k < 0, m = Math.abs(k);
    const coef = (v && Math.abs(m - 1) < 1e-12) ? '' : num(m, d);
    s += (s ? (neg ? ' − ' : ' + ') : (neg ? '−' : '')) + coef + v;
  }
  return s || '0';
}
function contourOf(v, fn, level, res) {
  res = res || 4;
  const nx = Math.max(4, Math.ceil(v.W / res)), ny = Math.max(4, Math.ceil(v.H / res));
  const Z = new Float64Array((nx + 1) * (ny + 1));
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const z = fn(v.x0 + (v.x1 - v.x0) * i / nx, v.y1 - (v.y1 - v.y0) * j / ny);
    Z[j * (nx + 1) + i] = isFinite(z) ? z : NaN;
  }
  return marching(Z, nx, ny, [level], v)[0];
}
function hline(c, v, y, color, dash, lw) {
  if (y < v.y0 || y > v.y1) return;
  c.save(); c.strokeStyle = color; c.lineWidth = lw || 1.4; if (dash) c.setLineDash(dash);
  c.beginPath(); c.moveTo(v.pad.l, v.sy(y)); c.lineTo(v.pad.l + v.W, v.sy(y)); c.stroke(); c.restore();
}
function vline(c, v, x, color, dash, lw) {
  if (x < v.x0 || x > v.x1) return;
  c.save(); c.strokeStyle = color; c.lineWidth = lw || 1.4; if (dash) c.setLineDash(dash);
  c.beginPath(); c.moveTo(v.sx(x), v.pad.t); c.lineTo(v.sx(x), v.pad.t + v.H); c.stroke(); c.restore();
}
function seg(c, v, x1, y1, x2, y2, color, lw, dash) {
  c.save(); c.strokeStyle = color; c.lineWidth = lw || 2; c.lineCap = 'round'; if (dash) c.setLineDash(dash);
  c.beginPath(); c.moveTo(v.sx(x1), v.sy(y1)); c.lineTo(v.sx(x2), v.sy(y2)); c.stroke(); c.restore();
}
function simpson(fn, a, b, n) {
  n = n || 200; if (n % 2) n++;
  const h = (b - a) / n;
  let s = fn(a) + fn(b);
  for (let i = 1; i < n; i++) s += (i % 2 ? 4 : 2) * fn(a + i * h);
  return s * h / 3;
}
const ok = (b, t1, t2) => b ? '<span class="k-ok">' + (t1 || '✓') + '</span>' : '<span class="k-bad">' + (t2 || '✗') + '</span>';
const sigm = x => 1 / (1 + Math.exp(-x));

/* ================= T1: first-order criterion ================= */
WIDGETS.pf1 = (root, wid) => {
  const FN = { exp: F1.exp, sq: F1.sq, sp: F1.sp, w: F1.w, sin: F1.sin };
  let key = 'exp', F = FN.exp, x = -0.8, y = 1.3, lt = Math.log10(0.5), mode = 'fwd';
  const c1 = row(root);
  selectBox(c1, wid, { name: 'fn', label: 'Функция', value: key, options: [['exp', 'eˣ'], ['sq', 'x²'], ['sp', 'ln(1 + eˣ)'], ['w', 'x⁴ − 3x² (невыпуклая)'], ['sin', 'sin x (невыпуклая)']], on: k => { key = k; F = FN[k]; upd(); } });
  selectBox(c1, wid, { name: 'mode', label: 'Часть доказательства', value: mode, options: [['fwd', '(⇒) разностное отношение'], ['bwd', '(⇐) касательные в z']], on: m => { mode = m; fig2.wrap.hidden = m !== 'fwd'; bAn.hidden = m !== 'fwd'; an.stop(); if (m === 'bwd') { lt = Math.log10(0.4); sT.set(lt); } upd(); } });
  const sT = slider(c1, wid, { name: 't', label: 't', min: -3, max: 0, step: 0.01, value: lt, fmt: z => num(Math.pow(10, z), 4), on: z => { lt = z; upd(); } });
  const c2 = row(root);
  const bAn = button(c2, '▶ t → 0', () => { if (an.running()) { an.stop(); return; } if (lt <= -2.95) { lt = 0; sT.set(lt); } bAn.textContent = '❚❚ стоп'; an.start(); }, 'primary');
  const an = animator(() => { lt = Math.max(-3, lt - 0.05); sT.set(lt); upd(); }, () => lt <= -3, () => { bAn.textContent = '▶ t → 0'; }, RM ? 20 : 45);
  const X0 = -2.6, X1 = 2.6;
  const fig = new Fig(root, { aspect: 0.46, minH: 240, maxH: 360, label: 'График функции, секущая, касательная и хорда' });
  const fig2 = new Fig(root, { aspect: 0.2, minH: 130, maxH: 180, scroll: true, label: 'Разностное отношение как функция t' });
  const ro = readout(root);
  let v = null;
  const tNow = () => Math.pow(10, lt);
  const yr = () => key === 'exp' ? [-1, 9] : yRange([F.f], X0, X1, { pad: 0.12 });
  fig.draw = c => {
    v = new View(fig, [X0, X1], yr());
    axes(c, v, { xlab: 'x', ylab: 'f' });
    curve(c, v, F.f, { color: T.ink, width: 2.3 });
    const t = tNow(), fx = F.f(x), fy = F.f(y);
    if (mode === 'fwd') {
      const z = x + t * (y - x), fz = F.f(z);
      curve(c, v, s => fx + F.d1(x) * (s - x), { color: T.orange, width: 1.6, dash: [6, 4] });
      seg(c, v, x, fx, y, fy, al(T.muted, 0.9), 1.6, [3, 3]);
      const sl = Math.abs(z - x) > 1e-12 ? (fz - fx) / (z - x) : F.d1(x);
      const lo = Math.min(x, y), hi = Math.max(x, y);
      seg(c, v, lo, fx + sl * (lo - x), hi, fx + sl * (hi - x), T.green, 2.2);
      dot(c, v.sx(z), v.sy(fz), 5, T.green, T.surface, 1.5);
      label(c, 'z_t', v.sx(z), v.sy(fz) + 15, { color: T.green, font: 'italic 12px ' + MATHF, align: 'center', bg: T.surface });
    } else {
      const z = (1 - t) * x + t * y, fz = F.f(z), dz = F.d1(z);
      const tan = s => fz + dz * (s - z);
      curve(c, v, tan, { color: T.orange, width: 1.8, dash: [6, 4] });
      seg(c, v, x, tan(x), x, fx, fx >= tan(x) - 1e-12 ? T.green : T.red, 4);
      seg(c, v, y, tan(y), y, fy, fy >= tan(y) - 1e-12 ? T.green : T.red, 4);
      seg(c, v, x, fx, y, fy, T.accent, 1.8);
      const ch = (1 - t) * fx + t * fy;
      seg(c, v, z, fz, z, ch, ch >= fz - 1e-12 ? al(T.green, 0.8) : T.red, 2, [2, 3]);
      dot(c, v.sx(z), v.sy(ch), 4.5, T.accent);
      dot(c, v.sx(z), v.sy(fz), 5.5, T.orange, T.surface, 1.5);
      dot(c, v.sx(x), v.sy(tan(x)), 3.5, T.orange);
      dot(c, v.sx(y), v.sy(tan(y)), 3.5, T.orange);
      label(c, 'z', v.sx(z), v.sy(fz) + 15, { color: T.orange, font: 'italic 13px ' + MATHF, align: 'center', bg: T.surface });
    }
    dot(c, v.sx(x), v.sy(fx), 7, T.accent, T.surface, 2);
    dot(c, v.sx(y), v.sy(fy), 7, T.accent, T.surface, 2);
    label(c, 'x', v.sx(x), v.sy(fx) - 15, { color: T.accent, font: 'italic 13px ' + MATHF, align: 'center', bg: T.surface });
    label(c, 'y', v.sx(y), v.sy(fy) - 15, { color: T.accent, font: 'italic 13px ' + MATHF, align: 'center', bg: T.surface });
  };
  fig2.draw = c => {
    const fx = F.f(x), d = y - x;
    const Q = t => (F.f(x + t * d) - fx) / t;
    const tv = F.d1(x) * d, cv = F.f(y) - fx;
    const r = yRange([Q], 0.001, 1, { incl: tv, pad: 0.15 });
    const r2 = [Math.min(r[0], tv, cv) - 0.1 * Math.abs(cv - tv) - 0.05, Math.max(r[1], tv, cv) + 0.1 * Math.abs(cv - tv) + 0.05];
    const w = new View(fig2, [0, 1], r2, { pad: { l: 44, t: 6, b: 18 } });
    axes(c, w, { xlab: 't', ylab: 'Q(t)' });
    hline(c, w, tv, T.orange, [6, 4], 1.6);
    hline(c, w, cv, al(T.muted, 0.9), [3, 3], 1.4);
    curve(c, w, Q, { color: T.green, width: 2.2, x0: 0.001, x1: 1 });
    const t = tNow();
    dot(c, w.sx(t), w.sy(Q(t)), 5.5, T.green, T.surface, 1.5);
    label(c, '⟨∇f(x), y − x⟩', w.pad.l + w.W - 6, w.sy(tv) + 11, { color: T.orange, font: '11px ' + BODY, align: 'right', bg: T.surface });
    label(c, 'f(y) − f(x)', w.pad.l + w.W - 6, w.sy(cv) - 11, { color: T.muted, font: '11px ' + BODY, align: 'right', bg: T.surface });
  };
  function upd() {
    fig.render(); if (mode === 'fwd') fig2.render();
    const t = tNow(), fx = F.f(x), fy = F.f(y), d = y - x;
    const crit = fy >= fx + F.d1(x) * d - 1e-12;
    let h = '<div class="row">x = ' + num(x, 3) + ', y = ' + num(y, 3) + ', t = ' + num(t, 4) + '</div>';
    if (mode === 'fwd') {
      const z = x + t * d, Q = (F.f(z) - fx) / t, tv = F.d1(x) * d, cv = fy - fx;
      h += '<div class="row">шаг 1: z_t = x + t(y − x) = ' + num(z, 4) + ', &nbsp; f(z_t) = ' + num(F.f(z), 4) + ' ≤ (1 − t)f(x) + t f(y) = ' + num((1 - t) * fx + t * fy, 4) + ' ' + ok(F.f(z) <= (1 - t) * fx + t * fy + 1e-12) + '</div>';
      h += '<div class="row">шаг 2: Q(t) = [f(z_t) − f(x)]/t = ' + num(Q, 5) + ' ≤ f(y) − f(x) = ' + num(cv, 5) + ' ' + ok(Q <= cv + 1e-9) + '</div>';
      h += '<div class="row">шаг 3: при t → 0 Q(t) → ⟨∇f(x), y − x⟩ = f′(x)(y − x) = ' + num(tv, 5) + ' &nbsp; (сейчас разница ' + num(Q - tv, 4) + ')</div>';
    } else {
      const z = (1 - t) * x + t * y, fz = F.f(z), dz = F.d1(z);
      const tx = fz + dz * (x - z), ty = fz + dz * (y - z);
      h += '<div class="row">z = (1 − t)x + ty = ' + num(z, 4) + ', f(z) = ' + num(fz, 4) + ', f′(z) = ' + num(dz, 4) + '</div>';
      h += '<div class="row">шаг 4: f(x) = ' + num(fx, 4) + ' ≥ f(z) + f′(z)(x − z) = ' + num(tx, 4) + ' ' + ok(fx >= tx - 1e-12) + ' &nbsp; f(y) = ' + num(fy, 4) + ' ≥ ' + num(ty, 4) + ' ' + ok(fy >= ty - 1e-12) + '</div>';
      h += '<div class="row">шаг 6: (1 − t)(x − z) + t(y − z) = ' + num((1 - t) * (x - z) + t * (y - z), 6) + ' &nbsp; ⇒ (1 − t)·(' + num(tx, 3) + ') + t·(' + num(ty, 3) + ') = ' + num((1 - t) * tx + t * ty, 4) + ' = f(z)</div>';
      h += '<div class="row">итог: (1 − t)f(x) + t f(y) = ' + num((1 - t) * fx + t * fy, 4) + ' ≥ f(z) = ' + num(fz, 4) + ' ' + ok((1 - t) * fx + t * fy >= fz - 1e-12) + '</div>';
    }
    h += '<div class="row">критерий в этой паре: f(y) ≥ f(x) + f′(x)(y − x) — ' + (crit ? pill(true, 'выполнен') : pill(false, 'нарушен: функция невыпукла')) + '</div>';
    ro.innerHTML = h;
  }
  drag(fig, {
    hit: (px, py, r) => { if (!v) return null; if (near(px, py, v.sx(x), v.sy(F.f(x)), r)) return 'x'; if (near(px, py, v.sx(y), v.sy(F.f(y)), r)) return 'y'; return null; },
    move: (id, px) => { const q = clamp(v.wx(px), X0 + 0.05, X1 - 0.05); if (id === 'x') x = q; else y = q; upd(); }
  });
  upd();
};

/* ================= T2: second-order criterion ================= */
const LSE = { name: 'ln(eˣ + eʸ)', f: (x, y) => { const m = Math.max(x, y); return m + Math.log(Math.exp(x - m) + Math.exp(y - m)); }, g: (x, y) => { const p = sigm(x - y); return [p, 1 - p]; }, H: (x, y) => { const p = sigm(x - y), q = p * (1 - p); return [[q, -q], [-q, q]]; }, xr: [-2, 2], yr: [-2, 2], p0: [0.3, -0.4] };
WIDGETS.pf2 = (root, wid) => {
  const FN = { quad: Object.assign({}, F2.quad, { cvx: true }), saddle5: Object.assign({}, F2.saddle5, { cvx: false }), quartic: Object.assign({}, F2.quartic, { cvx: true }), lse: Object.assign({}, LSE, { cvx: true }) };
  let key = 'saddle5', F = FN.saddle5, p = [0.5, 0.3], th = 70;
  const c1 = row(root);
  selectBox(c1, wid, { name: 'fn', label: 'Функция', value: key, options: [['quad', 'x² + 3y² + xy'], ['saddle5', '½x² − y² + ¼y⁴'], ['quartic', 'x⁴ + y⁴'], ['lse', 'ln(eˣ + eʸ)']], on: k => { key = k; F = FN[k]; p = (F.p0 || [0.5, 0.3]).slice(); upd(); } });
  const sT = slider(c1, wid, { name: 'th', label: 'угол d', min: 0, max: 359, step: 1, value: th, fmt: z => Math.round(z) + '°', on: z => { th = z; upd(); } });
  const fr = figsRow(root);
  const fm = new Fig(fr, { aspect: 0.85, minH: 240, maxH: 360, label: 'Карта уровней, точка x и направление d' });
  const fl = new Fig(fr, { aspect: 0.85, minH: 240, maxH: 360, scroll: true, label: 'Сужение функции на прямую' });
  const fq = new Fig(root, { aspect: 0.2, minH: 130, maxH: 180, scroll: true, label: 'Вторая производная вдоль направления как функция угла' });
  const ro = readout(root);
  let v = null;
  const fld = {};
  const L = 0.8;
  const dv = a => [Math.cos(a * Math.PI / 180), Math.sin(a * Math.PI / 180)];
  const qf = (H, d) => H[0][0] * d[0] * d[0] + 2 * H[0][1] * d[0] * d[1] + H[1][1] * d[1] * d[1];
  fm.draw = c => {
    v = new View(fm, [-2, 2], [-2, 2], { equal: true, pad: { l: 30, b: 20 } });
    drawField(c, v, cachedField(fld, key, v, F.f, {}));
    axes(c, v, { noGrid: true });
    const d = dv(th);
    lineWorld(c, v, p, d, al(T.green, 0.8), 1.4, [5, 4]);
    arrow(c, v.sx(p[0]), v.sy(p[1]), v.sx(p[0] + L * d[0]), v.sy(p[1] + L * d[1]), T.green, 2.6);
    dot(c, v.sx(p[0] + L * d[0]), v.sy(p[1] + L * d[1]), 5, T.green, T.surface, 1.5);
    label(c, 'd', v.sx(p[0] + (L + 0.14) * d[0]), v.sy(p[1] + (L + 0.14) * d[1]), { color: T.green, font: 'italic 13px ' + MATHF, align: 'center', bg: T.surface });
    dot(c, v.sx(p[0]), v.sy(p[1]), 7, T.accent, T.surface, 2);
  };
  fl.draw = c => {
    const d = dv(th), H = F.H(p[0], p[1]), g = F.g(p[0], p[1]);
    const phi = t => F.f(p[0] + t * d[0], p[1] + t * d[1]);
    const f0 = phi(0), d1 = g[0] * d[0] + g[1] * d[1], d2 = qf(H, d);
    const w = new View(fl, [-1.5, 1.5], yRange([phi], -1.5, 1.5, { pad: 0.15 }), { pad: { l: 40 } });
    axes(c, w, { xlab: 't', ylab: 'φ(t) = f(x + td)' });
    curve(c, w, t => f0 + d1 * t, { color: T.orange, width: 1.4, dash: [6, 4] });
    curve(c, w, t => f0 + d1 * t + 0.5 * d2 * t * t, { color: T.violet, width: 1.6, dash: [3, 3] });
    curve(c, w, phi, { color: T.ink, width: 2.3 });
    dot(c, w.sx(0), w.sy(f0), 6, T.accent, T.surface, 2);
    label(c, 'модель φ(0) + φ′(0)t + ½φ″(0)t²', w.pad.l + 8, w.pad.t + 12, { color: T.violet, font: '11px ' + BODY, bg: T.surface });
  };
  fq.draw = c => {
    const H = F.H(p[0], p[1]);
    const q = a => qf(H, dv(a));
    const r = yRange([q], 0, 180, { incl: 0, pad: 0.2 });
    const w = new View(fq, [0, 180], r, { pad: { l: 44, t: 6, b: 18 } });
    axes(c, w, { xlab: 'угол d, °', ylab: 'dᵀ∇²f(x)d' });
    fillBetween(c, w, q, () => 0, al(T.red, 0.3), { when: a => q(a) < 0 });
    curve(c, w, q, { color: T.violet, width: 2.2 });
    const a = th % 180;
    dot(c, w.sx(a), w.sy(q(a)), 5.5, T.green, T.surface, 1.5);
  };
  function upd() {
    fm.render(); fl.render(); fq.render();
    const d = dv(th), H = F.H(p[0], p[1]), g = F.g(p[0], p[1]);
    const phi = t => F.f(p[0] + t * d[0], p[1] + t * d[1]);
    const d1 = g[0] * d[0] + g[1] * d[1], d2 = qf(H, d);
    const hh = 1e-3, num2 = (phi(hh) - 2 * phi(0) + phi(-hh)) / (hh * hh);
    const E = eig2(H[0][0], H[0][1], H[1][1]), cl = classify(E.l1, E.l2, 1e-9);
    const integ = simpson(t => (1 - t) * qf(F.H(p[0] + t * d[0], p[1] + t * d[1]), d), 0, 1, 200);
    let h = '<div class="row">x = ' + vec(p, 3) + ', d = ' + vec(d, 3) + '</div>';
    h += '<div class="row">шаг 4: φ′(0) = ∇f(x)ᵀd = ' + num(d1, 4) + ', &nbsp; φ″(0) = dᵀ∇²f(x)d = ' + num(d2, 4) + ' &nbsp; (разностью: ' + num(num2, 4) + ')</div>';
    h += '<div class="row">∇²f(x) = ' + mat(H, 3) + ', λ = ' + num(E.l1, 3) + ', ' + num(E.l2, 3) + ' ⇒ ' + pill(cl.k === 'pd' || cl.k === 'psd' || cl.k === 'zero' ? true : false, cl.t) + '</div>';
    h += '<div class="row">шаг 5 при y = x + d: f(y) = ' + num(phi(1), 5) + ' &nbsp; f(x) + ∇f(x)ᵀd + ∫₀¹(1 − t)φ″(t)dt = ' + num(phi(0), 4) + ' + ' + num(d1, 4) + ' + ' + num(integ, 4) + ' = ' + num(phi(0) + d1 + integ, 5) + '</div>';
    h += '<div class="row">' + (E.l1 < -1e-9 ? pill(false, 'есть d с φ″(0) &lt; 0') + ' ⇒ вдоль этой прямой f изогнута вниз ⇒ f невыпукла (шаг 4 в обратную сторону)' : F.cvx ? pill(true, 'в этой точке ∇²f ⪰ 0') + ' и так во всех точках ⇒ f выпукла' : pill(null, 'в этой точке ∇²f ⪰ 0') + ', но для выпуклости это нужно во всех точках; поищи точку с λ &lt; 0') + '</div>';
    ro.innerHTML = h;
  }
  drag(fm, {
    hit: (px, py, r) => { if (!v) return null; const d = dv(th); if (near(px, py, v.sx(p[0] + L * d[0]), v.sy(p[1] + L * d[1]), r)) return 'd'; if (near(px, py, v.sx(p[0]), v.sy(p[1]), r)) return 'p'; return null; },
    down: () => 'p',
    move: (id, px, py) => {
      const q = [v.wx(px), v.wy(py)];
      if (id === 'd') { th = ((Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI) + 360) % 360; sT.set(th); }
      else p = [clamp(q[0], -1.95, 1.95), clamp(q[1], -1.95, 1.95)];
      upd();
    }
  });
  upd();
};

/* ================= T3: second-order sufficient condition ================= */
WIDGETS.pf3 = (root, wid) => {
  const FN = {
    a: { name: 'x² + 2y² − x³ в (0, 0)', f: (x, y) => x * x + 2 * y * y - x * x * x, H: (x, y) => [[2 - 6 * x, 0], [0, 4]], xs: [0, 0] },
    b: { name: '½x² − y² + ¼y⁴ в (0, √2)', f: F2.saddle5.f, H: F2.saddle5.H, xs: [0, Math.SQRT2] },
    c: { name: 'y² + x³ в (0, 0): только ⪰ 0', f: (x, y) => y * y + x * x * x, H: (x, y) => [[6 * x, 0], [0, 2]], xs: [0, 0] }
  };
  let key = 'a', F = FN.a, th = 0, info = null;
  const c1 = row(root);
  selectBox(c1, wid, { name: 'fn', label: 'Функция и точка x⋆', value: key, options: Object.keys(FN).map(k => [k, FN[k].name]), on: k => { key = k; F = FN[k]; prep(); upd(); } });
  const sT = slider(c1, wid, { name: 'th', label: 'направление u', min: 0, max: 359, step: 1, value: th, fmt: z => Math.round(z) + '°', on: z => { th = z; upd(); } });
  const fr = figsRow(root);
  const fm = new Fig(fr, { aspect: 0.85, minH: 240, maxH: 380, label: 'Окрестность x⋆: шар радиуса r и область положительной определённости' });
  const fs = new Fig(fr, { aspect: 0.85, minH: 240, maxH: 380, scroll: true, label: 'Срез функции вдоль направления u и нижняя оценка' });
  const lg = document.createElement('div'); lg.className = 'legend-row';
  lg.innerHTML = '<span><i class="sw"></i>f(x⋆ + su) − f(x⋆)</span><span><i class="sw dash o"></i>½s²·uᵀ∇²f(x⋆)u (Тейлор в x⋆)</span><span><i class="sw dash g"></i>(m/4)s² — оценка шага 4</span><span><i class="sw band"></i>шар ‖h‖ &lt; r</span>';
  root.appendChild(lg);
  const ro = readout(root);
  let v = null;
  const fld = {}, cache = {};
  const lmin = (x, y) => { const H = F.H(x, y); return eig2(H[0][0], H[0][1], H[1][1]).l1; };
  const R = 1.6;
  function prep() {
    const H = F.H(F.xs[0], F.xs[1]);
    const m = eig2(H[0][0], H[0][1], H[1][1]).l1;
    let r = 0;
    if (m > 1e-9) {
      r = R;
      outer: for (let rho = 0.002; rho <= R; rho += 0.002) {
        for (let a = 0; a < 360; a += 2) {
          const ang = a * Math.PI / 180;
          if (lmin(F.xs[0] + rho * Math.cos(ang), F.xs[1] + rho * Math.sin(ang)) < m / 2) { r = rho - 0.002; break outer; }
        }
      }
    }
    const f0 = F.f(F.xs[0], F.xs[1]);
    let worst = Infinity;
    if (r > 0) for (let i = 1; i <= 60; i++) { const rho = r * i / 60; for (let a = 0; a < 360; a += 3) { const ang = a * Math.PI / 180; worst = Math.min(worst, F.f(F.xs[0] + rho * Math.cos(ang), F.xs[1] + rho * Math.sin(ang)) - f0 - m / 4 * rho * rho); } }
    info = { H, m, r, f0, worst };
  }
  fm.draw = c => {
    v = new View(fm, [F.xs[0] - R, F.xs[0] + R], [F.xs[1] - R, F.xs[1] + R], { equal: true, pad: { l: 30, b: 20 } });
    drawField(c, v, cachedField(fld, key, v, (x, y) => F.f(x, y) - info.f0, { diverging: key === 'c' }), { zeroBold: key === 'c' });
    axes(c, v, { noGrid: true });
    const kk = key + '|' + v.W + 'x' + v.H;
    if (cache.k !== kk) { cache.k = kk; cache.half = info.m > 1e-9 ? contourOf(v, lmin, info.m / 2) : []; cache.zero = contourOf(v, lmin, 0); }
    c.save(); drawSegs(c, cache.zero, al(T.ink, 0.75), 1.4, [4, 4]); drawSegs(c, cache.half, T.orange, 2); c.restore();
    if (info.r > 0) { c.save(); c.strokeStyle = T.accent; c.lineWidth = 2; c.fillStyle = al(T.accent, 0.1); c.beginPath(); c.arc(v.sx(F.xs[0]), v.sy(F.xs[1]), info.r * v.k, 0, 2 * Math.PI); c.fill(); c.stroke(); c.restore(); }
    const u = [Math.cos(th * Math.PI / 180), Math.sin(th * Math.PI / 180)];
    lineWorld(c, v, F.xs, u, al(T.green, 0.9), 1.6, [5, 4]);
    arrow(c, v.sx(F.xs[0]), v.sy(F.xs[1]), v.sx(F.xs[0] + 0.7 * u[0]), v.sy(F.xs[1] + 0.7 * u[1]), T.green, 2.4);
    star(c, v.sx(F.xs[0]), v.sy(F.xs[1]), 8, info.m > 1e-9 ? T.green : T.violet, T.surface);
    label(c, 'x⋆', v.sx(F.xs[0]) + 10, v.sy(F.xs[1]) + 12, { color: T.ink, font: '13px ' + MATHF, bg: T.surface });
  };
  fs.draw = c => {
    const u = [Math.cos(th * Math.PI / 180), Math.sin(th * Math.PI / 180)];
    const dlt = s => F.f(F.xs[0] + s * u[0], F.xs[1] + s * u[1]) - info.f0;
    const H0 = info.H, quad = 0.5 * (H0[0][0] * u[0] * u[0] + 2 * H0[0][1] * u[0] * u[1] + H0[1][1] * u[1] * u[1]);
    const lb = s => info.m / 4 * s * s;
    const r = yRange([dlt, s => quad * s * s], -R, R, { pad: 0.12, capHi: 4 });
    const w = new View(fs, [-R, R], r, { pad: { l: 42 } });
    axes(c, w, { xlab: 's', ylab: '' });
    if (info.r > 0) { clipV(c, w); c.fillStyle = al(T.accent, 0.1); c.fillRect(w.sx(-info.r), w.pad.t, w.sx(info.r) - w.sx(-info.r), w.H); c.restore(); }
    fillBetween(c, w, dlt, () => 0, al(T.red, 0.3), { when: s => dlt(s) < -1e-12 });
    curve(c, w, s => quad * s * s, { color: T.orange, width: 1.6, dash: [6, 4] });
    if (info.m > 1e-9) curve(c, w, lb, { color: T.green, width: 1.8, dash: [3, 3] });
    curve(c, w, dlt, { color: T.ink, width: 2.3 });

  };
  function upd() {
    fm.render(); fs.render();
    const u = [Math.cos(th * Math.PI / 180), Math.sin(th * Math.PI / 180)];
    const I = info;
    let h = '<div class="row">x⋆ = ' + vec(F.xs, 4) + ', ∇²f(x⋆) = ' + mat(I.H, 3) + '</div>';
    if (I.m > 1e-9) {
      h += '<div class="row">шаг 1: m = λmin(∇²f(x⋆)) = ' + num(I.m, 4) + ' &gt; 0 ⇒ теорема применима</div>';
      h += '<div class="row">шаг 2: λmin(∇²f(x)) ≥ m/2 = ' + num(I.m / 2, 3) + ' при ‖x − x⋆‖ &lt; r ≈ ' + num(I.r, 3) + (key === 'a' ? ' (точно r = 1/6)' : key === 'b' ? ' (точно √2 − √(5/6) ≈ 0.501)' : '') + '</div>';
      h += '<div class="row">шаг 4 по всему шару: min[f(x⋆ + h) − f(x⋆) − (m/4)‖h‖²] = ' + num(I.worst, 3) + ' ' + ok(I.worst >= -1e-9, '≥ 0 ✓', '&lt; 0 ✗') + '</div>';
      const out = [];
      for (let s = I.r; s <= R; s += 0.01) if (F.f(F.xs[0] + s * u[0], F.xs[1] + s * u[1]) < I.f0 - 1e-12) { out.push(s); break; }
      h += '<div class="row">вдоль u: ' + (out.length ? 'при s ≈ ' + num(out[0], 2) + ' значение уже ниже f(x⋆): минимум только локальный' : 'на отрезке |s| ≤ 1.6 значение не опускается ниже f(x⋆)') + '</div>';
    } else {
      h += '<div class="row">' + pill(false, 'm = λmin = 0') + ' ⇒ ∇²f(x⋆) только ⪰ 0, теорема неприменима</div>';
      h += '<div class="row">и действительно: f(−0.5, 0) = ' + num(F.f(-0.5, 0), 4) + ' &lt; f(x⋆) = 0 ⇒ x⋆ не минимум (вдоль оси x функция ведёт себя как x³)</div>';
    }
    h += '<div class="row k-mut">оранжевая линия: λmin(∇²f) = m/2; пунктир: λmin(∇²f) = 0 (граница области, где ∇²f ≻ 0)</div>';
    ro.innerHTML = h;
  }
  drag(fm, { down: () => 'u', move: (id, px, py) => { if (!v) return; th = ((Math.atan2(v.wy(py) - F.xs[1], v.wx(px) - F.xs[0]) * 180 / Math.PI) + 360) % 360; sT.set(th); upd(); } });
  prep();
  upd();
};

/* ================= T4: descent lemma ================= */
WIDGETS.pf4 = (root, wid) => {
  const FN = { lch: { F: F1.lch, L: 1 }, sin: { F: F1.sin, L: 1 }, sp: { F: F1.sp, L: 0.25 }, sq2: { F: F1.sq2, L: 4 } };
  let key = 'lch', P = FN.lch, x = 1, d = 1, lm = 1, a = 1;
  const c1 = row(root);
  selectBox(c1, wid, { name: 'fn', label: 'Функция', value: key, options: [['lch', 'ln cosh x (L = 1)'], ['sin', 'sin x (L = 1)'], ['sp', 'ln(1 + eˣ) (L = ¼)'], ['sq2', '2x² (L = 4)']], on: k => { key = k; P = FN[k]; upd(); } });
  slider(c1, wid, { name: 'x', label: 'x', min: -3, max: 3, step: 0.01, value: x, on: z => { x = z; upd(); } });
  slider(c1, wid, { name: 'd', label: 'd = y − x', min: -3, max: 3, step: 0.01, value: d, on: z => { d = z; upd(); } });
  const c2 = row(root);
  slider(c2, wid, { name: 'lm', label: 'L в оценке / настоящее L', min: 0.2, max: 2, step: 0.01, value: lm, on: z => { lm = z; upd(); } });
  slider(c2, wid, { name: 'a', label: 'α·L (шаг GD)', min: 0.02, max: 2.4, step: 0.01, value: a, on: z => { a = z; upd(); } });
  const fr = figsRow(root);
  const f1 = new Fig(fr, { aspect: 0.75, minH: 230, maxH: 340, label: 'Подынтегральное выражение леммы и его оценка' });
  const f2 = new Fig(fr, { aspect: 0.75, minH: 230, maxH: 340, scroll: true, label: 'Реальное убывание за шаг GD против гарантии' });
  const ro = readout(root);
  const Lv = () => P.L * lm;
  f1.draw = c => {
    const F = P.F, L = Lv();
    const g = t => (F.d1(x + t * d) - F.d1(x)) * d;
    const b = t => L * t * d * d;
    const r = yRange([g, b], 0, 1, { incl: 0, pad: 0.12 });
    const w = new View(f1, [0, 1], r, { pad: { l: 42 } });
    axes(c, w, { xlab: 't', ylab: 'подынтегральное' });
    fillBetween(c, w, g, () => 0, al(T.accent, 0.18));
    fillBetween(c, w, g, b, al(T.red, 0.35), { when: t => g(t) > b(t) + 1e-12 });
    curve(c, w, b, { color: T.orange, width: 2, dash: [6, 4] });
    curve(c, w, g, { color: T.accent, width: 2.3 });
    label(c, 'Lt‖d‖² (шаг 3)', w.pad.l + w.W - 6, w.sy(b(0.9)) - 12, { color: T.orange, font: '11px ' + BODY, align: 'right', bg: T.surface });
    label(c, '[f′(x + td) − f′(x)]·d', w.pad.l + 8, w.pad.t + 12, { color: T.accent, font: '11px ' + BODY, bg: T.surface });
  };
  f2.draw = c => {
    const F = P.F, L = Lv(), g0 = F.d1(x);
    const act = s => Math.abs(g0) > 1e-9 ? (F.f(x) - F.f(x - (s / L) * g0)) / (g0 * g0) : NaN;
    const gua = s => (s / L) * (1 - s / 2);
    const r = yRange([act, gua], 0, 2.4, { incl: 0, pad: 0.12 });
    const w = new View(f2, [0, 2.4], r, { pad: { l: 46 } });
    axes(c, w, { xlab: 'α·L', ylab: 'убывание / f′(x)²' });
    fillBetween(c, w, act, gua, al(T.red, 0.35), { when: s => act(s) < gua(s) - 1e-12 });
    vline(c, w, 1, al(T.green, 0.8), [3, 3]); vline(c, w, 2, al(T.red, 0.7), [3, 3]);
    curve(c, w, gua, { color: T.orange, width: 2, dash: [6, 4] });
    curve(c, w, act, { color: T.ink, width: 2.3 });
    dot(c, w.sx(a), w.sy(act(a)), 5.5, T.accent, T.surface, 1.5);
    dot(c, w.sx(1), w.sy(gua(1)), 4, T.orange);
    label(c, 'α = 1/L', w.sx(1) + 4, w.pad.t + 12, { color: T.green, font: '11px ' + MATHF, bg: T.surface });
    label(c, 'α = 2/L', w.sx(2) + 4, w.pad.t + 12, { color: T.red, font: '11px ' + MATHF, bg: T.surface });
    label(c, 'гарантия α(1 − Lα/2)', w.pad.l + 8, w.pad.t + w.H - 14, { color: T.orange, font: '11px ' + BODY, bg: T.surface });
  };
  function upd() {
    f1.render(); f2.render();
    const F = P.F, L = Lv(), y = x + d;
    const rem = F.f(y) - F.f(x) - F.d1(x) * d;
    const integ = simpson(t => (F.d1(x + t * d) - F.d1(x)) * d, 0, 1, 200);
    const bound = L / 2 * d * d;
    const g0 = F.d1(x), al1 = a / L, xp = x - al1 * g0;
    const gua = F.f(x) - al1 * (1 - L * al1 / 2) * g0 * g0;
    let h = '<div class="row">L = ' + num(L, 3) + (Math.abs(lm - 1) > 1e-9 ? (lm < 1 ? ' <span class="k-bad">(меньше настоящего ' + num(P.L, 3) + ')</span>' : ' (больше настоящего, оценка грубее)') : ' (настоящее)') + '; x = ' + num(x, 3) + ', y = ' + num(y, 3) + '</div>';
    h += '<div class="row">шаги 1–2: f(y) − f(x) − f′(x)d = ' + num(rem, 5) + ' = ∫₀¹[f′(x + td) − f′(x)]d dt = ' + num(integ, 5) + '</div>';
    h += '<div class="row">шаги 3–4: остаток ' + num(rem, 5) + ' ≤ (L/2)d² = ' + num(bound, 5) + ' ' + ok(rem <= bound + 1e-10) + ' &nbsp; ⇔ f(y) = ' + num(F.f(y), 4) + ' ≤ ' + num(F.f(x) + g0 * d + bound, 4) + '</div>';
    h += '<div class="row">шаг 5: α = ' + num(al1, 4) + ', x⁺ = x − αf′(x) = ' + num(xp, 4) + ', f(x⁺) = ' + num(F.f(xp), 5) + ' ≤ f(x) − α(1 − Lα/2)f′(x)² = ' + num(gua, 5) + ' ' + ok(F.f(xp) <= gua + 1e-10) + '</div>';
    h += '<div class="row k-mut">гарантия максимальна при α = 1/L: убывание не меньше f′(x)²/(2L) = ' + num(g0 * g0 / (2 * L), 4) + '; при α ≥ 2/L гарантии нет</div>';
    ro.innerHTML = h;
  }
  upd();
};

/* ================= T5: linear convergence of GD ================= */
WIDGETS.pf5 = (root, wid) => {
  let prob = 'quad', mu = 1, Lq = 6, start = [-1.8, 1.2], path = [];
  const NQ = { mu: 1, L: 3.5 + Math.sqrt(3.25) };
  const c1 = row(root);
  selectBox(c1, wid, { name: 'prob', label: 'Функция', value: prob, options: [['quad', 'квадратичная ½(µu² + Lv²), повёрнута'], ['nq', '½x² + 2y² + ln cosh(x + y)']], on: s => { prob = s; c2.hidden = s !== 'quad'; reset(); } });
  const c2 = row(root);
  slider(c2, wid, { name: 'mu', label: 'µ', min: 0.2, max: 4, step: 0.05, value: mu, on: z => { mu = Math.min(z, Lq); reset(); } });
  slider(c2, wid, { name: 'L', label: 'L', min: 0.5, max: 12, step: 0.1, value: Lq, on: z => { Lq = Math.max(z, mu); reset(); } });
  const c3 = row(root);
  button(c3, 'Шаг', () => { an.stop(); stepN(1); render(); });
  const bRun = button(c3, '▶ Пуск', () => { if (an.running()) an.stop(); else { bRun.textContent = '❚❚ Пауза'; an.start(); } }, 'primary');
  button(c3, 'Сброс', () => reset());
  const fr = figsRow(root);
  const fm = new Fig(fr, { aspect: 0.8, minH: 240, maxH: 380, label: 'Траектория GD с шагом 1/L' });
  const fl = new Fig(fr, { aspect: 0.8, minH: 240, maxH: 380, scroll: true, label: 'Ошибка по значению функции и гарантия теоремы' });
  const ro = readout(root);
  let v = null;
  const fld = {};
  const rot = 25 * Math.PI / 180, cr = Math.cos(rot), sr = Math.sin(rot);
  function fun() {
    if (prob === 'quad') {
      const a = mu * cr * cr + Lq * sr * sr, b = (Lq - mu) * cr * sr, c = mu * sr * sr + Lq * cr * cr;
      return { f: (x, y) => 0.5 * (a * x * x + 2 * b * x * y + c * y * y), g: (x, y) => [a * x + b * y, b * x + c * y], mu, L: Lq };
    }
    return { f: (x, y) => 0.5 * x * x + 2 * y * y + F1.lch.f(x + y), g: (x, y) => { const t = Math.tanh(x + y); return [x + t, 4 * y + t]; }, mu: NQ.mu, L: NQ.L };
  }
  function stepN(n) { const F = fun(); for (let i = 0; i < n; i++) { const p = path[path.length - 1], g = F.g(p[0], p[1]); path.push([p[0] - g[0] / F.L, p[1] - g[1] / F.L]); } }
  const an = animator(() => { stepN(1); render(); }, () => { const F = fun(), p = path[path.length - 1]; return path.length > 60 || F.f(p[0], p[1]) < 1e-14; }, () => { bRun.textContent = '▶ Пуск'; }, 260);
  function reset() { an.stop(); path = [start.slice()]; render(); }
  fm.draw = c => {
    const F = fun();
    v = new View(fm, [-2.5, 2.5], [-2, 2], { equal: true, pad: { l: 30, b: 20 } });
    drawField(c, v, cachedField(fld, prob + mu + ',' + Lq, v, F.f, { nLev: 13 }));
    axes(c, v, { noGrid: true });
    clipV(c, v);
    c.strokeStyle = T.orange; c.lineWidth = 1.6; c.beginPath();
    path.forEach((p, i) => { if (i) c.lineTo(v.sx(p[0]), v.sy(p[1])); else c.moveTo(v.sx(p[0]), v.sy(p[1])); }); c.stroke();
    path.forEach((p, i) => dot(c, v.sx(p[0]), v.sy(p[1]), i === path.length - 1 ? 5.5 : 2.6, T.orange, i === path.length - 1 ? T.surface : null, 1.5));
    c.restore();
    star(c, v.sx(0), v.sy(0), 8, T.green, T.surface);
    dot(c, v.sx(start[0]), v.sy(start[1]), 6.5, T.accent, T.surface, 2);
  };
  fl.draw = c => {
    const F = fun(), q = 1 - F.mu / F.L;
    const g0 = F.f(start[0], start[1]);
    const vals = path.map(p => Math.log10(Math.max(1e-16, F.f(p[0], p[1]))));
    const kmax = Math.max(12, path.length - 1);
    const lo = Math.min(Math.min.apply(null, vals), Math.log10(g0) + kmax * Math.log10(Math.max(q, 1e-16)));
    const w = new View(fl, [0, kmax], [Math.max(-16, Math.floor(lo)), Math.ceil(Math.log10(g0) + 0.3)], { pad: { l: 40 } });
    axes(c, w, { ylog: true, xlab: 'k', ylab: 'f(xₖ) − f⋆' });
    curve(c, w, k => Math.log10(g0) + k * Math.log10(Math.max(q, 1e-300)), { color: T.green, width: 1.8, dash: [6, 4] });
    clipV(c, w); c.strokeStyle = T.orange; c.lineWidth = 2; c.beginPath();
    vals.forEach((y, k) => { if (k) c.lineTo(w.sx(k), w.sy(y)); else c.moveTo(w.sx(k), w.sy(y)); }); c.stroke(); c.restore();
    vals.forEach((y, k) => dot(c, w.sx(k), w.sy(y), 2.8, T.orange));
    label(c, '(1 − µ/L)ᵏ(f₀ − f⋆) — гарантия', w.pad.l + 8, w.pad.t + 12, { color: T.green, font: '11px ' + BODY, bg: T.surface });
  };
  function render() {
    fm.render(); fl.render();
    const F = fun(), q = 1 - F.mu / F.L;
    let h = '<div class="row">µ = ' + num(F.mu, 3) + ', L = ' + num(F.L, 4) + ', α = 1/L = ' + num(1 / F.L, 4) + ', множитель 1 − µ/L = ' + num(q, 4) + ' &nbsp; f⋆ = 0 в (0, 0)</div>';
    h += '<table><tr><th>k</th><th>f(xₖ) − f⋆</th><th>‖∇f(xₖ)‖²</th><th>PL: ‖∇f‖² ≥ 2µ(f − f⋆)</th><th>шаг 4: fₖ₊₁ ≤ fₖ − ‖∇f‖²/2L</th><th>fₖ₊₁/fₖ ≤ 1 − µ/L</th></tr>';
    const start0 = Math.max(0, path.length - 7);
    for (let k = start0; k < path.length; k++) {
      const p = path[k], fk = F.f(p[0], p[1]), g = F.g(p[0], p[1]), gg = g[0] * g[0] + g[1] * g[1];
      let s4 = '—', s6 = '—';
      if (k + 1 < path.length) {
        const pn = path[k + 1], fn = F.f(pn[0], pn[1]);
        s4 = num(fn, 4) + ' ≤ ' + num(fk - gg / (2 * F.L), 4) + ' ' + ok(fn <= fk - gg / (2 * F.L) + 1e-12);
        s6 = (fk > 1e-15 ? num(fn / fk, 4) : '—') + ' ' + ok(fk <= 1e-15 || fn / fk <= q + 1e-9);
      }
      h += '<tr><td>' + k + '</td><td>' + num(fk, 4) + '</td><td>' + num(gg, 4) + '</td><td>' + num(gg, 3) + ' ≥ ' + num(2 * F.mu * fk, 3) + ' ' + ok(gg >= 2 * F.mu * fk - 1e-12) + '</td><td>' + s4 + '</td><td>' + s6 + '</td></tr>';
    }
    h += '</table>';
    if (path.length < 2) h += '<div class="row k-mut">нажми «Шаг» или «Пуск»: таблица проверит каждое звено доказательства на каждой итерации</div>';
    ro.innerHTML = h;
  }
  drag(fm, { hit: (px, py, r) => (v && near(px, py, v.sx(start[0]), v.sy(start[1]), r)) ? 's' : null, down: () => 's', move: (id, px, py) => { start = [clamp(v.wx(px), -2.4, 2.4), clamp(v.wy(py), -1.9, 1.9)]; reset(); } });
  reset();
};

/* ================= T6: Newton's quadratic convergence ================= */
WIDGETS.pf6 = (root, wid) => {
  const FN = {
    expm: { name: 'eˣ − 2x', d1: x => Math.exp(x) - 2, d2: Math.exp, d3: Math.exp, xs: Math.log(2), win: [-1.5, 2.5], x0: 0 },
    q4: { name: 'x⁴/4 + x²/2', d1: x => x * x * x + x, d2: x => 3 * x * x + 1, d3: x => 6 * x, xs: 0, win: [-2, 2], x0: 1.5 },
    spl: { name: 'ln(1 + eˣ) − 0.3x', d1: x => sigm(x) - 0.3, d2: x => { const s = sigm(x); return s * (1 - s); }, d3: x => { const s = sigm(x); return s * (1 - s) * (1 - 2 * s); }, xs: Math.log(3 / 7), win: [-4, 3], x0: 1.2 }
  };
  let key = 'expm', F = FN.expm, x0 = F.x0, xs = [];
  const c1 = row(root);
  selectBox(c1, wid, { name: 'fn', label: 'Функция', value: key, options: Object.keys(FN).map(k => [k, FN[k].name]), on: k => { key = k; F = FN[k]; x0 = F.x0; sx.range(F.win[0], F.win[1]); sx.set(x0); reset(); } });
  const sx = slider(c1, wid, { name: 'x0', label: 'x₀', min: F.win[0], max: F.win[1], step: 0.01, value: x0, on: z => { x0 = z; reset(); } });
  const c2 = row(root);
  button(c2, 'Шаг', () => { an.stop(); step(); render(); });
  const bRun = button(c2, '▶ Пуск', () => { if (an.running()) an.stop(); else { bRun.textContent = '❚❚ Пауза'; an.start(); } }, 'primary');
  button(c2, 'Сброс', () => reset());
  const fr = figsRow(root);
  const f1 = new Fig(fr, { aspect: 0.8, minH: 240, maxH: 360, label: 'Вторая производная на отрезке от x⋆ до текущей точки' });
  const f2 = new Fig(fr, { aspect: 0.8, minH: 240, maxH: 360, scroll: true, label: 'Логарифм ошибки и оценка теоремы' });
  const ro = readout(root);
  const an = animator(() => { step(); render(); }, () => done(), () => { bRun.textContent = '▶ Пуск'; }, () => RM ? 80 : 800);
  function done() { const x = xs[xs.length - 1]; return xs.length > 8 || !isFinite(x) || Math.abs(x - F.xs) < 1e-14 || Math.abs(x) > 1e4; }
  function step() { if (done()) return; const x = xs[xs.length - 1]; xs.push(x - F.d1(x) / F.d2(x)); }
  function reset() { an.stop(); xs = [x0]; render(); }
  function seg2(x) { const a = Math.min(x, F.xs), b = Math.max(x, F.xs); return { m: infOn(F.d2, a, b, 400)[0], M: supOn(z => Math.abs(F.d3(z)), a, b, 400)[0] }; }
  f1.draw = c => {
    const x = xs[xs.length - 1];
    const span = Math.max(0.6, 1.35 * Math.abs(x - F.xs));
    const w0 = [F.xs - span, F.xs + span];
    const r = yRange([F.d2], w0[0], w0[1], { incl: 0, pad: 0.15 });
    const w = new View(f1, w0, r, { pad: { l: 42 } });
    axes(c, w, { xlab: 's', ylab: 'f″(s)' });
    if (isFinite(x)) {
      const h0 = F.d2(x), a = Math.min(x, F.xs), b = Math.max(x, F.xs);
      fillBetween(c, w, F.d2, () => h0, al(T.accent, 0.3), { x0: a, x1: b });
      hline(c, w, h0, T.orange, [6, 4], 1.6);
      label(c, 'f″(x)', w.pad.l + w.W - 6, w.sy(h0) - 11, { color: T.orange, font: '11px ' + MATHF, align: 'right', bg: T.surface });
    }
    curve(c, w, F.d2, { color: T.violet, width: 2.2 });
    star(c, w.sx(F.xs), w.sy(F.d2(F.xs)), 7, T.green, T.surface);
    if (isFinite(x) && x > w.x0 && x < w.x1) dot(c, w.sx(x), w.sy(F.d2(x)), 6, T.accent, T.surface, 2);
    label(c, 'площадь / f″(x) = e⁺', w.pad.l + 8, w.pad.t + 12, { color: T.accent, font: '11px ' + BODY, bg: T.surface });
  };
  f2.draw = c => {
    const es = xs.map(x => Math.abs(x - F.xs));
    const ys = es.map(e => Math.log10(Math.max(e, 1e-16)));
    const bs = [];
    for (let k = 1; k < xs.length; k++) { const S = seg2(xs[k - 1]); bs.push(S.m > 0 ? Math.log10(Math.max(S.M / (2 * S.m) * es[k - 1] * es[k - 1], 1e-17)) : NaN); }
    const w = new View(f2, [0, Math.max(6, xs.length)], [-16, Math.max(1, Math.ceil(Math.max.apply(null, ys.concat([0])) + 0.5))], { pad: { l: 40 } });
    axes(c, w, { ylog: true, xlab: 'k', ylab: '|eₖ|' });
    clipV(c, w); c.strokeStyle = T.orange; c.lineWidth = 2; c.beginPath();
    ys.forEach((y, k) => { if (k) c.lineTo(w.sx(k), w.sy(y)); else c.moveTo(w.sx(k), w.sy(y)); }); c.stroke(); c.restore();
    ys.forEach((y, k) => dot(c, w.sx(k), w.sy(y), 3.5, T.orange));
    bs.forEach((y, i) => { if (isFinite(y)) dot(c, w.sx(i + 1), w.sy(Math.max(y, -16)), 5, null, T.green, 1.8); });
    label(c, '○ (M/2m)·e²ₖ₋₁ — оценка', w.pad.l + 8, w.pad.t + 12, { color: T.green, font: '11px ' + BODY, bg: T.surface });
  };
  function render() {
    f1.render(); f2.render();
    let h = '<div class="row">x⋆ = ' + num(F.xs, 6) + (key === 'q4' ? ' &nbsp; <span class="k-mut">здесь f‴(x⋆) = 0, поэтому сходимость даже быстрее квадратичной</span>' : '') + '</div>';
    h += '<table><tr><th>k</th><th>xₖ</th><th>eₖ</th><th>m, M на [x⋆, xₖ]</th><th>(M/2m)eₖ²</th><th>eₖ₊₁</th><th>площадь/f″(xₖ)</th></tr>';
    for (let k = 0; k < xs.length; k++) {
      const x = xs[k], e = x - F.xs;
      if (!isFinite(x)) break;
      const S = seg2(x);
      const bound = S.m > 0 ? S.M / (2 * S.m) * e * e : Infinity;
      let en = '—', ar = '—';
      if (k + 1 < xs.length) {
        const e1 = xs[k + 1] - F.xs;
        const area = simpson(s => F.d2(x) - F.d2(s), F.xs, x, 400);
        en = num(e1, 4) + ' ' + ok(Math.abs(e1) <= bound * (1 + 1e-6) + 1e-15);
        ar = num(area / F.d2(x), 4);
      }
      h += '<tr><td>' + k + '</td><td>' + num(x, 10) + '</td><td>' + num(e, 4) + '</td><td>' + num(S.m, 3) + ', ' + num(S.M, 3) + '</td><td>' + num(bound, 4) + '</td><td>' + en + '</td><td>' + ar + '</td></tr>';
    }
    h += '</table>';
    const x = xs[xs.length - 1];
    if (Math.abs(x - F.xs) > 5) h += '<div class="row">' + pill(false, 'шаг ушёл далеко') + ' старт вне области, где работает теорема</div>';
    ro.innerHTML = h;
  }
  reset();
};

/* ================= T7: KKT sufficiency ================= */
WIDGETS.pf7 = (root, wid) => {
  const PR = {
    conv: { name: 'выпуклая: min (x − 2)² при x − 1 ≤ 0', f: x => (x - 2) * (x - 2), d1: x => 2 * (x - 2), gs: [x => x - 1], gd: [() => 1], dom: [-1.5, 1], win: [-1.6, 3.2], cvx: true },
    nonc: { name: 'невыпуклая: min x³ − 3x при −2.2 ≤ x ≤ 2', f: x => x * x * x - 3 * x, d1: x => 3 * x * x - 3, gs: [x => -x - 2.2, x => x - 2], gd: [() => -1, () => 1], dom: [-2.2, 2], win: [-2.6, 2.4], cvx: false,
      cands: { m22: { x: -2.2, lam: [11.52, 0], name: 'x = −2.2 (граница)' }, m1: { x: -1, lam: [0, 0], name: 'x = −1 (внутри)' }, p1: { x: 1, lam: [0, 0], name: 'x = 1 (внутри)' } } }
  };
  let key = 'conv', P = PR.conv, lam = 2, cand = 'p1', xt = -0.4;
  const c1 = row(root);
  selectBox(c1, wid, { name: 'prob', label: 'Задача', value: key, options: Object.keys(PR).map(k => [k, PR[k].name]), on: k => { key = k; P = PR[k]; cLam.hidden = k !== 'conv'; cCand.hidden = k === 'conv'; sx.range(P.dom[0], P.dom[1]); xt = clamp(xt, P.dom[0], P.dom[1]); sx.set(xt); upd(); } });
  const cLam = row(root), cCand = row(root);
  const sL = slider(cLam, wid, { name: 'lam', label: 'λ', min: -2, max: 5, step: 0.05, value: lam, on: z => { lam = z; upd(); } });
  button(cLam, 'λ = λ⋆ = 2', () => { lam = 2; sL.set(lam); upd(); });
  selectBox(cCand, wid, { name: 'cand', label: 'Кандидат (точка ККТ)', value: cand, options: Object.keys(PR.nonc.cands).map(k => [k, PR.nonc.cands[k].name]), on: k => { cand = k; upd(); } });
  cCand.hidden = true;
  const sx = slider(c1, wid, { name: 'xt', label: 'пробная точка x', min: P.dom[0], max: P.dom[1], step: 0.01, value: xt, on: z => { xt = z; upd(); } });
  const fig = new Fig(root, { aspect: 0.46, minH: 250, maxH: 370, label: 'Целевая функция, лагранжиан и допустимое множество' });
  const lg7 = document.createElement('div'); lg7.className = 'legend-row';
  lg7.innerHTML = '<span><i class="sw m"></i>f</span><span><i class="sw a"></i>ℒ(·, λ)</span><span><i class="sw dash a"></i>уровень ℒ(x⋆)</span><span><i class="sw band g"></i>допустимое множество</span><span>★ кандидат x⋆</span>';
  root.appendChild(lg7);
  const ro = readout(root);
  let v = null;
  function cur() {
    if (key === 'conv') return { x: 1, lam: [lam] };
    return PR.nonc.cands[cand];
  }
  const Lf = (x, C) => { let s = P.f(x); P.gs.forEach((g, i) => { s += C.lam[i] * g(x); }); return s; };
  fig.draw = c => {
    const C = cur();
    const r = yRange([P.f, x => Lf(x, C)], P.win[0], P.win[1], { pad: 0.1, capHi: key === 'conv' ? 14 : 14, capLo: -50 });
    v = new View(fig, P.win, r);
    axes(c, v, { xlab: 'x' });
    const lo0 = key === 'nonc' ? P.dom[0] : v.x0;
    clipV(c, v); c.fillStyle = al(T.green, 0.12); c.fillRect(v.sx(lo0), v.pad.t, v.sx(P.dom[1]) - v.sx(lo0), v.H); c.restore();
    vline(c, v, P.dom[1], T.green, null, 1.6);
    if (key === 'nonc') vline(c, v, P.dom[0], T.green, null, 1.6);
    curve(c, v, P.f, { color: al(T.muted, 0.95), width: 2.2 });
    curve(c, v, x => Lf(x, C), { color: T.accent, width: 2.2 });
    const Ls = Lf(C.x, C);
    hline(c, v, Ls, al(T.accent, 0.6), [4, 4], 1.2);
    const fx = P.f(xt), lx = Lf(xt, C);
    seg(c, v, xt, lx, xt, fx, fx >= lx - 1e-9 ? T.green : T.red, 3);
    seg(c, v, xt, Math.min(lx, Ls), xt, Math.max(lx, Ls), lx >= Ls - 1e-9 ? al(T.green, 0.6) : T.red, 3, [2, 3]);
    dot(c, v.sx(xt), v.sy(fx), 5.5, T.muted, T.surface, 1.5);
    dot(c, v.sx(xt), v.sy(lx), 5.5, T.accent, T.surface, 1.5);
    star(c, v.sx(C.x), v.sy(P.f(C.x)), 8, T.orange, T.surface);

    label(c, 'x⋆', v.sx(C.x) + 9, v.sy(P.f(C.x)) - 12, { color: T.orange, font: '13px ' + MATHF, bg: T.surface });
  };
  function upd() {
    fig.render();
    const C = cur(), xs0 = C.x;
    let st = P.d1(xs0); P.gd.forEach((g, i) => { st += C.lam[i] * g(xs0); });
    const gv = P.gs.map(g => g(xs0));
    const feas = gv.every(z => z <= 1e-9), dual = C.lam.every(l => l >= -1e-12), cs = C.lam.every((l, i) => Math.abs(l * gv[i]) < 1e-9), stat = Math.abs(st) < 1e-6;
    const fx = P.f(xt), lx = Lf(xt, C), Ls = Lf(xs0, C), fs = P.f(xs0);
    let gmin = Infinity, gat = 0;
    for (let i = 0; i <= 2000; i++) { const z = P.dom[0] + (P.dom[1] - P.dom[0]) * i / 2000; if (P.f(z) < gmin) { gmin = P.f(z); gat = z; } }
    let h = '<div class="row">кандидат x⋆ = ' + num(xs0, 3) + ', λ = (' + C.lam.map(l => num(l, 3)).join(', ') + ')</div>';
    h += '<div class="row">ККТ: стационарность f′ + Σλᵢgᵢ′ = ' + num(st, 4) + ' ' + ok(stat) + ' · допустимость ' + ok(feas) + ' · λ ≥ 0 ' + ok(dual) + ' · λᵢgᵢ(x⋆) = 0 ' + ok(cs) + ' · выпуклость f ' + ok(P.cvx, '✓', '✗ (f невыпукла)') + '</div>';
    h += '<div class="row">цепочка в x = ' + num(xt, 3) + ': f(x) = ' + num(fx, 4) + ' ≥<sub>ш.3</sub> ℒ(x) = ' + num(lx, 4) + ' ' + ok(fx >= lx - 1e-9) + ' ≥<sub>ш.2</sub> ℒ(x⋆) = ' + num(Ls, 4) + ' ' + ok(lx >= Ls - 1e-9) + ' =<sub>ш.4</sub> f(x⋆) = ' + num(fs, 4) + ' ' + ok(Math.abs(Ls - fs) < 1e-9) + '</div>';
    let why = '';
    if (!dual) why = 'λ &lt; 0: на допустимом множестве λg(x) ≥ 0, и ℒ оказывается выше f — ломается шаг 3 (и шаг 1: −g вогнута).';
    else if (!stat) why = 'нет стационарности: ℒ не минимален в x⋆, поэтому шаг 2 может ломаться.';
    else if (!P.cvx) why = 'ККТ выполнены, но f невыпукла ⇒ ℒ невыпуклый, шаг 2 не гарантирован. Если звено сломалось, это ещё не значит, что x⋆ не минимум: теорема просто неприменима.';
    else why = 'все условия теоремы выполнены: цепочка верна для любой допустимой x.';
    h += '<div class="row">' + why + '</div>';
    h += '<div class="row">глобальный минимум на допустимом множестве: x ≈ ' + num(gat, 3) + ', f = ' + num(gmin, 4) + ' ⇒ кандидат ' + (fs <= gmin + 1e-6 ? pill(true, 'глобальный минимум') : pill(false, 'не глобальный минимум')) + '</div>';
    ro.innerHTML = h;
  }
  drag(fig, { down: px => (v && px >= v.pad.l) ? 'x' : null, move: (id, px) => { xt = clamp(v.wx(px), P.dom[0], P.dom[1]); sx.set(xt); upd(); } });
  upd();
};

/* ================= practice: quadratic form calculator (3.1) ================= */
const QPRE = { A1: [2, 2, 3, -8, -2], A2: [4, -2, 1, -6, 4], A3: [1, -4, 1, -6, 6], A4: [1, 0, 10, -2, -20], live: [3, 1, 2, -4, 1], P1: [2, 2, 2, -6, 0], TA1: [3, 2, 3, -8, -8], TB1: [2, -2, 2, -6, 6] };
const QLBL = { A1: 'задача A1', A2: 'задача A2', A3: 'задача A3', A4: 'задача A4', live: 'пример семинара', P1: 'П1', TA1: 'пробный билет А, задача 1', TB1: 'пробный билет Б, задача 1' };
const QSETS = { def: [['A1', 'A1'], ['A3', 'A3'], ['A2', 'A2'], ['A4', 'A4'], ['live', 'пример семинара (3, 1, 2, −4, 1)']], wb: [['P1', 'П1'], ['TA1', 'билет А · задача 1'], ['TB1', 'билет Б · задача 1']] };
WIDGETS.qform = (root, wid, ds) => {
  const set = QSETS[(ds && ds.set) || 'def'] || QSETS.def;
  let cf = QPRE[set[0][0]].slice(), probe = null, tag = set[0][0];
  const c1 = row(root);
  const names = ['a', 'b', 'c', 'd', 'e'];
  const boxes = names.map((nm, i) => numBox(c1, wid, { name: nm, label: nm, value: cf[i], step: 0.5, on: z => { cf[i] = z; tag = ''; probe = null; upd(); } }));
  const c2 = row(root);
  const load = k => { cf = QPRE[k].slice(); tag = k; boxes.forEach((b, i) => b.set(cf[i])); probe = null; upd(); };
  set.forEach(p => button(c2, p[1], () => load(p[0])));
  const fig = new Fig(root, { aspect: 0.62, minH: 260, maxH: 420, label: 'Линии уровня квадратичной функции, стационарная точка и собственные направления' });
  const ro = readout(root);
  let v = null;
  const fld = {};
  function S() {
    const a = cf[0], b = cf[1], c = cf[2], d = cf[3], e = cf[4];
    const H = [[2 * a, b], [b, 2 * c]], det = 4 * a * c - b * b, tr = 2 * a + 2 * c;
    const f = (x, y) => a * x * x + b * x * y + c * y * y + d * x + e * y;
    const g = (x, y) => [2 * a * x + b * y + d, b * x + 2 * c * y + e];
    let xs = null;
    if (Math.abs(det) > 1e-12) xs = [(-2 * c * d + b * e) / det, (-2 * a * e + b * d) / det];
    const E = eig2(H[0][0], H[0][1], H[1][1]);
    return { a, b, c, d, e, H, det, tr, f, g, xs, E };
  }
  fig.draw = ctx => {
    const s = S();
    const cen = s.xs || [0, 0];
    v = new View(fig, [cen[0] - 3.2, cen[0] + 3.2], [cen[1] - 2.2, cen[1] + 2.2], { equal: true, pad: { l: 30, b: 20 } });
    const fs = s.xs ? s.f(s.xs[0], s.xs[1]) : 0;
    const pd = s.E.l1 > 1e-12;
    drawField(ctx, v, cachedField(fld, cf.join(','), v, (x, y) => s.f(x, y) - fs, { diverging: !pd }), { zeroBold: !pd });
    axes(ctx, v, { noGrid: true });
    const n1 = [s.H[0][0], s.H[0][1]], n2 = [s.H[1][0], s.H[1][1]];
    const drawEq = (n, k, lab) => {
      const nn = n[0] * n[0] + n[1] * n[1]; if (nn < 1e-12) return;
      const p0 = [-k * n[0] / nn, -k * n[1] / nn], dir = [-n[1] / Math.sqrt(nn), n[0] / Math.sqrt(nn)];
      lineWorld(ctx, v, p0, dir, al(T.violet, 0.85), 1.4, [6, 4]);
      const t = 1.6, q = [cen[0] + 0, cen[1]];
      const pr = (q[0] - p0[0]) * dir[0] + (q[1] - p0[1]) * dir[1];
      const lp = [p0[0] + (pr + t) * dir[0], p0[1] + (pr + t) * dir[1]];
      label(ctx, lab, v.sx(lp[0]), v.sy(lp[1]), { color: T.violet, font: '11px ' + MATHF, bg: T.surface, align: 'center' });
    };
    drawEq(n1, s.d, '∂f/∂x = 0');
    drawEq(n2, s.e, '∂f/∂y = 0');
    if (s.xs) {
      for (const pair of [[s.E.l1, s.E.v1], [s.E.l2, s.E.v2]]) {
        const l = pair[0], ev = pair[1], len = 0.9;
        const col = l > 1e-9 ? T.accent : l < -1e-9 ? T.orange : T.muted;
        arrow(ctx, v.sx(s.xs[0]), v.sy(s.xs[1]), v.sx(s.xs[0] + len * ev[0]), v.sy(s.xs[1] + len * ev[1]), col, 2.4);
        label(ctx, 'λ = ' + num(l, 3), v.sx(s.xs[0] + (len + 0.2) * ev[0]), v.sy(s.xs[1] + (len + 0.2) * ev[1]), { color: col, font: '11px ' + MONO, bg: T.surface, align: 'center' });
      }
      const k = classify(s.E.l1, s.E.l2).k;
      if (k === 'pd') star(ctx, v.sx(s.xs[0]), v.sy(s.xs[1]), 9, T.green, T.surface);
      else if (k === 'ind') diamond(ctx, v.sx(s.xs[0]), v.sy(s.xs[1]), 8, T.orange, T.surface);
      else dot(ctx, v.sx(s.xs[0]), v.sy(s.xs[1]), 7, T.red, T.surface, 2);
    }
    const p = probe || [cen[0] + 1.6, cen[1] + 1.1];
    const g = s.g(p[0], p[1]), gn = Math.hypot(g[0], g[1]);
    if (gn > 1e-9) arrow(ctx, v.sx(p[0]), v.sy(p[1]), v.sx(p[0] + 0.8 * g[0] / gn), v.sy(p[1] + 0.8 * g[1] / gn), T.ink, 2);
    dot(ctx, v.sx(p[0]), v.sy(p[1]), 6.5, T.accent, T.surface, 2);
    label(ctx, '∇f = ' + vec(g, 2), v.sx(p[0]) + 10, v.sy(p[1]) + 16, { color: T.ink, font: '11px ' + MONO, bg: T.surface });
  };
  function upd() {
    fig.render();
    const s = S();
    const ln = (k, v) => [k, v];
    let h = '<div class="row"><b>' + (tag ? QLBL[tag] + ': ' : '') + 'f = ' + linFmt([ln(s.a, 'x²'), ln(s.b, 'xy'), ln(s.c, 'y²'), ln(s.d, 'x'), ln(s.e, 'y')]) + '</b></div>';
    h += '<div class="row">1) ∇f = (' + linFmt([ln(2 * s.a, 'x'), ln(s.b, 'y'), ln(s.d, '')]) + ', &nbsp;' + linFmt([ln(s.b, 'x'), ln(2 * s.c, 'y'), ln(s.e, '')]) + '), &nbsp; H = ' + mat(s.H, 4) + '</div>';
    h += '<div class="row">2) det H = (' + num(2 * s.a, 4) + ')(' + num(2 * s.c, 4) + ') − (' + num(s.b, 4) + ')² = ' + num(s.det, 4) + ', &nbsp; tr H = ' + num(s.tr, 4) + '</div>';
    if (s.xs) {
      const fs = s.f(s.xs[0], s.xs[1]);
      h += '<div class="row">3) система: ' + linFmt([ln(2 * s.a, 'x'), ln(s.b, 'y')]) + ' = ' + num(-s.d, 4) + ', &nbsp;' + linFmt([ln(s.b, 'x'), ln(2 * s.c, 'y')]) + ' = ' + num(-s.e, 4) + ' ⇒ x⋆ = ' + vec(s.xs, 4) + ', &nbsp; f(x⋆) = ' + num(fs, 4) + '</div>';
      h += '<div class="row">&nbsp;&nbsp;&nbsp;Крамер: x = (' + num(-2 * s.c * s.d + s.b * s.e, 4) + ')/' + num(s.det, 4) + ', y = (' + num(-2 * s.a * s.e + s.b * s.d, 4) + ')/' + num(s.det, 4) + '; проверка ∇f(x⋆) = ' + vec(s.g(s.xs[0], s.xs[1]), 6) + '</div>';
    } else {
      h += '<div class="row">3) det H = 0: система вырождена — либо прямая стационарных точек, либо ни одной. Тест второго порядка не работает.</div>';
    }
    const D = s.tr * s.tr - 4 * s.det;
    h += '<div class="row">4) ' + linFmt([ln(1, 'λ²'), ln(-s.tr, 'λ'), ln(s.det, '')]) + ' = 0, &nbsp; D = tr² − 4det = ' + num(D, 4) + ' ⇒ λ = ' + num(s.E.l1, 4) + ', ' + num(s.E.l2, 4) + '</div>';
    const k = classify(s.E.l1, s.E.l2, 1e-9).k;
    let tp;
    if (k === 'pd') tp = pill(true, 'строгий минимум') + ' (det &gt; 0, tr &gt; 0), глобальный и единственный: H ≻ 0 постоянна ⇒ f сильно выпукла</div><div class="row">6) µ = ' + num(s.E.l1, 4) + ', L = ' + num(s.E.l2, 4) + ', κ = ' + num(s.E.l2 / s.E.l1, 4) + '; безопасные шаги 0 &lt; α &lt; 2/L = ' + num(2 / s.E.l2, 4) + ', стандартный α = 1/L = ' + num(1 / s.E.l2, 4) + '; (κ − 1)/(κ + 1) = ' + num((s.E.l2 - s.E.l1) / (s.E.l2 + s.E.l1), 4);
    else if (k === 'ind') tp = pill(false, 'седло') + ' (det &lt; 0); µ и κ не определены, функция невыпукла; формально L-гладкая с L = max|λ| = ' + num(Math.max(Math.abs(s.E.l1), Math.abs(s.E.l2)), 4);
    else if (k === 'nd') tp = pill(false, 'строгий максимум') + ' (det &gt; 0, tr &lt; 0)';
    else tp = pill(null, 'вырожденный случай') + ' (det = 0)';
    h += '<div class="row">5) тип: ' + tp + '</div>';
    if (probe) { const g = s.g(probe[0], probe[1]); h += '<div class="row k-mut">пробная точка ' + vec(probe, 3) + ': ∇f = Hx + (d, e) = ' + vec(g, 4) + '</div>'; }
    ro.innerHTML = h;
  }
  drag(fig, {
    hit: (px, py, r) => { if (!v) return null; const s = S(); const cen = s.xs || [0, 0]; const p = probe || [cen[0] + 1.6, cen[1] + 1.1]; return near(px, py, v.sx(p[0]), v.sy(p[1]), r) ? 'p' : null; },
    down: () => 'p',
    move: (id, px, py) => { probe = [clamp(v.wx(px), v.x0, v.x1), clamp(v.wy(py), v.y0, v.y1)]; upd(); }
  });
  WAPI[wid] = { load };
  upd();
};

/* ================= practice: GD steps calculator (3.2) ================= */
const GPRE = {
  B1: { a: 1, b: -1, c: 1, x0: [6, 0], al: 1 / 3 }, B2: { a: 3, b: 0, c: 2, x0: [4, -3], al: 1 / 6 }, B3: { a: 1, b: 0, c: 1, x0: [2, 1], al: 1 }, B4: { a: 1, b: 0, c: 1, x0: [1, -1], al: 2 }, live: { a: 2, b: 1, c: 1.5, x0: [2.5, -1.5], al: 0.25 },
  P3: { a: 2, b: 0, c: 1, p: 2, q: -1, x0: [6, 7], al: 1 / 4 }, P4: { a: 1, b: 1, c: 1, x0: [0, 6], al: 1 / 2 }, TA2: { a: 1, b: 0, c: 3, p: -1, q: 0, x0: [7, 4], al: 1 / 4 }, TB2: { a: 1, b: 1, c: 1, x0: [6, 0], al: 1 / 3 },
  W83: { a: 1, b: -1, c: 1, x0: [2, 0], al: 1 / 2, n: 1 }, W86: { a: 1, b: 0, c: -1, x0: [1, 0], al: 1 / 4, n: 6 }
};
const GLBL = { B1: 'задача B1', B2: 'задача B2', B3: 'задача B3', B4: 'задача B4', live: 'пример семинара', P3: 'П3', P4: 'П4', TA2: 'пробный билет А, задача 2', TB2: 'пробный билет Б, задача 2', W83: 'П8 · запись 3', W86: 'П8 · запись 6 (контрпример)' };
const GSETS = { def: [['B1', 'B1'], ['B3', 'B3'], ['B2', 'B2'], ['B4', 'B4'], ['live', 'пример семинара']], wb: [['P3', 'П3'], ['P4', 'П4'], ['TA2', 'билет А · задача 2'], ['TB2', 'билет Б · задача 2'], ['W83', 'П8 · 3'], ['W86', 'П8 · 6']] };
const SUBK = '₀₁₂₃₄₅₆₇₈₉';
const subk = k => String(k).split('').map(ch => SUBK[+ch]).join('');
function shiftVar(name, s) {
  if (Math.abs(s) < 1e-12) return name;
  return '(' + name + (s > 0 ? ' − ' : ' + ') + num(Math.abs(s), 4) + ')';
}
WIDGETS.gd3 = (root, wid, ds) => {
  const set = GSETS[(ds && ds.set) || 'def'] || GSETS.def;
  let st = { a: 1, b: -1, c: 1, p: 0, q: 0, x0: [6, 0], al: 1 / 3 }, n = 3, tag = '';
  const c1 = row(root);
  const bA = numBox(c1, wid, { name: 'a', label: 'a (при x²)', value: st.a, step: 0.5, on: z => { st.a = z; tag = ''; upd(); } });
  const bB = numBox(c1, wid, { name: 'b', label: 'b (при xy)', value: st.b, step: 0.5, on: z => { st.b = z; tag = ''; upd(); } });
  const bC = numBox(c1, wid, { name: 'c', label: 'c (при y²)', value: st.c, step: 0.5, on: z => { st.c = z; tag = ''; upd(); } });
  const bP = numBox(c1, wid, { name: 'p', label: 'сдвиг p: (x − p)', value: st.p, step: 0.5, on: z => { st.p = z; tag = ''; upd(); } });
  const bQ = numBox(c1, wid, { name: 'q', label: 'сдвиг q: (y − q)', value: st.q, step: 0.5, on: z => { st.q = z; tag = ''; upd(); } });
  const c1b = row(root);
  const bX = numBox(c1b, wid, { name: 'x0', label: 'x₀ (первая)', value: st.x0[0], step: 0.5, on: z => { st.x0[0] = z; tag = ''; upd(); } });
  const bY = numBox(c1b, wid, { name: 'y0', label: 'x₀ (вторая)', value: st.x0[1], step: 0.5, on: z => { st.x0[1] = z; tag = ''; upd(); } });
  const bAl = numBox(c1b, wid, { name: 'al', label: 'α', value: +st.al.toFixed(6), step: 0.01, on: z => { st.al = z; tag = ''; upd(); } });
  const bN = numBox(c1b, wid, { name: 'n', label: 'шагов', value: n, step: 1, on: z => { n = clamp(Math.round(z), 1, 12); upd(); } });
  const c2 = row(root);
  const setAl = z => { st.al = z; bAl.set(z); upd(); };
  button(c2, 'α = 1/L', () => { const E = eg(); if (E.l2 > 0) setAl(1 / E.l2); });
  button(c2, 'α = 2/(L + µ)', () => { const E = eg(); if (E.l1 > 0) setAl(2 / (E.l1 + E.l2)); });
  button(c2, 'α = 2/L', () => { const E = eg(); if (E.l2 > 0) setAl(2 / E.l2); });
  const c3 = row(root);
  const load = k => {
    const pr = GPRE[k];
    st = { a: pr.a, b: pr.b, c: pr.c, p: pr.p || 0, q: pr.q || 0, x0: pr.x0.slice(), al: pr.al };
    tag = k;
    bA.set(st.a); bB.set(st.b); bC.set(st.c); bP.set(st.p); bQ.set(st.q); bX.set(st.x0[0]); bY.set(st.x0[1]); bAl.set(st.al);
    n = pr.n || 3; bN.set(n);
    upd();
  };
  set.forEach(pr => button(c3, pr[1], () => load(pr[0])));
  const fr = figsRow(root);
  const fm = new Fig(fr, { aspect: 0.8, minH: 250, maxH: 400, label: 'Траектория градиентного спуска на карте уровней' });
  const fl = new Fig(fr, { aspect: 0.8, minH: 250, maxH: 400, scroll: true, label: 'Значения функции по шагам' });
  const ro = readout(root);
  let v = null;
  const fld = {};
  const Q = () => [[2 * st.a, st.b], [st.b, 2 * st.c]];
  const eg = () => { const m = Q(); return eig2(m[0][0], m[0][1], m[1][1]); };
  const ctr = () => [st.p, st.q];
  const fv = pt => { const u = pt[0] - st.p, w = pt[1] - st.q; return st.a * u * u + st.b * u * w + st.c * w * w; };
  const gv = pt => { const m = Q(), u = pt[0] - st.p, w = pt[1] - st.q; return [m[0][0] * u + m[0][1] * w, m[1][0] * u + m[1][1] * w]; };
  function path() { const out = [st.x0.slice()]; for (let i = 0; i < n; i++) { const pt = out[out.length - 1], g = gv(pt); out.push([pt[0] - st.al * g[0], pt[1] - st.al * g[1]]); } return out; }
  fm.draw = c => {
    const P = path(), cc = ctr();
    let R = 1;
    P.forEach(pt => { R = Math.max(R, Math.abs(pt[0] - cc[0]), Math.abs(pt[1] - cc[1]) / 0.8); });
    R = Math.min(R, 1e4) * 1.18;
    v = new View(fm, [cc[0] - R, cc[0] + R], [cc[1] - R * 0.8, cc[1] + R * 0.8], { equal: true, pad: { l: 40, b: 20 } });
    const E = eg();
    drawField(c, v, cachedField(fld, [st.a, st.b, st.c, st.p, st.q].join(','), v, (x, y) => fv([x, y]), { diverging: E.l1 <= 1e-12, nLev: 14 }), { zeroBold: E.l1 <= 1e-12 });
    axes(c, v, { noGrid: true });
    if (E.l1 > 1e-12) star(c, v.sx(cc[0]), v.sy(cc[1]), 7, T.green, T.surface);
    else diamond(c, v.sx(cc[0]), v.sy(cc[1]), 7, T.orange, T.surface);
    for (let i = 0; i + 1 < P.length; i++) arrow(c, v.sx(P[i][0]), v.sy(P[i][1]), v.sx(P[i + 1][0]), v.sy(P[i + 1][1]), T.orange, 1.8, 8);
    P.forEach((pt, i) => { dot(c, v.sx(pt[0]), v.sy(pt[1]), i ? 3.5 : 6.5, i ? T.orange : T.accent, T.surface, i ? 1 : 2); if (P.length <= 8) label(c, 'x' + subk(i), v.sx(pt[0]) + 9, v.sy(pt[1]) - 10, { color: i ? T.orange : T.accent, font: '12px ' + MATHF, bg: T.surface }); });
  };
  fl.draw = c => {
    const P = path(), fs = P.map(fv);
    const pos = fs.every(z => z > 0);
    const ys = fs.map(z => pos ? Math.log10(z) : z);
    let lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys);
    if (pos) { lo = Math.floor(lo - 0.2); hi = Math.ceil(hi + 0.2); } else { const pd = (hi - lo) * 0.15 + 0.5; lo -= pd; hi += pd; }
    const w = new View(fl, [-0.3, n + 0.3], [lo, hi], { pad: { l: 44 } });
    axes(c, w, { ylog: pos, xlab: 'k', ylab: 'f(xₖ)', noZero: pos });
    clipV(c, w); c.strokeStyle = T.orange; c.lineWidth = 1.8; c.beginPath();
    ys.forEach((y, k) => { if (k) c.lineTo(w.sx(k), w.sy(y)); else c.moveTo(w.sx(k), w.sy(y)); }); c.stroke(); c.restore();
    ys.forEach((y, k) => { dot(c, w.sx(k), w.sy(y), 4.5, T.orange, T.surface, 1.5); label(c, num(fs[k], 4), w.sx(k), w.sy(y) - 13, { color: T.ink, font: '11px ' + MONO, align: 'center', bg: T.surface }); });
  };
  function upd() {
    fm.render(); fl.render();
    const m = Q(), E = eg(), P = path(), cc = ctr();
    const L = E.l2, mu = E.l1;
    const shifted = Math.abs(st.p) > 1e-12 || Math.abs(st.q) > 1e-12;
    const sx = shiftVar('x', st.p), sy = shiftVar('y', st.q);
    const fstr = linFmt([[st.a, sx + '²'], [st.b, sx + sy], [st.c, sy + '²']]);
    let h = '<div class="row"><b>' + (tag ? GLBL[tag] + ': ' : '') + 'f = ' + fstr + (shifted ? ' = ½(x − x⋆)ᵀQ(x − x⋆)' : ' = ½xᵀQx') + ', &nbsp; Q = ' + mat(m, 4) + '</b></div>';
    h += '<div class="row">∇f = (' + linFmt([[2 * st.a, sx], [st.b, sy]]) + ', &nbsp;' + linFmt([[st.b, sx], [2 * st.c, sy]]) + ')' + (shifted ? ', &nbsp; x⋆ = ' + vec(cc, 4) + ', f(x⋆) = 0' : '') + '</div>';
    h += '<div class="row">λ(Q) = ' + num(mu, 4) + ', ' + num(L, 4) + ' (векторы v₁ = ' + vec(E.v1, 3) + ', v₂ = ' + vec(E.v2, 3) + ') &nbsp; L = ' + num(Math.max(Math.abs(mu), Math.abs(L)), 4) + ', 2/L = ' + num(L > 0 ? 2 / Math.max(Math.abs(mu), L) : Infinity, 4) + ', α = ' + num(st.al, 4) + '</div>';
    const m1 = 1 - st.al * mu, m2 = 1 - st.al * L, rho = Math.max(Math.abs(m1), Math.abs(m2));
    const det = E.v1[0] * E.v2[1] - E.v1[1] * E.v2[0];
    const e0 = [P[0][0] - cc[0], P[0][1] - cc[1]];
    const c1v = (e0[0] * E.v2[1] - e0[1] * E.v2[0]) / det, c2v = (E.v1[0] * e0[1] - E.v1[1] * e0[0]) / det;
    let verdict;
    if (mu <= 1e-12) {
      verdict = pill(false, 'Q не ≻ 0') + ' минимума может не быть: вдоль направления с λ ≤ 0 множитель ≥ 1';
      if (Math.abs(c1v) < 1e-9 && mu < -1e-12) verdict += '. Старт ровно на оси v₂ (λ &gt; 0): итерации идут к стационарной точке ' + vec(cc, 3) + ', а это седло, хотя f убывает на каждом шаге';
    }
    else if (st.al <= 0) verdict = pill(false, 'α ≤ 0');
    else if (st.al < 2 / L - 1e-12) verdict = pill(true, 'α &lt; 2/L: безопасно') + (Math.abs(st.al - 1 / L) < 1e-9 ? ' (α = 1/L: крутая компонента гаснет за шаг)' : '');
    else if (Math.abs(st.al - 2 / L) <= 1e-12) verdict = pill(null, 'α = 2/L: колебания без затухания');
    else verdict = pill(false, 'α &gt; 2/L: расходится, рост ×' + num(Math.abs(m2), 3) + ' за шаг');
    h += '<div class="row">множители 1 − αλᵢ: ' + num(m1, 4) + ' и ' + num(m2, 4) + ' &nbsp; ρ = max|·| = ' + num(rho, 4) + ' &nbsp; ' + verdict + '</div>';
    h += '<table><tr><th>k</th><th>xₖ</th>' + (shifted ? '<th>xₖ − x⋆</th>' : '') + '<th>∇f(xₖ) = Q' + (shifted ? '(xₖ − x⋆)' : 'xₖ') + '</th><th>f(xₖ)</th><th>' + (shifted ? '‖xₖ − x⋆‖/‖x₀ − x⋆‖' : '‖xₖ‖/‖x₀‖') + '</th></tr>';
    const n0 = Math.hypot(e0[0], e0[1]) || 1;
    P.forEach((pt, k) => {
      const e = [pt[0] - cc[0], pt[1] - cc[1]];
      h += '<tr><td>' + k + '</td><td>' + vec(pt, 4) + '</td>' + (shifted ? '<td>' + vec(e, 4) + '</td>' : '') + '<td>' + vec(gv(pt), 4) + '</td><td>' + num(fv(pt), 5) + '</td><td>' + num(Math.hypot(e[0], e[1]) / n0, 4) + '</td></tr>';
    });
    h += '</table>';
    h += '<div class="row k-mut">в собственном базисе: x₀' + (shifted ? ' − x⋆' : '') + ' = ' + num(c1v, 3) + '·v₁ ' + (c2v < 0 ? '− ' + num(-c2v, 3) : '+ ' + num(c2v, 3)) + '·v₂; после k шагов коэффициенты умножаются на (' + num(m1, 3) + ')ᵏ и (' + num(m2, 3) + ')ᵏ</div>';
    ro.innerHTML = h;
  }
  drag(fm, { hit: (px, py, r) => (v && near(px, py, v.sx(st.x0[0]), v.sy(st.x0[1]), r)) ? 's' : null, move: (id, px, py) => { st.x0 = [+v.wx(px).toFixed(2), +v.wy(py).toFixed(2)]; bX.set(st.x0[0]); bY.set(st.x0[1]); tag = ''; upd(); } });
  WAPI[wid] = { load };
  load(set[0][0]);
};

/* ================= answer checker ================= */
const TASKS = {
  A1: [{ k: 'num', l: 'x⋆, первая координата', v: 2.2 }, { k: 'num', l: 'x⋆, вторая координата', v: -0.4 }, { k: 'type', l: 'тип точки', v: 'min' }, { k: 'num', l: 'µ', v: 5 - Math.sqrt(5) }, { k: 'num', l: 'L', v: 5 + Math.sqrt(5) }],
  A3: [{ k: 'num', l: 'x⋆, первая координата', v: 1 }, { k: 'num', l: 'x⋆, вторая координата', v: -1 }, { k: 'type', l: 'тип точки', v: 'saddle' }, { k: 'num', l: 'меньшее собственное значение H', v: -2 }, { k: 'num', l: 'большее собственное значение H', v: 6 }],
  A2: [{ k: 'num', l: 'x⋆, первая координата', v: 1 / 3 }, { k: 'num', l: 'x⋆, вторая координата', v: -5 / 3 }, { k: 'type', l: 'тип точки', v: 'min' }, { k: 'num', l: 'µ', v: 5 - Math.sqrt(13) }, { k: 'num', l: 'L', v: 5 + Math.sqrt(13) }],
  A4: [{ k: 'num', l: 'x⋆, первая координата', v: 1 }, { k: 'num', l: 'x⋆, вторая координата', v: 1 }, { k: 'type', l: 'тип точки', v: 'min' }, { k: 'num', l: 'µ', v: 2 }, { k: 'num', l: 'L', v: 20 }, { k: 'num', l: 'κ = L/µ', v: 10 }],
  B1: [{ k: 'num', l: 'f(x₁)', v: 4 }, { k: 'num', l: 'f(x₃)', v: 64 / 81 }, { k: 'num', l: 'L', v: 3 }, { k: 'yn', l: 'α &lt; 2/L?', v: 'yes' }],
  B3: [{ k: 'num', l: 'f(x₁)', v: 5 }, { k: 'num', l: 'f(x₃)', v: 5 }, { k: 'num', l: '‖x₃‖/‖x₀‖', v: 1 }],
  B2: [{ k: 'num', l: 'f(x₁)', v: 2 }, { k: 'num', l: 'f(x₃)', v: 2 / 81 }, { k: 'num', l: 'L', v: 6 }, { k: 'yn', l: 'α &lt; 2/L?', v: 'yes' }],
  B4: [{ k: 'num', l: 'f(x₁)', v: 18 }, { k: 'num', l: 'f(x₃)', v: 1458 }, { k: 'num', l: '|1 − αL|', v: 3 }],
  EX: [{ k: 'num', l: '1. f = x² + xy + y²: µ', v: 1 }, { k: 'num', l: '1. … и L', v: 3 }, { k: 'type', l: '2. собственные значения {1, 3}: тип', v: 'min' }, { k: 'multi', l: '3. L = 10: какие α безопасны?', opts: ['0.1', '0.2', '0.3'], v: ['0.1'] }],
  W1: [{ k: 'num', l: 'x⋆, первая координата', v: 2 }, { k: 'num', l: 'x⋆, вторая координата', v: -1 }, { k: 'type', l: 'тип точки', v: 'min' }, { k: 'num', l: 'f(x⋆)', v: -6 }, { k: 'num', l: 'µ', v: 2 }, { k: 'num', l: 'L', v: 6 }, { k: 'num', l: 'κ', v: 3 }, { k: 'num', l: 'безопасно 0 &lt; α &lt; …', v: 1 / 3 }, { k: 'num', l: 'стандартный шаг 1/L', v: 1 / 6 }],
  W2: [{ k: 'type', l: 'x² − y²', v: 'saddle' }, { k: 'type', l: '−x² − y²', v: 'max' }, { k: 'type', l: 'x⁴ + y⁴', v: 'min' }, { k: 'type', l: 'x⁴ − y⁴', v: 'saddle' }],
  W3: [{ k: 'opt', l: 'прогноз: какая координата попадёт в оптимум за 1 шаг', opts: [['x', 'первая (x)'], ['y', 'вторая (y)'], ['both', 'обе'], ['none', 'никакая']], v: 'x' }, { k: 'num', l: 'µ', v: 2 }, { k: 'num', l: 'L', v: 4 }, { k: 'yn', l: 'α &lt; 2/L?', v: 'yes' }, { k: 'num', l: 'x₁, первая', v: 2 }, { k: 'num', l: 'x₁, вторая', v: 3 }, { k: 'num', l: 'f(x₁)', v: 16 }, { k: 'num', l: 'f(x₂)', v: 4 }, { k: 'num', l: 'f(x₃)', v: 1 }, { k: 'num', l: 'множитель ошибки yₖ − y⋆', v: 0.5 }],
  W4: [{ k: 'num', l: 'L', v: 3 }, { k: 'yn', l: 'α &lt; 2/L?', v: 'yes' }, { k: 'num', l: 'x₁, первая', v: -3 }, { k: 'num', l: 'x₁, вторая', v: 0 }, { k: 'num', l: 'f(x₁)', v: 9 }, { k: 'num', l: 'f(x₂)', v: 2.25 }, { k: 'num', l: 'f(x₃)', v: 0.5625 }, { k: 'num', l: 'множитель вдоль (1, 1)', v: -0.5 }, { k: 'num', l: 'множитель вдоль (1, −1)', v: 0.5 }],
  W5: [
    { k: 'num', l: 'α = 1/6: множитель по x', v: 2 / 3 }, { k: 'num', l: 'α = 1/6: множитель по y', v: 0 }, { k: 'yn', l: 'α = 1/6: сходится из любой точки?', v: 'yes' },
    { k: 'num', l: 'α = 1/4: по x', v: 0.5 }, { k: 'num', l: 'α = 1/4: по y', v: -0.5 }, { k: 'yn', l: 'α = 1/4: из любой точки?', v: 'yes' },
    { k: 'num', l: 'α = 1/3: по x', v: 1 / 3 }, { k: 'num', l: 'α = 1/3: по y', v: -1 }, { k: 'yn', l: 'α = 1/3: из любой точки?', v: 'no' },
    { k: 'num', l: 'α = 2/5: по x', v: 0.2 }, { k: 'num', l: 'α = 2/5: по y', v: -1.4 }, { k: 'yn', l: 'α = 2/5: из любой точки?', v: 'no' }
  ],
  W6: [{ k: 'num', l: 'направление d, первая', v: -2 }, { k: 'num', l: 'направление d, вторая', v: -6 }, { k: 'num', l: 'x₁, первая', v: 3 }, { k: 'num', l: 'x₁, вторая', v: -2 }, { k: 'num', l: 'f(x₁)', v: 0 }],
  W6b: [{ k: 'num', l: 'правая часть условия при α = 1', v: 0 }, { k: 'num', l: 'левая часть при α = 1', v: 4 }, { k: 'num', l: 'первый принятый шаг', v: 0.5 }, { k: 'num', l: 'сколько было попыток', v: 2 }, { k: 'num', l: 'итоговая точка', v: 0 }],
  W7: [{ k: 'num', l: 'x⋆', v: 1 }, { k: 'num', l: 'λ⋆', v: 4 }, { k: 'num', l: 'f(x⋆)', v: 4 }, { k: 'yn', l: 'ограничение активно?', v: 'yes' }, { k: 'num', l: 'd⋆ = max q(λ)', v: 4 }, { k: 'num', l: 'доп.: x ≤ 4 ⇒ x⋆', v: 3 }, { k: 'num', l: 'доп.: x ≤ 4 ⇒ λ⋆', v: 0 }],
  W8: [{ k: 'num', l: '1: коэффициент при y в ∂f/∂x', v: 4 }, { k: 'num', l: '3: x₁, первая', v: 0 }, { k: 'num', l: '3: x₁, вторая', v: 1 }, { k: 'num', l: '5: правильное L', v: 10 }],
  TA1: [{ k: 'num', l: 'x⋆, первая', v: 1 }, { k: 'num', l: 'x⋆, вторая', v: 1 }, { k: 'type', l: 'тип', v: 'min' }, { k: 'num', l: 'f(x⋆)', v: -8 }, { k: 'num', l: 'µ', v: 4 }, { k: 'num', l: 'L', v: 8 }, { k: 'num', l: 'κ', v: 2 }, { k: 'num', l: 'стандартный шаг 1/L', v: 1 / 8 }],
  TA2: [{ k: 'num', l: 'L', v: 6 }, { k: 'yn', l: 'α &lt; 2/L?', v: 'yes' }, { k: 'num', l: 'x₁, первая', v: 3 }, { k: 'num', l: 'x₁, вторая', v: -2 }, { k: 'num', l: 'f(x₁)', v: 28 }, { k: 'num', l: 'f(x₂)', v: 7 }, { k: 'num', l: 'x₃, вторая', v: -0.5 }, { k: 'num', l: 'f(x₃)', v: 1.75 }],
  TB1: [{ k: 'num', l: 'x⋆, первая', v: 1 }, { k: 'num', l: 'x⋆, вторая', v: -1 }, { k: 'type', l: 'тип', v: 'min' }, { k: 'num', l: 'f(x⋆)', v: -6 }, { k: 'num', l: 'µ', v: 2 }, { k: 'num', l: 'L', v: 6 }, { k: 'num', l: 'κ', v: 3 }, { k: 'num', l: 'стандартный шаг 1/L', v: 1 / 6 }],
  TB2: [{ k: 'num', l: 'L', v: 3 }, { k: 'yn', l: 'α &lt; 2/L?', v: 'yes' }, { k: 'num', l: 'x₁, первая', v: 2 }, { k: 'num', l: 'x₁, вторая', v: -2 }, { k: 'num', l: 'f(x₁)', v: 4 }, { k: 'num', l: 'f(x₂)', v: 16 / 9 }, { k: 'num', l: 'f(x₃)', v: 64 / 81 }, { k: 'num', l: 'множитель вдоль (1, 1)', v: 0 }, { k: 'num', l: 'множитель вдоль (1, −1)', v: 2 / 3 }]
};
const TYPE_OPTS = [['', '—'], ['min', 'минимум'], ['max', 'максимум'], ['saddle', 'седло'], ['deg', 'вырожденная']];
function renderQA(box) {
  const id = box.dataset.task, items = TASKS[id];
  if (!items) return;
  const lab0 = document.createElement('div'); lab0.className = 'lbl'; lab0.textContent = 'Проверь ответы'; box.appendChild(lab0);
  const rows = [];
  items.forEach((it, i) => {
    const r = document.createElement('div'); r.className = 'qa-row';
    const fid = 'qa-' + id + '-' + i;
    const lab = document.createElement('label'); lab.htmlFor = fid; lab.innerHTML = it.l; r.appendChild(lab);
    let ctl, get;
    if (it.k === 'num') { ctl = document.createElement('input'); ctl.type = 'text'; ctl.id = fid; ctl.inputMode = 'decimal'; ctl.placeholder = 'число'; ctl.autocomplete = 'off'; get = () => ctl.value; }
    else if (it.k === 'type' || it.k === 'yn' || it.k === 'opt') { ctl = document.createElement('select'); ctl.id = fid; (it.k === 'type' ? TYPE_OPTS : it.k === 'opt' ? [['', '—']].concat(it.opts) : [['', '—'], ['yes', 'да'], ['no', 'нет']]).forEach(o => { const e = document.createElement('option'); e.value = o[0]; e.textContent = o[1]; ctl.appendChild(e); }); get = () => ctl.value; }
    else { ctl = document.createElement('span'); ctl.className = 'multi'; ctl.id = fid; it.opts.forEach((o, j) => { const l = document.createElement('label'); l.className = 'chk'; const cb = document.createElement('input'); cb.type = 'checkbox'; cb.value = o; cb.id = fid + '-' + j; l.append(cb, document.createTextNode(' α = ' + o)); ctl.appendChild(l); }); get = () => Array.from(ctl.querySelectorAll('input:checked')).map(e => e.value); }
    r.appendChild(ctl);
    const res = document.createElement('span'); res.className = 'res'; res.setAttribute('aria-live', 'polite'); r.appendChild(res);
    const check = () => {
      const val = get();
      let good = false, empty = false;
      if (it.k === 'num') { const x = parseAns(val); empty = String(val).trim() === ''; const tol = Math.abs(it.v) < 0.1 ? Math.max(6e-4, 0.02 * Math.abs(it.v)) : Math.max(0.0051, 0.002 * Math.abs(it.v)); good = isFinite(x) && Math.abs(x - it.v) <= tol; if (!empty && !isFinite(x)) { res.innerHTML = '<span class="k-warn">не число</span>'; return false; } }
      else if (it.k === 'multi') { good = val.length === it.v.length && val.every(z => it.v.indexOf(z) >= 0); empty = false; }
      else { empty = val === ''; good = val === it.v; }
      res.innerHTML = empty ? '' : good ? '<span class="k-ok">✓ верно</span>' : '<span class="k-bad">✗ неверно</span>';
      return good;
    };
    ctl.addEventListener(it.k === 'num' ? 'keydown' : 'change', e => { if (it.k !== 'num' || e.key === 'Enter') check(); });
    if (it.k === 'num') ctl.addEventListener('blur', check);
    rows.push({ check, res, it });
    box.appendChild(r);
  });
  const bar = document.createElement('div'); bar.className = 'qa-row';
  button(bar, 'Проверить всё', () => { const n = rows.filter(r => r.check()).length; sum.textContent = 'верно ' + n + ' из ' + rows.length; }, 'primary');
  button(bar, 'Показать ответы', () => { rows.forEach(r => { const it = r.it; const t = it.k === 'num' ? num(it.v, 4) : it.k === 'multi' ? it.v.map(z => 'α = ' + z).join(', ') : it.k === 'yn' ? (it.v === 'yes' ? 'да' : 'нет') : it.k === 'opt' ? it.opts.filter(o => o[0] === it.v)[0][1] : TYPE_OPTS.filter(o => o[0] === it.v)[0][1]; r.res.innerHTML = '<span class="k-mut">ответ: ' + t + '</span>'; }); });
  const sum = document.createElement('span'); sum.className = 'res'; bar.appendChild(sum);
  box.appendChild(bar);
}
