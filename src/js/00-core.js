const BODY = '"Golos Text", system-ui, sans-serif';
const MONO = '"JetBrains Mono", ui-monospace, monospace';
const MATHF = '"STIX Two Text", "Cambria Math", serif';
const RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- theme tokens ---------------- */
let T = {};
let themeVer = 0;
function hexRgb(s) {
  s = (s || '#000000').trim().replace('#', '');
  if (s.length === 3) s = s.split('').map(ch => ch + ch).join('');
  const n = parseInt(s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function readTokens() {
  const cs = getComputedStyle(document.documentElement);
  const g = name => cs.getPropertyValue(name).trim();
  T = {
    paper: g('--paper'), surface: g('--surface'), inset: g('--inset'), ink: g('--ink'), muted: g('--muted'),
    rule: g('--rule'), grid: g('--grid'), accent: g('--accent'), orange: g('--c-orange'), green: g('--c-green'),
    red: g('--c-red'), violet: g('--c-violet'),
    heatLo: hexRgb(g('--heat-lo')), heatHi: hexRgb(g('--heat-hi')), divNeg: hexRgb(g('--div-neg'))
  };
  themeVer++;
}
readTokens();
function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
function al(hex, a) { const c = hexRgb(hex); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ---------------- numbers ---------------- */
const SUP = {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','-':'⁻'};
function supInt(k) { return String(k).split('').map(ch => SUP[ch] || ch).join(''); }
function num(v, d) {
  if (d === undefined) d = 3;
  if (v === Infinity) return '+∞';
  if (v === -Infinity) return '−∞';
  if (typeof v !== 'number' || isNaN(v)) return '—';
  const a = Math.abs(v);
  if (a === 0) return '0';
  if (a < 1e-3 || a >= 1e5) {
    let e = Math.floor(Math.log10(a));
    let m = v / Math.pow(10, e);
    if (Math.abs(m) >= 9.995) { m /= 10; e += 1; }
    return (m.toFixed(2) + '·10' + supInt(e)).replace('-', '−');
  }
  let s = String(+v.toFixed(d));
  if (s === '-0') s = '0';
  return s.replace('-', '−');
}
const vec = (p, d) => '(' + num(p[0], d) + ', ' + num(p[1], d) + ')';
const mat = (H, d) => '[[' + num(H[0][0], d) + ', ' + num(H[0][1], d) + '], [' + num(H[1][0], d) + ', ' + num(H[1][1], d) + ']]';
const pill = (ok, txt) => '<span class="pill ' + (ok === true ? 'ok' : ok === false ? 'bad' : 'warn') + '">' + txt + '</span>';
const yes = (b, y, n) => pill(b, b ? (y || 'да') : (n || 'нет'));

/* ---------------- figures ---------------- */
const FIGS = [];
class Fig {
  constructor(parent, o) {
    o = o || {};
    this.o = { aspect: o.aspect || 0.6, minH: o.minH || 200, maxH: o.maxH || 420 };
    this.wrap = document.createElement('div');
    this.wrap.className = 'fig' + (o.scroll ? ' scroll' : '');
    this.cv = document.createElement('canvas');
    if (o.label) { this.cv.setAttribute('role', 'img'); this.cv.setAttribute('aria-label', o.label); }
    this.wrap.appendChild(this.cv);
    parent.appendChild(this.wrap);
    this.ctx = this.cv.getContext('2d');
    this.draw = null;
    this.w = 0; this.h = 0; this.dpr = 1;
    FIGS.push(this);
    const ro = new ResizeObserver(() => this.resize());
    ro.observe(this.wrap);
  }
  resize() {
    const w = Math.floor(this.wrap.clientWidth);
    if (w < 10) return;
    const h = Math.round(Math.max(this.o.minH, Math.min(this.o.maxH, w * this.o.aspect)));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (w === this.w && h === this.h && dpr === this.dpr) return;
    this.w = w; this.h = h; this.dpr = dpr;
    this.cv.width = Math.round(w * dpr);
    this.cv.height = Math.round(h * dpr);
    this.cv.style.height = h + 'px';
    this.render();
  }
  render() {
    if (!this.w || !this.draw) return;
    const c = this.ctx;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, this.w, this.h);
    c.fillStyle = T.surface;
    c.fillRect(0, 0, this.w, this.h);
    this.draw(c, this.w, this.h);
  }
  pos(e) { const r = this.cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
}

class View {
  constructor(fig, xr, yr, o) {
    o = o || {};
    this.fig = fig; this.xr = xr; this.yr = yr; this.equal = !!o.equal;
    this.pad = Object.assign({ l: 38, r: 10, t: 10, b: 22 }, o.pad || {});
    this.fit();
  }
  fit() {
    const f = this.fig;
    let x0 = this.xr[0], x1 = this.xr[1], y0 = this.yr[0], y1 = this.yr[1];
    const W = Math.max(10, f.w - this.pad.l - this.pad.r), H = Math.max(10, f.h - this.pad.t - this.pad.b);
    if (this.equal) {
      const sx = W / (x1 - x0), sy = H / (y1 - y0);
      if (sx > sy) { const cx = (x0 + x1) / 2, half = W / sy / 2; x0 = cx - half; x1 = cx + half; }
      else { const cy = (y0 + y1) / 2, half = H / sx / 2; y0 = cy - half; y1 = cy + half; }
    }
    this.x0 = x0; this.x1 = x1; this.y0 = y0; this.y1 = y1; this.W = W; this.H = H;
    this.k = W / (x1 - x0);
  }
  sx(x) { return this.pad.l + (x - this.x0) / (this.x1 - this.x0) * this.W; }
  sy(y) { return this.pad.t + (1 - (y - this.y0) / (this.y1 - this.y0)) * this.H; }
  wx(px) { return this.x0 + (px - this.pad.l) / this.W * (this.x1 - this.x0); }
  wy(py) { return this.y0 + (1 - (py - this.pad.t) / this.H) * (this.y1 - this.y0); }
  inside(px, py) { return px >= this.pad.l && px <= this.pad.l + this.W && py >= this.pad.t && py <= this.pad.t + this.H; }
}

function niceStep(range, target) {
  const raw = range / Math.max(1, target);
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p;
}
function tickLbl(x, step) {
  const dec = Math.max(0, -Math.floor(Math.log10(step) + 1e-9));
  let s = x.toFixed(Math.min(4, dec));
  if (/^-0(\.0+)?$/.test(s)) s = s.slice(1);
  return s.replace('-', '−');
}
function axes(c, v, o) {
  o = o || {};
  c.save();
  c.font = '10.5px ' + MONO;
  c.lineWidth = 1;
  const sxs = niceStep(v.x1 - v.x0, v.W / 70);
  let sys = niceStep(v.y1 - v.y0, v.H / 42);
  if (o.ylog) sys = Math.max(1, Math.round(sys));
  const kx0 = Math.ceil(v.x0 / sxs - 1e-9), kx1 = Math.floor(v.x1 / sxs + 1e-9);
  const ky0 = Math.ceil(v.y0 / sys - 1e-9), ky1 = Math.floor(v.y1 / sys + 1e-9);
  if (!o.noGrid) {
    c.strokeStyle = T.grid;
    c.beginPath();
    for (let k = kx0; k <= kx1; k++) { const px = Math.round(v.sx(k * sxs)) + 0.5; c.moveTo(px, v.pad.t); c.lineTo(px, v.pad.t + v.H); }
    for (let k = ky0; k <= ky1; k++) { const py = Math.round(v.sy(k * sys)) + 0.5; c.moveTo(v.pad.l, py); c.lineTo(v.pad.l + v.W, py); }
    c.stroke();
  }
  if (!o.noZero) {
    c.strokeStyle = al(T.muted, 0.5);
    c.beginPath();
    if (v.y0 < 0 && v.y1 > 0 && !o.ylog) { const py = Math.round(v.sy(0)) + 0.5; c.moveTo(v.pad.l, py); c.lineTo(v.pad.l + v.W, py); }
    if (v.x0 < 0 && v.x1 > 0) { const px = Math.round(v.sx(0)) + 0.5; c.moveTo(px, v.pad.t); c.lineTo(px, v.pad.t + v.H); }
    c.stroke();
  }
  c.fillStyle = T.muted;
  c.textAlign = 'center'; c.textBaseline = 'top';
  for (let k = kx0; k <= kx1; k++) c.fillText(tickLbl(k * sxs, sxs), v.sx(k * sxs), v.pad.t + v.H + 5);
  c.textAlign = 'right'; c.textBaseline = 'middle';
  for (let k = ky0; k <= ky1; k++) {
    const y = k * sys;
    c.fillText(o.ylog ? '10' + supInt(Math.round(y)) : tickLbl(y, sys), v.pad.l - 5, v.sy(y));
  }
  c.font = 'italic 13px ' + MATHF;
  if (o.xlab) { c.textAlign = 'right'; c.textBaseline = 'bottom'; c.fillText(o.xlab, v.pad.l + v.W - 5, v.pad.t + v.H - 4); }
  if (o.ylab) { c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText(o.ylab, v.pad.l + 5, v.pad.t + 4); }
  c.strokeStyle = T.rule;
  c.strokeRect(v.pad.l + 0.5, v.pad.t + 0.5, v.W - 1, v.H - 1);
  c.restore();
}
function clipV(c, v) { c.save(); c.beginPath(); c.rect(v.pad.l, v.pad.t, v.W, v.H); c.clip(); }
function curve(c, v, f, o) {
  o = o || {};
  const x0 = o.x0 !== undefined ? Math.max(o.x0, v.x0) : v.x0;
  const x1 = o.x1 !== undefined ? Math.min(o.x1, v.x1) : v.x1;
  if (!(x1 > x0)) return;
  const n = o.n || Math.max(160, Math.round(v.W * (x1 - x0) / (v.x1 - v.x0)));
  const span = v.y1 - v.y0, lo = v.y0 - 3 * span, hi = v.y1 + 3 * span;
  clipV(c, v);
  c.strokeStyle = o.color || T.ink;
  c.lineWidth = o.width || 2;
  c.lineJoin = 'round'; c.lineCap = 'round';
  if (o.dash) c.setLineDash(o.dash);
  c.beginPath();
  let pen = false;
  for (let i = 0; i <= n; i++) {
    const x = x0 + (x1 - x0) * i / n;
    let y = f(x);
    if (typeof y !== 'number' || isNaN(y)) { pen = false; continue; }
    y = Math.max(lo, Math.min(hi, y));
    const px = v.sx(x), py = v.sy(y);
    if (pen) c.lineTo(px, py); else { c.moveTo(px, py); pen = true; }
  }
  c.stroke();
  c.restore();
}
function fillBetween(c, v, f, g, color, o) {
  o = o || {};
  const x0 = Math.max(o.x0 !== undefined ? o.x0 : v.x0, v.x0), x1 = Math.min(o.x1 !== undefined ? o.x1 : v.x1, v.x1);
  if (!(x1 > x0)) return;
  const n = Math.max(120, Math.round(v.W * (x1 - x0) / (v.x1 - v.x0) / 2));
  const span = v.y1 - v.y0, lo = v.y0 - 3 * span, hi = v.y1 + 3 * span;
  clipV(c, v);
  c.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const xa = x0 + (x1 - x0) * i / n, xb = x0 + (x1 - x0) * (i + 1) / n, xm = (xa + xb) / 2;
    if (o.when && !o.when(xm)) continue;
    const a = clamp(f(xm), lo, hi), b = clamp(g(xm), lo, hi);
    if (isNaN(a) || isNaN(b)) continue;
    const top = Math.min(v.sy(a), v.sy(b)), bot = Math.max(v.sy(a), v.sy(b));
    c.fillRect(v.sx(xa), top, v.sx(xb) - v.sx(xa) + 0.6, bot - top);
  }
  c.restore();
}
function dot(c, px, py, r, fill, stroke, lw) {
  c.beginPath();
  c.arc(px, py, r, 0, 2 * Math.PI);
  if (fill) { c.fillStyle = fill; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = lw || 2; c.stroke(); }
}
function diamond(c, px, py, r, fill, stroke) {
  c.beginPath(); c.moveTo(px, py - r); c.lineTo(px + r, py); c.lineTo(px, py + r); c.lineTo(px - r, py); c.closePath();
  c.fillStyle = fill; c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.6; c.stroke(); }
}
function star(c, px, py, r, fill, stroke) {
  c.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const rr = i % 2 ? r * 0.45 : r; c.lineTo(px + rr * Math.cos(a), py + rr * Math.sin(a)); }
  c.closePath(); c.fillStyle = fill; c.fill();
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1.4; c.stroke(); }
}
function arrow(c, x1, y1, x2, y2, color, lw, head, dash) {
  lw = lw || 2; head = head || 9;
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
  if (L < 2) return;
  const ux = dx / L, uy = dy / L;
  const hl = Math.min(head, L * 0.6);
  const hx = x2 - ux * hl, hy = y2 - uy * hl;
  c.save();
  c.strokeStyle = color; c.fillStyle = color; c.lineWidth = lw; c.lineCap = 'round';
  if (dash) c.setLineDash(dash);
  c.beginPath(); c.moveTo(x1, y1); c.lineTo(hx, hy); c.stroke();
  c.setLineDash([]);
  c.beginPath(); c.moveTo(x2, y2); c.lineTo(hx - uy * hl * 0.5, hy + ux * hl * 0.5); c.lineTo(hx + uy * hl * 0.5, hy - ux * hl * 0.5); c.closePath(); c.fill();
  c.restore();
}
function roundRect(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
function label(c, s, px, py, o) {
  o = o || {};
  c.save();
  c.font = o.font || ('12px ' + BODY);
  c.textAlign = o.align || 'left';
  c.textBaseline = 'middle';
  if (o.bg) {
    const w = c.measureText(s).width + 8, h = 18;
    const bx = o.align === 'center' ? px - w / 2 : o.align === 'right' ? px - w + 4 : px - 4;
    c.globalAlpha = 0.86; c.fillStyle = o.bg; roundRect(c, bx, py - h / 2, w, h, 4); c.fill(); c.globalAlpha = 1;
  }
  c.fillStyle = o.color || T.ink;
  c.fillText(s, px, py);
  c.restore();
}
function lineWorld(c, v, p, d, color, lw, dash) {
  const big = 4 * Math.max(v.x1 - v.x0, v.y1 - v.y0);
  clipV(c, v);
  c.strokeStyle = color; c.lineWidth = lw || 1; if (dash) c.setLineDash(dash);
  c.beginPath(); c.moveTo(v.sx(p[0] - d[0] * big), v.sy(p[1] - d[1] * big)); c.lineTo(v.sx(p[0] + d[0] * big), v.sy(p[1] + d[1] * big)); c.stroke();
  c.restore();
}
function yRange(fs, x0, x1, o) {
  o = o || {};
  let lo = Infinity, hi = -Infinity;
  const n = 400;
  for (const f of fs) for (let i = 0; i <= n; i++) {
    const y = f(x0 + (x1 - x0) * i / n);
    if (isFinite(y)) { if (y < lo) lo = y; if (y > hi) hi = y; }
  }
  if (o.capHi !== undefined) hi = Math.min(hi, o.capHi);
  if (o.capLo !== undefined) lo = Math.max(lo, o.capLo);
  if (o.incl !== undefined) { lo = Math.min(lo, o.incl); hi = Math.max(hi, o.incl); }
  if (!(hi > lo)) { hi = lo + 1; }
  const pad = (hi - lo) * (o.pad === undefined ? 0.08 : o.pad);
  return [lo - pad, hi + pad];
}

/* ---------------- 2D scalar fields: heat + contours ---------------- */
function computeField(v, f, o) {
  o = o || {};
  const res = o.res || 3;
  const nx = Math.max(4, Math.ceil(v.W / res)), ny = Math.max(4, Math.ceil(v.H / res));
  const Z = new Float64Array((nx + 1) * (ny + 1));
  const fin = [];
  for (let j = 0; j <= ny; j++) {
    const y = v.y1 - (v.y1 - v.y0) * j / ny;
    for (let i = 0; i <= nx; i++) {
      const x = v.x0 + (v.x1 - v.x0) * i / nx;
      let z = f(x, y);
      if (typeof z !== 'number' || !isFinite(z)) z = NaN; else fin.push(z);
      Z[j * (nx + 1) + i] = z;
    }
  }
  fin.sort((a, b) => a - b);
  const n = fin.length;
  const rank = z => { let lo = 0, hi = n; while (lo < hi) { const m = (lo + hi) >> 1; if (fin[m] < z) lo = m + 1; else hi = m; } return lo / Math.max(1, n); };
  let amax = 0;
  if (o.diverging) for (let k = 0; k < n; k++) amax = Math.max(amax, Math.abs(fin[k]));
  const off = document.createElement('canvas');
  off.width = nx + 1; off.height = ny + 1;
  const octx = off.getContext('2d');
  const img = octx.createImageData(nx + 1, ny + 1);
  for (let k = 0; k < Z.length; k++) {
    const z = Z[k];
    let col;
    if (isNaN(z)) col = T.heatLo;
    else if (o.diverging) { const t = amax > 0 ? z / amax : 0; col = t >= 0 ? mix(T.heatLo, T.heatHi, Math.pow(t, 0.7) * 0.85) : mix(T.heatLo, T.divNeg, Math.pow(-t, 0.7) * 0.85); }
    else { const t = rank(z); col = mix(T.heatLo, T.heatHi, Math.pow(t, 1.1) * 0.78); }
    img.data[4 * k] = col[0]; img.data[4 * k + 1] = col[1]; img.data[4 * k + 2] = col[2]; img.data[4 * k + 3] = 255;
  }
  octx.putImageData(img, 0, 0);
  let levels = [];
  if (o.levels) levels = o.levels.slice();
  else if (o.diverging) { const m = 5; for (let i = -m; i <= m; i++) levels.push(i / m * amax * 0.92); }
  else if (n) {
    const m = o.nLev || 13;
    for (let i = 1; i <= m; i++) { const q = Math.pow(i / (m + 1), o.qpow || 1.7); levels.push(fin[Math.min(n - 1, Math.floor(q * n))]); }
    levels = levels.filter((L, i) => i === 0 || L > levels[i - 1] + 1e-12);
  }
  return { img: off, segs: marching(Z, nx, ny, levels, v), levels, Z, nx, ny, fin };
}
function marching(Z, nx, ny, levels, v) {
  const out = [];
  const px = i => v.pad.l + v.W * i / nx, py = j => v.pad.t + v.H * j / ny;
  for (let li = 0; li < levels.length; li++) {
    const L = levels[li];
    const s = [];
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const a = Z[j * (nx + 1) + i], b = Z[j * (nx + 1) + i + 1], cc = Z[(j + 1) * (nx + 1) + i + 1], d = Z[(j + 1) * (nx + 1) + i];
      if (isNaN(a) || isNaN(b) || isNaN(cc) || isNaN(d)) continue;
      const pts = [];
      if ((a < L) !== (b < L)) pts.push(px(i + (L - a) / (b - a)), py(j));
      if ((b < L) !== (cc < L)) pts.push(px(i + 1), py(j + (L - b) / (cc - b)));
      if ((d < L) !== (cc < L)) pts.push(px(i + (L - d) / (cc - d)), py(j + 1));
      if ((a < L) !== (d < L)) pts.push(px(i), py(j + (L - a) / (d - a)));
      if (pts.length === 4 || pts.length === 8) for (let q = 0; q < pts.length; q++) s.push(pts[q]);
    }
    out.push(s);
  }
  return out;
}
function drawSegs(c, segs, color, lw, dash) {
  c.strokeStyle = color; c.lineWidth = lw || 1; if (dash) c.setLineDash(dash); else c.setLineDash([]);
  c.beginPath();
  for (let k = 0; k < segs.length; k += 4) { c.moveTo(segs[k], segs[k + 1]); c.lineTo(segs[k + 2], segs[k + 3]); }
  c.stroke();
}
function drawField(c, v, fld, o) {
  o = o || {};
  c.save();
  c.imageSmoothingEnabled = true;
  c.drawImage(fld.img, v.pad.l, v.pad.t, v.W, v.H);
  for (let li = 0; li < fld.segs.length; li++) {
    const zero = o.zeroBold && Math.abs(fld.levels[li]) < 1e-12;
    drawSegs(c, fld.segs[li], zero ? al(T.ink, 0.75) : al(T.accent, o.contourAlpha || 0.42), zero ? 1.8 : 1);
  }
  c.restore();
}
function cachedField(owner, key, v, f, o) {
  const k = key + '|' + v.W + 'x' + v.H + '|' + themeVer + '|' + v.x0.toFixed(5) + ',' + v.x1.toFixed(5) + ',' + v.y0.toFixed(5) + ',' + v.y1.toFixed(5);
  if (owner._fk !== k) { owner._fld = computeField(v, f, o); owner._fk = k; }
  return owner._fld;
}

