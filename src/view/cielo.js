'use strict';
import * as THREE from 'three';

// ================================================================
// CLASS: Cielo — base del sistema de cielo. Domo semiesférico con
//        gradiente que se mueve con la cámara.
//        Acepta string '#rrggbb' o array [cénit, horizonte].
//        Subclases: CieloSoleado, CieloNocturno.
// ================================================================
export class Cielo {
    #malla = null;

    // "protected" — accesibles por subclases (convención _)
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

    // Método plantilla — cada subclase pinta su propio cielo en canvas
    _generarTextura() {
        const W = 512, H = 256;
        const lienzo = document.createElement('canvas');
        lienzo.width = W; lienzo.height = H;
        const ctx = lienzo.getContext('2d');
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0,    '#' + this._colorArriba.getHexString());
        grad.addColorStop(0.65, '#' + this._colorHorizonte.getHexString());
        grad.addColorStop(1,    '#' + this._colorHorizonte.getHexString());
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
        return lienzo;
    }

    // Posición del sol en la escena (para alinear DirectionalLight).
    // Las subclases diurnas lo sobreescriben; nocturnas devuelven null.
    get posicionSol() { return null; }

    construir(scene) {
        const radio = 180;
        const geo   = new THREE.SphereGeometry(radio, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const tex   = new THREE.CanvasTexture(this._generarTextura());
        const mat   = new THREE.MeshBasicMaterial({
            map:        tex,
            side:       THREE.BackSide,
            depthWrite: false,
            depthTest:  false,
            toneMapped: false,
            fog:        false,
        });
        this.#malla = new THREE.Mesh(geo, mat);
        this.#malla.renderOrder   = -1;
        this.#malla.frustumCulled = false;
        scene.add(this.#malla);
        scene.background = this._colorHorizonte.clone();
        scene.fog        = new THREE.FogExp2(this._colorHorizonte.getHex(), 0.018);
    }

    restaurar(scene) {
        scene.background = this._colorHorizonte.clone();
        scene.fog        = new THREE.FogExp2(this._colorHorizonte.getHex(), 0.018);
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
        this.#malla.material.map?.dispose();
        this.#malla.material.dispose();
        this.#malla = null;
    }
}
