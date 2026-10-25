'use strict';
try {

// ================================================================
// MODEL — TrayectoDubins: un camino entre dos poses con curvas de un radio
// fijo (PRD 014, D4) de la forma curva, recta, curva. Prueba las cuatro
// combinaciones (derecha o izquierda en cada punta) y se queda con la más
// corta (no prueba curva, curva, curva: entre poses lejanas no hace falta). muestrear(paso) lo recorre en poses separadas por "paso".
// ================================================================
class TrayectoDubins {
    static #VUELTA = 2 * Math.PI;

    #desde; #radio;
    #lado1 = 1; #lado2 = 1;          // +1 dobla a la derecha, -1 a la izquierda
    #largo1 = 0; #recta = 0; #largo2 = 0;
    #rumboRecta = 0;
    #total = Infinity;

    constructor(desde, hasta, radio) {
        this.#desde = desde;
        this.#radio = radio;
        for (const lado1 of [1, -1]) {
            for (const lado2 of [1, -1]) this.#probar(desde, hasta, lado1, lado2);
        }
    }

    get largo() { return this.#largo1 + this.#recta + this.#largo2; }

    // Poses cada "paso" metros, sin la primera (la del inicio)
    muestrear(paso) {
        const poses = [], total = this.largo;
        const cantidad = Math.max(1, Math.round(total / paso));
        for (let i = 1; i <= cantidad; i++) poses.push(this.poseEn(total * i / cantidad));
        return poses;
    }

    poseEn(s) {
        const d = this.#desde;
        if (s <= this.#largo1) return this.#sobreArco(d.x, d.z, d.rumbo, this.#lado1, s);
        const fin1 = this.#sobreArco(d.x, d.z, d.rumbo, this.#lado1, this.#largo1);
        const r = s - this.#largo1;
        if (r <= this.#recta) {
            const rumbo = this.#rumboRecta;
            return new window.PoseCierre(fin1.x + Math.sin(rumbo) * r, fin1.z + Math.cos(rumbo) * r, rumbo);
        }
        const x = fin1.x + Math.sin(this.#rumboRecta) * this.#recta;
        const z = fin1.z + Math.cos(this.#rumboRecta) * this.#recta;
        return this.#sobreArco(x, z, this.#rumboRecta, this.#lado2, Math.min(r - this.#recta, this.#largo2));
    }

    // Avanza "largo" metros por un arco que empieza en (x, z) con ese rumbo
    #sobreArco(x, z, rumbo, lado, largo) {
        const R = this.#radio;
        const cx = x + lado * R * Math.cos(rumbo), cz = z - lado * R * Math.sin(rumbo);
        const r = rumbo + lado * largo / R;
        return new window.PoseCierre(cx - lado * R * Math.cos(r), cz + lado * R * Math.sin(r), r);
    }

    #centro(pose, lado) {
        return [pose.x + lado * this.#radio * Math.cos(pose.rumbo), pose.z - lado * this.#radio * Math.sin(pose.rumbo)];
    }

    #giro(angulo) {
        const v = TrayectoDubins.#VUELTA;
        return ((angulo % v) + v) % v;
    }

    // Calcula esta combinación y la guarda si es la más corta hasta ahora
    #probar(desde, hasta, lado1, lado2) {
        const R = this.#radio;
        const [x1, z1] = this.#centro(desde, lado1), [x2, z2] = this.#centro(hasta, lado2);
        const dx = x2 - x1, dz = z2 - z1, D = Math.hypot(dx, dz);
        const rumboCentros = Math.atan2(dx, dz);
        let recta, rumboRecta;
        if (lado1 === lado2) {
            recta = D;
            rumboRecta = rumboCentros;
        } else {
            if (D < 2 * R) return;
            recta = Math.sqrt(D * D - 4 * R * R);
            rumboRecta = rumboCentros - Math.atan2(-2 * lado1 * R, recta);
        }
        const largo1 = R * this.#giro(lado1 * (rumboRecta - desde.rumbo));
        const largo2 = R * this.#giro(lado2 * (hasta.rumbo - rumboRecta));
        if (largo1 + recta + largo2 >= this.#total) return;
        this.#total = largo1 + recta + largo2;
        this.#lado1 = lado1; this.#lado2 = lado2;
        this.#largo1 = largo1; this.#recta = recta; this.#largo2 = largo2;
        this.#rumboRecta = rumboRecta;
    }
}

window.TrayectoDubins = TrayectoDubins;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[trayecto_dubins.js] ' + e.message);
    console.error('[trayecto_dubins.js]', e);
}
