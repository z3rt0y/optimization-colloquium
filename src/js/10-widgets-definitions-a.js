
/* ================= 3D surface ================= */
class Surface3D {
  constructor(parent, o) {
    o = o || {};
    this.fig = new Fig(parent, { aspect: 0.78, minH: 230, maxH: 380, label: o.label || 'Поверхность функции, её можно вращать' });
    this.az = -0.75; this.el = 0.62; this.n = o.n || 30; this.marks = [];
    this.fig.draw = (c, w, h) => this.paint(c, w, h);
    let last = null;
    const cv = this.fig.cv;
    cv.style.cursor = 'grab';
    cv.addEventListener('pointerdown', e => { last = this.fig.pos(e); try { cv.setPointerCapture(e.pointerId); } catch (_) {} e.preventDefault(); });
    cv.addEventListener('pointermove', e => {
      if (!last) return;
      const p = this.fig.pos(e);
      this.az += (p[0] - last[0]) * 0.012;
      this.el = clamp(this.el + (p[1] - last[1]) * 0.01, 0.12, 1.45);
      last = p;
      this.fig.render();
    });
    const up = () => { last = null; };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
  }
  set(f, xr, yr, o) {
    o = o || {};
    this.f = f; this.xr = xr; this.yr = yr;
    const n = this.n, Z = [], zs = [];
    for (let j = 0; j <= n; j++) {
      const r = [];
      for (let i = 0; i <= n; i++) {
        const x = xr[0] + (xr[1] - xr[0]) * i / n, y = yr[0] + (yr[1] - yr[0]) * j / n;
        const z = f(x, y);
        r.push(z);
        if (isFinite(z)) zs.push(z);
      }
      Z.push(r);
    }
    zs.sort((a, b) => a - b);
    const ql = o.q ? o.q[0] : 0, qh = o.q ? o.q[1] : 1;
    let lo = zs[Math.floor((zs.length - 1) * ql)], hi = zs[Math.floor((zs.length - 1) * qh)];
    this.sym = !!o.sym;
    if (this.sym) { const m = Math.max(Math.abs(lo), Math.abs(hi)) || 1; lo = -m; hi = m; }
    if (!(hi - lo > 1e-12)) hi = lo + 1;
    this.lo = lo; this.hi = hi; this.Z = Z;
    this.fig.render();
  }
  zn(z) { const t = (clamp(z, this.lo, this.hi) - this.lo) / (this.hi - this.lo); return (t - 0.5) * 1.1; }
  proj(x, y, z, w, h) {
    const ca = Math.cos(this.az), sa = Math.sin(this.az);
    const X = x * ca - y * sa, Y = x * sa + y * ca;
    const ce = Math.cos(this.el), se = Math.sin(this.el);
    const s = Math.min(w, h) * 0.36;
    return [w / 2 + X * s, h / 2 - (Y * se + z * ce) * s + h * 0.03, -Y * ce + z * se];
  }
  paint(c, w, h) {
    if (!this.Z) return;
    const n = this.n, Z = this.Z, P = [];
    for (let j = 0; j <= n; j++) { const r = []; for (let i = 0; i <= n; i++) r.push(this.proj(-1 + 2 * i / n, -1 + 2 * j / n, this.zn(Z[j][i]), w, h)); P.push(r); }
    const quads = [];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const a = P[j][i], b = P[j][i + 1], cc = P[j + 1][i + 1], d = P[j + 1][i];
      quads.push([(a[2] + b[2] + cc[2] + d[2]) / 4, a, b, cc, d, (Z[j][i] + Z[j][i + 1] + Z[j + 1][i + 1] + Z[j + 1][i]) / 4]);
    }
    quads.sort((p, q) => p[0] - q[0]);
    const amax = Math.max(Math.abs(this.lo), Math.abs(this.hi));
    c.lineWidth = 0.6;
    const edge = al(T.ink, 0.16);
    for (const q of quads) {
      const z = q[5];
      let col;
      if (this.sym) { const t = clamp(z / amax, -1, 1); col = t >= 0 ? mix(T.heatLo, T.heatHi, 0.18 + 0.72 * t) : mix(T.heatLo, T.divNeg, 0.18 + 0.72 * (-t)); }
      else { const t = (clamp(z, this.lo, this.hi) - this.lo) / (this.hi - this.lo); col = mix(T.heatLo, T.heatHi, 0.12 + 0.8 * t); }
      c.fillStyle = 'rgb(' + (col[0] | 0) + ',' + (col[1] | 0) + ',' + (col[2] | 0) + ')';
      c.beginPath(); c.moveTo(q[1][0], q[1][1]); c.lineTo(q[2][0], q[2][1]); c.lineTo(q[3][0], q[3][1]); c.lineTo(q[4][0], q[4][1]); c.closePath();
      c.fill(); c.strokeStyle = edge; c.stroke();
    }
    for (const m of this.marks) {
      const x = -1 + 2 * (m.x - this.xr[0]) / (this.xr[1] - this.xr[0]);
      const y = -1 + 2 * (m.y - this.yr[0]) / (this.yr[1] - this.yr[0]);
      if (Math.abs(x) > 1 || Math.abs(y) > 1) continue;
      const p = this.proj(x, y, this.zn(this.f(m.x, m.y)), w, h);
      dot(c, p[0], p[1], m.r || 5, m.color, T.surface, 1.5);
    }
    label(c, 'тяни, чтобы вращать', 8, h - 11, { color: T.muted, font: '11px ' + BODY });
  }
}

