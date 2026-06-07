'use strict';
import * as THREE from 'three';

// ================================================================
// CLASS: Cielo — domo semiesférico con gradiente de color.
//        Se mueve con la cámara para que nunca se vea el borde.
//        Recibe el color del cielo desde ConfigPista.
// ================================================================
export class Cielo {
    #malla          = null;
    #colorArriba;
    #colorHorizonte;

    constructor(colorCielo = '#4a9eca') {
        this.#colorArriba    = new THREE.Color(colorCielo);
        // Horizonte: mezcla del color del cielo con celeste claro
        this.#colorHorizonte = this.#colorArriba.clone().lerp(new THREE.Color('#c8e8ff'), 0.4);
    }

    construir(scene) {
        const radio = 400;
        const geo = new THREE.SphereGeometry(radio, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);

        // Gradiente de vértices: horizonte (abajo) → cielo (arriba)
        const posArr = geo.attributes.position.array;
        const colArr = new Float32Array(posArr.length);
        const top = this.#colorArriba;
        const hor = this.#colorHorizonte;

        for (let i = 0; i < posArr.length; i += 3) {
            const t = posArr[i + 1] / radio; // 0 = horizonte, 1 = cenit
            colArr[i]     = hor.r + t * (top.r - hor.r);
            colArr[i + 1] = hor.g + t * (top.g - hor.g);
            colArr[i + 2] = hor.b + t * (top.b - hor.b);
        }
        geo.setAttribute('color', new THREE.Float32BufferAttribute(colArr, 3));

        const mat = new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide });
        this.#malla = new THREE.Mesh(geo, mat);
        scene.add(this.#malla);

        // Fondo y niebla usan el color del horizonte para continuidad visual
        scene.background = this.#colorHorizonte.clone();
        scene.fog = new THREE.FogExp2(this.#colorHorizonte.getHex(), 0.018);
    }

    restaurarNiebla(scene) {
        scene.fog = new THREE.FogExp2(this.#colorHorizonte.getHex(), 0.018);
    }

    // Llamar en cada tick pasando la cámara activa
    actualizar(camara) {
        if (this.#malla && camara) this.#malla.position.copy(camara.position);
    }

    destruir(scene) {
        if (!this.#malla) return;
        scene.remove(this.#malla);
        this.#malla.geometry.dispose();
        this.#malla.material.dispose();
        this.#malla = null;
    }
}
