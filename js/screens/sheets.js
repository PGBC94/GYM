// Hojas inferiores: técnica de un ejercicio y ajustes / copia de seguridad
import { EX_INDEX } from "../data/routine.js";
import { TECH } from "../data/technique.js";
import { ANIM } from "../data/animations.js";
import { figSVG, tempoLabel, phaseText, clockOf, togglePlay, toggleSlow, scrubTo } from "../engine/figure.js";
import { metaFor } from "../data/animations.js";
import { store, exportJSON, parseBackup, requestPersist, isPersisted } from "../storage.js";
import { ui } from "../state.js";
import { bus } from "../bus.js";
import { esc, icon, toast, lsGet, fmtD, todayStr } from "../utils.js";
import { install } from "../install.js";

export const APP_VERSION = "1.2.0";

function muscleList(s) { return String(s || "").replace(/\s*\(([^)]*)\)/g, "").split(/,\s*|\s+y\s+/).filter(Boolean); }

export function techSheet(sh) {
  const e = EX_INDEX[sh.ex]; const t = TECH[sh.ex]; if (!e || !t) return "";
  const anims = ANIM[sh.ex] || [];
  const tab = sh.tab || "steps";
  const items = tab === "setup" ? t.setup : tab === "errors" ? t.errors : t.steps;
  const figs = anims.map((an, i) => { const uid = `${sh.ex}-${i}-b`; const ck = clockOf(uid);
    return `<figure class="fig-card">${figSVG(sh.ex, i, true)}
      <figcaption><span>${an.caption ? esc(an.caption) : an.view === "front" ? "Vista frontal" : an.view === "top" ? "Vista desde arriba" : "Vista lateral"}</span><b class="ph" data-ph="${uid}">${esc(phaseText(sh.ex, i, true))}</b></figcaption>
      <div class="figctl">
        <button data-act="fig-play" data-uid="${uid}" aria-label="${ck.paused ? "Reproducir" : "Pausar"}">${icon(ck.paused ? "play" : "pause", 18)}</button>
        <button data-act="fig-slow" data-uid="${uid}" aria-pressed="${ck.speed !== 1}" aria-label="Cámara lenta">0,5×</button>
        <input type="range" min="0" max="1000" step="1" value="0" data-scrub="${uid}" data-ex="${sh.ex}" data-i="${i}" aria-label="Mover la animación a mano">
      </div>
    </figure>`; }).join("");
  const meta = metaFor(sh.ex, 0);
  return `<div class="grip" aria-hidden="true"></div>
    <div class="top">
      <div><div class="eyebrow">${esc(e.machine)}</div><h1 id="sheet-title">${esc(e.name)}</h1></div>
      <button class="icon-btn round" data-act="close-sheet" aria-label="Cerrar">${icon("close", 20)}</button>
    </div>
    ${anims.length > 1 ? `<div class="figs2">${figs}</div>` : figs}
    <p class="muted" style="margin:0;font-size:13px">${anims.length ? `${esc(tempoLabel(anims[0]))}. ` : ""}${meta.work?.length ? `<span class="legend-mus"><span><i style="background:var(--mus)"></i>Músculo que trabaja</span><span><i style="background:var(--good)"></i>Dirección del movimiento</span></span>` : ""}</p>
    <div style="display:flex;flex-direction:column;gap:8px">
      <div class="eyebrow" style="font-size:12px">Trabaja</div>
      <div class="musc">${muscleList(t.musc).map(m => `<span>${esc(m.charAt(0).toUpperCase() + m.slice(1))}</span>`).join("")}</div>
    </div>
    <div class="seg" role="tablist" aria-label="Guía">
      ${[["setup", "Colocación"], ["steps", "Ejecución"], ["errors", "Errores"]].map(([k, l]) => `<button role="tab" aria-selected="${k === tab}" data-act="tech-tab" data-tab="${k}">${l}</button>`).join("")}
    </div>
    <ol class="steps ${tab === "errors" ? "err" : ""}">${items.map((x, i) => `<li><span class="b">${tab === "errors" ? "!" : i + 1}</span><span>${esc(x)}</span></li>`).join("")}</ol>
    <div class="breath">${icon("wind", 22, 'style="color:var(--steel);flex-shrink:0;margin-top:1px"')}<p style="margin:0"><b>Respiración:</b> ${esc(t.breath)}</p></div>`;
}

