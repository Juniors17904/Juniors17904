'use strict';

// ================================================================
// CLASE: ControladorPistas — pantallas de lista de pistas y detalle
// de pista, con su mapa (PRD 004 D6). Al elegir "Entrar" le pide a
// Aplicacion que abra el circuito 3D.
// ================================================================
class ControladorPistas extends ControladorPantalla {
    #estado           = null;
    #alEntrarCircuito = null;
    #mapa             = new MapaDetallePista();

    constructor(estado, navegar, alEntrarCircuito) {
        super(navegar);
        this.#estado           = estado;
        this.#alEntrarCircuito = alEntrarCircuito;
    }

    iniciar() {
        document.getElementById('btn-ir-pista').addEventListener('click', () => this.irA('pantalla-pista'));
        document.getElementById('btn-volver-pista').addEventListener('click', () => this.irA('pantalla-ajustes'));
        document.getElementById('btn-volver-detalle-pista').addEventListener('click', () => this.irA('pantalla-pista'));
        document.getElementById('btn-seleccionar-pista').addEventListener('click', () => {
            this.#alEntrarCircuito(this.#estado.pista, new DestinoCarreraUrbana());
        });
        document.getElementById('pantalla-pista').addEventListener('click', e => {
            const card = e.target.closest('.pista-card');
            if (!card) return;
            this.#elegirPista(card);
        });
    }

    #elegirPista(card) {
        document.querySelectorAll('.pista-card').forEach(c => c.classList.remove('sel'));
        card.classList.add('sel');
        this.#estado.pista = card.dataset.pista;
        // PRD 021 (D6, RF-09): elegir una pista no cambia el timón ni el velocímetro
        document.getElementById('detalle-pista-nombre').textContent =
            card.querySelector('.pista-nombre').textContent;
        document.getElementById('detalle-pista-desc').textContent =
            card.querySelector('.pista-desc').textContent;
        this.#mapa.dibujar(card.dataset.pista);
        this.irA('pantalla-detalle-pista');
    }
}
