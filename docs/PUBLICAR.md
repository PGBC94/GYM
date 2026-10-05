# Cómo publicar Mi Rutina

La app no necesita compilación: se publica la carpeta `D:\GitHub\GYM` tal cual. Tienes dos opciones. La A te deja la app en una dirección fija y es fácil de actualizar.

## A · GitHub Pages (recomendada)

### 1. Subir la carpeta a GitHub (con GitHub Desktop)

1. Instala **GitHub Desktop** (desktop.github.com) e inicia sesión con tu cuenta de GitHub.
2. Menú **File › Add local repository…** → elige `D:\GitHub\GYM`.
3. Como la carpeta aún no es un repositorio, te dirá *«This directory does not appear to be a Git repository»*: pulsa **create a repository**, deja el nombre `GYM` y pulsa **Create repository**.
4. Pulsa **Publish repository**. **Desmarca «Keep this code private»** (GitHub Pages gratis necesita repositorio público) y confirma.

> Sin GitHub Desktop: en github.com pulsa **New repository**, nómbralo `GYM`, márcalo **Public**, créalo y en «uploading an existing file» arrastra **todo el contenido** de la carpeta (no la carpeta en sí). Pulsa **Commit changes**.

### 2. Activar GitHub Pages

1. En github.com, abre el repositorio `GYM` → **Settings** → **Pages** (menú izquierdo).
2. En **Build and deployment › Source** elige **Deploy from a branch**.
3. En **Branch** elige `main` y carpeta `/ (root)` → **Save**.
4. Espera 1–2 minutos y recarga la página: aparecerá **«Your site is live at https://TU-USUARIO.github.io/GYM/»**.

### 3. Instalarla en el móvil

- **Android (Chrome):** abre la dirección → menú ⋮ → **Instalar aplicación** (o «Añadir a pantalla de inicio»).
- **iPhone (Safari):** abre la dirección → botón **Compartir** → **Añadir a pantalla de inicio**.

Ábrela una vez con conexión; después funciona sin internet.

### 4. Pasar tus datos

1. En el prototipo de Claude «Mi Rutina Full Body» → pestaña **Historial** → **Exportar copia (JSON)**. Guarda el archivo en el móvil.
2. En la app instalada → icono de **ajustes** (pantalla Hoy) → **Importar copia o datos del prototipo** → elige el archivo.
3. En Ajustes → **Mi equipo**, apunta los pesos de tus mancuernas, máquinas y discos.

### 5. Publicar cambios más adelante

1. Cambia el número de `VERSION` en `sw.js` (p. ej. `mi-rutina-v1.1.0` → `mi-rutina-v1.1.1`). **Si no lo cambias, los móviles seguirán usando la versión vieja.**
2. GitHub Desktop: escribe un resumen abajo a la izquierda → **Commit to main** → **Push origin**.
3. En 1–2 minutos la app mostrará **«Hay una versión nueva · Actualizar»**.

## B · Netlify Drop (la más rápida, sin cuenta de GitHub)

1. Entra en **app.netlify.com/drop**.
2. Arrastra la carpeta `GYM` entera a la página.
3. En segundos te da una dirección `https://algo.netlify.app` → instálala en el móvil como en el paso 3.

Sin cuenta, el sitio caduca a la hora; crea una cuenta gratis (te lo ofrece la propia página) para conservarlo. Para actualizar, vuelve a arrastrar la carpeta en **Deploys** del sitio.

## Importante sobre tus datos

- Los datos se guardan **en el navegador del móvil**, no en GitHub ni en Netlify. Publicar o actualizar la app no los borra.
- Si cambias de dirección (p. ej. de Netlify a GitHub Pages), para el móvil es otra app: exporta la copia en la vieja e impórtala en la nueva.
- Haz copias desde **Ajustes › Descargar copia** de vez en cuando; incluyen tu equipo.
