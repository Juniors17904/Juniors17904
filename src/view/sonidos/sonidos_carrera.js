'use strict';

// ================================================================
// VIEW — SonidosCarrera: todos los sonidos de una carrera de Jugar Solo
// (PRD 022). El controlador solo la avisa:
//   - cuenta(texto): pitido de "3", "2", "1" o "¡YA!"; con "¡YA!" arranca el motor.
//   - escuchar(visor): en cada cuadro de carrera, el motor sigue la velocidad
//     y OidoCarrera dice si suenan las llantas o un golpe.
//   - meta(esRecord): calla todo y suena la fanfarria (y la campanita).
//   - reiniciar(): calla todo (nueva cuenta o Revancha).
// Si la página se oculta, el audio se pausa; vuelve solo con la carrera en
// curso (D6, RF-09). destruir() calla todo y deja de escuchar la página.
// ================================================================
class SonidosCarrera {
    #audio;
    #motor; #llantas; #cuenta; #choque; #meta;
    #oido = new window.OidoCarrera();
    #enCurso = false;
    #alCambiarVisibilidad = () => this.#cambioVisibilidad();

    constructor(audio) {
        this.#audio   = audio ?? null;
        this.#motor   = new window.SonidoMotor(audio);
        this.#llantas = new window.SonidoLlantas(audio);
        this.#cuenta  = new window.SonidoCuenta(audio);
        this.#choque  = new window.SonidoChoque(audio);
        this.#meta    = new window.SonidoMeta(audio);
        document.addEventListener('visibilitychange', this.#alCambiarVisibilidad);
        window.addEventListener('pagehide', this.#alCambiarVisibilidad);
    }

    cuenta(texto) {
        this.#audio?.despertar();
        this.#cuenta.sonar(texto);
        if (texto === '¡YA!') { this.#enCurso = true; this.#motor.sonar(0); }
    }

    escuchar(visor) {
        if (!this.#enCurso) return;
        const base = Number(visor?.velocidadMaxBase) || 0;
        this.#motor.sonar(base > 0 ? Math.abs(Number(visor.velocidad) || 0) / base : 0);
        this.#llantas.sonar(this.#oido.hayDerrape(visor));
        if (this.#oido.hayChoque(visor, performance.now())) this.#choque.sonar();
    }

    meta(esRecord) {
        this.#callarCarrera();
        this.#meta.sonar(Boolean(esRecord));
    }

    reiniciar() {
        this.#callarCarrera();
        this.#oido.reiniciar();
    }

    destruir() {
        this.#callarCarrera();
        document.removeEventListener('visibilitychange', this.#alCambiarVisibilidad);
        window.removeEventListener('pagehide', this.#alCambiarVisibilidad);
    }

    #callarCarrera() {
        this.#enCurso = false;
        this.#motor.callar();
        this.#llantas.callar();
    }

    #cambioVisibilidad() {
        if (document.hidden) this.#audio?.suspender();
        else if (this.#enCurso) this.#audio?.reanudar();
    }
}

window.SonidosCarrera = SonidosCarrera;
