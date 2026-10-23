'use strict';

// ================================================================
// CLASE: EstadoJuego — lo que el jugador eligió y que comparten las
// pantallas: nombre, color y tipo de carro, control y modelos de timón
// y velocímetro, pista, si juega solo y la partida 2D en curso.
// Aplicacion crea una sola instancia y se la pasa a los controladores.
// Los datos son privados; cada uno se lee y se cambia por su propiedad.
// ================================================================
class EstadoJuego {
    #nombre            = 'Jugador';
    #color             = '#ef4444';
    #control           = 'botones';
    #timonModelo       = 0;
    #velocimetroModelo = 0;
    #modoSolo          = true;
    #tipoAuto          = 'deportivo';
    #pista             = 'ciudad';
    #juego             = null;

    get nombre()            { return this.#nombre; }
    set nombre(valor)       { this.#nombre = valor; }

    get color()             { return this.#color; }
    set color(valor)        { this.#color = valor; }

    get control()           { return this.#control; }
    set control(valor)      { this.#control = valor; }

    get timonModelo()       { return this.#timonModelo; }
    set timonModelo(valor)  { this.#timonModelo = valor; }

    get velocimetroModelo()      { return this.#velocimetroModelo; }
    set velocimetroModelo(valor) { this.#velocimetroModelo = valor; }

    get modoSolo()          { return this.#modoSolo; }
    set modoSolo(valor)     { this.#modoSolo = valor; }

    get tipoAuto()          { return this.#tipoAuto; }
    set tipoAuto(valor)     { this.#tipoAuto = valor; }

    get pista()             { return this.#pista; }
    set pista(valor)        { this.#pista = valor; }

    // Partida 2D en curso (Juego) o null
    get juego()             { return this.#juego; }
    set juego(valor)        { this.#juego = valor; }
}
