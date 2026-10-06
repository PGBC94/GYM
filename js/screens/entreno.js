// Modo «Entrenando»: un ejercicio por pantalla, steppers, temporizador de descanso y cierre de sesión
import { ROUTINE, INC, restSec, repRange } from "../data/routine.js";
import { TECH } from "../data/technique.js";
import { figSVG, phaseText } from "../engine/figure.js";
import { lastFor, readyToProgress, topKg, performed } from "../logic.js";
import { store } from "../storage.js";
import { draft, setDraft, saveDraft, ui } from "../state.js";
import { bus } from "../bus.js";
import { profileFor, stepWeight, nextUp, fromKg, toKg, fmtW, platesFor } from "../equipment.js";
import { esc, icon, fmtClock, fmtKg, num, toast, todayStr, fmtD } from "../utils.js";

const muscles = id => (TECH[id]?.musc || "").split(/,\s*|\s+y\s+|\s*\(/)[0];

export function viewEntreno() {
  if (!draft) return "";
  const d = ROUTINE[draft.day];
  const n = d.ex.length;
  const cur = Math.min(draft.cur ?? 0, n);
  const isFin = cur === n;
  const segs = d.ex.map((e, i) => {
    const st = draft.sets[e.id]; const done = st.length && st.every(x => x.done);
    return `<button data-act="goto" data-i="${i}" class="${done ? "done" : ""} ${i === cur ? "cur" : ""}" aria-label="Ir a ${esc(e.name)}${done ? " (hecho)" : ""}"><i></i></button>`;
  }).join("") + `<button data-act="goto" data-i="${n}" class="${isFin ? "cur" : ""}" aria-label="Ir al cardio final"><i></i></button>`;

  return `<div class="train">
  <header>
    <div class="spread" style="align-items:center">
      <button class="icon-btn" data-act="exit-train" aria-label="Salir (la sesión queda guardada como borrador)">${icon("close", 22)}</button>
      <div class="clock">
        <div class="eyebrow" style="font-size:12px">${esc(d.name)} · ${isFin ? "Cardio final" : `${cur + 1} de ${n}`}</div>
        <b id="clock">${draft.editingId ? "Editando" : fmtClock((Date.now() - draft.startedAt) / 1000)}</b>
      </div>
      <button class="btn good" data-act="goto" data-i="${n}" ${isFin ? "disabled" : ""}>Terminar</button>
    </div>
    <div class="segs" style="grid-template-columns:repeat(${n + 1},minmax(0,1fr))">${segs}</div>
  </header>
  ${isFin ? finHTML(d) : exHTML(d, cur)}
  </div>`;
}

function exHTML(d, cur) {
  const e = d.ex[cur]; const st = draft.sets[e.id];
  const prev = lastFor(e.id, draft.date, draft.editingId);
  const up = prev && readyToProgress(e, prev.sets);
  const prevTxt = prev ? (() => {
    const p = performed(prev.sets).map(x => `${x.kg !== "" && num(x.kg) ? fmtW(e.id, num(x.kg)) + " × " : ""}${x.reps}${e.unit === "s" ? " s" : ""}`);
    return p.every(t => t === p[0]) ? `${p.length} series de ${p[0]}` : p.join(" · ");
  })() : "";
  const first = st.findIndex(x => !x.done);
  const secs = e.unit === "s";
  const next = d.ex[cur + 1];
  let note;
  if (up) { const t = topKg(prev.sets); note = `<div class="note up">${icon("up", 22, 'style="flex-shrink:0;color:var(--good)"')}<div><b>¡Sube el peso hoy!</b>${t != null && nextUp(e.id, t) > t ? ` Prueba con ${fmtW(e.id, nextUp(e.id, t))}.` : t != null ? " Ya estás en el peso máximo de tu equipo: añade repeticiones o una serie." : ""}<br>Última vez: ${esc(prevTxt)}</div></div>`; }
  else if (prev) note = `<div class="note">${icon("historial", 20, 'style="flex-shrink:0;color:var(--muted)"')}<div>Última vez (${fmtD(prev.session.date)}): ${esc(prevTxt)}</div></div>`;
  else note = `<div class="note">${icon("historial", 20, 'style="flex-shrink:0;color:var(--muted)"')}<div>Primera vez: elige un peso con el que llegues al rango dejando 2 repeticiones en reserva.</div></div>`;

  const prof = profileFor(e.id); const U = prof.unit || "kg";
  const shown = v => { const k = num(v); return k == null ? "" : String(fromKg(k, U)).replace(".", ","); };
  const rows = st.map((x, i) => {
    const cls = x.done ? "done" : i === first ? "cur" : "";
    return `<div class="set ${cls}">
      <div class="stepper">
        <button data-act="kg" data-i="${i}" data-d="-1" aria-label="Bajar peso de la serie ${i + 1}">${icon("minus", 22)}</button>
        <input data-field="kg" data-i="${i}" inputmode="decimal" enterkeyhint="done" autocomplete="off" aria-label="${secs ? "Lastre" : "Peso"} de la serie ${i + 1} en ${U}" value="${esc(shown(x.kg))}" placeholder="${U}">
        <button data-act="kg" data-i="${i}" data-d="1" aria-label="Subir peso de la serie ${i + 1}">${icon("plus", 22)}</button>
      </div>
      <div class="stepper">
        <button data-act="reps" data-i="${i}" data-d="-1" aria-label="Quitar ${secs ? "5 segundos" : "una repetición"} en la serie ${i + 1}">${icon("minus", 22)}</button>
        <input data-field="reps" data-i="${i}" inputmode="numeric" enterkeyhint="done" autocomplete="off" aria-label="${secs ? "Segundos" : "Repeticiones"} de la serie ${i + 1}" value="${esc(x.reps)}" placeholder="–">
        <button data-act="reps" data-i="${i}" data-d="1" aria-label="Añadir ${secs ? "5 segundos" : "una repetición"} en la serie ${i + 1}">${icon("plus", 22)}</button>
      </div>
      <button class="chk" data-act="done" data-i="${i}" aria-pressed="${x.done}" aria-label="${x.done ? `Serie ${i + 1} hecha, desmarcar` : `Marcar serie ${i + 1} como hecha`}">${x.done ? icon("check", 24, 'stroke-width="3"') : i + 1}</button>
    </div>`;
  }).join("");

  return `<main>
    <div>
      <div class="eyebrow">${esc(e.machine)}</div>
      <h1>${esc(e.name)}</h1>
      <div class="chips" style="margin-top:10px">
        <span class="chip acc">${e.sets} × ${esc(e.reps)}</span>
        <span class="chip">Descanso ${esc(e.rest)}</span>
        ${muscles(e.id) ? `<span class="chip">${esc(muscles(e.id))}</span>` : ""}
      </div>
    </div>
    <div class="cue">
      <div class="stage">${figSVG(e.id, 0)}<span class="ph" data-ph="${e.id}-0-s" aria-live="off">${esc(phaseText(e.id, 0, false))}</span></div>
      <div class="col">
        <p>${esc(e.tip)}</p>
        <button class="btn" data-act="tech" data-ex="${e.id}">${icon("video", 18)} Ver técnica</button>
      </div>
    </div>
    ${note}
    <section class="sets" aria-label="Series">
      <div class="hd"><span>${secs ? "Lastre" : "Peso"} · ${U}</span><span>${secs ? "Segundos" : "Reps"}</span><span>Serie</span></div>
      ${rows}
      ${platesHTML(prof, st, first)}
      <div class="row"><button class="dashed" data-act="addset">+ Añadir serie</button>${st.length > 1 ? `<button class="dashed" style="flex:0 0 auto;padding:0 16px" data-act="rmset" aria-label="Quitar la última serie">− Quitar</button>` : ""}</div>
    </section>
    <div class="nav2">
      ${cur > 0 ? `<button class="icon-btn" style="height:auto;min-height:64px;width:52px" data-act="goto" data-i="${cur - 1}" aria-label="Ejercicio anterior">${icon("chevL", 22)}</button>` : "<span></span>"}
      <button class="nextcard" data-act="goto" data-i="${cur + 1}">
        <div class="t">
          <div class="eyebrow" style="font-size:12px">Siguiente</div>
          <div style="font-weight:600">${next ? esc(next.name) : "Cardio final"}</div>
          <div style="font-size:13px" class="muted">${next ? `${next.sets} × ${esc(next.reps)} · ${esc(next.machine)}` : esc(d.finisher.name)}</div>
        </div>${icon("chevR", 22, 'style="color:var(--muted)"')}
      </button>
    </div>
  </main>
  <div id="restwrap">${restHTML()}</div>`;
}

function finHTML(d) {
  const all = d.ex.flatMap(e => draft.sets[e.id]);
  const done = all.filter(x => x.done).length;
  const missing = d.ex.filter(e => !draft.sets[e.id].some(x => x.done));
  return `<main>
    <div>
      <div class="eyebrow">Cardio final</div>
      <h1>${esc(d.finisher.name)}</h1>
      <p class="muted" style="margin:8px 0 0">${esc(d.finisher.detail)}</p>
    </div>
    <label class="field">Minutos de cardio<input class="input" data-field="cardio" inputmode="numeric" value="${esc(draft.cardio)}" placeholder="${parseInt(d.finisher.detail) || 12}"></label>
    <label class="field">Notas (cómo te sentiste, molestias…)<textarea class="input" data-field="notes">${esc(draft.notes)}</textarea></label>
    <label class="field">Fecha<input class="input" type="date" data-field="date" value="${esc(draft.date)}" max="${todayStr()}"></label>
    <section class="card" style="gap:8px">
      <div class="spread"><h2 class="h-sec">Resumen</h2><span class="h-sec num"><span class="${done === all.length ? "good-t" : "acc-t"}">${done}</span><span class="muted">/${all.length} series</span></span></div>
      ${missing.length ? `<p class="muted" style="margin:0;font-size:14px">Sin series marcadas: ${missing.map(e => esc(e.name)).join(", ")}. Solo se guardan las series marcadas con ✓.</p>` : `<p class="good-t" style="margin:0;font-size:14px">Todas las series completadas.</p>`}
    </section>
    <button class="btn primary" style="min-height:58px;font-size:21px" data-act="save">${draft.editingId ? "Guardar cambios" : "Guardar entrenamiento"}</button>
    <button class="btn ghost" data-act="goto" data-i="0">Volver a los ejercicios</button>
  </main>`;
}

/* ---------- Temporizador de descanso ---------- */
export function restHTML() {
  if (!draft || draft.cur >= ROUTINE[draft.day].ex.length) return "";
  const r = draft.rest;
  if (r && r.endAt > Date.now()) {
    const left = (r.endAt - Date.now()) / 1000;
    return `<div class="restbar" role="timer" aria-live="off">
      <div class="row">
        <div style="flex:1"><div class="lbl">Descanso</div><div class="t" id="rest-t">${fmtClock(Math.ceil(left))}</div></div>
        <button class="adj" data-act="rest" data-d="-15" aria-label="Quitar 15 segundos">−15</button>
        <button class="adj" data-act="rest" data-d="15" aria-label="Añadir 15 segundos">+15</button>
        <button class="skip" data-act="rest-skip">Saltar</button>
      </div>
      <div class="track"><i id="rest-bar" style="width:${Math.min(100, left / r.total * 100)}%"></i></div>
    </div>`;
  }
  const e = ROUTINE[draft.day].ex[draft.cur]; const st = draft.sets[e.id];
  const first = st.findIndex(x => !x.done);
  const alarm = ui.alarmUntil > Date.now();
  if (first === -1) return `<button class="restbar ready ${alarm ? "alarm" : ""}" style="border:0;border-top:1px solid var(--line);color:var(--fg);width:100%;text-align:left" data-act="goto" data-i="${draft.cur + 1}">${icon("check", 22, 'style="color:var(--good)"')}<span style="flex:1">Ejercicio completado · siguiente</span>${icon("chevR", 22)}</button>`;
  return `<div class="restbar ready ${alarm ? "alarm" : ""}">${icon(alarm ? "check" : "play", 22, `style="color:var(--${alarm ? "good" : "accent"})"`)}<span>${alarm ? "¡Descanso terminado! " : ""}A por la serie ${first + 1}</span></div>`;
}

let audioCtx = null;
function unlockAudio() { try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === "suspended") audioCtx.resume(); } catch { /* sin audio */ } }
function beep() {
  try {
    if (!audioCtx || localStorage.getItem("rutina.sound") === "false") return;
    [0, 0.25, 0.5].forEach((t, i) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = i === 2 ? 1320 : 880; o.type = "sine";
      g.gain.setValueAtTime(0.0001, audioCtx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.35, audioCtx.currentTime + t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + t + 0.18);
      o.connect(g).connect(audioCtx.destination); o.start(audioCtx.currentTime + t); o.stop(audioCtx.currentTime + t + 0.2);
    });
  } catch { /* */ }
}
function refreshRest() { const w = document.getElementById("restwrap"); if (w) w.innerHTML = restHTML(); }

