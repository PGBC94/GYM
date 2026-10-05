// Pantalla «Progreso»: estadísticas, calendario, cargas y peso corporal
import { EX_INDEX } from "../data/routine.js";
import { sessions, weights, streak, topKg } from "../logic.js";
import { store } from "../storage.js";
import { fromKg, unitOf } from "../equipment.js";
import { ui } from "../state.js";
import { esc, icon, todayStr, parseD, weekKey, ymd, fmtShort, fmtD, fmtKg, num, MON_LONG, lsGet, lsSet, toast } from "../utils.js";

export function viewProgreso() {
  const ss = sessions(); const today = new Date();
  const tw = weekKey(today);
  const wk = ss.filter(s => weekKey(parseD(s.date)) === tw).length;
  const st = streak();
  const first = ss[ss.length - 1];
  const since = first ? (() => { const d = parseD(first.date); return `Desde el ${d.getDate()} de ${MON_LONG[d.getMonth()]}`; })() : "Empieza a registrar";

  // calendario de 16 semanas
  const dates = new Set(ss.map(s => s.date));
  const start = parseD(tw); start.setDate(start.getDate() - 7 * 15);
  let cells = "", inRange = 0;
  for (let i = 0; i < 112; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i); const k = ymd(d);
    if (dates.has(k)) inRange++;
    cells += `<i class="${dates.has(k) ? "on" : ""} ${k === todayStr() ? "today" : ""}" title="${fmtD(k)}${dates.has(k) ? " · entrenado" : ""}"></i>`;
  }

  // peso levantado por ejercicio
  const exOpts = Object.values(EX_INDEX).filter(e => e.unit !== "s");
  if (!EX_INDEX[ui.progEx] || EX_INDEX[ui.progEx].unit === "s") ui.progEx = exOpts[0].id;
  const pu = unitOf(ui.progEx);
  const pts = ss.slice().reverse().map(s => { const v = topKg(s.sets?.[ui.progEx]); return v != null ? { date: s.date, v: fromKg(v, pu) } : null; }).filter(Boolean);
  const liftDelta = pts.length > 1 ? pts[pts.length - 1].v - pts[0].v : null;

  const ws = weights(); const wpts = ws.map(w => ({ date: w.date, v: num(w.kg) })).filter(p => p.v != null);
  const wDelta = wpts.length > 1 ? wpts[wpts.length - 1].v - wpts[0].v : null;
  const last = lsGet("rutina.lastBackup", null);
  const daysSince = last ? Math.floor((Date.now() - new Date(last)) / 864e5) : null;

  return `<main class="screen" id="main">
  <header><div class="eyebrow">${esc(since)}</div><h1 class="h-xl">Progreso</h1></header>
  <div class="stats3">
    <div><b>${wk}<small>/3</small></b><span>Esta semana</span></div>
    <div><b>${ss.length}</b><span>Sesiones en total</span></div>
    <div><b class="${st ? "acc-t" : ""}">${st}</b><span>Semanas seguidas 3/3</span></div>
  </div>
  <section class="card">
    <div class="spread"><h2 class="h-sec">Días asistidos</h2><span class="muted" style="font-size:13px">Últimas 16 semanas</span></div>
    <div class="heat" role="img" aria-label="Calendario: ${inRange} sesiones en las últimas 16 semanas">${cells}</div>
    <div class="legend"><span><i style="background:var(--heat0)"></i>Descanso</span><span><i style="background:var(--accent)"></i>Entrenado</span><span style="margin-left:auto">Filas: lun → dom</span></div>
  </section>
  <section class="card">
    <h2 class="h-sec">Peso levantado</h2>
    <div class="select"><label class="sr-only" for="progex">Ejercicio</label>
      <select id="progex" data-act-change="progex">${exOpts.map(e => `<option value="${e.id}" ${e.id === ui.progEx ? "selected" : ""}>${esc(e.name)}</option>`).join("")}</select>${icon("chevD", 18)}</div>
    ${pts.length ? `<div class="row" style="align-items:baseline;gap:10px"><b class="big">${fmtKg(pts[pts.length - 1].v)} <small>${pu}</small></b>
      ${liftDelta != null ? `<span style="font-size:14px;font-weight:600" class="${liftDelta > 0 ? "good-t" : "muted"}">${liftDelta > 0 ? "+" : liftDelta < 0 ? "−" : "±"}${fmtKg(Math.abs(liftDelta))} ${pu} en ${pts.length} sesiones</span>` : ""}</div>
      ${lineChart(pts, pu, "var(--accent)", 160)}`
      : `<p class="empty">Aún no hay registros de este ejercicio. Aquí verás la serie más pesada de cada sesión.</p>`}
  </section>
  <section class="card">
    <div class="spread"><h2 class="h-sec">Peso corporal</h2>${wDelta != null ? `<span style="font-size:14px;font-weight:600" class="${wDelta <= 0 ? "good-t" : "bad-t"}">${wDelta <= 0 ? "−" : "+"}${fmtKg(Math.abs(wDelta))} kg</span>` : ""}</div>
    ${wpts.length ? lineChart(wpts, "kg", "var(--steel)", 130) : `<p class="empty">Pésate una vez por semana, en ayunas y el mismo día, y anótalo aquí para ver la tendencia.</p>`}
    <div class="row" style="align-items:flex-end">
      <label class="field" style="flex:1">Peso de hoy (kg)<input class="input" id="wkg" inputmode="decimal" placeholder="${wpts.length ? fmtKg(wpts[wpts.length - 1].v) : "80,0"}"></label>
      <button class="btn primary" style="min-height:48px" data-act="addweight">Añadir</button>
    </div>
    ${ws.length ? `<div class="wchips">${ws.slice(-5).reverse().map(w => `<button class="btn ghost small" style="text-transform:none;font-family:var(--body);font-weight:600;letter-spacing:0" data-act="delweight" data-id="${esc(w.id)}" aria-label="Borrar ${fmtD(w.date)}, ${fmtKg(w.kg)} kg">${fmtShort(w.date)} · ${fmtKg(w.kg)} kg ✕</button>`).join("")}</div>` : ""}
  </section>
  <button class="backup" data-act="settings">
    ${icon("download", 22, 'style="color:var(--muted);flex-shrink:0"')}
    <span class="t"><b>Copia de seguridad</b><span>${daysSince == null ? "Tus datos viven solo en este móvil" : daysSince === 0 ? "Última copia: hoy" : `Última copia: hace ${daysSince} ${daysSince === 1 ? "día" : "días"}`}</span></span>
    <span class="btn small" style="pointer-events:none">${daysSince == null || daysSince > 14 ? "Descargar" : "Ajustes"}</span>
  </button>
</main>`;
}

