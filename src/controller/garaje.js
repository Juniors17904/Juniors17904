'use strict';

// ================================================================
// CLASE: Garaje — orquesta las pantallas del garaje y de la vista
// previa (PRD 004 D7): guarda el tipo y el color que se están
// eligiendo y responde a los botones. El dibujo lo hacen las vistas
// (GaleriaMiniaturasCarro, VistaPreviaCarro y los PerfilCarro).
// ================================================================
class Garaje {
    #estado       = null;
    #navegar      = null;
    #galeria      = null;
    #vistaPrevia  = null;
    #tipoSel      = 'deportivo';
    #colorPreview = null;
    #conectado    = false;

    constructor(estado, navegar) {
        const catalogo = new CatalogoPerfilesCarro();
        this.#estado      = estado;
        this.#navegar     = navegar;
        this.#galeria     = new GaleriaMiniaturasCarro(catalogo);
        this.#vistaPrevia = new VistaPreviaCarro(catalogo);
    }

    // Se llama cada vez que se entra al garaje: parte de lo guardado
    // en el estado, redibuja las miniaturas y conecta los botones
    // la primera vez.
    entrar() {
        this.#tipoSel      = this.#estado.tipoAuto || 'deportivo';
        this.#colorPreview = this.#estado.color;
        this.#galeria.dibujar(this.#estado.color);
        if (!this.#conectado) this.#conectarEventos();
    }

    #conectarEventos() {
        this.#conectado = true;
        document.getElementById('garage-grid').addEventListener('click', e => this.#elegirTipo(e));
        document.getElementById('btn-ver-carro').addEventListener('click', () => this.#verCarro());
        document.getElementById('btn-seleccionar-carro').addEventListener('click', () => this.#seleccionar());
        document.getElementById('btn-volver-preview').addEventListener('click', () => {
            this.#vistaPrevia.cerrar();
            this.#navegar('pantalla-garage');
        });
        document.getElementById('btn-volver-garage').addEventListener('click', () => this.#navegar('pantalla-inicio'));
    }

    #elegirTipo(e) {
        const card = e.target.closest('.carro-card');
        if (!card) return;
        document.querySelectorAll('.carro-card').forEach(c => c.classList.remove('sel'));
        card.classList.add('sel');
        this.#tipoSel = card.dataset.tipo;
    }

    #verCarro() {
        this.#navegar('pantalla-preview');
        this.#vistaPrevia.abrir(this.#tipoSel, this.#colorPreview);
        document.getElementById('colores-preview').onclick = e => this.#elegirColor(e);
    }

    #elegirColor(e) {
        const btn = e.target.closest('.color-btn');
        if (!btn) return;
        document.querySelectorAll('#colores-preview .color-btn').forEach(b => b.classList.remove('sel'));
        btn.classList.add('sel');
        this.#colorPreview = btn.dataset.color;
        this.#vistaPrevia.cambiarColor(this.#colorPreview);
        this.#galeria.dibujar(this.#colorPreview);
    }

    #seleccionar() {
        this.#vistaPrevia.cerrar();
        this.#estado.tipoAuto = this.#tipoSel;
        this.#estado.color    = this.#colorPreview;
        document.querySelectorAll('#colores-grid .color-btn').forEach(b =>
            b.classList.toggle('sel', b.dataset.color === this.#colorPreview)
        );
        this.#navegar('pantalla-inicio');
    }
}

window.Garaje = Garaje;
// Alias de compatibilidad
window.Garage = Garaje;
