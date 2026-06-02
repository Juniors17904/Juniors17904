'use strict';

// VIEW — RenderizadorPista (antes RenderPista)
// Dibuja la pista pseudo-3D en canvas 2D
// Depende de model.js cargado antes.
const CFG     = window.CFG;
const NIVELES = window.NIVELES;

try {

// ================================================================
// CLASE: RenderizadorPista — dibuja la pista pseudo-3D en canvas 2D
// ================================================================
class RenderizadorPista {
    #pista;

    constructor(pista) {
        this.#pista = pista;
    }

    dibujar(ctx, W, H, posicion, camX) {
        try {
            const HY        = H * CFG.HORIZONTE;
            const halfRoadW = (W * CFG.ROAD_W) / 2;
            const nv        = this.#pista.nivelParaPos(posicion);

            const skyGrad = ctx.createLinearGradient(0, 0, 0, HY);
            skyGrad.addColorStop(0, nv.cielo[0]);
            skyGrad.addColorStop(1, nv.cielo[1]);
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, W, HY);

            const tiras = [];
            let cx = 0, dcx = 0;
            for (let i = 0; i < CFG.STRIPS; i++) {
                const t   = 1 - i / CFG.STRIPS;
                const seg = this.#pista.obtenerSeg(posicion + i * CFG.SEG_LARGO * 0.6);
                dcx += seg.curva * 0.4;
                cx  += dcx;
                tiras.push({ t, seg, cx: cx * t * 0.015 });
            }

            for (let i = CFG.STRIPS - 2; i >= 0; i--) {
                const t1 = tiras[i].t,     t2 = tiras[i + 1].t;
                const y1 = HY + t1 * (H - HY), y2 = HY + t2 * (H - HY);
                const w1 = t1 * halfRoadW, w2 = t2 * halfRoadW;
                const cx1 = W / 2 + tiras[i].cx     - camX * t1 * W * 0.28;
                const cx2 = W / 2 + tiras[i + 1].cx - camX * t2 * W * 0.28;
                const seg = tiras[i].seg;
                const nv  = seg.nivel;
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
                ctx.moveTo(cx1 - w1, y1);       ctx.lineTo(cx1 - w1 + bw1, y1);
                ctx.lineTo(cx2 - w2 + bw2, y2); ctx.lineTo(cx2 - w2, y2);
                ctx.closePath(); ctx.fill();
                ctx.beginPath();
                ctx.moveTo(cx1 + w1 - bw1, y1); ctx.lineTo(cx1 + w1, y1);
                ctx.lineTo(cx2 + w2, y2);        ctx.lineTo(cx2 + w2 - bw2, y2);
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
            window.__modelErrors.push('[RenderizadorPista.dibujar] ' + e.message);
            console.error('[RenderizadorPista.dibujar]', e);
        }
    }

    #dibujarObstaculo(ctx, ob, cx1, y1, w1, cx2, y2, w2, stripIdx) {
        if (stripIdx > CFG.STRIPS - 5) return;
        const carW = w1 * 0.38;
        const carH = carW * 1.6;
        const offX = ob.carril * w1 * 0.55;
        const x    = cx1 + offX - carW / 2;
        const y    = y1 - carH;

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
        const num = parseInt(hex.replace('#', ''), 16);
        const r   = Math.min(255, (num >> 16) + amount);
        const g   = Math.min(255, ((num >> 8) & 0xff) + amount);
        const b   = Math.min(255, (num & 0xff) + amount);
        return `rgb(${r},${g},${b})`;
    }
}

window.RenderizadorPista = RenderizadorPista;
// Alias de compatibilidad
window.RenderPista = RenderizadorPista;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[renderizador_pista.js] ' + e.message);
    console.error('[renderizador_pista.js]', e);
}
