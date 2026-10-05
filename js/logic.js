// Lógica de entrenamiento: día siguiente, progresión doble, rachas, volumen…
import { ROUTINE, EX_INDEX, INC, repRange } from "./data/routine.js";
import { store } from "./storage.js";
import { nextUp } from "./equipment.js";
import { num, weekKey, parseD, ymd } from "./utils.js";

export const sessions = () => store.all.filter(r => r.type === "session")
  .sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
export const weights = () => store.all.filter(r => r.type === "weight")
  .sort((a, b) => a.date.localeCompare(b.date));

/** Una serie cuenta como hecha si tiene repeticiones anotadas */
export const performed = st => (st || []).filter(x => x && String(x.reps) !== "");

export function nextDay() {
  const s = sessions()[0];
  if (!s) return "A";
  return { A: "B", B: "C", C: "A" }[s.day] || "A";
}

/** Series de la última sesión anterior a `beforeDate` (excluyendo la sesión `exceptId`) que tenga ese ejercicio */
export function lastFor(exId, beforeDate, exceptId) {
  for (const s of sessions()) {
    if (exceptId && s.id === exceptId) continue;
    if (beforeDate && s.date > beforeDate) continue;
    const st = performed(s.sets?.[exId]);
    if (st.length) return { session: s, sets: st };
  }
  return null;
}

/** Progresión doble: todas las series previstas hechas en la parte alta del rango */
export function readyToProgress(e, prevSets) {
  if (!prevSets || e.unit === "s") return false;
  const top = repRange(e)[1];
  const valid = performed(prevSets);
  return valid.length >= e.sets && valid.slice(0, e.sets).every(x => parseInt(x.reps) >= top);
}

export const topKg = st => { const v = performed(st).map(x => num(x.kg)).filter(x => x != null); return v.length ? Math.max(...v) : null; };

/** Ejercicios del día en los que toca subir peso: [{e, from, to}] */
export function upgradesFor(day) {
  const out = [];
  for (const e of ROUTINE[day].ex) {
    const prev = lastFor(e.id);
    if (prev && readyToProgress(e, prev.sets)) {
      const from = topKg(prev.sets);
      if (from != null) { const to = nextUp(e.id, from); if (to > from) out.push({ e, from, to }); }
    }
  }
  return out;
}

export function volume(s) {
  let v = 0;
  for (const [id, st] of Object.entries(s.sets || {})) {
    if (EX_INDEX[id]?.unit === "s") continue;
    for (const x of st) { const k = num(x.kg), r = parseInt(x.reps); if (k && r) v += k * r; }
  }
  return Math.round(v);
}

/** Series hechas / previstas de una sesión */
export function setCount(s) {
  const d = ROUTINE[s.day]; if (!d) return { done: 0, total: 0 };
  let done = 0, total = 0;
  for (const e of d.ex) { total += e.sets; done += Math.min(performed(s.sets?.[e.id]).length, e.sets); }
  return { done, total };
}

export function perWeek() {
  const m = {};
  for (const s of sessions()) { const k = weekKey(parseD(s.date)); m[k] = (m[k] || 0) + 1; }
  return m;
}

/** Semanas seguidas con 3+ sesiones (la actual cuenta solo si ya llegó a 3) */
export function streak(today = new Date()) {
  const pw = perWeek(); const tw = weekKey(today);
  let n = 0; if ((pw[tw] || 0) >= 3) n++;
  const cur = parseD(tw); cur.setDate(cur.getDate() - 7);
  while ((pw[ymd(cur)] || 0) >= 3) { n++; cur.setDate(cur.getDate() - 7); }
  return n;
}

/** Número de semana del programa (1 = la semana de la primera sesión) */
export function programWeek(today = new Date()) {
  const ss = sessions(); if (!ss.length) return 1;
  const first = parseD(weekKey(parseD(ss[ss.length - 1].date)));
  const now = parseD(weekKey(today));
  return Math.round((now - first) / (7 * 864e5)) + 1;
}

/** Duración estimada de un día en minutos (series × ~1 min de trabajo + descansos + calentamiento + cardio) */
export function estMinutes(day) {
  const d = ROUTINE[day]; let sec = 5 * 60;
  for (const e of d.ex) sec += e.sets * (45 + (parseInt(e.rest) || 60));
  const cardio = parseInt(d.finisher.detail) || 10;
  return Math.round(sec / 60 + cardio);
}
export const totalSets = day => ROUTINE[day].ex.reduce((a, e) => a + e.sets, 0);
