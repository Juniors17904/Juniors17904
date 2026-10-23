'use strict';

// ================================================================
// CLASE: MapaDetallePista — dibuja el trazado de la pista elegida en
// el lienzo #canvas-mapa-pista de la pantalla de detalle, con la
// salida/meta (S/F). Si la pista no existe muestra "PRÓXIMAMENTE".
// ================================================================
class MapaDetallePista {
    #lienzo = document.getElementById('canvas-mapa-pista');

    dibujar(tipoPista) {
        const canvas = this.#lienzo;
        const ctx = canvas.getContext('2d');
        const W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        const pista = window.PISTAS?.[tipoPista];
        if (!pista) {
            ctx.fillStyle = '#1e1e40';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#4a4a70';
            ctx.font = '13px Orbitron';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('PRÓXIMAMENTE', W / 2, H / 2);
            return;
        }

        const puntos = [];
        let x = 0, y = 0, angle = -Math.PI / 2;
        for (let i = 0; i < pista.totalSegs; i++) {
            const tramo = pista.tramos.find(([d, h]) => i >= d && i < h);
            angle += (tramo ? tramo[2] : 0) * 0.045;
            x -= Math.cos(angle) * 1.5;
            y += Math.sin(angle) * 1.5;
            puntos.push([x, y]);
        }
        const xs = puntos.map(p => p[0]), ys = puntos.map(p => p[1]);
        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minY = Math.min(...ys), maxY = Math.max(...ys);
        const pad = 28;
        const scl = Math.min((W - pad * 2) / (maxX - minX || 1), (H - pad * 2) / (maxY - minY || 1));
        const ox = (W - (maxX - minX) * scl) / 2 - minX * scl;
        const oy = (H - (maxY - minY) * scl) / 2 - minY * scl;
        const sx = px => px * scl + ox;
        const sy = py => py * scl + oy;

        const traceSuave = () => {
            const n = puntos.length;
            const last = puntos[n - 1], first = puntos[0];
            ctx.moveTo((sx(last[0]) + sx(first[0])) / 2, (sy(last[1]) + sy(first[1])) / 2);
            for (let i = 0; i < n; i++) {
                const [px0, py0] = puntos[i];
                const [px1, py1] = puntos[(i + 1) % n];
                ctx.quadraticCurveTo(sx(px0), sy(py0), (sx(px0) + sx(px1)) / 2, (sy(py0) + sy(py1)) / 2);
            }
            ctx.closePath();
        };

        ctx.strokeStyle = 'rgba(124,58,237,0.15)';
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        traceSuave();
        ctx.stroke();

        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 4;
        ctx.beginPath();
        traceSuave();
        ctx.stroke();

        const [fx, fy] = puntos[0];
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(sx(fx), sy(fy), 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 10px Orbitron';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('S/F', sx(fx) + 8, sy(fy));
    }
}
