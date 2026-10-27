'use strict';
try {

// ================================================================
// VIEW — EstiloControlesCarrera: lleva a los controles de la carrera
// (#ctrl-timon) las medidas del diseño vertical u horizontal (PRD 016,
// D5 y D9) como variables CSS: lado y separación de ACEL/FRENO, si van
// apilados o lado a lado (FRENO a la izquierda) y cuánto hay que arrastrar
// para el giro máximo. Con ellas el CSS acomoda los pedales y el timón
// sabe su recorrido. También le da a ACEL y FRENO su RespuestaToque y,
// si se lo pasan, el estilo de pedales elegido (PRD 021, D1 y D7: solo en
// Jugar Solo, dentro de la misma caja). quitar() borra todo, para que las
// otras pantallas queden como siempre.
// ================================================================
class EstiloControlesCarrera {
    static #VARIABLES = ['--carrera-lado-pedal', '--carrera-separacion-pedales', '--carrera-direccion-pedales', '--carrera-recorrido-giro'];

    #controles;
    #respuesta;
    #estiloPedales = null;   // EstiloPedales (PRD 021), si se pidió uno

    // clavePedales: la clave del estilo elegido (la pasa el controlador desde el estado)
    constructor(documento = document, clavePedales = null) {
        this.#controles = documento.getElementById('ctrl-timon');
        const pedales = [documento.getElementById('btn-acelerar'), documento.getElementById('btn-freno')];
        this.#respuesta = new window.RespuestaToque(pedales);
        if (clavePedales && window.RegistroEstilosPedales) {
            this.#estiloPedales = new window.RegistroEstilosPedales().estilo(clavePedales);
            this.#estiloPedales.aplicarA(pedales);
        }
    }

    aplicar(diseno) {
        const estilo = this.#controles?.style;
        if (!estilo) return;
        estilo.setProperty('--carrera-lado-pedal', diseno.ladoPedal + 'px');
        estilo.setProperty('--carrera-separacion-pedales', diseno.separacionPedales + 'px');
        estilo.setProperty('--carrera-direccion-pedales', diseno.pedalesApilados ? 'column' : 'row-reverse');
        estilo.setProperty('--carrera-recorrido-giro', String(diseno.recorridoGiro(window.innerWidth)));
    }

    quitar() {
        for (const v of EstiloControlesCarrera.#VARIABLES) this.#controles?.style.removeProperty(v);
        this.#respuesta.destruir();
        this.#estiloPedales?.quitar();
        this.#estiloPedales = null;
    }
}

window.EstiloControlesCarrera = EstiloControlesCarrera;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[estilo_controles_carrera.js] ' + e.message);
    console.error('[estilo_controles_carrera.js]', e);
}