function niceStep(r) { const p = Math.pow(10, Math.floor(Math.log10(r || 1))); const m = r / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; }

export function lineChart(pts, unit, color, H = 160) {
  const W = 340, L = 40, R = 12, T = 14, B = 26;
  const vs = pts.map(p => p.v); let lo = Math.min(...vs), hi = Math.max(...vs);
  if (lo === hi) { lo -= 1; hi += 1; }
  const padv = (hi - lo) * .15; lo = Math.max(0, lo - padv); hi += padv;
  const step = niceStep((hi - lo) / 4); lo = Math.floor(lo / step) * step; hi = Math.ceil(hi / step) * step;
  const x = i => pts.length === 1 ? (L + W - R) / 2 : L + i * (W - L - R) / (pts.length - 1);
  const y = v => T + (hi - v) * (H - T - B) / (hi - lo);
  let g = ""; for (let v = lo; v <= hi + 1e-9; v += step) g += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${fmtKg(v)}</text>`;
  const path = pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join("");
  const area = `${path}L${x(pts.length - 1)},${H - B}L${x(0)},${H - B}Z`;
  const lbls = [0, Math.floor((pts.length - 1) / 2), pts.length - 1].filter((v, i, a) => a.indexOf(v) === i);
  const last = pts[pts.length - 1];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución: de ${fmtKg(pts[0].v)} a ${fmtKg(last.v)} ${unit}">
    ${g}<path d="${area}" fill="${color}" fill-opacity=".12"/><path d="${path}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    ${pts.map((p, i) => i === pts.length - 1 ? `<circle cx="${x(i)}" cy="${y(p.v)}" r="5.5" fill="${color}"><title>${fmtD(p.date)}: ${fmtKg(p.v)} ${unit}</title></circle>` : `<circle cx="${x(i)}" cy="${y(p.v)}" r="3.5" fill="var(--surface)" stroke="${color}" stroke-width="2"><title>${fmtD(p.date)}: ${fmtKg(p.v)} ${unit}</title></circle>`).join("")}
    ${lbls.map(i => `<text x="${x(i)}" y="${H - 8}" text-anchor="${pts.length === 1 ? "middle" : i === 0 ? "start" : i === pts.length - 1 ? "end" : "middle"}">${fmtShort(pts[i].date)}</text>`).join("")}
    <text x="${Math.min(x(pts.length - 1), W - R) - 8}" y="${Math.max(T + 10, y(last.v) - 10)}" text-anchor="end" style="fill:var(--fg);font-weight:600;font-size:12px">${fmtKg(last.v)} ${unit}</text>
  </svg>`;
}

export const progresoActions = {
  async "addweight"() {
    const inp = document.getElementById("wkg"); const kg = num(inp?.value);
    if (kg == null || kg < 20 || kg > 400) { toast("Escribe tu peso en kg"); inp?.focus(); return; }
    const date = todayStr();
    try { await store.put({ id: "w_" + date, type: "weight", date, kg: String(kg) }); toast("Peso anotado"); }
    catch { toast("No se pudo guardar el peso"); }
  },
  async "delweight"(el) {
    const rec = store.all.find(r => r.id === el.dataset.id); if (!rec) return;
    await store.del(rec.id);
    toast("Registro borrado", { label: "Deshacer", run: () => store.put(rec) });
  },
};
export function onProgexChange(t) { ui.progEx = t.value; lsSet("rutina.progEx", t.value); }
