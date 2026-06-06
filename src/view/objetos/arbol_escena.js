'use strict';
import * as THREE      from 'three';
import { GLTFLoader }  from 'three/addons/loaders/GLTFLoader.js';
import { ObjetoEscena } from './objeto_escena.js';

// ================================================================
// CLASS: ArbolEscena — árbol maple cargado desde GLB.
//        Modelo cacheado estáticamente (se carga una sola vez).
// ================================================================
export class ArbolEscena extends ObjetoEscena {
    #escala;
    static #promesa = null;
    static #gltf    = null;

    constructor(x, z, escala = 1) {
        super(x, z);
        this.#escala = escala;
    }

    static #cargar() {
        if (!ArbolEscena.#promesa)
            ArbolEscena.#promesa = new GLTFLoader()
                .loadAsync('src/assets/models/maple_tree.glb')
                .then(gltf => { ArbolEscena.#gltf = gltf; });
        return ArbolEscena.#promesa;
    }

    async construir(scene) {
        await ArbolEscena.#cargar();
        super.construir(scene);
    }

    _poblar(grupo) {
        if (!ArbolEscena.#gltf) return;

        const clon = ArbolEscena.#gltf.scene.clone(true);

        // Escalar para que el árbol mida ~4 unidades de alto
        const caja   = new THREE.Box3().setFromObject(clon);
        const altura = caja.max.y - caja.min.y;
        clon.scale.setScalar((4 * this.#escala) / altura);

        // Apoyar la base en Y = 0
        const caja2 = new THREE.Box3().setFromObject(clon);
        clon.position.y = -caja2.min.y;

        clon.traverse(c => {
            if (!c.isMesh) return;

            // Quitar el suelo plano que viene con el modelo
            const b = new THREE.Box3().setFromObject(c);
            const esPlano = (b.max.y - b.min.y) < 0.05;
            if (esPlano) { c.visible = false; return; }

            c.castShadow = true;

            // Corregir hojas: activar alpha para transparencias
            const mats = Array.isArray(c.material) ? c.material : [c.material];
            mats.forEach(mat => {
                mat.side = THREE.DoubleSide;
                if (mat.map) {
                    mat.transparent = true;
                    mat.alphaTest   = 0.4;
                }
            });
        });

        grupo.add(clon);
    }
}
