'use strict';

// ================================================================
// CLASE: EstadoJuego — lo que el jugador eligió y que comparten las
// pantallas: nombre, color y tipo de carro, control, timón, estilo de
// pedales y velocímetro, pista y cómo quiere correr en Jugar Solo (EleccionCarrera, PRD 018).
// El timón y los pedales se guardan por su clave (PRD 021, D7); el número
// del timón para dibujarlo lo traduce CatalogoControles.
// Aplicacion crea una sola instancia y se la pasa a los controladores.
// Los datos son privados; cada uno se lee y se cambia por su propiedad.
// ================================================================
class EstadoJuego {
    #nombre            = 'Jugador';
    #color             = '#ef4444';
    #control           = 'botones';
    #catalogoControles = new window.CatalogoControles();
    #timon             = 'clasico';    // clave; la carga PreferenciasControles (PRD 021)
    #estiloPedales     = 'clasicos';   // clave; la carga PreferenciasControles (PRD 021)
    #velocimetroModelo = 0;
    #tipoAuto          = 'deportivo';
    #pista             = 'ciudad';
    #eleccion          = null;   // EleccionCarrera; la carga PreferenciasCarrera

    get nombre()            { return this.#nombre; }
    set nombre(valor)       { this.#nombre = valor; }

    get color()             { return this.#color; }
    set color(valor)        { this.#color = valor; }

    get control()           { return this.#control; }
    set control(valor)      { this.#control = valor; }

    get timon()             { return this.#timon; }
    set timon(clave)        { this.#timon = this.#catalogoControles.timonValido(clave); }

    // Lugar del timón en la lista de RenderizadorTimon (para dibujarlo)
    get timonModelo()       { return this.#catalogoControles.indiceTimon(this.#timon); }
    set timonModelo(indice) { this.#timon = this.#catalogoControles.claveTimon(indice); }

    get estiloPedales()      { return this.#estiloPedales; }
    set estiloPedales(clave) { this.#estiloPedales = this.#catalogoControles.pedalesValidos(clave); }

    get velocimetroModelo()      { return this.#velocimetroModelo; }
    set velocimetroModelo(valor) { this.#velocimetroModelo = valor; }

    get tipoAuto()          { return this.#tipoAuto; }
    set tipoAuto(valor)     { this.#tipoAuto = valor; }

    get pista()             { return this.#pista; }
    set pista(valor)        { this.#pista = valor; }

    get eleccion()          { return this.#eleccion; }
    set eleccion(valor)     { this.#eleccion = valor; }
}
