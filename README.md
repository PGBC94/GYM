# Mi Rutina · PWA de gimnasio

App web instalable (PWA) para seguir en el móvil la rutina **Full Body de 3 días (A/B/C)**: registrar series con botones −/+, temporizador de descanso, progresión doble, técnica de cada ejercicio con animaciones y seguimiento del progreso. Funciona sin conexión y los datos se guardan en el propio móvil.

Versión **1.1.0** · Ver la [hoja de ruta](docs/ROADMAP.md).

## Probarla en el ordenador

Los módulos JavaScript no funcionan abriendo `index.html` con doble clic: hace falta un servidor local. Desde esta carpeta:

```
python -m http.server 8000
```

y abre http://localhost:8000. (Alternativa: la extensión «Live Server» de VS Code.)

## Publicarla y usarla en el móvil

Guía paso a paso en **[docs/PUBLICAR.md](docs/PUBLICAR.md)** (GitHub Pages con GitHub Desktop, o Netlify Drop en un minuto).

**Al publicar cambios**, sube el número de `VERSION` en `sw.js`; la app avisará «Hay una versión nueva · Actualizar».

## Pasar los datos del prototipo de Claude

1. Abre el prototipo «Mi Rutina Full Body» → pestaña **Historial** → **Exportar copia (JSON)**.
2. En la PWA: icono de ajustes (pantalla Hoy) → **Importar copia o datos del prototipo**.

Haz también copias de vez en cuando desde Ajustes › Descargar copia: los datos viven solo en ese móvil.

## Estructura

```
index.html              Página única
manifest.webmanifest    Datos de instalación (nombre, iconos, colores)
sw.js                   Service worker (funciona sin conexión)
css/app.css             Estilos (tema oscuro del diseño)
icons/                  Iconos de la app
js/
  app.js                Arranque, navegación (#/hoy, #/entreno…) y eventos
  state.js              Estado de la interfaz y entreno en curso (borrador)
  storage.js            IndexedDB + copia de seguridad (exportar/importar)
  logic.js              Día siguiente, progresión doble, racha, volumen
  utils.js              Fechas, formato, iconos, avisos
  install.js            Botón «Instalar la app»
  equipment.js          Pesos reales del gimnasio (mancuernas, torres, discos), kg/lb
  data/routine.js       Rutina A/B/C, escalones de peso (INC), nombres cortos
  data/technique.js     Guía de técnica por ejercicio
  data/animations.js    Poses de las animaciones
  engine/figure.js      Motor de la figura animada (cinemática inversa)
  screens/              Hoy, Entrenando, Rutina, Progreso, Historial, Mi equipo, hojas (técnica y ajustes)
docs/                   Hoja de ruta, rutina, guía de diseño y modelo de datos
referencias/            Prototipo original y pantallas del diseño
```

## Mi equipo

Ajustes › **Mi equipo** (o desde la pestaña Rutina): apunta los pesos de las mancuernas, la torre de cada máquina y polea (con mini-placas opcionales), y la barra y los discos. Cada equipo puede ir en kg o en lb. Los botones −/+ saltan entre pesos que existen y la subida de peso sugiere el siguiente real. Puedes cambiar qué equipo usa cada ejercicio (p. ej. hip thrust con barra: la app te dice qué discos poner a cada lado).

## Cambiar la rutina

Edita `js/data/routine.js` (ejercicios, series, rangos, descansos) y, si añades un ejercicio nuevo, su técnica en `js/data/technique.js` y su animación en `js/data/animations.js`. Los `id` de los ejercicios no deben cambiar: el historial se guarda por `id`.
