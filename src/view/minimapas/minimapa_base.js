'use strict';

// ================================================================
// CLASS: MinimapBase — superclase de todos los minimapas
//        Encapsula cálculo de escala, trazado y progreso.
//        Subclases deciden qué dibujar encima.
// ================================================================
class MinimapBase {
    #puntos    = [];
    #segmentos = [];
    #longitud  = 0;
    #pistaCfg  = null;
    #escala    = 1;
    #ox        = 0;
    #oy        = 0;

    // ── API pública ──────────────────────────────────────────────
    setCircuito(pistaCfg) {
        this.#pistaCfg = pistaCfg || null;
        this.#puntos   = [];
    }

    // Override en subclases
    dibujar(ctx, ancho, alto) {}

    // ── API protegida (uso interno de subclases) ─────────────────

    // Construye los puntos escalados al tamaño del canvas dado
    _construirPuntos(ancho, alto, relleno = 8) {
        const pista = this.#pistaCfg;
        if (!pista?.tramos?.length) return;

        const raw = [];
        let px = 0, py = 0, angulo = -Math.PI / 2;
        for (let i = 0; i < pista.totalSegs; i++) {
            const tr = pista.tramos.find(([d, h]) => i >= d && i < h);
            angulo += (tr ? tr[2] : 0) * 0.045;
            px -= Math.cos(angulo) * 1.5;
            py += Math.sin(angulo) * 1.5;
            raw.push([px, py]);
        }
        if (!raw.length) return;

        const xs   = raw.map(p => p[0]), ys = raw.map(p => p[1]);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        const scl  = Math.min(
            (ancho - relleno * 2) / (maxX - minX || 1),
            (alto  - relleno * 2) / (maxY - minY || 1)
        );
        const ox = (ancho - (maxX - minX) * scl) / 2 - minX * scl;
        const oy = (alto  - (maxY - minY) * scl) / 2 - minY * scl;

        this.#escala    = scl;
        this.#ox        = ox;
        this.#oy        = oy;
        this.#puntos    = raw.map(([x, y]) => ({ x: x * scl + ox, y: y * scl + oy }));
        this.#segmentos = [];
        this.#longitud  = 0;
        for (let i = 0; i < this.#puntos.length - 1; i++) {
            const dx  = this.#puntos[i + 1].x - this.#puntos[i].x;
            const dy  = this.#puntos[i + 1].y - this.#puntos[i].y;
            const len = Math.sqrt(dx * dx + dy * dy);
            this.#segmentos.push(len);
            this.#longitud += len;
        }
    }

    // Dibuja la línea del trazado con el ctx actual
    _dibujarTrazado(ctx) {
        const pts = this.#puntos;
        if (pts.length < 2) return;
        const N = pts.length - 1;
        ctx.beginPath();
        ctx.moveTo((pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2);
        for (let i = 1; i < N; i++) {
            const mx = (pts[i].x + pts[i + 1].x) / 2;
            const my = (pts[i].y + pts[i + 1].y) / 2;
            ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
        }
        ctx.quadraticCurveTo(
            pts[N].x, pts[N].y,
            (pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2
        );
        ctx.stroke();
    }

    // Devuelve {x, y} en el canvas para un progreso 0..1
    _posEnProgreso(progreso) {
        const pts  = this.#puntos;
        const segs = this.#segmentos;
        if (!pts.length) return { x: 0, y: 0 };
        let t = Math.max(0, Math.min(1, progreso)) * this.#longitud;
        for (let i = 0; i < segs.length; i++) {
            if (t <= segs[i]) {
                const f = t / segs[i];
                return {
                    x: pts[i].x + f * (pts[i + 1].x - pts[i].x),
                    y: pts[i].y + f * (pts[i + 1].y - pts[i].y),
                };
            }
            t -= segs[i];
        }
        return pts[pts.length - 1];
    }

    get _tienePuntos() { return this.#puntos.length > 0; }
    get _primerPunto() { return this.#puntos[0] ?? { x: 0, y: 0 }; }
    get _escala()      { return this.#escala; }
    get _ox()          { return this.#ox; }
    get _oy()          { return this.#oy; }
}

window.MinimapBase = MinimapBase;
