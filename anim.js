'use strict';
/* =========================================================
   Animaciones de ejercicios
   - Figura articulada: cada postura se define por ángulos de
     torso, brazos y piernas. La figura se apoya sola en el suelo.
   - Si existe media/<nombre>.mp4 o .gif se usa ese archivo.
   Ángulos en grados: 0 = abajo, 90 = derecha, 180 = arriba, -90 = izquierda.
   ========================================================= */
const Anim = (() => {
  const LEN = { torso: 52, neck: 8, head: 11, ua: 27, fa: 25, th: 38, sh: 37, ft: 11 };
  const R = Math.PI / 180;
  const dir = a => [Math.sin(a * R), Math.cos(a * R)];
  const add = (p, a, l) => { const d = dir(a); return [p[0] + d[0] * l, p[1] + d[1] * l]; };

  /* ---------- posturas base ---------- */
  const m = (b, o) => ({ ...b, ...o });
  // de pie, vista lateral (mira a la derecha). L = lado lejano
  const S0 = { v: 's', t: 180, hd: 0, uL: -6, fL: -2, uR: 6, fR: 14, tL: -2, sL: -2, tR: 2, sR: 2, pL: 90, pR: 90 };
  // de pie, vista frontal. L = izquierda de la pantalla
  const F0 = { v: 'f', t: 180, hd: 0, uL: -14, fL: -8, uR: 14, fR: 8, tL: -6, sL: -4, tR: 6, sR: 4, pL: -90, pR: 90 };
  const swapS = p => m(p, { supL: p.supL === 'L' ? 'R' : p.supL === 'R' ? 'L' : p.supL, kAL: p.kAR, kAR: p.kAL, kLL: p.kLR, kLR: p.kLL, kSL: p.kSR, kSR: p.kSL, uL: p.uR, fL: p.fR, uR: p.uL, fR: p.fL, tL: p.tR, sL: p.sR, tR: p.tL, sR: p.sL, pL: p.pR, pR: p.pL });
  const mirF = p => m(p, { uL: -p.uR, fL: -p.fR, uR: -p.uL, fR: -p.fL, tL: -p.tR, sL: -p.sR, tR: -p.tL, sR: -p.sL, pL: -p.pR, pR: -p.pL, t: 360 - p.t, dx: -(p.dx || 0) });
  const air = (p, a = 20) => m(p, { air: a });
  const ARMS_UP = { uL: 172, fL: 176, uR: 178, fR: 184 };
  const ARMS_FWD = { uL: 92, fL: 92, uR: 98, fR: 98 };
  const GUARD = { uL: 30, fL: 165, uR: 38, fR: 170 };

  // lateral
  const SQ = m(S0, { t: 148, ...ARMS_FWD, tL: 74, sL: -26, tR: 78, sR: -22 });
  const SQH = m(S0, { t: 160, ...ARMS_FWD, tL: 45, sL: -18, tR: 48, sR: -15 });
  const SQD = m(S0, { sup: 1, t: 125, uL: 12, fL: 6, uR: 18, fR: 10, tL: 104, sL: -38, tR: 108, sR: -34 });
  const KNEE_R = m(S0, { tR: 100, sR: 4, pR: 90 });
  const KNEE_L = m(S0, { anc: 'ankleR', tL: 100, sL: 4, pL: 90 });
  const RUN_R = m(KNEE_R, { uL: 45, fL: 125, uR: -40, fR: 50 });
  const RUN_L = m(KNEE_L, { uR: 45, fR: 125, uL: -40, fL: 50 });
  const LUNGE = m(S0, { tL: 86, sL: 2, tR: -24, sR: -98, pR: 20, uL: -12, fL: -6, uR: 12, fR: 20 });
  const LUNGE_F = m(S0, { tL: 88, sL: 6, tR: -26, sR: -100, pR: 20, uL: -12, fL: -6, uR: 12, fR: 20, t: 176 });
  const HINGE = m(S0, { t: 95, hd: -10, uL: 0, fL: 0, uR: 4, fR: 4, tL: -2, sL: 0, tR: -96, sR: -94, pR: 0 });
  const PL_H = { v: 's', sup: 1, t: 109, hd: -12, uL: -2, fL: 0, uR: 2, fR: 2, tL: -71, sL: -71, tR: -71, sR: -71, pL: 10, pR: 10 };
  const PL_L = { v: 's', sup: 1, t: 102, hd: -10, uL: 0, fL: 90, uR: 2, fR: 92, tL: -78, sL: -78, tR: -78, sR: -78, pL: 5, pR: 5 };
  // abajo: codos atrás, pecho a ras del suelo y misma distancia manos-pies que arriba (no se desliza)
  const PU_DN = m(PL_H, { t: 90.5, hd: -4, uL: -110, fL: 34, uR: -107, fR: 37, tL: -89.5, sL: -89.5, tR: -90.5, sR: -90.5, pL: -8, pR: -8 });
  // rodillas apoyadas: espinillas y empeines planos en el suelo
  const PL_K = { v: 's', t: 109, hd: -12, uL: -2, fL: 0, uR: 2, fR: 2, tL: -28, sL: -90, pL: -90, tR: -29, sR: -91, pR: -91 };
  const PU_KDN = m(PL_K, { t: 89, hd: -4, tL: -69, tR: -70, uL: -114, fL: 13, uR: -111, fR: 16 });
  // plancha baja con los codos donde estaban las manos (arriba-abajo sin que se deslicen los apoyos)
  const UPL = { v: 's', sup: 1, t: 89, hd: -8, uL: 0, fL: 90, uR: 2, fR: 92, tL: -66, sL: -66, tR: -66, sR: -66, pL: 15, pR: 15 };
  const UPL_HALF = { v: 's', t: 80, hd: -8, uL: 0, fL: 90, uR: -22, fR: 84, tL: -69, sL: -69, tR: -70, sR: -70, pL: 12, pR: 12 };
  const KPL = { v: 's', t: 81, hd: -6, uL: 0, fL: 90, uR: 2, fR: 92, tL: -27, sL: -90, pL: -90, tR: -28, sR: -91, pR: -91 };
  const MC_R = m(PL_H, { supL: 'L', tR: 60, sR: -100, pR: -30 });
  const MC_L = m(PL_H, { supL: 'R', tL: 60, sL: -100, pL: -30 });
  const PIKE = m(PL_H, { t: 54, hd: 18, uL: 54, fL: 54, uR: 56, fR: 56, tL: -36, sL: -36, tR: -37, sR: -37, pL: 90, pR: 90 });
  // abajo: codos doblados y cabeza casi al suelo; manos y pies en el mismo sitio (calculado)
  const PIKE_DN = m(PIKE, { t: 53, hd: 2, uL: 40, fL: 78, uR: 42, fR: 80, tL: -34, sL: -34, tR: -35, sR: -36, pL: 81, pR: 81 });
  const FOLD = m(S0, { t: 55, hd: 25, uL: 28, fL: 28, uR: 30, fR: 30 });
  const WALK = m(PL_H, { t: 60, hd: 15, uL: 60, fL: 60, uR: 62, fR: 62, tL: -46, sL: -46, tR: -47, sR: -47, pL: 40, pR: 40 });
  const TUCK = m(S0, { tL: 78, sL: -32, tR: 80, sR: -30, uL: 160, fL: 170, uR: 164, fR: 174 });
  const LIE = { v: 's', t: -90, hd: 0, uL: 90, fL: 90, uR: 92, fR: 92, tL: 90, sL: 90, tR: 92, sR: 92, pL: 180, pR: 180 };
  const LIE_K = m(LIE, { tL: 140, sL: 32, tR: 143, sR: 35, pL: 90, pR: 90 });
  const CRUNCH = m(LIE_K, { t: -125, uL: 118, fL: 118, uR: 122, fR: 122 });
  const SITUP = m(LIE_K, { t: -172, uL: 110, fL: 110, uR: 114, fR: 114 });
  const TABLE = m(LIE, { tL: 180, sL: 90, tR: 178, sR: 92, pL: 180, pR: 180, uL: 90, uR: 92 });
  const PRONE = { v: 's', t: 90, hd: 0, uL: 90, fL: 90, uR: 92, fR: 92, tL: -90, sL: -90, tR: -92, sR: -92, pL: 0, pR: 0 };
  // brazos por arriba (no atraviesan el suelo): ángulos con una vuelta menos
  const PRONE_REL = { v: 's', free: 1, t: 90, hd: 14, uL: -278, fL: -276, uR: -277, fR: -275, tL: -90, sL: -90, tR: -91, sR: -91, pL: -55, pR: -56 };
  // a medio salto entre plancha y cuclillas: cadera alta, rodillas recogidas, pies en el aire
  const HOP_IN = { v: 's', t: 101, hd: -12, uL: 0, fL: 0, uR: 4, fR: 4, tL: 60, sL: -70, pL: 30, tR: 62, sR: -68, pR: 32 };
  const PRONE_FLAT = { v: 's', t: 90, hd: 12, uL: -128, fL: 16, uR: -125, fR: 18, tL: -90, sL: -90, tR: -91, sR: -91, pL: -55, pR: -56 };
  const SUPER = m(PRONE, { t: 108, hd: 8, uL: 116, fL: 116, uR: 118, fR: 118, tL: -110, sL: -110, tR: -112, sR: -112, pL: -60, pR: -60 });
  const QUAD = { v: 's', sup: 1, t: 106, hd: -10, uL: 0, fL: 0, uR: 3, fR: 3, tL: 0, sL: -90, tR: 3, sR: -88, pL: -90, pR: -90 };
  const SEAT = { v: 's', t: -170, hd: 0, uL: 150, fL: 150, uR: 154, fR: 154, tL: 135, sL: 60, tR: 138, sR: 62, pL: 90, pR: 90 };
  const BRIDGE_DN = m(LIE_K, {});
  const BRIDGE_UP = m(LIE_K, { t: -66, tL: 104, sL: 2, tR: 106, sR: 4, uL: 90, fL: 90, uR: 92, fR: 92 });
  const CRAB_DN = { v: 's', t: -168, hd: 0, uL: -22, fL: -20, uR: -18, fR: -16, tL: 132, sL: 20, tR: 135, sR: 22, pL: 90, pR: 90 };
  const CRAB_UP = m(CRAB_DN, { t: -92, uL: -4, fL: -2, uR: 0, fR: 2, tL: 92, sL: 2, tR: 94, sR: 4 });
  const DIP_UP = { v: 's', t: 176, hd: 0, uL: -28, fL: -8, uR: -24, fR: -4, tL: 88, sL: 4, tR: 90, sR: 6, pL: 90, pR: 90 };
  const DIP_DN = m(DIP_UP, { uL: -118, fL: 8, uR: -114, fR: 12, tL: 72, sL: -6, tR: 74, sR: -4 });
  // plancha lateral de frente: apoyo en el antebrazo de abajo (R, se dibuja delante); L = brazo y pierna de arriba
  const SIDEPL = { v: 'f', sup: 1, t: 108, hd: 0, uR: 2, fR: 92, uL: 178, fL: 180, tL: -70, sL: -70, tR: -72, sR: -72, pL: -12, pR: -14 };
  const SIDEPL_H = m(SIDEPL, { t: 116, uR: 2, fR: 2 });
  const SIDEPL_M = m(SIDEPL, { t: 102, tL: -48, sL: -100, tR: -50, sR: -102, kSL: 0.3, kSR: 0.3, pL: -100, pR: -102 });
  const SIDE_LY = { v: 'f', t: -90, hd: 0, uL: -92, fL: -92, uR: 92, fR: 96, tL: 90, sL: 90, tR: 91, sR: 91, pL: 180, pR: 180 };
  const SIDE_ADD = m(SIDE_LY, { tR: 120, sR: 0, pR: 90 }); // pierna de arriba flexionada, pie en el suelo delante
  // frontal
  const FW = m(F0, { tL: -20, sL: -14, tR: 20, sR: 14 });
  const F_SUMO = m(F0, { tL: -72, sL: -12, tR: 72, sR: 12, uL: 30, fL: 140, uR: -30, fR: -140 });
  const F_SQ = m(F0, { tL: -40, sL: 12, tR: 40, sR: -12, uL: 30, fL: 140, uR: -30, fR: -140 });
  const F_JACK = m(F0, { tL: -24, sL: -26, tR: 24, sR: 26, uL: -150, fL: -170, uR: 150, fR: 170 });
  const F_STAR = m(F0, { tL: -34, sL: -34, tR: 34, sR: 34, uL: -128, fL: -132, uR: 128, fR: 132 });
  const F_T = m(F0, { uL: -90, fL: -90, uR: 90, fR: 90 });
  const F_SL = m(F0, { t: 186, tL: -72, sL: -6, tR: 48, sR: 48, uL: 30, fL: 140, uR: -30, fR: -140 });
  const F_SKATE = m(F0, { t: 168, tL: 10, sL: -10, tR: -30, sR: -60, uL: 60, fL: 40, uR: -20, fR: -40 });
  const F_CURTSY = m(F0, { tL: -28, sL: 14, tR: -24, sR: -46, pR: -40, uL: 30, fL: 140, uR: -30, fR: -140 });
  const F_SEAT_BF = { v: 'f', t: 180, hd: 0, uL: -10, fL: 20, uR: 10, fR: -20, tL: -72, sL: 100, tR: 72, sR: -100, pL: 180, pR: 180 };

  /* ---------- plantillas: lista de posturas + duración del ciclo ---------- */
  const k = (keys, ms, extra) => ({ keys, ms, ...(extra || {}) });
  const T = {
    stand: () => k([S0, m(S0, { t: 178 })], 3000),
    squat: () => k([S0, SQ], 2200),
    squat_deep: () => k([S0, SQD], 2400),
    squat_pulse: () => k([SQ, m(SQ, { t: 150, tL: 64, sL: -24, tR: 68, sR: -20 })], 600),
    // abajo los brazos siguen la línea del tronco (no quedan por detrás de la cabeza)
    squat_up: () => k([m(S0, ARMS_UP), m(SQ, { uL: 156, fL: 160, uR: 162, fR: 166 })], 2400),
    squat_jump: () => k([S0, SQ, air(m(S0, ARMS_UP), 24)], 1500),
    squat_jump_kick: () => k([S0, SQ, air(m(S0, { ...ARMS_UP, sL: -150, sR: -150, tL: 10, tR: 12, pL: -150, pR: -150 }), 24)], 1500),
    squat_knee: () => k([SQ, m(KNEE_R, { uL: 60, fL: 160, uR: 70, fR: 165 }), SQ, m(KNEE_L, { uL: 60, fL: 160, uR: 70, fR: 165 })], 3000),
    squat_knee_jump: () => k([SQ, air(m(KNEE_R, ARMS_UP), 22), SQ, air(m(KNEE_L, ARMS_UP), 22)], 2000),
    squat_kick: () => k([F_SQ, m(F0, { tR: 72, sR: 74, uL: 30, fL: 140, uR: -30, fR: -140 }), F_SQ, m(F0, { tL: -72, sL: -74, uL: 30, fL: 140, uR: -30, fR: -140 })], 3000),
    squat_swing: () => k([m(SQ, { uL: -60, fL: -50, uR: -55, fR: -45 }), m(S0, ARMS_UP)], 1800),
    squat_twist: () => k([SQ, m(KNEE_R, { uL: 130, fL: 30, uR: 60, fR: 150 })], 2000),
    sumo: () => k([FW, F_SUMO], 2400),
    sumo_jump: () => k([F_SUMO, air(m(F0, { tL: -6, sL: -6, tR: 6, sR: 6, ...{ uL: -30, fL: -20, uR: 30, fR: 20 } }), 24)], 1500),
    sumo_circles: () => k([m(F_SUMO, { uL: -80, fL: -80, uR: 80, fR: 80 }), m(F_SUMO, { uL: -100, fL: -100, uR: 100, fR: 100 })], 700),
    wall_sit: () => k([m(S0, { tL: 90, sL: 0, tR: 92, sR: 2, uL: 40, fL: 90, uR: 44, fR: 92 }), m(S0, { t: 179, tL: 90, sL: 0, tR: 92, sR: 2, uL: 40, fL: 90, uR: 44, fR: 92 })], 3000, { props: ['wall_back'], anchor: 'sh' }),
    wall_march: () => k([m(S0, { tL: 90, sL: 0, tR: 90, sR: 0, uL: 40, fL: 90, uR: 44, fR: 92 }), m(S0, { tL: 90, sL: 0, tR: 115, sR: 20, uL: 40, fL: 90, uR: 44, fR: 92 })], 1400, { props: ['wall_back'], anchor: 'sh' }),
    lunge: () => k([S0, LUNGE], 2400),
    lunge_alt: () => k([S0, LUNGE, S0, swapS(LUNGE)], 4000),
    lunge_fwd: () => k([S0, LUNGE_F], 2400, { anchor: 'ankleR' }),
    lunge_kick: () => k([LUNGE, m(S0, { tR: 100, sR: 92, pR: 120 })], 2000),
    lunge_knee: () => k([LUNGE, m(KNEE_R, { uL: 45, fL: 125, uR: -30, fR: 40 })], 2000),
    lunge_knee_jump: () => k([LUNGE, air(m(KNEE_R, ARMS_UP), 20)], 1600),
    lunge_twist: () => k([S0, m(LUNGE_F, { uL: 70, fL: 120, uR: 110, fR: 60 })], 2600, { anchor: 'ankleR' }),
    lunge_touch: () => k([S0, m(LUNGE, { t: 150, uR: 10, fR: 10 })], 2400),
    lunge_jump: () => k([LUNGE, air(m(S0, { tL: 10, sL: -10, tR: 0, sR: -20, uL: 150, fL: 160, uR: 154, fR: 164 }), 30), swapS(LUNGE), air(m(S0, { tR: 10, sR: -10, tL: 0, sL: -20, uL: 150, fL: 160, uR: 154, fR: 164 }), 30)], 2400, { anchor: 'hip' }),
    lunge_pendulum: () => k([LUNGE_F, S0, LUNGE], 3200),
    side_lunge: () => k([FW, F_SL], 2400, { anchor: 'ankleL' }),
    side_lunge_alt: () => k([FW, F_SL, FW, mirF(F_SL)], 4000),
    side_lunge_touch: () => k([FW, m(F_SL, { t: 200, uR: -20, fR: -10 }), FW, mirF(m(F_SL, { t: 200, uR: -20, fR: -10 }))], 4000),
    curtsy: () => k([F0, F_CURTSY], 2400, { anchor: 'ankleL' }),
    deadlift: () => k([S0, HINGE], 2800, { anchor: 'ankleL' }),
    balance: () => k([m(KNEE_R, { uL: 60, fL: 80, uR: -60, fR: -80 }), m(KNEE_R, { t: 177, uL: 66, fL: 86, uR: -56, fR: -74 })], 2400, { anchor: 'ankleL' }),
    // de pie sobre la pierna lejana; la mano contraria baja hasta el pie (profundo, pierna libre en T)
    reach: () => k([S0, m(S0, { tR: -12, sR: -50, pR: 70 }), m(S0, { t: 45, hd: -15, tL: 22, sL: -12, tR: -132, sR: -132, pR: -40, uL: -40, fL: -10, uR: -56, fR: -26 }), m(S0, { tR: -12, sR: -50, pR: 70 })], 3400, { anchor: 'ankleL' }),
    // la mano contraria baja solo hasta la espinilla (inclinación moderada, pierna libre doblada detrás)
    reach_shin: () => k([m(S0, { tR: -12, sR: -50, pR: 20 }), m(S0, { t: 62, hd: -8, tL: 8, sL: -4, tR: -45, sR: -110, pR: -30, uL: -20, fL: -10, uR: -52, fR: -54 })], 2400, { anchor: 'ankleL' }),
    calf: () => k([S0, m(S0, { pL: 40, pR: 40 })], 1400),
    jacks: () => { const mid = m(F0, { tL: -15, sL: -15, tR: 15, sR: 15, uL: -95, fL: -100, uR: 95, fR: 100 }); return k([F0, air(mid, 12), F_JACK, air(mid, 12)], 1400); },
    jacks_step: () => k([F0, m(F0, { tR: 26, sR: 26, uL: -150, fL: -170, uR: 150, fR: 170 }), F0, m(F0, { tL: -26, sL: -26, uL: -150, fL: -170, uR: 150, fR: 170 })], 2400),
    jacks_clap: () => {
      // aplauso delante del pecho (brazos hacia la cámara, se ven cortos) y brazos en cruz al abrir las piernas
      const shut = m(F0, { uL: -12, fL: 107, uR: 12, fR: -107, kAL: 0.68, kAR: 0.68 });
      const open = m(F_JACK, { uL: -90, fL: -90, uR: 90, fR: 90 });
      const mid = m(F0, { tL: -15, sL: -15, tR: 15, sR: 15, uL: -70, fL: -60, uR: 70, fR: 60, kAL: 0.8, kAR: 0.8 });
      return k([shut, air(mid, 12), open, air(mid, 12)], 1400); },
    star: () => k([F_SQ, air(F_STAR, 26)], 1400),
    star_jacks: () => { const mid = m(F0, { tL: -18, sL: -18, tR: 18, sR: 18, uL: -80, fL: -80, uR: 80, fR: 80 }); return k([F0, air(mid, 16), F_STAR, air(mid, 16)], 1500); },
    squat_jacks: () => k([F0, air(m(F0, { uL: 30, fL: 140, uR: -30, fR: -140 }), 8), F_SUMO], 1300),
    high_knees: () => k([air(RUN_R, 6), air(RUN_L, 6)], 650),
    high_knees_wide: () => k([air(m(RUN_R, { v: 'f', tR: 60, sR: 0, tL: -8, uL: -40, fL: -150, uR: 40, fR: 150 }), 6), air(m(RUN_L, { v: 'f', tL: -60, sL: 0, tR: 8, uL: -40, fL: -150, uR: 40, fR: 150 }), 6)], 650),
    march: () => { const pass = m(S0, { tL: 6, sL: -8, tR: 6, sR: -8, uL: 4, fL: 14, uR: 4, fR: 14 });
      const kR = m(KNEE_R, { tL: 4, sL: -6, uL: 40, fL: 110, uR: -30, fR: 30 }), kL = m(KNEE_L, { tR: 4, sR: -6, uR: 40, fR: 110, uL: -30, fL: 30 });
      return k([kR, pass, kL, pass], 1800); },
    march_swing: () => { const pass = m(S0, { tL: 4, sL: -6, tR: 4, sR: -6, uL: 2, fL: 8, uR: 2, fR: 8 });
      const kR = m(S0, { tR: 72, sR: -10, pR: 80, tL: 3, sL: -6, uL: 100, fL: 115, uR: -45, fR: -35 }), kL = m(S0, { anc: 'ankleR', tL: 72, sL: -10, pL: 80, tR: 3, sR: -6, uR: 100, fR: 115, uL: -45, fL: -35 });
      return k([kR, pass, kL, pass], 1800); },
    jog: () => k([air(m(S0, { tR: 30, sR: -40, tL: -14, sL: -60, uL: 40, fL: 120, uR: -30, fR: 40 }), 5), air(m(S0, { tL: 30, sL: -40, tR: -14, sR: -60, uR: 40, fR: 120, uL: -30, fL: 40 }), 5)], 650),
    quick_feet: () => k([air(m(SQH, { tR: 55, sR: -10 }), 4), air(m(SQH, { tL: 55, sL: -10 }), 4)], 320),
    tuck: () => k([SQ, air(m(S0, { tL: 110, sL: -10, tR: 112, sR: -8, uL: 70, fL: 120, uR: 76, fR: 126 }), 30)], 1300),
    rockstar: () => k([SQH, air(m(S0, { t: 186, tL: -20, sL: -120, tR: -18, sR: -118, pL: -115, pR: -113, ...ARMS_UP }), 26)], 1300),
    jump_turn: () => k([SQ, air(m(S0, ARMS_UP), 28), m(SQ, { t: 212, uL: -92, fL: -92, uR: -98, fR: -98, tL: -74, sL: 26, tR: -78, sR: 22, pL: -90, pR: -90 }), air(m(S0, { ...ARMS_UP, pL: -90, pR: -90 }), 28)], 2400, { noFix: true }),
    lateral: () => k([m(F_SQ, { dx: -26 }), air(m(F0, { tL: -10, tR: 10, uL: -60, fL: -30, uR: 60, fR: 30 }), 18), m(F_SQ, { dx: 26 }), air(m(F0, { tL: -10, tR: 10, uL: -60, fL: -30, uR: 60, fR: 30 }), 18)], 1600),
    lateral_touch: () => k([m(F_SQ, { dx: -26, t: 160, uR: -10, fR: -10 }), air(m(F0, { uL: -60, fL: -30, uR: 60, fR: 30 }), 18), mirF(m(F_SQ, { dx: -26, t: 160, uR: -10, fR: -10 })), air(m(F0, { uL: -60, fL: -30, uR: 60, fR: 30 }), 18)], 1800),
    skier: () => k([m(F0, { dx: -18, t: 172, tL: 10, sL: -10, tR: 14, sR: -6 }), air(F0, 10), m(F0, { dx: 18, t: 188, tL: -14, sL: 6, tR: -10, sR: 10 }), air(F0, 10)], 1200),
    skater: () => k([m(F_SKATE, { dx: -24 }), air(F0, 10), mirF(m(F_SKATE, { dx: -24 })), air(F0, 10)], 1600),
    skater_step: () => k([m(F_SKATE, { dx: -14 }), F0, mirF(m(F_SKATE, { dx: -14 })), F0], 2200),
    burpee: o => {
      // de pie y en cuclillas se fijan los pies; en el suelo, las manos
      const H = p => m(p, { ancPrev: 'handR' }), F = p => m(p, { ancPrev: 'ankleL' });
      const keys = [S0, SQD, H(HOP_IN), H(PL_H)];
      if (o.push) keys.push(H(PU_DN), H(PL_H));
      // tumbado del todo y manos despegadas hacia delante (se distingue de la flexión)
      if (o.flat) keys.push(H(PRONE_FLAT), m(PRONE_REL, { ancPrev: 'hip' }), m(PRONE_FLAT, { ancPrev: 'hip' }), H(PL_H));
      // toque de hombros en la plancha, una mano y la otra
      if (o.touch) keys.push(H(m(PL_H, { uL: 8, fL: 170 })), H(PL_H), H(m(PL_H, { uR: 10, fR: 172 })), H(PL_H));
      keys.push(H(HOP_IN), H(SQD));
      if (o.jump && o.tuck) keys.push(F(air(m(S0, { ...ARMS_UP, pL: 40, pR: 40 }), 10)), F(air(m(S0, { tL: 112, sL: -8, tR: 114, sR: -6, uL: 60, fL: 118, uR: 66, fR: 124, pL: 60, pR: 60 }), 34)), F(SQH));
      else if (o.jump) keys.push(F(air(m(S0, ARMS_UP), 26)));
      return k(keys, 620 * keys.length, { anchor: 'ankleL', hands: true });
    },
    plank: () => k([PL_H, m(PL_H, { t: 110, tL: -70, sL: -70, tR: -70, sR: -70 })], 3000, { anchor: 'handR' }),
    plank_low: () => k([PL_L, m(PL_L, { t: 103 })], 3000, { anchor: 'elbowR' }),
    plank_knees_drop: () => k([PL_H, { v: 's', t: 123, hd: -16, uL: -2, fL: 0, uR: 2, fR: 2, tL: -56, sL: -101, pL: -24, tR: -57, sR: -102, pR: -25 }], 1800, { anchor: 'handR' }),
    plank_low_drop: () => k([PL_L, m(PL_L, { sup: 0, t: 106, tL: -73, sL: -103, pL: -14, tR: -74, sR: -104, pR: -15 })], 1800, { anchor: 'elbowR' }),
    plank_leg: () => k([PL_H, m(PL_H, { tR: -112, sR: -112, pR: -60 }), PL_H, m(PL_H, { tL: -112, sL: -112, pL: -60 })], 2600, { anchor: 'handR' }),
    plank_limbs: () => k([PL_H, m(PL_H, { anc: 'handR', uL: 100, fL: 100, tR: -110, sR: -110, pR: -60, supL: 'L' }), PL_H, m(PL_H, { uR: 100, fR: 100, tL: -110, sL: -110, pL: -60, supL: 'R' })], 3000, { anchor: 'handL' }),
    plank_jacks: () => k([PL_H, air(m(PL_H, { tL: -60, sL: -60, tR: -72, sR: -72 }), 6)], 800, { anchor: 'handR' }),
    plank_jump: () => k([PL_H, HOP_IN, { v: 's', t: 111, hd: -14, uL: 0, fL: 0, uR: 2, fR: 2, tL: 89, sL: -28, pL: 90, tR: 91, sR: -26, pR: 92 }, HOP_IN], 1600, { anchor: 'handR', hands: true }),
    plank_reach: () => k([PL_L, m(PL_L, { uR: 92, fR: 92 }), PL_L, m(PL_L, { uL: 92, fL: 92 })], 2600, { anchor: 'toeL' }),
    plank_low_crunch: () => k([PL_L, m(PL_L, { t: 64, hd: 10, tL: -56, sL: -56, tR: -58, sR: -58, pL: 40, pR: 40 })], 1800, { anchor: 'elbowR' }),
    plank_low_knee: () => k([PL_L, m(PL_L, { tR: 50, sR: -40 }), PL_L, m(PL_L, { tL: 50, sL: -40 })], 1800, { anchor: 'elbowR' }),
    plank_low_tap: () => k([TOPL, m(TOPL, { tR: -124, sR: -124 }), TOPL, m(TOPL, { tL: -56, sL: -56 })], 1800, { anchor: 'sh', anchorY: 'sh', ground: false }),
    climbers: () => k([MC_R, MC_L], 600, { anchor: 'handR' }),
    climbers_slow: () => k([PL_H, m(MC_R, { tR: 58, sR: -10 }), PL_H, m(MC_L, { tL: 58, sL: -10 })], 2200, { anchor: 'handR' }),
    climbers_double: () => { const a = m(PL_H, { supL: 'L', tR: 80, sR: -96, pR: -60 }), b = m(PL_H, { supL: 'L', tR: 42, sR: -104, pR: -70 });
      return k([PL_H, a, b, a, PL_H, swapS(a), swapS(b), swapS(a)], 3200, { anchor: 'handR' }); },
    climbers_both: () => k([PL_H, m(PL_H, { tL: 18, sL: -72, tR: 20, sR: -70, pL: 20, pR: 22 })], 1200, { anchor: 'handR', hands: true }),
    pushup: () => k([PL_H, PU_DN], 2000, { anchor: 'handR' }),
    pushup_knee: () => k([PL_K, PU_KDN], 2000, { anchor: 'handR' }),
    pushup_plyo: () => k([PL_H, PU_DN, air(PL_H, 14)], 1400, { anchor: 'handR' }),
    pushup_knee_plyo: () => k([PL_K, PU_KDN, m(PL_K, { t: 124, uL: 14, fL: 24, uR: 16, fR: 26 })], 1400, { anchor: 'kneeL', hands: false }),
    pushup_tap: () => k([PL_H, PU_DN, PL_H, m(PL_H, { uL: 8, fL: 170 }), PL_H, m(PL_H, { uR: 10, fR: 172 })], 3600, { anchor: 'handR', hands: true }),
    pushup_knee_tap: () => k([PL_K, PU_KDN, PL_K, m(PL_K, { uL: 8, fL: 170 }), PL_K, m(PL_K, { uR: 10, fR: 172 })], 3600, { anchor: 'handR' }),
    pushup_side: () => k([PL_H, PU_DN, PL_H, m(PL_H, { t: 112, uR: 180, fR: 180 })], 3600, { anchor: 'handL', trail: ['handR'] }),
    pushup_knee_side: () => k([PL_K, PU_KDN, PL_K, m(PL_K, { t: 113, uR: 180, fR: 180 })], 3600, { anchor: 'handL', trail: ['handR'] }),
    pushup_limb: () => k([PL_H, PU_DN, m(PL_H, { uL: 100, fL: 100, tR: -110, sR: -110, pR: -60, supL: 'L' })], 2400, { anchor: 'handR' }),
    pushup_jacks: () => k([PL_H, PU_DN], 1800, { anchor: 'handR', hands: true, badge: 'jacks' }),
    pushup_updown: () => k([PL_H, PU_DN, PL_H, UPL_HALF, UPL, UPL_HALF], 4200, { anchor: 'toeL', hands: true }),
    pushup_crawl: () => {
      // flexión y paso de cocodrilo (mano y pie contrarios), flexión y paso de vuelta
      const CR = { v: 's', t: 105, hd: -12, uL: -17, fL: -19, uR: 10, fR: 24, tL: -80, sL: -55, pL: 40, tR: -69, sR: -73, pR: -10 };
      const h = d => m(PL_H, { dx: d }), dn = d => m(PU_DN, { dx: d });
      return k([h(0), dn(0), h(0), m(CR, { dx: 15 }), h(30), dn(30), h(30), m(swapS(CR), { dx: 15 })], 5600, { anchor: 'hip', hands: true }); },
    pushup_wall: () => k([m(S0, { t: 162, hd: 0, uL: 100, fL: 100, uR: 102, fR: 102 }), m(S0, { t: 150, uL: 150, fL: 70, uR: 152, fR: 72 })], 2000, { props: ['wall_front'], anchor: 'ankleL' }),
    pike: () => k([PIKE, PIKE_DN], 2000, { anchor: 'handR' }),
    plank_dog: () => k([PL_H, PIKE], 2400, { anchor: 'handR' }),
    updown: () => k([UPL, UPL_HALF, PL_H, m(UPL_HALF, { uL: -22, fL: 84, uR: 2, fR: 92 })], 2800, { anchor: 'toeL', hands: true }),
    updown_knee: () => k([KPL, m(KPL, { uR: -24, fR: 84 }), PL_K, m(KPL, { uL: -24, fL: 84 })], 2800, { anchor: 'kneeL', hands: true }),
    inchworm: () => k([S0, FOLD, WALK, PL_H, WALK, FOLD], 5400, { anchor: 'ankleL' }),
    inchworm_tuck: () => k([S0, FOLD, WALK, PL_H, WALK, FOLD, SQ, air(TUCK, 30)], 6400, { anchor: 'ankleL' }),
    side_plank: () => k([SIDEPL, m(SIDEPL, { t: 111 })], 3000, { anchor: 'elbowR' }),
    side_plank_high: () => k([SIDEPL_H, m(SIDEPL_H, { t: 119 })], 3000, { anchor: 'handR' }),
    side_plank_mod: () => k([SIDEPL_M, m(SIDEPL_M, { t: 105 })], 3000, { anchor: 'elbowR' }),
    side_plank_mod_lift: () => k([m(SIDEPL_M, { sup: 0, t: 121, tR: -86, sR: -132, tL: -84, sL: -130, pL: -130, pR: -132 }), SIDEPL_M], 1800, { anchor: 'elbowR', trail: ['hip'] }),
    side_plank_mod_high: () => k([m(SIDEPL_M, { t: 112, uR: 2, fR: 2 }), m(SIDEPL_M, { t: 114, uR: 2, fR: 2 })], 3000, { anchor: 'handR' }),
    side_plank_leg: () => k([SIDEPL, m(SIDEPL, { tL: -112, sL: -112, pL: -150 })], 1800, { anchor: 'elbowR', trail: ['ankleL'] }),
    // pasar el brazo de arriba por debajo del cuerpo (gira el tronco) y volver a abrir hacia el techo
    side_plank_twist: () => k([SIDEPL, m(SIDEPL, { t: 104, uL: -40, fL: -50 })], 2200, { anchor: 'elbowR', trail: ['handL'] }),
    // codo de arriba (brazo estirado por encima de la cabeza) contra la rodilla de arriba
    side_plank_crunch: () => k([m(SIDEPL, { uL: 125, fL: 120 }), m(SIDEPL, { uL: -112, fL: 175, tL: -210, kLL: 0.55, sL: -118, pL: -150 })], 2000, { anchor: 'elbowR', trail: ['kneeL'] }),
    side_star: () => k([SIDEPL_H, m(SIDEPL_H, { tL: -118, sL: -118, pL: -150 })], 2400, { anchor: 'handR' }),
    crunch: () => k([LIE_K, CRUNCH], 1800, { anchor: 'ankleL' }),
    situp: () => k([LIE_K, SITUP], 2400, { anchor: 'ankleL' }),
    table_crunch: () => k([TABLE, m(TABLE, { t: -125, uL: 120, fL: 120, uR: 124, fR: 124 })], 1800, { anchor: 'hip' }),
    bicycle: () => k([m(LIE, { t: -118, uL: -140, fL: 60, uR: -136, fR: 64, tL: 155, sL: 60, tR: 100, sR: 100 }), m(LIE, { t: -118, uL: -140, fL: 60, uR: -136, fR: 64, tR: 155, sR: 60, tL: 100, sL: 100 })], 1200, { anchor: 'hip' }),
    bicycle_straight: () => k([m(LIE, { t: -118, uL: -140, fL: 60, uR: -136, fR: 64, tL: 160, sL: 160, tR: 100, sR: 100 }), m(LIE, { t: -118, uL: -140, fL: 60, uR: -136, fR: 64, tR: 160, sR: 160, tL: 100, sL: 100 })], 1400, { anchor: 'hip' }),
    leg_raise: () => k([m(LIE, { tL: 100, sL: 100, tR: 102, sR: 102 }), m(LIE, { tL: 178, sL: 178, tR: 180, sR: 180 })], 2400, { anchor: 'hip' }),
    reverse_crunch: () => k([TABLE, m(TABLE, { tL: 210, sL: 120, tR: 212, sR: 122 })], 1800, { anchor: 'sh' }),
    scissors: () => k([m(LIE, { t: -108, tL: 120, sL: 120, tR: 100, sR: 100 }), m(LIE, { t: -108, tR: 120, sR: 120, tL: 100, sL: 100 })], 700, { anchor: 'hip' }),
    tuck_crunch: () => k([m(SEAT, { t: -140, tL: 100, sL: 100, tR: 102, sR: 102, uL: 120, fL: 120, uR: 124, fR: 124 }), m(SEAT, { t: -168, tL: 150, sL: 80, tR: 152, sR: 82 })], 1800, { anchor: 'hip' }),
    vup: () => k([m(LIE, { uL: 270, fL: 270, uR: 272, fR: 272 }), m(LIE, { t: -145, uL: 140, fL: 140, uR: 142, fR: 142, tL: 145, sL: 145, tR: 147, sR: 147 })], 2000, { anchor: 'hip' }),
    vup_single: () => k([m(LIE, { uL: 270, fL: 270, uR: 272, fR: 272 }), m(LIE, { t: -145, uL: 140, fL: 140, uR: 142, fR: 142, tR: 145, sR: 145 })], 2000, { anchor: 'hip' }),
    twist_easy: () => k([m(SEAT, { uL: 60, fL: 20, uR: 64, fR: 24 }), m(SEAT, { uL: 150, fL: 175, uR: 154, fR: 178 })], 1200, { anchor: 'hip' }),
    twist_hard: () => k([m(SEAT, { t: -150, tL: 115, sL: 85, tR: 118, sR: 88, uL: 60, fL: 20, uR: 64, fR: 24 }), m(SEAT, { t: -150, tL: 115, sL: 85, tR: 118, sR: 88, uL: 150, fL: 175, uR: 154, fR: 178 })], 1100, { anchor: 'hip' }),
    wipers: () => k([m(LIE, { tL: 150, sL: 150, tR: 152, sR: 152, uL: -60, fL: -90 }), m(LIE, { tL: 205, sL: 205, tR: 207, sR: 207, uL: -60, fL: -90 })], 2200, { anchor: 'hip' }),
    deadbug: () => k([m(TABLE, { uL: 180, fL: 180, uR: 182, fR: 182 }), m(TABLE, { uL: 270, fL: 270, uR: 182, fR: 182, tR: 96, sR: 96 }), m(TABLE, { uL: 180, fL: 180, uR: 182, fR: 182 }), m(TABLE, { uR: 270, fR: 270, uL: 180, fL: 180, tL: 96, sL: 96 })], 3200, { anchor: 'hip' }),
    toe_touch: () => k([m(LIE, { uL: 270, fL: 270, uR: 272, fR: 272 }), m(LIE, { t: -130, uR: 160, fR: 160, tR: 170, sR: 170 })], 2000, { anchor: 'hip' }),
    superman: () => k([PRONE, SUPER], 2000, { anchor: 'hip' }),
    // de Y a W: los codos salen hacia los lados (brazo en escorzo) y bajan hacia la cintura, manos a la altura de la cabeza
    superman_pull: () => { const mid = m(SUPER, { uL: 178, kUL: 0.38, fL: 110, uR: 182, kUR: 0.38, fR: 114 }), w = m(SUPER, { uL: 246, kUL: 0.55, fL: 100, uR: 250, kUR: 0.55, fR: 104 });
      return k([SUPER, mid, w, mid], 2600, { anchor: 'hip' }); },
    bridge: () => k([BRIDGE_DN, BRIDGE_UP], 2000, { anchor: 'ankleL' }),
    bridge_single: () => k([m(BRIDGE_DN, { tR: 135, sR: 135 }), m(BRIDGE_UP, { tR: 120, sR: 120 })], 2000, { anchor: 'ankleL' }),
    bridge_march: () => k([BRIDGE_UP, m(BRIDGE_UP, { tR: 160, sR: 90 }), BRIDGE_UP, m(BRIDGE_UP, { tL: 160, sL: 90 })], 2400, { anchor: 'sh' }),
    crab: () => k([CRAB_DN, CRAB_UP], 2000, { anchor: 'handL' }),
    crab_single: () => k([m(CRAB_DN, { tR: 120, sR: 120 }), m(CRAB_UP, { tR: 100, sR: 100 })], 2000, { anchor: 'handL' }),
    reverse_plank: () => k([m(CRAB_DN, { tL: 92, sL: 92, tR: 94, sR: 94, t: -160 }), m(CRAB_DN, { t: -114, hd: 8, tL: 66, sL: 66, tR: 67, sR: 67, pL: 125, pR: 126, uL: -2, fL: 0, uR: 2, fR: 4 })], 2400, { anchor: 'handL' }),
    dip: () => k([DIP_UP, DIP_DN], 1800, { props: ['bench'], anchor: 'handL', anchorY: 'handL' }),
    quad: () => k([QUAD, m(QUAD, { t: 107 })], 3000, { anchor: 'handR' }),
    bird_dog: () => k([QUAD, m(QUAD, { anc: 'kneeR', supL: 'R', uR: 90, fR: 90, tL: -88, sL: -88, pL: -88 }), QUAD, m(QUAD, { supL: 'L', uL: 90, fL: 90, tR: -88, sR: -88, pR: -88 })], 3200, { anchor: 'kneeL' }),
    quad_knee: () => k([m(QUAD, { uR: 90, fR: 90, tL: -88, sL: -88, pL: -88 }), { v: 's', t: 104, hd: -6, uL: -3, fL: -3, uR: 0, fR: -45, tL: 70, sL: -77, pL: -77, tR: -2, sR: -92, pR: -92 }], 1800, { anchor: 'kneeR' }),
    donkey: () => k([QUAD, m(QUAD, { tR: -100, sR: -180, pR: -90 })], 1400, { anchor: 'kneeL' }),
    hydrant: () => k([QUAD, m(QUAD, { tR: -40, sR: -100 })], 1400, { anchor: 'kneeL' }),
    // gato: espalda redondeada hacia arriba y cabeza abajo; vaca: espalda hundida y mirada arriba
    cat_cow: () => k([QUAD, m(QUAD, { arch: -11, hd: -40 }), QUAD, m(QUAD, { arch: 9, hd: 38 })], 5200, { anchor: 'handR' }),
    abduction: () => k([SIDE_LY, m(SIDE_LY, { tR: 128, sR: 128 })], 1800, { anchor: 'hip' }),
    adduction: () => k([SIDE_ADD, m(SIDE_ADD, { tL: 116, sL: 116, pL: 206 })], 1800, { anchor: 'hip', farShade: true }),
    cross_over: () => k([LIE_K, m(LIE_K, { tL: 110, sL: 40, tR: 113, sR: 43 })], 2400, { anchor: 'sh' }),
    punches: () => k([m(S0, GUARD), m(S0, { ...GUARD, uR: 90, fR: 90 }), m(S0, GUARD), m(S0, { ...GUARD, uL: 90, fL: 90 })], 900),
    punches_cross: () => k([m(S0, GUARD), m(S0, { ...GUARD, t: 172, uR: 84, fR: 84, pR: 70 }), m(S0, GUARD), m(S0, { ...GUARD, t: 172, uL: 84, fL: 84 })], 1000),
    shadow: () => k([air(m(S0, GUARD), 4), m(S0, { ...GUARD, uR: 90, fR: 90 }), air(m(S0, GUARD), 4), m(S0, { ...GUARD, uL: 90, fL: 90 })], 800),
    arm_circles: () => k([m(F_T, { uL: -70, fL: -70, uR: 70, fR: 70 }), m(F_T, { uL: -90, fL: -100, uR: 90, fR: 100 }), m(F_T, { uL: -110, fL: -110, uR: 110, fR: 110 }), m(F_T, { uL: -90, fL: -80, uR: 90, fR: 80 })], 1200),
    hip_open: () => k([S0, m(KNEE_R, { tR: 120, sR: 20 }), S0, m(KNEE_L, { tL: 120, sL: 20 })], 3200),
    // estiramientos
    child: () => { const C0 = { v: 's', t: 76, hd: 19, uL: 81, fL: 82, uR: 83, fR: 84, tL: 60, sL: -90, tR: 62, sR: -90, pL: -90, pR: -90 };
      return k([C0, m(C0, { t: 80, uL: 79, fL: 82, uR: 81, fR: 84 })], 4000, { anchor: 'kneeR' }); },
    butterfly: () => k([F_SEAT_BF, m(F_SEAT_BF, { tL: -64, tR: 64, sL: 94, sR: -94 })], 2400, { anchor: 'hip' }),
    calf_stretch: () => k([m(S0, { tL: 24, sL: 24, pL: 150, tR: -5, sR: -35, pR: 90 }), m(S0, { t: 150, tL: 29, sL: 29, pL: 150, tR: 10, sR: -40, pR: 90, uL: 40, fL: 60, uR: 44, fR: 64 })], 2400, { anchor: 'ankleR' }),
    hip_flexor: () => { const HF = { v: 's', t: 180, hd: 0, uL: -20, fL: 70, uR: -25, fR: 75, tL: 0, sL: -90, pL: -90, tR: 86, sR: 0, pR: 90 };
      return k([HF, m(HF, { t: 188, hd: -8, tL: -28, sR: 29, uL: 172, fL: 178 })], 3600, { anchor: 'kneeL' }); },
    figure4: () => {
      // tumbado de lado visto: tobillo cercano cruzado sobre la rodilla lejana; luego se sube la pierna lejana y se tira del muslo
      const A = m(LIE_K, { uL: 92, fL: 92, uR: 95, fR: 95, tR: 165, kLR: 0.6, sR: 114, kSR: 1.18, pR: 120 });
      const B = m(LIE_K, { t: -98, hd: -18, tL: 192, sL: 100, pL: 150, tR: 198, kLR: 0.6, sR: 138, kSR: 0.95, pR: 150, uL: 112, fL: 64, uR: 116, fR: 68 });
      return k([A, A, B, B], 4800, { anchor: 'hip', trail: ['kneeL'] }); },
    triceps: () => k([m(F0, { uR: 172, fR: -20, uL: -160, fL: 150 }), m(F0, { uR: 168, fR: -26, uL: -156, fL: 146 })], 3000),
    shoulder: () => k([m(F0, { uR: -84, fR: -88, uL: -30, fL: 90 }), m(F0, { uR: -90, fR: -94, uL: -34, fL: 86 })], 3000),
    quad_stretch: () => k([m(S0, { tR: -6, sR: -168, pR: -90, uR: -24, fR: -10, uL: 60, fL: 80 }), m(S0, { t: 178, tR: -10, sR: -170, pR: -90, uR: -26, fR: -12, uL: 64, fL: 84 })], 3000, { anchor: 'ankleL' }),
    pec: () => k([m(S0, { uR: -92, fR: -180 }), m(S0, { t: 175, uR: -100, fR: -184 })], 3000, { props: ['wall_back'], anchor: 'ankleL' }),
    hamstring: () => k([m(SEAT, { t: 182, tL: 92, sL: 92, tR: 94, sR: 94, uL: 100, fL: 100, uR: 104, fR: 104 }), m(SEAT, { t: 140, tL: 92, sL: 92, tR: 94, sR: 94, uL: 100, fL: 100, uR: 104, fR: 104 })], 3200, { anchor: 'hip' }),
    cobra: () => k([PRONE, m(PRONE, { t: 140, hd: 10, uL: 10, fL: 80, uR: 12, fR: 82 })], 3200, { anchor: 'hip' }),
  };

  /* ---------- ejercicio → plantilla ---------- */
  const MAP = {
    squats: 'squat', narrow_squats: 'squat_narrow', pulsing_squats: 'squat_pulse', overhead_squats: 'squat_up', frog_squats: 'squat_deep',
    jump_squats: 'squat_jump', forward_jump_squats: 'squat_jump_fwd', '180_jump_squats': 'jump_turn', '180_jumps': 'jump_turn_small',
    butt_kicker_jump_squats: 'squat_jump_kick', squat_to_high_knee: 'squat_knee', squat_to_high_knee_jumps: 'squat_knee_jump',
    squat_side_kick: 'squat_kick', squat_arm_swing: 'squat_swing', squat_knee_elbow_twist: 'squat_twist',
    plie_squats: 'sumo', plie_jump_squats: 'sumo_jump', plie_squat_arm_circles: 'sumo_circles', squat_jacks: 'squat_jacks', squat_stars: 'star',
    wall_sit: 'wall_sit', marching_wall_sit: 'wall_march',
    backward_lunges: 'lunge', walking_lunges: 'lunge_alt', forward_lunges: 'lunge_fwd', lunge_to_front_kick: 'lunge_kick',
    lunge_to_high_knee: 'lunge_knee', lunge_high_knee_jumps: 'lunge_knee_jump', lunge_twist: 'lunge_twist', touchdown_lunges: 'lunge_touch',
    jump_lunges: 'lunge_jump', scissor_switch: 'scissor', pendulum_lunges: 'lunge_pendulum',
    side_lunges: 'side_lunge', pivot_lunges: 'side_lunge_alt', side_lunge_touchdown: 'side_lunge_touch', curtsy_lunges: 'curtsy',
    single_leg_deadlift: 'deadlift', sl_balance: 'balance', sl_reach_foot: 'reach', sl_reach_shin: 'reach_shin',
    calf_raises: 'calf', outward_calf_raises: 'calf_out',
    jumping_jacks: 'jacks', mod_jumping_jacks: 'jacks_step', clap_jacks: 'jacks_clap', star_jacks: 'star_jacks',
    high_knees: 'high_knees', wide_high_knees: 'high_knees_wide', walking_high_knees: 'march', march_arm_swings: 'march_swing',
    jog_in_place: 'jog', quick_feet: 'quick_feet', squatting_quick_feet: 'quick_feet_deep', tuck_jumps: 'tuck', rockstars: 'rockstar',
    lateral_jumps: 'lateral', lateral_jump_touchdown: 'lateral_touch', skier_jumps: 'skier', speed_skaters: { combo: ['speed_skaters__a', 'speed_skaters__b'], labels: ['De lado', 'De frente'] },
    speed_skaters__a: 'skater_side', speed_skaters__b: 'skater',
    '4_count_burpees': ['burpee', {}], beginner_burpees: 'burpee_step', '6_count_burpees': ['burpee', { push: 1, jump: 1 }],
    flat_out_burpees: ['burpee', { flat: 1, jump: 1 }], flat_out_burpee_tuck_jumps: ['burpee', { flat: 1, jump: 1, tuck: 1 }],
    ultimate_burpees: ['burpee', { push: 1, touch: 1, jump: 1, tuck: 1 }],
    high_plank: 'plank', low_plank: 'plank_low', high_plank_knee_drops: 'plank_knees_drop', low_plank_knee_drops: 'plank_low_drop',
    high_plank_leg_lifts: 'plank_leg', high_plank_limb_raises: 'plank_limbs', high_plank_jacks: 'top_jacks', high_plank_jumping_jacks: 'top_star',
    high_plank_jumps: 'plank_jump', low_plank_arm_reaches: 'plank_reach', low_plank_crunches: 'plank_low_crunch', low_plank_twists: 'top_hip_twist',
    low_plank_knee_to_elbow: ['top_same', { low: 1 }], low_plank_knee_crosses: ['top_cross', { low: 1 }], low_plank_double_knee: 'plank_low_double',
    low_plank_jack_taps: 'plank_low_tap',
    mountain_climbers: 'climbers', wide_climber_twists: 'climber_wide', high_plank_knee_to_elbow: ['top_same', {}], high_plank_knee_crosses: ['top_cross', {}],
    high_plank_double_knee: 'climbers_double', skier_abs: { combo: ['skier_abs__a', 'skier_abs__b'], labels: ['De lado', 'Desde arriba'] },
    skier_abs__a: 'climbers_both', skier_abs__b: 'skier_top',
    push_ups: 'pushup', wide_push_ups: ['pushup_wide', {}], narrow_push_ups: ['pushup_narrow', {}], stagger_push_ups: ['pushup_stagger', {}], side_to_side_push_ups: ['pushup_sides', {}], narrow_to_wide_push_ups: 'pushup_plyo',
    knee_push_ups: 'pushup_knee', wide_knee_push_ups: ['pushup_wide', { knee: 1 }], narrow_knee_push_ups: ['pushup_narrow', { knee: 1 }], knee_stagger_push_ups: ['pushup_stagger', { knee: 1 }], knee_side_to_side_push_ups: ['pushup_sides', { knee: 1 }],
    knee_plyo_push_ups: 'pushup_knee_plyo', push_up_shoulder_taps: 'pushup_tap', knee_push_up_shoulder_taps: 'pushup_knee_tap',
    push_up_side_planks: 'pushup_side', knee_push_up_side_planks: 'pushup_knee_side', limb_raise_push_ups: 'pushup_limb', push_up_jacks: 'pushup_jacks',
    up_down_push_ups: 'pushup_updown', knee_up_down_push_ups: 'updown_knee_push', alligator_push_ups: 'pushup_crawl', inclined_wall_push_ups: 'pushup_wall',
    pull_ups: 'pullup', pike_push_ups: 'pike', plank_to_down_dog: 'plank_dog', up_downs: 'updown', commander_push_ups: 'commander', knee_up_downs: 'updown_knee',
    inchworms: 'inchworm', inchworm_tuck_jumps: 'inchworm_tuck',
    low_side_plank: 'side_plank', high_side_plank: 'side_plank_high', mod_low_side_plank: 'side_plank_mod', mod_high_side_plank: 'side_plank_mod_high',
    mod_low_side_plank_lifts: 'side_plank_mod_lift', low_side_plank_leg_lifts: 'side_plank_leg', low_side_plank_twists: 'side_plank_twist',
    side_plank_oblique_crunch: 'side_plank_crunch', side_star_plank: 'side_star',
    crunches: 'crunch', sit_ups: 'situp', table_top_crunches: 'table_crunch', bicycle_crunches: 'bicycle', straight_leg_bicycle_crunches: 'bicycle_straight',
    leg_raises: 'leg_raise', reverse_crunches: 'reverse_crunch', scissor_kicks: 'scissors', knee_tuck_crunches: 'tuck_crunch',
    v_ups: 'vup', wide_legged_v_ups: 'vup_wide', single_leg_v_up: 'vup_single', russian_twist_easy: { combo: ['russian_twist_easy__a', 'russian_twist_easy__b'], labels: ['De lado', 'De frente'] }, russian_twist_hard: { combo: ['russian_twist_hard__a', 'russian_twist_hard__b'], labels: ['De lado', 'De frente'] },
    russian_twist_easy__a: ['twist_side', {}], russian_twist_easy__b: ['twist_front', {}], russian_twist_hard__a: ['twist_side', { hard: 1 }], russian_twist_hard__b: ['twist_front', { hard: 1 }],
    windshield_wipers: 'wipers_front', beetle: 'deadbug', star_toe_touch: 'toe_touch', superman: 'superman', prone_x: 'top_x', superman_pull: 'superman_pull',
    wall_lateral_pull_downs: ['wall_pull', {}],
    bridge: 'bridge', single_leg_bridge: 'bridge_single', crab_bridge: 'crab', sl_crab_bridge: 'crab_single', reverse_plank: 'reverse_plank', triceps_dip: 'dip',
    quadruped_limb_raises: 'bird_dog', quadruped_knee_to_elbow: 'quad_knee', donkey_kicks: 'donkey', fire_hydrant: 'hydrant_rear', cat_cow: 'cat_cow',
    hip_abduction: 'abduction', hip_adduction: 'adduction', bent_leg_cross_overs: 'cross_front',
    punches: 'punches', crossing_punches: 'punch_cross_front', arm_circles_forward: 'circles_fwd', arm_circles_backward: 'circles_back', hip_openers: 'hip_open_front',
    childs_pose: 'child', cobblers_stretch: 'butterfly', dynamic_calf_stretch: 'calf_stretch', kneeling_hip_flexor_stretch: 'hip_flexor',
    lying_figure_4_stretch: 'figure4', overhead_triceps_stretch: 'triceps', shoulder_cross_stretch: 'shoulder', standing_quadriceps_stretch: 'quad_stretch',
    wall_pectoral_stretch: 'pec',
  };
  // dominadas de frente: colgado de una barra y subida con los codos hacia abajo
  T.pullup = () => { const hang = m(F0, { uL: -172, fL: -176, uR: 172, fR: 176, tL: -4, sL: 6, tR: 4, sR: -6, pL: -60, pR: 60 });
    const up = m(hang, { uL: -62, fL: -188, uR: 62, fR: 188, tL: -10, sL: 20, tR: 10, sR: -20 });
    return k([hang, up], 2200, { anchor: 'hip', anchorY: 'handL', ground: false, props: ['bar'] }); };
  T.wall_pull = () => k([m(F0, { uL: -152, fL: -166, uR: 152, fR: 166 }), m(F0, { uL: -104, fL: -172, uR: 104, fR: 172 })], 2000, { anchor: 'hip' });
  T.hamstring_seat = T.hamstring;

  /* ---------- variantes para distinguir ejercicios parecidos ---------- */
  // Flexiones vistas de frente (el cuerpo se aleja hacia atrás): se ve la anchura de las manos
  // de frente el cuerpo se aleja hacia atrás: las piernas se ven cortas y se calculan para llegar al suelo
  const PF = { v: 'f', t: 180, hd: 0, kT: 0.32, tL: -5, sL: -5, tR: 5, sR: 5, pL: -90, pR: 90 };
  const pf = (o, knee) => m(PF, { fit: knee ? 'knees' : 'legs', ...o });
  const PF_W_UP = { uL: -38, fL: -26, uR: 38, fR: 26 }, PF_W_DN = { kT: 0.06, uL: -100, fL: -28, uR: 100, fR: 28 };
  const PF_N_UP = { uL: 14, fL: 8, uR: -14, fR: -8 }, PF_N_DN = { kT: 0.06, uL: -6, fL: 40, uR: 6, fR: -40, kAL: 0.7, kAR: 0.7 };
  const PF_S_DN = { kT: 0.06, dx: -16, uL: -100, fL: -26, uR: 62, fR: 58 };
  // Todas las flexiones se ven de lado; la variante se indica con un esquema de las manos (vista desde arriba)
  const pushSide = (o, ms, extra) => { const up = o.knee ? PL_K : PL_H, dn = o.knee ? PU_KDN : PU_DN; return k([up, dn], ms || 2000, { anchor: 'handR', ...(extra || {}) }); };
  T.pushup_wide = o => pushSide(o, 2000, { badge: 'wide' });
  T.pushup_narrow = o => pushSide(o, 2000, { badge: 'narrow' });
  // lado a lado: baja hacia una mano, sube, baja hacia la otra (el esquema muestra hacia dónde va el pecho)
  T.pushup_sides = o => { const up = o.knee ? PL_K : PL_H, dn = o.knee ? PU_KDN : PU_DN; return k([up, dn, up, dn], 4000, { anchor: 'handR', badge: 'sides' }); };
  // escalonadas: una mano adelantada (vista lateral)
  T.pushup_stagger = o => {
    // una mano adelantada; cada repetición cambia de mano
    const up = o.knee ? PL_K : PL_H, dn = o.knee ? PU_KDN : PU_DN;
    const uA = m(up, { uL: -8, fL: -8, uR: 9, fR: 9 }), uB = m(up, { uL: 9, fL: 9, uR: -8, fR: -8 });
    const dA = o.knee ? m(dn, { uL: -113, fL: -4, uR: -100, fR: 39 }) : m(dn, { uL: -117, fL: 11, uR: -85, fR: 67 });
    const dB = o.knee ? m(dn, { uL: -100, fL: 39, uR: -113, fR: -4 }) : m(dn, { uL: -85, fL: 67, uR: -117, fR: 11 });
    return k([uA, dA, uA, uB, dB, uB], 4400, { anchor: o.knee ? 'kneeL' : 'toeL', hands: !o.knee, badge: 'stagger' });
  };

  // Vista cenital (desde arriba) de plancha: la cabeza a la derecha, brazos hacia los lados
  const TOP = { v: 't', t: 90, hd: 0, uL: 10, fL: 10, uR: 170, fR: 170, kAL: 0.55, kAR: 0.55, tL: -84, sL: -86, tR: -96, sR: -94, pL: -90, pR: -90 };
  const TOPL = m(TOP, { uL: 30, fL: 90, uR: 150, fR: 90, kAL: 0.7, kAR: 0.7 }); // sobre antebrazos
  const top = (o, keys, ms, extra) => k(keys, ms, { anchor: 'sh', anchorY: 'sh', ground: false, ...(extra || {}) });
  T.top_jacks = () => top({}, [TOP, m(TOP, { tL: -58, sL: -58, tR: -122, sR: -122 })], 900);
  T.top_star = () => top({}, [TOP, m(TOP, { tL: -50, sL: -40, tR: -130, sR: -140, t: 90 }), TOP, m(TOP, { tL: -40, sL: -110, tR: -140, sR: -70 })], 1600);
  T.top_cross = o => { const b = o.low ? TOPL : TOP; return top({}, [b, m(b, { tR: 40, sR: -80, kLR: 0.9 }), b, m(b, { tL: -220, sL: -100, kLL: 0.9 })], 2000); };
  T.top_same = o => { const b = o.low ? TOPL : TOP; return top({}, [b, m(b, { tR: -210, sR: -110, kLR: 0.9 }), b, m(b, { tL: 30, sL: -70, kLL: 0.9 })], 2000); };
  T.top_hip_twist = () => top({}, [m(TOPL, { t: 78, tL: -70, sL: -72, tR: -84, sR: -84 }), m(TOPL, { t: 102, tL: -96, sL: -96, tR: -108, sR: -110 })], 1800);
  T.top_x = () => top({}, [{ v: 't', t: 90, hd: 0, uL: 30, fL: 30, uR: 150, fR: 150, tL: -60, sL: -60, tR: -120, sR: -120, pL: -60, pR: -120 },
    { v: 't', t: 90, hd: 0, uL: 48, fL: 48, uR: 132, fR: 132, kAL: 0.86, kAR: 0.86, kLL: 0.9, kLR: 0.9, tL: -72, sL: -72, tR: -108, sR: -108, pL: -72, pR: -108 }], 1800);

  // planchas con rodilla por un lado (vista lateral) y doble rodilla
  T.plank_low_double = () => { const a = m(PL_L, { supL: 'L', tR: 80, sR: -96, pR: -60 }), b = m(PL_L, { supL: 'L', tR: 42, sR: -104, pR: -70 });
    // a medio camino la rodilla pasa por fuera (muslo en escorzo) para no rozar el suelo
    const mid = m(PL_L, { supL: 'L', tR: 10, kLR: 0.45, sR: -100, pR: -70 });
    return k([PL_L, mid, a, b, a, mid, PL_L, swapS(mid), swapS(a), swapS(b), swapS(a), swapS(mid)], 4400, { anchor: 'elbowR' }); };
  const CW = { v: 's', t: 106, hd: -12, uL: -2, fL: 0, uR: 2, fR: 2, tL: -69, sL: -69, pL: 12, tR: 89, sR: -2, pR: 90 };
  const CW_UP = m(CW, { t: 123, tR: 110, sR: -7, tL: -80, sL: -80, pL: 1, uL: 3, fL: 3, uR: 178, fR: 182 });
  T.climber_wide = () => k([PL_H, CW, CW_UP, CW, PL_H, m(swapS(CW), { anc: 'toeR' }), m(swapS(CW_UP), { anc: 'toeR' }), m(swapS(CW), { anc: 'toeR' })], 4400, { anchor: 'toeL', hands: true });

  // sentadilla cerrada de frente (pies juntos)
  T.squat_narrow = () => k([m(F0, { hw: 3, tL: 0, sL: 0, tR: 0, sR: 0, uL: -6, fL: -4, uR: 6, fR: 4 }), m(F0, { hw: 3, tL: -14, sL: 10, tR: 14, sR: -10, kLL: 0.38, kLR: 0.38, kSL: 2.3, kSR: 2.3, uL: 30, fL: 40, uR: -30, fR: -40, kAL: 0.5, kAR: 0.5 })], 2200);
  // patinador visto de lado: cae sobre una pierna flexionada, la otra cruza por detrás, brazos alternos
  const SK_L = m(S0, { t: 150, hd: -6, tL: 42, sL: -18, pL: 90, tR: -38, sR: -82, pR: 20, uL: 62, fL: 84, uR: -42, fR: -20 });
  T.skater_side = () => k([SK_L, air(m(S0, { t: 166, tL: 14, sL: -12, tR: 12, sR: -14, uL: 10, fL: 30, uR: 8, fR: 28 }), 14), m(swapS(SK_L), { anc: 'ankleR' }), air(m(S0, { t: 166, tL: 14, sL: -12, tR: 12, sR: -14, uL: 10, fL: 30, uR: 8, fR: 28 }), 14)], 1600);
  // esquiador en plancha visto desde arriba: las dos rodillas saltan juntas hacia un lado y luego al otro
  T.skier_top = () => top({}, [TOP, m(TOP, { t: 86, tR: -204, sR: -112, kLR: 0.85, tL: -196, sL: -118, kLL: 0.85 }), TOP, m(TOP, { t: 94, tL: 24, sL: -68, kLL: 0.85, tR: 16, sR: -62, kLR: 0.85 })], 1600);
  // salto adelante: avanza y vuelve caminando
  T.squat_jump_fwd = () => k([SQ, air(m(S0, { ...ARMS_FWD, dx: 26, t: 165 }), 20), m(SQ, { dx: 52 }), m(S0, { dx: 52 }), m(S0, { dx: 26, tL: -20, sL: -20, tR: 20, sR: 20 })], 2600);
  T.jump_turn_small = () => k([SQH, air(m(S0, { uL: 60, fL: 40, uR: 64, fR: 44 }), 20), m(SQH, { t: 200, uL: -92, fL: -92, uR: -98, fR: -98, tL: -45, sL: 18, tR: -48, sR: 15, pL: -90, pR: -90 }), air(m(S0, { uL: -60, fL: -40, uR: -64, fR: -44, pL: -90, pR: -90 }), 20)], 2000, { noFix: true });
  // tijera alterna: zancadas cortas con saltito rápido
  const LUNGE_S = m(S0, { t: 176, tL: 68, sL: -10, tR: -22, sR: -78, pR: 22, uL: 30, fL: 60, uR: -20, fR: 0 });
  T.scissor = () => k([LUNGE_S, air(m(S0, { uL: 0, fL: 10, uR: 0, fR: 10 }), 8), swapS(LUNGE_S), air(m(S0, { uL: 0, fL: 10, uR: 0, fR: 10 }), 8)], 1100);
  // talones con puntas hacia fuera (de frente)
  const CO = m(F0, { tL: -12, sL: -8, tR: 12, sR: 8, pL: -100, pR: 100, uL: -40, fL: -10, uR: 40, fR: 10 });
  T.calf_out = () => k([CO, m(CO, { pL: -14, pR: 14 })], 1400);
  T.quick_feet_deep = () => k([air(m(SQ, { tR: 90, sR: -10 }), 4), air(m(SQ, { tL: 90, sL: -10 }), 4)], 320);
  // burpee para principiantes: pies atrás de uno en uno
  const BSTEP = { v: 's', t: 111, hd: -12, uL: 0, fL: 0, uR: 2, fR: 2, tL: 89, sL: -28, pL: 90, tR: -73, sR: -73, pR: 8 };
  const BMID = m(BSTEP, { tR: 89, sR: -28, pR: 90 });
  T.burpee_step = () => { const H = p => m(p, { ancPrev: 'handR' }); return k([S0, SQD, H(BMID), H(BSTEP), H(PL_H), H(BSTEP), H(BMID), H(SQD)], 6000, { anchor: 'ankleL', hands: true }); };
  T.commander = () => k([UPL, UPL_HALF, PL_H, m(UPL_HALF, { uL: -22, fL: 84, uR: 2, fR: 92 }), UPL, m(UPL_HALF, { uL: -22, fL: 84, uR: 2, fR: 92 }), PL_H, UPL_HALF], 4800, { anchor: 'toeL', hands: true });
  T.updown_knee_push = () => k([KPL, m(KPL, { uR: -24, fR: 84 }), PL_K, PU_KDN, PL_K, m(KPL, { uL: -24, fL: 84 })], 4000, { anchor: 'kneeL', hands: true });
  // V-up con piernas abiertas visto desde los pies
  T.vup_wide = () => k([{ v: 'f', t: 180, hd: 0, kT: 0.25, uL: -150, fL: -150, uR: 150, fR: 150, kAL: 0.4, kAR: 0.4, tL: -40, sL: -40, tR: 40, sR: 40, kLL: 0.3, kLR: 0.3, pL: -90, pR: 90 },
    { v: 'f', t: 180, hd: 0, kT: 0.75, uL: -184, fL: -184, uR: 184, fR: 184, tL: -150, sL: -150, tR: 150, sR: 150, pL: -150, pR: 150 }], 2000, { anchor: 'hip' });
  // círculos de brazos de perfil, con trayectoria y sentido
  const circ = dirn => { const ks = [0, 90, 180, 270, 360].map(a => m(S0, { uL: a * dirn - 8, fL: a * dirn - 8, uR: a * dirn, fR: a * dirn, kAL: 0.5, kAR: 0.5 })); return ks; };
  T.circles_fwd = () => k(circ(1), 1400, { open: true, trail: ['handR'] });
  T.circles_back = () => k(circ(-1), 1400, { open: true, trail: ['handR'] });
  // giro ruso de frente: manos de un lado a otro
  // giro ruso de frente (desde los pies): rodillas arriba, manos juntas que van a un lado y al otro de la cadera
  const RT = { v: 'f', t: 180, hd: 0, kT: 0.78, tL: -152, sL: -8, tR: 152, sR: 8, kLL: 0.55, kLR: 0.55, kSL: 1.12, kSR: 1.12, pL: -90, pR: 90 };
  T.twist_front = o => { const b = o.hard ? m(RT, { kSL: 0.6, kSR: 0.6, tL: -156, tR: 156 }) : RT;
    const L = m(b, { t: 172, uL: -45, fL: 5, uR: -38, fR: -38 });
    return k([L, mirF(L)], o.hard ? 1100 : 1300, { anchor: 'hip', anchorY: 'hip', trail: ['handR'], armsFront: true }); };
  // giro ruso de lado: sentado en V con el tronco atrás; las manos juntas van hacia un lado y al otro
  T.twist_side = o => { const b = o.hard ? { v: 's', t: -140, hd: -12, tL: 125, sL: 65, tR: 128, sR: 68, pL: 150, pR: 152 } : { v: 's', t: -140, hd: -12, tL: 140, sL: 15, tR: 143, sR: 17, pL: 100, pR: 102 };
    return k([m(b, { uL: 62, fL: 82, uR: 66, fR: 86 }), m(b, { uL: 48, fL: 66, uR: 52, fR: 70, kAL: 0.8, kAR: 0.8 })], o.hard ? 1100 : 1300); };
  // hidrante visto desde atrás: la rodilla se abre hacia el lado
  const QR = { v: 'f', t: 180, hd: 0, kT: 0.12, uL: -10, fL: -6, uR: 10, fR: 6, tL: -12, sL: 0, tR: 12, sR: 0, kSL: 0.25, kSR: 0.25, pL: -90, pR: 90 };
  T.hydrant_rear = () => k([QR, m(QR, { tR: 78, sR: 4, kSR: 0.95 })], 1500, { anchor: 'hip', anchorY: 'hip' });
  // limpiaparabrisas y cruce de piernas vistos desde los pies
  const LW = { v: 'f', t: 180, hd: 0, kT: 0.22, uL: -90, fL: -90, uR: 90, fR: 90, tL: 178, sL: 178, tR: 182, sR: 182, pL: 178, pR: 182 };
  T.wipers_front = () => k([m(LW, { tL: 125, sL: 125, tR: 128, sR: 128 }), m(LW, { tL: 232, sL: 232, tR: 235, sR: 235 })], 2400, { anchor: 'hip', anchorY: 'hip', trail: ['ankleR'], armsBack: true, legsFront: true });
  const CF = m(LW, { tL: 172, sL: 190, tR: 188, sR: 170, kSL: 0.7, kSR: 0.7 });
  T.cross_front = () => k([CF, m(CF, { tR: 236, sR: 208 }), CF, m(CF, { tL: 124, sL: 152 })], 3600, { anchor: 'hip', anchorY: 'hip', armsBack: true, legsFront: true });
  // golpes cruzados de frente
  const GF = m(F0, { uL: -28, fL: 150, uR: 28, fR: -150, tL: -14, sL: -8, tR: 14, sR: 8 });
  T.punch_cross_front = () => k([GF, m(GF, { t: 174, uR: -78, fR: -84, kAR: 0.85 }), GF, m(GF, { t: 186, uL: 78, fL: 84, kAL: 0.85 })], 1100, { armsFront: true });
  // apertura de cadera de frente: la rodilla sube y se abre (con trayectoria)
  T.hip_open_front = () => k([F0, m(F0, { tR: 160, sR: 10, kLR: 0.5 }), m(F0, { tR: 96, sR: 8, kLR: 0.95 }), F0], 2600, { anchor: 'ankleL', trail: ['kneeR'] });

  // ejercicios del coach que no están en los planes
  Object.assign(MAP, {});

  /* ---------- cinemática ---------- */
  const NUM = ['arch', 't', 'hd', 'uL', 'fL', 'uR', 'fR', 'tL', 'sL', 'tR', 'sR', 'pL', 'pR', 'air', 'dx'];
  // escalas de escorzo (1 = longitud normal): torso, brazos, piernas y espinillas por lado
  const SC = ['kT', 'kAL', 'kAR', 'kUL', 'kUR', 'kLL', 'kLR', 'kSL', 'kSR'];
  const sc = (p, k) => p[k] == null ? 1 : p[k];
  const wid = (p, k) => p[k] != null ? p[k] : p.v === 's' ? 0 : (k === 'sw' ? 8 : 6);
  function fk(p) {
    const J = {};
    J.hip = [0, 0];
    J.sh = add(J.hip, p.t, LEN.torso * sc(p, 'kT'));
    J.neck = add(J.sh, p.t + (p.hd || 0), LEN.neck);
    J.head = add(J.sh, p.t + (p.hd || 0), LEN.neck + LEN.head);
    // ancho de hombros y cadera (solo se ve de frente o desde arriba)
    const side = p.v === 't' ? -90 : 90;
    J.shL = add(J.sh, p.t + side, wid(p, 'sw')); J.shR = add(J.sh, p.t - side, wid(p, 'sw'));
    J.hipL = add(J.hip, p.t + side, wid(p, 'hw')); J.hipR = add(J.hip, p.t - side, wid(p, 'hw'));
    J.elbowL = add(J.shL, p.uL, LEN.ua * sc(p, 'kAL') * sc(p, 'kUL')); J.handL = add(J.elbowL, p.fL, LEN.fa * sc(p, 'kAL'));
    J.elbowR = add(J.shR, p.uR, LEN.ua * sc(p, 'kAR') * sc(p, 'kUR')); J.handR = add(J.elbowR, p.fR, LEN.fa * sc(p, 'kAR'));
    J.kneeL = add(J.hipL, p.tL, LEN.th * sc(p, 'kLL')); J.ankleL = add(J.kneeL, p.sL, LEN.sh * sc(p, 'kLL') * sc(p, 'kSL'));
    J.kneeR = add(J.hipR, p.tR, LEN.th * sc(p, 'kLR')); J.ankleR = add(J.kneeR, p.sR, LEN.sh * sc(p, 'kLR') * sc(p, 'kSR'));
    const flat = p.v === 'f' || p.v === 't';
    const fl = a => flat ? 6 + (p.v === 'f' ? 5 * Math.max(0, Math.cos(a * R)) : 0) : LEN.ft;
    J.toeL = add(J.ankleL, p.pL, fl(p.pL)); J.toeR = add(J.ankleR, p.pR, fl(p.pR));
    return J;
  }
  function lowest(J) {
    let y = J.head[1] + LEN.head;
    for (const k in J) if (k !== 'head' && k !== 'neck') y = Math.max(y, J[k][1] + 4.5);
    return y;
  }
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = t => t * t * (3 - 2 * t);

  const OLD = typeof ID_ALIAS === 'object' ? ID_ALIAS : {};
  const NEW2OLD = Object.fromEntries(Object.entries(OLD).map(([o, n]) => [n, o]));
  function build(id) {
    id = OLD[id] || id;
    const base = id.replace(/_(l|r)$/, '');
    let spec = MAP[id] || MAP[base] || 'stand';
    if (spec && spec.combo) return build(spec.combo[0]);
    const [name, opts] = Array.isArray(spec) ? spec : [spec, {}];
    const tpl = (T[name] || T.stand)(opts || {});
    const keys = tpl.keys.map(p => ({ ...p }));
    // piernas "a medida": de frente, desde la cadera hasta el suelo (o hasta las rodillas apoyadas)
    keys.forEach(p => {
      if (!p.fit) return;
      const J = fk({ ...p, kLL: 0.001, kLR: 0.001 }), hipH = lowest(J) - J.hip[1] - 4.5;
      if (p.fit === 'legs') { const k = Math.max(0.03, (hipH - 2) / (LEN.th + LEN.sh)); p.kLL = p.kLR = k; p.kSL = p.kSR = 1; }
      else { const k = Math.max(0.05, (hipH - 3) / LEN.th); p.kLL = p.kLR = k; p.tL = -12; p.tR = 12; p.sL = 172; p.sR = -172; p.kSL = p.kSR = Math.min(4, 12 / (LEN.sh * k)); }
    });
    // apoyo en manos y pies (planchas, flexiones, cuadrupedia, pike): torso y piernas giran juntos
    // sobre la cadera hasta que los apoyos delanteros y traseros quedan a la misma altura
    keys.forEach(p => {
      if (!p.sup) return;
      const ROT = ['t', 'tL', 'sL', 'tR', 'sR', 'pL', 'pR'];
      const ev = d => {
        const q = { ...p }; ROT.forEach(k => q[k] = (p[k] || 0) + d);
        const J = fk(q); let fr = -1e9, bk = -1e9;
        for (const sd of ['L', 'R']) {
          const h = J['hand' + sd], e = J['elbow' + sd], sh = J['sh' + sd];
          if (h[1] - sh[1] > 12 || e[1] - sh[1] > 12) fr = Math.max(fr, h[1] + 3.8, e[1] + 4.2);
          if (p.supL && p.supL !== sd) continue;
          bk = Math.max(bk, J['knee' + sd][1] + 5.6, J['ankle' + sd][1] + 3.8, J['toe' + sd][1] + 3.4);
        }
        return fr - bk;
      };
      let lo = -40, hi = 40, flo = ev(lo), fhi = ev(hi);
      if (!isFinite(flo) || !isFinite(fhi) || flo * fhi > 0) return;
      for (let it = 0; it < 30; it++) { const mid = (lo + hi) / 2, fm = ev(mid); if (fm * flo > 0) { lo = mid; flo = fm; } else hi = mid; }
      const d = (lo + hi) / 2; ROT.forEach(k => p[k] = (p[k] || 0) + d);
    });
    // de frente se centra en la cadera; de lado, el pie que queda fijo
    const anchor = tpl.anchor || (keys[0].v === 'f' ? 'hip' : 'ankleL');
    // desplazamientos por postura: apoyo en el suelo y punto de anclaje fijo
    const J0 = fk(keys[0]);
    const ax0 = J0[anchor][0], ay0 = J0[tpl.anchorY || anchor][1] - lowest(J0);
    keys.forEach((p, ki) => {
      const J = fk(p);
      p.ox = ax0 - J[p.anc || anchor][0] + (p.dx || 0);
      // apoyo heredado: la articulación queda donde estaba en la postura anterior
      if (p.ancPrev && ki > 0) { const q = keys[ki - 1], Jq = fk(q); p.ox = Jq[p.ancPrev][0] + q.ox - J[p.ancPrev][0]; }
      p.oy = tpl.anchorY ? ay0 - J[tpl.anchorY][1] : -lowest(J) - (p.air || 0);
    });
    const anim = { id, v: keys[0].v, keys, ms: tpl.ms, props: tpl.props || [], open: !!tpl.open, ground: tpl.ground !== false, anchorY: tpl.anchorY, badge: tpl.badge, hands: tpl.hands != null ? !!tpl.hands : !!keys[0].sup && /^(hand|elbow)/.test(anchor), armsBack: !!tpl.armsBack, legsFront: !!tpl.legsFront, armsFront: !!tpl.armsFront, farShade: !!tpl.farShade, noFix: !!tpl.noFix };
    // encuadre: recorre el ciclo y calcula la caja que ocupa
    let x0 = 1e9, x1 = -1e9, y0 = 1e9;
    for (let i = 0; i < 48; i++) {
      const J = pose(anim, i / 48);
      for (const k in J) { x0 = Math.min(x0, J[k][0]); x1 = Math.max(x1, J[k][0]); y0 = Math.min(y0, J[k][1]); }
      y0 = Math.min(y0, J.head[1] - LEN.head);
    }
    // trayectoria de una articulación con flecha de dirección
    anim.trails = (tpl.trail || []).map(jn => {
      const pts = []; for (let i = 0; i <= 60; i++) pts.push(pose(anim, i / 60 * (anim.open ? 0.999 : 1))[jn]);
      pts.forEach(q => { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); });
      return pts;
    });
    const J0w = pose(anim, 0);
    anim.propGeo = anim.props.map(pr => {
      if (pr === 'wall_back') { const x = Math.min(J0w.sh[0], J0w.hip[0], J0w.head[0] - LEN.head) - 9; x0 = Math.min(x0, x - 6); return { wall: x }; }
      if (pr === 'wall_front') { const x = Math.max(J0w.handL[0], J0w.handR[0]) + 8; x1 = Math.max(x1, x + 6); return { wall: x }; }
      if (pr === 'bar') { const y = Math.min(J0w.handL[1], J0w.handR[1]) - 2; return { bar: [x0 - 6, y, x1 + 6] }; }
      if (pr === 'bench') { const h = J0w.handL; return { bench: [h[0] - 22, h[1] + 5, 34] }; }
      return {};
    });
    const pad = 14, w = x1 - x0, h = 0 - y0, side = Math.max(w, h, 120) + pad * 2;
    anim.vb = [(x0 + x1) / 2 - side / 2, 10 - side, side, side];
    return anim;
  }
  function pose(anim, phase) {
    const p = blend(anim, phase);
    const J = fk(p);
    for (const k in J) J[k] = [J[k][0] + p.ox, J[k][1] + p.oy];
    return J;
  }

  /* ---------- interpolación suave entre posturas ----------
     En vez de ir en línea recta de una postura a la siguiente (y frenar en cada una),
     cada valor sigue una curva cúbica que pasa por todas las posturas del ciclo:
     solo frena donde cambia de sentido y fluye de largo cuando sigue en la misma dirección.
     Antebrazos, cabeza y pies llegan un poco después que el resto (inercia). */
  const LAG_KEYS = ['fL', 'fR', 'hd'];
  const ALL_KEYS = [...NUM, ...SC, 'sw', 'hw', 'ox', 'oy'];
  const getv = (q, k) => k === 'sw' || k === 'hw' ? wid(q, k) : SC.includes(k) ? sc(q, k) : (q[k] || 0);
  function hermite(P0, P1, P2, P3, u) {
    const tan = (a, b, c) => { const d0 = b - a, d1 = c - b; return d0 * d1 <= 1e-9 ? 0 : 2 / (1 / d0 + 1 / d1); };
    const m1 = tan(P0, P1, P2), m2 = tan(P1, P2, P3), u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * P1 + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * P2 + (u3 - u2) * m2;
  }
  function blendAt(anim, tm, keys) {
    const K = anim.keys, n = K.length, i = tm.i, u = tm.u, open = anim.open, out = {};
    const k0 = open ? K[Math.max(0, i - 1)] : K[(i - 1 + n) % n], k1 = K[i], k2 = K[(i + 1) % n], k3 = open ? K[Math.min(n - 1, i + 2)] : K[(i + 2) % n];
    for (const k of keys) {
      const P1 = getv(k1, k), P2 = getv(k2, k);
      // en los extremos de un movimiento abierto no se inventa velocidad
      const P0 = open && i === 0 ? P1 : getv(k0, k), P3 = open && i + 2 >= n ? P2 : getv(k3, k);
      out[k] = hermite(P0, P1, P2, P3, u);
    }
    return out;
  }
  // posición de una articulación en el mundo siguiendo la misma curva que el cuerpo
  function kwCurve(anim, KW, tm, j, ax) {
    const n = KW.length, i = tm.i, open = anim.open;
    const g = q => q[j][ax];
    const P1 = g(KW[i]), P2 = g(KW[(i + 1) % n]);
    const P0 = open ? (i === 0 ? P1 : g(KW[i - 1])) : g(KW[(i - 1 + n) % n]);
    const P3 = open ? (i + 2 >= n ? P2 : g(KW[i + 2])) : g(KW[(i + 2) % n]);
    return hermite(P0, P1, P2, P3, tm.u);
  }
  const nrmA = x => { x = ((x % 360) + 360) % 360; return x > 180 ? x - 360 : x; };
  function blend(anim, phase) {
    const tm = timing(anim, phase), p = { v: anim.keys[tm.i].v, ...blendAt(anim, tm, ALL_KEYS) };
    // tobillo dentro de su rango (vista lateral): ni el pie hacia la espinilla ni girado del todo
    if (p.v === 's' && !anim.noFix) for (const sd of ['L', 'R']) {
      const r = nrmA(p['p' + sd] - p['s' + sd] - 90);
      if (r > 42) p['p' + sd] -= r - 42; else if (r < -105) p['p' + sd] += -105 - r;
    }
    if (anim.lag == null) anim.lag = !anim.open && anim.keys.length > 1 && !anim.hands && !anim.keys.some(q => q.sup);
    if (anim.lag) Object.assign(p, blendAt(anim, timing(anim, phase - 0.035), LAG_KEYS));
    return p;
  }

  /* ---------- dibujo ---------- */
  const SEGS = [
    ['legL', 'hipL', 'kneeL'], ['legL', 'kneeL', 'ankleL'], ['footL', 'ankleL', 'toeL'],
    ['armL', 'shL', 'elbowL'], ['armL', 'elbowL', 'handL'],
    ['torso', 'hip', 'sh'], ['torso', 'shL', 'shR'], ['torso', 'hipL', 'hipR'], ['neck', 'sh', 'neck'],
    ['legR', 'hipR', 'kneeR'], ['legR', 'kneeR', 'ankleR'], ['footR', 'ankleR', 'toeR'],
    ['armR', 'shR', 'elbowR'], ['armR', 'elbowR', 'handR'],
  ];
  const HI = { l: ['legL', 'legR'], g: ['legL', 'legR'], c: ['torso'], a: ['armL', 'armR'], u: ['armL', 'armR', 'torso'] };
  const cache = new Map();
  const get = id => { if (!cache.has(id)) cache.set(id, build(id)); return cache.get(id); };
  const live = new Set();
  let raf = 0;
  const NS = 'http://www.w3.org/2000/svg';

  /* ---------- ritmo: pausa breve en cada postura, bajada más lenta ---------- */
  function timing(anim, phase) {
    const n = anim.keys.length, segs = anim.open ? n - 1 : n;
    let w = Array(segs).fill(1);
    if (segs === 2 && !anim.open) w = [1.25, 0.85]; // bajar despacio, subir más rápido
    const tot = w.reduce((a, b) => a + b, 0);
    let x = (((phase % 1) + 1) % 1) * tot, i = 0;
    while (i < segs - 1 && x > w[i]) { x -= w[i]; i++; }
    let u = Math.min(1, x / w[i]);
    if (anim.open) return { i, t: u, u };
    const hold = segs === 2 ? 0.06 : 0; // ida y vuelta: pausa breve arriba y abajo; con más posturas, fluye sin frenar
    u = Math.max(0, Math.min(1, (u - hold / 2) / (1 - hold)));
    return { i, t: 0.5 - Math.cos(u * Math.PI) / 2, u };
  }

  /* ---------- posturas en el mundo, precalculadas por clave ---------- */
  function world(anim, p) {
    const J = fk(p);
    for (const k in J) J[k] = [J[k][0] + p.ox, J[k][1] + p.oy];
    return J;
  }
  function keyWorlds(anim) {
    if (!anim._kw) anim._kw = anim.keys.map(p => world(anim, p));
    return anim._kw;
  }

  /* ---------- IK de dos huesos ---------- */
  function ik(root, mid, end, target, prefer) {
    const L1 = Math.hypot(mid[0] - root[0], mid[1] - root[1]);
    const L2 = Math.hypot(end[0] - mid[0], end[1] - mid[1]);
    let dx = target[0] - root[0], dy = target[1] - root[1];
    let d = Math.hypot(dx, dy);
    if (d < 1e-3 || L1 < 1e-3 || L2 < 1e-3) return null;
    const dc = Math.max(Math.abs(L1 - L2) + 0.01, Math.min(L1 + L2 - 0.01, d));
    const a = Math.acos(Math.max(-1, Math.min(1, (L1 * L1 + dc * dc - L2 * L2) / (2 * L1 * dc))));
    const base = Math.atan2(dy, dx);
    const c1 = [root[0] + Math.cos(base + a) * L1, root[1] + Math.sin(base + a) * L1];
    const c2 = [root[0] + Math.cos(base - a) * L1, root[1] + Math.sin(base - a) * L1];
    // mismo lado de flexión que la postura original (evita que el codo/rodilla salte de lado)
    const side = (q, e2) => Math.sign((q[0] - root[0]) * (e2[1] - root[1]) - (q[1] - root[1]) * (e2[0] - root[0]));
    const cross = (mid[0] - root[0]) * (end[1] - root[1]) - (mid[1] - root[1]) * (end[0] - root[0]);
    // si la articulación está casi recta el lado es ambiguo: se usa el lado preferido (rodilla delante, codo detrás…)
    const L = Math.hypot(end[0] - root[0], end[1] - root[1]) || 1;
    const want = Math.abs(cross) / L > 2.5 ? Math.sign(cross) : (prefer || Math.sign(cross) || 1);
    const pick = side(c1, target) === want ? c1 : side(c2, target) === want ? c2 :
      (Math.hypot(c1[0] - mid[0], c1[1] - mid[1]) < Math.hypot(c2[0] - mid[0], c2[1] - mid[1]) ? c1 : c2);
    const end2 = [root[0] + dx / d * dc, root[1] + dy / d * dc];
    return [pick, end2];
  }
  const CHAINS = [['hipL', 'kneeL', 'ankleL', 'toeL'], ['hipR', 'kneeR', 'ankleR', 'toeR'], ['shL', 'elbowL', 'handL'], ['shR', 'elbowR', 'handR']];

  function pose2(anim, phase) {
    const n = anim.keys.length, { i, t } = timing(anim, phase);
    const a = anim.keys[i], b = anim.keys[(i + 1) % n], p = blend(anim, phase), tmU = timing(anim, phase);
    anim._arch = p.arch;
    const J = world(anim, p);
    // entre dos posturas algo sigue tocando el suelo (salvo en los saltos)
    const KW0 = keyWorlds(anim), frontY = q => Math.max(q.handL[1], q.handR[1], q.elbowL[1], q.elbowR[1]), hd = q => frontY(q) > -9;
    const lying = q => q.sh[1] + 11 > -7 && q.hip[1] + 10.5 > -7;
    const onHands = anim.hands && hd(KW0[i]) && hd(KW0[(i + 1) % n]) && !(lying(KW0[i]) && lying(KW0[(i + 1) % n]));
    if (anim.ground && !anim.anchorY && (p.air || 0) < 0.5) {
      const off = onHands ? frontY(J) + 4.5 : lowest(J) + (p.air || 0); // >0 hundido, <0 flotando
      for (const k in J) J[k] = [J[k][0], J[k][1] - off];
    }
    const sstep = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
    // en planchas, entre dos posturas el cuerpo gira sobre las manos para que el apoyo de atrás siga en el suelo
    if ((onHands || (hd(KW0[i]) && hd(KW0[(i + 1) % n]) && p.v === 's')) && anim.ground && !anim.anchorY) {
      const legs = ['L', 'R'].filter(sd => !(a.supL && a.supL !== sd) && !(b.supL && b.supL !== sd));
      const backOf = (Jw, sd) => Math.max(Jw['knee' + sd][1] + 5.6, Jw['ankle' + sd][1] + 3.8, Jw['toe' + sd][1] + 3.4);
      const planted = sd => backOf(KW0[i], sd) > -3 && backOf(KW0[(i + 1) % n], sd) > -3 && Math.abs(KW0[i]['ankle' + sd][0] - KW0[(i + 1) % n]['ankle' + sd][0]) < 22;
      const use = legs.filter(planted);
      if (use.length) for (let it = 0; it < 3; it++) {
        const fr = ['handL', 'handR', 'elbowL', 'elbowR'].reduce((q, k) => J[k][1] > J[q][1] ? k : q, 'handL');
        const F = J[fr], Fs = F[1] + (fr.startsWith('hand') ? 3.8 : 4.2);
        let bs = -1e9, bx = 0;
        for (const sd of use) for (const [jn, r] of [['knee', 5.6], ['ankle', 3.8], ['toe', 3.4]]) { const q = J[jn + sd]; if (q[1] + r > bs) { bs = q[1] + r; bx = q[0]; } }
        const vx = bx - F[0];
        if (Math.abs(vx) < 20 || Math.abs(Fs - bs) < 0.05) break;
        const d = Math.max(-0.2, Math.min(0.2, (Fs - bs) / vx)), c = Math.cos(d), sn = Math.sin(d);
        for (const k in J) { const x = J[k][0] - F[0], y = J[k][1] - F[1]; J[k] = [F[0] + x * c - y * sn, F[1] + x * sn + y * c]; }
      }
    }
    // lado hacia el que se dobla cada rodilla/codo cuando está ambiguo
    const hv = [J.head[0] - J.neck[0], J.head[1] - J.neck[1]], hl = Math.hypot(hv[0], hv[1]) || 1, fw = [-hv[1] / hl, hv[0] / hl];
    const prefer = ch => {
      const root = J[ch[0]], end = J[ch[2]], isLeg = ch[0].startsWith('hip');
      let d;
      if (p.v === 's') d = isLeg ? fw : [-fw[0], -fw[1]];
      else d = [Math.sign(J[ch[0]][0] - J.hip[0]) || (ch[0].endsWith('L') ? -1 : 1), 0];
      const m = [(root[0] + end[0]) / 2 + d[0] * 5, (root[1] + end[1]) / 2 + d[1] * 5];
      return Math.sign((m[0] - root[0]) * (end[1] - root[1]) - (m[1] - root[1]) * (end[0] - root[0])) || 1;
    };
    // apoyos: lo que toca el suelo en las dos posturas no se desliza
    const KW = keyWorlds(anim), Ja = KW[i], Jb = KW[(i + 1) % n];
    for (const ch of CHAINS) {
      const e = ch[2];
      const low = (Jw, c) => Jw[c[2]][1] > -9 || (c[3] && Jw[c[3]][1] > -6);
      const ga = low(Ja, ch), gb = low(Jb, ch);
      const dxk = Math.abs(Ja[e][0] - Jb[e][0]);
      // free: en esa postura las manos/pies se mueven por el aire (no se arrastran por el suelo)
      if (!ga || !gb || a.free || b.free) {
        if (ch[3] && dxk > 22 && Math.abs(Ja[e][1] - Jb[e][1]) < dxk * 0.6 && anim.ground && (p.air || 0) < 0.5) {
          const need = Math.max(J[e][1] + 3.8, J[ch[3]][1] + 3.4) + 3 + 6 * Math.sin(Math.PI * t);
          if (need > 0 && need < 30) {
            const r = ik(J[ch[0]], J[ch[1]], J[e], [J[e][0], J[e][1] - need], prefer(ch));
            if (r) { const off = [J[ch[3]][0] - J[e][0], J[ch[3]][1] - J[e][1]]; J[ch[3]] = [r[1][0] + off[0], r[1][1] + off[1]]; J[ch[1]] = r[0]; J[e] = r[1]; }
          }
        }
        continue;
      }
      // apoyado en las dos posturas: si no cambia de sitio queda fijo; si cambia, da un paso en arco
      const lift = dxk > 22 ? Math.sin(Math.PI * t) * Math.min(16, 4 + dxk * 0.12) : 0;
      const target = [kwCurve(anim, KW, tmU, e, 0), kwCurve(anim, KW, tmU, e, 1) - lift];
      const r = ik(J[ch[0]], J[ch[1]], J[e], target, prefer(ch));
      if (!r) continue;
      if (ch[3]) { const off = [J[ch[3]][0] - J[e][0], J[ch[3]][1] - J[e][1]]; J[ch[3]] = [r[1][0] + off[0], r[1][1] + off[1]]; }
      J[ch[1]] = r[0]; J[e] = r[1];
    }
    if (onHands) for (const sd of ['L', 'R']) {
      const kOn = q => q['knee' + sd][1] + 5.6 > -3; // rodilla apoyada en la postura clave
      if (kOn(KW0[i]) && kOn(KW0[(i + 1) % n])) continue;
      const kn = J['knee' + sd], dy = kn[1] + 5.6 + 2.5;
      if (dy > 0) J['knee' + sd] = [kn[0], kn[1] - dy];
    }
    if (anim.ground) {
      const FLOOR = 0.5;
      const surfOf = ch => { const e = ch[2], tip = ch[3] || e, r = ch[3] ? 3.4 : 3.8; return Math.max(J[e][1] + 3.8, J[tip][1] + r); };
      // cuánto estaba apoyada cada mano/pie antes de corregir el cuerpo (0..1, continuo)
      const grounded = CHAINS.map(ch => 1 - sstep((FLOOR - surfOf(ch) - 1) / 3));
      // el cuerpo se apoya por su contorno: torso, cabeza, rodillas y codos no atraviesan el suelo
      const BODY_R = { hip: 9, sh: 9.2, hipL: 8.5, hipR: 8.5, shL: 7.5, shR: 7.5, head: 11, neck: 4, kneeL: 5.6, kneeR: 5.6, elbowL: 4.2, elbowR: 4.2 };
      let lift = 0;
      for (const k in BODY_R) if (J[k] && !(onHands && k.startsWith('knee'))) lift = Math.max(lift, J[k][1] + BODY_R[k] - FLOOR);
      if (lift > 0) for (const k in J) J[k] = [J[k][0], J[k][1] - lift];
      const liftW = sstep(lift / 2);
      // manos y pies: lo que atraviesa el suelo sube; lo que estaba apoyado vuelve a apoyarse
      CHAINS.forEach((ch, ci) => {
        const e = ch[2];
        const gap = FLOOR - surfOf(ch);
        let w;
        if (gap <= 0) w = 1;
        else w = grounded[ci] * liftW;
        if (w < 0.01 || Math.abs(gap) < 0.05) return;
        const res = ik(J[ch[0]], J[ch[1]], J[e], [J[e][0], J[e][1] + gap * w], prefer(ch));
        if (!res) return;
        const dx = res[1][0] - J[e][0], dy = res[1][1] - J[e][1];
        if (ch[3]) J[ch[3]] = [J[ch[3]][0] + dx, J[ch[3]][1] + dy];
        J[ch[1]] = res[0]; J[e] = res[1];
      });
    }
    if (p.v === 's' && !anim.noFix) fixBends(J);
    return J;
  }
  // si una rodilla o un codo queda doblado hacia el lado imposible, se refleja sobre la línea
  // que une sus extremos (mismas longitudes, mismos apoyos)
  const angOf = (a, b) => Math.atan2(b[0] - a[0], b[1] - a[1]) * 180 / Math.PI;
  function fixBends(J) {
    for (const [r, mI, e, sign, lim] of [['hipL', 'kneeL', 'ankleL', 1, -4], ['hipR', 'kneeR', 'ankleR', 1, -4], ['shL', 'elbowL', 'handL', -1, -6], ['shR', 'elbowR', 'handR', -1, -6]]) {
      const flex = nrmA((angOf(J[r], J[mI]) - angOf(J[mI], J[e])) * sign);
      // peso continuo: entra poco a poco pasado el límite y se apaga en dobleces muy cerrados (escorzos a propósito)
      const ss = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
      const w = ss((lim - flex) / 10) * ss((flex + 100) / 15);
      if (w < 0.001) continue;
      const A = J[r], B = J[e], M = J[mI], dx = B[0] - A[0], dy = B[1] - A[1], L2 = dx * dx + dy * dy;
      if (L2 < 1) continue;
      const t = ((M[0] - A[0]) * dx + (M[1] - A[1]) * dy) / L2, P = [A[0] + dx * t, A[1] + dy * t];
      const Rf = [2 * P[0] - M[0], 2 * P[1] - M[1]];
      J[mI] = [M[0] + (Rf[0] - M[0]) * w, M[1] + (Rf[1] - M[1]) * w];
    }
  }

  /* ---------- dibujo ---------- */
  const C = {
    skin: '#e8c3a6', skinFar: '#b8957c', shirt: '#ff5a36', shirtFar: '#c4472a',
    shorts: '#5b6474', shortsFar: '#3f4652', shoe: '#ff5a36', shoeFar: '#c4472a',
    hair: '#2b2f37', hot: '#ffd23f'
  };
  // segmentos: [grupo, desde, hasta, radio inicio, radio fin, capa]
  const PARTS = [
    ['legL', 'hipL', 'kneeL', 7.6, 5.6, 'far'], ['legL', 'kneeL', 'ankleL', 5.6, 3.8, 'far'], ['footL', 'ankleL', 'toeL', 3.8, 3.4, 'far'],
    ['armL', 'shL', 'elbowL', 4.6, 3.9, 'far'], ['armL', 'elbowL', 'handL', 4, 3.2, 'far'],
    ['torso', 'hip', 'sh', 9, 9.2, 'mid'], ['torso', 'hipL', 'hipR', 8.5, 8.5, 'mid'], ['torso', 'shL', 'shR', 7.5, 7.5, 'mid'],
    ['neck', 'sh', 'neck', 4, 4, 'mid'],
    ['legR', 'hipR', 'kneeR', 7.6, 5.6, 'near'], ['legR', 'kneeR', 'ankleR', 5.6, 3.8, 'near'], ['footR', 'ankleR', 'toeR', 3.8, 3.4, 'near'],
    ['armR', 'shR', 'elbowR', 4.6, 3.9, 'near'], ['armR', 'elbowR', 'handR', 4, 3.2, 'near'],
  ];
  function capsule(p, q, r1, r2) {
    // trapecio + un círculo en cada extremo (todo en un solo trazado)
    const dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1e-3;
    const nx = -dy / L, ny = dx / L, f = v => v.toFixed(1);
    const circ = (c, r) => `M${f(c[0] - r)} ${f(c[1])}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0Z`;
    return `M${f(p[0] + nx * r1)} ${f(p[1] + ny * r1)}L${f(q[0] + nx * r2)} ${f(q[1] + ny * r2)}L${f(q[0] - nx * r2)} ${f(q[1] - ny * r2)}L${f(p[0] - nx * r1)} ${f(p[1] - ny * r1)}Z` + circ(p, r1) + circ(q, r2);
  }
  const mixPt = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];


  // Esquema de la posición de las manos (vista desde arriba) en la esquina superior izquierda
  function badgeSVG(a) {
    const S = a.vb[2] * 0.26, x = a.vb[0] + a.vb[2] * 0.04, y = a.vb[1] + a.vb[3] * 0.05, cx = x + S / 2, cy = y + S / 2;
    const hand = (hx, hy) => `<ellipse cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" rx="${(S * 0.07).toFixed(1)}" ry="${(S * 0.11).toFixed(1)}" fill="#e8c3a6"/>`;
    const sh = `<rect x="${(cx - S * 0.2).toFixed(1)}" y="${(cy - S * 0.05).toFixed(1)}" width="${(S * 0.4).toFixed(1)}" height="${(S * 0.1).toFixed(1)}" rx="${(S * 0.05).toFixed(1)}" fill="#eef0f3" opacity=".9"/>`;
    let g = `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${S.toFixed(1)}" height="${S.toFixed(1)}" rx="${(S * 0.16).toFixed(1)}" fill="#1d2027" stroke="#2c303a" stroke-width="1.5"/>` + sh;
    const hy = cy + S * 0.22, arr = (x1, x2) => `<path d="M${x1.toFixed(1)} ${(cy - S * 0.26).toFixed(1)}H${x2.toFixed(1)}" stroke="#ff5a36" stroke-width="${(S * 0.05).toFixed(1)}" stroke-linecap="round" marker-end="none"/>` +
      `<path d="M${x2.toFixed(1)} ${(cy - S * 0.26).toFixed(1)}l${(Math.sign(x1 - x2) * S * 0.08).toFixed(1)} ${(-S * 0.07).toFixed(1)}v${(S * 0.14).toFixed(1)}z" fill="#ff5a36"/>`;
    if (a.badge === 'sides') g = g.replace('<rect x="' + (cx - S * 0.2).toFixed(1), '<rect class="bdg-sh" x="' + (cx - S * 0.2).toFixed(1));
    if (a.badge === 'wide') g += hand(cx - S * 0.38, hy) + hand(cx + S * 0.38, hy);
    else if (a.badge === 'narrow') g += hand(cx - S * 0.07, hy) + hand(cx + S * 0.07, hy);
    else if (a.badge === 'stagger') g += `<g class="bdg-a">${hand(cx - S * 0.2, hy - S * 0.16) + hand(cx + S * 0.2, hy + S * 0.06)}</g><g class="bdg-b" opacity="0">${hand(cx - S * 0.2, hy + S * 0.06) + hand(cx + S * 0.2, hy - S * 0.16)}</g>`;
    else if (a.badge === 'jacks') { const foot = (fx, fy) => `<ellipse cx="${fx.toFixed(1)}" cy="${fy.toFixed(1)}" rx="${(S * 0.06).toFixed(1)}" ry="${(S * 0.1).toFixed(1)}" fill="#ff5a36"/>`;
      g = g.replace(sh, '') + hand(cx - S * 0.14, cy - S * 0.3) + hand(cx + S * 0.14, cy - S * 0.3) + `<g class="bdg-ft">${foot(cx - S * 0.06, cy + S * 0.28)}${foot(cx + S * 0.06, cy + S * 0.28)}</g><g class="bdg-fo" opacity="0">${foot(cx - S * 0.3, cy + S * 0.28)}${foot(cx + S * 0.3, cy + S * 0.28)}</g>`; }
    else if (a.badge === 'sides') g += hand(cx - S * 0.36, hy) + hand(cx + S * 0.36, hy);
    return g;
  }
  // Dibujo de una figura: suelo, sombra, trayectorias, objetos (pared/banco) y cuerpo
  function svgFor(id, zone) {
    const a = get(id);
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', a.vb.join(' '));
    svg.setAttribute('class', 'fig');
    svg.setAttribute('aria-hidden', 'true');
    let html = a.ground ? `<line x1="${a.vb[0] + 4}" y1="2" x2="${a.vb[0] + a.vb[2] - 4}" y2="2" stroke="#2a2e37" stroke-width="3" stroke-linecap="round"/>` : '';
    a.trails.forEach(pts => {
      const d = 'M' + pts.map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('L');
      const i = Math.floor(pts.length * 0.3), q0 = pts[i], q1 = pts[i + 2], ang = Math.atan2(q1[1] - q0[1], q1[0] - q0[0]) * 180 / Math.PI;
      html += `<path d="${d}" fill="none" stroke="#ff5a36" stroke-opacity=".38" stroke-width="3" stroke-dasharray="2 6" stroke-linecap="round"/>` +
        `<path d="M-7 -6L5 0L-7 6Z" fill="#ff5a36" fill-opacity=".75" transform="translate(${q1[0].toFixed(1)} ${q1[1].toFixed(1)}) rotate(${ang.toFixed(0)})"/>`;
    });
    a.propGeo.forEach(g => {
      if (g.wall != null) html += `<line x1="${g.wall}" y1="4" x2="${g.wall}" y2="${a.vb[1] + 12}" stroke="#3a3f4a" stroke-width="5" stroke-linecap="round"/>`;
      if (g.bar) html += `<line x1="${g.bar[0].toFixed(1)}" y1="${g.bar[1].toFixed(1)}" x2="${g.bar[2].toFixed(1)}" y2="${g.bar[1].toFixed(1)}" stroke="#9aa0ab" stroke-width="4" stroke-linecap="round"/>`;
      if (g.bench) html += `<rect x="${g.bench[0]}" y="${g.bench[1]}" width="${g.bench[2]}" height="${Math.max(4, 3 - g.bench[1])}" rx="3" fill="#2a2e37"/>`;
    });
    // vista desde arriba: colchoneta debajo para que se entienda la perspectiva
    if (a.v === 't') html = `<rect x="${(a.vb[0] + a.vb[2] * 0.04).toFixed(1)}" y="${(a.vb[1] + a.vb[3] * 0.2).toFixed(1)}" width="${(a.vb[2] * 0.92).toFixed(1)}" height="${(a.vb[3] * 0.6).toFixed(1)}" rx="12" fill="#1d2027" stroke="#2c303a" stroke-width="2"/>` + html;
    if (a.badge) html += badgeSVG(a);
    svg.innerHTML = html + '<g class="body"></g>';
    const inst = { a, svg, g: svg.querySelector('.body'), shadow: svg.querySelector('.sh'), hot: new Set(HI[zone] || []), t0: performance.now() - Math.random() * 400, speed: 1 };
    draw(inst, performance.now());
    return inst;
  }
  function draw(inst, now) {
    const a = inst.a, ms = a.ms, el = ((((now - inst.t0) * inst.speed) % ms) + ms) % ms;
    const J = pose2(a, el / ms);
    const arch = a._arch || 0;
    const side = a.v === 's', top = a.v === 't';
    let html = '';
    const f1 = v => v.toFixed(1);
    const paint = (part, far) => {
      const [g, p, q, r1, r2] = part;
      const P = J[p], Q = J[q];
      if (/^arm/.test(g)) {
        if (q.startsWith('elbow')) {
          html += `<path d="${capsule(P, Q, r1, r2)}" fill="${far ? C.skinFar : C.skin}"/>`;
          html += `<path d="${capsule(P, mixPt(P, Q, 0.42), r1 + 0.3, r1 + 0.1)}" fill="${far ? C.shirtFar : C.shirt}"/>`;
        } else html += `<path d="${capsule(P, Q, r1, r2)}" fill="${far ? C.skinFar : C.skin}"/><circle cx="${f1(Q[0])}" cy="${f1(Q[1])}" r="3.8" fill="${far ? C.skinFar : C.skin}"/>`;
      } else if (/^leg/.test(g)) {
        html += `<path d="${capsule(P, Q, r1, r2)}" fill="${far ? C.skinFar : C.skin}"/>`;
        if (p.startsWith('hip')) html += `<path d="${capsule(P, mixPt(P, Q, 0.6), r1 + 0.7, r2 + 1.2)}" fill="${far ? C.shortsFar : C.shorts}"/>`;
      } else if (/^foot/.test(g)) {
        html += `<path d="${capsule(P, Q, r1, r2)}" fill="${far ? C.shoeFar : C.shoe}"/>`;
      } else if (g === 'torso') {
        if (p === 'hip') html += torsoSVG();
      } else if (g === 'neck') html += `<path d="${capsule(P, Q, r1, r2)}" fill="${C.skin}"/>`;
      // músculos que trabajan: franja naranja translúcida
      if (inst.hot.has(g) && !/^foot/.test(g) && g !== 'torso' && g !== 'neck') html += `<path d="${capsule(mixPt(P, Q, 0.12), mixPt(P, Q, 0.82), r1 * 0.5, r2 * 0.5)}" fill="${C.hot}" fill-opacity="${far ? .4 : .62}"/>`;
      if (inst.hot.has(g) && g === 'torso' && p === 'hip') html += `<path d="${capsule(mixPt(P, Q, 0.3), mixPt(P, Q, 0.85), r1 * 0.45, r2 * 0.45)}" fill="${C.hot}" fill-opacity=".55"/>`;
    };
    // tronco: pantalón abajo y remera recta encima (dobladillo recto que tapa la cintura)
    function torsoSVG() {
      const Hp = J.hip, S = J.sh, L = Math.hypot(S[0] - Hp[0], S[1] - Hp[1]) || 1e-3;
      const u = [(S[0] - Hp[0]) / L, (S[1] - Hp[1]) / L], nn = [-u[1], u[0]];
      const pt = (c, w) => [c[0] + nn[0] * w, c[1] + nn[1] * w];
      const poly = ps => `<path d="M${ps.map(q => f1(q[0]) + ' ' + f1(q[1])).join('L')}Z" fill="${C.shirt}"/>`;
      let o = '';
      if (side) {
        const hem = mixPt(Hp, S, 0.2), ar = arch;
        if (Math.abs(ar) > 0.3) {
          // espalda curvada (gato-vaca): todo el tronco (pantalón y remera) sigue una curva de la cadera a los hombros
          const mid = pt(mixPt(Hp, S, 0.5), ar), Cc = [2 * mid[0] - (Hp[0] + S[0]) / 2, 2 * mid[1] - (Hp[1] + S[1]) / 2];
          const B = u => [(1 - u) * (1 - u) * Hp[0] + 2 * u * (1 - u) * Cc[0] + u * u * S[0], (1 - u) * (1 - u) * Hp[1] + 2 * u * (1 - u) * Cc[1] + u * u * S[1]];
          const Nn = u => { const d = [2 * (1 - u) * (Cc[0] - Hp[0]) + 2 * u * (S[0] - Cc[0]), 2 * (1 - u) * (Cc[1] - Hp[1]) + 2 * u * (S[1] - Cc[1])], l = Math.hypot(d[0], d[1]) || 1; return [-d[1] / l, d[0] / l]; };
          const band = (u0, u1, w0, w1, col) => { const a = [], b = []; for (let i = 0; i <= 8; i++) { const u = u0 + (u1 - u0) * i / 8, w = w0 + (w1 - w0) * i / 8, c = B(u), n = Nn(u); a.push([c[0] + n[0] * w, c[1] + n[1] * w]); b.unshift([c[0] - n[0] * w, c[1] - n[1] * w]); }
            return `<path d="M${a.concat(b).map(q => f1(q[0]) + ' ' + f1(q[1])).join('L')}Z" fill="${col}"/>`; };
          o += `<circle cx="${f1(Hp[0])}" cy="${f1(Hp[1])}" r="9.4" fill="${C.shorts}"/>` + band(0, 0.34, 9.4, 9.3, C.shorts);
          o += band(0.2, 1, 9.5, 9.2, C.shirt) + `<circle cx="${f1(S[0])}" cy="${f1(S[1])}" r="9.2" fill="${C.shirt}"/>`;
        } else {
          o += `<path d="${capsule(Hp, mixPt(Hp, S, 0.32), 9.4, 9.3)}" fill="${C.shorts}"/>`;
          o += poly([pt(hem, 9.5), pt(S, 9.2), pt(S, -9.2), pt(hem, -9.5)]) + `<circle cx="${f1(S[0])}" cy="${f1(S[1])}" r="9.2" fill="${C.shirt}"/>`;
        }
      } else {
        const hw = Math.hypot(J.hipL[0] - Hp[0], J.hipL[1] - Hp[1]), sw = Math.hypot(J.shL[0] - S[0], J.shL[1] - S[1]);
        const hem = mixPt(Hp, S, Math.min(0.5, 6.5 / L));
        o += `<path d="${capsule(J.hipL, J.hipR, 7.6, 7.6)}" fill="${C.shorts}"/><path d="${capsule(Hp, hem, 8, 8)}" fill="${C.shorts}"/>`;
        o += poly([pt(hem, hw + 7.8), pt(S, sw + 4.6), pt(S, -(sw + 4.6)), pt(hem, -(hw + 7.8))]) + `<path d="${capsule(J.shL, J.shR, 4.6, 4.6)}" fill="${C.shirt}"/>`;
      }
      return o;
    }
    const arm = x => /^arm/.test(x[0]);
    if (a.armsBack) PARTS.filter(arm).forEach(pt => paint(pt, false));
    const legP = x => /^(leg|foot)/.test(x[0]);
    PARTS.filter(x => x[5] === 'far' && !((a.armsBack || a.armsFront) && arm(x)) && !(a.legsFront && legP(x))).forEach(pt => paint(pt, side || a.farShade));
    PARTS.filter(x => x[5] === 'mid').forEach(pt => paint(pt, false));
    if (a.armsFront) PARTS.filter(x => x[5] === 'far' && arm(x)).forEach(pt => paint(pt, false));
    // cabeza: pelo y cara hacia donde mira
    const H = J.head, nk = J.neck, hv = [H[0] - nk[0], H[1] - nk[1]], hl = Math.hypot(hv[0], hv[1]) || 1, up = [hv[0] / hl, hv[1] / hl];
    html += `<circle cx="${f1(H[0])}" cy="${f1(H[1])}" r="11" fill="${C.skin}"/>`;
    const at = (dx, dy) => [H[0] + dx, H[1] + dy];
    const circ = (c, r, col) => `<circle cx="${f1(c[0])}" cy="${f1(c[1])}" r="${r}" fill="${col}"/>`;
    if (side) {
      // pelo: coronilla, nuca y un poco de frente; la cara asoma por delante y abajo
      const fw = [-up[1], up[0]];
      html += circ(at(-fw[0] * 1.6 + up[0] * 1.3, -fw[1] * 1.6 + up[1] * 1.3), 11.6, C.hair);
      html += circ(at(-fw[0] * 6.5 - up[0] * 4.5, -fw[1] * 6.5 - up[1] * 4.5), 5, C.hair);
      html += circ(at(fw[0] * 3.2 - up[0] * 1.8, fw[1] * 3.2 - up[1] * 1.8), 8.8, C.skin);
    } else if (top) {
      // desde arriba se ve la coronilla
      html += circ(at(up[0] * 1.5, up[1] * 1.5), 9.6, C.hair);
    } else {
      // de frente: pelo arriba y a los lados, flequillo cubriendo parte de la frente
      html += circ(at(up[0] * 2.2, up[1] * 2.2), 11.5, C.hair);
      html += circ(at(-up[0] * 1.8, -up[1] * 1.8), 9.2, C.skin);
    }
    if (a.legsFront) PARTS.filter(x => x[5] === 'far' && legP(x)).forEach(pt => paint(pt, false));
    PARTS.filter(x => x[5] === 'near' && !(a.armsBack && arm(x))).forEach(pt => paint(pt, false));
    inst.g.innerHTML = html;
    if (a.badge && inst.bdg !== null) animBadge(inst, el / ms);
    if (inst.shadow) {
      const pts = Object.values(J).filter(q => q[1] > -30);
      if (pts.length) {
        const xs = pts.map(q => q[0]), x0 = Math.min(...xs), x1 = Math.max(...xs);
        const low = Math.max(...Object.values(J).map(q => q[1]));
        inst.shadow.setAttribute('cx', f1((x0 + x1) / 2));
        inst.shadow.setAttribute('rx', f1((x1 - x0) / 2 + 12));
        inst.shadow.setAttribute('fill-opacity', Math.max(0.1, 0.38 + low / 80).toFixed(2));
      } else inst.shadow.setAttribute('fill-opacity', '0.1');
    }
  }
  // el esquema de manos/pies acompaña al movimiento
  function animBadge(inst, phase) {
    const a = inst.a, svg = inst.svg;
    if (!inst.bdg) inst.bdg = { sh: svg.querySelector('.bdg-sh'), a: svg.querySelector('.bdg-a'), b: svg.querySelector('.bdg-b'), ft: svg.querySelector('.bdg-ft'), fo: svg.querySelector('.bdg-fo') };
    const B = inst.bdg, { i, t } = timing(a, phase), S = a.vb[2] * 0.26;
    if (B.sh) { const v = [[0, -1], [-1, 0], [0, 1], [1, 0]][i % 4]; B.sh.setAttribute('transform', `translate(${(lerp(v[0], v[1], t) * S * 0.24).toFixed(1)} 0)`); }
    if (B.a && B.b) { const w = i < 2 ? 0 : i === 2 ? t : i < 5 ? 1 : 1 - t; B.a.setAttribute('opacity', (1 - w).toFixed(2)); B.b.setAttribute('opacity', w.toFixed(2)); }
    if (B.ft && B.fo) { const w = i === 0 ? t : 1 - t; B.ft.setAttribute('opacity', (1 - w).toFixed(2)); B.fo.setAttribute('opacity', w.toFixed(2)); }
  }
  // solo se redibujan las figuras visibles en pantalla
  const vis = 'IntersectionObserver' in window ? new IntersectionObserver(ents => ents.forEach(en => { en.target.__vis = en.isIntersecting; }), { rootMargin: '100px' }) : null;
  function loop(now) {
    raf = 0;
    for (const inst of live) {
      if (!inst.svg.isConnected) { live.delete(inst); if (vis) vis.unobserve(inst.svg); continue; }
      if (inst.combo) continue;
      if (!inst.paused && inst.svg.__vis !== false) draw(inst, now);
    }
    for (const c of combos) {
      if (!c.svg.isConnected) { combos.delete(c); if (vis) vis.unobserve(c.svg); continue; }
      if (c.svg.__vis !== false) drawCombo(c, now);
    }
    if (live.size) raf = requestAnimationFrame(loop);
  }
  const kick = () => { if (!raf && live.size) raf = requestAnimationFrame(loop); };

  /* ---------- dos vistas del mismo ejercicio, una después de otra ---------- */
  // cada vista se muestra dos repeticiones completas (de lado primero) y pasa a la siguiente con un fundido
  const combos = new Set();
  function comboSVG(id, spec, zone) {
    const outer = document.createElementNS(NS, 'svg');
    outer.setAttribute('viewBox', '0 0 100 100'); outer.setAttribute('class', 'fig'); outer.setAttribute('aria-hidden', 'true');
    const parts = spec.combo.map(pid => {
      const inst = svgFor(pid, zone);
      inst.svg.setAttribute('class', 'fig-part'); inst.svg.setAttribute('x', '0'); inst.svg.setAttribute('y', '0');
      inst.svg.setAttribute('width', '100'); inst.svg.setAttribute('height', '100');
      inst.svg.style.transition = 'opacity .3s'; inst.combo = true;
      outer.appendChild(inst.svg); return inst;
    });
    const lab = document.createElementNS(NS, 'text');
    lab.setAttribute('x', '50'); lab.setAttribute('y', '6'); lab.setAttribute('text-anchor', 'middle'); // arriba al centro: dentro del círculo
    lab.setAttribute('font-size', '6.2'); lab.setAttribute('font-weight', '700'); lab.setAttribute('fill', '#ff5a36');
    lab.setAttribute('font-family', 'system-ui,-apple-system,Roboto,sans-serif'); lab.setAttribute('letter-spacing', '.3');
    outer.appendChild(lab);
    const c = { svg: outer, parts, labels: spec.labels || [], lab, reps: spec.reps || 2, cur: -1, speed: 1 };
    parts.forEach(pt => { pt.t0 = parts[0].t0; });
    drawCombo(c, performance.now());
    return c;
  }
  function drawCombo(c, now) {
    const p0 = c.parts[0];
    const at = p0.paused ? p0.pausedAt : now;
    const durs = c.parts.map(pt => pt.a.ms * c.reps / c.speed), P = durs.reduce((a, b) => a + b, 0);
    let x = (((at - p0.t0) % P) + P) % P, i = 0;
    while (i < durs.length - 1 && x >= durs[i]) { x -= durs[i]; i++; }
    if (i !== c.cur) {
      c.cur = i;
      c.parts.forEach((pt, k) => { pt.svg.style.opacity = k === i ? '1' : '0'; });
      c.lab.textContent = (c.labels[i] || '').toUpperCase();
    }
    const pt = c.parts[i];
    pt.speed = c.speed;
    draw(pt, pt.t0 + x); // tiempo dentro de su tramo: cada vista empieza su repetición desde el principio
  }

  /* ---------- archivos propios en media/ ---------- */
  const MEDIA_DIR = 'media/';
  const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  let listing = null; // Set de archivos conocidos (index.json o listado del servidor); null = probar uno a uno
  const listingReady = (async () => {
    if (!/^https?:$/.test(location.protocol)) return;
    try {
      const r = await fetch(MEDIA_DIR + 'index.json', { cache: 'no-cache' });
      if (r.ok) { const j = await r.json(); if (Array.isArray(j)) { listing = new Set(j.map(String)); return; } }
    } catch (e) {}
    try {
      const r = await fetch(MEDIA_DIR, { cache: 'no-cache' });
      if (!r.ok) return;
      const txt = await r.text(), set = new Set();
      txt.replace(/href="([^"?#]+)"/gi, (_, h) => { try { set.add(decodeURIComponent(h.split('/').pop())); } catch (e) {} });
      if (set.size) listing = set;
    } catch (e) {}
  })();
  const found = new Map();
  function probe(url, kind) {
    return new Promise(res => {
      if (kind === 'gif') { const im = new Image(); im.onload = () => res(true); im.onerror = () => res(false); im.src = url; }
      else { const v = document.createElement('video'); v.preload = 'metadata'; v.muted = true; v.onloadedmetadata = () => res(true); v.onerror = () => res(false); v.src = url; setTimeout(() => res(false), 4000); }
    });
  }
  function candidates(id, name) {
    const base = id.replace(/_(l|r)$/, '');
    const names = [...new Set([id, base, NEW2OLD[id], OLD[id], name ? slug(name) : null, name ? slug(name.replace(/ · (izquierda|derecha)$/, '')) : null].filter(Boolean))];
    const out = []; names.forEach(n => { out.push(n + '.mp4', n + '.gif'); });
    return out;
  }
  async function findMedia(id, name) {
    if (found.has(id)) return found.get(id);
    const p = (async () => {
      await listingReady;
      const files = candidates(id, name);
      if (listing) { const f = files.find(x => listing.has(x)); return f ? MEDIA_DIR + f : null; }
      for (const f of files) if (await probe(MEDIA_DIR + f, f.endsWith('.gif') ? 'gif' : 'mp4')) return MEDIA_DIR + f;
      return null;
    })();
    found.set(id, p);
    return p;
  }

  /* ---------- API ---------- */
  // Monta la animación del ejercicio en el contenedor. Usa media/ si existe.
  function mount(el, id, opts = {}) {
    const e = typeof ex === 'function' ? ex(id) : { n: id, p: '' };
    el.innerHTML = '';
    el.dataset.animId = id;
    const spec = MAP[OLD[id] || id];
    if (spec && spec.combo) {
      const c = comboSVG(id, spec, (e.t === 'x' ? (e.p || '')[0] : ''));
      if (opts.speed) c.speed = opts.speed;
      el.appendChild(c.svg);
      if (vis) vis.observe(c.svg);
      c.parts.forEach(pt => live.add(pt)); combos.add(c); kick();
      return c.parts[0];
    }
    const inst = svgFor(id, (e.t === 'x' ? (e.p || '')[0] : ''));
    if (opts.speed) inst.speed = opts.speed;
    el.appendChild(inst.svg);
    if (vis) vis.observe(inst.svg);
    live.add(inst); kick();
    findMedia(id, e.n).then(url => {
      if (!url || el.dataset.animId !== id) return;
      let node;
      if (url.endsWith('.gif')) { node = new Image(); node.alt = e.n; }
      else { node = document.createElement('video'); node.muted = true; node.loop = true; node.autoplay = true; node.playsInline = true; node.setAttribute('playsinline', ''); }
      node.className = 'media';
      node.src = url;
      node.onerror = () => { if (el.dataset.animId !== id) return; el.innerHTML = ''; el.appendChild(inst.svg); delete el.dataset.media; live.add(inst); kick(); };
      el.innerHTML = ''; el.appendChild(node); live.delete(inst);
      el.dataset.media = url;
      if (node.play) node.play().catch(() => {});
    });
    return inst;
  }
  function setPaused(el, paused) {
    for (const inst of live) if (el.contains(inst.svg)) { if (paused && !inst.paused) { inst.paused = true; inst.pausedAt = performance.now(); } else if (!paused && inst.paused) { inst.paused = false; inst.t0 += performance.now() - inst.pausedAt; } }
    const v = el.querySelector('video'); if (v) paused ? v.pause() : v.play().catch(() => {});
  }
  const fileNames = (id, name) => candidates(id, name).filter(f => f.endsWith('.mp4')).map(f => f.replace('.mp4', ''));
  // para pruebas: figura fija en una fase del ciclo (0–1)
  function still(id, phase, zone) { const inst = svgFor(id, zone || ''); inst.t0 = 0; inst.speed = 1; draw(inst, phase * inst.a.ms); return inst.svg; }
  return { _dev: { get, pose, pose2, timing, fk, LEN, SEGS, HI }, still, keysOf: id => get(id).keys.length, mount, setPaused, findMedia, fileNames, has: id => !!(MAP[id] || MAP[id.replace(/_(l|r)$/, '')]), templateOf: id => MAP[id] || MAP[id.replace(/_(l|r)$/, '')], slug };
})();