/* ================= triangle problem P: problem / active / kkt ================= */
const TRI = {
  g: [p => p[0] + p[1] - 3, p => -p[0], p => -p[1]],
  n: [[1, 1], [-1, 0], [0, -1]],
  verts: [[0, 0], [3, 0], [0, 3]],
  names: ['g₁ = x₁ + x₂ − 3', 'g₂ = −x₁', 'g₃ = −x₂'],
  lines: [[[0, 3], [1, -1]], [[0, 0], [0, 1]], [[0, 0], [1, 0]]]
};
function projSeg(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy), 0, 1);
  return [a[0] + t * dx, a[1] + t * dy];
}
function inTri(p, eps) { eps = eps || 0; return TRI.g.every(g => g(p) <= eps); }
function nearestEdge(p) {
  let best = null, bd = Infinity;
  for (let i = 0; i < 3; i++) { const q = projSeg(p, TRI.verts[i], TRI.verts[(i + 1) % 3]); const d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < bd) { bd = d; best = q; } }
  return [best, bd];
}
function projTri(p) { return inTri(p) ? p.slice() : nearestEdge(p)[0]; }
function snapTri(p, tol) {
  for (const vv of TRI.verts) if (Math.hypot(p[0] - vv[0], p[1] - vv[1]) < tol * 1.4) return vv.slice();
  const r = nearestEdge(p);
  return r[1] < tol ? r[0] : p;
}
function kktAt(x, cen, tol) {
  const gf = [2 * (x[0] - cen[0]), 2 * (x[1] - cen[1])];
  const A = [];
  for (let i = 0; i < 3; i++) if (Math.abs(TRI.g[i](x)) <= tol) A.push(i);
  const lam = [0, 0, 0];
  let r = [gf[0], gf[1]];
  if (A.length === 1) {
    const nn = TRI.n[A[0]];
    const l = -(gf[0] * nn[0] + gf[1] * nn[1]) / (nn[0] * nn[0] + nn[1] * nn[1]);
    lam[A[0]] = l; r = [gf[0] + l * nn[0], gf[1] + l * nn[1]];
  } else if (A.length >= 2) {
    const n1 = TRI.n[A[0]], n2 = TRI.n[A[1]];
    const det = n1[0] * n2[1] - n2[0] * n1[1];
    const l1 = (-gf[0] * n2[1] + gf[1] * n2[0]) / det, l2 = (-n1[0] * gf[1] + n1[1] * gf[0]) / det;
    lam[A[0]] = l1; lam[A[1]] = l2;
    r = [gf[0] + l1 * n1[0] + l2 * n2[0], gf[1] + l1 * n1[1] + l2 * n2[1]];
  }
  return { gf, A, lam, res: Math.hypot(r[0], r[1]) };
}
function triWidget(root, wid, mode) {
  let cen = [3, 2], x = mode === 'problem' ? [1.2, 0.8] : [2, 1], showOpt = mode !== 'active', kmode = 'opt', snap = true;
  const ctl = row(root);
  if (mode === 'problem') checkbox(ctl, wid, { name: 'opt', label: 'показать решение x⋆', checked: true, on: b => { showOpt = b; upd(); } });
  if (mode === 'active') checkbox(ctl, wid, { name: 'snap', label: 'прилипать к границе', checked: true, on: b => { snap = b; } });
  if (mode === 'kkt') {
    selectBox(ctl, wid, { name: 'mode', label: 'Режим', value: 'opt', options: [['opt', 'оптимум для цели c'], ['check', 'проверить точку x']], on: s => { kmode = s; if (s === 'check') x = [0.6, 0.6]; upd(); } });
    button(ctl, 'Сбросить цель в (3, 2)', () => { cen = [3, 2]; upd(); });
  }
  const fig = new Fig(root, { aspect: 0.66, minH: 260, maxH: 430, label: 'Задача P: допустимый треугольник и линии уровня целевой функции' });
  const ro = readout(root);
  let v = null;
  const f = p => (p[0] - cen[0]) * (p[0] - cen[0]) + (p[1] - cen[1]) * (p[1] - cen[1]);
  const field = { };
  fig.draw = c => {
    v = new View(fig, [-0.7, 4.4], [-0.7, 3.6], { equal: true, pad: { l: 30, b: 20 } });
    const fld = cachedField(field, 'c' + cen[0].toFixed(3) + ',' + cen[1].toFixed(3), v, (a, b) => f([a, b]), { nLev: 12, qpow: 1.5 });
    drawField(c, v, fld);
    axes(c, v, { noGrid: true });
    clipV(c, v);
    c.beginPath(); TRI.verts.forEach((p, i) => { const px = v.sx(p[0]), py = v.sy(p[1]); if (i) c.lineTo(px, py); else c.moveTo(px, py); }); c.closePath();
    c.fillStyle = al(T.green, 0.13); c.fill();
    c.strokeStyle = T.green; c.lineWidth = 2; c.stroke();
    c.restore();
    const xopt = projTri(cen);
    const showAt = mode === 'kkt' ? (kmode === 'opt' ? xopt : x) : x;
    const info = kktAt(showAt, cen, 1e-6);
    for (let i = 0; i < 3; i++) {
      const L = TRI.lines[i];
      const act = mode !== 'problem' && info.A.indexOf(i) >= 0;
      lineWorld(c, v, L[0], L[1], act ? T.violet : al(T.muted, 0.6), act ? 2.6 : 1, act ? null : [4, 4]);
    }
    label(c, 'g₁ = 0', v.sx(3.25), v.sy(-0.3), { color: T.muted, font: '11px ' + MATHF });
    label(c, 'g₂ = 0', v.sx(0.08), v.sy(3.4), { color: T.muted, font: '11px ' + MATHF });
    label(c, 'g₃ = 0', v.sx(3.9), v.sy(0.13), { color: T.muted, font: '11px ' + MATHF });
    diamond(c, v.sx(cen[0]), v.sy(cen[1]), 7, T.orange, T.surface);
    label(c, 'c', v.sx(cen[0]) + 10, v.sy(cen[1]) - 10, { color: T.orange, font: 'italic 13px ' + MATHF });
    if (showOpt && !(mode === 'kkt' && kmode === 'check')) {
      star(c, v.sx(xopt[0]), v.sy(xopt[1]), 9, T.green, T.surface);
      label(c, 'x⋆', v.sx(xopt[0]) + 11, v.sy(xopt[1]) + 11, { color: T.green, font: '13px ' + MATHF, bg: T.surface });
    }
    if (mode === 'kkt') {
      const p = showAt, sc = 0.22;
      const px = v.sx(p[0]), py = v.sy(p[1]);
      arrow(c, px, py, v.sx(p[0] - sc * info.gf[0]), v.sy(p[1] - sc * info.gf[1]), T.orange, 2.6);
      for (const i of info.A) {
        const l = info.lam[i], nn = TRI.n[i];
        arrow(c, px, py, v.sx(p[0] - sc * l * nn[0]), v.sy(p[1] - sc * l * nn[1]), T.violet, 2.6);
      }
      if (kmode === 'check') dot(c, px, py, 7, T.accent, T.surface, 2);
    } else {
      dot(c, v.sx(x[0]), v.sy(x[1]), 7, T.accent, T.surface, 2);
      label(c, 'x', v.sx(x[0]) - 13, v.sy(x[1]) - 11, { color: T.accent, font: 'italic 13px ' + MATHF });
    }
  };
  function upd() {
    fig.render();
    const xopt = projTri(cen);
    if (mode === 'problem') {
      const gv = TRI.g.map(g => g(x));
      const feas = gv.every(z => z <= 1e-9);
      let h = '<div class="row">x = ' + vec(x, 2) + ' &nbsp; f(x) = (x₁ − ' + num(cen[0], 2) + ')² + (x₂ − ' + num(cen[1], 2) + ')² = ' + num(f(x), 3) + '</div>';
      h += '<table>' + gv.map((z, i) => '<tr><td>' + TRI.names[i] + '</td><td>= ' + num(z, 3) + '</td><td>' + (z <= 1e-9 ? '<span class="k-ok">≤ 0 ✓</span>' : '<span class="k-bad">&gt; 0 ✗</span>') + '</td></tr>').join('') + '</table>';
      h += '<div class="row">x допустима: ' + yes(feas) + (showOpt ? ' &nbsp; решение x⋆ = ' + vec(xopt, 3) + ', f⋆ = ' + num(f(xopt), 3) : '') + '</div>';
      ro.innerHTML = h;
    } else if (mode === 'active') {
      const gv = TRI.g.map(g => g(x));
      const A = [];
      const rows = gv.map((z, i) => {
        let st;
        if (Math.abs(z) <= 1e-6) { st = pill(true, 'активно'); A.push(i + 1); }
        else if (z < 0) st = '<span class="k-mut">неактивно</span>';
        else st = pill(false, 'нарушено');
        return '<tr><td>' + TRI.names[i] + '</td><td>= ' + num(z, 3) + '</td><td>' + st + '</td></tr>';
      }).join('');
      const feas = gv.every(z => z <= 1e-6);
      ro.innerHTML = '<div class="row">x = ' + vec(x, 3) + ' &nbsp; ' + (feas ? 'допустима' : '<span class="k-bad">недопустима</span>') + '</div><table>' + rows + '</table><div class="row">A(x) = {' + A.join(', ') + '}' + (A.length === 0 && feas ? ' — внутренняя точка' : '') + '</div>';
    } else {
      const p = kmode === 'opt' ? xopt : x;
      const info = kktAt(p, cen, 1e-6);
      const gv = TRI.g.map(g => g(p));
      const feas = gv.every(z => z <= 1e-6);
      const stat = info.res < 1e-6;
      const dual = info.lam.every(l => l >= -1e-9);
      const cs = info.lam.every((l, i) => Math.abs(l * gv[i]) < 1e-6);
      const lamTxt = 'λ = (' + info.lam.map(l => num(l, 3)).join(', ') + ')';
      let h = '<div class="row">' + (kmode === 'opt' ? 'цель c = ' + vec(cen, 2) + ' → x⋆ = ' + vec(p, 3) + ', f⋆ = ' + num(f(p), 3) : 'точка x = ' + vec(p, 3) + ', f(x) = ' + num(f(p), 3)) + '</div>';
      h += '<div class="row">∇f = ' + vec(info.gf, 3) + ' &nbsp; активные: {' + info.A.map(i => i + 1).join(', ') + '} &nbsp; ' + lamTxt + '</div>';
      h += '<table>';
      h += '<tr><td>1. стационарность ∇f + Σλᵢ∇gᵢ = 0</td><td>' + (stat ? pill(true, '✓') : pill(false, 'остаток ' + num(info.res, 3))) + '</td></tr>';
      h += '<tr><td>2. допустимость gᵢ(x) ≤ 0</td><td>' + yes(feas, '✓', '✗') + '</td></tr>';
      h += '<tr><td>3. двойственная допустимость λ ≥ 0</td><td>' + yes(dual, '✓', '✗ есть λ &lt; 0') + '</td></tr>';
      h += '<tr><td>4. дополняющая нежёсткость λᵢgᵢ = 0</td><td>' + yes(cs, '✓', '✗') + '</td></tr>';
      h += '</table>';
      const all = stat && feas && dual && cs;
      h += '<div class="row">' + (all ? pill(true, 'ККТ выполнены') + ' задача выпуклая ⇒ это глобальный минимум' : pill(false, 'ККТ не выполнены') + (!feas ? ' точка вне Ω' : !stat ? ' силы не уравновешены: есть допустимое направление спуска' : !dual ? ' стенка «тянет», от неё выгодно отойти внутрь' : '')) + '</div>';
      ro.innerHTML = h;
    }
  }
  const tolW = () => 12 / (v ? v.k : 40);
  drag(fig, {
    hit: (px, py, r) => {
      if (!v) return null;
      if ((mode === 'problem' || (mode === 'kkt' && kmode === 'opt')) && near(px, py, v.sx(cen[0]), v.sy(cen[1]), r)) return 'c';
      if (mode !== 'kkt' || kmode === 'check') if (near(px, py, v.sx(x[0]), v.sy(x[1]), r)) return 'x';
      return null;
    },
    down: () => (mode === 'kkt' && kmode === 'opt') ? 'c' : 'x',
    move: (id, px, py) => {
      const p = [clamp(v.wx(px), v.x0, v.x1), clamp(v.wy(py), v.y0, v.y1)];
      if (id === 'c') cen = p;
      else x = (mode === 'problem' || !snap) ? p : snapTri(p, tolW());
      upd();
    }
  });
  upd();
}
WIDGETS.problem = (root, wid) => triWidget(root, wid, 'problem');
WIDGETS.active = (root, wid) => triWidget(root, wid, 'active');
WIDGETS.kkt = (root, wid) => triWidget(root, wid, 'kkt');

