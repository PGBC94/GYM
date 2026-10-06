// Motor de la figura articulada (cinemática inversa)
// v1.2: pies, manos y ojo; músculo que trabaja; flecha y texto de la fase; vista desde arriba; controles (pausa, 0,5×, barra)
import { RIG, lerp, FLOOR, ANIM, metaFor } from "../data/animations.js";
import { EX_INDEX } from "../data/routine.js";
import { esc } from "../utils.js";

function lerpTarget(a, b, u) {
  const k = Object.keys(a)[0]; const A = a[k], B = b[k] || A;
  return { [k]: [lerp(A[0], B[0], u), lerp(A[1], B[1], u)] };
}
export function poseAt(an, u) { // u en 0..1 recorre todos los frames
  const fr = an.frames, segs = fr.length - 1; const x = Math.min(u * segs, segs - 1e-9); const i = Math.floor(x), f = x - i;
  const A = fr[i], B = fr[i + 1];
  return { hip: [lerp(A.hip[0], B.hip[0], f), lerp(A.hip[1], B.hip[1], f)], t: lerp(A.t, B.t, f),
    arms: A.arms.map((t, j) => lerpTarget(t, B.arms[j], f)), legs: A.legs.map((t, j) => lerpTarget(t, B.legs[j], f)) };
}
function solveIK(R, T, l1, l2, pref, ctx) {
  const dx = T[0] - R[0], dy = T[1] - R[1]; const d0 = Math.hypot(dx, dy) || 0.001; const ux = dx / d0, uy = dy / d0;
  const d = Math.min(Math.max(d0, Math.abs(l1 - l2) + 0.01), l1 + l2 - 0.01);
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const bx = R[0] + ux * a, by = R[1] + uy * a, px = -uy * h, py = ux * h;
  const m1 = [bx + px, by + py], m2 = [bx - px, by - py];
  const score = m => { switch (pref) { case "fwd": return m[0]; case "back": return -m[0]; case "up": return -m[1]; case "down": return m[1];
    case "out": return Math.abs(m[0] - ctx.cx); case "chest": return (m[0] - R[0]) * ctx.fn[0] + (m[1] - R[1]) * ctx.fn[1];
    case "spine": return -((m[0] - R[0]) * ctx.fn[0] + (m[1] - R[1]) * ctx.fn[1]); default: return 0; } };
  return { mid: score(m1) >= score(m2) ? m1 : m2, end: [R[0] + ux * d, R[1] + uy * d] };
}
function skeleton(an, p) {
  const td = [Math.sin(p.t * Math.PI / 180), -Math.cos(p.t * Math.PI / 180)], fn = [-td[1], td[0]]; // fn = hacia el pecho
  const front = an.view === "front";
  const sc = [p.hip[0] + td[0] * RIG.torso, p.hip[1] + td[1] * RIG.torso];
  const head = [sc[0] + td[0] * (RIG.neck + RIG.head + 3), sc[1] + td[1] * (RIG.neck + RIG.head + 3)];
  const so = front ? 14 : 0, ho = front ? 9 : 0;
  const sh = [[sc[0] - fn[0] * so, sc[1] - fn[1] * so], [sc[0] + fn[0] * so, sc[1] + fn[1] * so]];
  const hp = [[p.hip[0] - fn[0] * ho, p.hip[1] - fn[1] * ho], [p.hip[0] + fn[0] * ho, p.hip[1] + fn[1] * ho]];
  const ctx = { cx: p.hip[0], fn };
  const res = (tg, root) => { if (tg.a) return tg.a; if (tg.d) return [root[0] + tg.d[0], root[1] + tg.d[1]];
    if (tg.h) return [p.hip[0] + tg.h[0], p.hip[1] + tg.h[1]];
    if (tg.tf) return [root[0] - td[0] * tg.tf[0] + fn[0] * tg.tf[1], root[1] - td[1] * tg.tf[0] + fn[1] * tg.tf[1]]; return root; };
  const arms = p.arms.map((tg, i) => { const r = solveIK(sh[i], res(tg, sh[i]), RIG.ua, RIG.fa, an.eb[i], ctx); return [sh[i], r.mid, r.end]; });
  const legs = p.legs.map((tg, i) => { const r = solveIK(hp[i], res(tg, hp[i]), RIG.th, RIG.sh, an.kb[i], ctx); return [hp[i], r.mid, r.end]; });
  return { sc, head, sh, hp, arms, legs, td, fn, front, hip: p.hip };
}
/** Vista desde arriba (press Pallof): hombros, cabeza y brazos vistos en planta */
function skeletonTop(an, p) {
  const c = p.hip; const sh = [[c[0] - 20, c[1]], [c[0] + 20, c[1]]];
  const ctx = { cx: c[0], fn: [0, 1] };
  const arms = p.arms.map((tg, i) => { const T = [sh[i][0] + tg.d[0], sh[i][1] + tg.d[1]]; const r = solveIK(sh[i], T, RIG.ua, RIG.fa, "out", ctx); return [sh[i], r.mid, r.end]; });
  return { top: true, c, sh, arms, legs: [], hip: c };
}

