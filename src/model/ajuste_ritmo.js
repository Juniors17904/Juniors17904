'use strict';

// ================================================================
// MODEL — AjusteRitmo: cuánto afloja o arriesga cada rival para que los
// 5 carros lleguen separados de forma natural (PRD 013, D4).
//   - Ritmo 1 = su manejo normal; menos de 1 afloja; más de 1 arriesga.
//     El piloto nunca pasa el tope de su física: el ritmo solo cambia
//     cuánto se anima, no lo que el carro puede hacer.
//   - Mira los huecos con el carro de adelante y el de atrás (rivales y
//     jugador, ordenados por avance):
//       · pegado al de adelante (menos de unos 3 s) → afloja un poco, para
//         que no lleguen juntos;
//       · el de atrás quedó muy lejos (más de unos 10 s) → afloja y lo
//         espera (así el que va muy adelante del jugador afloja);
//       · detrás del jugador y muy lejos del de adelante → arriesga.
//   - Fuera de eso maneja normal (ritmo 1): cerca del jugador no cambia.
// El ritmo pedido puede saltar; el Rival lo sigue de a poco.
// Avances en vueltas (MedidorAvance). Sin jugador (null) todos van a su ritmo base.
// La dificultad (DificultadCarrera, PRD 018) cambia el ritmo base, los topes y
// cuánto esperan; sin dificultad (null) es la de siempre (Normal).
// ================================================================
export class AjusteRitmo {
    static #MINIMO   = 0.85;
    static #MAXIMO   = 1.1;
    static #CERCA    = 0.07;   // vueltas (≈ 3 s): más cerca del de adelante, va pegado
    static #LEJOS    = 0.22;   // vueltas (≈ 10 s): más lejos, el hueco es grande
    static #FUERZA_PEGADO    = 0.08;  // ritmo que baja pegado del todo
    static #FUERZA_ESPERAR   = 1.0;   // ritmo que baja por vuelta de hueco de más atrás
    static #FUERZA_ARRIESGAR = 0.5;   // ritmo que sube por vuelta de hueco de más adelante

    #base    = 1;
    #minimo  = AjusteRitmo.#MINIMO;
    #maximo  = AjusteRitmo.#MAXIMO;
    #esperar = AjusteRitmo.#FUERZA_ESPERAR;

    constructor(dificultad = null) {
        if (!dificultad) return;
        this.#base    = dificultad.ritmoBase;
        this.#minimo  = dificultad.ritmoMinimo;
        this.#maximo  = dificultad.ritmoMaximo;
        this.#esperar = dificultad.fuerzaEsperar;
    }

    get base()   { return this.#base; }
    get minimo() { return this.#minimo; }
    get maximo() { return this.#maximo; }

    ritmos(avanceJugador, avancesRivales) {
        const avances = (avancesRivales ?? []).map(a => Number(a) || 0);
        if (!Number.isFinite(avanceJugador)) return avances.map(() => this.#base);
        return avances.map((avance, i) => {
            const otros   = [avanceJugador, ...avances.filter((_, j) => j !== i)];
            const delante = this.#hueco(otros.filter(a => a > avance).map(a => a - avance));
            const atras   = this.#hueco(otros.filter(a => a <= avance).map(a => avance - a));
            let ritmo = this.#base;
            if (delante !== null && delante < AjusteRitmo.#CERCA) {
                ritmo -= (AjusteRitmo.#CERCA - delante) / AjusteRitmo.#CERCA * AjusteRitmo.#FUERZA_PEGADO;
            }
            if (atras !== null && atras > AjusteRitmo.#LEJOS) {
                ritmo -= (atras - AjusteRitmo.#LEJOS) * this.#esperar;
            }
            if (avance < avanceJugador && delante > AjusteRitmo.#LEJOS) {
                ritmo += (delante - AjusteRitmo.#LEJOS) * AjusteRitmo.#FUERZA_ARRIESGAR;
            }
            return Math.min(this.#maximo, Math.max(this.#minimo, ritmo));
        });
    }

    // El hueco más chico (con el carro que tiene justo al lado), o null si no hay
    #hueco(diferencias) {
        return diferencias.length ? Math.min(...diferencias) : null;
    }
}
