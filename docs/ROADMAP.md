# Hoja de ruta · Mi Rutina (PWA de gimnasio)

_Última actualización: 4 de octubre de 2026 (tarde)_

Objetivo de la app: llevar en el móvil, dentro del gimnasio, la rutina **Full Body de 3 días (A/B/C)** para principiante, registrar series y pesos, aplicar la **progresión doble** y ver el progreso (asistencia, cargas y peso corporal). Debe funcionar sin conexión e instalarse como app (PWA).

## Estado de un vistazo

| Fase | Qué | Estado |
|---|---|---|
| 0 | Rutina definida (A/B/C con las máquinas del gimnasio) | ✅ Hecho |
| 1 | Prototipo funcional en Claude («Mi Rutina Full Body», 3 oct) | ✅ Hecho |
| 2 | Diseño de la interfaz móvil (6 pantallas, «Mi Rutina · App móvil», 4 oct) | ✅ Hecho |
| 3 | Proyecto PWA en `D:\GitHub\GYM` (v1.0.0) | ✅ Hecho |
| 4 | Diseño nuevo implementado (Hoy, Entrenando, Técnica…) | ✅ Hecho |
| 5 | Copias de seguridad y migración de datos | ✅ Hecho · faltan pruebas automáticas |
| 5b | «Mi equipo»: pesos reales de máquinas, mancuernas y discos (v1.1.0) | ✅ Hecho |
| — | Publicada en **https://pgbc94.github.io/GYM/** (repo público PGBC94/GYM) · falta instalar en los móviles | ✅ Hecho |
| 6 | Mejoras (editor de rutina, récords, recordatorios…) | 💡 Ideas |

---

## ✅ Fase 0 — Rutina

- Full body, 3 días no consecutivos, alternando A → B → C. Sesiones de 50–60 min: 5 min de calentamiento + musculación + 10–12 min de cardio final.
- Ejercicios adaptados al equipamiento del gimnasio: mancuernas, banco ajustable, máquina de jalón (Precor), polea doble (functional trainer), máquina de extensión/curl de pierna, banco romano a 45°, cinta, bici, elíptica y cuerdas de batalla.
- Reglas: dejar 2 repeticiones en reserva; **progresión doble** (al completar todas las series en la parte alta del rango, subir peso); déficit moderado, ~1,6 g/kg de proteína, 8.000+ pasos al día.
- Detalle completo en [`RUTINA.md`](RUTINA.md).

## ✅ Fase 1 — Prototipo funcional (artifact en Claude)

Lo que ya funciona en el prototipo (`referencias/prototipo/mi-rutina-full-body.html`):

- [x] 4 pestañas: Entrenar · Rutina · Progreso · Historial.
- [x] Sugiere el día que toca (A → B → C) y precarga los pesos de la última sesión.
- [x] Registro por serie (kg, reps, ✓ hecho), añadir/quitar series, cardio en minutos y notas.
- [x] Aviso en verde «¡sube el peso hoy!» cuando se cumple la progresión doble.
- [x] Guía de técnica para los 20 ejercicios (colocación, ejecución, errores, respiración, músculos).
- [x] Animaciones SVG de cada ejercicio con figura articulada (cinemática inversa), respetando `prefers-reduced-motion`.
- [x] Progreso: sesiones esta semana / mes, racha de semanas 3/3, mapa de calor de 16 semanas, gráfico del peso máximo por ejercicio y del peso corporal.
- [x] Historial con volumen (kg), editar y borrar sesiones.
- [x] Borrador autoguardado; datos en la base de datos de la cuenta con respaldo en `localStorage`.
- [x] Modo claro/oscuro automático.

## ✅ Fase 2 — Diseño de la interfaz móvil (canvas en Claude)

Seis pantallas a 390×844, tema oscuro, tipografía Barlow / Barlow Condensed, acento naranja (`referencias/diseno/`, detalle en [`DISENO.md`](DISENO.md)):

1. **Hoy** — «Hoy toca Día B», tarjeta grande para empezar, semana actual (L–D), avisos de subir peso, peso corporal y última sesión.
2. **Entrenando** — un ejercicio por pantalla, cronómetro de sesión, barra de progreso 1/7, botones −/+ para kg y reps, temporizador de descanso (−15 / +15 / Saltar) y «Siguiente ejercicio».
3. **Técnica** — hoja inferior con animación, músculos como etiquetas y pestañas Colocación / Ejecución / Errores.
4. **Rutina** — selector A/B/C, lista de ejercicios y cardio, «Cómo funciona».
5. **Progreso** — estadísticas, calendario y gráficos.
6. **Historial** — sesiones agrupadas por semana (2/3, 3/3) con filtro por día y notas.

### Diferencias entre prototipo y diseño (ya construidas en la v1.0.0)