/* ================= minima (1D) ================= */
const M1 = {
  quart: { name: 'x⁴ − 3x² + x', f: x => x * x * x * x - 3 * x * x + x, dom: [-2.2, 2.2], view: [-2.2, 2.2, -4.3, 3.2], x0: 1.13, eps: 0.4, snap: true },
  plateau: { name: 'max(0, |x| − 1)² (плато)', f: x => { const t = Math.max(0, Math.abs(x) - 1); return t * t; }, dom: [-2.5, 2.5], view: [-2.5, 2.5, -0.5, 2.6], x0: 0.4, eps: 0.3 },
  cubic3: { name: 'x³ − 3x на Ω = [−3, 3]', f: x => x * x * x - 3 * x, dom: [-3, 3], view: [-3.5, 3.5, -21, 21], x0: 1, eps: 0.5 },
  x3: { name: 'x³ (стационарна, но не минимум)', f: x => x * x * x, dom: [-1.6, 1.6], view: [-1.6, 1.6, -2.2, 2.2], x0: 0, eps: 0.4 },
  x4: { name: 'x⁴ (строгий минимум, f″(0) = 0)', f: x => x * x * x * x, dom: [-1.4, 1.4], view: [-1.4, 1.4, -0.4, 2.4], x0: 0, eps: 0.4 }
};
WIDGETS.minima = (root, wid, ds) => {
  let key = ds.preset || 'quart', P = M1[key];
  let xs = P.x0, eps = P.eps, mins = [], gmin = 0;
  const c1 = row(root);
  selectBox(c1, wid, { name: 'fn', label: 'Функция', value: key, options: Object.keys(M1).map(k => [k, M1[k].name]), on: k => { key = k; P = M1[k]; init(); } });
  const sX = slider(c1, wid, { name: 'xs', label: 'x*', min: P.dom[0], max: P.dom[1], step: 0.001, value: xs, fmt: z => num(z, 3), on: z => { xs = z; upd(); } });
  const sE = slider(c1, wid, { name: 'eps', label: 'ε', min: 0.02, max: 1.5, step: 0.01, value: eps, on: z => { eps = z; upd(); } });
  const c2 = row(root);
  button(c2, 'К ближайшему локальному минимуму', () => { xs = nearestMin(xs); sX.set(xs); upd(); });
  const fig = new Fig(root, { aspect: 0.5, minH: 240, maxH: 380, label: 'График функции и ε-окрестность точки x*' });
  const ro = readout(root);
  let v = null;
  function init() {
    const a = P.dom[0], b = P.dom[1], N = 4000, h = (b - a) / N;
    const ys = [];
    for (let i = 0; i <= N; i++) ys.push(P.f(a + h * i));
    mins = [];
    let i = 0;
    while (i <= N) {
      let j = i;
      while (j < N && Math.abs(ys[j + 1] - ys[i]) < 1e-13) j++;
      const left = i > 0 ? ys[i - 1] : Infinity, right = j < N ? ys[j + 1] : Infinity;
      if (ys[i] <= left && ys[i] <= right) {
        if (j > i) mins.push({ l: a + h * i, r: a + h * j, f: ys[i] });
        else {
          let xm = a + h * i;
          if (i > 0 && i < N) xm = golden(P.f, a + h * (i - 1), a + h * (i + 1));
          mins.push({ l: xm, r: xm, f: P.f(xm) });
        }
      }
      i = j + 1;
    }
    gmin = Math.min.apply(null, mins.map(m => m.f));
    sX.range(a, b);
    xs = P.snap ? nearestMin(P.x0) : clamp(P.x0, a, b); sX.set(xs);
    eps = P.eps; sE.set(eps);
    upd();
  }
  function nearestMin(x0) {
    let best = x0, bd = Infinity;
    for (const m of mins) { const q = clamp(x0, m.l, m.r); const d = Math.abs(q - x0); if (d < bd) { bd = d; best = q; } }
    return best;
  }
  function analyze() {
    const a = P.dom[0], b = P.dom[1], fx = P.f(xs);
    let local = true, strict = true;
    const lo = Math.max(a, xs - eps), hi = Math.min(b, xs + eps), M = 1500;
    for (let i = 0; i <= M; i++) {
      const x = lo + (hi - lo) * i / M;
      if (Math.abs(x - xs) < 1e-9) continue;
      const d = P.f(x) - fx;
      if (d < -1e-12) local = false;
      if (!(d > 0)) strict = false;
    }
    let localAny = true, strictAny = true;
    for (let i = 1; i <= 300; i++) {
      const hh = 1e-3 * i / 300;
      for (const s of [-1, 1]) {
        const x = xs + s * hh;
        if (x < a - 1e-12 || x > b + 1e-12) continue;
        const d = P.f(x) - fx;
        if (d < -1e-12) localAny = false;
        if (!(d > 0)) strictAny = false;
      }
    }
    const global = localAny && fx <= gmin + 1e-9;
    return { fx, local, strict, localAny, strictAny: localAny && strictAny, global, lo, hi };
  }
  fig.draw = c => {
    const vw = P.view;
    v = new View(fig, [vw[0], vw[1]], [vw[2], vw[3]]);
    const A = analyze();
    axes(c, v, { xlab: 'x', ylab: 'f(x)' });
    clipV(c, v);
    c.fillStyle = al(T.accent, 0.12);
    c.fillRect(v.sx(A.lo), v.pad.t, v.sx(A.hi) - v.sx(A.lo), v.H);
    if (P.dom[0] > vw[0]) { c.fillStyle = al(T.muted, 0.1); c.fillRect(v.pad.l, v.pad.t, v.sx(P.dom[0]) - v.pad.l, v.H); c.fillRect(v.sx(P.dom[1]), v.pad.t, v.pad.l + v.W - v.sx(P.dom[1]), v.H); }
    c.strokeStyle = al(T.muted, 0.8); c.setLineDash([5, 4]); c.lineWidth = 1;
    c.beginPath(); c.moveTo(v.pad.l, v.sy(A.fx)); c.lineTo(v.pad.l + v.W, v.sy(A.fx)); c.stroke(); c.setLineDash([]);
    c.restore();
    if (P.dom[0] > vw[0]) curve(c, v, P.f, { color: al(T.muted, 0.6), width: 1.4, dash: [3, 4] });
    curve(c, v, P.f, { color: T.ink, width: 2.2, x0: P.dom[0], x1: P.dom[1] });
    curve(c, v, z => { const y = P.f(z); return y < A.fx - 1e-12 ? y : NaN; }, { color: T.red, width: 4, x0: A.lo, x1: A.hi });
    c.save(); c.strokeStyle = T.ink; c.lineWidth = 4; c.lineCap = 'butt';
    c.beginPath(); c.moveTo(v.sx(P.dom[0]), v.pad.t + v.H - 2); c.lineTo(v.sx(P.dom[1]), v.pad.t + v.H - 2); c.stroke(); c.restore();
    for (const m of mins) {
      if (m.r > m.l) { c.save(); c.strokeStyle = T.green; c.lineWidth = 5; c.globalAlpha = 0.6; c.beginPath(); c.moveTo(v.sx(m.l), v.sy(m.f)); c.lineTo(v.sx(m.r), v.sy(m.f)); c.stroke(); c.restore(); }
      else if (Math.abs(m.f - gmin) < 1e-9) star(c, v.sx(m.l), v.sy(m.f), 8, T.green, T.surface);
      else dot(c, v.sx(m.l), v.sy(m.f), 5, T.green, T.surface, 1.5);
    }
    dot(c, v.sx(xs), v.sy(A.fx), 7, T.accent, T.surface, 2);
    label(c, 'x*', v.sx(xs) + 9, v.sy(A.fx) - 12, { color: T.accent, font: 'italic 13px ' + MATHF, bg: T.surface });
  };
  function upd() {
    fig.render();
    const A = analyze();
    ro.innerHTML =
      '<div class="row">x* = ' + num(xs, 4) + ', f(x*) = ' + num(A.fx, 5) + ' &nbsp; Ω = [' + num(P.dom[0], 2) + ', ' + num(P.dom[1], 2) + ']</div>' +
      '<div class="row">при выбранном ε = ' + num(eps, 2) + ': f(x) ≥ f(x*) в окрестности — ' + yes(A.local) + '</div>' +
      '<div class="row">локальный минимум (∃ ε &gt; 0) — ' + yes(A.localAny) + ' &nbsp; строгий — ' + yes(A.strictAny) + ' &nbsp; глобальный на Ω — ' + yes(A.global) + '</div>' +
      '<div class="row k-mut">звёздочка — глобальный минимум, зелёные точки — локальные, зелёная полоса — множество нестрогих минимумов</div>';
  }
  drag(fig, {
    hit: (px, py, r) => (v && near(px, py, v.sx(xs), v.sy(P.f(xs)), r)) ? 'x' : null,
    down: px => (v && px >= v.pad.l) ? 'x' : null,
    move: (id, px) => { xs = clamp(v.wx(px), P.dom[0], P.dom[1]); sX.set(xs); upd(); }
  });
  init();
};

