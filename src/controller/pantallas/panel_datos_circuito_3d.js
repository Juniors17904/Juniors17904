'use strict';

// ================================================================
// CLASE: PanelDatosCircuito3D — paneles de depuración (#debug-td3d y
// #debug-path) del circuito 3D: velocidad, entradas, posición,
// cámara, física, recorrido sobre la ruta y FPS (PRD 004 D6, sacado
// de Aplicacion sin cambios).
// ================================================================
class PanelDatosCircuito3D {
    #visor       = null;
    #pista       = null;
    #rotYInicial = 0;
    #ultimo      = performance.now();
    #cuadros     = 0;
    #fps         = 60;

    constructor(visor, pista) {
        this.#visor       = visor;
        this.#pista       = pista;
        this.#rotYInicial = visor.rotY;
    }

    mostrar() {
        document.getElementById('debug-td3d').style.display = 'flex';
        document.getElementById('debug-path').style.display = 'block';
    }

    actualizar() {
        this.#contarCuadro();
        const cir = this.#visor, pistaCfg = this.#pista, cirInitRotY = this.#rotYInicial;
        const s=cir.velocidad, a=cir.aceleracion, kmh=Math.round(Math.abs(s)*216);
        document.getElementById('dbg-vel').textContent   = Math.abs(s).toFixed(3);
        document.getElementById('dbg-kmh').textContent   = kmh;
        document.getElementById('dbg-acel').textContent  = (a>=0?'+':'')+a.toFixed(4);
        document.getElementById('dbg-vmax').textContent  = cir.velocidadMax.toFixed(3);
        document.getElementById('dbg-iacel').textContent = cir.entradaAcel===1?'⬆ GAS':cir.entradaAcel===-1?'⬇ REVERSA':'NEUTRO';
        document.getElementById('dbg-idir').textContent  = cir.entradaDireccion<-0.1?'◀ IZQ':cir.entradaDireccion>0.1?'DER ▶':'RECTO';
        document.getElementById('dbg-rotx').textContent  = (0).toFixed(1);
        document.getElementById('dbg-rumbo').textContent = (((cir.rotY-cirInitRotY)*180/Math.PI%360)+360)%360 |0;
        document.getElementById('dbg-rotz').textContent  = (cir.rotZ*180/Math.PI).toFixed(1);
        document.getElementById('dbg-px').textContent    = cir.px.toFixed(1);
        document.getElementById('dbg-pz').textContent    = cir.pz.toFixed(1);
        document.getElementById('dbg-fps').textContent   = this.#fps;
        document.getElementById('dbg-camh').textContent      = cir.alturaCamara.toFixed(2);
        document.getElementById('dbg-cam-rotx').textContent  = (cir.camRotX*180/Math.PI).toFixed(1);
        document.getElementById('dbg-cam-roty').textContent  = (cir.camRotY*180/Math.PI|0);
        document.getElementById('dbg-cam-rotz').textContent  = (cir.camRotZ*180/Math.PI).toFixed(1);
        document.getElementById('dbg-cam-dist').textContent  = cir.physics.camDist;
        const ph=cir.physics;
        document.getElementById('dbg-f-accel').textContent = ph.constAceleracion;
        document.getElementById('dbg-f-brake').textContent = ph.constFreno;
        document.getElementById('dbg-f-drag').textContent  = ph.constArrastre;
        document.getElementById('dbg-f-steer').textContent = ph.constDireccion;
        document.getElementById('dbg-f-maxfwd').textContent= ph.velMaxAdelante;
        document.getElementById('dbg-f-maxrev').textContent= ph.velMaxReversa;
        const totalKm = (cir.pathLen / 1000).toFixed(2);
        document.getElementById('dbg-total').textContent = totalKm;
        document.getElementById('dbg-recor').textContent = (cir.progress * cir.pathLen / 1000).toFixed(3);
        const pp  = cir.pathPos;
        const off = Math.sqrt((cir.px-pp.x)**2 + (cir.pz-pp.z)**2);
        const seg = (cir.progress * pistaCfg.totalSegs) | 0;
        const trP = pistaCfg.tramos.find(([d,h]) => seg>=d && seg<h);
        document.getElementById('dbg-seg').textContent    = seg;
        document.getElementById('dbg-curva').textContent  = trP ? trP[2].toFixed(1) : '0.0';
        document.getElementById('dbg-path-x').textContent = pp.x.toFixed(1);
        document.getElementById('dbg-path-z').textContent = pp.z.toFixed(1);
        document.getElementById('dbg-off').textContent    = off.toFixed(2);
        document.getElementById('dbg-lat').textContent    = cir.lateral.toFixed(2);
    }

    #contarCuadro() {
        this.#cuadros++;
        const ahora = performance.now();
        if (ahora - this.#ultimo >= 500) {
            this.#fps = Math.round(this.#cuadros * 1000 / (ahora - this.#ultimo));
            this.#cuadros = 0; this.#ultimo = ahora;
        }
    }
}
