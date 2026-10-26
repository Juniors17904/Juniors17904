'use strict';
try {

// ================================================================
// CLASE: ControladorCarreraSolo — Controlador de la Carrera Solo 3D
// Orquesta VisorCarreraSolo (vista 3D), CarreraVueltas y Cronometro
// (modelo) y HudCarrera (vista 2D). Con los rivales de la PC (PRD 013) que
// pide la elección (PRD 018): arranca sus cronómetros en ¡YA!, muestra la
// posición ("2.º/5") y la tabla final, que se completa a medida que llegan
// los rivales (D5). En Contrarreloj no hay rivales: ni posición ni tabla. Gestiona la cuenta regresiva,
// el ciclo por frame (callback del visor), el resultado y las
// acciones Revancha / Menú. No tiene física ni dibujo directo y
// no tiene RAF propio: el único RAF es el del visor.
// ================================================================
class ControladorCarreraSolo {
    static #PISTA_RESPALDO      = 'ciudad';
    static #MUESTRAS_RUTA       = 400;
    static #TOTAL_VUELTAS       = 3;
    static #INTERVALO_CUENTA_MS = 900;
    static #REINTENTO_MS        = 150;
    static #LIMITE_CARGA_MS     = 6000;
    static #NOMBRE_JUGADOR      = 'Tú';

    // Estados de la carrera (constantes internas, no un objeto global)
    static #ESTADO_PREPARANDO = 'preparando';
    static #ESTADO_CUENTA     = 'cuenta';
    static #ESTADO_CORRIENDO  = 'corriendo';
    static #ESTADO_TERMINADA  = 'terminada';

    // Eventos que devuelve CarreraVueltas.actualizar
    static #EVENTO_VUELTA = 'vuelta';
    static #EVENTO_META   = 'meta';

    #estado          = null;   // estado compartido de Aplicacion (solo lectura)
    #vistaConduccion = null;
    #alSalir         = null;

    #visor      = null;
    #carrera    = null;
    #cronometro = null;
    #hud        = null;
    #mapa       = null;   // MinimapaCarrera (PRD 017)
    #adaptadorDiseno = null;   // AdaptadorDisenoCarrera (PRD 015)

    #estadoCarrera   = ControladorCarreraSolo.#ESTADO_PREPARANDO;
    #detenido        = false;
    #iniciado        = false;
    #idReintento     = null;
    #idLimiteCarga   = null;
    #temporizadores  = [];
    #llegadasEnTabla = -1;     // carros terminados la última vez que se dibujó la tabla

    constructor(estado, vistaConduccion, alSalir) {
        this.#estado          = estado ?? null;
        this.#vistaConduccion = vistaConduccion ?? null;
        this.#alSalir         = typeof alSalir === 'function' ? alSalir : null;
    }

    // ── Arranque (RF-01, RF-03, RF-13) ──────────────────────────
    iniciar() {
        if (this.#detenido || this.#iniciado) return;

        // RF-13: un único plazo de 6 s desde el primer intento cubre
        // la carga del módulo del visor y la del GLB del carro juntas
        if (this.#idLimiteCarga === null) {
            this.#idLimiteCarga = setTimeout(() => {
                this.#idLimiteCarga = null;
                if (this.#detenido) return;
                this.#fallarCarga(this.#iniciado
                    ? 'el carro no cargó en 6 s'
                    : 'el módulo VisorCarreraSolo no cargó en 6 s');
            }, ControladorCarreraSolo.#LIMITE_CARGA_MS);
        }

        if (typeof window.VisorCarreraSolo !== 'function') {
            this.#idReintento = setTimeout(() => {
                this.#idReintento = null;
                if (this.#detenido) return;
                this.iniciar();
            }, ControladorCarreraSolo.#REINTENTO_MS);
            return;
        }

        this.#iniciado = true;
        let carga;
        try {
            carga = this.#crearPiezas();
        } catch (e) {
            this.#fallarCarga(e?.message ?? String(e));
            return;
        }
        // La cuenta arranca cuando el carro ya está en escena (cargar() nunca rechaza:
        // registra su propio error), así el 3-2-1 no se pierde mientras carga el GLB
        Promise.resolve(carga).finally(() => {
            if (this.#detenido) return;
            this.#cancelarLimiteCarga();
            this.#lanzarCuenta();
        });
    }

    // ── Liberación (RF-12) — idempotente ────────────────────────
    detener() {
        if (this.#detenido) return;
        this.#detenido = true;

        if (this.#idReintento !== null) clearTimeout(this.#idReintento);
        this.#idReintento = null;
        this.#cancelarLimiteCarga();
        this.#cancelarTemporizadores();

        this.#adaptadorDiseno?.destruir();
        this.#adaptadorDiseno = null;
        this.#vistaConduccion?.ocultarOverlay();
        this.#vistaConduccion?.destruirControl();
        this.#visor?.detener();
        this.#hud?.destruir();
        this.#mapa?.destruir();

        this.#visor      = null;
        this.#carrera    = null;
        this.#cronometro = null;
        this.#hud        = null;
        this.#mapa       = null;
        this.#estadoCarrera = ControladorCarreraSolo.#ESTADO_TERMINADA;
    }

    // ── Privados: construcción ──────────────────────────────────
    #crearPiezas() {
        // Diseño vertical u horizontal según la forma de la pantalla; sigue al girar (PRD 015)
        this.#adaptadorDiseno = new window.AdaptadorDisenoCarrera(document.getElementById('pantalla-carrera-solo'));
        const pista = this.#resolverPista();
        this.#visor = new window.VisorCarreraSolo(
            document.getElementById('canvas-carrera-solo'), pista, this.#estado?.eleccion ?? null
        );
        this.#carrera = new window.CarreraVueltas(
            this.#visor.muestrasRuta(ControladorCarreraSolo.#MUESTRAS_RUTA),
            ControladorCarreraSolo.#TOTAL_VUELTAS
        );
        this.#cronometro = new window.Cronometro();
        this.#hud = new window.HudCarrera(
            document.getElementById('canvas-hud-carrera-solo'),
            document.getElementById('cuenta-carrera-solo'),
            document.getElementById('resultado-carrera-solo')
        );

        this.#mapa = new window.MinimapaCarrera(document.getElementById('minimapa-carrera-solo'), pista);

        const timonModelo = this.#estado?.timonModelo ?? 0;
        this.#vistaConduccion?.aplicarA(this.#visor, timonModelo);
        this.#vistaConduccion?.mostrarOverlay();

        this.#visor.congelar(true);
        this.#visor.alActualizar(() => this.#alFrame());
        const carga = this.#visor.cargar(this.#estado?.tipoAuto ?? 'deportivo', this.#estado?.color ?? '#ef4444');
        this.#ubicarEnSalida();
        this.#visor.iniciar();
        return carga;
    }

    #resolverPista() {
        const registro = window.registroPistas;
        const clave    = this.#estado?.pista;
        const pista    = clave ? registro?.obtener(clave) : null;
        if (pista) return pista;
        if (clave) {
            this.#registrarError('pista "' + clave + '" no existe, se usa "' +
                ControladorCarreraSolo.#PISTA_RESPALDO + '"');
        }
        const respaldo = registro?.obtener(ControladorCarreraSolo.#PISTA_RESPALDO);
        if (!respaldo) throw new Error('no existe la pista de respaldo');
        return respaldo;
    }

    #fallarCarga(motivo) {
        this.#registrarError('no se pudo iniciar la carrera: ' + motivo);
        if (typeof GestorAlertas !== 'undefined') {
            GestorAlertas.mostrar('No se pudo cargar la carrera 3D', 'error');
        }
        const alSalir = this.#alSalir;
        this.detener();
        alSalir?.();
    }

    #cancelarLimiteCarga() {
        if (this.#idLimiteCarga !== null) clearTimeout(this.#idLimiteCarga);
        this.#idLimiteCarga = null;
    }

    #registrarError(mensaje) {
        window.__modelErrors = window.__modelErrors || [];
        window.__modelErrors.push('[ControladorCarreraSolo] ' + mensaje);
        console.error('[ControladorCarreraSolo]', mensaje);
    }

    // ── Privados: cuenta regresiva (RF-04) ──────────────────────
    #lanzarCuenta() {
        if (this.#detenido) return;
        this.#cancelarTemporizadores();
        this.#estadoCarrera = ControladorCarreraSolo.#ESTADO_CUENTA;
        this.#visor.congelar(true);
        this.#visor.activarRivales(false);

        // Pasos encadenados: cada uno programa el siguiente, así un bloqueo del hilo
        // principal no dispara varios números de golpe
        const paso = ControladorCarreraSolo.#INTERVALO_CUENTA_MS;
        this.#hud.mostrarCuenta('3');
        this.#programar(() => {
            this.#hud.mostrarCuenta('2');
            this.#programar(() => {
                this.#hud.mostrarCuenta('1');
                this.#programar(() => {
                    this.#arrancar();
                    this.#programar(() => this.#hud.ocultarCuenta(), paso);
                }, paso);
            }, paso);
        }, paso);
    }

    #arrancar() {
        this.#hud.mostrarCuenta('¡YA!');
        this.#visor.congelar(false);
        this.#cronometro.iniciar();
        const rivales = this.#visor.rivales;
        rivales?.seguirJugador(this.#carrera);
        rivales?.iniciar();
        this.#visor.activarRivales(true);
        this.#estadoCarrera = ControladorCarreraSolo.#ESTADO_CORRIENDO;
    }

    #programar(fn, ms) {
        const id = setTimeout(() => {
            this.#temporizadores = this.#temporizadores.filter(t => t !== id);
            if (this.#detenido) return;
            fn();
        }, ms);
        this.#temporizadores.push(id);
    }

    #cancelarTemporizadores() {
        for (const id of this.#temporizadores) clearTimeout(id);
        this.#temporizadores = [];
    }

    // ── Privados: bucle por frame (RF-05, RF-06, RF-07) ─────────
    #alFrame() {
        if (this.#detenido || !this.#visor) return;
        const visor = this.#visor;
        const carrera = this.#carrera;
        const cronometro = this.#cronometro;

        if (this.#estadoCarrera === ControladorCarreraSolo.#ESTADO_CORRIENDO) {
            const evento = carrera.actualizar(visor.px, visor.pz);
            if (evento === ControladorCarreraSolo.#EVENTO_VUELTA) {
                cronometro.marcarVuelta();
            } else if (evento === ControladorCarreraSolo.#EVENTO_META) {
                cronometro.marcarVuelta();
                cronometro.detener();
                this.#terminar();
            }
        }

        visor.aplicarSuperficie(carrera.superficie);

        const filas = this.#filasPosicion();
        if (this.#estadoCarrera === ControladorCarreraSolo.#ESTADO_TERMINADA) this.#refrescarTabla(filas);

        const base = visor.velocidadMaxBase;
        const fraccionVel = base > 0 ? Math.min(1, Math.abs(visor.velocidad) / base) : 0;
        this.#hud?.dibujar(
            carrera.vueltaActual,
            carrera.totalVueltas,
            cronometro.formatear(cronometro.tiempoTotalMs),
            fraccionVel,
            this.#estado?.velocimetroModelo ?? 0,
            this.#textoPosicion(filas)
        );
        this.#dibujarMapa();
    }

    // Minimapa (PRD 017): el lugar real del jugador y de cada rival, con el color de su auto
    #dibujarMapa() {
        const mapa = this.#mapa, visor = this.#visor;
        if (!mapa) return;
        (visor.rivales?.rivales ?? []).forEach((r, i) => mapa.ubicar(i + 1, r.carro.px, r.carro.pz, r.piloto.color));
        mapa.ubicar(0, visor.px, visor.pz, this.#estado?.color ?? '#ef4444', true);
        mapa.actualizar();
    }

    // ── Privados: posiciones con los rivales (PRD 013, D5) ──────
    // La CarreraVueltas del jugador se ubica en su lugar de la grilla (detrás
    // de la meta), así su posición se compara bien con la de los rivales
    #ubicarEnSalida() {
        this.#carrera.actualizar(this.#visor.px, this.#visor.pz);
        this.#visor.rivales?.seguirJugador(this.#carrera);
    }

    #filasPosicion() {
        const rivales = this.#visor?.rivales;
        if (!rivales) return [];
        const carrera = this.#carrera, cronometro = this.#cronometro;
        // El jugador terminó cuando su carrera llegó a la meta (el controlador ya la cerró)
        const terminado = carrera.terminada || this.#estadoCarrera === ControladorCarreraSolo.#ESTADO_TERMINADA;
        return rivales.posiciones(ControladorCarreraSolo.#NOMBRE_JUGADOR,
            terminado, cronometro.tiempoTotalMs);
    }

    #textoPosicion(filas) {
        const fila = filas.find(f => f.esJugador);
        return fila ? fila.puesto + '.º/' + filas.length : '';
    }

    // La tabla final se rehace solo cuando llega otro carro
    #refrescarTabla(filas) {
        const llegadas = filas.filter(f => f.terminado).length;
        if (llegadas === this.#llegadasEnTabla) return;
        this.#llegadasEnTabla = llegadas;
        this.#hud?.actualizarTabla(filas);
    }

    // ── Privados: fin de carrera (RF-10) ────────────────────────
    #terminar() {
        this.#estadoCarrera = ControladorCarreraSolo.#ESTADO_TERMINADA;
        this.#cancelarTemporizadores();
        this.#hud.ocultarCuenta();
        this.#visor.congelar(true);
        this.#visor.rivales?.jugadorLlego();
        this.#vistaConduccion?.ocultarOverlay();

        const cronometro = this.#cronometro;
        const textoTotal = cronometro.formatear(cronometro.tiempoTotalMs);
        const mejor      = cronometro.mejorVueltaMs;
        const textoMejor = mejor === null ? '--' : cronometro.formatear(mejor);
        const filas = this.#filasPosicion();
        this.#llegadasEnTabla = filas.filter(f => f.terminado).length;
        this.#hud.mostrarResultado(textoTotal, textoMejor,
            () => this.#revancha(),
            () => this.#irAlMenu(),
            filas);
    }

    // ── Privados: Revancha (RF-11) ──────────────────────────────
    #revancha() {
        if (this.#detenido) return;
        this.#hud.ocultarResultado();
        this.#carrera.reiniciar();
        this.#cronometro.reiniciar();
        this.#visor.reiniciarCarro();
        this.#visor.reiniciarRivales();
        this.#ubicarEnSalida();
        this.#llegadasEnTabla = -1;
        this.#vistaConduccion?.mostrarOverlay();
        this.#lanzarCuenta();
    }

    // ── Privados: Menú (RF-11) ──────────────────────────────────
    #irAlMenu() {
        const alSalir = this.#alSalir;
        this.detener();
        alSalir?.();
    }
}

window.ControladorCarreraSolo = ControladorCarreraSolo;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[controlador_carrera_solo.js] ' + e.message);
}
