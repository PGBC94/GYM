// Pantalla «Mi equipo»: pesos reales de mancuernas, máquinas, poleas y discos del gimnasio
import { EX_INDEX } from "../data/routine.js";
import { config, saveConfig, defaultConfig, availableIn, plateTotals, platesFor, parseNum, CFG_ID } from "../equipment.js";
import { store } from "../storage.js";
import { ui } from "../state.js";
import { bus } from "../bus.js";
import { esc, icon, toast } from "../utils.js";

const f = v => String(v).replace(".", ",");
const ORDER = ["dumbbells", "latpull", "cable", "legmachine", "barbell", "bodyweight"];
const HELP = {
  dumbbells: "Los pesos de los pares de mancuernas que hay en el rack.",
  latpull: "Los números de la torre de placas de la máquina.",
  cable: "Los pesos de la torre de cada polea (si las dos son iguales, apunta una).",
  legmachine: "Los números de la torre de placas de la máquina.",
  barbell: "Peso de la barra y discos disponibles. Los discos se cuentan por pares (uno a cada lado).",
  bodyweight: "Para plancha e hiperextensiones; el lastre es opcional.",
};

export function viewEquipo() {
  const cfg = config();
  const users = {};
  for (const [ex, k] of Object.entries(cfg.map)) if (EX_INDEX[ex]) (users[k] = users[k] || []).push(EX_INDEX[ex].name);
  const keys = [...ORDER, ...Object.keys(cfg.profiles).filter(k => !ORDER.includes(k))];

  return `<main class="screen" id="main">
  <header class="top" style="align-items:center;justify-content:flex-start">
    <button class="icon-btn" data-act="eq-back" aria-label="Volver">${icon("chevL", 22)}</button>
    <div><div class="eyebrow">Ajustes</div><h1 class="h-xl" style="font-size:40px;margin-top:2px">Mi equipo</h1></div>
  </header>
  <p class="muted" style="margin:0;font-size:15px">Apunta los pesos reales de tu gimnasio. Al entrenar, los botones −/+ saltarán de un peso disponible al siguiente y la app te sugerirá subir al próximo peso que exista de verdad.</p>
  ${keys.map(k => profileCard(k, cfg.profiles[k], users[k] || [])).join("")}
  <section class="card">
    <h2 class="h-sec">Qué usa cada ejercicio</h2>
    <p class="muted" style="margin:0;font-size:14px">Cámbialo si haces un ejercicio con otro equipo (p. ej. hip thrust con barra).</p>
    <ul class="eqmap">${Object.values(EX_INDEX).map(e => `<li><label for="map-${e.id}">${esc(e.name)}</label>
      <div class="select"><select id="map-${e.id}" data-act-change="eq-map" data-ex="${e.id}">${keys.map(k => `<option value="${k}" ${cfg.map[e.id] === k ? "selected" : ""}>${esc(cfg.profiles[k].name)}</option>`).join("")}</select>${icon("chevD", 18)}</div></li>`).join("")}</ul>
  </section>
  ${ui.pending?.kind === "eq-reset"
    ? `<div class="acts" style="justify-content:center"><span>¿Volver a los valores de ejemplo? Se perderán tus cambios de equipo.</span><button class="btn danger small" data-act="eq-reset-yes">Sí, restablecer</button><button class="btn ghost small" data-act="pending-no">Cancelar</button></div>`
    : `<button class="btn ghost" data-act="eq-reset">Restablecer valores de ejemplo</button>`}
</main>`;
}

function unitSeg(k, p) {
  return `<div class="seg" role="group" aria-label="Unidad de ${esc(p.name)}" style="grid-template-columns:repeat(2,minmax(0,1fr));width:120px;flex-shrink:0">
    ${["kg", "lb"].map(u => `<button aria-pressed="${p.unit === u}" aria-selected="${p.unit === u}" data-act="eq-unit" data-p="${k}" data-u="${u}" style="min-height:36px">${u}</button>`).join("")}</div>`;
}

function chips(k, list, field, u) {
  return `<div class="wchips">${list.map(v => `<button class="wchip" data-act="eq-rm" data-p="${k}" data-f="${field}" data-v="${v}" aria-label="Quitar ${f(v)} ${u}">${f(v)}<span aria-hidden="true">✕</span></button>`).join("") || `<span class="muted" style="font-size:14px">Ninguno todavía.</span>`}</div>`;
}

function addRow(k, field, label, ph) {
  return `<div class="row"><label class="sr-only" for="add-${k}-${field}">${label}</label>
    <input class="input" id="add-${k}-${field}" inputmode="decimal" placeholder="${ph}" style="flex:1;min-width:0" data-enter="eq-add" data-p="${k}" data-f="${field}">
    <button class="btn" data-act="eq-add" data-p="${k}" data-f="${field}">${icon("plus", 18)} Añadir</button></div>`;
}

