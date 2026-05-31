'use strict';

// VIEW — clases de render pseudo-3D (Segmento, Carretera, HUD)
// Depende de model.js (CFG, NIVELES, PISTAS) cargado antes.
const CFG    = window.CFG;
const NIVELES = window.NIVELES;
const PISTAS  = window.PISTAS;

try {

// ================================================================
// CLASE: Segmento de pista
// ================================================================
class Segmento {
    constructor(index, curva, nivel) {
        this.index = index;
        this.curva = curva;
        this.nivel = nivel;
        this.obstaculos = [];
    }
}

// ================================================================
// CLASE: Carretera  (genera y renderiza la pista pseudo-3D)
// ================================================================
class Carretera {
    #segmentos = [];
    #totalSegs;
    #nivelFijo = null;

    constructor(tipoPista) {
        this.pista = PISTAS[tipoPista] || null;
        this.#totalSegs = this.pista ? this.pista.totalSegs : CFG.TOTAL_SEGS;
        this.#nivelFijo = this.pista ? this.pista.nivelFijo : null;
        this.#generarPista();
    }

    #generarPista() {
        const N = this.#totalSegs;
        const p = this.pista;
        for (let i = 0; i < N; i++) {
            let nivelActual, curva;
            if (p) {
                nivelActual = p.nivelFijo;
                const tramo = p.tramos.find(([d, h]) => i >= d && i < h);
                curva = tramo ? tramo[2] : 0;
            } else {
                nivelActual = NIVELES.reduce((prev, nv) =>
                    (i * CFG.SEG_LARGO < nv.desde) ? prev : nv, NIVELES[0]);
                const bloque = Math.floor(i / 40);
                curva = bloque % 3 === 1 ? 0.8 : bloque % 3 === 2 ? -0.6 : 0;
            }
            this.#segmentos.push(new Segmento(i, curva, nivelActual));
        }
    }

    obtenerSeg(pos) {
        const idx = Math.floor(pos / CFG.SEG_LARGO) % this.#totalSegs;
        return this.#segmentos[idx < 0 ? idx + this.#totalSegs : idx];
    }

    dibujar(ctx, W, H, posicion, camX) {
        try {
            const HY = H * CFG.HORIZONTE;
            const halfRoadW = (W * CFG.ROAD_W) / 2;
            const seg0 = this.obtenerSeg(posicion);
            const nv = this.#nivelParaPos(posicion);
            const skyGrad = ctx.createLinearGradient(0, 0, 0, HY);
            skyGrad.addColorStop(0, nv.cielo[0]);
            skyGrad.addColorStop(1, nv.cielo[1]);
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, W, HY);

            const tiras = [];
            let cx = 0, dcx = 0;
            for (let i = 0; i < CFG.STRIPS; i++) {
                const t = 1 - i / CFG.STRIPS;
                const seg = this.obtenerSeg(posicion + i * CFG.SEG_LARGO * 0.6);
                dcx += seg.curva * 0.4;
                cx += dcx;
                tiras.push({ t, seg, cx: cx * t * 0.015 });
            }

            for (let i = CFG.STRIPS - 2; i >= 0; i--) {
                const t1 = tiras[i].t, t2 = tiras[i + 1].t;
                const y1 = HY + t1 * (H - HY), y2 = HY + t2 * (H - HY);
                const w1 = t1 * halfRoadW, w2 = t2 * halfRoadW;
                const cx1 = W / 2 + tiras[i].cx - camX * t1 * W * 0.28;
                const cx2 = W / 2 + tiras[i + 1].cx - camX * t2 * W * 0.28;
                const seg = tiras[i].seg;
                const nv = seg.nivel;
                const alt = seg.index % 2 === 0;

                ctx.fillStyle = alt ? nv.cesped[0] : nv.cesped[1];
                ctx.fillRect(0, y1, W, y2 - y1);

                ctx.fillStyle = alt ? nv.asfalto[0] : nv.asfalto[1];
                ctx.beginPath();
                ctx.moveTo(cx1 - w1, y1); ctx.lineTo(cx1 + w1, y1);
                ctx.lineTo(cx2 + w2, y2); ctx.lineTo(cx2 - w2, y2);
                ctx.closePath(); ctx.fill();

                const bw1 = w1 * 0.07, bw2 = w2 * 0.07;
                ctx.fillStyle = nv.borde;
                ctx.beginPath();
                ctx.moveTo(cx1 - w1, y1); ctx.lineTo(cx1 - w1 + bw1, y1);
                ctx.lineTo(cx2 - w2 + bw2, y2); ctx.lineTo(cx2 - w2, y2);
                ctx.closePath(); ctx.fill();
                ctx.beginPath();
                ctx.moveTo(cx1 + w1 - bw1, y1); ctx.lineTo(cx1 + w1, y1);
                ctx.lineTo(cx2 + w2, y2); ctx.lineTo(cx2 + w2 - bw2, y2);
                ctx.closePath(); ctx.fill();

                if (alt) {
                    const dw1 = w1 * 0.025, dw2 = w2 * 0.025;
                    ctx.fillStyle = 'rgba(255,255,255,0.7)';
                    ctx.beginPath();
                    ctx.moveTo(cx1 - dw1, y1); ctx.lineTo(cx1 + dw1, y1);
                    ctx.lineTo(cx2 + dw2, y2); ctx.lineTo(cx2 - dw2, y2);
                    ctx.closePath(); ctx.fill();
                }
                seg.obstaculos.forEach(ob => {
                    this.#dibujarObstaculo(ctx, ob, cx1, y1, w1, cx2, y2, w2, i);
                });
            }
        } catch (e) {
            window.__modelErrors = window.__modelErrors || [];
            window.__modelErrors.push('[Carretera.dibujar] ' + e.message);
            console.error('[Carretera.dibujar]', e);
        }
    }

    #dibujarObstaculo(ctx, ob, cx1, y1, w1, cx2, y2, w2, stripIdx) {
        if (stripIdx > CFG.STRIPS - 5) return;
        const scale = (1 - stripIdx / CFG.STRIPS);
        const carW = w1 * 0.38;
        const carH = carW * 1.6;
        const offX = ob.carril * w1 * 0.55;
        const x = cx1 + offX - carW / 2;
        const y = y1 - carH;

        if (ob.tipo === 'turbo') {
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(cx1 + offX, y1 - carH * 0.3, carW * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${Math.max(8, carW * 0.7)}px Orbitron`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('⚡', cx1 + offX, y1 - carH * 0.3);
            return;
        }
        if (ob.tipo === 'bache') {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.beginPath();
            ctx.ellipse(cx1 + offX, y1, carW * 0.7, carH * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.stroke();
            return;
        }
        ctx.fillStyle = ob.color;
        ctx.beginPath(); ctx.roundRect(x, y, carW, carH, [4, 4, 0, 0]); ctx.fill();
        ctx.fillStyle = this.#colorMasBrillante(ob.color, 20);
        const roofPad = carW * 0.15;
        ctx.beginPath(); ctx.roundRect(x + roofPad, y - carH * 0.28, carW - roofPad * 2, carH * 0.32, [4, 4, 2, 2]); ctx.fill();
        ctx.fillStyle = 'rgba(150,220,255,0.5)';
        ctx.beginPath(); ctx.roundRect(x + roofPad + 2, y - carH * 0.24, carW - roofPad * 2 - 4, carH * 0.2, 2); ctx.fill();
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(x + 2, y + carH - 6, carW * 0.22, 4);
        ctx.fillRect(x + carW - carW * 0.22 - 2, y + carH - 6, carW * 0.22, 4);
        ctx.fillStyle = '#111';
        const rW = carW * 0.22, rH = rW * 0.55;
        ctx.fillRect(x - rW * 0.3, y + carH * 0.6, rW, rH);
        ctx.fillRect(x + carW - rW * 0.7, y + carH * 0.6, rW, rH);
    }

    #colorMasBrillante(hex, amount) {
        const num = parseInt(hex.replace('#',''), 16);
        const r = Math.min(255, (num >> 16) + amount);
        const g = Math.min(255, ((num >> 8) & 0xff) + amount);
        const b = Math.min(255, (num & 0xff) + amount);
        return `rgb(${r},${g},${b})`;
    }

    #nivelParaPos(pos) {
        if (this.#nivelFijo) return this.#nivelFijo;
        const dist = pos * CFG.SEG_LARGO;
        return NIVELES.reduce((prev, nv) => (dist >= nv.desde ? nv : prev), NIVELES[0]);
    }

    detectarColision(posicion, camX) {
        for (let i = 0; i < 8; i++) {
            const seg = this.obtenerSeg(posicion + i * CFG.SEG_LARGO * 0.3);
            for (const ob of seg.obstaculos) {
                const obX = ob.carril * 0.33;
                if (Math.abs(camX - obX) < 0.18) {
                    const hit = ob.tipo;
                    if (hit !== 'turbo') seg.obstaculos = seg.obstaculos.filter(o => o !== ob);
                    return hit;
                }
            }
        }
        return null;
    }

    fueraDePista(camX) { return Math.abs(camX) > 0.55; }
}

// ================================================================
// CLASE: HUD (velocímetro, turbos, progreso, minimapa)
// ================================================================
class HUD {
    #mmPts = null; #mmSegs = null; #mmLen = 0; #mmNivel = '';

    dibujar(ctx, W, H, carro, oponenteProgreso, nombreOponente, nivel) {
        try {
            this.#dibujarVelocimetro(ctx, W, H, carro.velocidad / CFG.VEL_MAX);
            this.#dibujarTurbos(ctx, W, H, carro.turbosLeft, carro.turboActivo);
            this.#dibujarProgreso(ctx, W, H, carro.progreso, oponenteProgreso, nombreOponente);
            if (carro.turboActivo) this.#dibujarTurboFX(ctx, W, H);
            this.#dibujarMinimap(ctx, carro, oponenteProgreso, nivel);
        } catch (e) {
            window.__modelErrors = window.__modelErrors || [];
            window.__modelErrors.push('[HUD.dibujar] ' + e.message);
            console.error('[HUD.dibujar]', e);
        }
    }

    #dibujarVelocimetro(ctx, W, H, fraccion) {
        const cx = W - 70, cy = H - 70, r = 50;
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#0a0a1e';
        ctx.beginPath(); ctx.arc(cx, cy, r + 8, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 2; ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#1e1e40'; ctx.lineWidth = 8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(cx, cy, r - 8, Math.PI * 0.75, Math.PI * 2.25); ctx.stroke();
        const velColor = fraccion > 0.8 ? '#ef4444' : fraccion > 0.5 ? '#f59e0b' : '#10b981';
        ctx.strokeStyle = velColor; ctx.lineWidth = 8;
        ctx.beginPath(); ctx.arc(cx, cy, r - 8, Math.PI * 0.75, Math.PI * 0.75 + fraccion * Math.PI * 1.5); ctx.stroke();
        const angle = Math.PI * 0.75 + fraccion * Math.PI * 1.5;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(angle) * (r - 14), cy + Math.sin(angle) * (r - 14)); ctx.stroke();
        ctx.fillStyle = '#7c3aed'; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
        const kmh = Math.round(fraccion * 220);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Orbitron';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(kmh + ' km/h', cx, cy + r * 0.55);
        ctx.restore();
    }

    #dibujarTurbos(ctx, W, H, cantidad, activo) {
        const startX = 16, y = H - 24;
        ctx.save();
        for (let i = 0; i < CFG.TURBO_MAX; i++) {
            const tiene = i < cantidad;
            ctx.globalAlpha = tiene ? 1 : 0.25;
            ctx.fillStyle = activo && tiene ? '#fbbf24' : '#f59e0b';
            if (activo && tiene) { ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 15; }
            else ctx.shadowBlur = 0;
            ctx.font = '22px serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
            ctx.fillText('⚡', startX + i * 28, y);
        }
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
        ctx.fillStyle = '#94a3b8'; ctx.font = '9px Orbitron';
        ctx.fillText('TURBO', startX, y - 18);
        ctx.restore();
    }

    #dibujarProgreso(ctx, W, H, propio, oponente, nombreOp) {
        const barW = W * 0.36, barH = 8, barX = W / 2 - barW / 2, barY = 12;
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#0a0a1e'; ctx.beginPath(); ctx.roundRect(barX - 4, barY - 14, barW + 8, barH + 22, 8); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#1e1e40'; ctx.beginPath(); ctx.roundRect(barX, barY, barW, barH, 4); ctx.fill();
        ctx.fillStyle = '#7c3aed'; ctx.beginPath(); ctx.roundRect(barX, barY, barW * propio, barH, 4); ctx.fill();
        ctx.fillStyle = '#a78bfa'; ctx.beginPath(); ctx.arc(barX + barW * propio, barY + barH / 2, 6, 0, Math.PI * 2); ctx.fill();
        if (oponente !== null) {
            ctx.fillStyle = '#06b6d4'; ctx.beginPath(); ctx.arc(barX + barW * oponente, barY + barH / 2, 4, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = '#fff'; ctx.font = '14px serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText('🏁', barX + barW + 4, barY + barH / 2);
        ctx.fillStyle = '#a78bfa'; ctx.font = '9px Orbitron'; ctx.textAlign = 'center';
        ctx.fillText(Math.round(propio * 100) + '%', barX + barW * propio, barY - 6);
        ctx.restore();
    }

    #dibujarTurboFX(ctx, W, H) {
        ctx.save();
        const alpha = 0.06 + Math.sin(Date.now() * 0.02) * 0.04;
        ctx.globalAlpha = alpha; ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1;
        for (let i = 0; i < 14; i++) {
            const x = Math.random() * W, y1 = Math.random() * H, len = 30 + Math.random() * 80;
            ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x + 4, y1 + len); ctx.stroke();
        }
        ctx.globalAlpha = 1; ctx.restore();
    }

    #buildMinimap(nivel) {
        if (this.#mmPts && this.#mmNivel === nivel) return;
        this.#mmNivel = nivel;
        const pista = window.PISTAS?.[nivel];
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
        const xs = raw.map(p => p[0]), ys = raw.map(p => p[1]);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        const pad = 6;
        const scl = Math.min((w - pad*2) / (maxX-minX||1), (h - pad*2) / (maxY-minY||1));
        const ox = x0 + (w - (maxX-minX)*scl) / 2 - minX*scl;
        const oy = y0 + (h - (maxY-minY)*scl) / 2 - minY*scl;
        this.#mmPts = raw.map(([x, y]) => ({ x: x*scl+ox, y: y*scl+oy }));
        this.#mmSegs = []; this.#mmLen = 0;
        for (let i = 0; i < this.#mmPts.length - 1; i++) {
            const dx = this.#mmPts[i+1].x - this.#mmPts[i].x;
            const dy = this.#mmPts[i+1].y - this.#mmPts[i].y;
            const len = Math.sqrt(dx*dx + dy*dy);
            this.#mmSegs.push(len); this.#mmLen += len;
        }
    }

    #posOnPath(progress) {
        let t = Math.max(0, Math.min(1, progress)) * this.#mmLen;
        for (let i = 0; i < this.#mmSegs.length; i++) {
            if (t <= this.#mmSegs[i]) {
                const f = t / this.#mmSegs[i];
                return { x: this.#mmPts[i].x + f * (this.#mmPts[i+1].x - this.#mmPts[i].x), y: this.#mmPts[i].y + f * (this.#mmPts[i+1].y - this.#mmPts[i].y) };
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
            const mx = (pts[i].x + pts[i+1].x) / 2, my = (pts[i].y + pts[i+1].y) / 2;
            ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
        }
        ctx.quadraticCurveTo(pts[N].x, pts[N].y, (pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2);
        ctx.stroke();
    }

    #dibujarMinimap(ctx, carro, oponenteProgreso, nivel) {
        this.#buildMinimap(nivel);
        if (!this.#mmPts?.length) return;
        const pts = this.#mmPts;
        ctx.save();
        ctx.globalAlpha = 0.88;
        ctx.fillStyle = '#0a0a1e'; ctx.beginPath(); ctx.roundRect(6, 4, 116, 88, 8); ctx.fill();
        ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#06b6d4'; ctx.font = '8px Orbitron';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText((nivel || '').toUpperCase(), 12, 8);
        ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 7;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round'; this.#drawCircuit(ctx, pts);
        ctx.strokeStyle = '#c8d0e0'; ctx.lineWidth = 3; this.#drawCircuit(ctx, pts);
        const sf = pts[0];
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(sf.x - 5, sf.y); ctx.lineTo(sf.x + 5, sf.y); ctx.stroke();
        const pp = this.#posOnPath(carro.progreso);
        ctx.shadowColor = carro.color; ctx.shadowBlur = 10;
        ctx.fillStyle = carro.color; ctx.beginPath(); ctx.arc(pp.x, pp.y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
        if (oponenteProgreso !== null) {
            const op = this.#posOnPath(oponenteProgreso);
            ctx.shadowColor = '#06b6d4'; ctx.shadowBlur = 7;
            ctx.fillStyle = '#06b6d4'; ctx.beginPath(); ctx.arc(op.x, op.y, 4, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        }
        ctx.restore();
    }
}

window.Segmento  = Segmento;
window.Carretera = Carretera;
window.HUD       = HUD;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[view_pista2d.js] ' + e.message);
    console.error('[view_pista2d.js]', e);
}
