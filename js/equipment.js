// Equipo del gimnasio: pesos reales de mancuernas, máquinas, poleas y discos.
// Se guarda como un registro {id:"cfg_equipment", type:"config"} en IndexedDB, así entra en las copias de seguridad.
// Los pesos de las series se guardan SIEMPRE en kg; si un equipo está en libras solo cambia cómo se muestra y se introduce.
import { store } from "./storage.js";
import { INC } from "./data/routine.js";

export const CFG_ID = "cfg_equipment";
export const LB = 0.45359237;

const range = (from, step, to) => { const out = []; for (let v = from; v <= to + 1e-9; v += step) out.push(Math.round(v * 100) / 100); return out; };

export const DEFAULT_PROFILES = {
  dumbbells: { name: "Mancuernas", kind: "list", unit: "kg", weights: [...range(1, 1, 10), ...range(12, 2, 40)], extras: [] },
  latpull: { name: "Máquina de jalón (Precor)", kind: "list", unit: "kg", weights: range(5, 5, 100), extras: [] },
  cable: { name: "Polea doble (functional trainer)", kind: "list", unit: "kg", weights: range(2.5, 2.5, 50), extras: [] },
  legmachine: { name: "Máquina extensión / curl de pierna", kind: "list", unit: "kg", weights: range(5, 5, 80), extras: [] },
  barbell: { name: "Barra y discos", kind: "plates", unit: "kg", bar: 20, plates: [{ w: 20, pairs: 2 }, { w: 15, pairs: 1 }, { w: 10, pairs: 2 }, { w: 5, pairs: 2 }, { w: 2.5, pairs: 2 }, { w: 1.25, pairs: 2 }] },
  bodyweight: { name: "Peso corporal (lastre opcional)", kind: "free", unit: "kg", step: 2.5 },
};

export const DEFAULT_MAP = {
  goblet: "dumbbells", dbbench: "dumbbells", dbpress: "dumbbells", rdl: "dumbbells", incline: "dumbbells", lunge: "dumbbells",
  sumo: "dumbbells", dbrow: "dumbbells", hipthrust: "dumbbells", lateral: "dumbbells",
  latpull: "latpull", legcurl: "legmachine", legext: "legmachine",
  facepull: "cable", cablerow: "cable", pallof: "cable", cablefly: "cable", curltri: "cable",
  plank: "bodyweight", hyper: "bodyweight",
};

const clone = o => JSON.parse(JSON.stringify(o));
export function defaultConfig() { return { id: CFG_ID, type: "config", profiles: clone(DEFAULT_PROFILES), map: { ...DEFAULT_MAP } }; }

/** Configuración actual (la guardada, completada con los valores por defecto) */
export function config() {
  const saved = store.all.find(r => r.id === CFG_ID);
  const cfg = defaultConfig();
  if (saved) {
    for (const [k, p] of Object.entries(saved.profiles || {})) cfg.profiles[k] = { ...cfg.profiles[k], ...p };
    Object.assign(cfg.map, saved.map || {});
  }
  return cfg;
}
export const saveConfig = cfg => store.put({ ...cfg, id: CFG_ID, type: "config", updatedAt: new Date().toISOString() });

export function profileFor(exId, cfg = config()) {
  const k = cfg.map[exId] || DEFAULT_MAP[exId] || "dumbbells";
  return { key: k, ...(cfg.profiles[k] || DEFAULT_PROFILES[k] || DEFAULT_PROFILES.dumbbells) };
}

/* ---------- Unidades ---------- */
export const toKg = (v, unit) => unit === "lb" ? Math.round(v * LB * 100) / 100 : v;
export const fromKg = (kg, unit) => unit === "lb" ? Math.round(kg / LB * 10) / 10 : Math.round(kg * 100) / 100;
export const unitOf = exId => profileFor(exId).unit || "kg";

