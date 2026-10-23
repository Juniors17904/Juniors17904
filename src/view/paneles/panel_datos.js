'use strict';

// ================================================================
// CLASE: PanelDatos — superclase de los paneles de depuración de las
// pantallas 3D. Cuenta los cuadros por segundo (FPS) en cada
// actualizar() y le pasa el valor a la subclase, que escribe sus
// datos en escribir(fps). Interfaz común: mostrar() y actualizar().
// ================================================================
class PanelDatos {
    static #VENTANA_FPS_MS = 500;

    #ultimo  = performance.now();
    #cuadros = 0;
    #fps     = 60;

    mostrar() {}

    actualizar() {
        this.#contarCuadro();
        this.escribir(this.#fps);
    }

    // La subclase escribe sus datos en el DOM
    escribir(fps) {}

    // Atajo para poner el texto de un elemento por su id
    poner(id, texto) {
        document.getElementById(id).textContent = texto;
    }

    #contarCuadro() {
        this.#cuadros++;
        const ahora = performance.now();
        if (ahora - this.#ultimo >= PanelDatos.#VENTANA_FPS_MS) {
            this.#fps = Math.round(this.#cuadros * 1000 / (ahora - this.#ultimo));
            this.#cuadros = 0; this.#ultimo = ahora;
        }
    }
}