/* ================= linear approximation ================= */
WIDGETS.linapprox = (root, wid) => {
  const F = F2.lect1;
  let p = [1, 1], th = 0, lh = -1;
  const c1 = row(root);
  slider(c1, wid, { name: 'th', label: 'угол h', min: 0, max: 359, step: 1, value: 0, fmt: z => Math.round(z) + '°', on: z => { th = z; upd(); } });
  slider(c1, wid, { name: 'lh', label: '‖h‖', min: -4, max: 0, step: 0.01, value: -1, fmt: z => num(Math.pow(10, z), 4), on: z => { lh = z; upd(); } });
  const fr = figsRow(root);
  const fm = new Fig(fr, { aspect: 0.8, minH: 250, maxH: 380, label: 'Карта уровней функции, точка x и направление h' });
  const fs = new Fig(fr, { aspect: 0.8, minH: 250, maxH: 380, scroll: true, label: 'Срез функции вдоль h и касательная прямая' });
  const ro = readout(root);
  let v = null;
  const fld = {};
  const u = () => [Math.cos(th * Math.PI / 180), Math.sin(th * Math.PI / 180)];
  fm.draw = c => {
    v = new View(fm, F.xr, F.yr, { equal: true, pad: { l: 30, b: 20 } });
    drawField(c, v, cachedField(fld, 'l1', v, F.f, {}));
    axes(c, v, { noGrid: true });
    const g = F.g(p[0], p[1]), gn = Math.hypot(g[0], g[1]) || 1, uu = u();
    const px = v.sx(p[0]), py = v.sy(p[1]);
    arrow(c, px, py, v.sx(p[0] + 0.7 * g[0] / gn), v.sy(p[1] + 0.7 * g[1] / gn), T.orange, 2.4);
    label(c, '∇f', v.sx(p[0] + 0.78 * g[0] / gn), v.sy(p[1] + 0.78 * g[1] / gn), { color: T.orange, font: '13px ' + MATHF, bg: T.surface, align: 'center' });
    arrow(c, px, py, v.sx(p[0] + 0.7 * uu[0]), v.sy(p[1] + 0.7 * uu[1]), T.green, 2.4, 9, [5, 4]);
    label(c, 'h', v.sx(p[0] + 0.8 * uu[0]), v.sy(p[1] + 0.8 * uu[1]), { color: T.green, font: 'italic 13px ' + MATHF, bg: T.surface, align: 'center' });
    dot(c, px, py, 7, T.accent, T.surface, 2);
  };
  fs.draw = c => {
    const uu = u(), g = F.g(p[0], p[1]), slope = g[0] * uu[0] + g[1] * uu[1], f0 = F.f(p[0], p[1]);
    const phi = s => F.f(p[0] + s * uu[0], p[1] + s * uu[1]);
    const tan = s => f0 + slope * s;
    const yr = yRange([phi, tan], -1.1, 1.1);
    const w = new View(fs, [-1.1, 1.1], yr);
    axes(c, w, { xlab: 's', ylab: 'f(x + s·h/‖h‖)' });
    curve(c, w, tan, { color: T.orange, width: 1.8, dash: [6, 4] });
    curve(c, w, phi, { color: T.ink, width: 2.2 });
    const hs = Math.pow(10, lh);
    const a = phi(hs), b = tan(hs);
    c.save(); c.strokeStyle = T.red; c.lineWidth = 3; c.beginPath(); c.moveTo(w.sx(hs), w.sy(a)); c.lineTo(w.sx(hs), w.sy(b)); c.stroke(); c.restore();
    dot(c, w.sx(0), w.sy(f0), 5, T.accent, T.surface, 1.5);
    dot(c, w.sx(hs), w.sy(a), 4, T.ink);
    label(c, 'касательная', w.pad.l + 8, w.pad.t + 26, { color: T.orange, font: '11px ' + BODY });
  };
  function upd() {
    fm.render(); fs.render();
    const uu = u(), g = F.g(p[0], p[1]), f0 = F.f(p[0], p[1]);
    const hs = Math.pow(10, lh);
    const err = hh => { const hv = [hh * uu[0], hh * uu[1]]; return Math.abs(F.f(p[0] + hv[0], p[1] + hv[1]) - f0 - (g[0] * hv[0] + g[1] * hv[1])); };
    const fx = F.f(p[0] + hs * uu[0], p[1] + hs * uu[1]), pred = f0 + hs * (g[0] * uu[0] + g[1] * uu[1]);
    let h = '<div class="row">x = ' + vec(p, 3) + ', f(x) = ' + num(f0, 4) + ', ∇f(x) = ' + vec(g, 3) + '</div>';
    h += '<div class="row">‖h‖ = ' + num(hs, 4) + ': f(x + h) = ' + num(fx, 6) + ', прогноз f(x) + ⟨∇f, h⟩ = ' + num(pred, 6) + ', ошибка = ' + num(Math.abs(fx - pred), 4) + '</div>';
    h += '<table><tr><th>‖h‖</th><th>ошибка</th><th>ошибка / ‖h‖</th></tr>';
    for (const hh of [1, 0.1, 0.01, 0.001, 0.0001]) { const e = err(hh); h += '<tr><td>' + num(hh, 4) + '</td><td>' + num(e, 4) + '</td><td>' + num(e / hh, 4) + '</td></tr>'; }
    h += '</table>';
    ro.innerHTML = h;
  }
  drag(fm, {
    hit: (px, py, r) => (v && near(px, py, v.sx(p[0]), v.sy(p[1]), r)) ? 'p' : null,
    down: () => 'p',
    move: (id, px, py) => { p = [clamp(v.wx(px), F.xr[0], F.xr[1]), clamp(v.wy(py), F.yr[0], F.yr[1])]; upd(); }
  });
  upd();
};

