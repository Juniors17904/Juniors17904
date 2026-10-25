'use strict';

import { FabricaObjetosSolidos } from './fabrica_objetos_solidos.js';
import { RectanguloCarro }       from './rectangulo_carro.js';

// ================================================================
// MODEL — DetectorChoques: choques del carro contra los objetos sólidos
// de la pista (PRD 008, D2, D4 y D6).
//   - Los objetos los crea FabricaObjetosSolidos (también las flechas, PRD 011).
//   - Cada objeto da su propio punto de choque (PRD 011, D10): este detector
//     sirve para cualquier forma. Solo revisa los objetos cercanos al carro.
//   - El carro es un rectángulo de su largo y su ancho, girado con él
//     (PRD 009, D6): de costado choca con el costado, de frente con el
//     parachoques. Las medidas son las del carro que se maneja.
//   - Revisa el tramo recorrido en el paso en saltos cortos, así el carro
//     no salta un objeto aunque vaya rápido.
//   - Al chocar deja el carro fuera del objeto: de frente rebota hacia
//     atrás; de costado pierde velocidad y sigue.
// ================================================================
export class DetectorChoques {
    static #HOLGURA        = 0.05;
    static #SALTO_MAXIMO   = 0.2;
    static #IMPACTO_FRENTE = 0.6;
    static #REBOTE         = -0.3;
    static #PERDIDA_ROCE   = 0.6;

    #objetos = [];
    #medioLargo = 0;
    #medioAncho = 0;

    // Sin carro, usa el básico de MedidasEscena (el único lugar con medidas, PRD 009 D5)
    constructor(decoraciones, ruta, medidaCarro = null) {
        this.#objetos = new FabricaObjetosSolidos().crear(decoraciones, ruta);
        this.usarCarro(medidaCarro ?? new globalThis.MedidasEscena().medidaCarro());
    }

    get objetos() { return [...this.#objetos]; }

    // Medidas del carro que se maneja (MedidaCarro del modelo)
    usarCarro(medidaCarro) {
        if (!medidaCarro) return;
        this.#medioLargo = medidaCarro.largo / 2;
        this.#medioAncho = medidaCarro.ancho / 2;
    }

    // Revisa el paso de (pxAntes, pzAntes) a la posición actual del carro.
    // Devuelve true si chocó.
    resolver(carro, pxAntes, pzAntes) {
        const dx = carro.px - pxAntes, dz = carro.pz - pzAntes;
        const saltos = Math.max(1, Math.ceil(Math.hypot(dx, dz) / DetectorChoques.#SALTO_MAXIMO));
        for (let i = 1; i <= saltos; i++) {
            const x = pxAntes + dx * i / saltos, z = pzAntes + dz * i / saltos;
            const rectangulo = new RectanguloCarro(x, z, carro.rotY, this.#medioLargo, this.#medioAncho);
            const alcance = rectangulo.alcance;
            for (const objeto of this.#objetos) {
                if (Math.abs(objeto.x - x) > alcance + objeto.alcance || Math.abs(objeto.z - z) > alcance + objeto.alcance) continue;
                if (this.#resolverObjeto(carro, objeto, rectangulo, dx, dz)) return true;
            }
        }
        return false;
    }

    // Choque del rectángulo del carro contra el punto del objeto más cercano
    // a él, rodeado por el radio del objeto
    #resolverObjeto(carro, objeto, rectangulo, dx, dz) {
        const punto = objeto.puntoCercano(rectangulo);
        const x = rectangulo.x, z = rectangulo.z;
        const fx = rectangulo.fx, fz = rectangulo.fz, sx = rectangulo.sx, sz = rectangulo.sz;
        const ox = punto.x - x, oz = punto.z - z;
        const adelante = ox * fx + oz * fz, costado = ox * sx + oz * sz;
        const cercaA = Math.max(-this.#medioLargo, Math.min(this.#medioLargo, adelante));
        const cercaC = Math.max(-this.#medioAncho, Math.min(this.#medioAncho, costado));
        let ea = adelante - cercaA, ec = costado - cercaC;
        let dist = Math.hypot(ea, ec);
        if (dist >= objeto.radio) return false;

        // Cuánto hay que mover el carro (en sus ejes) para dejar el objeto afuera
        let empuje;
        if (dist > 1e-9) {
            empuje = objeto.radio - dist;
        } else {
            // El centro del objeto quedó dentro del rectángulo: sale por el lado más cercano
            const libreA = this.#medioLargo - Math.abs(adelante), libreC = this.#medioAncho - Math.abs(costado);
            if (libreA < libreC) { ea = Math.sign(adelante) || 1; ec = 0; empuje = libreA + objeto.radio; }
            else                 { ea = 0; ec = Math.sign(costado) || 1; empuje = libreC + objeto.radio; }
            dist = 1;
        }
        // Dirección (mundo) del carro hacia el objeto
        const nx = (ea * fx + ec * sx) / dist, nz = (ea * fz + ec * sz) / dist;
        const mover = empuje + DetectorChoques.#HOLGURA;

        // Qué tan de frente golpea: 1 = de frente, 0 = de costado
        const largo = Math.hypot(dx, dz);
        const impacto = largo > 1e-9 ? Math.max(0, (dx * nx + dz * nz) / largo) : 0;
        const factor = impacto > DetectorChoques.#IMPACTO_FRENTE
            ? DetectorChoques.#REBOTE
            : 1 - DetectorChoques.#PERDIDA_ROCE * impacto;
        carro.rebotar(x - nx * mover, z - nz * mover, factor);
        return true;
    }
}