function profileCard(k, p, used) {
  const u = p.unit || "kg";
  const head = `<div class="spread" style="align-items:center"><h2 class="h-sec" style="min-width:0">${esc(p.name)}</h2>${p.kind === "free" ? "" : unitSeg(k, p)}</div>
    <p class="muted" style="margin:0;font-size:14px">${HELP[k] || ""}${used.length ? ` <span style="color:var(--fg-2)">Lo usan: ${used.map(esc).join(", ")}.</span>` : " Ningún ejercicio lo usa ahora."}</p>`;

  if (p.kind === "free") {
    return `<section class="card">${head}
      <label class="field">Salto del lastre (kg) en los botones −/+
        <input class="input" inputmode="decimal" value="${f(p.step || 2.5)}" data-act-change="eq-step" data-p="${k}"></label></section>`;
  }

  if (p.kind === "plates") {
    const totals = plateTotals(p);
    const tgt = ui.calcTarget ?? "";
    const t = parseNum(tgt);
    let calc = "";
    if (t != null) {
      const r = platesFor(p, t);
      calc = t < (p.bar || 0) ? `<p class="bad-t" style="margin:0">Es menos que la barra (${f(p.bar)} ${u}).</p>`
        : `<div class="note ${r.exact ? "up" : ""}">${icon(r.exact ? "check" : "up", 20, `style="flex-shrink:0;color:var(--${r.exact ? "good" : "accent"})"`)}<div>${r.exact ? "" : `No sale exacto. Lo más cercano por debajo: <b>${f(r.total)} ${u}</b>.<br>`}
          Por lado: <b>${r.perSide.length ? r.perSide.map(f).join(" + ") : "nada"}</b> ${u} · barra ${f(p.bar)} ${u}</div></div>`;
    }
    return `<section class="card">${head}
      <label class="field">Peso de la barra (${u})<input class="input" inputmode="decimal" value="${f(p.bar ?? 20)}" data-act-change="eq-bar" data-p="${k}"></label>
      <div class="eyebrow" style="font-size:12px">Discos (pares)</div>
      <ul class="plates">${(p.plates || []).slice().sort((a, b) => b.w - a.w).map(pl => `<li>
        <span class="disc" style="--d:${Math.min(56, 26 + pl.w * 1.4)}px">${f(pl.w)}</span>
        <span style="flex:1">${f(pl.w)} ${u}</span>
        <div class="stepper" style="width:150px;height:44px">
          <button data-act="eq-pairs" data-p="${k}" data-w="${pl.w}" data-d="-1" aria-label="Un par menos de ${f(pl.w)}">${icon("minus", 20)}</button>
          <span style="font:800 18px var(--display);white-space:nowrap">${pl.pairs} ${pl.pairs === 1 ? "par" : "pares"}</span>
          <button data-act="eq-pairs" data-p="${k}" data-w="${pl.w}" data-d="1" aria-label="Un par más de ${f(pl.w)}">${icon("plus", 20)}</button>
        </div></li>`).join("")}</ul>
      ${addRow(k, "plates", "Añadir disco", `Nuevo disco (${u}), p. ej. 0,5`)}
      <p class="muted" style="margin:0;font-size:13px">Con esto puedes cargar de ${f(totals[0])} a ${f(totals[totals.length - 1])} ${u} (${totals.length} pesos distintos).</p>
      <div class="eyebrow" style="font-size:12px;margin-top:4px">Calculadora de discos</div>
      <label class="field">Peso total que quieres en la barra (${u})<input class="input" id="calc" inputmode="decimal" value="${esc(tgt)}" placeholder="p. ej. 62,5" data-act-input="eq-calc"></label>
      <div id="calc-out">${calc}</div>
    </section>`;
  }

  const list = (p.weights || []).slice().sort((a, b) => a - b);
  const all = availableIn(p) || [];
  const isMachine = k !== "dumbbells";
  const g = ui.eqGen?.[k] || {};
  return `<section class="card">${head}
    <div class="eyebrow" style="font-size:12px">${k === "dumbbells" ? "Pesos disponibles" : "Torre de placas"} (${list.length})</div>
    ${chips(k, list, "weights", u)}
    ${addRow(k, "weights", "Añadir peso", `Añadir peso (${u})`)}
    <details class="gen" ${ui.eqOpen === k ? "open" : ""} data-gen="${k}">
      <summary>Generar la lista de golpe</summary>
      <div class="gen-in">
        <label class="field">Desde<input class="input" id="g-from-${k}" inputmode="decimal" value="${esc(g.from ?? (list[0] ?? ""))}"></label>
        <label class="field">Salto<input class="input" id="g-step-${k}" inputmode="decimal" value="${esc(g.step ?? (list.length > 1 ? f(list[1] - list[0]) : ""))}"></label>
        <label class="field">Hasta<input class="input" id="g-to-${k}" inputmode="decimal" value="${esc(g.to ?? (list[list.length - 1] ?? ""))}"></label>
      </div>
      <button class="btn" data-act="eq-gen" data-p="${k}" style="width:100%">Reemplazar la lista</button>
    </details>
    ${isMachine ? `<div class="eyebrow" style="font-size:12px;margin-top:4px">Pesas añadidas (opcional)</div>
      <p class="muted" style="margin:0;font-size:13px">Las mini-placas que se suman a la torre (p. ej. +2,5). La app las combina con cada placa.</p>
      ${chips(k, (p.extras || []).slice().sort((a, b) => a - b), "extras", u)}
      ${addRow(k, "extras", "Añadir pesa añadida", `Pesa añadida (${u})`)}
      ${(p.extras || []).length ? `<p class="muted" style="margin:0;font-size:13px">Con ellas tienes ${all.length} pesos posibles.</p>` : ""}` : ""}
  </section>`;
}