const P = pt => pt[0].toFixed(1) + "," + pt[1].toFixed(1);
const f1 = v => v.toFixed(1);
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
const unit = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
const line = (a, b, cls, extra = "") => `<line class="${cls}" x1="${f1(a[0])}" y1="${f1(a[1])}" x2="${f1(b[0])}" y2="${f1(b[1])}"${extra}/>`;

/** Músculos que trabajan, como trazos semitransparentes encima del cuerpo */
function muscles(s, work, op) {
  if (!work?.length || !op) return { back: "", torso: "", front: "" };
  const st = `style="opacity:${op.toFixed(2)}"`;
  const o = { back: "", torso: "", front: "" };
  const legLayer = i => (s.front ? "front" : i === 0 ? "back" : "front");
  for (const w of work) {
    if (w === "thighs") s.legs.forEach((l, i) => { o[legLayer(i)] += line(l[0], l[1], "mus", ` ${st}`); });
    if (w === "upper") s.arms.forEach((a, i) => { o[legLayer(i)] += line(a[0], a[1], "mus thin", ` ${st}`); });
    if (s.top) continue;
    const { td, fn, hip, sc } = s;
    if (s.front) {
      const mid = [(s.sh[0][0] + s.sh[1][0]) / 2, (s.sh[0][1] + s.sh[1][1]) / 2];
      if (w === "chest" || w === "back") o.torso += `<polygon class="mus-fill" ${st} points="${[s.sh[0], s.sh[1], add(s.sh[1], td, -22), add(s.sh[0], td, -22)].map(P).join(" ")}"/>`;
      if (w === "core") o.torso += `<polygon class="mus-fill" ${st} points="${[add(s.hp[0], td, 6), add(s.hp[1], td, 6), add(s.hp[1], td, 26), add(s.hp[0], td, 26)].map(P).join(" ")}"/>`;
      if (w === "glutes") s.hp.forEach(h => { o.torso += `<circle class="mus-fill" ${st} cx="${f1(h[0])}" cy="${f1(h[1])}" r="6"/>`; });
      if (w === "shoulder") s.sh.forEach(h => { o.front += `<circle class="mus-fill" ${st} cx="${f1(h[0])}" cy="${f1(h[1])}" r="6.5"/>`; });
      void mid; continue;
    }
    if (w === "chest") o.torso += line(add(sc, fn, 3.5), add(add(sc, td, -20), fn, 3.5), "mus", ` ${st}`);
    if (w === "back") o.torso += line(add(add(sc, td, -2), fn, -3.5), add(add(sc, td, -30), fn, -3.5), "mus", ` ${st}`);
    if (w === "lowback") o.torso += line(add(add(hip, td, 4), fn, -3.5), add(add(hip, td, 22), fn, -3.5), "mus", ` ${st}`);
    if (w === "core") o.torso += line(add(add(hip, td, 8), fn, 3.5), add(add(hip, td, 30), fn, 3.5), "mus", ` ${st}`);
    if (w === "glutes") { const g = add(hip, fn, -3); o.torso += `<circle class="mus-fill" ${st} cx="${f1(g[0])}" cy="${f1(g[1])}" r="7"/>`; }
    if (w === "shoulder") o.front += `<circle class="mus-fill" ${st} cx="${f1(sc[0])}" cy="${f1(sc[1])}" r="6.5"/>`;
  }
  return o;
}

