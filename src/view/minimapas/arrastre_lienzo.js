'use strict';

// ================================================================
// CLASE: ArrastreLienzo — deja mover un lienzo con el dedo (los mapas
// del circuito 3D). Se conecta al mostrar y se quita al salir, así
// entrar varias veces no acumula escuchas.
// ================================================================
class ArrastreLienzo {
    #lienzo      = null;
    #toqueInicio = null;
    #toqueMover  = null;

    constructor(lienzo) {
        this.#lienzo = lienzo;
    }

    conectar() {
        this.desconectar();
        const lienzo = this.#lienzo;
        let sx, sy, ox, oy;
        this.#toqueInicio = e => {
            const t = e.touches[0];
            sx = t.clientX; sy = t.clientY;
            ox = lienzo.offsetLeft; oy = lienzo.offsetTop;
            e.stopPropagation();
        };
        this.#toqueMover = e => {
            e.preventDefault(); e.stopPropagation();
            const t = e.touches[0];
            lienzo.style.left   = (ox + t.clientX - sx) + 'px';
            lienzo.style.top    = (oy + t.clientY - sy) + 'px';
            lienzo.style.right  = 'auto';
            lienzo.style.bottom = 'auto';
        };
        lienzo.addEventListener('touchstart', this.#toqueInicio, {passive:true});
        lienzo.addEventListener('touchmove',  this.#toqueMover,  {passive:false});
    }

    desconectar() {
        if (!this.#toqueInicio) return;
        this.#lienzo.removeEventListener('touchstart', this.#toqueInicio);
        this.#lienzo.removeEventListener('touchmove',  this.#toqueMover);
        this.#toqueInicio = null;
        this.#toqueMover  = null;
    }
}
