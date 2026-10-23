'use strict';

// ================================================================
// CLASE: RecorridoCircuito3D — mapa del recorrido (#trail-map) del
// circuito 3D: la ruta en el mundo, el camino que hizo el carro, el
// carro y, con la cámara aérea, la zona que se está viendo.
// ================================================================
class RecorridoCircuito3D extends MapaConduccion {
    #ruta      = [];     // PuntoMundo[] de la ruta
    #historial = new HistorialRecorrido(0.25, 4000);
    #hayEscala = false;  // la escala se pudo calcular
    #escala    = 1;
    #origenX   = 0;
    #origenZ   = 0;

    constructor(visor) {
        super('trail-map');
        this.#ruta = visor.pathSamples(300).map(p => new PuntoMundo(p.x, p.z));
        this.#calcularEscala();
    }

    dibujarContenido(trailCtx, cir) {
        this.#historial.registrar(cir.px, cir.pz);
        const trailPts = this.#historial.puntos, hayEscala = this.#hayEscala;

        if (hayEscala) {
            trailCtx.strokeStyle='#374151'; trailCtx.lineWidth=2.5;
            trailCtx.lineCap='round'; trailCtx.lineJoin='round';
            this.#trazar(trailCtx, this.#ruta);
            trailCtx.closePath(); trailCtx.stroke();
        }

        if (hayEscala && trailPts.length > 1) {
            trailCtx.strokeStyle='#06b6d4'; trailCtx.lineWidth=1.5;
            trailCtx.lineCap='round'; trailCtx.lineJoin='round';
            this.#trazar(trailCtx, trailPts);
            trailCtx.stroke();
        }

        if (hayEscala) {
            this.dibujarCarro(trailCtx, this.#aMapaX(cir.px), this.#aMapaY(cir.pz));
        } else {
            this.dibujarCarro(trailCtx, this.ancho / 2, this.alto / 2);
        }

        if (cir.camAereaActiva && cir.camAerea && hayEscala) {
            const zona = cir.camAerea.zonaVisible;
            const cx = this.#aMapaX(zona.x), cy = this.#aMapaY(zona.z);
            const r = zona.radio * this.#escala;
            trailCtx.strokeStyle='rgba(255,255,255,0.6)'; trailCtx.lineWidth=1.5;
            trailCtx.setLineDash([3,2]);
            trailCtx.beginPath(); trailCtx.rect(cx-r, cy-r, r*2, r*2); trailCtx.stroke();
            trailCtx.setLineDash([]);
        }

        this.dibujarEtiquetaRuta(trailCtx);
    }

    #trazar(ctx, puntos) {
        ctx.beginPath();
        puntos.forEach((p, i) => {
            const x = this.#aMapaX(p.x), y = this.#aMapaY(p.z);
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        });
    }

    #calcularEscala() {
        const MM_W = this.ancho, MM_H = this.alto, MM_PAD = this.margen;
        const wxs=this.#ruta.map(p=>p.x), wzs=this.#ruta.map(p=>p.z);
        const minX=Math.min(...wxs)-8, maxX=Math.max(...wxs)+8;
        const minZ=Math.min(...wzs)-8, maxZ=Math.max(...wzs)+8;
        const scl=Math.min((MM_W-MM_PAD*2)/(maxX-minX),(MM_H-MM_PAD*2)/(maxZ-minZ));
        this.#escala  = scl;
        this.#origenX = (MM_W-(maxX-minX)*scl)/2+maxX*scl;
        this.#origenZ = (MM_H-(maxZ-minZ)*scl)/2+maxZ*scl;
        this.#hayEscala = true;
    }

    // Mundo 3D → píxeles del recorrido
    #aMapaX(wx) { return -wx*this.#escala+this.#origenX; }
    #aMapaY(wz) { return -wz*this.#escala+this.#origenZ; }
}
