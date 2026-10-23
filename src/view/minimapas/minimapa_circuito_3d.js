'use strict';

// ================================================================
// CLASE: MinimapaCircuito3D — minimapa (#minimap-td3d) del circuito
// 3D: el trazado de la pista, la línea de salida y el carro según su
// progreso en la vuelta.
// ================================================================
class MinimapaCircuito3D extends MapaConduccion {
    #trazado = null;   // PuntoMinimapa[] en píxeles, o null si la pista no tiene tramos

    constructor(pistaCfg) {
        super('minimap-td3d');
        this.#trazado = this.#calcularTrazado(pistaCfg);
    }

    get puedeDibujar() { return Boolean(this.#trazado); }

    dibujarContenido(mmCtx, cir) {
        const mmCircuit = this.#trazado;
        mmCtx.strokeStyle='#6b7280'; mmCtx.lineWidth=2.5; mmCtx.lineCap='round'; mmCtx.lineJoin='round';
        mmCtx.beginPath();
        mmCircuit.forEach((p,i)=>i===0?mmCtx.moveTo(p.x,p.y):mmCtx.lineTo(p.x,p.y));
        mmCtx.closePath(); mmCtx.stroke();
        mmCtx.fillStyle='#f59e0b';
        mmCtx.fillRect(mmCircuit[0].x-5,mmCircuit[0].y-1,10,2);
        const idx=(cir.progress*mmCircuit.length)|0;
        const cp=mmCircuit[Math.min(idx,mmCircuit.length-1)];
        this.dibujarCarro(mmCtx, cp.x, cp.y);
    }

    #calcularTrazado(pistaCfg) {
        const MM_W = this.ancho, MM_H = this.alto, MM_PAD = this.margen;
        if (!pistaCfg?.tramos?.length) return null;
        const xs = [], ys = [];
        let x=0,y=0,angle=-Math.PI/2;
        for (let i=0; i<pistaCfg.totalSegs; i++) {
            const tr=pistaCfg.tramos.find(([d,h])=>i>=d&&i<h);
            angle+=(tr?tr[2]:0)*0.045;
            x-=Math.cos(angle)*1.5; y+=Math.sin(angle)*1.5;
            xs.push(x); ys.push(y);
        }
        const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
        const scl=Math.min((MM_W-MM_PAD*2)/(maxX-minX||1),(MM_H-MM_PAD*2)/(maxY-minY||1));
        const ox=(MM_W-(maxX-minX)*scl)/2-minX*scl, oy=(MM_H-(maxY-minY)*scl)/2-minY*scl;
        return xs.map((px, i)=>new PuntoMinimapa(px*scl+ox, ys[i]*scl+oy));
    }
}
