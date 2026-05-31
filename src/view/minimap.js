'use strict';
try {

// ================================================================
// VIEW — Minimap
// Minimapa del circuito reutilizable en cualquier pista 2D o 3D.
// Uso: new Minimap(), setCircuito(pistaCfg), dibujar(ctx, carro, oponenteProgreso, nivel)
// ================================================================
class Minimap {
    #mmPts    = null;
    #mmSegs   = null;
    #mmLen    = 0;
    #mmNivel  = '';
    #pistaCfg = null;
    #scl = 1; #ox = 0; #oy = 0;

    setCircuito(pistaCfg) {
        this.#pistaCfg = pistaCfg || null;
        this.#mmPts    = null;
    }

    worldToScreen(worldX, worldZ) {
        if (!this.#mmPts) return null;
        return {
            x: -worldX * 0.375 * this.#scl + this.#ox,
            y: -worldZ * 0.375 * this.#scl + this.#oy,
        };
    }

    dibujar(ctx, carro, oponenteProgreso, nivel, zonaVisible = null) {
        this.#buildMinimap(nivel);
        if (!this.#mmPts?.length) return;
        const pts = this.#mmPts;
        ctx.save();
        ctx.globalAlpha = 0.88;
        ctx.fillStyle = '#0a0a1e';
        ctx.beginPath(); ctx.roundRect(6, 4, 116, 88, 8); ctx.fill();
        ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#06b6d4'; ctx.font = '8px Orbitron';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText((nivel || '').toUpperCase(), 12, 8);
        ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 7;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        this.#drawCircuit(ctx, pts);
        ctx.strokeStyle = '#c8d0e0'; ctx.lineWidth = 3;
        this.#drawCircuit(ctx, pts);
        const sf = pts[0];
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(sf.x - 5, sf.y); ctx.lineTo(sf.x + 5, sf.y); ctx.stroke();
        const pp = this.#posOnPath(carro.progreso);
        ctx.shadowColor = carro.color; ctx.shadowBlur = 10;
        ctx.fillStyle = carro.color;
        ctx.beginPath(); ctx.arc(pp.x, pp.y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        if (oponenteProgreso !== null) {
            const op = this.#posOnPath(oponenteProgreso);
            ctx.shadowColor = '#06b6d4'; ctx.shadowBlur = 7;
            ctx.fillStyle = '#06b6d4';
            ctx.beginPath(); ctx.arc(op.x, op.y, 4, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        }
        if (zonaVisible) {
            const c = this.worldToScreen(zonaVisible.x, zonaVisible.z);
            if (c) {
                const r = zonaVisible.radio * 0.375 * this.#scl;
                ctx.strokeStyle = 'rgba(255,255,255,0.6)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([3, 2]);
                ctx.beginPath();
                ctx.rect(c.x - r, c.y - r, r * 2, r * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
        ctx.restore();
    }

    #buildMinimap(nivel) {
        if (this.#mmPts && this.#mmNivel === nivel) return;
        this.#mmNivel = nivel;
        const pista = this.#pistaCfg;
        const x0 = 11, y0 = 20, w = 100, h = 63;
        const raw = [];
        let px = 0, py = 0, angle = -Math.PI / 2;
        if (pista?.tramos?.length) {
            for (let i = 0; i < pista.totalSegs; i++) {
                const tr = pista.tramos.find(([d, hh]) => i >= d && i < hh);
                angle += (tr ? tr[2] : 0) * 0.045;
                px -= Math.cos(angle) * 1.5; py += Math.sin(angle) * 1.5;
                raw.push([px, py]);
            }
        }
        if (!raw.length) return;
        const xs = raw.map(p => p[0]), ys = raw.map(p => p[1]);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        const pad = 6;
        const scl = Math.min((w - pad * 2) / (maxX - minX || 1), (h - pad * 2) / (maxY - minY || 1));
        const ox  = x0 + (w - (maxX - minX) * scl) / 2 - minX * scl;
        const oy  = y0 + (h - (maxY - minY) * scl) / 2 - minY * scl;
        this.#scl = scl; this.#ox = ox; this.#oy = oy;
        this.#mmPts  = raw.map(([x, y]) => ({ x: x * scl + ox, y: y * scl + oy }));
        this.#mmSegs = []; this.#mmLen = 0;
        for (let i = 0; i < this.#mmPts.length - 1; i++) {
            const dx  = this.#mmPts[i + 1].x - this.#mmPts[i].x;
            const dy  = this.#mmPts[i + 1].y - this.#mmPts[i].y;
            const len = Math.sqrt(dx * dx + dy * dy);
            this.#mmSegs.push(len); this.#mmLen += len;
        }
    }

    #posOnPath(progress) {
        let t = Math.max(0, Math.min(1, progress)) * this.#mmLen;
        for (let i = 0; i < this.#mmSegs.length; i++) {
            if (t <= this.#mmSegs[i]) {
                const f = t / this.#mmSegs[i];
                return {
                    x: this.#mmPts[i].x + f * (this.#mmPts[i + 1].x - this.#mmPts[i].x),
                    y: this.#mmPts[i].y + f * (this.#mmPts[i + 1].y - this.#mmPts[i].y),
                };
            }
            t -= this.#mmSegs[i];
        }
        return this.#mmPts[this.#mmPts.length - 1];
    }

    #drawCircuit(ctx, pts) {
        const N = pts.length - 1;
        ctx.beginPath();
        ctx.moveTo((pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2);
        for (let i = 1; i < N; i++) {
            const mx = (pts[i].x + pts[i + 1].x) / 2;
            const my = (pts[i].y + pts[i + 1].y) / 2;
            ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
        }
        ctx.quadraticCurveTo(pts[N].x, pts[N].y, (pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2);
        ctx.stroke();
    }
}

window.Minimap = Minimap;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[minimap.js] ' + e.message);
    console.error('[minimap.js]', e);
}
