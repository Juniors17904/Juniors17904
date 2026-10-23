'use strict';

// ================================================================
// CLASE: VistaPreviaCordillera — dibuja la cordillera (Cordillera) en
// el lienzo #do-canvas-montana de Diseño de Objetos. Si el módulo aún
// no cargó, vuelve a intentar en un momento.
// ================================================================
class VistaPreviaCordillera {
    static #REINTENTO_MS = 200;

    dibujar() {
        const canvas = document.getElementById('do-canvas-montana');
        if (!canvas) return;
        if (!window.Cordillera) { setTimeout(() => this.dibujar(), VistaPreviaCordillera.#REINTENTO_MS); return; }
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#040d1e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(new window.Cordillera().generarCanvas(), 0, 0, canvas.width, canvas.height);
    }
}
