'use strict';

import { RegistroCarros } from '../carros/registro_carros.js';
import { MedidorAvance }  from '../medidor_avance.js';

// ================================================================
// MODEL — Rival: un carro de la PC en Jugar Solo (PRD 013, D6).
// Junta su piloto (PilotoPC), su Carro, su CarreraVueltas, su Cronometro
// y su DetectorChoques, todos sin modificar. En cada paso de 1/60 s hace
// lo mismo que el jugador (RF-06, D3): el piloto decide, el carro se
// mueve, choca con los objetos, se cuentan las vueltas y pisa la
// superficie que calcula la carrera (mismo freno del pasto).
// Al terminar sigue dando vueltas a su ritmo normal (sin contar tiempo),
// para no quedar parado en la pista tapando a los que siguen.
// ================================================================
export class Rival {
    static #MS_PASO = 1000 / 60;
    static #CAMBIO_RITMO = 0.0005;   // por paso: de 1 a 0,85 tarda unos 5 s


    #piloto; #carro; #carrera; #cronometro; #detector; #medida;
    #terminado = false;
    #ritmo     = 1;   // sigue de a poco al ritmo pedido (no cambia de golpe)
    #medidor   = new MedidorAvance();

    constructor(piloto, carro, carrera, cronometro, detectorChoques, medidaCarro) {
        this.#piloto     = piloto;
        this.#carro      = carro;
        this.#carrera    = carrera;
        this.#cronometro = cronometro;
        this.#detector   = detectorChoques;
        this.#medida     = medidaCarro;
    }

    get nombre()        { return this.#piloto.nombre; }
    get esJugador()     { return false; }
    get piloto()        { return this.#piloto; }
    get carro()         { return this.#carro; }
    get carrera()       { return this.#carrera; }
    get cronometro()    { return this.#cronometro; }
    get medida()        { return this.#medida; }
    get terminado()     { return this.#terminado; }
    get tiempoTotalMs() { return this.#cronometro.tiempoTotalMs; }
    get avance()        { return this.#medidor.avanceDe(this.#carrera); }

    // Un paso de 1/60 s con el ritmo que da AjusteRitmo. otros: los Carro
    // de los demás, para que el piloto los pase sin empujarlos.
    paso(ritmo = 1, otros = []) {
        const carro = this.#carro;
        const px = carro.px, pz = carro.pz;
        this.#seguirRitmo(this.#terminado ? 1 : ritmo);
        this.#piloto.decidir(carro, this.#ritmo, otros);
        carro.actualizar(Rival.#MS_PASO);
        this.#detector?.resolver(carro, px, pz);
        this.#piloto.ubicar(carro);
        const evento = this.#carrera.actualizar(carro.px, carro.pz);
        if (!this.#terminado && evento === 'vuelta') this.#cronometro.marcarVuelta();
        if (!this.#terminado && evento === 'meta') {
            this.#cronometro.marcarVuelta();
            this.#cronometro.detener();
            this.#terminado = true;
        }
        carro.pisar(this.#carrera.superficie);
    }

    #seguirRitmo(pedido) {
        const objetivo = Number.isFinite(pedido) ? pedido : 1;
        const tope = Rival.#CAMBIO_RITMO;
        this.#ritmo += Math.max(-tope, Math.min(tope, objetivo - this.#ritmo));
    }

    // Vuelve a la grilla: carro nuevo detenido en su lugar, vueltas y tiempo en cero
    reiniciar(puntoSalida) {
        this.#carro = new RegistroCarros().crear(this.#piloto.tipoAuto, puntoSalida.x, puntoSalida.z, puntoSalida.angulo);
        this.#carrera.reiniciar();
        this.#carrera.actualizar(this.#carro.px, this.#carro.pz);
        this.#carro.pisar(this.#carrera.superficie);
        this.#cronometro.reiniciar();
        this.#terminado = false;
        this.#ritmo = 1;
        this.#piloto.reiniciar(this.#carro);
    }
}
