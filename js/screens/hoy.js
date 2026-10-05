// Pantalla «Hoy»: qué toca, semana actual, avisos de progresión y resumen
import { ROUTINE, DAYS } from "../data/routine.js";
import { sessions, weights, nextDay, upgradesFor, programWeek, estMinutes, totalSets, setCount } from "../logic.js";
import { draft, draftHasWork } from "../state.js";
import { esc, icon, todayStr, parseD, weekKey, ymd, DOW_LONG, MON, fmtD, fmtKg, num } from "../utils.js";
import { streak } from "../logic.js";
import { fmtW } from "../equipment.js";

export function viewHoy() {
  const now = new Date(); const today = todayStr();
  const ss = sessions();
  const sug = nextDay();
  const d = ROUTINE[sug];
  const st = streak();
  const doneToday = ss.find(s => s.date === today);
  const active = !!draft;

  // semana actual (lunes → domingo)
  const monday = parseD(weekKey(now));
  const byDate = {}; ss.forEach(s => { byDate[s.date] = byDate[s.date] || s.day; });
  const L = ["L", "M", "X", "J", "V", "S", "D"];
  let wkCount = 0, cells = "";
  for (let i = 0; i < 7; i++) {
    const x = new Date(monday); x.setDate(monday.getDate() + i); const k = ymd(x);
    const on = byDate[k]; if (on) wkCount++;
    const cls = ["dot", on ? "on" : "", k === today ? "today" : ""].join(" ");
    cells += `<div><span class="dow">${L[i]}</span><span class="${cls}" title="${fmtD(k)}">${on ? esc(on) : x.getDate()}</span></div>`;
  }
  const need = Math.max(0, 3 - wkCount);
  const daysLeft = 7 - ((now.getDay() + 6) % 7) - (doneToday ? 1 : 0);
  const wkMsg = need === 0 ? "¡Semana completada! Buen trabajo."
    : need > daysLeft ? `Esta semana ya no llegas a 3, pero cada sesión cuenta.`
    : need === 1 && !doneToday ? "Entrena hoy y cierras la semana 3/3."
    : `Te ${need === 1 ? "falta 1 sesión" : `faltan ${need} sesiones`} para cerrar la semana.`;

  const ups = upgradesFor(sug);
  const ws = weights(); const lastW = ws[ws.length - 1]; const firstW = ws[0];
  const wDiff = lastW && firstW && lastW !== firstW ? num(lastW.kg) - num(firstW.kg) : null;
  const lastS = ss[0];

  const progress = active ? (() => { const all = Object.values(draft.sets).flat(); return `${all.filter(x => x.done).length}/${all.length}`; })() : "";

  return `<main class="screen" id="main">
  <header class="top">
    <div>
      <div class="eyebrow">${DOW_LONG[now.getDay()]} ${now.getDate()} ${MON[now.getMonth()]} · Semana ${programWeek()}</div>
      <h1 class="h-xl">${active ? (draft.editingId ? "Editando<br><span class=\"acc-t\">sesión</span>" : "Entreno<br><span class=\"acc-t\">en curso</span>") : `Hoy toca<br><span class="acc-t">${esc(d.name)}</span>`}</h1>
    </div>
    <div class="row">
      ${st ? `<button class="pill-btn" data-go="progreso" aria-label="Racha: ${st} semanas seguidas con 3 sesiones">${icon("flame", 20, 'style="color:var(--accent)"')}${st} sem</button>` : ""}
      <button class="icon-btn" data-act="settings" aria-label="Ajustes y copia de seguridad">${icon("gear", 22)}</button>
    </div>
  </header>

  ${active ? `
  <section class="hero" aria-label="Entrenamiento en curso">
    <div class="spread"><span class="lbl">${esc(ROUTINE[draft.day].name)} · ${progress} series</span><span class="badge">${draft.editingId ? "Editando" : "En curso"}</span></div>
    <h2>${esc(ROUTINE[draft.day].focus)}</h2>
    <button class="go" data-act="resume">${icon("play", 20)} Continuar</button>
  </section>
  <button class="btn ghost" data-act="discard-draft">${draft.editingId ? "Cancelar la edición" : "Descartar este entreno"}</button>
  ${ui_pendingDiscard()}
  ` : `
  ${doneToday ? `<div class="note">${icon("check", 22, 'style="color:var(--good);flex-shrink:0"')}<span>Ya entrenaste hoy (${esc(ROUTINE[doneToday.day]?.name || doneToday.day)}). Lo ideal es descansar un día entre sesiones.</span></div>` : ""}
  <section class="hero" aria-label="Entrenamiento de hoy">
    <div class="spread"><span class="lbl">Full body · Sesión ${ss.length + 1}</span><span class="badge">Te toca</span></div>
    <h2>${esc(d.focus)}</h2>
    <div class="stats">
      <div><b>${d.ex.length}</b><span>ejercicios</span></div>
      <div><b>${totalSets(sug)}</b><span>series</span></div>
      <div><b>~${estMinutes(sug)}</b><span>minutos</span></div>
    </div>
    <button class="go" data-act="start" data-day="${sug}">${icon("play", 20)} Empezar entrenamiento</button>
  </section>
  <div class="other"><span>¿Otro día?</span>${DAYS.filter(k => k !== sug).map(k => `<button class="btn" data-act="start" data-day="${k}">${esc(ROUTINE[k].name)}</button>`).join("")}</div>
  `}

  <section class="card">
    <div class="spread"><h2 class="h-sec">Esta semana</h2><span class="h-sec num"><span class="acc-t">${wkCount}</span><span class="muted">/3</span></span></div>
    <div class="week">${cells}</div>
    <p class="muted" style="margin:0;font-size:14px">${wkMsg}</p>
  </section>

  ${ups.length && !active ? `
  <section class="card" style="gap:6px">
    <div class="row">${icon("up", 22, 'style="color:var(--good)"')}<h2 class="h-sec">Hoy toca subir peso</h2></div>
    <p class="muted" style="margin:0 0 4px;font-size:14px">Completaste todas las series arriba del rango.</p>
    <ul class="ups">${ups.map(u => `<li><span style="font-weight:500;font-size:15px">${esc(u.e.name)}</span><span class="v"><span class="muted">${fmtW(u.e.id, u.from).split(" ")[0]}</span> → <span class="good-t">${fmtW(u.e.id, u.to)}</span></span></li>`).join("")}</ul>
  </section>` : ""}

  <div class="minis">
    <button class="mini" data-go="progreso">
      <span class="eyebrow" style="font-size:12px">Peso corporal</span>
      ${lastW ? `<b>${fmtKg(lastW.kg)} <small>kg</small></b>
      <span class="sub ${wDiff == null ? "" : wDiff <= 0 ? "good-t" : "bad-t"}">${wDiff == null ? fmtD(lastW.date) : `${wDiff <= 0 ? "−" : "+"}${fmtKg(Math.abs(wDiff))} kg desde el inicio`}</span>`
      : `<b>–</b><span class="sub">Anótalo en Progreso</span>`}
    </button>
    <button class="mini" data-go="historial">
      <span class="eyebrow" style="font-size:12px">Última sesión</span>
      ${lastS ? `<b>${esc(ROUTINE[lastS.day]?.name || lastS.day)}</b><span class="sub">${fmtD(lastS.date)}${lastS.durationMin ? ` · ${lastS.durationMin} min` : ` · ${setCount(lastS).done} series`}</span>`
      : `<b>–</b><span class="sub">Aún no hay sesiones</span>`}
    </button>
  </div>
</main>`;
}

import { ui } from "../state.js";
function ui_pendingDiscard() {
  if (ui.pending?.kind !== "discard") return "";
  return `<div class="acts" style="justify-content:center"><span>¿Seguro? Se perderán las series anotadas.</span>
    <button class="btn danger small" data-act="discard-yes">Sí, descartar</button><button class="btn ghost small" data-act="pending-no">Cancelar</button></div>`;
}