export function drawFigure(an, p, cls, opts = {}) {
  const s = an.view === "top" ? skeletonTop(an, p) : skeleton(an, p);
  const mus = muscles(s, opts.work, opts.mus || 0);
  let o = "";
  const limb = (seg, c) => `<polyline class="${c}" points="${seg.map(P).join(" ")}"/>`;
  const handMid = [(s.arms[0][2][0] + s.arms[1][2][0]) / 2, (s.arms[0][2][1] + s.arms[1][2][1]) / 2];
  const hand = i => i === undefined ? handMid : s.arms[i][2];
  const handDot = (a, c) => `<circle class="${c}" cx="${f1(a[2][0])}" cy="${f1(a[2][1])}" r="3.4"/>`;
  const foot = (l, c, i) => {
    const ank = l[2];
    let dir;
    if (s.front) dir = [i === 0 ? -1 : 1, 0.15];
    else { const sh = unit([l[2][0] - l[1][0], l[2][1] - l[1][1]]); dir = [sh[1], -sh[0]]; if (an.footFlip) dir = [-dir[0], -dir[1]]; }
    return `<line class="${c}" x1="${f1(ank[0])}" y1="${f1(ank[1])}" x2="${f1(ank[0] + dir[0] * 8)}" y2="${f1(ank[1] + dir[1] * 8)}"/>`;
  };
  let props = "";
  (an.props || []).forEach(pr => {
    if (pr.k === "cable") { const h = hand(pr.hand); props += `<line class="cable" x1="${pr.from[0]}" y1="${pr.from[1]}" x2="${f1(h[0])}" y2="${f1(h[1])}"/><circle class="pulley" cx="${pr.from[0]}" cy="${pr.from[1]}" r="4.5"/>`; }
  });

  if (s.top) {
    // planta: suelo de referencia (pies), hombros, brazos y cabeza
    const c = s.c;
    o += `<ellipse class="tor-top" cx="${f1(c[0])}" cy="${f1(c[1])}" rx="24" ry="8"/>`;
    o += mus.torso + limb(s.arms[0], "lb") + limb(s.arms[1], "lb") + handDot(s.arms[0], "hand") + handDot(s.arms[1], "hand") + mus.front;
    o += `<circle class="hd" cx="${f1(c[0])}" cy="${f1(c[1] - 2)}" r="${RIG.head}"/><circle class="eye" cx="${f1(c[0])}" cy="${f1(c[1] + 5)}" r="1.8"/>`;
  } else if (s.front) {
    o += limb(s.legs[0], "lb") + limb(s.legs[1], "lb") + foot(s.legs[0], "foot", 0) + foot(s.legs[1], "foot", 1);
    o += `<polygon class="tor" points="${[s.sh[0], s.sh[1], s.hp[1], s.hp[0]].map(P).join(" ")}"/>`;
    o += mus.torso + mus.front;
    o += limb(s.arms[0], "lb") + limb(s.arms[1], "lb") + handDot(s.arms[0], "hand") + handDot(s.arms[1], "hand");
    o += `<circle class="hd" cx="${f1(s.head[0])}" cy="${f1(s.head[1])}" r="${RIG.head}"/>`;
  } else {
    o += limb(s.arms[0], "lb back") + handDot(s.arms[0], "hand back") + limb(s.legs[0], "lb back") + foot(s.legs[0], "foot back", 0);
    o += mus.back;
    o += `<line class="tor" x1="${f1(s.hp[0][0])}" y1="${f1(s.hp[0][1])}" x2="${f1(s.sc[0])}" y2="${f1(s.sc[1])}"/>`;
    o += mus.torso;
    o += limb(s.legs[1], "lb") + foot(s.legs[1], "foot", 1);
    const eye = add(add(s.head, s.fn, 4.2), s.td, 1);
    o += `<circle class="hd" cx="${f1(s.head[0])}" cy="${f1(s.head[1])}" r="${RIG.head}"/><circle class="eye" cx="${f1(eye[0])}" cy="${f1(eye[1])}" r="1.7"/>`;
    o += limb(s.arms[1], "lb") + handDot(s.arms[1], "hand") + mus.front;
  }
  (an.props || []).forEach(pr => {
    if (pr.k === "db") { const h = hand(pr.hand); o += `<circle class="wt" cx="${f1(h[0])}" cy="${f1(h[1])}" r="6.5"/><circle class="wt-in" cx="${f1(h[0])}" cy="${f1(h[1])}" r="2"/>`; }
    if (pr.k === "dbv") { const h = handMid; o += `<rect class="wt" x="${f1(h[0] - 7)}" y="${f1(h[1] - 12)}" width="14" height="6" rx="2"/><rect class="wt" x="${f1(h[0] - 7)}" y="${f1(h[1] + 6)}" width="14" height="6" rx="2"/><line class="wt-bar" x1="${f1(h[0])}" y1="${f1(h[1] - 6)}" x2="${f1(h[0])}" y2="${f1(h[1] + 6)}"/>`; }
    if (pr.k === "handle") { const h = handMid; o += `<line class="wt-bar" x1="${f1(h[0] - 7)}" y1="${f1(h[1])}" x2="${f1(h[0] + 7)}" y2="${f1(h[1])}"/>`; }
    if (pr.k === "pad") { const f = s.legs[pr.foot][2]; o += `<circle class="pad" cx="${f1(f[0] + pr.dx)}" cy="${f1(f[1] + pr.dy)}" r="6"/>`; }
  });
  return `<g class="${cls}">${props}${o}</g>`;
}

