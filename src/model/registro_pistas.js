'use strict';
try {

// ================================================================
// MODEL — RegistroPistas: guarda todas las pistas por su clave
// ================================================================
// Hay una sola instancia (window.registroPistas). Cada config_pista_*
// se registra aquí con registrar(clave, pista), y los controladores,
// visores y minimapas la piden con obtener(clave).
class RegistroPistas {
    #pistas = new Map();

    registrar(clave, pista) {
        this.#pistas.set(clave, pista);
    }

    obtener(clave) {
        return this.#pistas.get(clave) ?? null;
    }

    tiene(clave) {
        return this.#pistas.has(clave);
    }

    get claves() {
        return [...this.#pistas.keys()];
    }
}

window.RegistroPistas = RegistroPistas;
window.registroPistas = new RegistroPistas();

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[registro_pistas.js] ' + e.message);
    console.error('[registro_pistas.js]', e);
}
