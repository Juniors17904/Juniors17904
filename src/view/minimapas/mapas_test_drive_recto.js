'use strict';

// ================================================================
// CLASE: MapasTestDriveRecto — los dos mapas del Test Drive 3D simple
// (minimapa y recorrido) con sus botones MAPA y RECORRIDO. Los botones
// usan onclick (un solo manejador) para no acumular escuchas.
// ================================================================
class MapasTestDriveRecto extends ParMapasConduccion {
    constructor() {
        super(new MinimapaTestDriveRecto(), new RecorridoTestDriveRecto());
    }

    mostrar() {
        super.mostrar();
        this.#conectarBoton('btn-toggle-minimap', this.minimapa,  'MAPA');
        this.#conectarBoton('btn-toggle-trail',   this.recorrido, 'RECORRIDO');
    }

    #conectarBoton(id, mapa, texto) {
        const boton = document.getElementById(id);
        boton.style.display = 'block';
        boton.textContent = texto;
        boton.onclick = () => {
            mapa.visible = !mapa.visible;
            boton.textContent = mapa.visible ? texto : texto + ' ✕';
        };
    }
}