/* ================= directional derivative ================= */
WIDGETS.dirderiv = (root, wid) => {
  let key = 'cubic', F = F2.cubic, p = F.p0.slice(), th = 53.13, lt = -3;
  const c1 = row(root);
  selectBox(c1, wid, { name: 'fn', label: 'Функция', value: key, options: [['cubic', F2.cubic.name], ['quad', F2.quad.name], ['sincos', F2.sincos.name]], on: k => { key = k; F = F2[k]; p = F.p0.slice(); upd(); } });
  const sT = slider(c1, wid, { name: 'th', label: 'угол d', min: 0, max: 359.9, step: 0.1, value: th, fmt: z => num(z, 1) + '°', on: z => { th = z; upd(); } });
  slider(c1, wid, { name: 't', label: 't в разностной оценке', min: -6, max: 0, step: 0.1, value: lt, fmt: z => num(Math.pow(10, z), 6), on: z => { lt = z; upd(); } });
  const fr = figsRow(root);
  const fm = new Fig(fr, { aspect: 0.8, minH: 250, maxH: 380, label: 'Карта уровней, градиент и направление d' });
  const fc = new Fig(fr, { aspect: 0.8, minH: 250, maxH: 380, label: 'Производная по направлению как функция угла' });
  const ro = readout(root);
  let v = null, w = null;
  const fld = {};
  const d = () => [Math.cos(th * Math.PI / 180), Math.sin(th * Math.PI / 180)];
  const L = 0.8;
  fm.draw = c => {
    v = new View(fm, F.xr, F.yr, { equal: true, pad: { l: 30, b: 20 } });
    drawField(c, v, cachedField(fld, key, v, F.f, {}));
    axes(c, v, { noGrid: true });
    const g = F.g(p[0], p[1]), gn = Math.hypot(g[0], g[1]), dd = d();
    lineWorld(c, v, p, dd, al(T.green, 0.6), 1, [3, 4]);
    if (gn > 1e-9) {
      const tg = [-g[1] / gn, g[0] / gn];
      c.save(); c.strokeStyle = al(T.ink, 0.55); c.lineWidth = 1.4; c.setLineDash([2, 3]); c.beginPath();
      c.moveTo(v.sx(p[0] - 0.6 * tg[0]), v.sy(p[1] - 0.6 * tg[1])); c.lineTo(v.sx(p[0] + 0.6 * tg[0]), v.sy(p[1] + 0.6 * tg[1])); c.stroke(); c.restore();
      arrow(c, v.sx(p[0]), v.sy(p[1]), v.sx(p[0] + L * g[0] / gn), v.sy(p[1] + L * g[1] / gn), T.orange, 2.4);
      label(c, '∇f', v.sx(p[0] + (L + 0.12) * g[0] / gn), v.sy(p[1] + (L + 0.12) * g[1] / gn), { color: T.orange, font: '13px ' + MATHF, bg: T.surface, align: 'center' });
    }
    arrow(c, v.sx(p[0]), v.sy(p[1]), v.sx(p[0] + L * dd[0]), v.sy(p[1] + L * dd[1]), T.green, 2.6);
    dot(c, v.sx(p[0] + L * dd[0]), v.sy(p[1] + L * dd[1]), 5, T.green, T.surface, 1.5);
    label(c, 'd', v.sx(p[0] + (L + 0.13) * dd[0]), v.sy(p[1] + (L + 0.13) * dd[1]), { color: T.green, font: 'italic 13px ' + MATHF, bg: T.surface, align: 'center' });
    dot(c, v.sx(p[0]), v.sy(p[1]), 7, T.accent, T.surface, 2);
  };
  fc.draw = c => {
    const g = F.g(p[0], p[1]), gn = Math.hypot(g[0], g[1]), tg = Math.atan2(g[1], g[0]) * 180 / Math.PI;
    const fn = a => gn * Math.cos((a - tg) * Math.PI / 180);
    const m = Math.max(gn, 0.5) * 1.15;
    w = new View(fc, [0, 360], [-m, m], { pad: { l: 42 } });
    axes(c, w, { xlab: 'угол d, °', ylab: '⟨∇f, d⟩' });
    curve(c, w, fn, { color: T.accent, width: 2.2 });
    const amax = ((tg % 360) + 360) % 360, amin = (amax + 180) % 360;
    star(c, w.sx(amax), w.sy(gn), 7, T.orange);
    label(c, 'max = ‖∇f‖', w.sx(amax), w.sy(gn) + 16, { color: T.orange, align: 'center', font: '11px ' + BODY, bg: T.surface });
    dot(c, w.sx(amin), w.sy(-gn), 4, T.muted);
    dot(c, w.sx(th), w.sy(fn(th)), 7, T.green, T.surface, 2);
  };
  function upd() {
    fm.render(); fc.render();
    const g = F.g(p[0], p[1]), dd = d(), t = Math.pow(10, lt);
    const dir = g[0] * dd[0] + g[1] * dd[1];
    const fd = (F.f(p[0] + t * dd[0], p[1] + t * dd[1]) - F.f(p[0], p[1])) / t;
    const gn = Math.hypot(g[0], g[1]);
    const ang = gn > 1e-12 ? Math.acos(clamp(dir / gn, -1, 1)) * 180 / Math.PI : NaN;
    ro.innerHTML =
      '<div class="row">x = ' + vec(p, 3) + ' &nbsp; ∇f(x) = ' + vec(g, 3) + ' &nbsp; ‖∇f‖ = ' + num(gn, 4) + '</div>' +
      '<div class="row">d = ' + vec(dd, 3) + ' (единичный), угол между d и ∇f = ' + num(ang, 1) + '°</div>' +
      '<div class="row">⟨∇f, d⟩ = ' + num(dir, 5) + ' &nbsp; разность (f(x + td) − f(x))/t при t = ' + num(t, 6) + ': ' + num(fd, 5) + '</div>' +
      '<div class="row">' + (dir > 1e-9 ? pill(true, 'f растёт вдоль d') : dir < -1e-9 ? pill(false, 'f убывает вдоль d') : pill(null, 'вдоль линии уровня')) + '</div>';
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
  drag(fc, { down: () => 'a', move: (id, px) => { if (!w) return; th = clamp(w.wx(px), 0, 359.9); sT.set(th); upd(); } });
  upd();
};

/* ================= Hessian explorer ================= */
WIDGETS.hessian = (root, wid) => {
  let key = 'lect1', F = F2.lect1, p = F.p0.slice(), model = true;
  const c1 = row(root);
  selectBox(c1, wid, { name: 'fn', label: 'Функция', value: key, options: [['lect1', F2.lect1.name], ['rosen', F2.rosen.name], ['hyper', F2.hyper.name], ['saddle5', F2.saddle5.name]], on: k => { key = k; F = F2[k]; p = F.p0.slice(); upd(); } });
  checkbox(c1, wid, { name: 'model', label: 'квадратичная модель', checked: true, on: b => { model = b; upd(); } });
  const fr = figsRow(root);
  const fm = new Fig(fr, { aspect: 0.8, minH: 260, maxH: 400, label: 'Карта уровней и квадратичная модель в выбранной точке' });
  const ro = readout(fr);
  ro.style.alignSelf = 'start';
  let v = null;
  const fld = {};
  fm.draw = c => {
    v = new View(fm, F.xr, F.yr, { equal: true, pad: { l: 30, b: 20 } });
    const main = cachedField(fld, key, v, F.f, {});
    drawField(c, v, main);
    axes(c, v, { noGrid: true });
    const g = F.g(p[0], p[1]), H = F.H(p[0], p[1]), f0 = F.f(p[0], p[1]);
    if (model) {
      const m = (x, y) => { const a = x - p[0], b = y - p[1]; return f0 + g[0] * a + g[1] * b + 0.5 * (H[0][0] * a * a + 2 * H[0][1] * a * b + H[1][1] * b * b); };
      const nx = Math.ceil(v.W / 4), ny = Math.ceil(v.H / 4);
      const Z = new Float64Array((nx + 1) * (ny + 1));
      for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) Z[j * (nx + 1) + i] = m(v.x0 + (v.x1 - v.x0) * i / nx, v.y1 - (v.y1 - v.y0) * j / ny);
      const segs = marching(Z, nx, ny, main.levels, v);
      c.save(); c.beginPath(); c.arc(v.sx(p[0]), v.sy(p[1]), Math.min(v.W, v.H) * 0.32, 0, 2 * Math.PI); c.clip();
      for (const s of segs) drawSegs(c, s, T.orange, 1.6, [5, 3]);
      c.restore();
    }
    const E = eig2(H[0][0], H[0][1], H[1][1]);
    const sc = Math.min(v.W, v.H) * 0.13;
    for (const pair of [[E.l1, E.v1], [E.l2, E.v2]]) {
      const l = pair[0], e = pair[1];
      const len = sc * (0.45 + 0.55 * Math.tanh(Math.abs(l) / 6));
      const col = l > 1e-9 ? T.accent : l < -1e-9 ? T.orange : T.muted;
      c.save(); c.strokeStyle = col; c.lineWidth = 3.2; c.lineCap = 'round'; c.beginPath();
      c.moveTo(v.sx(p[0]) - e[0] * len, v.sy(p[1]) + e[1] * len); c.lineTo(v.sx(p[0]) + e[0] * len, v.sy(p[1]) - e[1] * len); c.stroke(); c.restore();
      label(c, 'λ = ' + num(l, 2), v.sx(p[0]) + e[0] * (len + 6), v.sy(p[1]) - e[1] * (len + 6), { color: col, font: '11px ' + MONO, bg: T.surface, align: e[0] >= 0 ? 'left' : 'right' });
    }
    dot(c, v.sx(p[0]), v.sy(p[1]), 6, T.ink, T.surface, 2);
  };
  function upd() {
    fm.render();
    const g = F.g(p[0], p[1]), H = F.H(p[0], p[1]);
    const E = eig2(H[0][0], H[0][1], H[1][1]);
    const det = H[0][0] * H[1][1] - H[0][1] * H[1][0], tr = H[0][0] + H[1][1];
    const cl = classify(E.l1, E.l2);
    ro.innerHTML =
      '<div class="row">x = ' + vec(p, 3) + '</div>' +
      '<div class="row">∇f(x) = ' + vec(g, 3) + '</div>' +
      '<div class="row">∇²f(x) = ' + mat(H, 3) + '</div>' +
      '<div class="row">det = ' + num(det, 3) + ', tr = ' + num(tr, 3) + '</div>' +
      '<div class="row">λ₁ = ' + num(E.l1, 3) + ', λ₂ = ' + num(E.l2, 3) + '</div>' +
      '<div class="row">гессиан ' + pill(cl.k === 'pd' ? true : cl.k === 'ind' || cl.k === 'nd' ? false : null, cl.t) + '</div>' +
      '<div class="row k-mut">' + (cl.k === 'pd' ? 'здесь функция изогнута вверх во всех направлениях' : cl.k === 'ind' ? 'вверх в одном направлении, вниз в другом' : cl.k === 'nd' ? 'изогнута вниз во всех направлениях' : 'в одном из направлений кривизна нулевая') + '</div>';
  }
  drag(fm, {
    hit: (px, py, r) => (v && near(px, py, v.sx(p[0]), v.sy(p[1]), r)) ? 'p' : null,
    down: () => 'p',
    move: (id, px, py) => { p = [clamp(v.wx(px), F.xr[0], F.xr[1]), clamp(v.wy(py), F.yr[0], F.yr[1])]; upd(); }
  });
  upd();
};

