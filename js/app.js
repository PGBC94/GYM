// Mi Rutina — arranque, navegación y eventos
import { ROUTINE } from "./data/routine.js";
import { store, requestPersist } from "./storage.js";
import { ui, draft, setDraft, newDraft } from "./state.js";
import { bus } from "./bus.js";
import { startAnimations } from "./engine/figure.js";
import { viewHoy } from "./screens/hoy.js";
import { viewEntreno, trainActions, onTrainInput, tick } from "./screens/entreno.js";
import { viewRutina } from "./screens/rutina.js";
import { viewProgreso, progresoActions, onProgexChange } from "./screens/progreso.js";
import { viewHistorial, historialActions } from "./screens/historial.js";
import { techSheet, settingsSheet, sheetActions, importFile } from "./screens/sheets.js";
import { viewEquipo, equipoActions, onEquipoChange, onEquipoInput } from "./screens/equipo.js";
import { $, icon, toast } from "./utils.js";

const TABS = [["hoy", "Hoy"], ["rutina", "Rutina"], ["progreso", "Progreso"], ["historial", "Historial"]];
const ROUTES = new Set([...TABS.map(t => t[0]), "entreno", "equipo"]);
const app = $("#app"), nav = $("#tabs"), sheetEl = $("#sheet");
let ready = false;

