'use strict';

// ================================================================
// MODEL — PilotoPC: decide cómo maneja un rival de la PC (PRD 013, D6).
// Sale del piloto de pruebas (pruebas/modelo/piloto_automatico.cjs):
// mira un punto adelante en la pista, gira hacia él y frena antes de
// las curvas. Encima suma lo humano (D3): una línea que varía un poco,
// ruido en el volante y errores naturales al azar (abrirse en la curva,
// frenar tarde y salirse al pasto). Todo el azar sale de AzarSemilla.
//
// Decide en CADA paso de 1/60 s: solo escribe carro.entradaAcel
// (-1, 0 o 1: el pedal es todo o nada) y carro.entradaDireccion (-1..1).
// Nunca toca la física: usa el mismo Carro que el jugador.
//
// Cada personalidad es una subclase que cambia los getters de abajo.
// ================================================================
export class PilotoPC {
    static #PASOS_POR_SEGUNDO = 60;
    static #CURVA_MEDIA       = 0.3;   // giro (rad) en la distancia de freno: hay curva
    static #VOLANTE_CURVA     = 0.8;   // parte del volante que usa en curva (resto: corregir)
    static #METROS_CURVATURA  = 4;     // medio tramo para medir cuánto curva la pista
    static #HOLGURA_FRENO     = 0.02;  // entre soltar el pedal y frenar
    static #PASOS_MIRA        = 12;    // mira más lejos cuanto más rápido va
    static #CURVA_TOPE        = 1.1;   // × velocidad en curva: lo máximo que arriesga
    static #ABRIRSE_METROS    = 2.4;   // hacia el borde del asfalto, sin llegar a las flechas
    static #TOPE_LINEA        = 2.6;   // metros del centro: más afuera roza flechas y postes
    static #PASTO_METROS      = 4.9;   // por dentro de la curva, pasado el piano: pasto
                                       // (por fuera están las flechas: no las cruza)
    static #MIRA_OTROS        = 18;    // metros adelante en que mira a los otros carros
    static #CERCA_OTRO        = 8;     // metros: tan cerca, no lo empuja
    static #ANCHO_CHOQUE      = 2.3;   // metros de costado: más cerca, están en la misma línea
    static #ANCHO_PASO        = 3.0;   // metros de costado para pasar a otro
    static #HOLGURA_LADO      = 0.4;   // metros que acepta pasarse del tope al elegir lado
    static #AL_LADO           = 5;     // metros adelante o atrás: va al lado
    static #LENTO_PASO        = 0.1;   // detrás de un carro parado igual avanza para rodearlo
    static #LENTO             = 0.03;  // por debajo, el carro casi no avanza
    static #PASOS_ATASCADO    = 60;    // 1 s sin avanzar acelerando → reversa
    static #PASOS_REVERSA     = 60;
    static #GOLPE             = 0.12;  // con un error, más lento que esto: chocó y corrige
    static #MIRA_REVERSA      = 12;    // metros adelante a los que apunta al salir de reversa

    #muestras;
    #curvaturas;
    #constantesCurva = null;   // de qué carro es la tabla de velocidades de curva
    #tablaCurva      = null;
    #n;
    #porMuestra;
    #azar;
    #indice = 0;

    // Lo humano: línea, ruido y errores (contadores de pasos que quedan)
    #linea          = 0;
    #lineaObjetivo  = 0;
    #ruido          = 0;
    #enCurva        = false;
    #pasosAbrirse   = 0;
    #pasosFrenarTarde = 0;
    #pasosPasto     = 0;
    #ladoError      = 1;
    #pasosLento     = 0;
    #pasosReversa   = 0;

    // Los otros carros: hacia dónde se corre para pasar y a qué velocidad no empuja
    #desvio         = 0;
    #desvioObjetivo = 0;
    #ladoPaso       = 0;   // -1 o 1 mientras pasa a otro; 0 si no pasa a nadie
    #velocidadOtro  = Infinity;

