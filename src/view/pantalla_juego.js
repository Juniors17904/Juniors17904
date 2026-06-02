'use strict';
try {

// ================================================================
// CLASE: PantallaJuego — velocímetro, turbos, progreso, minimapa
// ================================================================
class PantallaJuego {
    #minimap = new Minimapa();

    setCircuito(pistaCfg) { this.#minimap.setCircuito(pistaCfg); }

    dibujar(ctx, W, H, carro, oponenteProgreso, nombreOponente, nivel) {
        try {
            this.#dibujarVelocimetro(ctx, W, H, carro.velocidad / carro.velMaxBase);
            this.#dibujarTurbos(ctx, W, H, carro.turbosLeft, carro.turboActivo, carro.turboMax);
            this.#dibujarProgreso(ctx, W, H, carro.progreso, oponenteProgreso, nombreOponente);
            if (carro.turboActivo) this.#dibujarTurboFX(ctx, W, H);
            this.#minimap.dibujar(ctx, carro, oponenteProgreso, nivel);
        } catch (e) {
            window.__modelErrors = window.__modelErrors || [];
            window.__modelErrors.push('[PantallaJuego.dibujar] ' + e.message);
            console.error('[PantallaJuego.dibujar]', e);
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

    #dibujarTurbos(ctx, W, H, cantidad, activo, turboMax) {
        const startX = 16, y = H - 24;
        ctx.save();
        for (let i = 0; i < turboMax; i++) {
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
}

window.PantallaJuego = PantallaJuego;

} catch (e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[pantalla_juego.js] ' + e.message);
    console.error('[pantalla_juego.js]', e);
}