/* ================= stationary & saddle ================= */
WIDGETS.saddle = (root, wid) => {
  let key = 'saddle5', F = F2.saddle5, p = F.p0.slice();
  const c1 = row(root);
  selectBox(c1, wid, { name: 'fn', label: 'Функция', value: key, options: [['saddle5', F2.saddle5.name], ['hyper', F2.hyper.name], ['monkey', F2.monkey.name], ['quartic', F2.quartic.name]], on: k => { key = k; F = F2[k]; p = F.p0.slice(); surf.set(F.f, F.xr, F.yr, { q: F.q }); upd(); } });
  button(c1, 'К ближайшей стационарной точке', () => {
    let best = F.stat[0], bd = Infinity;
    for (const s of F.stat) { const d = Math.hypot(s[0] - p[0], s[1] - p[1]); if (d < bd) { bd = d; best = s; } }
    p = best.slice(); upd();
  });
  const fr = figsRow(root);
  const fm = new Fig(fr, { aspect: 0.85, minH: 250, maxH: 380, label: 'Карта уровней со стационарными точками' });
  const surf = new Surface3D(fr, {});
  const ro = readout(root);
  let v = null;
  const fld = {};
  const kind = s => {
    const H = F.H(s[0], s[1]); const E = eig2(H[0][0], H[0][1], H[1][1]); return classify(E.l1, E.l2).k;
  };
  fm.draw = c => {
    v = new View(fm, F.xr, F.yr, { equal: true, pad: { l: 30, b: 20 } });
    drawField(c, v, cachedField(fld, key, v, F.f, {}));
    axes(c, v, { noGrid: true });
    for (const s of F.stat) {
      const k = kind(s);
      if (k === 'pd') star(c, v.sx(s[0]), v.sy(s[1]), 8, T.green, T.surface);
      else if (k === 'ind') diamond(c, v.sx(s[0]), v.sy(s[1]), 7, T.orange, T.surface);
      else dot(c, v.sx(s[0]), v.sy(s[1]), 6, T.violet, T.surface, 1.5);
    }
    const g = F.g(p[0], p[1]), gn = Math.hypot(g[0], g[1]);
    if (gn > 1e-6) arrow(c, v.sx(p[0]), v.sy(p[1]), v.sx(p[0] - 0.5 * g[0] / gn), v.sy(p[1] - 0.5 * g[1] / gn), T.ink, 2);
    dot(c, v.sx(p[0]), v.sy(p[1]), 7, T.accent, T.surface, 2);
  };
  function upd() {
    fm.render();
    surf.marks = [{ x: p[0], y: p[1], color: T.accent, r: 6 }].concat(F.stat.map(s => ({ x: s[0], y: s[1], color: kind(s) === 'ind' ? T.orange : kind(s) === 'pd' ? T.green : T.violet, r: 4 })));
    surf.fig.render();
    const g = F.g(p[0], p[1]), gn = Math.hypot(g[0], g[1]), H = F.H(p[0], p[1]);
    const E = eig2(H[0][0], H[0][1], H[1][1]);
    const cl = classify(E.l1, E.l2, 1e-6);
    let verdict;
    if (gn > 1e-4) verdict = pill(null, 'не стационарная: ∇f ≠ 0') + ' — стрелка показывает −∇f, сюда спуск';
    else if (cl.k === 'pd') verdict = pill(true, 'стационарная, ∇²f ≻ 0') + ' ⇒ строгий локальный минимум (достаточное условие)';
    else if (cl.k === 'nd') verdict = pill(true, 'стационарная, ∇²f ≺ 0') + ' ⇒ строгий локальный максимум';
    else if (cl.k === 'ind') verdict = pill(false, 'стационарная, ∇²f знаконеопределён') + ' ⇒ седловая точка';
    else verdict = pill(null, 'стационарная, гессиан вырожден') + ' ⇒ тест 2-го порядка не решает. ' + (key === 'monkey' ? 'Здесь это седло: вдоль x функция ведёт себя как x³.' : key === 'quartic' ? 'Здесь это строгий минимум: x⁴ + y⁴ &gt; 0 вне нуля.' : '');
    ro.innerHTML =
      '<div class="row">x = ' + vec(p, 3) + ', f(x) = ' + num(F.f(p[0], p[1]), 4) + '</div>' +
      '<div class="row">∇f = ' + vec(g, 3) + ', ‖∇f‖ = ' + num(gn, 4) + ' &nbsp; ∇²f = ' + mat(H, 3) + ' &nbsp; λ = ' + num(E.l1, 3) + ', ' + num(E.l2, 3) + '</div>' +
      '<div class="row">' + verdict + '</div>' +
      '<div class="row k-mut">на карте: звёзды — минимумы, ромбы — сёдла, фиолетовые — вырожденные стационарные точки</div>';
  }
  drag(fm, {
    hit: (px, py, r) => (v && near(px, py, v.sx(p[0]), v.sy(p[1]), r)) ? 'p' : null,
    down: () => 'p',
    move: (id, px, py) => {
      let q = [clamp(v.wx(px), F.xr[0], F.xr[1]), clamp(v.wy(py), F.yr[0], F.yr[1])];
      for (const s of F.stat) if (Math.hypot(v.sx(s[0]) - px, v.sy(s[1]) - py) < 10) q = s.slice();
      p = q; upd();
    }
  });
  surf.set(F.f, F.xr, F.yr, { q: F.q });
  upd();
};

