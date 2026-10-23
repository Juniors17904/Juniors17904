'use strict';

// ================================================================
// CLASE: ControladorDisenoObjetos — pantalla Diseño de Objetos
// (#visorDO, VisorDisenoObjetos): elegir un objeto, el color del
// cielo y la vista previa de la cordillera (PRD 004 D6).
// ================================================================
class ControladorDisenoObjetos extends ControladorPantalla {
    #visor      = null;
    #cordillera = new VistaPreviaCordillera();

    constructor(navegar) {
        super(navegar);
    }

    iniciar() {
        document.getElementById('btn-ir-diseno-objetos').addEventListener('click', () => {
            this.irA('pantalla-diseno-objetos');
            this.#arrancarVisor();
        });
        document.getElementById('btn-volver-diseno-objetos').addEventListener('click', () => {
            this.detener();
            this.irA('pantalla-ajustes');
        });
        this.#conectarPanel();
    }

    #arrancarVisor() {
        if (!window.VisorDisenoObjetos) {
            setTimeout(() => this.#arrancarVisor(), 200);
            return;
        }
        if (this.#visor) return;

        const canvas  = document.getElementById('canvas-do-visor');
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;

        this.#visor = new window.VisorDisenoObjetos(canvas);
        this.#visor.iniciar();
    }

    // Botones de objeto y color del cielo: se registran una sola vez y
    // actúan sobre el visor que esté activo
    #conectarPanel() {
        const panelCielo   = document.getElementById('do-panel-cielo');
        const inputCielo   = document.getElementById('do-color-cielo');
        const panelMontana = document.getElementById('do-panel-montana');

        document.querySelectorAll('.do-obj-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tipo = btn.dataset.tipo;
                if (tipo === 'cielo') {
                    panelCielo.style.display   = 'block';
                    panelMontana.style.display  = 'none';
                    this.#visor?.mostrarCielo(inputCielo.value);
                } else if (tipo === 'montana') {
                    panelCielo.style.display   = 'none';
                    panelMontana.style.display  = 'block';
                    this.#cordillera.dibujar();
                } else {
                    panelCielo.style.display   = 'none';
                    panelMontana.style.display  = 'none';
                    this.#visor?.mostrar(tipo);
                }
            });
        });

        inputCielo.addEventListener('input', e => {
            this.#visor?.mostrarCielo(e.target.value);
        });
    }

    // Libera el visor al salir de la pantalla (también con el botón atrás)
    detener() {
        if (!this.#visor) return;
        document.getElementById('do-panel-cielo').style.display  = 'none';
        document.getElementById('do-panel-montana').style.display = 'none';
        this.#visor.detener();
        this.#visor = null;
    }
}