    constructor(muestras, longitudRuta, azar) {
        if (!Array.isArray(muestras) || muestras.length < 2) {
            throw new Error('PilotoPC: se necesitan al menos 2 muestras de la ruta');
        }
        this.#muestras   = muestras;
        this.#n          = muestras.length;
        this.#porMuestra = (Number(longitudRuta) || this.#n) / this.#n;
        this.#azar       = azar;
        this.#curvaturas = this.#medirCurvaturas();
    }

    // Cuánto curva la pista en cada muestra (radianes por metro)
    #medirCurvaturas() {
        const n = this.#n, w = Math.max(1, Math.round(PilotoPC.#METROS_CURVATURA / this.#porMuestra));
        return Float64Array.from({ length: n }, (_, i) => {
            const g = this.#angulo(this.#muestras[(i + w) % n]) - this.#angulo(this.#muestras[(i - w + n) % n]);
            return Math.abs(Math.atan2(Math.sin(g), Math.cos(g))) / (2 * w * this.#porMuestra);
        });
    }

    // ── Identidad (la da cada subclase) ─────────────────────────
    get nombre()   { return 'Piloto PC'; }
    get tipoAuto() { return 'deportivo'; }
    get color()    { return 0xffffff; }

    // ── Personalidad (cada subclase sobrescribe lo que cambia) ──
    get factorCurva()       { return 1; }     // × velocidad en curva
    get factorRecta()       { return 1; }     // × velocidad máxima en recta
    get margenFreno()       { return 0.8; }   // cuánto confía en sus frenos (más = frena tarde)
    get distanciaMira()     { return 6; }     // metros adelante para girar (mínimo)
    get distanciaFreno()    { return 40; }    // metros adelante para ver curvas
    get probAbrirse()       { return 0.03; }  // por curva
    get probFrenarTarde()   { return 0.03; }  // por curva
    get probPasto()         { return 0.01; }  // por curva
    get duracionError()     { return 1.2; }   // segundos
    get ruidoVolante()      { return 0.05; }  // amplitud del ruido
    get variacionLinea()    { return 0.6; }   // metros a un lado y otro del centro

