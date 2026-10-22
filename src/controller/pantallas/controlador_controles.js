'use strict';

// ================================================================
// CLASE: ControladorControles — pantallas de controles y de diseño
// del timón (PRD 004 D6). Muestra las vistas previas de los timones
// y guarda el modelo elegido en el estado compartido de Aplicacion.
// ================================================================
class ControladorControles extends ControladorPantalla {
    #estado      = null;
    #timonOrigen = 'pantalla-inicio';

    constructor(estado, navegar) {
        super(navegar);
        this.#estado = estado;
    }

    iniciar() {
        document.getElementById('btn-ir-controles').addEventListener('click', () => this.irA('pantalla-controles'));
        document.getElementById('btn-volver-controles').addEventListener('click', () => this.irA('pantalla-ajustes'));
        document.getElementById('btn-volver-timon-diseno').addEventListener('click', () => this.irA(this.#timonOrigen));
        document.getElementById('btn-disenar-timon').addEventListener('click', () => {
            this.abrirDisenoTimon('pantalla-controles');
        });
        // Las tarjetas del velocímetro también llevan la clase timon-card: se acota a su pantalla
        document.querySelectorAll('#pantalla-timon-diseno .timon-card').forEach(card => {
            card.addEventListener('click', () => {
                this.#estado.timonModelo = parseInt(card.dataset.modelo);
                this.#estado.control     = 'timon';
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('sel'));
                document.querySelector('[data-ctrl="timon"]').classList.add('sel');
                this.irA('pantalla-inicio');
            });
        });
    }

    // Abre el diseño del timón; "origen" es la pantalla a la que vuelve
    abrirDisenoTimon(origen) {
        this.#timonOrigen = origen;
        this.#dibujarPreviewsTimon();
        this.irA('pantalla-timon-diseno');
    }

    // Pide a RenderizadorTimon la vista previa de cada modelo
    #dibujarPreviewsTimon() {
        document.querySelectorAll('#pantalla-timon-diseno .timon-card').forEach((card, i) => {
            const canvas = card.querySelector('.timon-preview');
            const ctx    = canvas.getContext('2d');
            const S      = Math.min(canvas.width, canvas.height);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            window.RenderizadorTimon.dibujar(ctx, S, i);
            ctx.restore();
            card.classList.toggle('sel', i === this.#estado.timonModelo);
        });
    }
}
