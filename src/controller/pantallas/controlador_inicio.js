'use strict';

// ================================================================
// CLASE: ControladorInicio — pantalla de inicio (PRD 004 D6)
// Selector de color y de control, y botones de modos de juego.
// Cada modo lo arranca su propio controlador. PRD 005 D7: sin modos 2D;
// Multijugador y Únete quedan "Próximamente" y desactivados por
// ModosDisponibles.aplicarA (Aplicacion), así que no llevan evento.
// PRD 026 (D3): arriba se ve el carro elegido con su color (PortadaCarro).
// ================================================================
class ControladorInicio extends ControladorPantalla {
    #estado      = null;
    #controles   = null;   // ControladorControles: abre el diseño del timón
    #alJugarSolo = null;   // Aplicacion abre "Preparar carrera" (PRD 018)
    #portada     = null;   // PortadaCarro (PRD 026)

    constructor(estado, navegar, controles, alJugarSolo) {
        super(navegar);
        this.#estado      = estado;
        this.#controles   = controles;
        this.#alJugarSolo = alJugarSolo;
    }

    iniciar() {
        this.#portada = new window.PortadaCarro(document.getElementById('canvas-portada-carro'), new window.CatalogoPerfilesCarro());
        window.addEventListener('resize', () => this.mostrar());
        this.mostrar();

        document.getElementById('colores-grid').addEventListener('click', e => {
            const btn = e.target.closest('.color-btn');
            if (!btn) return;
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('sel'));
            btn.classList.add('sel');
            this.#estado.color = btn.dataset.color;
            this.mostrar();
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
            this.#alJugarSolo();
        });
    }

    // Cada vez que se abre Inicio (y al cambiar el color): el carro con el tipo y el color del estado
    mostrar() {
        requestAnimationFrame(() => this.#portada?.dibujar(this.#estado.tipoAuto, this.#estado.color));
    }

    #leerNombre() {
        this.#estado.nombre = document.getElementById('inp-nombre').value.trim() || 'Jugador';
    }
}
