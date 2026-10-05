// Almacenamiento local en IndexedDB (con respaldo en localStorage si no está disponible)
// Registros: { id, type: "session" | "weight", ... } — mismo formato que el prototipo.

const DB_NAME = "mi-rutina", DB_VER = 1, STORE = "records";
let db = null;
let mem = [];          // copia en memoria de todos los registros
let mode = "idb";
const listeners = new Set();

function openDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, DB_VER);
    r.onupgradeneeded = () => {
      const d = r.result;
      if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE, { keyPath: "id" });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
const tx = (m, fn) => new Promise((res, rej) => {
  const t = db.transaction(STORE, m); const s = t.objectStore(STORE);
  const out = fn(s);
  t.oncomplete = () => res(out && out.result !== undefined ? out.result : undefined);
  t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
});

function lsLoad() { try { return JSON.parse(localStorage.getItem("rutina.records") || "[]"); } catch { return []; } }
function lsSave() { try { localStorage.setItem("rutina.records", JSON.stringify(mem)); } catch { /* lleno o bloqueado */ } }
const emit = () => listeners.forEach(f => f(mem));

export const store = {
  get mode() { return mode; },
  get all() { return mem; },
  onChange(f) { listeners.add(f); return () => listeners.delete(f); },

  async init() {
    try {
      if (!("indexedDB" in window)) throw new Error("sin IndexedDB");
      db = await openDB();
      mem = await tx("readonly", s => s.getAll());
      mode = "idb";
    } catch {
      mode = "local"; mem = lsLoad();
    }
    emit();
    return mem;
  },

  async put(rec) {
    if (!rec || !rec.id) throw new Error("Registro sin id");
    if (mode === "idb") await tx("readwrite", s => s.put(rec));
    mem = mem.filter(r => r.id !== rec.id).concat([rec]);
    if (mode === "local") lsSave();
    emit();
  },

  async putMany(recs) {
    if (mode === "idb") await tx("readwrite", s => { recs.forEach(r => s.put(r)); });
    const ids = new Set(recs.map(r => r.id));
    mem = mem.filter(r => !ids.has(r.id)).concat(recs);
    if (mode === "local") lsSave();
    emit();
  },

  async del(id) {
    if (mode === "idb") await tx("readwrite", s => s.delete(id));
    mem = mem.filter(r => r.id !== id);
    if (mode === "local") lsSave();
    emit();
  },
};

/** Pide al navegador que no borre los datos si falta espacio. Devuelve true/false/null. */
export async function requestPersist() {
  try {
    if (!navigator.storage?.persist) return null;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch { return null; }
}
export async function isPersisted() {
  try { return navigator.storage?.persisted ? await navigator.storage.persisted() : null; } catch { return null; }
}

/* ---------- Copia de seguridad ---------- */
export function exportJSON() {
  const data = { app: "mi-rutina", version: 1, exportedAt: new Date().toISOString(), records: mem };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  const d = new Date();
  a.download = `mi-rutina-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  try { localStorage.setItem("rutina.lastBackup", JSON.stringify(new Date().toISOString())); } catch { /* */ }
}

/** Valida y normaliza registros importados. Acepta {records:[…]} o un array. */
export function parseBackup(text) {
  let data;
  try { data = JSON.parse(text); } catch { throw new Error("El archivo no es un JSON válido"); }
  const list = Array.isArray(data) ? data : Array.isArray(data?.records) ? data.records : null;
  if (!list) throw new Error("No encuentro registros en el archivo");
  const ok = [];
  for (const r of list) {
    if (!r || typeof r !== "object" || typeof r.id !== "string") continue;
    if (r.type === "session" && /^\d{4}-\d{2}-\d{2}$/.test(r.date) && ["A", "B", "C"].includes(r.day) && r.sets && typeof r.sets === "object") {
      const sets = {};
      for (const [k, st] of Object.entries(r.sets)) {
        if (!Array.isArray(st)) continue;
        sets[k] = st.map(x => ({ kg: String(x?.kg ?? ""), reps: String(x?.reps ?? ""), done: !!x?.done }));
      }
      ok.push({
        id: r.id, type: "session", date: r.date, day: r.day, sets,
        cardio: String(r.cardio ?? ""), notes: String(r.notes ?? ""),
        createdAt: String(r.createdAt || new Date().toISOString()),
        ...(r.durationMin != null ? { durationMin: Number(r.durationMin) || 0 } : {}),
      });
    } else if (r.type === "config" && r.id === "cfg_equipment" && r.profiles && typeof r.profiles === "object") {
      ok.push({ id: r.id, type: "config", profiles: r.profiles, map: r.map && typeof r.map === "object" ? r.map : {}, updatedAt: String(r.updatedAt || "") });
    } else if (r.type === "weight" && /^\d{4}-\d{2}-\d{2}$/.test(r.date) && r.kg != null) {
      ok.push({ id: r.id, type: "weight", date: r.date, kg: String(r.kg) });
    }
  }
  return ok;
}
