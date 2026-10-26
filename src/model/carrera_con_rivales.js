'use strict';

import { AzarSemilla }       from './azar_semilla.js';
import { RegistroCarros }    from './carros/registro_carros.js';
import { DetectorChoques }   from './choques/detector_choques.js';
import { ChoqueEntreCarros } from './choques/choque_entre_carros.js';
import { PilotoPrudente }    from './pilotos/piloto_prudente.js';
import { PilotoAgresivo }    from './pilotos/piloto_agresivo.js';
import { PilotoNovato }      from './pilotos/piloto_novato.js';
import { PilotoExperto }     from './pilotos/piloto_experto.js';
import { Rival }             from './pilotos/rival.js';
import { AjusteRitmo }       from './ajuste_ritmo.js';
import { TablaPosiciones }   from './tabla_posiciones.js';
import { MedidorAvance }     from './medidor_avance.js';
import { ParticipanteCarrera } from './participante_carrera.js';

// ================================================================
// MODEL — CarreraConRivales: los rivales de la PC de Jugar Solo (PRD 013).
//   - Corren de 1 a 4 según la elección, y la dificultad (DificultadCarrera)
//     decide quiénes y con qué ritmo (PRD 018, D3 y D4). Sin dificultad
//     (null) son los 4 de siempre, en Normal.
//   - Crea un Rival por personalidad (D2), cada uno con su piloto, su carro,
//     su CarreraVueltas de 3 vueltas, su Cronometro y su DetectorChoques
//     con las medidas de su carro (D6, RF-06).
//   - Cada paso de 1/60 s mueve a los rivales con el ritmo de AjusteRitmo
//     (D4) y separa a los carros que se tocan (ChoqueEntreCarros, D7). Los
//     que ya terminaron siguen rodando, pero no chocan: así nunca tapan
//     a los que siguen en carrera.
//   - Da la tabla de posiciones con el jugador (TablaPosiciones, D5).
// El azar de cada piloto sale de la semilla (RF-05): misma semilla, misma
// carrera. Las clases clásicas (CarreraVueltas, Cronometro, MedidasEscena)
// se leen de globalThis.
// ================================================================
export class CarreraConRivales {
    static #VUELTAS  = 3;
    // En la grilla, del más rápido al más lento: así no arrancan trabados
    static #PILOTOS  = [PilotoExperto, PilotoAgresivo, PilotoPrudente, PilotoNovato];
    static #SALTO_SEMILLA = 7919;

    #rivales  = [];
    #ajuste;
    #tabla    = new TablaPosiciones();
    #medidor  = new MedidorAvance();
    #choque   = new ChoqueEntreCarros();
    #carreraJugador = null;
    #jugadorLlego   = false;   // lo avisa el controlador al cerrar la carrera del jugador

    constructor(ruta, decoraciones, muestras, semilla = 1, reloj = null, dificultad = null, cantidad = CarreraConRivales.#PILOTOS.length) {
        const registro = new RegistroCarros();
        const medidas  = new globalThis.MedidasEscena();
        const inicio   = ruta.inicio;
        const total   = CarreraConRivales.#PILOTOS.length;
        const indices = dificultad ? dificultad.indicesPilotos(cantidad, total)
            : Array.from({ length: Math.max(0, Math.min(total, cantidad)) }, (_, i) => i);
        this.#ajuste = new AjusteRitmo(dificultad);
        // Cada piloto conserva su semilla por su lugar en la lista: con los 4 en Normal, la carrera de siempre
        indices.forEach(i => {
            const ClasePiloto = CarreraConRivales.#PILOTOS[i];
            const azar   = new AzarSemilla((Number(semilla) || 0) + (i + 1) * CarreraConRivales.#SALTO_SEMILLA);
            const piloto = new ClasePiloto(muestras, ruta.longitud, azar);
            const carro  = registro.crear(piloto.tipoAuto, inicio.x, inicio.z, inicio.angle);
            const medida = medidas.medidaCarro(piloto.tipoAuto);
            const carrera    = new globalThis.CarreraVueltas(muestras, CarreraConRivales.#VUELTAS);
            const cronometro = reloj ? new globalThis.Cronometro(reloj) : new globalThis.Cronometro();
            const detector   = new DetectorChoques(decoraciones, ruta, medida);
            this.#rivales.push(new Rival(piloto, carro, carrera, cronometro, detector, medida, this.#ajuste.base));
        });
    }

    get rivales()         { return [...this.#rivales]; }
    get todosTerminaron() { return this.#rivales.every(r => r.terminado); }

    // Los primeros PuntoSalida de GrillaSalida, uno por rival
    colocarEnGrilla(puntos) {
        this.#rivales.forEach((rival, i) => { if (puntos?.[i]) rival.reiniciar(puntos[i]); });
    }

    // ¡YA!: arrancan los cronómetros de los rivales
    iniciar() {
        for (const rival of this.#rivales) rival.cronometro.iniciar();
    }

    // CarreraVueltas del jugador, para el ajuste de ritmo y la tabla
    seguirJugador(carreraJugador) {
        this.#carreraJugador = carreraJugador ?? null;
        this.#jugadorLlego   = false;
    }

    // El jugador terminó: su carro queda quieto y ya no choca con los rivales (D5)
    jugadorLlego() {
        this.#jugadorLlego = true;
    }

    // Un paso de 1/60 s de los rivales y los choques entre los carros en carrera
    paso(carroJugador = null, medidaJugador = null) {
        const avanceJugador = this.#carreraJugador ? this.#medidor.avanceDe(this.#carreraJugador) : null;
        const ritmos = this.#ajuste.ritmos(avanceJugador, this.#rivales.map(r => r.avance));
        const carros = this.#rivales.map(r => r.carro);
        if (carroJugador) carros.push(carroJugador);
        this.#rivales.forEach((rival, i) => rival.paso(ritmos[i], carros));
        this.#chocarEntreSi(carroJugador, medidaJugador);
    }

    // Tabla de todos los carros (FilaPosicion[]), del 1.º al último
    posiciones(nombreJugador, terminadoJugador = false, tiempoJugadorMs = 0) {
        const jugador = new ParticipanteCarrera(nombreJugador, true, terminadoJugador, tiempoJugadorMs,
            this.#medidor.avanceDe(this.#carreraJugador));
        return this.#tabla.ordenar([...this.#rivales, jugador]);
    }

    // Revancha: los mismos rivales vuelven a la grilla
    reiniciar(puntos) {
        this.#jugadorLlego = false;
        this.colocarEnGrilla(puntos);
    }

    #chocarEntreSi(carroJugador, medidaJugador) {
        const carros = this.#rivales.filter(r => !r.terminado).map(r => [r.carro, r.medida]);
        if (carroJugador && medidaJugador && !this.#jugadorLlego && !this.#carreraJugador?.terminada) carros.push([carroJugador, medidaJugador]);
        for (let i = 0; i < carros.length; i++) {
            for (let j = i + 1; j < carros.length; j++) {
                this.#choque.resolver(carros[i][0], carros[i][1], carros[j][0], carros[j][1]);
            }
        }
    }
}
