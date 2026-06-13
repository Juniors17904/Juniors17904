'use strict';
import * as THREE from 'three';
import { ObjetoEscena } from './objeto_escena.js';

const INTENSIDAD_LUZ = 150;

// ================================================================
// CLASS: PosteEscena — poste de alumbrado urbano
//        El brazo y la lámpara apuntan siempre hacia el interior
//        de la pista: lado=+1 (derecha) → brazo hacia -X local,
//        lado=-1 (izquierda) → brazo hacia +X local.
//
//        La PointLight se añade DIRECTAMENTE a la escena (no al
//        grupo) para evitar recompilación de shaders de Three.js
//        cuando el toggle de postes cambia el conteo de luces activas.
//        Al ocultar postes se usa intensity=0 en vez de visible=false.
// ================================================================
export class PosteEscena extends ObjetoEscena {
    #lado;
    #luz   = null;
    #scene = null;

    constructor(x, z, rotY = 0, lado = -1) {
        super(x, z, rotY);
        this.#lado = lado;
    }

    _poblar(grupo) {
        const poste = new THREE.Mesh(
            new THREE.CylinderGeometry(0.06, 0.07, 5.0, 8),
            new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.6 })
        );
        poste.position.y = 2.5;
        poste.castShadow = true;

        const brazo = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 1.2, 6),
            new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.6 })
        );
        brazo.position.set(-0.6 * this.#lado, 5.0, 0);
        brazo.rotation.z = Math.PI / 2;

        const lampara = new THREE.Mesh(
            new THREE.SphereGeometry(0.18, 8, 6),
            new THREE.MeshStandardMaterial({ color: 0xfffbe0, emissive: 0xfffbe0, emissiveIntensity: 0.6 })
        );
        lampara.position.set(-1.1 * this.#lado, 5.0, 0);

        this.#luz = new THREE.PointLight(0xffe8a0, INTENSIDAD_LUZ, 12);
        this.#luz.position.set(-1.1 * this.#lado, 4.8, 0);

        // La luz NO se agrega al grupo — se agrega a la escena en construir()
        grupo.add(poste, brazo, lampara);
    }

    construir(scene) {
        this.#scene = scene;
        super.construir(scene);
        // Calcular posición mundial de la luz y añadirla directo a la escena
        if (this.#luz && this._grupo) {
            this._grupo.updateMatrixWorld(true);
            const posM = this.#luz.position.clone();
            this._grupo.localToWorld(posM);
            this.#luz.position.copy(posM);
            scene.add(this.#luz);
        }
    }

    // Alterna geometría (grupo) y controla la luz con intensity en vez de visible,
    // evitando que Three.js recompile shaders al cambiar el conteo de luces activas
    setVisible(v) {
        super.setVisible(v);
        if (this.#luz) this.#luz.intensity = v ? INTENSIDAD_LUZ : 0;
    }

    destruir(scene) {
        if (this.#luz) {
            (this.#scene ?? scene).remove(this.#luz);
            this.#luz = null;
        }
        super.destruir(scene);
        this.#scene = null;
    }
}