/* ---------------- interaction & controls ---------------- */
function drag(fig, o) {
  const cv = fig.cv;
  let act = null;
  cv.addEventListener('pointerdown', e => {
    const p = fig.pos(e);
    const r = e.pointerType === 'touch' ? 22 : 14;
    let id = o.hit ? o.hit(p[0], p[1], r) : null;
    if (id == null && o.down) id = o.down(p[0], p[1]);
    if (id != null) {
      act = id;
      try { cv.setPointerCapture(e.pointerId); } catch (_) {}
      if (o.move) o.move(act, p[0], p[1]);
      e.preventDefault();
    }
  });
  cv.addEventListener('pointermove', e => {
    const p = fig.pos(e);
    if (act != null) { o.move(act, p[0], p[1]); }
    else if (e.pointerType === 'mouse') { cv.style.cursor = (o.hit && o.hit(p[0], p[1], 14) != null) ? 'grab' : (o.down ? 'crosshair' : 'default'); }
  });
  const end = () => { if (act != null) { act = null; if (o.up) o.up(); } };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);
}
const near = (px, py, qx, qy, r) => Math.hypot(px - qx, py - qy) <= r;
function row(parent) { const d = document.createElement('div'); d.className = 'ctl'; parent.appendChild(d); return d; }
function figsRow(parent) { const d = document.createElement('div'); d.className = 'figs'; parent.appendChild(d); return d; }
function readout(parent) { const d = document.createElement('div'); d.className = 'readout'; parent.appendChild(d); return d; }
function slider(parent, wid, o) {
  const id = wid + '-' + o.name;
  const wrap = document.createElement('div'); wrap.className = 'sl';
  const head = document.createElement('div'); head.className = 'sl-head';
  const lab = document.createElement('label'); lab.htmlFor = id; lab.innerHTML = o.label;
  const out = document.createElement('output'); out.className = 'sl-out'; out.htmlFor = id;
  head.append(lab, out);
  const inp = document.createElement('input');
  inp.type = 'range'; inp.id = id; inp.min = o.min; inp.max = o.max; inp.step = o.step; inp.value = o.value;
  wrap.append(head, inp);
  parent.appendChild(wrap);
  const fmt = o.fmt || (x => num(x, 2));
  const api = {
    inp,
    get v() { return +inp.value; },
    set(x) { inp.value = x; out.textContent = fmt(+inp.value); },
    range(mn, mx) { inp.min = mn; inp.max = mx; out.textContent = fmt(+inp.value); }
  };
  out.textContent = fmt(+inp.value);
  inp.addEventListener('input', () => { out.textContent = fmt(+inp.value); if (o.on) o.on(+inp.value); });
  return api;
}
function selectBox(parent, wid, o) {
  const id = wid + '-' + o.name;
  const lab = document.createElement('label'); lab.className = 'sel'; lab.htmlFor = id;
  lab.appendChild(document.createTextNode(o.label));
  const s = document.createElement('select'); s.id = id;
  for (const op of o.options) { const e = document.createElement('option'); e.value = op[0]; e.textContent = op[1]; s.appendChild(e); }
  s.value = o.value;
  lab.appendChild(s);
  parent.appendChild(lab);
  s.addEventListener('change', () => { if (o.on) o.on(s.value); });
  return s;
}
function button(parent, text, on, cls) {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'btn' + (cls ? ' ' + cls : '');
  b.textContent = text; b.addEventListener('click', on); parent.appendChild(b); return b;
}
function checkbox(parent, wid, o) {
  const id = wid + '-' + o.name;
  const lab = document.createElement('label'); lab.className = 'chk';
  const inp = document.createElement('input'); inp.type = 'checkbox'; inp.id = id; inp.checked = !!o.checked;
  lab.append(inp, document.createTextNode(o.label));
  parent.appendChild(lab);
  inp.addEventListener('change', () => { if (o.on) o.on(inp.checked); });
  return inp;
}
function animator(step, done, onStop, rate) {
  let timer = null;
  const api = {
    running() { return timer != null; },
    start() {
      if (timer) return;
      const tick = () => { if (done()) { api.stop(); return; } step(); timer = setTimeout(tick, typeof rate === 'function' ? rate() : (rate || 120)); };
      timer = setTimeout(tick, 0);
    },
    stop() { if (timer) { clearTimeout(timer); timer = null; } if (onStop) onStop(); }
  };
  return api;
}

