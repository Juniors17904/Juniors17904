'use strict';

// ================================================================
// CLASE: MapasCircuito3D — minimapa (#minimap-td3d) y recorrido
// (#trail-map) del circuito 3D: se pueden arrastrar con el dedo y
// mostrar u ocultar juntos (PRD 004 D6, sacado de Aplicacion sin
// cambios).
// ================================================================
class MapasCircuito3D {
    static #ANCHO  = 90;
    static #ALTO   = 120;
    static #MARGEN = 10;

    #visor            = null;
    #lienzoMinimapa   = document.getElementById('minimap-td3d');
    #lienzoRecorrido  = document.getElementById('trail-map');
    #ctxMinimapa      = this.#lienzoMinimapa.getContext('2d');
    #ctxRecorrido     = this.#lienzoRecorrido.getContext('2d');
    #verMinimapa      = true;
    #verRecorrido     = true;
    #puntosRecorrido  = [];
    #circuitoMinimapa = null;   // puntos del minimapa en píxeles
    #circuitoMundo    = null;   // puntos de la ruta en el mundo 3D
    #hayEscala        = false;  // la escala del recorrido se pudo calcular
    #escala           = 1;
    #origenX          = 0;
    #origenZ          = 0;

    constructor(visor, pistaCfg) {
        this.#visor            = visor;
        this.#circuitoMinimapa = this.#calcularMinimapa(pistaCfg);
        this.#circuitoMundo    = visor.pathSamples(300).map(p => [p.x, p.z]);
        this.#calcularEscalaRecorrido();
    }

    mostrar() {
        for (const lienzo of [this.#lienzoMinimapa, this.#lienzoRecorrido]) {
            lienzo.style.display = 'block';
            lienzo.style.pointerEvents = 'auto';
            lienzo.style.cursor = 'grab';
            this.#hacerArrastrable(lienzo);
        }
    }

    // Botón MAPAS: muestra u oculta los dos mapas juntos
    mostrarAmbos(visible) {
        this.#verMinimapa  = visible;
        this.#verRecorrido = visible;
        this.#lienzoMinimapa.style.display  = visible ? 'block' : 'none';
        this.#lienzoRecorrido.style.display = visible ? 'block' : 'none';
    }

    dibujar() {
        if (this.#verMinimapa && this.#circuitoMinimapa) this.#dibujarMinimapa();
        if (this.#verRecorrido) this.#dibujarRecorrido();
    }

    #hacerArrastrable(lienzo) {
        let sx, sy, ox, oy;
        lienzo.addEventListener('touchstart', e => {
            const t = e.touches[0];
            sx = t.clientX; sy = t.clientY;
            ox = lienzo.offsetLeft; oy = lienzo.offsetTop;
            e.stopPropagation();
        }, {passive:true});
        lienzo.addEventListener('touchmove', e => {
            e.preventDefault(); e.stopPropagation();
            const t = e.touches[0];
            lienzo.style.left   = (ox + t.clientX - sx) + 'px';
            lienzo.style.top    = (oy + t.clientY - sy) + 'px';
            lienzo.style.right  = 'auto';
            lienzo.style.bottom = 'auto';
        }, {passive:false});
    }

    #calcularMinimapa(pistaCfg) {
        const MM_W = MapasCircuito3D.#ANCHO, MM_H = MapasCircuito3D.#ALTO, MM_PAD = MapasCircuito3D.#MARGEN;
        if (!pistaCfg?.tramos?.length) return null;
        const pts=[];
        let x=0,y=0,angle=-Math.PI/2;
        for (let i=0; i<pistaCfg.totalSegs; i++) {
            const tr=pistaCfg.tramos.find(([d,h])=>i>=d&&i<h);
            angle+=(tr?tr[2]:0)*0.045;
            x-=Math.cos(angle)*1.5; y+=Math.sin(angle)*1.5; pts.push([x,y]);
        }
        const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
        const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
        const scl=Math.min((MM_W-MM_PAD*2)/(maxX-minX||1),(MM_H-MM_PAD*2)/(maxY-minY||1));
        const ox=(MM_W-(maxX-minX)*scl)/2-minX*scl, oy=(MM_H-(maxY-minY)*scl)/2-minY*scl;
        return pts.map(([px,py])=>new PuntoMinimapa(px*scl+ox, py*scl+oy));
    }

    #calcularEscalaRecorrido() {
        const MM_W = MapasCircuito3D.#ANCHO, MM_H = MapasCircuito3D.#ALTO, MM_PAD = MapasCircuito3D.#MARGEN;
        const worldCircuit = this.#circuitoMundo;
        if (!worldCircuit) return;
        const wxs=worldCircuit.map(p=>p[0]), wzs=worldCircuit.map(p=>p[1]);
        const minX=Math.min(...wxs)-8, maxX=Math.max(...wxs)+8;
        const minZ=Math.min(...wzs)-8, maxZ=Math.max(...wzs)+8;
        const scl=Math.min((MM_W-MM_PAD*2)/(maxX-minX),(MM_H-MM_PAD*2)/(maxZ-minZ));
        const ox=(MM_W-(maxX-minX)*scl)/2+maxX*scl;
        const oz=(MM_H-(maxZ-minZ)*scl)/2+maxZ*scl;
        this.#escala  = scl;
        this.#origenX = ox;
        this.#origenZ = oz;
        this.#hayEscala = true;
    }