export async function settingsSheet() {
  const persisted = await isPersisted();
  const last = lsGet("rutina.lastBackup", null);
  const n = store.all.length;
  const sound = localStorage.getItem("rutina.sound") !== "false";
  return `<div class="grip" aria-hidden="true"></div>
    <div class="top">
      <div><div class="eyebrow">Mi Rutina ${APP_VERSION}</div><h1 id="sheet-title">Ajustes</h1></div>
      <button class="icon-btn round" data-act="close-sheet" aria-label="Cerrar">${icon("close", 20)}</button>
    </div>
    <button class="linkcard" style="background:var(--bg)" data-act="equipo">${icon("hoy", 24, 'style="color:var(--accent);flex-shrink:0"')}
      <span class="t"><b>Mi equipo</b><span>Pesos de mancuernas, máquinas, poleas y discos de tu gimnasio</span></span>${icon("chevR", 20, 'style="color:var(--muted)"')}</button>
    <section class="card" style="background:var(--bg)">
      <h2 class="h-sec">Copia de seguridad</h2>
      <p class="muted" style="margin:0;font-size:14px">Tus datos viven solo en este dispositivo (${n} registros${store.mode === "local" ? ", modo básico" : ""}). Descarga una copia de vez en cuando.${last ? ` Última copia: ${fmtD(last.slice(0, 10))}.` : " Aún no has hecho ninguna copia."}</p>
      <button class="btn primary" data-act="export">${icon("download", 20)} Descargar copia (JSON)</button>
      <label class="btn" style="cursor:pointer">${icon("upload", 20)} Importar copia o datos del prototipo<input type="file" accept="application/json,.json" data-act-change="import" class="sr-only"></label>
      <p class="muted" style="margin:0;font-size:13px">Al importar se añaden los registros; los que ya existen con el mismo identificador se sustituyen.</p>
    </section>
    <section class="card" style="background:var(--bg)">
      <h2 class="h-sec">Dispositivo</h2>
      <div class="spread" style="align-items:center"><span style="font-size:15px">Sonido al terminar el descanso</span>
        <button class="btn small ${sound ? "primary" : ""}" data-act="toggle-sound" aria-pressed="${sound}">${sound ? "Activado" : "Desactivado"}</button></div>
      <div class="spread" style="align-items:center"><span style="font-size:15px">Almacenamiento protegido</span>
        ${persisted ? `<span class="good-t" style="font-weight:600">Sí</span>` : `<button class="btn small" data-act="persist">Activar</button>`}</div>
      ${install.available ? `<button class="btn primary" data-act="install">Instalar la app</button>` : install.isStandalone ? `<p class="muted" style="margin:0;font-size:14px">La app está instalada.</p>`
        : `<p class="muted" style="margin:0;font-size:14px">Para instalarla: en iPhone, Compartir › «Añadir a pantalla de inicio»; en Android, menú ⋮ › «Instalar aplicación».</p>`}
    </section>
    <p class="muted" style="margin:0;font-size:13px;text-align:center">Si tienes alguna lesión o condición médica, consulta antes con un profesional.</p>`;
}

export const sheetActions = {
  "fig-play"(el) { const p = togglePlay(el.dataset.uid); el.innerHTML = icon(p ? "play" : "pause", 18); el.setAttribute("aria-label", p ? "Reproducir" : "Pausar"); },
  "fig-slow"(el) { const s = toggleSlow(el.dataset.uid); el.setAttribute("aria-pressed", String(s !== 1)); },
  "close-sheet"() { bus.closeSheet(); },
  "tech-tab"(el) { if (ui.sheet) { ui.sheet.tab = el.dataset.tab; bus.openSheet(ui.sheet, true); } },
  "export"() { exportJSON(); toast("Copia descargada"); bus.openSheet(ui.sheet, true); },
  async "persist"() { const r = await requestPersist(); toast(r ? "Almacenamiento protegido" : "El navegador no lo ha permitido (se suele conceder al instalar la app)"); bus.openSheet(ui.sheet, true); },
  "toggle-sound"() { const on = localStorage.getItem("rutina.sound") !== "false"; try { localStorage.setItem("rutina.sound", String(!on)); } catch { /* */ } bus.openSheet(ui.sheet, true); },
  async "install"() { await install.prompt(); bus.openSheet(ui.sheet, true); },
};

export async function importFile(input) {
  const f = input.files?.[0]; if (!f) return;
  try {
    const recs = parseBackup(await f.text());
    if (!recs.length) { toast("El archivo no tiene sesiones ni pesos válidos"); return; }
    await store.putMany(recs);
    const s = recs.filter(r => r.type === "session").length, w = recs.length - s;
    toast(`Importado: ${s} sesiones y ${w} pesos`);
    bus.render(); bus.openSheet(ui.sheet, true);
  } catch (e) { toast(e.message || "No se pudo importar"); }
  finally { input.value = ""; }
}
export { todayStr };

/** Barra para mover la animación a mano (pausa la reproducción) */
export function onFigScrub(t) {
  if (!t.dataset.scrub) return false;
  scrubTo(t.dataset.scrub, t.dataset.ex, +t.dataset.i, +t.value / 1000);
  const b = document.querySelector(`[data-act="fig-play"][data-uid="${t.dataset.scrub}"]`); if (b) { b.innerHTML = icon("play", 18); b.setAttribute("aria-label", "Reproducir"); }
  return true;
}
