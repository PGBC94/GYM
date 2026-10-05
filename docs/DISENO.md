# Guía de diseño · Mi Rutina

Fuente: canvas «Mi Rutina · App móvil» (https://claude.ai/artifact/49yaaH7KTXZ7etDPZr4qMd). Copias de las pantallas en `referencias/diseno/` (archivos `.dc.html`; se ven bien en el canvas, fuera de él sirven como referencia de marcado y estilos).

## Tipografía

- Títulos, números y etiquetas: **Barlow Condensed** 600/700/800, mayúsculas, `letter-spacing` .04–.12em.
- Texto: **Barlow** 400/500/600, 16 px base.
- Números con `font-variant-numeric: tabular-nums`.

## Colores (tema oscuro)

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#12171d` | Fondo de la app |
| `--surface` | `#1b222b` | Tarjetas |
| `--surface-2` | `#252e39` | Campos, chips |
| `--nav` | `#161c23` | Barra de pestañas |
| `--line` | `#33404e` / `#2a3440` | Bordes y separadores |
| `--fg` | `#e8edf2` | Texto principal |
| `--muted` | `#98a5b4` | Texto secundario |
| `--accent` | `#f08a3a` | Acento (naranja); texto sobre él `#1a1006` |
| `--steel` | `#8fb2d6` | Objetivos (series × reps), Día A |
| `--good` | `#5cc08a` | Serie hecha, subir peso, Día C |
| `--bad` | `#ef7a68` | Errores, borrar |

Etiquetas por día: A `#1e3347/#8fb2d6`, B `#3a2414/#ffb27a`, C `#1f3a2b/#5cc08a`.

El prototipo tiene además un tema claro (`--bg #eef1f4`, `--accent #e2701c`, `--steel #2f4a66`…).

## Componentes y medidas

- Pantalla de referencia 390×844; márgenes laterales 16 px.
- Radios: tarjetas 18 px, tarjeta destacada 22 px, botones 12–14 px, chips 999 px.
- Objetivos táctiles ≥ 44 px (botones principales 52–58 px).
- Barra de pestañas inferior: Hoy · Rutina · Progreso · Historial, iconos de trazo 24 px.
- Sin emojis; iconos SVG de trazo.

## Pantallas

1. **Hoy** · 2. **Entrenando** · 3. **Técnica** (hoja inferior) · 4. **Rutina** · 5. **Progreso** · 6. **Historial**. Descripción en `ROADMAP.md`, fase 2.