export function drawStatic(an) {
  let o = an.view === "top" ? "" : `<line class="floor" x1="4" y1="${FLOOR + 3}" x2="236" y2="${FLOOR + 3}"/>`;
  (an.stat || []).forEach(s => {
    if (s.k === "rect") o += `<rect class="eq" x="${s.x}" y="${s.y}" width="${s.w}" height="${s.h}" rx="2"/>`;
    if (s.k === "line") o += `<line class="eq-l" x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" style="stroke-width:${s.w || 3}"/>`;
    if (s.k === "circ") o += `<circle class="eq" cx="${s.x}" cy="${s.y}" r="${s.r}"/>`;
    if (s.k === "poly") o += `<polygon class="eq" points="${s.pts.map(p => p.join(",")).join(" ")}"/>`;
  });
  if (an.view === "top") {
    // flecha curva: el cable intenta girarte
    o += `<path class="rot" d="M150 40 A30 30 0 0 0 98 40" /><path class="rot-h" d="M98 40 l-1 -7 M98 40 l7 -1"/>`;
  }
  return o;
}

/* ---------- Tiempo y fases ---------- */
const ease = x => 0.5 - 0.5 * Math.cos(Math.PI * x);
const timing = an => { const F = an.slow ? 2.2 : 1.1, B = an.slow ? 1.1 : 2.2, H1 = 0.4, H2 = 0.5; return { F, B, H1, H2, T: F + H1 + B + H2 }; };
/** Estado en el segundo `sec` del ciclo: u (0..1), etapa y si es la fase de esfuerzo */
export function phaseInfo(an, sec) {
  const { F, B, H1, T } = timing(an); let x = ((sec % T) + T) % T;
  if (x < F) return { u: ease(x / F), stage: "ida" }; x -= F;
  if (x < H1) return { u: 1, stage: "hold1" }; x -= H1;
  if (x < B) return { u: 1 - ease(x / B), stage: "vuelta" };
  return { u: 0, stage: "hold2" };
}
export const phase = (an, ms) => phaseInfo(an, ms / 1000).u;
export const cycleSec = an => timing(an).T;