/* ---------- Pesos posibles ---------- */
/** Totales que se pueden formar con barra + discos (los discos van por pares, uno a cada lado) */
export function plateTotals(p) {
  let sums = new Set([0]);
  for (const { w, pairs } of p.plates || []) {
    const next = new Set(sums);
    for (const s of sums) for (let i = 1; i <= (pairs || 0); i++) next.add(Math.round((s + 2 * w * i) * 1000) / 1000);
    sums = next;
  }
  return [...sums].map(s => Math.round(((p.bar || 0) + s) * 100) / 100).sort((a, b) => a - b);
}

/** Lista ordenada de pesos disponibles EN LA UNIDAD DEL EQUIPO (null si es libre) */
export function availableIn(p) {
  if (p.kind === "free") return null;
  if (p.kind === "plates") return plateTotals(p);
  const base = (p.weights || []).filter(x => x >= 0);
  const set = new Set(base);
  const ex = (p.extras || []).filter(x => x > 0);
  // combinaciones de pesas añadidas (mini-placas) sobre cada peso de la torre
  let adds = [0];
  for (const e of ex) adds = [...new Set([...adds, ...adds.map(a => a + e)])];
  for (const b of base) for (const a of adds) set.add(Math.round((b + a) * 100) / 100);
  return [...set].sort((a, b) => a - b);
}

/** Siguiente / anterior peso disponible (en kg) a partir de `kg` */
export function stepWeight(exId, kg, dir) {
  const p = profileFor(exId);
  const list = availableIn(p);
  const cur = kg == null || isNaN(kg) ? null : fromKg(kg, p.unit);
  if (!list || !list.length) {
    const step = p.kind === "free" ? (p.step || 2.5) : (INC[exId] || 2);
    return Math.max(0, Math.round(((kg ?? 0) + step * dir) * 100) / 100);
  }
  if (cur == null) return toKg(dir > 0 ? list[0] : list[0], p.unit);
  const eps = 1e-6;
  const v = dir > 0 ? list.find(x => x > cur + eps) : [...list].reverse().find(x => x < cur - eps);
  return toKg(v ?? (dir > 0 ? list[list.length - 1] : list[0]), p.unit);
}

/** Próximo peso para la progresión (el siguiente disponible por encima) */
export const nextUp = (exId, kg) => stepWeight(exId, kg, 1);

/** Reparto de discos por lado para un total (en la unidad del equipo). Devuelve {perSide:[w…], exact, total} */
export function platesFor(p, target) {
  const per = Math.max(0, (target - (p.bar || 0)) / 2);
  const avail = [...(p.plates || [])].sort((a, b) => b.w - a.w);
  // búsqueda exacta (pocos discos) y si no, el total más cercano por debajo
  let best = null;
  const rec = (i, left, used) => {
    if (best && best.exact) return;
    if (Math.abs(left) < 1e-6) { best = { perSide: used.slice(), exact: true }; return; }
    if (i >= avail.length) { const got = per - left; if (!best || got > best.got) best = { perSide: used.slice(), exact: false, got }; return; }
    const { w, pairs } = avail[i];
    for (let n = Math.min(pairs || 0, Math.floor((left + 1e-6) / w)); n >= 0; n--) {
      for (let k = 0; k < n; k++) used.push(w);
      rec(i + 1, Math.round((left - n * w) * 1000) / 1000, used);
      for (let k = 0; k < n; k++) used.pop();
      if (best && best.exact) return;
    }
  };
  rec(0, Math.round(per * 1000) / 1000, []);
  best = best || { perSide: [], exact: per === 0 };
  best.total = Math.round(((p.bar || 0) + 2 * best.perSide.reduce((a, b) => a + b, 0)) * 100) / 100;
  return best;
}

/** Texto con el peso en la unidad del equipo: "22,5 kg" / "50 lb" */
export function fmtW(exId, kg) {
  if (kg == null || kg === "" || isNaN(kg)) return "–";
  const u = unitOf(exId);
  return `${String(fromKg(+kg, u)).replace(".", ",")} ${u}`;
}

/** Número escrito por el usuario (admite coma decimal); null si no vale */
export const parseNum = t => { const v = parseFloat(String(t).trim().replace(",", ".")); return isFinite(v) && v >= 0 ? Math.round(v * 100) / 100 : null; };
