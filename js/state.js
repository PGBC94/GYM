// Estado compartido de la interfaz y la sesión en curso (borrador)
import { ROUTINE, repRange } from "./data/routine.js";
import { lastFor, performed } from "./logic.js";
import { lsGet, lsSet, todayStr } from "./utils.js";

export const ui = {
  route: "hoy",                         // hoy | rutina | progreso | historial | entreno
  rutinaDay: null,                      // día seleccionado en la pestaña Rutina
  histFilter: "all",
  progEx: lsGet("rutina.progEx", "incline"),
  pending: null,                        // confirmaciones en línea: {kind, id}
  sheet: null,                          // {kind:"tech", ex, tab} | {kind:"settings"}
  alarmUntil: 0,                        // aviso visual de fin de descanso
};

/** Sesión en curso. Se guarda en localStorage en cada cambio para no perder nada si se cierra la app. */
export let draft = lsGet("rutina.draft", null);
export function setDraft(d) { draft = d; saveDraft(); }
export function saveDraft() { lsSet("rutina.draft", draft); }

/** Crea una sesión nueva precargando peso y repeticiones de la última vez */
export function newDraft(day, date = todayStr()) {
  const sets = {};
  for (const e of ROUTINE[day].ex) {
    const prev = lastFor(e.id, date);
    const ps = prev ? prev.sets : [];
    const low = repRange(e)[0];
    sets[e.id] = Array.from({ length: e.sets }, (_, i) => ({
      kg: ps[i]?.kg ?? ps[0]?.kg ?? "",
      reps: ps[i]?.reps ?? String(low),
      done: false,
    }));
  }
  return { day, date, startedAt: Date.now(), cur: 0, sets, cardio: "", notes: "", editingId: null, rest: null };
}

/** Abre una sesión guardada para editarla */
export function draftFromSession(s) {
  const sets = {};
  for (const e of ROUTINE[s.day].ex) {
    const st = performed(s.sets?.[e.id]);
    sets[e.id] = st.length ? st.map(x => ({ kg: x.kg, reps: x.reps, done: true }))
      : Array.from({ length: e.sets }, () => ({ kg: "", reps: String(repRange(e)[0]), done: false }));
  }
  return { day: s.day, date: s.date, startedAt: Date.now(), cur: 0, sets, cardio: s.cardio || "", notes: s.notes || "",
    editingId: s.id, durationMin: s.durationMin ?? null, createdAt: s.createdAt, rest: null };
}

export const draftHasWork = () => !!draft && Object.values(draft.sets).flat().some(x => x.done);