/* ---------- Acciones ---------- */
function mutate(fn) { const cfg = config(); fn(cfg); return saveConfig(cfg); }

export const equipoActions = {
  "eq-back"() { if (history.length > 1) history.back(); else bus.go("hoy"); },
  "eq-unit"(el) { mutate(c => { c.profiles[el.dataset.p].unit = el.dataset.u; }); toast(el.dataset.u === "lb" ? "Ahora se muestra en libras (lb). Tus registros se guardan igual." : "Ahora se muestra en kg"); },
  "eq-rm"(el) {
    const k = el.dataset.p, fl = el.dataset.f, v = +el.dataset.v;
    mutate(c => { c.profiles[k][fl] = (c.profiles[k][fl] || []).filter(x => x !== v); });
  },
  "eq-add"(el) {
    const k = el.dataset.p, fl = el.dataset.f;
    const inp = document.getElementById(`add-${k}-${fl}`); const v = parseNum(inp?.value);
    if (v == null || v <= 0 && fl !== "weights") { toast("Escribe un número, p. ej. 12,5"); inp?.focus(); return; }
    mutate(c => {
      const p = c.profiles[k];
      if (fl === "plates") {
        const ex = p.plates.find(x => x.w === v);
        if (ex) ex.pairs += 1; else p.plates.push({ w: v, pairs: 1 });
      } else p[fl] = [...new Set([...(p[fl] || []), v])].sort((a, b) => a - b);
    }).then(() => { const i = document.getElementById(`add-${k}-${fl}`); i?.focus(); });
  },
  "eq-gen"(el) {
    const k = el.dataset.p;
    const from = parseNum(document.getElementById(`g-from-${k}`).value), step = parseNum(document.getElementById(`g-step-${k}`).value), to = parseNum(document.getElementById(`g-to-${k}`).value);
    if (from == null || !step || to == null || to < from) { toast("Revisa Desde, Salto y Hasta"); return; }
    if ((to - from) / step > 200) { toast("Son demasiados pesos; usa un salto mayor"); return; }
    const out = []; for (let v = from; v <= to + 1e-9; v += step) out.push(Math.round(v * 100) / 100);
    ui.eqOpen = null;
    mutate(c => { c.profiles[k].weights = out; });
    toast(`Lista creada: ${out.length} pesos`);
  },
  "eq-pairs"(el) {
    const k = el.dataset.p, w = +el.dataset.w, d = +el.dataset.d;
    mutate(c => {
      const p = c.profiles[k]; const pl = p.plates.find(x => x.w === w); if (!pl) return;
      pl.pairs += d; if (pl.pairs <= 0) p.plates = p.plates.filter(x => x !== pl);
    });
  },
  "eq-reset"() { ui.pending = { kind: "eq-reset" }; bus.render(); },
  async "eq-reset-yes"() { ui.pending = null; await store.put({ ...defaultConfig(), id: CFG_ID }); toast("Equipo restablecido"); },
};

export function onEquipoChange(t) {
  const a = t.dataset.actChange;
  if (a === "eq-map") { mutate(c => { c.map[t.dataset.ex] = t.value; }); toast("Guardado"); return true; }
  if (a === "eq-bar") { const v = parseNum(t.value); if (v == null) { toast("Peso de barra no válido"); return true; } mutate(c => { c.profiles[t.dataset.p].bar = v; }); return true; }
  if (a === "eq-step") { const v = parseNum(t.value); if (!v) { toast("Salto no válido"); return true; } mutate(c => { c.profiles[t.dataset.p].step = v; }); return true; }
  return false;
}

/** Calculadora: se actualiza mientras escribes, sin repintar toda la pantalla */
export function onEquipoInput(t) {
  if (t.dataset.actInput !== "eq-calc") return false;
  ui.calcTarget = t.value;
  const cfg = config(); const k = Object.keys(cfg.profiles).find(x => cfg.profiles[x].kind === "plates");
  const out = document.getElementById("calc-out"); if (!out || !k) return true;
  const tmp = document.createElement("div"); tmp.innerHTML = profileCard(k, cfg.profiles[k], []);
  out.innerHTML = tmp.querySelector("#calc-out")?.innerHTML || "";
  return true;
}
