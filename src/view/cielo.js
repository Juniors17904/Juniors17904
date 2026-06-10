'use strict';
import * as THREE from 'three';

// ================================================================
// CLASS: Cielo — domo semiesférico base con gradiente de color.
//        Las subclases sobreescriben _generarTextura() para añadir
//        efectos (estrellas, sol, nubes).
// ================================================================
export class Cielo {
    #malla = null;
    _colorArriba;
    _colorHorizonte;

    constructor(colorCielo = '#4a9eca') {
        if (Array.isArray(colorCielo)) {
            this._colorArriba    = new THREE.Color(colorCielo[0]);
            this._colorHorizonte = new THREE.Color(colorCielo[1]);
        } else {
            this._colorHorizonte = new THREE.Color(colorCielo);
            this._colorArriba    = this._colorHorizonte.clone().lerp(new THREE.Color('#020810'), 0.72);
        }
    }

    _generarTextura() {
        const W = 512, H = 256;
        const lienzo = document.createElement('canvas');
        lienzo.width = W; lienzo.height = H;
        const ctx = lienzo.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#' + this._colorArriba.getHexString());
        grad.addColorStop(1, '#' + this._colorHorizonte.getHexString());
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        return lienzo;
    }

    get posicionSol() { return null; }

    construir(scene) {
        const tex = new THREE.CanvasTexture(this._generarTextura());
        tex.colorSpace    = THREE.SRGBColorSpace;
        tex.generateMipmaps = false;
        tex.minFilter = THREE.LinearFilter;
        const mat = new THREE.MeshBasicMaterial({
            map: tex, side: THREE.BackSide,
            depthWrite: false, depthTest: false, toneMapped: false, fog: false,
        });
        const geo = new THREE.SphereGeometry(180, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        this.#malla = new THREE.Mesh(geo, mat);
        this.#malla.renderOrder   = -1;
        this.#malla.frustumCulled = false;
        scene.add(this.#malla);
        scene.background = this._colorHorizonte.clone();
        scene.fog = new THREE.FogExp2(this._colorHorizonte.getHex(), 0.018);
    }

    restaurar(scene) {
        scene.background = this._colorHorizonte.clone();
        scene.fog = new THREE.FogExp2(this._colorHorizonte.getHex(), 0.018);
    }

    get visible()  { return this.#malla?.visible ?? false; }
    set visible(v) { if (this.#malla) this.#malla.visible = !!v; }

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