| En el diseño | En el prototipo |
|---|---|
| Pantalla **Hoy** como inicio (resumen) | Se entra directo al formulario de Entrenar |
| Modo **Entrenando** paso a paso, un ejercicio por pantalla | Todos los ejercicios en una lista larga |
| **Temporizador de descanso** automático al marcar una serie | No existe |
| Botones **−/+** grandes para kg y reps | Campos de texto |
| Cronómetro y duración de la sesión | No se guarda la duración |
| Técnica en hoja inferior con pestañas | Desplegable + modal |
| Historial **por semanas** con filtro A/B/C | Lista plana |
| Solo tema oscuro | Claro y oscuro |

---

## ✅ Fase 3 — Proyecto PWA (v1.0.0)

Decisión: **HTML + CSS + JavaScript con módulos, sin build ni npm**. Se publica tal cual.

- [x] Estructura `js/` (`data/`, `engine/`, `screens/`, `storage.js`, `logic.js`, `state.js`).
- [x] Rutina, técnica y animaciones extraídas del prototipo a módulos; motor de la figura como módulo.
- [x] Datos en **IndexedDB** (respaldo en `localStorage`), mismo formato que el prototipo + `durationMin`.
- [x] `manifest.webmanifest`, iconos (192, 512, maskable, Apple) y `sw.js`: funciona sin conexión.
- [x] Aviso «Hay una versión nueva · Actualizar» cuando se publica un cambio.
- [ ] Publicar en **GitHub Pages** e instalar en el móvil → ver `README.md`.

## ✅ Fase 4 — Diseño implementado

- [x] **Hoy**: día que toca, sesión nº, semana L–D, racha, avisos de subir peso, peso corporal y última sesión; «Continuar» si hay un entreno a medias.
- [x] **Entrenando** paso a paso: barra de progreso por ejercicio (se puede saltar a cualquiera), cronómetro, botones −/+ (2 kg mancuernas, 2,5 kg máquinas/poleas, 5 s en plancha), pesos y reps precargados de la última vez, aviso «¡Sube el peso hoy!».
- [x] **Temporizador de descanso** automático al marcar ✓ (tiempo de cada ejercicio, −15/+15/Saltar), vibración y pitido al terminar; sobrevive a recargar la app.
- [x] Pantalla siempre encendida durante el entreno (Wake Lock).
- [x] Cierre con cardio, notas, fecha y resumen; se guarda la duración.
- [x] **Técnica** en hoja inferior: animación, músculos, pestañas Colocación / Ejecución / Errores, respiración.
- [x] **Rutina** con selector A/B/C y botón «Entrenar este día».
- [x] **Progreso**: estadísticas, calendario de 16 semanas, gráfico de cargas por ejercicio, peso corporal con deshacer.
- [x] **Historial** por semanas (x/3), filtro A/B/C, detalle, editar y borrar con deshacer.
- [x] El botón «atrás» del móvil cierra las hojas y navega entre pantallas.

## ✅ Fase 5 — Datos

- [x] Ajustes › Descargar copia (JSON) e Importar copia.
- [x] El prototipo de Claude tiene ahora «Exportar copia (JSON)» en Historial para pasar los datos.
- [x] Recordatorio de la última copia en Progreso; opción de almacenamiento protegido.
- [ ] Pruebas automáticas de la lógica (día siguiente, progresión, racha, volumen).

## ✅ Fase 5b — Mi equipo (v1.1.0)

- [x] Pantalla **Mi equipo** (desde Ajustes y Rutina): mancuernas, torre de la máquina de jalón, polea doble, máquina de pierna, barra y discos, y peso corporal con lastre.
- [x] Listas editables (añadir/quitar), generador «desde / salto / hasta» y mini-placas añadidas que se combinan con la torre.
- [x] kg o lb por equipo (los registros se guardan siempre en kg; solo cambia cómo se ven).
- [x] Barra y discos por pares, rango de pesos posibles y **calculadora de discos por lado**.
- [x] Asignar equipo a cada ejercicio; si es barra, en el entreno aparece qué discos poner.
- [x] Los −/+ y la sugerencia de subida usan los pesos que existen; aviso si ya estás en el máximo.
- [x] La configuración entra en la copia de seguridad.

## 💡 Fase 6 — Ideas para después

- Editor de rutina (cambiar ejercicios, series, rangos y descansos).
- Récords personales y volumen semanal por grupo muscular.
- Recordatorios de los días de entreno (notificaciones).
- **Fase 2 de la rutina** tras 8–12 semanas (más volumen o división torso/pierna).
- Sincronización opcional entre dispositivos.
- Modo claro para la nueva interfaz.

## Decisiones abiertas

1. ~~Stack~~ → sin build (decidido).
2. ~~Datos del prototipo~~ → exportar/importar JSON (decidido).
3. ¿Sincronizar datos entre dispositivos o seguir con local + copia de seguridad?
4. ~~Escalones de peso~~ → se configuran en la app (Mi equipo).

## Referencias

- Prototipo funcional: «Mi Rutina Full Body» — https://claude.ai/artifact/XYb5pFpSkcRvzr55D3SbAy
- Diseño móvil: «Mi Rutina · App móvil» — https://claude.ai/artifact/49yaaH7KTXZ7etDPZr4qMd
