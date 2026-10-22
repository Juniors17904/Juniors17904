'use strict';

// ================================================================
// CLASE: ControladorInicio — pantalla de inicio (PRD 004 D6)
// Selector de color y de control, y botones de modos de juego.
// Los modos ocultos o "Próximamente" se filtran con ModosDisponibles
// (PRD 002); cada modo lo arranca su propio controlador.
// ================================================================
class ControladorInicio extends ControladorPantalla {
    #estado      = null;
    #modos       = null;
    #controles   = null;   // ControladorControles: abre el diseño del timón
    #modo2D      = null;   // ControladorModo2D: arranca los modos 2D
    #alJugarSolo = null;   // Aplicacion crea y guarda el ControladorCarreraSolo

    constructor(estado, navegar, modos, controles, modo2D, alJugarSolo) {
        super(navegar);
        this.#estado      = estado;
        this.#modos       = modos;
        this.#controles   = controles;
        this.#modo2D      = modo2D;
        this.#alJugarSolo = alJugarSolo;
    }

    iniciar() {
        document.getElementById('colores-grid').addEventListener('click', e => {
            const btn = e.target.closest('.color-btn');
            if (!btn) return;
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('sel'));
            btn.classList.add('sel');
            this.#estado.color = btn.dataset.color;
        });

        document.getElementById('control-tabs').addEventListener('click', e => {
            const btn = e.target.closest('.tab-btn');
            if (!btn) return;
            if (btn.dataset.ctrl === 'timon') {
                this.#controles.abrirDisenoTimon('pantalla-inicio');
                return;
            }
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('sel'));
            btn.classList.add('sel');
            this.#estado.control = btn.dataset.ctrl;
        });

        document.getElementById('btn-solo').addEventListener('click', () => {
            this.#leerNombre();
            this.#estado.modoSolo = true;
            this.#alJugarSolo();
        });

        // PRD 002 RF-01/RF-10: el botón está oculto; la guarda evita crear la carrera 2D
        document.getElementById('btn-clasico-2d').addEventListener('click', () => {
            if (!this.#modos.estaDisponible(ModoClasico2D)) return;
            this.#leerNombre();
            this.#estado.modoSolo = true;
            this.#modo2D.iniciarCuentaRegresiva();
        });

        // PRD 002 RF-04: "Próximamente" → al tocarlo no pasa nada
        document.getElementById('btn-crear').addEventListener('click', async () => {
            if (!this.#modos.estaDisponible(ModoMultijugador)) return;
            this.#leerNombre();
            this.#estado.modoSolo = false;
            await this.#modo2D.abrirCrearSala();
        });

        // PRD 002 RF-05: "Próximamente" → al tocarlo no pasa nada
        document.getElementById('btn-unirse').addEventListener('click', () => {
            if (!this.#modos.estaDisponible(ModoUnirse)) return;
            this.#leerNombre();
            this.#modo2D.abrirUnirse();
        });

        // PRD 002 RF-01/RF-10: el botón está oculto; la guarda evita crear la carrera 2D
        document.getElementById('btn-test-drive').addEventListener('click', () => {
            if (!this.#modos.estaDisponible(ModoTestDrive2D)) return;
            this.#leerNombre();
            this.#modo2D.iniciarTestDrive();
        });
    }

    #leerNombre() {
        this.#estado.nombre = document.getElementById('inp-nombre').value.trim() || 'Jugador';
    }
}
