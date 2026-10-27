'use strict';

// ================================================================
// CLASE: ControladorPrepararCarrera — pantalla "Preparar carrera" de
// Jugar Solo (PRD 018, D1). Muestra para elegir el modo, la pista, cuántos
// rivales y la dificultad, con la última elección marcada (D5). "¡Correr!"
// guarda la elección y pide a Aplicacion que arranque la carrera; "Volver"
// regresa a Inicio. Cada toque se recuerda enseguida, aunque no se corra.
// En Contrarreloj no se muestran rivales ni dificultad.
// Debajo de la pista elegida se ve su récord (PRD 020).
// Las opciones salen del modelo (CatalogoCarrera y registroPistas): la
// pantalla solo las muestra y guarda lo elegido en EstadoJuego.
// ================================================================
class ControladorPrepararCarrera extends ControladorPantalla {
    #estado       = null;
    #preferencias = null;   // PreferenciasCarrera
    #alCorrer     = null;   // Aplicacion crea y guarda el ControladorCarreraSolo
    #audio        = null;   // AudioJuego (PRD 022): "¡Correr!" es el toque que lo despierta

    constructor(estado, navegar, preferencias, alCorrer, audio = null) {
        super(navegar);
        this.#estado       = estado;
        this.#preferencias = preferencias;
        this.#alCorrer     = alCorrer;
        this.#audio        = audio;
    }

    iniciar() {
        // Los botones 🔊/🔇 de esta pantalla y de la carrera muestran el mismo estado (PRD 022)
        if (this.#audio) new window.BotonSonido(document.querySelectorAll('.btn-sonido'), this.#audio);
        document.getElementById('btn-correr').addEventListener('click', () => {
            this.#audio?.despertar();
            this.#preferencias.guardar(this.#estado);
            this.#alCorrer?.();
        });
        document.getElementById('btn-volver-preparar').addEventListener('click', () => this.irA('pantalla-inicio'));
    }

    // Cada vez que se abre la pantalla: las opciones con la elección actual marcada
    mostrar() {
        const eleccion = this.#estado.eleccion ?? this.#preferencias.cargar(this.#estado);
        const catalogo = this.#preferencias.catalogo;
        this.#opciones('opciones-modo', catalogo.modos.map(m => [m.clave, m.nombre]), eleccion.modo.clave,
            clave => { eleccion.modo = catalogo.modo(clave); });
        const registro = window.registroPistas;
        this.#opciones('opciones-pista', (registro?.claves ?? []).map(c => [c, registro.obtener(c).nombre]), this.#estado.pista,
            clave => { this.#estado.pista = clave; this.#mostrarRecord(); });
        const cantidades = Array.from({ length: eleccion.maxRivales }, (_, i) => [String(i + 1), String(i + 1)]);
        this.#opciones('opciones-rivales', cantidades, String(eleccion.rivales),
            clave => { eleccion.rivales = Number(clave); });
        this.#opciones('opciones-dificultad', catalogo.dificultades.map(d => [d.clave, d.nombre]), eleccion.dificultad.clave,
            clave => { eleccion.dificultad = catalogo.dificultad(clave); });
        this.#mostrarSegunModo();
        this.#mostrarRecord();
    }

    // El récord de la pista elegida, debajo de las pistas (PRD 020, D4)
    #mostrarRecord() {
        const record = new window.RegistroRecords().obtener(this.#estado.pista);
        document.getElementById('record-pista').textContent = new window.TextoRecordPista().texto(record);
    }

    // Un botón por opción; al tocarlo queda marcado y se guarda en el estado
    #opciones(idContenedor, opciones, elegida, alElegir) {
        const contenedor = document.getElementById(idContenedor);
        contenedor.replaceChildren();
        for (const [clave, texto] of opciones) {
            const boton = document.createElement('button');
            boton.className = 'opcion-carrera' + (clave === elegida ? ' sel' : '');
            boton.dataset.clave = clave;
            boton.textContent = texto;
            boton.addEventListener('click', () => {
                contenedor.querySelectorAll('.opcion-carrera').forEach(b => b.classList.toggle('sel', b === boton));
                alElegir(clave);
                this.#preferencias.guardar(this.#estado);
                this.#mostrarSegunModo();
            });
            contenedor.appendChild(boton);
        }
    }

    #mostrarSegunModo() {
        const conRivales = this.#estado.eleccion?.hayRivales ?? true;
        for (const id of ['campo-rivales', 'campo-dificultad']) {
            document.getElementById(id).style.display = conRivales ? '' : 'none';
        }
    }
}
