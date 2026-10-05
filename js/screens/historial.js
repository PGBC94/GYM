// Pantalla «Historial»: sesiones agrupadas por semana, filtro por día, editar y borrar
import { ROUTINE, EX_INDEX, SHORT } from "../data/routine.js";
import { sessions, setCount, volume, performed, topKg } from "../logic.js";
import { store } from "../storage.js";
import { ui, draft, setDraft, draftFromSession, draftHasWork } from "../state.js";
import { bus } from "../bus.js";
import { fmtW, fromKg, unitOf } from "../equipment.js";
import { esc, icon, parseD, weekKey, fmtShort, fmtKg, DOW, MON, toast } from "../utils.js";

export function viewHistorial() {
  const all = sessions();
  const f = ui.histFilter;
  const list = all.filter(s => f === "all" || s.day === f);
  const perWeekAll = {}; all.forEach(s => { const k = weekKey(parseD(s.date)); perWeekAll[k] = (perWeekAll[k] || 0) + 1; });
  const groups = [];
  for (const s of list) {
    const k = weekKey(parseD(s.date));
    let g = groups[groups.length - 1];
    if (!g || g.k !== k) { g = { k, items: [] }; groups.push(g); }
    g.items.push(s);
  }
  const wkLabel = k => { const a = parseD(k), b = new Date(a); b.setDate(a.getDate() + 6);
    return a.getMonth() === b.getMonth() ? `${a.getDate()} – ${b.getDate()} ${MON[b.getMonth()]}` : `${a.getDate()} ${MON[a.getMonth()]} – ${b.getDate()} ${MON[b.getMonth()]}`; };

  return `<main class="screen" id="main">
  <header><div class="eyebrow">${all.length} ${all.length === 1 ? "sesión guardada" : "sesiones guardadas"}</div><h1 class="h-xl">Historial</h1></header>
  ${all.length ? `<div class="filters" role="group" aria-label="Filtrar por día">
    ${[["all", "Todos"], ["A", "Día A"], ["B", "Día B"], ["C", "Día C"]].map(([k, l]) => `<button aria-pressed="${k === f}" data-act="hfilter" data-f="${k}">${l}</button>`).join("")}
  </div>` : ""}
  ${!all.length ? `<section class="card" style="align-items:center;text-align:center;padding:28px 16px">
      <h2 class="h-sec">Aún no hay entrenamientos</h2>
      <p class="muted" style="margin:0">Empieza desde <b>Hoy</b>; cada sesión que guardes aparecerá aquí. Si tienes datos del prototipo, impórtalos en Ajustes.</p>
      <button class="btn primary" data-go="hoy">Ir a Hoy</button></section>`
    : !list.length ? `<p class="empty">No hay sesiones del ${esc(ROUTINE[f]?.name || f)}.</p>` : ""}
  ${groups.map(g => { const c = perWeekAll[g.k] || 0; return `<section class="wk">
    <div class="wh"><h2>${wkLabel(g.k)}</h2><span class="cnt ${c >= 3 ? "full" : ""}">${c}/3</span></div>
    ${g.items.map(s => sessItem(s)).join("")}
  </section>`; }).join("")}
</main>`;
}

function sessItem(s) {
  const d = parseD(s.date); const sc = setCount(s); const vol = volume(s);
  const lifts = (ROUTINE[s.day]?.ex || []).map(e => { const t = topKg(s.sets?.[e.id]); return t != null && e.unit !== "s" ? `${SHORT[e.id] || e.name} ${fmtW(e.id, t)}` : null; }).filter(Boolean).slice(0, 3).join(" · ");
  const meta = [s.durationMin ? `${s.durationMin} min` : null, `${sc.done}/${sc.total} series`, s.cardio ? `${s.cardio}' cardio` : null].filter(Boolean).join(" · ");
  const pend = ui.pending && ui.pending.id === s.id ? ui.pending.kind : null;
  const rows = Object.entries(s.sets || {}).map(([id, st]) => { const p = performed(st); if (!p.length) return "";
    const secs = EX_INDEX[id]?.unit === "s";
    const u = unitOf(id); const anyKg = p.some(x => num0(x.kg));
    return `<tr><td>${esc(EX_INDEX[id]?.name || id)}${anyKg ? ` <span class="muted" style="font-size:12px">(${u})</span>` : ""}</td><td>${p.map(x => `${x.kg !== "" && num0(x.kg) ? String(fromKg(parseFloat(String(x.kg).replace(",", ".")), u)).replace(".", ",") + "×" : ""}${esc(x.reps)}${secs ? "s" : ""}`).join("  ")}</td></tr>`; }).join("");
  return `<details class="sess" ${ui.openSess === s.id ? "open" : ""} data-sess="${esc(s.id)}">
    <summary>
      <div class="date"><span>${DOW[d.getDay()]}</span><b>${d.getDate()}</b></div>
      <div class="body">
        <div class="row"><span class="tag ${esc(s.day)}">${esc(ROUTINE[s.day]?.name || s.day)}</span><span class="meta">${esc(meta)}</span></div>
        ${lifts ? `<div class="lifts">${esc(lifts)}</div>` : ""}
        ${s.notes ? `<div class="nt">“${esc(s.notes)}”</div>` : ""}
      </div>
    </summary>
    <div class="more">
      <table>${rows}</table>
      ${vol ? `<div class="muted" style="font-size:13px">Volumen: ${vol.toLocaleString("es")} kg</div>` : ""}
      <div class="acts">
        ${pend === "del" ? `<span>¿Borrar esta sesión?</span><button class="btn danger small" data-act="del-yes" data-id="${esc(s.id)}">Sí, borrar</button><button class="btn ghost small" data-act="pending-no">Cancelar</button>`
        : pend === "edit" ? `<span>Tienes un entreno sin guardar. ¿Descartarlo y editar esta sesión?</span><button class="btn danger small" data-act="edit-yes" data-id="${esc(s.id)}">Sí</button><button class="btn ghost small" data-act="pending-no">Cancelar</button>`
        : `<button class="btn ghost small" data-act="edit" data-id="${esc(s.id)}">${icon("edit", 16)} Editar</button><button class="btn danger small" data-act="del" data-id="${esc(s.id)}">${icon("trash", 16)} Borrar</button>`}
      </div>
    </div>
  </details>`;
}
const num0 = v => parseFloat(String(v).replace(",", ".")) > 0;

function startEdit(id) {
  const s = store.all.find(r => r.id === id); if (!s || !ROUTINE[s.day]) return;
  setDraft(draftFromSession(s)); ui.pending = null; bus.go("entreno");
  toast("Editando la sesión del " + fmtShort(s.date));
}

export const historialActions = {
  "hfilter"(el) { ui.histFilter = el.dataset.f; bus.render(); },
  "del"(el) { ui.pending = { kind: "del", id: el.dataset.id }; ui.openSess = el.dataset.id; bus.render(); },
  async "del-yes"(el) {
    const rec = store.all.find(r => r.id === el.dataset.id); ui.pending = null; if (!rec) return;
    await store.del(rec.id);
    toast("Sesión borrada", { label: "Deshacer", run: () => store.put(rec) });
  },
  "edit"(el) {
    if (draftHasWork() && draft.editingId !== el.dataset.id) { ui.pending = { kind: "edit", id: el.dataset.id }; ui.openSess = el.dataset.id; bus.render(); return; }
    startEdit(el.dataset.id);
  },
  "edit-yes"(el) { startEdit(el.dataset.id); },
};
