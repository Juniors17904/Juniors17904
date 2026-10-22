'use strict';

// ================================================================
// CLASE: MapasTestDriveRecto — minimapa (#minimap-td3d) y recorrido
// (#trail-map) del Test Drive 3D simple, con sus botones MAPA y
// RECORRIDO (PRD 004 D6, sacado de Aplicacion sin cambios).
// ================================================================
class MapasTestDriveRecto {
    static #ANCHO  = 90;
    static #ALTO   = 120;
    static #MARGEN = 10;

    #lienzoMinimapa   = document.getElementById('minimap-td3d');
    #lienzoRecorrido  = document.getElementById('trail-map');
    #ctxMinimapa      = this.#lienzoMinimapa.getContext('2d');
    #ctxRecorrido     = this.#lienzoRecorrido.getContext('2d');
    #verMinimapa      = true;
    #verRecorrido     = true;
    #puntosRecorrido  = [];

    mostrar() {
        const mmBtn = document.getElementById('btn-toggle-minimap');
        this.#lienzoMinimapa.style.display = 'block';
        mmBtn.style.display = 'block';
        mmBtn.addEventListener('click', () => {
            this.#verMinimapa = !this.#verMinimapa;
            this.#lienzoMinimapa.style.display = this.#verMinimapa ? 'block' : 'none';
            mmBtn.textContent = this.#verMinimapa ? 'MAPA' : 'MAPA ✕';
        });

        const trailBtn = document.getElementById('btn-toggle-trail');
        this.#lienzoRecorrido.style.display = 'block';
        trailBtn.style.display = 'block';
        trailBtn.textContent = 'RECORRIDO';
        trailBtn.onclick = () => {
            this.#verRecorrido = !this.#verRecorrido;
            this.#lienzoRecorrido.style.display = this.#verRecorrido ? 'block' : 'none';
            trailBtn.textContent = this.#verRecorrido ? 'RECORRIDO' : 'RECORRIDO ✕';
        };
    }

    dibujar(td) {
        if (this.#verMinimapa)  this.#dibujarMinimapa(td);
        if (this.#verRecorrido) this.#dibujarRecorrido(td);
    }

    #dibujarMinimapa(td) {
        const MM_W = MapasTestDriveRecto.#ANCHO, MM_H = MapasTestDriveRecto.#ALTO;
        const MM_PAD = MapasTestDriveRecto.#MARGEN, MM_CX = MM_W / 2;
        const mmCtx = this.#ctxMinimapa;
        mmCtx.clearRect(0, 0, MM_W, MM_H);
        mmCtx.fillStyle = 'rgba(0,0,0,0.70)';
        mmCtx.roundRect(0, 0, MM_W, MM_H, 8); mmCtx.fill();
        mmCtx.strokeStyle = '#6b7280'; mmCtx.lineWidth = 3; mmCtx.lineCap = 'round';
        mmCtx.beginPath(); mmCtx.moveTo(MM_CX, MM_PAD); mmCtx.lineTo(MM_CX, MM_H - MM_PAD); mmCtx.stroke();
        const mmPy = MM_H - MM_PAD - (td.pz / 950) * (MM_H - MM_PAD * 2);
        const mmPx = MM_CX;
        mmCtx.shadowColor = '#ef4444'; mmCtx.shadowBlur = 8;
        mmCtx.fillStyle = '#ef4444';
        mmCtx.beginPath(); mmCtx.arc(mmPx, mmPy, 4, 0, Math.PI * 2); mmCtx.fill();
        mmCtx.shadowBlur = 0;
    }

    #dibujarRecorrido(td) {
        const MM_W = MapasTestDriveRecto.#ANCHO, MM_H = MapasTestDriveRecto.#ALTO;
        const MM_PAD = MapasTestDriveRecto.#MARGEN, MM_CX = MM_W / 2;
        const trailCtx  = this.#ctxRecorrido;
        const trailPts  = this.#puntosRecorrido;
        const lastTp = trailPts[trailPts.length - 1];
        const ddx = lastTp ? td.px - lastTp[0] : 999;
        const ddz = lastTp ? td.pz - lastTp[1] : 999;
        if (ddx*ddx + ddz*ddz > 0.04) trailPts.push([td.px, td.pz]);
        if (trailPts.length > 3000) trailPts.shift();

        trailCtx.clearRect(0, 0, MM_W, MM_H);
        trailCtx.fillStyle = 'rgba(0,0,0,0.70)';
        trailCtx.roundRect(0, 0, MM_W, MM_H, 8); trailCtx.fill();
        if (trailPts.length > 1) {
            trailCtx.strokeStyle = '#06b6d4'; trailCtx.lineWidth = 1.5; trailCtx.lineCap = 'round'; trailCtx.lineJoin = 'round';
            trailCtx.beginPath();
            trailPts.forEach(([wx, wz], i) => {
                const tx = MM_CX + (-wx / 3.8) * (MM_W * 0.15);
                const ty = MM_H - MM_PAD - (wz / 950) * (MM_H - MM_PAD * 2);
                i === 0 ? trailCtx.moveTo(tx, ty) : trailCtx.lineTo(tx, ty);
            });
            trailCtx.stroke();
        }
        const tpx = MM_CX + (-td.px / 3.8) * (MM_W * 0.15);
        const tpy = MM_H - MM_PAD - (td.pz / 950) * (MM_H - MM_PAD * 2);
        trailCtx.shadowColor = '#ef4444'; trailCtx.shadowBlur = 8;
        trailCtx.fillStyle = '#ef4444';
        trailCtx.beginPath(); trailCtx.arc(tpx, tpy, 4, 0, Math.PI * 2); trailCtx.fill();
        trailCtx.shadowBlur = 0;
        trailCtx.fillStyle = 'rgba(255,255,255,0.5)';
        trailCtx.font = '7px monospace';
        trailCtx.fillText('RUTA', 3, 8);
    }
}