/* ---------------- linear algebra ---------------- */
function eig2(a, b, c) {
  const m = (a + c) / 2, d = Math.sqrt(((a - c) / 2) * ((a - c) / 2) + b * b);
  const l1 = m - d, l2 = m + d;
  const ev = l => {
    let x, y;
    if (Math.abs(b) > 1e-12) { x = l - c; y = b; }
    else if (Math.abs(a - l) <= Math.abs(c - l)) { x = 1; y = 0; } else { x = 0; y = 1; }
    const nn = Math.hypot(x, y) || 1;
    return [x / nn, y / nn];
  };
  const v1 = ev(l1);
  return { l1, l2, v1, v2: [-v1[1], v1[0]] };
}
function classify(l1, l2, tol) {
  tol = tol || 1e-9;
  if (l1 > tol) return { k: 'pd', t: '≻ 0 — положительно определена' };
  if (l2 < -tol) return { k: 'nd', t: '≺ 0 — отрицательно определена' };
  if (l1 < -tol && l2 > tol) return { k: 'ind', t: 'знаконеопределена' };
  if (l2 > tol) return { k: 'psd', t: '⪰ 0, вырождена (полуопределена)' };
  if (l1 < -tol) return { k: 'nsd', t: '⪯ 0, вырождена' };
  return { k: 'zero', t: 'нулевая' };
}

