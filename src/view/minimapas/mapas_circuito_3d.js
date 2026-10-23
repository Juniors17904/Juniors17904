'use strict';

// ================================================================
// CLASE: MapasCircuito3D — los dos mapas del circuito 3D (minimapa y
// recorrido): se pueden arrastrar con el dedo y el botón MAPAS los
// muestra u oculta juntos.
// ================================================================
class MapasCircuito3D extends ParMapasConduccion {
    #arrastres = [];

    constructor(visor, pistaCfg) {
        super(new MinimapaCircuito3D(pistaCfg), new RecorridoCircuito3D(visor));
        this.#arrastres = [this.minimapa, this.recorrido].map(m => new ArrastreLienzo(m.lienzo));
    }

    mostrar() {
        super.mostrar();
        for (const mapa of [this.minimapa, this.recorrido]) {
            mapa.lienzo.style.pointerEvents = 'auto';
            mapa.lienzo.style.cursor = 'grab';
        }
        for (const arrastre of this.#arrastres) arrastre.conectar();
    }

    // Botón MAPAS: muestra u oculta los dos mapas juntos
    mostrarAmbos(visible) {
        this.minimapa.visible  = visible;
        this.recorrido.visible = visible;
    }

    // Al salir del circuito: quita el arrastre y deja los lienzos sin toques
    soltar() {
        for (const arrastre of this.#arrastres) arrastre.desconectar();
        for (const mapa of [this.minimapa, this.recorrido]) {
            mapa.lienzo.style.pointerEvents = 'none';
            mapa.lienzo.style.cursor = '';
        }
    }
}