/** Llamado ~4 veces por segundo mientras se está en «Entrenando» */
export function tick() {
  if (!draft) return;
  const c = document.getElementById("clock");
  if (c && !draft.editingId) c.textContent = fmtClock((Date.now() - draft.startedAt) / 1000);
  const r = draft.rest;
  if (!r) { if (ui.alarmUntil && ui.alarmUntil < Date.now()) { ui.alarmUntil = 0; refreshRest(); } return; }
  const left = (r.endAt - Date.now()) / 1000;
  if (left <= 0) {
    draft.rest = null; saveDraft();
    ui.alarmUntil = Date.now() + 5000;
    try { navigator.vibrate?.([250, 120, 250, 120, 400]); } catch { /* */ }
    beep();
    refreshRest();
    return;
  }
  const t = document.getElementById("rest-t"), b = document.getElementById("rest-bar");
  if (t) t.textContent = fmtClock(Math.ceil(left));
  if (b) b.style.width = Math.min(100, left / r.total * 100) + "%";
  if (!t) refreshRest();
}

/* ---------- Acciones ---------- */
const curEx = () => ROUTINE[draft.day].ex[draft.cur];
const round2 = v => Math.round(v * 100) / 100;

export const trainActions = {
  "goto"(el) { draft.cur = Math.max(0, Math.min(+el.dataset.i, ROUTINE[draft.day].ex.length)); saveDraft(); bus.render(); window.scrollTo(0, 0); },
  "exit-train"() { bus.go("hoy"); },
  "tech"(el) { bus.openSheet({ kind: "tech", ex: el.dataset.ex, tab: "steps" }); },
  "kg"(el) {
    const e = curEx(), s = draft.sets[e.id][+el.dataset.i];
    s.kg = String(stepWeight(e.id, num(s.kg), +el.dataset.d));
    // al cambiar el peso de una serie pendiente, propágalo a las siguientes pendientes
    draft.sets[e.id].forEach((x, j) => { if (j > +el.dataset.i && !x.done) x.kg = s.kg; });
    saveDraft(); bus.render();
  },
  "reps"(el) {
    const e = curEx(), s = draft.sets[e.id][+el.dataset.i];
    const step = e.unit === "s" ? 5 : 1; const v = parseInt(s.reps); const base = isNaN(v) ? repRange(e)[0] : v;
    s.reps = String(Math.max(0, isNaN(v) ? base : base + step * +el.dataset.d));
    saveDraft(); bus.render();
  },
  "done"(el) {
    unlockAudio();
    const e = curEx(), s = draft.sets[e.id][+el.dataset.i];
    if (!s.done && String(s.reps).trim() === "") { toast(`Anota ${e.unit === "s" ? "los segundos" : "las repeticiones"} antes de marcar la serie`); return; }
    s.done = !s.done;
    if (s.done) { const t = restSec(e); draft.rest = { endAt: Date.now() + t * 1000, total: t }; ui.alarmUntil = 0; }
    else if (draft.rest) draft.rest = null;
    try { navigator.vibrate?.(30); } catch { /* */ }
    saveDraft(); bus.render();
  },
  "addset"() { const st = draft.sets[curEx().id]; const l = st[st.length - 1] || { kg: "", reps: "" }; st.push({ kg: l.kg, reps: l.reps, done: false }); saveDraft(); bus.render(); },
  "rmset"() { const st = draft.sets[curEx().id]; if (st.length > 1) st.pop(); saveDraft(); bus.render(); },
  "rest"(el) {
    if (!draft.rest) return;
    draft.rest.endAt += +el.dataset.d * 1000;
    draft.rest.total = Math.max(draft.rest.total + (+el.dataset.d > 0 ? +el.dataset.d : 0), 1);
    if (draft.rest.endAt <= Date.now()) draft.rest = null;
    saveDraft(); refreshRest();
  },
  "rest-skip"() { draft.rest = null; saveDraft(); refreshRest(); },
  async "save"(el) {
    const d = ROUTINE[draft.day];
    const sets = {};
    for (const e of d.ex) {
      const st = draft.sets[e.id].filter(x => x.done && String(x.reps).trim() !== "").map(x => ({ kg: String(x.kg).replace(",", "."), reps: String(x.reps), done: true }));
      if (st.length) sets[e.id] = st;
    }
    if (!Object.keys(sets).length) { toast("Marca al menos una serie con ✓ para guardar"); return; }
    const id = draft.editingId || "s_" + Date.now();
    const rec = {
      id, type: "session", date: draft.date || todayStr(), day: draft.day, sets,
      cardio: String(draft.cardio || "").trim(), notes: String(draft.notes || "").trim(),
      createdAt: draft.createdAt || new Date().toISOString(),
      durationMin: draft.editingId ? (draft.durationMin ?? null) : Math.max(1, Math.round((Date.now() - draft.startedAt) / 60000)),
    };
    if (rec.durationMin == null) delete rec.durationMin;
    el.disabled = true;
    try {
      await store.put(rec);
      const wasEdit = !!draft.editingId;
      setDraft(null);
      ui.histFilter = "all";
      bus.go("historial");
      toast(wasEdit ? "Sesión actualizada" : "Entrenamiento guardado. ¡Buen trabajo!");
    } catch (err) {
      el.disabled = false;
      toast("No se pudo guardar: " + (err?.message || "error") + ". Inténtalo de nuevo.");
    }
  },
};

