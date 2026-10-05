// Puente entre módulos: app.js rellena estas funciones al arrancar
export const bus = {
  render() {},          // vuelve a pintar la pantalla actual
  go(route) {},         // navega a una pestaña / pantalla
  openSheet(sheet) {},  // abre una hoja inferior
  closeSheet() {},
};