/* ================= feasible directions ================= */
const SETS9 = {
  box: { name: 'прямоугольник [0, 2] × [0, 1.5]', A: [[-1, 0], [1, 0], [0, -1], [0, 1]], b: [0, 2, 0, 1.5], p0: [2, 1.5] },
  tri: { name: 'треугольник', A: [[-1, 0], [0, -1], [0.75, 1]], b: [0, 0, 1.8], p0: [1.2, 0.9] },
  disk: { name: 'круг', disk: { c: [1.2, 0.9], r: 0.85 }, p0: [2.05, 0.9] }
};
function polyVerts(S) {
  const out = [];
  const m = S.A.length;
  for (let i = 0; i < m; i++) for (let j = i + 1; j < m; j++) {
    const a = S.A[i], b = S.A[j], det = a[0] * b[1] - a[1] * b[0];
    if (Math.abs(det) < 1e-12) continue;
    const x = (S.b[i] * b[1] - a[1] * S.b[j]) / det, y = (a[0] * S.b[j] - S.b[i] * b[0]) / det;
    if (S.A.every((r, k) => r[0] * x + r[1] * y <= S.b[k] + 1e-9)) out.push([x, y]);
  }
  const cx = out.reduce((s, q) => s + q[0], 0) / out.length, cy = out.reduce((s, q) => s + q[1], 0) / out.length;
  out.sort((p, q) => Math.atan2(p[1] - cy, p[0] - cx) - Math.atan2(q[1] - cy, q[0] - cx));
  return out;
}
WIDGETS.feasible = (root, wid) => {
  let key = 'box', S = SETS9.box, x = S.p0.slice(), th = 200, snap = true;
  const c1 = row(root);
  selectBox(c1, wid, { name: 'set', label: 'Множество Ω', value: key, options: Object.keys(SETS9).map(k => [k, SETS9[k].name]), on: k => { key = k; S = SETS9[k]; x = S.p0.slice(); upd(); } });
  const sT = slider(c1, wid, { name: 'th', label: 'угол d', min: 0, max: 359, step: 1, value: th, fmt: z => Math.round(z) + '°', on: z => { th = z; upd(); } });
  checkbox(c1, wid, { name: 'snap', label: 'прилипать к границе', checked: true, on: b => { snap = b; } });
  const fig = new Fig(root, { aspect: 0.6, minH: 250, maxH: 400, label: 'Множество, точка x и допустимые направления' });
  const ro = readout(root);
  let v = null;
  const d = a => [Math.cos(a * Math.PI / 180), Math.sin(a * Math.PI / 180)];
  function t0(p, dd) {
    if (S.disk) {
      const q = [p[0] - S.disk.c[0], p[1] - S.disk.c[1]], r = S.disk.r;
      const pd = q[0] * dd[0] + q[1] * dd[1], qq = q[0] * q[0] + q[1] * q[1];
      if (qq >= r * r - 1e-9 && pd >= -1e-9) return 0;
      return -pd + Math.sqrt(Math.max(0, pd * pd - (qq - r * r)));
    }
    let t = Infinity;
    for (let i = 0; i < S.A.length; i++) {
      const ad = S.A[i][0] * dd[0] + S.A[i][1] * dd[1];
      const slack = S.b[i] - (S.A[i][0] * p[0] + S.A[i][1] * p[1]);
      if (ad > 1e-12) t = Math.min(t, Math.max(0, slack) / ad);
    }
    return t;
  }
  function projectIn(p) {
    if (S.disk) {
      const q = [p[0] - S.disk.c[0], p[1] - S.disk.c[1]], n = Math.hypot(q[0], q[1]);
      return n <= S.disk.r ? p : [S.disk.c[0] + q[0] / n * S.disk.r, S.disk.c[1] + q[1] / n * S.disk.r];
    }
    if (S.A.every((r, k) => r[0] * p[0] + r[1] * p[1] <= S.b[k])) return p;
    const V = polyVerts(S);
    let best = p, bd = Infinity;
    for (let i = 0; i < V.length; i++) { const q = projSeg(p, V[i], V[(i + 1) % V.length]); const dd = Math.hypot(q[0] - p[0], q[1] - p[1]); if (dd < bd) { bd = dd; best = q; } }
    return best;
  }
  function snapB(p, tol) {
    if (S.disk) {
      const q = [p[0] - S.disk.c[0], p[1] - S.disk.c[1]], n = Math.hypot(q[0], q[1]);
      return Math.abs(n - S.disk.r) < tol ? [S.disk.c[0] + q[0] / n * S.disk.r, S.disk.c[1] + q[1] / n * S.disk.r] : p;
    }
    const V = polyVerts(S);
    for (const vv of V) if (Math.hypot(vv[0] - p[0], vv[1] - p[1]) < tol * 1.4) return vv.slice();
    let best = p, bd = Infinity;
    for (let i = 0; i < V.length; i++) { const q = projSeg(p, V[i], V[(i + 1) % V.length]); const dd = Math.hypot(q[0] - p[0], q[1] - p[1]); if (dd < bd) { bd = dd; best = q; } }
    return bd < tol ? best : p;
  }
  const active = p => S.disk ? [] : S.A.map((r, i) => Math.abs(r[0] * p[0] + r[1] * p[1] - S.b[i]) < 1e-9 ? i : -1).filter(i => i >= 0);
  fig.draw = c => {
    v = new View(fig, [-0.6, 2.8], [-0.5, 2.1], { equal: true, pad: { l: 30, b: 20 } });
    axes(c, v, {});
    clipV(c, v);
    c.beginPath();
    if (S.disk) c.arc(v.sx(S.disk.c[0]), v.sy(S.disk.c[1]), S.disk.r * v.k, 0, 2 * Math.PI);
    else polyVerts(S).forEach((q, i) => { if (i) c.lineTo(v.sx(q[0]), v.sy(q[1])); else c.moveTo(v.sx(q[0]), v.sy(q[1])); });
    c.closePath();
    c.fillStyle = al(T.green, 0.12); c.fill(); c.strokeStyle = T.green; c.lineWidth = 2; c.stroke();
    c.restore();
    const px = v.sx(x[0]), py = v.sy(x[1]);
    for (let a = 0; a < 360; a += 2.5) {
      const dd = d(a), ok = t0(x, dd) > 1e-9;
      c.save(); c.strokeStyle = ok ? T.green : T.red; c.globalAlpha = 0.9; c.lineWidth = 3;
      const r1 = 30, r2 = 38;
      c.beginPath(); c.moveTo(px + dd[0] * r1, py - dd[1] * r1); c.lineTo(px + dd[0] * r2, py - dd[1] * r2); c.stroke(); c.restore();
    }
    const dd = d(th), t = t0(x, dd), ok = t > 1e-9;
    if (ok) {
      const tt = Math.min(t, 10);
      c.save(); c.strokeStyle = al(T.green, 0.9); c.lineWidth = 5; c.globalAlpha = 0.45; c.beginPath(); c.moveTo(px, py); c.lineTo(v.sx(x[0] + tt * dd[0]), v.sy(x[1] + tt * dd[1])); c.stroke(); c.restore();
      if (t < 10) dot(c, v.sx(x[0] + t * dd[0]), v.sy(x[1] + t * dd[1]), 4, T.green);
    }
    const L = 0.75;
    arrow(c, px, py, v.sx(x[0] + L * dd[0]), v.sy(x[1] + L * dd[1]), ok ? T.green : T.red, 2.6);
    dot(c, v.sx(x[0] + L * dd[0]), v.sy(x[1] + L * dd[1]), 5, ok ? T.green : T.red, T.surface, 1.5);
    dot(c, px, py, 7, T.accent, T.surface, 2);
  };
  function upd() {
    fig.render();
    const dd = d(th), t = t0(x, dd), ok = t > 1e-9;
    const act = active(x);
    let h = '<div class="row">x = ' + vec(x, 3) + ' &nbsp; d = ' + vec(dd, 3) + '</div>';
    h += '<div class="row">допустимое направление: ' + yes(ok) + (ok ? ' &nbsp; t₀ = sup{t : x + td ∈ Ω} = ' + (t > 1e6 ? '+∞' : num(t, 3)) : ' &nbsp; x + td ∉ Ω при любом t &gt; 0') + '</div>';
    if (S.disk) {
      const q = [x[0] - S.disk.c[0], x[1] - S.disk.c[1]], onB = Math.abs(Math.hypot(q[0], q[1]) - S.disk.r) < 1e-6;
      h += '<div class="row k-mut">' + (onB ? 'x на окружности: допустимы только направления строго внутрь, ⟨x − c, d⟩ &lt; 0; касательная недопустима' : 'x внутри круга: допустимы все направления') + '</div>';
    } else {
      h += '<div class="row">активные ограничения: ' + (act.length ? act.map(i => 'a = ' + vec(S.A[i], 2) + ', aᵀd = ' + num(S.A[i][0] * dd[0] + S.A[i][1] * dd[1], 3) + (S.A[i][0] * dd[0] + S.A[i][1] * dd[1] <= 1e-12 ? ' ≤ 0 ✓' : ' &gt; 0 ✗')).join('; ') : 'нет (внутренняя точка — допустимо всё)') + '</div>';
    }
    ro.innerHTML = h;
  }
  const L = 0.75;
  drag(fig, {
    hit: (px, py, r) => {
      if (!v) return null;
      const dd = d(th);
      if (near(px, py, v.sx(x[0] + L * dd[0]), v.sy(x[1] + L * dd[1]), r)) return 'd';
      if (near(px, py, v.sx(x[0]), v.sy(x[1]), r)) return 'x';
      return null;
    },
    down: () => 'x',
    move: (id, px, py) => {
      const q = [v.wx(px), v.wy(py)];
      if (id === 'd') { th = ((Math.atan2(q[1] - x[1], q[0] - x[0]) * 180 / Math.PI) + 360) % 360; sT.set(th); }
      else { let p = projectIn(q); if (snap) p = snapB(p, 12 / v.k); x = p; }
      upd();
    }
  });
  upd();
};

