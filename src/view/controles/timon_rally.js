'use strict';
try {

// ================================================================
// VIEW — TimonRally (PRD 021, D5)
// Timón de rally: aro negro de gamuza, 3 rayos plateados y una
// marca roja arriba (a las 12) para saber dónde está el centro.
// Mismo lugar y tamaño que los otros timones.
// ================================================================
class TimonRally extends Timon {
    get nombre() { return 'Rally'; }

    dibujar(ctx, S) {
        const r    = S * 0.40;
        const rimW = S * 0.072;
        const hubR = S * 0.08;
        const spW  = S * 0.046;

        this.#dibujarAro(ctx, r, rimW);
        this.#dibujarRayos(ctx, r, rimW, hubR, spW);
        this.#dibujarMarca(ctx, r, rimW);
        this.#dibujarCentro(ctx, hubR);
    }

    #dibujarAro(ctx, r, rimW) {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = rimW;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.10)';
        ctx.lineWidth = rimW * 0.3;
        ctx.stroke();
    }

    #dibujarRayos(ctx, r, rimW, hubR, spW) {
        // Rayos hacia abajo y a los costados: arriba queda libre para la marca
        const angulos = [Math.PI / 2, Math.PI * 0.05, Math.PI * 0.95];
        ctx.lineWidth   = spW;
        ctx.strokeStyle = '#d1d5db';
        angulos.forEach(a => {
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * hubR, Math.sin(a) * hubR);
            ctx.lineTo(Math.cos(a) * (r - rimW * 0.5), Math.sin(a) * (r - rimW * 0.5));
            ctx.stroke();
        });
    }

    #dibujarMarca(ctx, r, rimW) {
        const medio = Math.PI * 0.07;
        ctx.beginPath();
        ctx.arc(0, 0, r, -Math.PI / 2 - medio, -Math.PI / 2 + medio);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = rimW * 1.05;
        ctx.lineCap = 'butt';
        ctx.stroke();
        ctx.lineCap = 'round';
    }

    #dibujarCentro(ctx, hubR) {
        ctx.beginPath();
        ctx.arc(0, 0, hubR, 0, Math.PI * 2);
        ctx.fillStyle = '#111827';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, hubR * 0.45, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
    }
}

window.TimonRally = TimonRally;

} catch(e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[timon_rally.js] ' + e.message);
    console.error('[timon_rally.js]', e);
}
