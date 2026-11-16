// Prototipo: figura «más humana» dibujada sobre las mismas articulaciones del motor de animaciones (vista lateral)
const Human = (() => {
  const C = { skin: '#e9c2a2', skinD: '#d4a886', skinFar: '#b98f72', top: '#ff5a36', topD: '#d9441f', leg: '#3c4352', legD: '#2c313c', legFar: '#272b34',
    shoe: '#f3f4f6', sole: '#ff5a36', shoeFar: '#c9ccd2', hair: '#2a2420', lip: '#c47b65', shadow: 'rgba(0,0,0,.12)' };
  const f = v => v.toFixed(2);
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], addv = (a, b) => [a[0] + b[0], a[1] + b[1]], mul = (a, k) => [a[0] * k, a[1] * k];
  const norm = a => { const l = Math.hypot(a[0], a[1]) || 1e-6; return [a[0] / l, a[1] / l]; };
  // perfil interpolado: [[s, ancho], ...]
  const prof = (pts, s) => { for (let i = 1; i < pts.length; i++) if (s <= pts[i][0]) { const [s0, w0] = pts[i - 1], [s1, w1] = pts[i], t = (s - s0) / (s1 - s0 || 1), e = t * t * (3 - 2 * t); return w0 + (w1 - w0) * e; } return pts[pts.length - 1][1]; };
  // contorno suave de un segmento con perfil distinto de cada lado (A = +n, B = -n), con tapas redondeadas
  function limb(P, Q, A, B, s0 = 0, s1 = 1, caps = true) {
    const d = sub(Q, P), L = Math.hypot(d[0], d[1]) || 1e-6, u = [d[0] / L, d[1] / L], n = [-u[1], u[0]], N = 18;
    const left = [], right = [];
    for (let i = 0; i <= N; i++) { const s = s0 + (s1 - s0) * i / N, c = addv(P, mul(d, s)); left.push(addv(c, mul(n, prof(A, s)))); right.push(addv(c, mul(n, -prof(B, s)))); }
    const ra = (prof(A, s1) + prof(B, s1)) / 2, rb = (prof(A, s0) + prof(B, s0)) / 2;
    let p = `M${f(left[0][0])} ${f(left[0][1])}`;
    for (let i = 1; i < left.length; i++) p += `L${f(left[i][0])} ${f(left[i][1])}`;
    const e = right[right.length - 1];
    p += caps ? `A${f(ra)} ${f(ra)} 0 0 0 ${f(e[0])} ${f(e[1])}` : `L${f(e[0])} ${f(e[1])}`;
    for (let i = right.length - 2; i >= 0; i--) p += `L${f(right[i][0])} ${f(right[i][1])}`;
    p += caps ? `A${f(rb)} ${f(rb)} 0 0 0 ${f(left[0][0])} ${f(left[0][1])}Z` : 'Z';
    return p;
  }
  const path = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`;
  // perfiles (A = atrás / abajo, B = adelante / arriba en una figura que mira a la derecha)
  const THIGH_A = [[0, 9.6], [0.3, 8.4], [0.75, 6.4], [1, 5.4]], THIGH_B = [[0, 8.2], [0.35, 8.8], [0.8, 6.2], [1, 5.2]];
  const SHIN_A = [[0, 5.2], [0.28, 6.6], [0.6, 4.6], [1, 3.2]], SHIN_B = [[0, 5], [0.3, 4.2], [1, 3]];
  const UARM_A = [[0, 5.4], [0.45, 4.7], [1, 3.6]], UARM_B = [[0, 5.6], [0.18, 5.4], [0.55, 4.5], [1, 3.6]];
  const FARM_A = [[0, 3.6], [0.3, 4], [1, 2.6]], FARM_B = [[0, 3.6], [0.25, 3.9], [1, 2.7]];
  function leg(J, s, far) {
    const hip = J['hip' + s], knee = J['knee' + s], ank = J['ankle' + s], toe = J['toe' + s];
    let o = '';
    const sk = far ? C.skinFar : C.skin, lg = far ? C.legFar : C.leg;
    o += path(limb(knee, ank, SHIN_A, SHIN_B), sk);
    o += path(limb(knee, ank, SHIN_A.map(([a, b]) => [a, b + .5]), SHIN_B.map(([a, b]) => [a, b + .5]), 0, 0.62, false), lg);   // malla hasta media pantorrilla
    o += path(limb(hip, knee, THIGH_A, THIGH_B), lg);
    o += `<circle cx="${f(knee[0])}" cy="${f(knee[1])}" r="5.6" fill="${lg}"/>`;
    // zapatilla: talón detrás del tobillo, punta redondeada, suela de color
    const fd = norm(sub(toe, ank)), up = [fd[1], -fd[0]];
    const heel = addv(addv(ank, mul(fd, -4.6)), mul(up, -1.2)), tip = addv(toe, mul(fd, 3.2));
    const a1 = addv(heel, mul(up, -2.4)), a2 = addv(tip, mul(up, -2.4)), a3 = addv(tip, mul(up, 2.6)), a4 = addv(addv(ank, mul(fd, 1)), mul(up, 5.4)), a5 = addv(heel, mul(up, 4.4));
    o += path(`M${f(a1[0])} ${f(a1[1])}L${f(a2[0])} ${f(a2[1])}Q${f(tip[0] + fd[0] * 3)} ${f(tip[1] + fd[1] * 3)} ${f(a3[0])} ${f(a3[1])}Q${f(a4[0] + fd[0] * 4)} ${f(a4[1] + fd[1] * 4)} ${f(a4[0])} ${f(a4[1])}L${f(a5[0])} ${f(a5[1])}Q${f(heel[0] - fd[0] * 2.4)} ${f(heel[1] - fd[1] * 2.4)} ${f(a1[0])} ${f(a1[1])}Z`, far ? C.shoeFar : C.shoe);
    const b1 = addv(a1, mul(up, 1.6)), b2 = addv(a2, mul(up, 1.6));
    o += path(`M${f(a1[0])} ${f(a1[1])}L${f(a2[0])} ${f(a2[1])}L${f(b2[0])} ${f(b2[1])}L${f(b1[0])} ${f(b1[1])}Z`, far ? C.topD : C.sole);
    return o;
  }
  function arm(J, s, far) {
    const sh = J['sh' + s], el = J['elbow' + s], hd = J['hand' + s], sk = far ? C.skinFar : C.skin;
    let o = path(limb(el, hd, FARM_A, FARM_B), sk) + path(limb(sh, el, UARM_A, UARM_B), sk);
    // mano: palma y pulgar
    const dir = norm(sub(hd, el)), n = [-dir[1], dir[0]], c = addv(hd, mul(dir, 3.2));
    o += `<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="5" ry="3.3" transform="rotate(${f(Math.atan2(dir[1], dir[0]) * 180 / Math.PI)} ${f(c[0])} ${f(c[1])})" fill="${sk}"/>`;
    return o;
  }
  function torso(J) {
    const H = J.hip, S = J.sh, u = norm(sub(S, H)), fw = [-u[1], u[0]];   // fw: hacia donde mira el pecho
    const L = Math.hypot(S[0] - H[0], S[1] - H[1]);
    const at = (s, w) => addv(addv(H, mul(u, L * s)), mul(fw, w));
    // contorno: espalda (atrás) con lumbar hundida, pecho adelante
    const back = [[-0.08, -8.6], [0.12, -8.2], [0.35, -6.9], [0.65, -8.2], [0.9, -8.6], [1.07, -6.2]];
    const front = [[1.07, 5.4], [0.9, 8.8], [0.72, 9.8], [0.5, 7.4], [0.3, 7.6], [0.1, 8], [-0.08, 7.2]];
    const pts = [...back, ...front].map(([s, w]) => at(s, w));
    // curva suave (Catmull-Rom cerrada)
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 0; i < pts.length; i++) { const p0 = pts[(i - 1 + pts.length) % pts.length], p1 = pts[i], p2 = pts[(i + 1) % pts.length], p3 = pts[(i + 2) % pts.length];
      const c1 = addv(p1, mul(sub(p2, p0), 1 / 6)), c2 = sub(p2, mul(sub(p3, p1), 1 / 6)); d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`; }
    let o = path(d + 'Z', C.top);
    // cintura de la malla y glúteo
    const g = at(-0.02, -3.2);
    o += `<ellipse cx="${f(g[0])}" cy="${f(g[1])}" rx="9.8" ry="8.6" transform="rotate(${f(Math.atan2(u[1], u[0]) * 180 / Math.PI)} ${f(g[0])} ${f(g[1])})" fill="${C.leg}"/>`;
    const w1 = at(0.2, -8.4), w2 = at(0.2, 8.1), w3 = at(-0.02, 7.6), w4 = at(-0.02, -8.8);
    o += path(`M${f(w1[0])} ${f(w1[1])}L${f(w2[0])} ${f(w2[1])}L${f(w3[0])} ${f(w3[1])}L${f(w4[0])} ${f(w4[1])}Z`, C.leg);
    // sisa de la musculosa: hombro en piel
    const shc = at(0.97, -1);
    o += `<circle cx="${f(shc[0])}" cy="${f(shc[1])}" r="5.2" fill="${C.skin}"/>`;
    return o;
  }
  function head(J) {
    const N = J.neck, Hd = J.head, S = J.sh, v = norm(sub(Hd, N)), fw = [-v[1], v[0]];
    let o = path(limb(S, N, [[0, 4.4], [1, 3.8]], [[0, 4.2], [1, 3.6]]), C.skinD);
    const c = addv(Hd, mul(v, 1.2)), rot = Math.atan2(v[1], v[0]) * 180 / Math.PI;
    const P = (a, b) => addv(addv(c, mul(v, a)), mul(fw, b));
    // cara
    o += `<ellipse cx="${f(c[0])}" cy="${f(c[1])}" rx="11.2" ry="9.4" transform="rotate(${f(rot)} ${f(c[0])} ${f(c[1])})" fill="${C.skin}"/>`;
    const jaw = P(-7.6, 5.6); o += `<circle cx="${f(jaw[0])}" cy="${f(jaw[1])}" r="3.4" fill="${C.skin}"/>`;
    const nose = P(-1.2, 9.6); o += `<circle cx="${f(nose[0])}" cy="${f(nose[1])}" r="1.9" fill="${C.skin}"/>`;
    // pelo: casquete atrás y arriba, y colita
    const h1 = P(-3, -10), h2 = P(9.5, -6), h3 = P(11.8, 3.5), h4 = P(7.2, 7.2), h5 = P(5.6, 1.5), h6 = P(2, -2.6), h7 = P(-4, -6);
    o += path(`M${f(h1[0])} ${f(h1[1])}Q${f(P(5, -13)[0])} ${f(P(5, -13)[1])} ${f(h2[0])} ${f(h2[1])}Q${f(P(13.5, -2)[0])} ${f(P(13.5, -2)[1])} ${f(h3[0])} ${f(h3[1])}Q${f(P(11.5, 7.8)[0])} ${f(P(11.5, 7.8)[1])} ${f(h4[0])} ${f(h4[1])}Q${f(h5[0])} ${f(h5[1])} ${f(h6[0])} ${f(h6[1])}Q${f(P(0, -6)[0])} ${f(P(0, -6)[1])} ${f(h7[0])} ${f(h7[1])}Z`, C.hair);
    const pt = P(6, -11.5), pt2 = P(1, -15.5);
    o += path(`M${f(pt[0])} ${f(pt[1])}Q${f(P(4, -16)[0])} ${f(P(4, -16)[1])} ${f(pt2[0])} ${f(pt2[1])}Q${f(P(-1, -12)[0])} ${f(P(-1, -12)[1])} ${f(P(1.5, -9.5)[0])} ${f(P(1.5, -9.5)[1])}Z`, C.hair);
    // oreja, ojo, boca
    const ear = P(0.5, -1.5); o += `<ellipse cx="${f(ear[0])}" cy="${f(ear[1])}" rx="2.2" ry="2.8" transform="rotate(${f(rot)} ${f(ear[0])} ${f(ear[1])})" fill="${C.skinD}"/>`;
    const eye = P(1.6, 6.2); o += `<circle cx="${f(eye[0])}" cy="${f(eye[1])}" r="1.05" fill="${C.hair}"/>`;
    const br1 = P(4.1, 4.6), br2 = P(4.4, 8); o += `<path d="M${f(br1[0])} ${f(br1[1])}L${f(br2[0])} ${f(br2[1])}" stroke="${C.hair}" stroke-width="1" stroke-linecap="round"/>`;
    const m1 = P(-5.4, 6.2), m2 = P(-5.2, 8.4); o += `<path d="M${f(m1[0])} ${f(m1[1])}L${f(m2[0])} ${f(m2[1])}" stroke="${C.lip}" stroke-width="1.1" stroke-linecap="round"/>`;
    return o;
  }
  function svg(J, vb) {
    const gx = (J.toeL[0] + J.ankleL[0] + J.toeR[0] + J.ankleR[0]) / 4;
    let o = `<ellipse cx="${f(gx)}" cy="1.5" rx="26" ry="3.2" fill="${C.shadow}"/>`;
    o += arm(J, 'L', true) + leg(J, 'L', true) + torso(J) + leg(J, 'R', false) + head(J) + arm(J, 'R', false);
    return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg"><line x1="-90" y1="2" x2="120" y2="2" stroke="#2a2e37" stroke-width="2.4" stroke-linecap="round"/>${o}</svg>`;
  }
  return { svg };
})();
