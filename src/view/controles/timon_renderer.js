'use strict';
try {

// ================================================================
// VIEW — Modelos de Timón (POO)
// Cada modelo es una clase independiente con responsabilidad única:
// dibujarse a sí mismo. TimonRenderer los orquesta.
// MVC: lógica pura de vista — sin estado de juego ni input.
// ================================================================

class TimonClasico {
    get nombre() { return 'Clásico'; }

    dibujar(ctx, S) {
        const r    = S * 0.40;
        const rimW = S * 0.068;
        const hubR = S * 0.085;
        const spW  = S * 0.048;

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = rimW;
        ctx.stroke();

        const spokes = [-Math.PI / 2, Math.PI / 6, 5 * Math.PI / 6];
        ctx.lineWidth   = spW;
        ctx.strokeStyle = '#6b7280';
        spokes.forEach(a => {
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * hubR, Math.sin(a) * hubR);
            ctx.lineTo(Math.cos(a) * (r - rimW * 0.5), Math.sin(a) * (r - rimW * 0.5));
            ctx.stroke();
        });

        ctx.beginPath();
        ctx.arc(0, 0, hubR, 0, Math.PI * 2);
        ctx.fillStyle = '#4b5563';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-hubR * 0.25, -hubR * 0.3, hubR * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fill();
    }
}

class TimonDeportivo {
    get nombre() { return 'Deportivo'; }

    dibujar(ctx, S) {
        const r    = S * 0.40;
        const rimW = S * 0.076;
        const hubR = S * 0.092;
        const spW  = S * 0.05;

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = rimW + S * 0.018;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = rimW;
        ctx.stroke();

        [Math.PI * 0.65, Math.PI * 1.35].forEach(sa => {
            ctx.beginPath();
            ctx.arc(0, 0, r, sa, sa + Math.PI * 0.3);
            ctx.strokeStyle = '#374151';
            ctx.lineWidth = rimW * 1.05;
            ctx.stroke();
        });

        const spokes = [
            { a: -Math.PI / 2,    color: '#a78bfa' },
            { a: Math.PI / 6,     color: '#4b5563' },
            { a: 5 * Math.PI / 6, color: '#4b5563' },
        ];
        ctx.lineWidth = spW;
        spokes.forEach(({ a, color }) => {
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * hubR, Math.sin(a) * hubR);
            ctx.lineTo(Math.cos(a) * (r - rimW * 0.5), Math.sin(a) * (r - rimW * 0.5));
            ctx.strokeStyle = color;
            ctx.stroke();
        });

        ctx.beginPath();
        ctx.arc(0, 0, hubR, 0, Math.PI * 2);
        ctx.fillStyle = '#7c3aed';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, hubR * 0.42, 0, Math.PI * 2);
        ctx.fillStyle = '#c4b5fd';
        ctx.fill();
    }
}

class TimonF1 {
    get nombre() { return 'F1'; }

    dibujar(ctx, S) {
        const r     = S * 0.38;
        const rimW  = S * 0.058;
        const hubR  = S * 0.075;
        const spW   = S * 0.044;
        const flatY = r * 0.58;
        const a0    = Math.asin(flatY / r);
        const xFlat = Math.cos(a0) * r;

        ctx.beginPath();
        ctx.arc(0, 0, r, a0, Math.PI - a0, true);
        ctx.strokeStyle = '#0e7490';
        ctx.lineWidth = rimW;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(xFlat, flatY);
        ctx.lineTo(-xFlat, flatY);
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = rimW * 0.75;
        ctx.stroke();

        const spokes = [
            { a: -Math.PI / 2, color: '#06b6d4' },
            { a: Math.PI,      color: '#0891b2' },
            { a: 0,            color: '#0891b2' },
        ];
        ctx.lineWidth = spW;
        spokes.forEach(({ a, color }) => {
            const ex = Math.cos(a) * (r - rimW);
            const ey = Math.sin(a) * (r - rimW);
            if (ey >= flatY) return;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * hubR, Math.sin(a) * hubR);
            ctx.lineTo(ex, ey);
            ctx.strokeStyle = color;
            ctx.stroke();
        });

        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(-hubR * 1.3, -hubR * 0.55, hubR * 2.6, hubR * 1.1, hubR * 0.3);
        } else {
            ctx.arc(0, 0, hubR, 0, Math.PI * 2);
        }
        ctx.fillStyle = '#06b6d4';
        ctx.fill();

        const bR = hubR * 0.28;
        [[-hubR * 0.65, 0], [0, 0], [hubR * 0.65, 0]].forEach(([bx, by]) => {
            ctx.beginPath();
            ctx.arc(bx, by, bR, 0, Math.PI * 2);
            ctx.fillStyle = '#0c4a6e';
            ctx.fill();
        });
    }
}

class TimonVintage {
    get nombre() { return 'Vintage'; }

    dibujar(ctx, S) {
        const r    = S * 0.42;
        const rimW = S * 0.038;
        const hubR = S * 0.07;
        const spW  = S * 0.032;

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = rimW + S * 0.01;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = rimW;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(251,191,36,0.25)';
        ctx.lineWidth = rimW * 0.35;
        ctx.stroke();

        [Math.PI / 4, -Math.PI / 4].forEach(a => {
            ctx.beginPath();
            ctx.moveTo(Math.cos(a + Math.PI) * (r - rimW * 0.5), Math.sin(a + Math.PI) * (r - rimW * 0.5));
            ctx.lineTo(Math.cos(a) * (r - rimW * 0.5), Math.sin(a) * (r - rimW * 0.5));
            ctx.strokeStyle = '#92400e';
            ctx.lineWidth = spW;
            ctx.stroke();
        });

        ctx.beginPath();
        ctx.arc(0, 0, hubR, 0, Math.PI * 2);
        ctx.fillStyle = '#92400e';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, hubR * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, hubR * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = '#78350f';
        ctx.fill();
    }
}

// ================================================================
// VIEW — TimonRenderer
// Orquesta los 4 modelos de timón. Cada modelo es una clase propia.
// ================================================================
class TimonRenderer {
    static MODELOS = [
        new TimonClasico(),
        new TimonDeportivo(),
        new TimonF1(),
        new TimonVintage(),
    ];

    static dibujar(ctx, S, indice) {
        const modelo = TimonRenderer.MODELOS[indice];
        if (!modelo) return;
        ctx.save();
        ctx.lineCap  = 'round';
        ctx.lineJoin = 'round';
        modelo.dibujar(ctx, S);
        ctx.restore();
    }

    static nombre(indice) {
        return TimonRenderer.MODELOS[indice]?.nombre ?? '';
    }
}

window.TimonClasico   = TimonClasico;
window.TimonDeportivo = TimonDeportivo;
window.TimonF1        = TimonF1;
window.TimonVintage   = TimonVintage;
window.TimonRenderer  = TimonRenderer;

} catch(e) {
    window.__modelErrors = window.__modelErrors || [];
    window.__modelErrors.push('[timon_renderer.js] ' + e.message);
    console.error('[timon_renderer.js]', e);
}