/* ================= quadratic form PD / PSD ================= */
WIDGETS.quadform = (root, wid) => {
  let a = 2, b = -1, c = 2;
  const c1 = row(root);
  const sa = slider(c1, wid, { name: 'a', label: 'a', min: -3, max: 3, step: 0.1, value: a, on: z => { a = z; upd(); } });
  const sb = slider(c1, wid, { name: 'b', label: 'b', min: -3, max: 3, step: 0.1, value: b, on: z => { b = z; upd(); } });
  const sc = slider(c1, wid, { name: 'c', label: 'c', min: -3, max: 3, step: 0.1, value: c, on: z => { c = z; upd(); } });
  const c2 = row(root);
  const preset = (A, B, C) => () => { a = A; b = B; c = C; sa.set(a); sb.set(b); sc.set(c); upd(); };
  button(c2, '≻ 0: [[2, −1], [−1, 2]]', preset(2, -1, 2));
  button(c2, 'седло: [[1, 2], [2, 1]]', preset(1, 2, 1));
  button(c2, '⪰ 0: [[1, 1], [1, 1]]', preset(1, 1, 1));
  button(c2, 'ловушка: [[0, 0], [0, −1]]', preset(0, 0, -1));
  const fr = figsRow(root);
  const fm = new Fig(fr, { aspect: 0.85, minH: 250, maxH: 380, label: 'Знак квадратичной формы на плоскости' });
  const surf = new Surface3D(fr, {});
  const ro = readout(root);
  const fld = {};
  const q = (x, y) => a * x * x + 2 * b * x * y + c * y * y;
  fm.draw = ctx => {
    const v = new View(fm, [-2, 2], [-2, 2], { equal: true, pad: { l: 30, b: 20 } });
    drawField(ctx, v, cachedField(fld, a + ',' + b + ',' + c, v, q, { diverging: true }), { zeroBold: true });
    axes(ctx, v, { noGrid: true });
    const E = eig2(a, b, c);
    for (const pair of [[E.l1, E.v1], [E.l2, E.v2]]) {
      const l = pair[0], e = pair[1], len = 0.35 + 0.35 * Math.tanh(Math.abs(l) / 2);
      const col = l > 1e-9 ? T.accent : l < -1e-9 ? T.orange : T.muted;
      arrow(ctx, v.sx(0), v.sy(0), v.sx(e[0] * len * 2), v.sy(e[1] * len * 2), col, 2.6);
      label(ctx, 'λ = ' + num(l, 2), v.sx(e[0] * (len * 2 + 0.15)), v.sy(e[1] * (len * 2 + 0.15)), { color: col, font: '11px ' + MONO, bg: T.surface, align: 'center' });
    }
  };
  function upd() {
    fm.render();
    surf.set(q, [-2, 2], [-2, 2], { sym: true });
    const E = eig2(a, b, c), cl = classify(E.l1, E.l2);
    const d2 = a * c - b * b;
    const okS = a > 0 && d2 > 0;
    const term = (k, s, first) => { if (Math.abs(k) < 1e-12) return ''; const sg = k < 0 ? (first ? '−' : ' − ') : (first ? '' : ' + '); const m = Math.abs(k); return sg + (Math.abs(m - 1) < 1e-12 ? '' : num(m, 1)) + s; };
    let form = term(a, 'x²', true); form += term(2 * b, 'xy', !form); form += term(c, 'y²', !form); if (!form) form = '0';
    let h = '<div class="row">A = [[' + num(a, 1) + ', ' + num(b, 1) + '], [' + num(b, 1) + ', ' + num(c, 1) + ']] &nbsp; xᵀAx = ' + form + '</div>';
    h += '<div class="row">собственные значения: λ₁ = ' + num(E.l1, 3) + ', λ₂ = ' + num(E.l2, 3) + ' ⇒ ' + pill(cl.k === 'pd' ? true : cl.k === 'psd' ? null : false, cl.t) + '</div>';
    h += '<div class="row">Сильвестр (ведущие миноры): Δ₁ = a = ' + num(a, 2) + ', Δ₂ = ac − b² = ' + num(d2, 2) + ' ⇒ ' + (okS ? 'оба &gt; 0 ⇒ A ≻ 0' : 'не все &gt; 0 ⇒ A не ≻ 0') + '</div>';
    h += '<div class="row">все главные миноры: a = ' + num(a, 2) + ', c = ' + num(c, 2) + ', det = ' + num(d2, 2) + ' ⇒ ' + (a >= -1e-12 && c >= -1e-12 && d2 >= -1e-12 ? 'все ≥ 0 ⇒ A ⪰ 0' : 'есть отрицательный ⇒ A не ⪰ 0') + '</div>';
    if (E.l1 < -1e-9) h += '<div class="row k-mut">контрпример: x = v₁ = ' + vec(E.v1, 3) + ' даёт xᵀAx = λ₁ = ' + num(E.l1, 3) + ' &lt; 0</div>';
    if (a === 0 && b === 0 && c < 0) h += '<div class="row k-warn">ловушка: ведущие миноры 0 и 0 (≥ 0), но матрица не ⪰ 0 — главный минор c &lt; 0</div>';
    ro.innerHTML = h;
  }
  upd();
};
