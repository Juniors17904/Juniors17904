'use strict';

// ================================================================
// CLASE: VistaPreviaCarro — vista previa 3D del garaje: pone el
// nombre del tipo y maneja el Visor3D de #canvas-preview-3d
// (abrir, cambiar color y cerrar). Solo hay un visor a la vez.
// ================================================================
class VistaPreviaCarro {
    #catalogo = null;
    #visor    = null;

    constructor(catalogo) {
        this.#catalogo = catalogo;
    }

    // Muestra el nombre del tipo y carga el carro 3D con ese color
    abrir(tipo, color) {
        document.getElementById('preview-nombre').textContent =
            this.#catalogo.obtener(tipo)?.nombre || tipo;

        const canvas = document.getElementById('canvas-preview-3d');
        this.#visor?.detener();
        this.#visor = new Visor3D(canvas);
        this.#visor.cargar(tipo, color);
    }

    cambiarColor(color) {
        this.#visor?.cambiarColor(color);
    }

    cerrar() {
        this.#visor?.detener();
        this.#visor = null;
    }
}

window.VistaPreviaCarro = VistaPreviaCarro;
