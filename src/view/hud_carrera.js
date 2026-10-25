'use strict';
try {

// ================================================================
// CLASE: HudCarrera — Vista del HUD de la Carrera Solo 3D (vertical)
// Dibuja "VUELTA X/3", la posición ("2.º/5", PRD 013), el cronómetro y el
// velocímetro en su canvas, muestra la cuenta 3-2-1/¡YA! y el panel de
// resultado con la tabla de posiciones (TablaFinalCarrera).
// Sin lógica de negocio: solo pinta lo que le pasa el controlador.
// ================================================================
class HudCarrera {
    static #ANCHO_MAX_COLUMNA = 480;
    static #ALTO_BANDA_CONTROLES = 120;
    static #RADIO_VELOCIMETRO = 40;
    static #MARGEN_VELOCIMETRO = 56;
    static #Z_INDEX_RESULTADO = '30';

    #canvas = null;
    #ctx = null;
    #capaCuenta = null;
    #panelResultado = null;
    #textoTotal = null;
    #textoMejorVuelta = null;
    #botonRevancha = null;
    #botonMenu = null;
    #contenedorTabla = null;
    #tabla = null;   // TablaFinalCarrera (se crea al primer uso)
    #ancho = 0;
    #alto = 0;
    #escala = 1;
    #resultadoActivo = false;
    #alRedimensionar = null;
    #destruido = false;

    constructor(canvas, capaCuenta, panelResultado) {
        if (!canvas || typeof canvas.getContext !== 'function') {
            throw new Error('HudCarrera: se requiere el canvas del HUD');
        }
        this.#canvas = canvas;
        this.#ctx = canvas.getContext('2d');
        this.#capaCuenta = capaCuenta ?? null;
        this.#panelResultado = panelResultado ?? null;

        this.#prepararCanvas();
        this.#prepararCapaCuenta();
        this.#prepararPanelResultado();

        this.#alRedimensionar = () => this.#dimensionar();
        window.addEventListener('resize', this.#alRedimensionar);
        this.#dimensionar();
    }

    // ── Dibujo por frame (RF-05, RF-08) ──────────────────────────
    dibujar(vuelta, totalVueltas, textoCronometro, fraccionVel, indiceVelocimetro = 0, textoPosicion = '') {
        if (this.#destruido || !this.#ctx) return;
        const ctx = this.#ctx;
        ctx.setTransform(this.#escala, 0, 0, this.#escala, 0, 0);
        ctx.clearRect(0, 0, this.#ancho, this.#alto);

        this.#dibujarBarraSuperior(ctx, vuelta, totalVueltas, textoCronometro, textoPosicion);
        this.#dibujarVelocimetro(ctx, fraccionVel, indiceVelocimetro);
    }

    // ── Cuenta regresiva (RF-04) ────────────────────────────────
    mostrarCuenta(texto) {
        if (!this.#capaCuenta) return;
        this.#capaCuenta.textContent = String(texto ?? '');
        this.#capaCuenta.style.display = 'flex';
    }

    ocultarCuenta() {
        if (!this.#capaCuenta) return;
        this.#capaCuenta.style.display = 'none';
        this.#capaCuenta.textContent = '';
    }

    // ── Panel de resultado (RF-10; tabla de posiciones, PRD 013) ──
    mostrarResultado(textoTotal, textoMejorVuelta, alRevancha, alMenu, filas = []) {
        if (!this.#panelResultado) return;
        if (this.#textoTotal) this.#textoTotal.textContent = 'TIEMPO TOTAL  ' + (textoTotal ?? '');
        if (this.#textoMejorVuelta) this.#textoMejorVuelta.textContent = 'MEJOR VUELTA  ' + (textoMejorVuelta ?? '');
        this.actualizarTabla(filas);

        this.#resultadoActivo = true;
        this.#asignarBoton(this.#botonRevancha, alRevancha);
        this.#asignarBoton(this.#botonMenu, alMenu);

        this.#panelResultado.style.display = 'flex';
        this.#marcarPantallaConResultado(true);
    }

    // Los rivales siguen corriendo tras la meta del jugador (D5): la tabla se rehace
    // con cada llegada. Sin filas, la tabla no se ve.
    actualizarTabla(filas = []) {
        const tabla = this.#obtenerTabla();
        if (!tabla) return;
        if (Array.isArray(filas) && filas.length > 0) tabla.mostrar(filas);
        else tabla.ocultar();
    }

    ocultarResultado() {
        this.#resultadoActivo = false;
        if (!this.#panelResultado) return;
        this.#tabla?.ocultar();
        this.#panelResultado.style.display = 'none';
        this.#marcarPantallaConResultado(false);
        if (this.#botonRevancha) this.#botonRevancha.onclick = null;
        if (this.#botonMenu) this.#botonMenu.onclick = null;
    }

    // La pantalla fija crea su propio contexto de apilamiento: para que el panel quede
    // sobre .ctrl-overlay (RF-10) la pantalla entera sube de nivel mientras se ve
    #marcarPantallaConResultado(activo) {
        const panel = this.#panelResultado;
        if (typeof panel?.closest !== 'function') return;
        panel.closest('.pantalla')?.classList.toggle('con-resultado', activo);
    }

    // ── Liberación ──────────────────────────────────────────────
    destruir() {
        if (this.#destruido) return;
        this.#destruido = true;
        if (this.#alRedimensionar) window.removeEventListener('resize', this.#alRedimensionar);
        this.#alRedimensionar = null;
        this.ocultarCuenta();
        this.ocultarResultado();
        if (this.#ctx) {
            this.#ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
        }
    }

    // ── Privados: preparación del DOM ───────────────────────────
    #prepararCanvas() {
        const s = this.#canvas.style;
        s.position = 'absolute';
        s.left = '0';
        s.top = '0';
        s.pointerEvents = 'none';
    }

    #prepararCapaCuenta() {
        if (!this.#capaCuenta) return;
        const s = this.#capaCuenta.style;
        s.position = 'absolute';
        s.left = '0';
        s.top = '0';
        s.width = '100%';
        s.height = '100%';
        s.alignItems = 'center';
        s.justifyContent = 'center';
        s.fontFamily = "'Arial Black', Arial, sans-serif";
        s.fontWeight = '900';
        s.fontSize = 'clamp(72px, 28vw, 140px)';
        s.color = '#ffffff';
        s.textShadow = '0 0 18px rgba(255,80,0,0.9), 0 4px 0 #000';
        s.pointerEvents = 'none';
        s.zIndex = '15';
        this.ocultarCuenta();
    }

    #prepararPanelResultado() {
        const panel = this.#panelResultado;
        if (!panel) return;
        const s = panel.style;
        s.position = 'fixed';
        s.zIndex = HudCarrera.#Z_INDEX_RESULTADO;
        s.flexDirection = 'column';
        s.alignItems = 'center';
        s.justifyContent = 'center';
        s.gap = '14px';

        this.#botonRevancha = panel.querySelector('#btn-revancha-solo');
        this.#botonMenu = panel.querySelector('#btn-menu-solo');

        // Contenedor de textos: se crea si el HTML no lo trae
        let textos = panel.querySelector('.resultado-carrera-textos');
        if (!textos) {
            textos = document.createElement('div');
            textos.className = 'resultado-carrera-textos';
            textos.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:8px;' +
                'font-family:Arial,sans-serif;font-weight:bold;color:#fff;font-size:20px;';
            const titulo = document.createElement('div');
            titulo.textContent = '¡META!';
            titulo.style.cssText = 'font-size:34px;color:#ffcc00;font-weight:900;';
            textos.appendChild(titulo);
            const primerBoton = this.#botonRevancha ?? this.#botonMenu;
            const ancla = primerBoton && primerBoton.parentNode === panel ? primerBoton : null;
            panel.insertBefore(textos, ancla ?? panel.firstChild);
        }
        this.#textoTotal = this.#obtenerLinea(textos, 'resultado-carrera-total');
        this.#textoMejorVuelta = this.#obtenerLinea(textos, 'resultado-carrera-mejor');
        this.#contenedorTabla = this.#obtenerLinea(textos, 'resultado-carrera-tabla');
        this.#contenedorTabla.style.display = 'none';

        this.ocultarResultado();
    }

    #obtenerLinea(contenedor, clase) {
        let linea = contenedor.querySelector('.' + clase);
        if (!linea) {
            linea = document.createElement('div');
            linea.className = clase;
            contenedor.appendChild(linea);
        }
        return linea;
    }

    // TablaFinalCarrera es otro script clásico: se busca al usarla, así no importa
    // el orden de carga
    #obtenerTabla() {
        if (this.#tabla) return this.#tabla;
        const Clase = window.TablaFinalCarrera;
        if (!this.#contenedorTabla || typeof Clase !== 'function') return null;
        this.#tabla = new Clase(this.#contenedorTabla);
        return this.#tabla;
    }

    #asignarBoton(boton, callback) {
        if (!boton) return;
        boton.onclick = () => {
            if (!this.#resultadoActivo) return; // un solo disparo por resultado
            this.#resultadoActivo = false;
            if (typeof callback === 'function') callback();
        };
    }

    // ── Privados: tamaño ────────────────────────────────────────
    #dimensionar() {
        if (this.#destruido) return;
        this.#ancho = Math.min(window.innerWidth, HudCarrera.#ANCHO_MAX_COLUMNA);
        this.#alto = window.innerHeight;
        this.#escala = window.devicePixelRatio || 1;
        this.#canvas.width = Math.round(this.#ancho * this.#escala);
        this.#canvas.height = Math.round(this.#alto * this.#escala);
        this.#canvas.style.width = this.#ancho + 'px';
        this.#canvas.style.height = this.#alto + 'px';
    }

    // ── Privados: dibujo ────────────────────────────────────────
    #dibujarBarraSuperior(ctx, vuelta, totalVueltas, textoCronometro, textoPosicion) {
        const ancho = this.#ancho;
        const altoBarra = 52;
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(0, 0, ancho, altoBarra);

        ctx.textBaseline = 'middle';
        ctx.font = "900 20px 'Arial Black', Arial, sans-serif";
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';

        const textoVuelta = 'VUELTA ' + (vuelta ?? 1) + '/' + (totalVueltas ?? 3);
        ctx.textAlign = 'left';
        ctx.strokeText(textoVuelta, 14, altoBarra / 2);
        ctx.fillStyle = '#ffcc00';
        ctx.fillText(textoVuelta, 14, altoBarra / 2);

        const posicion = String(textoPosicion ?? '');
        if (posicion) {
            ctx.textAlign = 'center';
            ctx.strokeText(posicion, ancho / 2, altoBarra / 2);
            ctx.fillStyle = '#7df9ff';
            ctx.fillText(posicion, ancho / 2, altoBarra / 2);
        }

        const textoTiempo = String(textoCronometro ?? '0:00.00');
        ctx.textAlign = 'right';
        ctx.font = "bold 22px 'Courier New', monospace";
        ctx.strokeText(textoTiempo, ancho - 14, altoBarra / 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(textoTiempo, ancho - 14, altoBarra / 2);
        ctx.restore();
    }

    #dibujarVelocimetro(ctx, fraccionVel, indiceVelocimetro) {
        const renderizador = window.RenderizadorVelocimetro;
        if (!renderizador || typeof renderizador.dibujar !== 'function') return;
        const m = HudCarrera.#MARGEN_VELOCIMETRO;
        const cx = this.#ancho - m;
        const cy = this.#alto - HudCarrera.#ALTO_BANDA_CONTROLES - m;
        const f = Number.isFinite(fraccionVel) ? Math.max(0, Math.min(1, fraccionVel)) : 0;
        try {
            renderizador.dibujar(ctx, cx, cy, HudCarrera.#RADIO_VELOCIMETRO, f, indiceVelocimetro ?? 0);
        } catch (e) {
            console.error('[hud_carrera.js] velocímetro', e);
        }
    }
}

window.HudCarrera = HudCarrera;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[hud_carrera.js] ' + e.message);
    console.error('[hud_carrera.js]', e);
}
