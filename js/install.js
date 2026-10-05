// Instalación como app (evento beforeinstallprompt en Chrome/Android/escritorio)
let deferred = null;
export const install = {
  get available() { return !!deferred; },
  get isStandalone() { return matchMedia("(display-mode: standalone)").matches || navigator.standalone === true; },
  async prompt() {
    if (!deferred) return false;
    deferred.prompt();
    const r = await deferred.userChoice.catch(() => null);
    deferred = null;
    return r?.outcome === "accepted";
  },
};
addEventListener("beforeinstallprompt", e => { e.preventDefault(); deferred = e; });
addEventListener("appinstalled", () => { deferred = null; });
