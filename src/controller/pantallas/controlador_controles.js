'use strict';

// ================================================================
// CLASE: ControladorControles — pantallas de controles y de diseño
// del timón (PRD 004 D6). Pide a GaleriaTimones las vistas previas
// y guarda el modelo elegido en el estado compartido de Aplicacion y,
// para recordarlo al recargar, en PreferenciasControles (PRD 021, RF-08).
// ================================================================
class ControladorControles extends ControladorPantalla {
    #estado      = null;
    #timonOrigen = 'pantalla-inicio';
    #galeria     = new GaleriaTimones();
    #preferencias = null;

    constructor(estado, navegar, preferencias) {
        super(navegar);
        this.#estado       = estado;
        this.#preferencias = preferencias;
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
                this.#preferencias?.guardar(this.#estado);
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
        this.#galeria.dibujar(this.#estado.timonModelo);
        this.irA('pantalla-timon-diseno');
    }
}