    get progreso() { return this.#indice / this.#n; }

    // ── Ubicación en la ruta ────────────────────────────────────
    // Tras mover el carro: busca la muestra más cercana cerca de la anterior
    ubicar(carro) {
        const atras    = Math.max(2, Math.ceil(10 / this.#porMuestra));
        const adelante = Math.max(4, Math.ceil(30 / this.#porMuestra));
        this.#indice = this.#masCercana(carro, this.#indice - atras, this.#indice + adelante);
    }

    // Tras ponerlo en la grilla: se ubica de cero y olvida lo humano
    reiniciar(carro) {
        this.#indice = this.#masCercana(carro, 0, this.#n - 1);
        this.#linea = this.#lineaObjetivo = this.#ruido = 0;
        this.#enCurva = false;
        this.#pasosAbrirse = this.#pasosFrenarTarde = this.#pasosPasto = 0;
        this.#pasosLento = this.#pasosReversa = 0;
        this.#desvio = this.#desvioObjetivo = this.#ladoPaso = 0;
        this.#velocidadOtro = Infinity;
    }

    #masCercana(carro, desde, hasta) {
        const n = this.#n;
        let mejor = this.#indice, mejorD = Infinity;
        for (let k = desde; k <= hasta; k++) {
            const i = ((k % n) + n) % n;
            const m = this.#muestras[i];
            const d = (m.x - carro.px) ** 2 + (m.z - carro.pz) ** 2;
            if (d < mejorD) { mejorD = d; mejor = i; }
        }
        return mejor;
    }

    // ── Decisión de un paso ─────────────────────────────────────
    // ritmo < 1 afloja; ritmo > 1 arriesga (frena más tarde en las curvas).
    // otros: los Carro de los demás (opcional), para pasarlos sin empujarlos.
    decidir(carro, ritmo = 1, otros = []) {
        const r    = Math.max(0.5, Math.min(1.5, Number(ritmo) || 1));
        const giro = this.#giroAdelante();
        this.#sortearErrores(giro);
        this.#moverLinea();
        this.#mirarOtros(carro, otros);
        this.#corregirSiChoco(carro);
        if (this.#manejarAtasco(carro)) return;
        this.#girar(carro);
        this.#acelerar(carro, r);
        this.#descontarErrores();
    }

    // Cuánto gira la pista (con signo) en la distancia de freno
    #giroAdelante() {
        const pasos = Math.max(1, Math.round(this.distanciaFreno / this.#porMuestra));
        const aqui  = this.#muestras[this.#indice];
        const lejos = this.#muestras[(this.#indice + pasos) % this.#n];
        const g = this.#angulo(lejos) - this.#angulo(aqui);
        return Math.atan2(Math.sin(g), Math.cos(g));
    }

    #angulo(m) { return m.angulo ?? m.angle ?? 0; }

    // Al entrar a cada curva tira los dados de los errores naturales
    #sortearErrores(giro) {
        const enCurva = Math.abs(giro) > PilotoPC.#CURVA_MEDIA;
        if (enCurva && !this.#enCurva && !this.#hayError) {
            const pasos = Math.round(this.duracionError * PilotoPC.#PASOS_POR_SEGUNDO * this.#azar.entre(0.7, 1.3));
            this.#ladoError = -Math.sign(giro) || 1;   // hacia afuera de la curva
            const dado = this.#azar.siguiente();
            const pA = this.probAbrirse, pF = this.probFrenarTarde, pP = this.probPasto;
            if (dado < pP)                 this.#pasosPasto       = pasos;
            else if (dado < pP + pA)       this.#pasosAbrirse     = pasos;
            else if (dado < pP + pA + pF)  this.#pasosFrenarTarde = pasos;
        }
        this.#enCurva = enCurva;
    }

    get #hayError() { return this.#pasosAbrirse > 0 || this.#pasosFrenarTarde > 0 || this.#pasosPasto > 0; }

    // Por qué lado pasa: el que ya eligió (no cambia a cada rato); si no
    // eligió, por donde ya está, salvo que de ese lado no haya lugar
    #elegirLadoPaso(propio, lateralOtro, tope) {
        if (this.#ladoPaso === 0) {
            let lado = propio >= lateralOtro ? 1 : -1;
            if (Math.abs(lateralOtro + lado * PilotoPC.#ANCHO_PASO) > tope + PilotoPC.#HOLGURA_LADO) lado = -lado;
            this.#ladoPaso = lado;
        }
        return this.#ladoPaso;
    }

    // Si el error lo llevó a chocar (quedó casi parado), corrige enseguida
    #corregirSiChoco(carro) {
        if (this.#hayError && Math.abs(carro.velocidad) < PilotoPC.#GOLPE) {
            this.#pasosAbrirse = this.#pasosFrenarTarde = this.#pasosPasto = 0;
        }
    }

    #descontarErrores() {
        if (this.#pasosAbrirse > 0)     this.#pasosAbrirse--;
        if (this.#pasosFrenarTarde > 0) this.#pasosFrenarTarde--;
        if (this.#pasosPasto > 0)       this.#pasosPasto--;
    }

    // La línea elegida cambia de a poco cada algunos segundos
    #moverLinea() {
        if (this.#azar.siguiente() < 1 / (3 * PilotoPC.#PASOS_POR_SEGUNDO)) {
            this.#lineaObjetivo = this.#azar.entre(-1, 1) * this.variacionLinea;
        }
        this.#linea += (this.#lineaObjetivo - this.#linea) * 0.01;
        this.#ruido  = this.#ruido * 0.95 + this.#azar.entre(-1, 1) * this.ruidoVolante * 0.3;
    }

    // Los otros carros: si uno va al lado, se aleja de él; si uno va
    // adelante en su línea, se corre al costado con más lugar para pasarlo
    // y, si está muy cerca, no va más rápido que él (no lo empuja)
    #mirarOtros(carro, otros) {
        const m = this.#muestras[this.#indice], a = this.#angulo(m);
        const fx = Math.sin(a), fz = Math.cos(a), sx = Math.cos(a), sz = -Math.sin(a);
        const propio = (carro.px - m.x) * sx + (carro.pz - m.z) * sz;
        let masCerca = PilotoPC.#MIRA_OTROS, lateralOtro = null, alLado = null, velocidadOtro = Infinity;
        for (const otro of otros ?? []) {
            if (!otro || otro === carro) continue;
            const delante = (otro.px - carro.px) * fx + (otro.pz - carro.pz) * fz;
            const lateral = (otro.px - m.x) * sx + (otro.pz - m.z) * sz;
            const cerca   = Math.abs(lateral - propio) <= PilotoPC.#ANCHO_CHOQUE;
            if (Math.abs(delante) < PilotoPC.#AL_LADO && Math.abs(lateral - propio) < PilotoPC.#ANCHO_PASO) {
                alLado = lateral;
                continue;
            }
            if (delante <= 0 || delante >= masCerca || !cerca || otro.velocidad > carro.velocidad + 0.02) continue;
            masCerca = delante; lateralOtro = lateral;
            velocidadOtro = delante < PilotoPC.#CERCA_OTRO ? Math.max(PilotoPC.#LENTO_PASO, otro.velocidad) : Infinity;
        }
        this.#velocidadOtro = velocidadOtro;
        const tope = PilotoPC.#TOPE_LINEA;
        if (alLado !== null) {
            const lado = alLado > propio ? -1 : 1;
            this.#desvioObjetivo = Math.max(-tope, Math.min(tope, alLado + lado * PilotoPC.#ANCHO_PASO)) - this.#linea;
        } else if (lateralOtro !== null) {
            const lado = this.#elegirLadoPaso(propio, lateralOtro, tope);
            this.#desvioObjetivo = Math.max(-tope, Math.min(tope, lateralOtro + lado * PilotoPC.#ANCHO_PASO)) - this.#linea;
        } else {
            this.#ladoPaso = 0;
            this.#desvioObjetivo = 0;
        }
        this.#desvio += (this.#desvioObjetivo - this.#desvio) * 0.04;
    }

    // Si acelerando no avanza (contra un árbol), retrocede un poco
    #manejarAtasco(carro) {
        if (this.#pasosReversa > 0) {
            this.#pasosReversa--;
            carro.entradaAcel = -1;
            // En reversa el volante gira al revés: así la trompa vuelve hacia la pista
            const [x, z] = this.#objetivo(0, PilotoPC.#MIRA_REVERSA);
            const error = Math.atan2(x - carro.px, z - carro.pz) - carro.rotY;
            carro.entradaDireccion = Math.max(-1, Math.min(1, Math.atan2(Math.sin(error), Math.cos(error)) * 4));
            return true;
        }
        this.#pasosLento = Math.abs(carro.velocidad) < PilotoPC.#LENTO ? this.#pasosLento + 1 : 0;
        if (this.#pasosLento > PilotoPC.#PASOS_ATASCADO) {
            this.#pasosLento = 0;
            this.#pasosReversa = PilotoPC.#PASOS_REVERSA;
        }
        return false;
    }

    // Punto adelante, corrido a un lado por la línea y por los errores
    #objetivo(desplazamiento, mira = this.distanciaMira) {
        const pasos = Math.max(1, Math.round(mira / this.#porMuestra));
        const m = this.#muestras[(this.#indice + pasos) % this.#n];
        const a = this.#angulo(m);
        return [m.x + Math.cos(a) * desplazamiento, m.z - Math.sin(a) * desplazamiento];
    }

    // Persecución pura: la curvatura que lleva al punto, dividida por lo
    // que el carro puede girar a esta velocidad
    #direccionHacia(carro, [x, z]) {
        const dx = x - carro.px, dz = z - carro.pz;
        let error = Math.atan2(dx, dz) - carro.rotY;
        error = Math.atan2(Math.sin(error), Math.cos(error));
        const v = Math.abs(carro.velocidad);
        const giroMax = this.#giroMaximo(carro.constantes, v);
        if (giroMax < 1e-6) return Math.max(-1, Math.min(1, -error * 4));
        const curvatura = 2 * Math.sin(error) / Math.max(1, Math.hypot(dx, dz));
        return Math.max(-1, Math.min(1, -curvatura * v / giroMax * Math.sign(carro.velocidad || 1)));
    }

    // Radianes por paso que gira el carro con el volante a fondo (como Carro)
    #giroMaximo(c, v) {
        if (v <= 0.005) return 0;
        const u = v / c.velMaxAdelante;
        return c.direccion * Math.min(1, v / c.velGiroPleno) / (1 + c.subviraje * u * u);
    }

    // La velocidad de curva de cada muestra, calculada una vez por carro
    #velocidadesCurva(c) {
        if (this.#constantesCurva !== c) {
            this.#constantesCurva = c;
            this.#tablaCurva = Float64Array.from(this.#curvaturas, k => this.#velocidadEnCurva(c, k));
        }
        return this.#tablaCurva;
    }

    // Velocidad más alta con la que el carro puede seguir esa curvatura
    #velocidadEnCurva(c, curvatura) {
        let lento = 0, rapido = c.velMaxAdelante;
        for (let k = 0; k < 14; k++) {
            const v = (lento + rapido) / 2;
            if (v * curvatura <= this.#giroMaximo(c, v) * PilotoPC.#VOLANTE_CURVA) lento = v; else rapido = v;
        }
        return lento;
    }

    #girar(carro) {
        const tope = PilotoPC.#TOPE_LINEA;
        let lado = Math.max(-tope, Math.min(tope, this.#linea + this.#desvio));
        if (this.#pasosAbrirse > 0) lado = Math.max(-tope, Math.min(tope, lado + this.#ladoError * PilotoPC.#ABRIRSE_METROS));
        if (this.#pasosPasto > 0)   lado = -this.#ladoError * PilotoPC.#PASTO_METROS;
        // Lejos de la pista mira más adelante, así vuelve en diagonal sin pasarse
        const aqui = this.#muestras[this.#indice];
        const fuera = Math.hypot(aqui.x - carro.px, aqui.z - carro.pz);
        const mira = Math.max(this.distanciaMira, Math.abs(carro.velocidad) * PilotoPC.#PASOS_MIRA, fuera * 2.5);
        const volante = this.#direccionHacia(carro, this.#objetivo(lado, mira)) + this.#ruido;
        carro.entradaDireccion = Math.max(-1, Math.min(1, volante));
    }

    // La velocidad que todavía permite frenar a tiempo para cada curva que viene
    #velocidadLimite(carro, ritmo) {
        const c = carro.constantes;
        const tarde   = this.#pasosFrenarTarde > 0;
        // Con ritmo > 1 arriesga en las curvas, pero sin pedirle al carro
        // más volante del que tiene (eso lo sacaría de la pista)
        const arriesga = 1 + Math.max(0, ritmo - 1) * 0.5;
        const curva   = Math.min(PilotoPC.#CURVA_TOPE, this.factorCurva * arriesga) * Math.min(1, ritmo) * (tarde ? 1.08 : 1);
        const frenada = c.freno / c.masa * Math.min(1, this.margenFreno * arriesga) * (tarde ? 1.6 : 1);
        const salto   = Math.max(1, Math.round(2 / this.#porMuestra));
        const total   = Math.round(this.distanciaFreno / this.#porMuestra);
        let limite = c.velMaxAdelante * Math.min(1, this.factorRecta * ritmo);
        for (let k = 0; k <= total; k += salto) {
            const curvatura = this.#curvaturas[(this.#indice + k) % this.#n];
            if (curvatura < 1e-4) continue;
            const v = this.#velocidadesCurva(c)[(this.#indice + k) % this.#n] * curva;
            limite = Math.min(limite, Math.sqrt(v * v + 2 * frenada * k * this.#porMuestra));
        }
        return limite;
    }

    // Pedal todo o nada
    #acelerar(carro, ritmo) {
        const limite = Math.min(this.#velocidadLimite(carro, ritmo), this.#velocidadOtro);
        if (carro.velocidad > limite + PilotoPC.#HOLGURA_FRENO) carro.entradaAcel = -1;
        else if (carro.velocidad > limite)                      carro.entradaAcel = 0;
        else                                                    carro.entradaAcel = 1;
    }
}
