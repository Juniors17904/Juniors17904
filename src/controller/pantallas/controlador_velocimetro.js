'use strict';

// ================================================================
// CLASE: ControladorVelocimetro — pantalla de diseño del velocímetro
// (PRD 004 D6). Muestra las vistas previas de los modelos y guarda
// el modelo elegido en el estado compartido de Aplicacion.
// ================================================================
class ControladorVelocimetro extends ControladorPantalla {
    #estado = null;
    #origen = 'pantalla-ajustes';

    constructor(estado, navegar) {
        super(navegar);
        this.#estado = estado;
    }

    iniciar() {
        document.getElementById('btn-ir-velocimetro').addEventListener('click', () => {
            this.#origen = 'pantalla-ajustes';
            this.#dibujarPreviews();
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

    // Pide a RenderizadorVelocimetro la vista previa de cada modelo
    #dibujarPreviews() {
        document.querySelectorAll('.velocimetro-card').forEach((card, i) => {
            const canvas = card.querySelector('.velocimetro-preview');
            const ctx    = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const cx = canvas.width / 2, cy = canvas.height / 2, r = canvas.width * 0.38;
            window.RenderizadorVelocimetro.dibujar(ctx, cx, cy, r, 0.62, i);
            card.querySelector('.velocimetro-nombre').textContent = window.RenderizadorVelocimetro.nombre(i);
            card.classList.toggle('sel', i === this.#estado.velocimetroModelo);
        });
    }
}