export function tempoLabel(an) {
  if (an.label) return an.label;
  return an.slow ? "Baja controlando (2-3 s) · sube con fuerza (1 s)" : "Fase de esfuerzo en 1 s · vuelve despacio (2-3 s)";
}
/** Texto corto de la fase actual */
function stageText(an, meta, st) {
  const [a, b] = meta.cues || ["", ""];
  const dur = s => an.label ? "" : ` · ${s}`;
  if (st === "ida") return a + dur(an.slow ? "2-3 s" : "1 s");
  if (st === "vuelta") return b + dur(an.slow ? "1 s" : "2-3 s");
  if (st === "hold1") return "Aguanta";
  return a ? "Prepárate" : "";
}
const concentric = (an, st) => an.slow ? st === "vuelta" : st === "ida";

/* ---------- Flecha de dirección ---------- */
const keyCache = new WeakMap();
function keyMotion(an) {
  if (keyCache.has(an)) return keyCache.get(an);
  const pts = u => { const s = an.view === "top" ? skeletonTop(an, poseAt(an, u)) : skeleton(an, poseAt(an, u));
    const hm = [(s.arms[0][2][0] + s.arms[1][2][0]) / 2, (s.arms[0][2][1] + s.arms[1][2][1]) / 2];
    const ft = s.legs[1]?.[2] || hm; return { hand: hm, hip: s.hip, foot: ft }; };
  const A = pts(0), B = pts(1);
  let best = "hand", bd = -1;
  for (const k of ["hand", "hip", "foot"]) { const d = Math.hypot(B[k][0] - A[k][0], B[k][1] - A[k][1]); if (d > bd + 4) { bd = d; best = k; } }
  const r = { key: best, A, B };
  keyCache.set(an, r); return r;
}
function arrowSVG(an, u, st) {
  if (st !== "ida" && st !== "vuelta") return "";
  const km = keyMotion(an); const a = km.A[km.key], b = km.B[km.key];
  const v = unit(st === "ida" ? [b[0] - a[0], b[1] - a[1]] : [a[0] - b[0], a[1] - b[1]]);
  if (!isFinite(v[0])) return "";
  const pos = [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
  const n = [-v[1], v[0]]; // al lado del punto que se mueve
  let c = add(pos, n, 18); if (c[0] < 12 || c[0] > 228 || c[1] < 12 || c[1] > 148) c = add(pos, n, -18);
  c = [Math.min(226, Math.max(14, c[0])), Math.min(146, Math.max(14, c[1]))];
  const tip = add(c, v, 9), tail = add(c, v, -9), w = add(tip, v, -6);
  return `<g class="dir"><line x1="${f1(tail[0])}" y1="${f1(tail[1])}" x2="${f1(tip[0])}" y2="${f1(tip[1])}"/><polyline points="${P(add(w, n, 5))} ${P(tip)} ${P(add(w, n, -5))}"/></g>`;
}

/* ---------- SVG y bucle ---------- */
const reduceMotion = (() => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } })();
const clocks = new Map(); // uid -> {sec, speed, paused}
export const clockOf = uid => { if (!clocks.has(uid)) clocks.set(uid, { sec: 0, speed: 1, paused: reduceMotion }); return clocks.get(uid); };