/* ---------------- function libraries ---------------- */
const F2 = {
  lect1: { name: '3x₁² + 2x₁x₂² + 4x₂² (лекция 1)', f: (x, y) => 3 * x * x + 2 * x * y * y + 4 * y * y, g: (x, y) => [6 * x + 2 * y * y, 4 * x * y + 8 * y], H: (x, y) => [[6, 4 * y], [4 * y, 4 * x + 8]], xr: [-2.4, 2.4], yr: [-1.9, 1.9], p0: [1, 1] },
  quad: { name: 'x² + 3y² + xy', f: (x, y) => x * x + 3 * y * y + x * y, g: (x, y) => [2 * x + y, 6 * y + x], H: () => [[2, 1], [1, 6]], xr: [-2.4, 2.4], yr: [-1.7, 1.7], p0: [1.2, 0.8] },
  cubic: { name: 'x²y + y³', f: (x, y) => x * x * y + y * y * y, g: (x, y) => [2 * x * y, x * x + 3 * y * y], H: (x, y) => [[2 * y, 2 * x], [2 * x, 6 * y]], xr: [-1.8, 2.6], yr: [-0.6, 2.8], p0: [1, 2] },
  saddle5: { name: '½x² − y² + ¼y⁴ (лекция 5)', f: (x, y) => 0.5 * x * x - y * y + 0.25 * y * y * y * y, g: (x, y) => [x, -2 * y + y * y * y], H: (x, y) => [[1, 0], [0, -2 + 3 * y * y]], xr: [-2, 2], yr: [-2.1, 2.1], p0: [0.6, 0.5], stat: [[0, 0], [0, Math.SQRT2], [0, -Math.SQRT2]], q: [0, 0.9] },
  hyper: { name: 'x² − y²', f: (x, y) => x * x - y * y, g: (x, y) => [2 * x, -2 * y], H: () => [[2, 0], [0, -2]], xr: [-2, 2], yr: [-2, 2], p0: [0.8, 0.6], stat: [[0, 0]], q: [0, 1] },
  monkey: { name: 'x³ − 3xy² (обезьянье седло)', f: (x, y) => x * x * x - 3 * x * y * y, g: (x, y) => [3 * x * x - 3 * y * y, -6 * x * y], H: (x, y) => [[6 * x, -6 * y], [-6 * y, -6 * x]], xr: [-1.4, 1.4], yr: [-1.4, 1.4], p0: [0.5, 0.4], stat: [[0, 0]], q: [0.03, 0.97] },
  quartic: { name: 'x⁴ + y⁴', f: (x, y) => x * x * x * x + y * y * y * y, g: (x, y) => [4 * x * x * x, 4 * y * y * y], H: (x, y) => [[12 * x * x, 0], [0, 12 * y * y]], xr: [-1.4, 1.4], yr: [-1.4, 1.4], p0: [0.7, 0.4], stat: [[0, 0]], q: [0, 0.9] },
  rosen: { name: 'Розенброк (1 − x)² + 10(y − x²)²', f: (x, y) => (1 - x) * (1 - x) + 10 * (y - x * x) * (y - x * x), g: (x, y) => [-2 * (1 - x) - 40 * x * (y - x * x), 20 * (y - x * x)], H: (x, y) => [[2 - 40 * (y - x * x) + 80 * x * x, -40 * x], [-40 * x, 20]], xr: [-2, 2], yr: [-1, 3], p0: [-1, 1] },
  ell: { name: 'x² + 4y²', f: (x, y) => x * x + 4 * y * y, g: (x, y) => [2 * x, 8 * y], H: () => [[2, 0], [0, 8]], xr: [-2.2, 2.2], yr: [-1.6, 1.6], p0: [1, 1] },
  sincos: { name: 'sin x · cos y', f: (x, y) => Math.sin(x) * Math.cos(y), g: (x, y) => [Math.cos(x) * Math.cos(y), -Math.sin(x) * Math.sin(y)], H: (x, y) => [[-Math.sin(x) * Math.cos(y), -Math.cos(x) * Math.sin(y)], [-Math.cos(x) * Math.sin(y), -Math.sin(x) * Math.cos(y)]], xr: [-3.2, 3.2], yr: [-2.4, 2.4], p0: [0.5, 0.5] }
};
const F1 = {
  sq: { name: 'x²', f: x => x * x, d1: x => 2 * x, d2: () => 2 },
  half: { name: '½x²', f: x => 0.5 * x * x, d1: x => x, d2: () => 1 },
  q23: { name: '2x² + 3x', f: x => 2 * x * x + 3 * x, d1: x => 4 * x + 3, d2: () => 4 },
  abs: { name: '|x|', f: x => Math.abs(x), d1: x => Math.sign(x), d2: () => 0 },
  exp: { name: 'eˣ', f: Math.exp, d1: Math.exp, d2: Math.exp },
  sp: { name: 'ln(1 + eˣ) (softplus)', f: x => x > 30 ? x : Math.log1p(Math.exp(x)), d1: x => 1 / (1 + Math.exp(-x)), d2: x => { const s = 1 / (1 + Math.exp(-x)); return s * (1 - s); } },
  x4: { name: 'x⁴', f: x => x * x * x * x, d1: x => 4 * x * x * x, d2: x => 12 * x * x },
  w: { name: 'x⁴ − 3x² (невыпуклая)', f: x => x * x * x * x - 3 * x * x, d1: x => 4 * x * x * x - 6 * x, d2: x => 12 * x * x - 6 },
  sin: { name: 'sin x', f: Math.sin, d1: Math.cos, d2: x => -Math.sin(x) },
  cosh: { name: 'cosh x', f: Math.cosh, d1: Math.sinh, d2: Math.cosh },
  sq2: { name: '2x²', f: x => 2 * x * x, d1: x => 4 * x, d2: () => 4 },
  lch: { name: 'ln cosh x', f: x => Math.abs(x) > 20 ? Math.abs(x) - Math.LN2 : Math.log(Math.cosh(x)), d1: Math.tanh, d2: x => { const t = Math.tanh(x); return 1 - t * t; } },
  plsin: { name: 'x² + 3sin²x', f: x => x * x + 3 * Math.sin(x) * Math.sin(x), d1: x => 2 * x + 3 * Math.sin(2 * x), d2: x => 2 + 6 * Math.cos(2 * x) },
  sq3: { name: '3x²', f: x => 3 * x * x, d1: x => 6 * x, d2: () => 6 },
  expm: { name: 'eˣ − 2x', f: x => Math.exp(x) - 2 * x, d1: x => Math.exp(x) - 2, d2: Math.exp },
  sqrt1: { name: '√(1 + x²)', f: x => Math.sqrt(1 + x * x), d1: x => x / Math.sqrt(1 + x * x), d2: x => Math.pow(1 + x * x, -1.5) },
  quart: { name: 'x⁴ − 3x² + x', f: x => x * x * x * x - 3 * x * x + x, d1: x => 4 * x * x * x - 6 * x + 1, d2: x => 12 * x * x - 6 }
};
function infOn(f, a, b, n) { n = n || 2000; let m = Infinity, at = a; for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n; const y = f(x); if (y < m) { m = y; at = x; } } return [m, at]; }
function supOn(f, a, b, n) { const r = infOn(x => -f(x), a, b, n); return [-r[0], r[1]]; }
function golden(f, a, b) {
  const g = (Math.sqrt(5) - 1) / 2;
  let c = b - g * (b - a), d = a + g * (b - a);
  for (let i = 0; i < 90; i++) { if (f(c) < f(d)) b = d; else a = c; c = b - g * (b - a); d = a + g * (b - a); }
  return (a + b) / 2;
}

const WIDGETS = {};