/* ---------- Navegación por hash (#/hoy, #/entreno…) ---------- */
function routeFromHash() {
  const r = location.hash.replace(/^#\/?/, "") || "hoy";
  return ROUTES.has(r) ? r : "hoy";
}
bus.go = route => {
  if (route === "entreno" && !draft) route = "hoy";
  if (location.hash !== "#/" + route) location.hash = "#/" + route;
  else { ui.route = route; render(); }
};
addEventListener("hashchange", () => {
  if (sheetEl.dataset.open) hideSheet();
  ui.route = routeFromHash(); ui.pending = null;
  if (ui.route === "entreno" && !draft) { bus.go("hoy"); return; }
  render(); scrollTo(0, 0);
});

/* ---------- Pintado ---------- */
function render() {
  if (!ready) { app.innerHTML = `<main class="screen"><p class="empty">Cargando…</p></main>`; return; }
  const r = ui.route;
  const html = r === "equipo" ? viewEquipo() : r === "entreno" ? viewEntreno() : r === "rutina" ? viewRutina() : r === "progreso" ? viewProgreso() : r === "historial" ? viewHistorial() : viewHoy();
  const y = scrollY;
  // conserva el foco si se repinta mientras se escribe
  const active = document.activeElement; const key = active?.dataset?.field ? `[data-field="${active.dataset.field}"][data-i="${active.dataset.i ?? ""}"]` : active?.id ? "#" + active.id : null;
  app.innerHTML = html;
  scrollTo(0, y);
  if (key) { const el = app.querySelector(key.replace('[data-i=""]', "")); if (el && el !== document.activeElement) { try { el.focus({ preventScroll: true }); } catch { /* */ } } }
  nav.hidden = r === "entreno";
  nav.querySelectorAll("button").forEach(b => { if (b.dataset.go === r) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
  document.title = r === "entreno" && draft ? `${ROUTINE[draft.day].name} · Mi Rutina` : `Mi Rutina · ${r === "equipo" ? "Mi equipo" : TABS.find(t => t[0] === r)?.[1] || "Hoy"}`;
  wakeLock(r === "entreno");
}
bus.render = render;

nav.innerHTML = `<div class="in">${TABS.map(([k, l]) => `<button data-go="${k}">${icon(k)}${l}</button>`).join("")}</div>`;

/* ---------- Hojas inferiores ---------- */
let sheetReturnFocus = null;
bus.openSheet = async (sh, replace) => {
  ui.sheet = sh;
  const html = sh.kind === "tech" ? techSheet(sh) : await settingsSheet();
  const scroll = sheetEl.querySelector(".card-s")?.scrollTop || 0;
  sheetEl.innerHTML = `<div class="card-s" role="dialog" aria-modal="true" aria-labelledby="sheet-title">${html}</div>`;
  if (replace && sheetEl.dataset.open) { sheetEl.querySelector(".card-s").scrollTop = scroll; sheetEl.querySelector(".card-s").style.animation = "none"; return; }
  sheetReturnFocus = document.activeElement;
  sheetEl.hidden = false; sheetEl.dataset.open = "1"; document.body.style.overflow = "hidden";
  history.pushState({ sheet: 1 }, "");
  sheetEl.querySelector("[data-act=close-sheet]")?.focus();
};
function hideSheet() {
  sheetEl.hidden = true; delete sheetEl.dataset.open; sheetEl.innerHTML = ""; ui.sheet = null; document.body.style.overflow = "";
  try { sheetReturnFocus?.focus({ preventScroll: true }); } catch { /* */ }
}
bus.closeSheet = () => { if (history.state?.sheet) history.back(); else hideSheet(); };
addEventListener("popstate", () => { if (sheetEl.dataset.open) hideSheet(); });

/* ---------- Acciones ---------- */
const actions = {
  ...trainActions, ...equipoActions, ...progresoActions, ...historialActions, ...sheetActions,
  "start"(el) {
    const day = el.dataset.day;
    if (draft && Object.values(draft.sets).flat().some(x => x.done) && draft.day !== day) {
      toast(`Tienes un entreno del ${ROUTINE[draft.day].name} en curso`, { label: "Continuar", run: () => bus.go("entreno") }); return;
    }
    if (!draft || draft.day !== day || draft.editingId) setDraft(newDraft(day));
    bus.go("entreno"); requestPersist();
  },
  "resume"() { bus.go("entreno"); },
  "discard-draft"() { ui.pending = { kind: "discard" }; render(); },
  "discard-yes"() { setDraft(null); ui.pending = null; render(); toast("Entreno descartado"); },
  "pending-no"() { ui.pending = null; render(); },
  "rutina-day"(el) { ui.rutinaDay = el.dataset.day; render(); },
  "settings"() { bus.openSheet({ kind: "settings" }); },
  "equipo"() { if (sheetEl.dataset.open) { hideSheet(); history.replaceState(null, "", "#/equipo"); ui.route = "equipo"; render(); scrollTo(0, 0); } else bus.go("equipo"); },
};

document.addEventListener("click", async ev => {
  const go = ev.target.closest("[data-go]");
  if (go) { if (sheetEl.dataset.open) hideSheet(); bus.go(go.dataset.go); return; }
  if (ev.target === sheetEl) { bus.closeSheet(); return; }
  const b = ev.target.closest("[data-act]"); if (!b || b.disabled) return;
  const fn = actions[b.dataset.act]; if (!fn) return;
  ev.preventDefault();
  try { await fn(b, ev); } catch (err) { console.error(err); toast("Algo ha fallado: " + (err?.message || err)); }
});
document.addEventListener("input", ev => { onEquipoInput(ev.target) || onTrainInput(ev.target); });
document.addEventListener("change", ev => {
  const t = ev.target;
  if (onEquipoChange(t)) return;
  if (t.dataset.actChange === "progex") { onProgexChange(t); render(); }
  else if (t.dataset.actChange === "import") importFile(t);
  else if (t.dataset.field === "date" || t.dataset.field === "kg" || t.dataset.field === "reps") render();
});
document.addEventListener("keydown", ev => {
  if (ev.key === "Escape" && sheetEl.dataset.open) bus.closeSheet();
  if (ev.key === "Enter" && ev.target.dataset?.enter) { ev.preventDefault(); actions[ev.target.dataset.enter]?.(ev.target); return; }
  if (ev.key === "Enter" && ev.target.dataset?.field && ev.target.tagName === "INPUT") ev.target.blur();
  if (ev.key === "Enter" && ev.target.id === "wkg") actions.addweight();
});
document.addEventListener("toggle", ev => { const d = ev.target; if (d.dataset?.gen) ui.eqOpen = d.open ? d.dataset.gen : null; if (d.dataset?.sess) ui.openSess = d.open ? d.dataset.sess : (ui.openSess === d.dataset.sess ? null : ui.openSess); }, true);

/* ---------- Pantalla encendida durante el entreno ---------- */
let lock = null;
async function wakeLock(on) {
  try {
    if (on && !lock && "wakeLock" in navigator && document.visibilityState === "visible") {
      lock = await navigator.wakeLock.request("screen"); lock.addEventListener("release", () => { lock = null; });
    } else if (!on && lock) { await lock.release(); lock = null; }
  } catch { lock = null; }
}
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") { wakeLock(ui.route === "entreno"); if (ui.route === "entreno") tick(); }
});
setInterval(() => { if (ui.route === "entreno") tick(); }, 250);

/* ---------- Service worker ---------- */
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./sw.js").then(reg => {
    reg.addEventListener("updatefound", () => {
      const w = reg.installing;
      w?.addEventListener("statechange", () => {
        if (w.state === "installed" && navigator.serviceWorker.controller)
          toast("Hay una versión nueva", { label: "Actualizar", run: () => w.postMessage("skipWaiting") });
      });
    });
  }).catch(() => { /* sin SW: la app funciona igual online */ });
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (!reloaded) { reloaded = true; location.reload(); } });
}

/* ---------- Arranque ---------- */
ui.route = routeFromHash();
render();
store.onChange(() => { if (ready && ui.route !== "entreno") render(); });
store.init().then(() => {
  ready = true;
  if (ui.route === "entreno" && !draft) ui.route = "hoy";
  render();
  startAnimations();
});