export function figSVG(exId, idx, big) {
  const an = ANIM[exId][idx]; const uid = `${exId}-${idx}-${big ? "b" : "s"}`;
  const meta = metaFor(exId, idx); const ck = clockOf(uid); const info = phaseInfo(an, ck.sec);
  return `<svg class="fig${big ? " big" : ""}" data-fig="${exId}" data-i="${idx}" data-uid="${uid}" viewBox="0 0 240 160" role="img" aria-label="Animación de ${esc(EX_INDEX[exId].name)}">
    ${drawStatic(an)}${drawFigure(an, poseAt(an, 1), reduceMotion ? "ghost strong" : "ghost")}<g class="live">${frameSVG(an, meta, info)}</g></svg>`;
}
function frameSVG(an, meta, info) {
  const mus = meta.work?.length ? (concentric(an, info.stage) ? 0.95 : info.stage.startsWith("hold") ? 0.6 : 0.4) : 0;
  return drawFigure(an, poseAt(an, info.u), "fg", { work: meta.work, mus }) + arrowSVG(an, info.u, info.stage);
}
/** Texto de fase inicial (para pintarlo en el HTML) */
export function phaseText(exId, idx, big) {
  const an = ANIM[exId][idx]; const ck = clockOf(`${exId}-${idx}-${big ? "b" : "s"}`);
  return stageText(an, metaFor(exId, idx), phaseInfo(an, ck.sec).stage) || tempoLabel(an);
}

let lastTs = 0;
export function animLoop(ts) {
  requestAnimationFrame(animLoop);
  const dt = lastTs ? Math.min(0.1, (ts - lastTs) / 1000) : 0; lastTs = ts;
  const vh = innerHeight; const seen = new Set();
  document.querySelectorAll("svg.fig[data-uid]").forEach(svg => {
    const uid = svg.dataset.uid; const ck = clockOf(uid);
    if (!seen.has(uid)) { seen.add(uid); if (!ck.paused) ck.sec += dt * ck.speed; }
    const r = svg.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh || r.width === 0) return;
    const an = ANIM[svg.dataset.fig][+svg.dataset.i]; const meta = metaFor(svg.dataset.fig, +svg.dataset.i);
    const info = phaseInfo(an, ck.sec);
    const key = `${info.u.toFixed(3)}|${info.stage}`;
    if (svg._k === key) return; svg._k = key;
    svg.querySelector("g.live").innerHTML = frameSVG(an, meta, info);
    const t = stageText(an, meta, info.stage) || tempoLabel(an);
    document.querySelectorAll(`[data-ph="${uid}"]`).forEach(el => { if (el.textContent !== t) el.textContent = t; });
    document.querySelectorAll(`input[data-scrub="${uid}"]`).forEach(el => { if (document.activeElement !== el) el.value = String(Math.round(((ck.sec % cycleSec(an)) + cycleSec(an)) % cycleSec(an) / cycleSec(an) * 1000)); });
  });
}
export function startAnimations() { requestAnimationFrame(animLoop); }

/* ---------- Controles (hoja de técnica) ---------- */
export function togglePlay(uid) { const c = clockOf(uid); c.paused = !c.paused; return c.paused; }
export function toggleSlow(uid) { const c = clockOf(uid); c.speed = c.speed === 1 ? 0.5 : 1; return c.speed; }
export function scrubTo(uid, exId, idx, frac) { const c = clockOf(uid); c.paused = true; c.sec = frac * cycleSec(ANIM[exId][idx]); }
/** Para pruebas: SVG de un ejercicio en el segundo `sec` del ciclo */
export function renderAt(exId, idx, sec) {
  const an = ANIM[exId][idx]; const info = phaseInfo(an, sec);
  return { svg: `<svg class="fig" viewBox="0 0 240 160">${drawStatic(an)}${drawFigure(an, poseAt(an, 1), "ghost")}${frameSVG(an, metaFor(exId, idx), info)}</svg>`, text: stageText(an, metaFor(exId, idx), info.stage) };
}
