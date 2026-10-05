# Modelo de datos

Tal como lo usa el prototipo; la PWA debe mantenerlo para poder importar los datos existentes.

## Registros (`records`)

Cada registro tiene un `id` y un `type`.

### Sesión

```json
{
  "id": "s_1727700000000",
  "type": "session",
  "date": "2026-09-30",
  "day": "A",
  "sets": {
    "goblet": [ { "kg": "16", "reps": "12", "done": true }, ... ],
    "dbbench": [ ... ]
  },
  "cardio": "12",
  "notes": "Buena sesión",
  "createdAt": "2026-09-30T18:05:00.000Z"
}
```

- `sets` va indexado por el `id` del ejercicio (`goblet`, `dbbench`, `latpull`, `legcurl`, `dbpress`, `facepull`, `plank`, `rdl`, `cablerow`, `incline`, `legext`, `lunge`, `hyper`, `pallof`, `sumo`, `dbrow`, `cablefly`, `hipthrust`, `lateral`, `curltri`).
- `kg` y `reps` se guardan como texto (admiten coma decimal). En la plancha `reps` son segundos.
- La PWA añade `durationMin` (minutos de la sesión, del cronómetro). Solo se guardan las series marcadas con ✓.

### Peso corporal

```json
{ "id": "w_2026-10-04", "type": "weight", "date": "2026-10-04", "kg": "81.2" }
```

Un registro por día (el `id` incluye la fecha).

## Estado de la interfaz (solo local)

`rutina.tab`, `rutina.draft` (sesión en curso), `rutina.progEx` (ejercicio del gráfico).

## Lógica

- **Día siguiente:** tras la última sesión A → B → C → A.
- **Progresión doble:** todas las series registradas (≥ las previstas) alcanzan el máximo del rango → «sube el peso».
- **Racha:** semanas seguidas (lunes a domingo) con 3 o más sesiones.
- **Volumen:** Σ kg × reps (excluye ejercicios por tiempo).

### Equipo (configuración)

```json
{ "id": "cfg_equipment", "type": "config",
  "profiles": { "dumbbells": { "name": "Mancuernas", "kind": "list", "unit": "kg", "weights": [2,4,6], "extras": [] },
                "barbell": { "name": "Barra y discos", "kind": "plates", "unit": "kg", "bar": 20, "plates": [{ "w": 10, "pairs": 2 }] },
                "bodyweight": { "kind": "free", "step": 2.5 } },
  "map": { "hipthrust": "barbell", "latpull": "latpull" } }
```

- `kind`: `list` (lista de pesos + `extras` = mini-placas que se suman), `plates` (barra + discos por pares) o `free` (salto fijo).
- `unit` solo afecta a cómo se muestra y se escribe; las series siempre se guardan en kg.
- Se incluye en la copia de seguridad.
