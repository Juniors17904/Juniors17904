'use strict';

// ================================================================
// CLASE: ControladorVelocimetro — pantalla de diseño del velocímetro
// (PRD 004 D6). Pide a GaleriaVelocimetros las vistas previas y guarda
// el modelo elegido en el estado compartido de Aplicacion.
// ================================================================
class ControladorVelocimetro extends ControladorPantalla {
    #estado = null;
    #origen  = 'pantalla-ajustes';
    #galeria = new GaleriaVelocimetros();

    constructor(estado, navegar) {
        super(navegar);
        this.#estado = estado;
    }

    iniciar() {
        document.getElementById('btn-ir-velocimetro').addEventListener('click', () => {
            this.#origen = 'pantalla-ajustes';
            this.#galeria.dibujar(this.#estado.velocimetroModelo);
            this.irA('pantalla-velocimetro-diseno');
        });
        document.getElementById('btn-volver-velocimetro-diseno').addEventListener('click', () => this.irA(this.#origen));
        document.querySelectorAll('.velocimetro-card').forEach(card => {
            card.addEventListener('click', () => {
                this.#estado.velocimetroModelo = parseInt(card.dataset.modelo);
                document.querySelectorAll('.velocimetro-card').forEach(c => c.classList.remove('sel'));
                card.classList.add('sel');
                this.irA(this.#origen);
            });
        });
    }
}