    // Mundo 3D → píxeles del recorrido
    #aRecorrido(wx, wz) {
        return { x: -wx*this.#escala+this.#origenX, y: -wz*this.#escala+this.#origenZ };
    }

    #dibujarMinimapa() {
        const MM_W = MapasCircuito3D.#ANCHO, MM_H = MapasCircuito3D.#ALTO;
        const mmCtx = this.#ctxMinimapa, mmCircuit = this.#circuitoMinimapa, cir = this.#visor;
        mmCtx.clearRect(0,0,MM_W,MM_H);
        mmCtx.fillStyle='rgba(0,0,0,0.70)';
        mmCtx.roundRect(0,0,MM_W,MM_H,8); mmCtx.fill();
        mmCtx.strokeStyle='#6b7280'; mmCtx.lineWidth=2.5; mmCtx.lineCap='round'; mmCtx.lineJoin='round';
        mmCtx.beginPath();
        mmCircuit.forEach((p,i)=>i===0?mmCtx.moveTo(p.x,p.y):mmCtx.lineTo(p.x,p.y));
        mmCtx.closePath(); mmCtx.stroke();
        mmCtx.fillStyle='#f59e0b';
        mmCtx.fillRect(mmCircuit[0].x-5,mmCircuit[0].y-1,10,2);
        const idx=(cir.progress*mmCircuit.length)|0;
        const cp=mmCircuit[Math.min(idx,mmCircuit.length-1)];
        mmCtx.shadowColor='#ef4444'; mmCtx.shadowBlur=8;
        mmCtx.fillStyle='#ef4444';
        mmCtx.beginPath(); mmCtx.arc(cp.x,cp.y,4,0,Math.PI*2); mmCtx.fill();
        mmCtx.shadowBlur=0;
    }

    #dibujarRecorrido() {
        const MM_W = MapasCircuito3D.#ANCHO, MM_H = MapasCircuito3D.#ALTO;
        const trailCtx = this.#ctxRecorrido, trailPts = this.#puntosRecorrido, cir = this.#visor;
        const worldCircuit = this.#circuitoMundo, hayEscala = this.#hayEscala;
        const lastPt = trailPts[trailPts.length-1];
        const ddx = lastPt ? cir.px-lastPt[0] : 999, ddz = lastPt ? cir.pz-lastPt[1] : 999;
        if (ddx*ddx+ddz*ddz > 0.25) trailPts.push([cir.px, cir.pz]);
        if (trailPts.length > 4000) trailPts.shift();

        trailCtx.clearRect(0,0,MM_W,MM_H);
        trailCtx.fillStyle='rgba(0,0,0,0.70)';
        trailCtx.roundRect(0,0,MM_W,MM_H,8); trailCtx.fill();

        if (worldCircuit && hayEscala) {
            trailCtx.strokeStyle='#374151'; trailCtx.lineWidth=2.5;
            trailCtx.lineCap='round'; trailCtx.lineJoin='round';
            trailCtx.beginPath();
            worldCircuit.forEach(([wx,wz],i)=>{ const p=this.#aRecorrido(wx,wz); i===0?trailCtx.moveTo(p.x,p.y):trailCtx.lineTo(p.x,p.y); });
            trailCtx.closePath(); trailCtx.stroke();
        }

        if (hayEscala && trailPts.length > 1) {
            trailCtx.strokeStyle='#06b6d4'; trailCtx.lineWidth=1.5;
            trailCtx.lineCap='round'; trailCtx.lineJoin='round';
            trailCtx.beginPath();
            trailPts.forEach(([wx,wz],i)=>{ const p=this.#aRecorrido(wx,wz); i===0?trailCtx.moveTo(p.x,p.y):trailCtx.lineTo(p.x,p.y); });
            trailCtx.stroke();
        }

        const tc = hayEscala ? this.#aRecorrido(cir.px, cir.pz) : {x:MM_W/2,y:MM_H/2};
        trailCtx.shadowColor='#ef4444'; trailCtx.shadowBlur=8;
        trailCtx.fillStyle='#ef4444';
        trailCtx.beginPath(); trailCtx.arc(tc.x,tc.y,4,0,Math.PI*2); trailCtx.fill();
        trailCtx.shadowBlur=0;

        if (cir.camAereaActiva && cir.camAerea && hayEscala) {
            const zona = cir.camAerea.zonaVisible;
            const c = this.#aRecorrido(zona.x, zona.z);
            const r = zona.radio * this.#escala;
            trailCtx.strokeStyle='rgba(255,255,255,0.6)'; trailCtx.lineWidth=1.5;
            trailCtx.setLineDash([3,2]);
            trailCtx.beginPath(); trailCtx.rect(c.x-r, c.y-r, r*2, r*2); trailCtx.stroke();
            trailCtx.setLineDash([]);
        }

        trailCtx.fillStyle='rgba(255,255,255,0.5)';
        trailCtx.font='7px monospace';
        trailCtx.fillText('RUTA',3,8);
    }
}
