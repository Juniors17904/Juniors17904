'use strict';
try {

// ================================================================
// VIEW — TimonCamion (PRD 021, D5)
// Timón de camión: aro grueso que llena su lugar y dos rayos
// anchos de lado a lado, con un centro grande.
// Mismo lugar y tamaño que los otros timones.
// ================================================================
class TimonCamion extends Timon {
    get nombre() { return 'Camión'; }

    dibujar(ctx, S) {
        const r    = S * 0.42;
        const rimW = S * 0.10;
        const hubR = S * 0.11;
        const spW  = S * 0.075;

        this.#dibujarAro(ctx, r, rimW);
        this.#dibujarRayos(ctx, r, rimW, spW);
        this.#dibujarCentro(ctx, hubR);
    }

    #dibujarAro(ctx, r, rimW) {
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = rimW;
        ctx.stroke();

        // Brillo y borde interior para que se note el grosor
        ctx.beginPath();
        ctx.arc(0, 0, r + rimW * 0.22, -Math.PI * 0.9, -Math.PI * 0.1);
        ctx.strokeStyle = 'rgba(255,255,255,0.16)';
        ctx.lineWidth = rimW * 0.22;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, r - rimW * 0.5, 0, Math.PI * 2);
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = rimW * 0.12;
        ctx.stroke();
    }

    #dibujarRayos(ctx, r, rimW, spW) {
        const largo = r - rimW * 0.5;
        ctx.lineWidth   = spW;
        ctx.strokeStyle = '#4b5563';
        ctx.beginPath();
        ctx.moveTo(-largo, 0);
        ctx.lineTo(largo, 0);
        ctx.stroke();
    }

    #dibujarCentro(ctx, hubR) {
        ctx.beginPath();
        ctx.arc(0, 0, hubR, 0, Math.PI * 2);
        ctx.fillStyle = '#1f2937';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, hubR * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-hubR * 0.2, -hubR * 0.25, hubR * 0.22, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fill();
    }
}

window.TimonCamion = TimonCamion;

} catch(e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[timon_camion.js] ' + e.message);
    console.error('[timon_camion.js]', e);
}