/** Edición directa de campos sin volver a pintar (para no perder el foco del teclado) */
export function onTrainInput(t) {
  if (!draft) return false;
  const f = t.dataset.field; if (!f) return false;
  if (f === "kg" || f === "reps") {
    const e = curEx(); const s = draft.sets[e.id][+t.dataset.i];
    if (f === "reps") s.reps = t.value.replace(/[^\d]/g, "");
    else { const v = num(t.value.replace(/[^\d.,]/g, "")); s.kg = v == null ? "" : String(toKg(v, profileFor(e.id).unit || "kg")); }
  } else if (f === "cardio") draft.cardio = t.value.replace(/[^\d]/g, "");
  else if (f === "notes") draft.notes = t.value;
  else if (f === "date") draft.date = t.value || todayStr();
  saveDraft();
  return true;
}

/** Reparto de discos por lado cuando el ejercicio se hace con barra */
function platesHTML(prof, st, first) {
  if (prof.kind !== "plates") return "";
  const x = st[first === -1 ? st.length - 1 : first]; const kg = num(x?.kg);
  if (kg == null) return "";
  const U = prof.unit || "kg"; const t = fromKg(kg, U); const r = platesFor(prof, t);
  const fx = v => String(v).replace(".", ",");
  return `<div class="note">${icon("hoy", 20, 'style="flex-shrink:0;color:var(--accent)"')}<div class="platesline">Serie ${(first === -1 ? st.length : first + 1)}: por lado <b>${r.perSide.length ? r.perSide.map(fx).join(" + ") : "solo barra"}</b> · barra ${fx(prof.bar)} ${U}${r.exact ? "" : ` · <span class="bad-t">no sale exacto (${fx(r.total)} ${U})</span>`}</div></div>`;
}
