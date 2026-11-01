
/* ================= Armijo backtracking in 3D (card 19) ================= */
const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
let threeP = null;
function loadThree() {
  if (window.THREE) return Promise.resolve(window.THREE);
  if (threeP) return threeP;
  threeP = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = THREE_URL;
    s.async = true;
    s.onload = () => { if (window.THREE) res(window.THREE); else rej(new Error('THREE не определён')); };
    s.onerror = () => rej(new Error('не удалось загрузить three.js'));
    document.head.appendChild(s);
  });
  return threeP;
}
const A3 = {
  ravine: {
    name: '½(x₁² + 10x₂²) — овраг', f: (x, y) => 0.5 * (x * x + 10 * y * y), g: (x, y) => [x, 10 * y], H: () => [[1, 0], [0, 10]],
    dom: [[-2, 2], [-2, 2]], p0: [1.6, 0.6], a0: 1, L: 10, Lnote: 'λmax(∇²f) = 10, квадратичная'
  },
  circle: {
    name: 'x₁² + x₂² — круг', f: (x, y) => x * x + y * y, g: (x, y) => [2 * x, 2 * y], H: () => [[2, 0], [0, 2]],
    dom: [[-2, 2], [-2, 2]], p0: [1.4, 0.9], a0: 1, L: 2, Lnote: 'λmax(∇²f) = 2, квадратичная'
  },
  nonconvex: {
    name: 'x₁² + 3sin²x₁ + x₂² — невыпуклая', f: (x, y) => x * x + 3 * Math.sin(x) * Math.sin(x) + y * y, g: (x, y) => [2 * x + 3 * Math.sin(2 * x), 2 * y], H: x => [[2 + 6 * Math.cos(2 * x), 0], [0, 2]],
    dom: [[-3, 3], [-2.5, 2.5]], p0: [1.5, 1.2], a0: 1, L: 8, Lnote: '|∂²f/∂x₁²| = |2 + 6cos 2x₁| ≤ 8 ⇒ L = 8 на всём ℝ²'
  },
  rosen: {
    name: 'Розенброк (1 − x₁)² + 100(x₂ − x₁²)²', f: (x, y) => (1 - x) * (1 - x) + 100 * (y - x * x) * (y - x * x), g: (x, y) => [-2 * (1 - x) - 400 * x * (y - x * x), 200 * (y - x * x)],
    H: (x, y) => [[2 - 400 * (y - x * x) + 800 * x * x, -400 * x], [-400 * x, 200]],
    dom: [[-1.6, 1.6], [-0.6, 2.2]], p0: [-1.2, 1], a0: 0.004, L: null, zcap: 120, Lnote: 'глобальной L нет: гессиан не ограничен'
  }
};
WIDGETS.armijo3d = (root, wid) => {
  let key = 'ravine', P = A3[key];
  let x0 = P.p0.slice(), la0 = Math.log10(P.a0), beta = 0.5, lc = Math.log10(0.25), shown = 99, showPlane = true, showTrail = true;
  let trail = [x0.slice()];
  const c1 = row(root);
  selectBox(c1, wid, { name: 'fn', label: 'Функция', value: key, options: Object.keys(A3).map(k => [k, A3[k].name]), on: k => setFn(k) });
  const sx1 = slider(c1, wid, { name: 'x1', label: 'x₀, первая', min: P.dom[0][0], max: P.dom[0][1], step: 0.01, value: x0[0], on: z => { x0[0] = z; moved(); } });
  const sx2 = slider(c1, wid, { name: 'x2', label: 'x₀, вторая', min: P.dom[1][0], max: P.dom[1][1], step: 0.01, value: x0[1], on: z => { x0[1] = z; moved(); } });
  const c2 = row(root);
  const sa = slider(c2, wid, { name: 'a0', label: 'α₀', min: -3.5, max: 0.5, step: 0.01, value: la0, fmt: z => num(Math.pow(10, z), 4), on: z => { la0 = z; shown = 99; refresh(); } });
  slider(c2, wid, { name: 'b', label: 'β ∈ (0, 1)', min: 0.1, max: 0.9, step: 0.05, value: beta, on: z => { beta = z; shown = 99; refresh(); } });
  slider(c2, wid, { name: 'c', label: 'c ∈ (0, 1)', min: -4, max: Math.log10(0.95), step: 0.01, value: lc, fmt: z => num(Math.pow(10, z), 4), on: z => { lc = z; shown = 99; refresh(); } });
  const c3 = row(root);
  const bRun = button(c3, '▶ Запустить бэктрекинг', () => { an.stop(); shown = 0; bRun.disabled = true; an.start(); }, 'primary');
  button(c3, 'Шаг GD', () => gdStep());
  button(c3, 'Сброс', () => { an.stop(); x0 = P.p0.slice(); sx1.set(x0[0]); sx2.set(x0[1]); trail = [x0.slice()]; shown = 99; refresh(); });
  checkbox(c3, wid, { name: 'pl', label: ' плоскость сечения', checked: true, on: b => { showPlane = b; refresh(); } });
  checkbox(c3, wid, { name: 'tr', label: ' траектория GD', checked: true, on: b => { showTrail = b; refresh(); } });
  const c4 = row(root);
  button(c4, '＋', () => zoom(0.85), 'small');
  button(c4, '−', () => zoom(1 / 0.85), 'small');
  button(c4, 'вид сбоку', () => { cs.th = -0.95; cs.ph = 1.0; cs.r = 3.3; placeCam(); }, 'small');
  button(c4, 'вид сверху', () => { cs.th = -Math.PI / 2; cs.ph = 0.06; cs.r = 3.2; placeCam(); }, 'small');
  const stage = document.createElement('div'); stage.className = 'stage3d';
  stage.setAttribute('role', 'img'); stage.setAttribute('aria-label', 'Поверхность функции, сечение вдоль направления спуска и пробные шаги бэктрекинга');
  const msg = document.createElement('div'); msg.className = 'stage-msg'; msg.textContent = '3D подгружается…';
  stage.appendChild(msg);
  root.appendChild(stage);
  const lg = document.createElement('div'); lg.className = 'legend-row';
  lg.innerHTML = '<span><span class="sw"></span>φ(α) = f(x₀ + αd)</span><span><span class="sw dash m"></span>касательная f(x₀) + α∇fᵀd</span><span><span class="sw dash o"></span>прямая Армихо f(x₀) + cα∇fᵀd</span><span><b class="k-bad">✕</b> отвергнут</span><span><b class="k-ok">●</b> принят</span><span><span class="sw" style="border-top-color:var(--c-violet)"></span>траектория GD</span><span><span class="sw dash g"></span>α = 2(1 − c)/L</span>';
  root.appendChild(lg);
  const ro = readout(root);
  const look = document.createElement('div'); look.className = 'look';
  look.innerHTML = '<b>Что смотреть.</b><ul><li>Кривая φ(α) ниже оранжевой прямой — шаг принят: выполнено условие Армихо (Armijo condition, sufficient decrease). Вертикальные пунктиры показывают, насколько отвергнутым шагам не хватило.</li><li>c близко к 1 — условие строгое: прямая почти совпадает с касательной, проходят только короткие шаги. c близко к 0 — мягкое: прямая почти горизонтальна (на практике c = 10⁻⁴).</li><li>β задаёт, как быстро сокращаем шаг: β = 0.5 делит пополам, β = 0.9 — мелкими шагами и с большим числом проб.</li></ul>';
  root.appendChild(look);

  const cv = () => Math.pow(10, lc), a0 = () => Math.pow(10, la0);
  const inDom = (x, y) => x >= P.dom[0][0] - 1e-9 && x <= P.dom[0][1] + 1e-9 && y >= P.dom[1][0] - 1e-9 && y <= P.dom[1][1] + 1e-9;
  function baseS() {
    const g = P.g(x0[0], x0[1]), d = [-g[0], -g[1]], f0 = P.f(x0[0], x0[1]);
    return { g, d, f0, sl: g[0] * d[0] + g[1] * d[1] };
  }
  function trials(S) {
    const out = [];
    if (Math.hypot(S.g[0], S.g[1]) < 1e-10) return out;
    let a = a0();
    for (let j = 0; j < 40; j++) {
      const x = x0[0] + a * S.d[0], y = x0[1] + a * S.d[1];
      const ph = P.f(x, y), rhs = S.f0 + cv() * a * S.sl;
      const okk = ph <= rhs;
      out.push({ j, a, x, y, ph, rhs, ok: okk, inD: inDom(x, y) });
      if (okk) break;
      a *= beta;
    }
    return out;
  }
  function Lval() {
    if (P.L) return { L: P.L, global: true };
    const H = P.H(x0[0], x0[1]);
    const E = eig2(H[0][0], H[0][1], H[1][1]);
    return { L: Math.max(Math.abs(E.l1), Math.abs(E.l2)), global: false };
  }
  const an = animator(() => { shown++; refresh(); }, () => shown >= trials(baseS()).length, () => { bRun.disabled = false; }, () => RM ? 60 : 700);

  function moved() { an.stop(); trail = [x0.slice()]; shown = 99; refresh(); }
  function setFn(k) {
    an.stop(); key = k; P = A3[k]; x0 = P.p0.slice(); la0 = Math.log10(P.a0);
    sx1.range(P.dom[0][0], P.dom[0][1]); sx2.range(P.dom[1][0], P.dom[1][1]); sx1.set(x0[0]); sx2.set(x0[1]); sa.set(la0);
    trail = [x0.slice()]; shown = 99;
    if (ready) buildStatic();
    refresh();
  }
  function gdStep() {
    an.stop();
    const tr = trials(baseS());
    const last = tr[tr.length - 1];
    if (!last || !last.ok) { refresh('нет принятого шага: сначала нужен α, прошедший проверку'); return; }
    x0 = [clamp(last.x, P.dom[0][0], P.dom[0][1]), clamp(last.y, P.dom[1][0], P.dom[1][1])];
    sx1.set(x0[0]); sx2.set(x0[1]);
    trail.push(x0.slice());
    shown = 99;
    refresh(last.inD ? '' : 'принятая точка вышла за окно графика, x₀ прижата к краю');
  }

  function readoutHTML(note) {
    const S = baseS(), tr = trials(S), gn2 = S.g[0] * S.g[0] + S.g[1] * S.g[1];
    const Lv = Lval(), c = cv();
    let h = '<div class="row">x₀ = ' + vec(x0, 4) + ', f(x₀) = ' + num(S.f0, 5) + '</div>';
    h += '<div class="row">∇f(x₀) = ' + vec(S.g, 4) + ', d = −∇f = ' + vec(S.d, 4) + ', ∇fᵀd = −‖∇f‖² = ' + num(S.sl, 5) + '</div>';
    if (gn2 < 1e-20) return h + '<div class="row">' + pill(null, '∇f = 0') + ' x₀ — стационарная точка, шагать некуда</div>';
    if (Lv.global) {
      const ag = 2 * (1 - c) / Lv.L;
      h += '<div class="row">L = ' + num(Lv.L, 4) + ' (' + P.Lnote + ') ⇒ проверка заведомо проходит при α ≤ 2(1 − c)/L = ' + num(ag, 4) + '</div>';
    } else {
      h += '<div class="row">' + P.Lnote + '; локально λmax(∇²f(x₀)) = ' + num(Lv.L, 4) + ', оценка 2(1 − c)/λmax = ' + num(2 * (1 - c) / Lv.L, 4) + ' — без гарантии</div>';
    }
    h += '<div class="row">условие: φ(α) = f(x₀ + αd) ≤ f(x₀) + c·α·∇fᵀd = ' + linFmt([[S.f0, ''], [c * S.sl, 'α']], 4) + ', &nbsp; c = ' + num(c, 4) + ', β = ' + num(beta, 2) + '</div>';
    h += '<table><tr><th>j</th><th>α = βʲα₀</th><th>φ(α)</th><th>f(x₀) + cα∇fᵀd</th><th></th><th></th></tr>';
    tr.slice(0, shown).forEach(t => {
      const where = !t.inD ? '<span class="k-mut">вне окна графика</span>' : (P.zcap && t.ph > P.zcap ? '<span class="k-mut">выше окна (f &gt; ' + P.zcap + ')</span>' : '');
      h += '<tr><td>' + t.j + '</td><td>' + num(t.a, 5) + '</td><td>' + num(t.ph, 5) + '</td><td>' + num(t.rhs, 5) + '</td><td>' + (t.ok ? '<span class="k-ok">✓ принят</span>' : '<span class="k-bad">✗</span>') + '</td><td>' + where + '</td></tr>';
    });
    h += '</table>';
    if (shown >= tr.length && tr.length) {
      const t = tr[tr.length - 1];
      if (t.ok) h += '<div class="row">итог: α = ' + num(t.a, 5) + ' после ' + (tr.length - 1) + ' ' + ((tr.length - 1) % 10 === 1 && (tr.length - 1) % 100 !== 11 ? 'сокращения' : 'сокращений') + '; x⁺ = ' + vec([t.x, t.y], 4) + ', f(x⁺) = ' + num(t.ph, 5) + ' (убыло на ' + num(S.f0 - t.ph, 4) + ', Армихо требовало ≥ ' + num(-c * t.a * S.sl, 4) + ')</div>';
      else h += '<div class="row">' + pill(false, 'за 40 проб шаг не принят') + '</div>';
    }
    if (trail.length > 1) h += '<div class="row k-mut">шагов GD сделано: ' + (trail.length - 1) + ', f: ' + trail.map(p => num(P.f(p[0], p[1]), 3)).slice(-6).join(' → ') + '</div>';
    if (P.zcap) h += '<div class="row k-mut">ось f обрезана на ' + P.zcap + ': выше поверхность не рисуется</div>';
    if (note) h += '<div class="row k-warn">' + note + '</div>';
    return h;
  }

  /* ---------- three.js part ---------- */
  let ready = false, THREE = null, renderer = null, scene = null, cam = null, stat = null, dyn = null, raf = 0, tv = -1;
  let G = null, baseMark = null, surfMark = null;
  const cs = { th: -0.95, ph: 1.0, r: 3.3 };
  const ZB = -0.24;
  const Xw = x => (x - G.cx) / G.R, Yw = y => (y - G.cy) / G.R, Zw = f => (f - G.zmin) / (G.zcap - G.zmin) * G.Hh;
  const fLo = () => G.zmin + ZB / G.Hh * (G.zcap - G.zmin);
  const V = (x, y, f) => new THREE.Vector3(Xw(x), Yw(y), Zw(f));
  function col(hex) { return new THREE.Color(hex); }
  function isDark() { const c = hexRgb(T.surface); return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255 < 0.5; }
  function req() { if (!raf && ready) raf = requestAnimationFrame(() => { raf = 0; renderer.render(scene, cam); }); }
  function clearG(gr) {
    while (gr.children.length) {
      const o = gr.children.pop();
      o.traverse(m => {
        if (m.geometry) m.geometry.dispose();
        if (m.material) { const ms = Array.isArray(m.material) ? m.material : [m.material]; ms.forEach(mt => { if (mt.map) mt.map.dispose(); mt.dispose(); }); }
      });
    }
  }
  function basic(color, o) { return new THREE.MeshBasicMaterial(Object.assign({ color: col(color), depthTest: false, transparent: true }, o || {})); }
  function rod(a, b, r, mat, order) {
    const dir = new THREE.Vector3().subVectors(b, a), len = dir.length();
    if (len < 1e-6) return null;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8, 1, true), mat);
    m.position.copy(a).addScaledVector(dir, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    m.renderOrder = order || 5;
    return m;
  }
  function dashed(gr, a, b, r, mat, dl, gl, order) {
    const dir = new THREE.Vector3().subVectors(b, a), len = dir.length();
    if (len < 1e-6) return;
    dir.normalize();
    for (let s = 0; s < len; s += dl + gl) {
      const e = Math.min(len, s + dl);
      const m = rod(a.clone().addScaledVector(dir, s), a.clone().addScaledVector(dir, e), r, mat, order);
      if (m) gr.add(m);
    }
  }
  function tube(gr, pts, r, mat, order) {
    if (pts.length < 2) return;
    const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(8, pts.length * 2), r, 6, false), mat);
    m.renderOrder = order || 6;
    gr.add(m);
  }
  function canvasSprite(w, h, draw, size) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'));
    const tex = new THREE.CanvasTexture(c); tex.minFilter = THREE.LinearFilter;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
    sp.scale.set(size * w / h, size, 1);
    sp.renderOrder = 20;
    return sp;
  }
  function textSprite(s, color, size) {
    const probe = document.createElement('canvas').getContext('2d');
    probe.font = '600 44px ' + MONO;
    const w = Math.ceil(probe.measureText(s).width) + 20;
    return canvasSprite(w, 60, x => { x.font = '600 44px ' + MONO; x.fillStyle = color; x.textBaseline = 'middle'; x.fillText(s, 10, 32); }, size);
  }
  const crossSprite = (color, size) => canvasSprite(64, 64, x => { x.strokeStyle = T.surface; x.lineWidth = 18; x.lineCap = 'round'; x.beginPath(); x.moveTo(14, 14); x.lineTo(50, 50); x.moveTo(50, 14); x.lineTo(14, 50); x.stroke(); x.strokeStyle = color; x.lineWidth = 10; x.stroke(); }, size);
  const dotSprite = (color, size) => canvasSprite(64, 64, x => { x.beginPath(); x.arc(32, 32, 24, 0, 2 * Math.PI); x.fillStyle = color; x.fill(); x.lineWidth = 7; x.strokeStyle = T.surface; x.stroke(); }, size);

  function buildStatic() {
    clearG(stat);
    tv = themeVer;
    renderer.setClearColor(col(T.surface), 1);
    const n = P.zcap ? 140 : 90, xa = P.dom[0][0], xb = P.dom[0][1], ya = P.dom[1][0], yb = P.dom[1][1];
    const F = new Float64Array((n + 1) * (n + 1));
    let mn = Infinity, mx = -Infinity;
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
      const v = P.f(xa + (xb - xa) * i / n, ya + (yb - ya) * j / n);
      F[j * (n + 1) + i] = v; if (v < mn) mn = v; if (v > mx) mx = v;
    }
    G = { cx: (xa + xb) / 2, cy: (ya + yb) / 2, R: Math.max(xb - xa, yb - ya) / 2, zmin: mn, zcap: P.zcap ? Math.min(P.zcap, mx) : mx, Hh: 0.9 };
    const dark = isDark();
    const lo = dark ? [0.14, 0.24, 0.56] : [0.15, 0.30, 0.78], hi = dark ? [0.66, 0.74, 1.0] : [0.92, 0.94, 0.99];
    const pos = [], cols = [], idx = [];
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
      const v = Math.min(F[j * (n + 1) + i], G.zcap);
      pos.push(Xw(xa + (xb - xa) * i / n), Yw(ya + (yb - ya) * j / n), Zw(v));
      const t = Math.sqrt(clamp((v - G.zmin) / (G.zcap - G.zmin), 0, 1));
      cols.push(lo[0] + (hi[0] - lo[0]) * t, lo[1] + (hi[1] - lo[1]) * t, lo[2] + (hi[2] - lo[2]) * t);
    }
    const id = (i, j) => j * (n + 1) + i;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const a = id(i, j), b = id(i + 1, j), c = id(i + 1, j + 1), d = id(i, j + 1);
      if (Math.min(F[a], F[b], F[c]) <= G.zcap + 1e-9) idx.push(a, b, c);
      if (Math.min(F[a], F[c], F[d]) <= G.zcap + 1e-9) idx.push(a, c, d);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const surf = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }));
    stat.add(surf);
    const gl = [];
    for (let j = 0; j <= n; j += Math.round(n / 15)) for (let i = 0; i < n; i++) { const a = id(i, j), b = id(i + 1, j); if (Math.max(F[a], F[b]) <= G.zcap) gl.push(pos[3 * a], pos[3 * a + 1], pos[3 * a + 2] + 0.002, pos[3 * b], pos[3 * b + 1], pos[3 * b + 2] + 0.002); }
    for (let i = 0; i <= n; i += Math.round(n / 15)) for (let j = 0; j < n; j++) { const a = id(i, j), b = id(i, j + 1); if (Math.max(F[a], F[b]) <= G.zcap) gl.push(pos[3 * a], pos[3 * a + 1], pos[3 * a + 2] + 0.002, pos[3 * b], pos[3 * b + 1], pos[3 * b + 2] + 0.002); }
    const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(gl, 3));
    stat.add(new THREE.LineSegments(gg, new THREE.LineBasicMaterial({ color: col(T.ink), transparent: true, opacity: dark ? 0.16 : 0.12 })));
    const plate = new THREE.Mesh(new THREE.PlaneGeometry((xb - xa) / G.R, (yb - ya) / G.R), new THREE.MeshBasicMaterial({ color: col(T.inset), side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 }));
    plate.position.set(0, 0, ZB);
    stat.add(plate);
    const levels = [];
    for (let k = 1; k <= 12; k++) levels.push(G.zmin + (G.zcap - G.zmin) * Math.pow(k / 13, 2));
    const seg = [];
    const px = i => Xw(xa + (xb - xa) * i), py = j => Yw(ya + (yb - ya) * j);
    levels.forEach(Lv => {
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
        const a = F[id(i, j)], b = F[id(i + 1, j)], c = F[id(i + 1, j + 1)], d = F[id(i, j + 1)];
        const p = [];
        if ((a < Lv) !== (b < Lv)) p.push([(i + (Lv - a) / (b - a)) / n, j / n]);
        if ((b < Lv) !== (c < Lv)) p.push([(i + 1) / n, (j + (Lv - b) / (c - b)) / n]);
        if ((d < Lv) !== (c < Lv)) p.push([(i + (Lv - d) / (c - d)) / n, (j + 1) / n]);
        if ((a < Lv) !== (d < Lv)) p.push([i / n, (j + (Lv - a) / (d - a)) / n]);
        for (let q = 0; q + 1 < p.length; q += 2) seg.push(px(p[q][0]), py(p[q][1]), ZB + 0.003, px(p[q + 1][0]), py(p[q + 1][1]), ZB + 0.003);
      }
    });
    const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
    stat.add(new THREE.LineSegments(cg, new THREE.LineBasicMaterial({ color: col(T.accent), transparent: true, opacity: 0.75 })));
    const X0 = Xw(xa), X1 = Xw(xb), Y0 = Yw(ya), Y1 = Yw(yb);
    const fr = [X0, Y0, ZB, X1, Y0, ZB, X1, Y0, ZB, X1, Y1, ZB, X1, Y1, ZB, X0, Y1, ZB, X0, Y1, ZB, X0, Y0, ZB, X0, Y0, ZB, X0, Y0, G.Hh + 0.06];
    const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(fr, 3));
    stat.add(new THREE.LineSegments(fg, new THREE.LineBasicMaterial({ color: col(T.muted) })));
    const l1 = textSprite('x₁', T.muted, 0.085); l1.position.set((X0 + X1) / 2, Y0 - 0.12, ZB); stat.add(l1);
    const l2 = textSprite('x₂', T.muted, 0.085); l2.position.set(X0 - 0.12, (Y0 + Y1) / 2, ZB); stat.add(l2);
    const l3 = textSprite('f', T.muted, 0.085); l3.position.set(X0, Y0, G.Hh + 0.13); stat.add(l3);
    if (P.zcap) { const l4 = textSprite('f обрезана на ' + P.zcap, T.muted, 0.06); l4.position.set(X0 + 0.32, Y0, G.Hh + 0.13); stat.add(l4); }
    stat.add(new THREE.AmbientLight(0xffffff, 0.62));
    const dl = new THREE.DirectionalLight(0xffffff, 0.55); dl.position.set(2, -3, 4); stat.add(dl);
  }

  function exitAlpha(d) {
    let am = Infinity;
    for (let k = 0; k < 2; k++) {
      if (d[k] > 1e-12) am = Math.min(am, (P.dom[k][1] - x0[k]) / d[k]);
      else if (d[k] < -1e-12) am = Math.min(am, (P.dom[k][0] - x0[k]) / d[k]);
    }
    return Math.max(0, am);
  }
  function lineClip(f0, k, a1) {
    let s = 0, e = a1;
    const lo = fLo(), hi = G.zcap;
    if (Math.abs(k) < 1e-15) return (f0 >= lo && f0 <= hi) ? [s, e] : null;
    const aLo = (lo - f0) / k, aHi = (hi - f0) / k;
    s = Math.max(s, Math.min(aLo, aHi)); e = Math.min(e, Math.max(aLo, aHi));
    return e > s ? [s, e] : null;
  }
  function buildDyn() {
    clearG(dyn);
    const S = baseS(), tr = trials(S), c = cv();
    const p = V(x0[0], x0[1], Math.min(S.f0, G.zcap)), pb = new THREE.Vector3(p.x, p.y, ZB);
    surfMark = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), basic(T.accent));
    surfMark.position.copy(p); surfMark.renderOrder = 15; dyn.add(surfMark);
    baseMark = new THREE.Mesh(new THREE.SphereGeometry(0.042, 18, 12), new THREE.MeshLambertMaterial({ color: col(T.accent) }));
    baseMark.position.copy(pb); dyn.add(baseMark);
    dashed(dyn, pb, p, 0.003, basic(T.muted, { opacity: 0.8 }), 0.025, 0.02, 4);
    const lx = textSprite('x₀', T.accent, 0.075); lx.position.set(pb.x + 0.07, pb.y - 0.07, ZB + 0.02); dyn.add(lx);
    if (showTrail && trail.length > 1) {
      const mt = basic(T.violet), mtb = new THREE.MeshBasicMaterial({ color: col(T.violet) });
      for (let i = 0; i < trail.length; i++) {
        const q = trail[i], qs = V(q[0], q[1], Math.min(P.f(q[0], q[1]), G.zcap)), qb = new THREE.Vector3(qs.x, qs.y, ZB + 0.006);
        const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.016, 10, 8), mt); s1.position.copy(qs); s1.renderOrder = 7; dyn.add(s1);
        const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.018, 10, 8), mtb); s2.position.copy(qb); dyn.add(s2);
        if (i) {
          const r0 = trail[i - 1], rs = V(r0[0], r0[1], Math.min(P.f(r0[0], r0[1]), G.zcap)), rb = new THREE.Vector3(rs.x, rs.y, ZB + 0.006);
          const m1 = rod(rs, qs, 0.006, mt, 7); if (m1) dyn.add(m1);
          const m2 = rod(rb, qb, 0.006, mtb, 3); if (m2) dyn.add(m2);
        }
      }
    }
    const gn = Math.hypot(S.g[0], S.g[1]);
    if (gn < 1e-10) { req(); return; }
    const adraw = Math.min(a0() * 1.04, exitAlpha(S.d));
    const xe = [x0[0] + adraw * S.d[0], x0[1] + adraw * S.d[1]];
    const pe = new THREE.Vector3(Xw(xe[0]), Yw(xe[1]), ZB);
    const dlen = Math.hypot(pe.x - pb.x, pe.y - pb.y);
    if (showPlane && dlen > 1e-4) {
      const top = G.Hh * 1.04;
      const pg = new THREE.BufferGeometry();
      pg.setAttribute('position', new THREE.Float32BufferAttribute([pb.x, pb.y, ZB, pe.x, pe.y, ZB, pe.x, pe.y, top, pb.x, pb.y, ZB, pe.x, pe.y, top, pb.x, pb.y, top], 3));
      const pm = new THREE.Mesh(pg, new THREE.MeshBasicMaterial({ color: col(T.accent), transparent: true, opacity: isDark() ? 0.16 : 0.12, side: THREE.DoubleSide, depthWrite: false }));
      pm.renderOrder = 2; dyn.add(pm);
      const eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.Float32BufferAttribute([pb.x, pb.y, top, pe.x, pe.y, top, pe.x, pe.y, ZB, pe.x, pe.y, top], 3));
      dyn.add(new THREE.LineSegments(eg, new THREE.LineBasicMaterial({ color: col(T.accent), transparent: true, opacity: 0.45 })));
    }
    const ud = new THREE.Vector3(S.d[0], S.d[1], 0).normalize();
    const alen = Math.min(0.42, Math.max(0.12, dlen));
    const ah = pb.clone().addScaledVector(ud, alen);
    const ma = basic(T.ink);
    const ar = rod(pb.clone().setZ(ZB + 0.01), ah.clone().setZ(ZB + 0.01), 0.007, ma, 8); if (ar) dyn.add(ar);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.026, 0.07, 14), ma);
    cone.position.copy(ah).setZ(ZB + 0.01).addScaledVector(ud, 0.03);
    cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), ud); cone.renderOrder = 8; dyn.add(cone);
    const ld = textSprite('d = −∇f', T.ink, 0.065); ld.position.copy(ah).setZ(ZB + 0.08); dyn.add(ld);
    const N = 240, segs = [];
    let cur = [];
    for (let i = 0; i <= N; i++) {
      const a = adraw * i / N, x = x0[0] + a * S.d[0], y = x0[1] + a * S.d[1], v = P.f(x, y);
      if (v <= G.zcap) cur.push(V(x, y, v).add(new THREE.Vector3(0, 0, 0.004)));
      else { if (cur.length > 1) segs.push(cur); cur = []; }
    }
    if (cur.length > 1) segs.push(cur);
    const mc = basic(T.ink);
    segs.forEach(s => tube(dyn, s, 0.0085, mc, 9));
    const lineAt = (k, mat, dl, gl) => {
      const cl = lineClip(S.f0, k, adraw);
      if (!cl) return;
      const A = V(x0[0] + cl[0] * S.d[0], x0[1] + cl[0] * S.d[1], S.f0 + k * cl[0]);
      const B = V(x0[0] + cl[1] * S.d[0], x0[1] + cl[1] * S.d[1], S.f0 + k * cl[1]);
      dashed(dyn, A, B, 0.0055, mat, dl, gl, 8);
    };
    lineAt(S.sl, basic(T.muted), 0.02, 0.022);
    lineAt(c * S.sl, basic(T.orange), 0.04, 0.025);
    const Lv = Lval();
    if (Lv.global) {
      const ag = 2 * (1 - c) / Lv.L;
      if (ag < adraw) {
        const xg = x0[0] + ag * S.d[0], yg = x0[1] + ag * S.d[1], vg = Math.min(P.f(xg, yg), G.zcap);
        dashed(dyn, V(xg, yg, fLo()), V(xg, yg, vg), 0.004, basic(T.green, { opacity: 0.85 }), 0.02, 0.02, 7);
      }
    }
    tr.slice(0, shown).forEach((t, i) => {
      if (!t.inD) return;
      const above = t.ph > G.zcap;
      const q = V(t.x, t.y, Math.min(t.ph, G.zcap)).add(new THREE.Vector3(0, 0, 0.006));
      const r = V(t.x, t.y, clamp(t.rhs, fLo(), G.zcap));
      dashed(dyn, q, r, 0.0042, basic(t.ok ? T.green : T.red, { opacity: 0.9 }), 0.018, 0.014, 10);
      const mk = t.ok ? dotSprite(T.green, 0.075) : crossSprite(T.red, 0.075);
      mk.position.copy(q); dyn.add(mk);
      const lb = textSprite(String(t.j) + (above ? ' ↑' : ''), t.ok ? T.green : T.red, 0.06);
      lb.position.copy(q).add(new THREE.Vector3(0, 0, 0.075)); dyn.add(lb);
    });
    req();
  }
  function refresh(note) {
    ro.innerHTML = readoutHTML(note);
    if (ready) { if (tv !== themeVer) buildStatic(); buildDyn(); }
  }
  function placeCam() {
    if (!ready) return;
    const t = new THREE.Vector3(0, 0, 0.28);
    cs.ph = clamp(cs.ph, 0.05, 1.5); cs.r = clamp(cs.r, 1.6, 7);
    cam.position.set(t.x + cs.r * Math.sin(cs.ph) * Math.cos(cs.th), t.y + cs.r * Math.sin(cs.ph) * Math.sin(cs.th), t.z + cs.r * Math.cos(cs.ph));
    cam.up.set(0, 0, 1); cam.lookAt(t);
    req();
  }
  function zoom(k) { cs.r *= k; placeCam(); }
  function resize() {
    if (!ready) return;
    const w = Math.floor(stage.clientWidth);
    if (w < 10) return;
    const h = Math.round(clamp(w * 0.66, 300, 520));
    renderer.setSize(w, h);
    cam.aspect = w / h; cam.updateProjectionMatrix();
    req();
  }
  function init() {
    THREE = window.THREE;
    try { renderer = new THREE.WebGLRenderer({ antialias: true }); }
    catch (err) { msg.textContent = 'WebGL недоступен в этом браузере: 3D не показать. 2D-версия выше работает.'; return; }
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    scene = new THREE.Scene();
    cam = new THREE.PerspectiveCamera(38, 1.5, 0.05, 50);
    stat = new THREE.Group(); dyn = new THREE.Group();
    scene.add(stat, dyn);
    msg.remove();
    stage.appendChild(renderer.domElement);
    ready = true;
    buildStatic(); placeCam(); resize(); refresh();
    new ResizeObserver(resize).observe(stage);
    FIGS.push({ resize, render: () => { if (ready) { if (tv !== themeVer) buildStatic(); buildDyn(); } } });
    const el = renderer.domElement;
    const ptrs = new Map();
    let mode = null, pinch0 = 0, r0 = 0;
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -ZB);
    const setNdc = e => { const b = el.getBoundingClientRect(); ndc.set((e.clientX - b.left) / b.width * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1); ray.setFromCamera(ndc, cam); };
    el.addEventListener('pointerdown', e => {
      ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      try { el.setPointerCapture(e.pointerId); } catch (_) {}
      if (ptrs.size === 2) { const a = Array.from(ptrs.values()); pinch0 = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]); r0 = cs.r; mode = 'pinch'; return; }
      setNdc(e);
      const hit = [baseMark, surfMark].filter(Boolean);
      mode = ray.intersectObjects(hit).length ? 'drag' : 'rot';
      if (mode === 'drag') an.stop();
      e.preventDefault();
    });
    el.addEventListener('pointermove', e => {
      if (!ptrs.has(e.pointerId)) {
        if (e.pointerType === 'mouse' && baseMark) { setNdc(e); el.style.cursor = ray.intersectObjects([baseMark, surfMark]).length ? 'grab' : 'move'; }
        return;
      }
      const prev = ptrs.get(e.pointerId);
      ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      if (mode === 'pinch' && ptrs.size === 2) { const a = Array.from(ptrs.values()); const d = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]); if (pinch0 > 0) { cs.r = r0 * pinch0 / Math.max(d, 1); placeCam(); } return; }
      if (mode === 'rot') { cs.th -= (e.clientX - prev[0]) * 0.008; cs.ph -= (e.clientY - prev[1]) * 0.008; placeCam(); return; }
      if (mode === 'drag') {
        setNdc(e);
        const pt = new THREE.Vector3();
        if (ray.ray.intersectPlane(plane, pt)) {
          x0 = [clamp(G.cx + pt.x * G.R, P.dom[0][0], P.dom[0][1]), clamp(G.cy + pt.y * G.R, P.dom[1][0], P.dom[1][1])];
          x0 = [+x0[0].toFixed(3), +x0[1].toFixed(3)];
          sx1.set(x0[0]); sx2.set(x0[1]);
          trail = [x0.slice()]; shown = 99; refresh();
        }
      }
    });
    const end = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2 && mode === 'pinch') mode = ptrs.size ? 'rot' : null; if (!ptrs.size) mode = null; };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('wheel', e => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); zoom(Math.exp(e.deltaY * 0.004)); }, { passive: false });
  }
  ro.innerHTML = readoutHTML();
  const start = () => loadThree().then(init).catch(err => { msg.textContent = '3D не загрузился (' + err.message + '). Нужен доступ к cdnjs.cloudflare.com; 2D-версия выше работает без него.'; });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); start(); } }, { rootMargin: '400px 0px' });
    io.observe(root);
  } else start();
};
