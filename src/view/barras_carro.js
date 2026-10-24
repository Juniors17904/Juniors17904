'use strict';

// ================================================================
// VIEW — BarrasCarro: tres barras del garaje (velocidad, aceleración y
// agarre) del carro marcado (PRD 007, D4). Los valores salen de la
// física del carro (RegistroCarros, modelo) y se comparan con el mejor
// de los 6 modelos. No calcula física: solo la dibuja (RNF-02).
// ================================================================
class BarrasCarro {
    #contenedor;
    #registro = null;

    constructor(contenedor) {
        this.#contenedor = contenedor ?? null;
    }

    mostrar(tipo) {
        if (!this.#contenedor) return;
        const Registro = window.RegistroCarros;
        if (!Registro) { this.#contenedor.hidden = true; return; }
        this.#registro ??= new Registro();

        const todas = this.#registro.tipos.map(t => this.#registro.constantesDe(t));
        const c     = this.#registro.constantesDe(tipo);
        const mejor = medir => Math.max(...todas.map(medir));
        const empuje = x => x.aceleracion / x.masa;
        const filas = [
            ['Velocidad',   c.velMaxAdelante / mejor(x => x.velMaxAdelante)],
            ['Aceleración', empuje(c)        / mejor(empuje)],
            ['Agarre',      c.agarre         / mejor(x => x.agarre)],
        ];

        this.#contenedor.hidden = false;
        this.#contenedor.replaceChildren(...filas.map(([nombre, fraccion]) => this.#fila(nombre, fraccion)));
    }

    #fila(nombre, fraccion) {
        const fila   = document.createElement('div');
        const texto  = document.createElement('span');
        const fondo  = document.createElement('div');
        const relleno = document.createElement('div');
        fila.className    = 'barra-carro';
        texto.className   = 'barra-carro-nombre';
        fondo.className   = 'barra-carro-fondo';
        relleno.className = 'barra-carro-relleno';
        texto.textContent = nombre;
        relleno.style.width = Math.round(Math.max(0, Math.min(1, fraccion)) * 100) + '%';
        fila.dataset.valor  = fraccion.toFixed(3);
        fondo.append(relleno);
        fila.append(texto, fondo);
        return fila;
    }
}

window.BarrasCarro = BarrasCarro;
