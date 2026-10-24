'use strict';
import * as THREE from 'three';
import { ObjetoEscena } from './objeto_escena.js';

// ================================================================
// CLASS: ArbolEscena — árbol de hoja ancha, copa esférica irregular
//        Tamaño real (PRD 010, RF-01/06/07): las medidas salen de
//        MedidasEscena y el alto y el radio del tronco se multiplican
//        por el tamaño propio del árbol (escala 0,8–1,4).
//        - Tronco cónico: radio de MedidasEscena en la base y más fino
//          arriba; sin raíces que sobresalgan.
//        - Copa: empieza a max(alturaMinimaCopa, alturaMinimaCopa × escala)
//          y llega justo al alto total. Ninguna esfera baja de ese límite.
// ================================================================
export class ArbolEscena extends ObjetoEscena {
    static #ESFERAS_COPA       = 128;
    static #AFINADO_TRONCO     = 0.6;   // radio arriba / radio en la base
    static #ANCHO_COPA         = 0.85;  // radio horizontal / radio vertical de la copa
    static #ESFERA_MIN         = 0.15;  // radio de cada esfera / radio vertical de la copa
    static #ESFERA_VARIACION   = 0.2;

    #escala;

    constructor(x, z, escala = 1) {
        super(x, z);
        this.#escala = escala;
    }

    _poblar(grupo) {
        const medidas    = new window.MedidasEscena();
        const s          = this.#escala;
        const alto       = medidas.altoArbol * s;
        const radioBase  = medidas.radioTroncoArbol * s;
        const inicioCopa = Math.max(medidas.alturaMinimaCopa, medidas.alturaMinimaCopa * s);

        const semiVertical   = (alto - inicioCopa) / 2;
        const semiHorizontal = semiVertical * ArbolEscena.#ANCHO_COPA;
        const centroCopa     = inicioCopa + semiVertical;

        const matTronco = new THREE.MeshStandardMaterial({ color: 0x7a3b1e, roughness: 0.95 });
        const matCopas  = [
            new THREE.MeshStandardMaterial({ color: 0x266b26, roughness: 0.8 }),
            new THREE.MeshStandardMaterial({ color: 0x317f31, roughness: 0.8 }),
            new THREE.MeshStandardMaterial({ color: 0x3e9c3e, roughness: 0.8 }),
        ];

        // Tronco cónico: ancho en la base, más fino arriba; sube hasta el centro de la copa
        const tronco = new THREE.Mesh(
            new THREE.CylinderGeometry(radioBase * ArbolEscena.#AFINADO_TRONCO, radioBase, centroCopa, 8),
            matTronco
        );
        tronco.position.y = centroCopa / 2;
        tronco.castShadow = true;
        grupo.add(tronco);

        // Esfera de la punta: la copa llega exactamente al alto total
        const radioPunta = semiVertical * (ArbolEscena.#ESFERA_MIN + ArbolEscena.#ESFERA_VARIACION / 2);
        grupo.add(this.#esfera(radioPunta, 0, alto - radioPunta, 0, matCopas[2]));

        // Resto de la copa: esferas dentro de un elipsoide, encogido por el radio
        // de cada esfera para que ninguna baje de inicioCopa ni pase del alto
        for (let i = 0; i < ArbolEscena.#ESFERAS_COPA; i++) {
            const radio = semiVertical * (ArbolEscena.#ESFERA_MIN + Math.random() * ArbolEscena.#ESFERA_VARIACION);
            const theta = Math.random() * Math.PI * 2;
            const phi   = Math.acos(2 * Math.random() - 1);
            const r     = Math.cbrt(Math.random());
            const x     = r * Math.sin(phi) * Math.cos(theta) * Math.max(0, semiHorizontal - radio);
            const y     = r * Math.cos(phi) * (semiVertical - radio);
            const z     = r * Math.sin(phi) * Math.sin(theta) * Math.max(0, semiHorizontal - radio);
            const mat   = matCopas[Math.floor(Math.random() * matCopas.length)];
            grupo.add(this.#esfera(radio, x, centroCopa + y, z, mat));
        }
    }

    #esfera(radio, x, y, z, material) {
        const esfera = new THREE.Mesh(new THREE.SphereGeometry(radio, 5, 4), material);
        esfera.position.set(x, y, z);
        esfera.castShadow = true;
        return esfera;
    }
}
