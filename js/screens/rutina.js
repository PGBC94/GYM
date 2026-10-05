// Pantalla «Rutina»: los tres días, ejercicios y reglas
import { ROUTINE, DAYS, DAY_TAG } from "../data/routine.js";
import { nextDay } from "../logic.js";
import { ui } from "../state.js";
import { esc, icon } from "../utils.js";

export function viewRutina() {
  const sug = nextDay();
  const day = ui.rutinaDay || sug;
  const d = ROUTINE[day];
  return `<main class="screen" id="main">
  <header>
    <div class="eyebrow">Full body · 3 días · Principiante</div>
    <h1 class="h-xl">Rutina</h1>
  </header>
  <div class="daytabs" role="tablist" aria-label="Día">
    ${DAYS.map(k => `<button role="tab" aria-selected="${k === day}" data-act="rutina-day" data-day="${k}"><b>${esc(ROUTINE[k].name)}</b><span>${k === sug ? "Te toca" : DAY_TAG[k]}</span></button>`).join("")}
  </div>
  <section class="card" style="padding:0;gap:0;overflow:hidden">
    <div style="padding:14px 16px 10px"><div class="eyebrow" style="font-size:12px">Enfoque</div>
      <h2 style="font-weight:700;font-size:22px;line-height:1.1;text-transform:uppercase;margin-top:2px">${esc(d.focus)}</h2></div>
    <ul class="exlist">
      ${d.ex.map((e, i) => `<li><button data-act="tech" data-ex="${e.id}" aria-label="${esc(e.name)}: ver técnica">
        <span class="n">${i + 1}</span>
        <span class="t"><b>${esc(e.name)}</b><span>${esc(e.machine)} · desc. ${esc(e.rest)}</span></span>
        <span class="tg">${e.sets} × ${esc(e.reps)}</span>${icon("chevR", 18, 'style="color:var(--dim);flex-shrink:0"')}
      </button></li>`).join("")}
      <li><div class="cardio"><span class="n">${icon("pulse", 16, 'stroke-width="2.4"')}</span>
        <span class="t"><b>${esc(d.finisher.name)}</b><span>${esc(d.finisher.detail)}</span></span>
        <span class="tg acc-t" style="font-size:15px;text-transform:uppercase;letter-spacing:.06em">Cardio</span></div></li>
    </ul>
  </section>
  <button class="btn primary" data-act="start" data-day="${day}">${icon("play", 18)} Entrenar ${esc(d.name)}</button>
  <button class="linkcard" data-act="equipo">${icon("hoy", 24, 'style="color:var(--accent);flex-shrink:0"')}
    <span class="t"><b>Mi equipo</b><span>Apunta los pesos reales de tus máquinas, mancuernas y discos</span></span>${icon("chevR", 20, 'style="color:var(--muted)"')}</button>
  <section class="card">
    <h2 class="h-sec">Cómo funciona</h2>
    <div class="rules">
      <div><i>1</i><p>Entrena 3 días no seguidos (p. ej. lunes, miércoles y viernes) y alterna A → B → C. La app te dice cuál toca.</p></div>
      <div><i>2</i><p>Calienta 5 min en elíptica o bici. Cada sesión dura unos 50-60 min con el cardio final.</p></div>
      <div><i>3</i><p>Termina cada serie sintiendo que podrías hacer 2 repeticiones más.</p></div>
      <div><i>4</i><p><b>Progresión doble:</b> si completas todas las series arriba del rango con buena técnica, sube el peso. Lo verás en verde.</p></div>
      <div><i>5</i><p>Para perder grasa pesa más la alimentación: déficit moderado y unos 1,6 g de proteína por kg al día.</p></div>
      <div><i>6</i><p>Camina a diario: 8.000 pasos o más.</p></div>
    </div>
  </section>
  <p class="muted" style="font-size:13px;margin:0">Si tienes alguna lesión o condición médica, consulta antes con un profesional. Si un ejercicio te molesta en una articulación, cámbialo y anótalo en las notas.</p>
</main>`;
}
