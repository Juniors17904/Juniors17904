'use strict';

// ================================================================
// CLASS: Viewer3D — visor 3D interactivo con arrastre táctil
// ================================================================
class Viewer3D {
    #canvas; #ctx; #raf = 0; #caras = [];
    #rotY = 0.38; #rotX = -0.30;
    #autoRot = true; #drag = false;
    #lx = 0; #ly = 0; #autoTimer = 0; #cleanup = null;
    #tipo = ''; #color = '';

    constructor(canvas) {
        this.#canvas = canvas;
        this.#ctx = canvas.getContext('2d');
        this.#bind();
    }

    cargar(tipo, color) {
        this.#tipo = tipo; this.#color = color;
        this.#caras = ModeloCarro3D.obtener(tipo, color);
        if (!this.#raf) this.#tick();
    }

    cambiarColor(color) {
        this.#color = color;
        this.#caras = ModeloCarro3D.obtener(this.#tipo, color);
    }

    detener() {
        cancelAnimationFrame(this.#raf); this.#raf = 0;
        clearTimeout(this.#autoTimer);
        this.#cleanup?.(); this.#cleanup = null;
    }

    // ── Proyección perspectiva ───────────────────────────────────
    #proy(x, y, z) {
        const CY = Math.cos(this.#rotY), SY = Math.sin(this.#rotY);
        let rx = x * CY + z * SY;
        let rz = -x * SY + z * CY;

        const CX = Math.cos(this.#rotX), SX = Math.sin(this.#rotX);
        let ry = y * CX - rz * SX;
        rz = y * SX + rz * CX;

        const W = this.#canvas.width, H = this.#canvas.height;
        const FOV = W * 0.90, DIST = 3.8;
        const s = FOV / (rz + DIST);
        return [W * 0.5 + rx * s, H * 0.50 - ry * s, rz];
    }

    // ── Loop de animación ────────────────────────────────────────
    #tick() {
        this.#raf = requestAnimationFrame(() => this.#tick());
        if (this.#autoRot) this.#rotY += 0.007;
        this.#draw();
    }

    #draw() {
        const ctx = this.#ctx;
        const W = this.#canvas.width, H = this.#canvas.height;

        // Fondo
        const bg = ctx.createRadialGradient(W/2, H*0.42, 8, W/2, H*0.5, W);
        bg.addColorStop(0, '#1c1c3c'); bg.addColorStop(1, '#06060f');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

        // Sombra suelo
        ctx.fillStyle = 'rgba(124,58,237,0.20)';
        ctx.beginPath();
        ctx.ellipse(W * 0.5, H * 0.80, W * 0.36, H * 0.055, 0, 0, Math.PI * 2);
        ctx.fill();

        // Proyectar
        const pros = this.#caras.map(f => {
            const pts = f.verts.map(v => this.#proy(v[0], v[1], v[2]));
            return { f, pts, z: pts.reduce((s, p) => s + p[2], 0) / pts.length };
        });

        // Pintor: lejos primero; opacos antes que transparentes
        pros.sort((a, b) => {
            const da = a.f.alpha ?? 1, db = b.f.alpha ?? 1;
            if (da !== db) return db - da;
            return b.z - a.z;
        });

        pros.forEach(({ f, pts }) => {
            ctx.beginPath();
            ctx.moveTo(pts[0][0], pts[0][1]);
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
            ctx.closePath();
            ctx.globalAlpha = f.alpha ?? 1;
            ctx.fillStyle = f.color;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = 'rgba(0,0,0,0.18)';
            ctx.lineWidth = 0.6;
            ctx.stroke();
        });

        // Hint siempre encima
        if (this.#autoRot) {
            ctx.globalAlpha = 0.35;
            ctx.fillStyle = '#ffffff';
            ctx.font = `${Math.round(H * 0.042)}px Orbitron, monospace`;
            ctx.textAlign = 'center';
            ctx.fillText('← arrastra →', W / 2, H * 0.96);
            ctx.globalAlpha = 1;
        }
    }

    // ── Eventos táctiles y mouse ─────────────────────────────────
    #bind() {
        const c = this.#canvas;

        const dn = e => {
            this.#drag = true; this.#autoRot = false;
            clearTimeout(this.#autoTimer);
            const p = e.touches ? e.touches[0] : e;
            this.#lx = p.clientX; this.#ly = p.clientY;
            e.preventDefault();
        };
        const mv = e => {
            if (!this.#drag) return;
            const p = e.touches ? e.touches[0] : e;
            this.#rotY += (p.clientX - this.#lx) * 0.013;
            this.#rotX += (p.clientY - this.#ly) * 0.010;
            this.#rotX = Math.max(-1.2, Math.min(1.2, this.#rotX));
            this.#lx = p.clientX; this.#ly = p.clientY;
            e.preventDefault();
        };
        const up = () => {
            if (!this.#drag) return;
            this.#drag = false;
            this.#autoTimer = setTimeout(() => { this.#autoRot = true; }, 2500);
        };

        c.addEventListener('mousedown',  dn);
        c.addEventListener('touchstart', dn, { passive: false });
        window.addEventListener('mousemove', mv);
        window.addEventListener('touchmove', mv, { passive: false });
        window.addEventListener('mouseup',   up);
        window.addEventListener('touchend',  up);

        this.#cleanup = () => {
            c.removeEventListener('mousedown',  dn);
            c.removeEventListener('touchstart', dn);
            window.removeEventListener('mousemove', mv);
            window.removeEventListener('touchmove', mv);
            window.removeEventListener('mouseup',   up);
            window.removeEventListener('touchend',  up);
        };
    }
}

// ================================================================
// CLASS: ModeloCarro3D — modelos 3D para los 6 tipos de carro
// Coordenadas: Y=0 suelo, X= izq/der, Z= atrás/adelante
// ================================================================
class ModeloCarro3D {
    static obtener(tipo, color) {
        return ({
            deportivo: ModeloCarro3D.#deportivo,
            suv:       ModeloCarro3D.#suv,
            muscle:    ModeloCarro3D.#muscle,
            formula:   ModeloCarro3D.#formula,
            pickup:    ModeloCarro3D.#pickup,
            clasico:   ModeloCarro3D.#clasico,
        }[tipo] ?? ModeloCarro3D.#deportivo)(color);
    }

    static #br(hex, a) {
        if (!hex?.startsWith('#')) return hex;
        const n = parseInt(hex.slice(1), 16);
        const r = Math.max(0, Math.min(255, (n >> 16)       + a));
        const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + a));
        const b = Math.max(0, Math.min(255, (n & 255)       + a));
        return `rgb(${r},${g},${b})`;
    }

    // Caja → 6 caras [top, bot, front+Z, back-Z, right+X, left-X]
    static #box(x1, y1, z1, x2, y2, z2, cols, al = 1) {
        const [ct, cb, cf, ck, cr, cl] = cols;
        return [
            { verts: [[x1,y2,z1],[x1,y2,z2],[x2,y2,z2],[x2,y2,z1]], color: ct, alpha: al },
            { verts: [[x1,y1,z2],[x1,y1,z1],[x2,y1,z1],[x2,y1,z2]], color: cb, alpha: al },
            { verts: [[x1,y1,z2],[x2,y1,z2],[x2,y2,z2],[x1,y2,z2]], color: cf, alpha: al },
            { verts: [[x2,y1,z1],[x1,y1,z1],[x1,y2,z1],[x2,y2,z1]], color: ck, alpha: al },
            { verts: [[x2,y1,z2],[x2,y1,z1],[x2,y2,z1],[x2,y2,z2]], color: cr, alpha: al },
            { verts: [[x1,y1,z1],[x1,y1,z2],[x1,y2,z2],[x1,y2,z1]], color: cl, alpha: al },
        ];
    }

    // Cuadrilátero plano (cara única)
    static #quad(v0, v1, v2, v3, color, al = 1) {
        return [{ verts: [v0, v1, v2, v3], color, alpha: al }];
    }

    // Rueda: cilindro con eje X en (cx, cy, cz), radio r, semiancho hw
    static #wheel(cx, cy, cz, r, hw, seg = 14) {
        const faces = [];
        const TIRE = 'rgb(22,22,22)', RIM = 'rgb(165,165,165)', RIM2 = 'rgb(88,88,88)';

        for (let i = 0; i < seg; i++) {
            const a1 = (i / seg) * Math.PI * 2;
            const a2 = ((i + 1) / seg) * Math.PI * 2;
            const y1 = Math.sin(a1) * r, z1 = Math.cos(a1) * r;
            const y2 = Math.sin(a2) * r, z2 = Math.cos(a2) * r;

            // Banda exterior (goma)
            faces.push({ verts: [
                [cx-hw, cy+y1, cz+z1], [cx+hw, cy+y1, cz+z1],
                [cx+hw, cy+y2, cz+z2], [cx-hw, cy+y2, cz+z2],
            ], color: TIRE, alpha: 1 });

            const rim = i % 2 === 0 ? RIM : RIM2;
            // Tapa izquierda
            faces.push({ verts: [
                [cx-hw, cy, cz],
                [cx-hw, cy+y2, cz+z2],
                [cx-hw, cy+y1, cz+z1],
            ], color: rim, alpha: 1 });
            // Tapa derecha
            faces.push({ verts: [
                [cx+hw, cy, cz],
                [cx+hw, cy+y1, cz+z1],
                [cx+hw, cy+y2, cz+z2],
            ], color: rim, alpha: 1 });
        }
        return faces;
    }

    // ── Modelos ──────────────────────────────────────────────────

    static #deportivo(c) {
        const cl = ModeloCarro3D.#br(c, 50);
        const cd = ModeloCarro3D.#br(c, -55);
        const cs = ModeloCarro3D.#br(c, -22);
        const G  = 'rgba(140,220,255,0.58)';
        const WX = 0.92, WY = 0, WZ1 = 1.0, WZ2 = -1.0, WR = 0.32, WH = 0.18;
        return [
            // Carrocería baja y larga
            ...ModeloCarro3D.#box(-0.88, 0, -1.80, 0.88, 0.38, 1.80,
                [cs, '#111', c, cd, cs, cs]),
            // Capó delantero (más bajo)
            ...ModeloCarro3D.#box(-0.82, 0.10, 0.85, 0.82, 0.38, 1.85,
                [cs, '#111', cs, cd, cs, cs]),
            // Tapa trasera (más baja)
            ...ModeloCarro3D.#box(-0.82, 0.10, -1.85, 0.82, 0.38, -0.85,
                [cs, '#111', cd, cs, cs, cs]),
            // Cabina (pequeña y achatada)
            ...ModeloCarro3D.#box(-0.70, 0.38, -0.80, 0.70, 0.82, 0.90,
                [cl, cd, G, cd, cs, cs], 1),
            // Alerón trasero (spoiler)
            ...ModeloCarro3D.#box(-0.78, 0.80, -1.52, 0.78, 0.92, -0.88,
                [cl, cd, cd, cl, cs, cs]),
            // Faldones laterales
            ...ModeloCarro3D.#box(-0.95, 0,  -1.6,  -0.90, 0.22, 1.6,
                ['#222', '#111', '#222', '#222', cd, cs]),
            ...ModeloCarro3D.#box( 0.90, 0,  -1.6,   0.95, 0.22, 1.6,
                ['#222', '#111', '#222', '#222', cs, cd]),
            // Faros delanteros
            ...ModeloCarro3D.#quad(
                [ 0.38, 0.06, 1.83],[ 0.82, 0.06, 1.83],
                [ 0.82, 0.28, 1.83],[ 0.38, 0.28, 1.83],
                '#ffffc0'),
            ...ModeloCarro3D.#quad(
                [-0.82, 0.06, 1.83],[-0.38, 0.06, 1.83],
                [-0.38, 0.28, 1.83],[-0.82, 0.28, 1.83],
                '#ffffc0'),
            // Faros traseros
            ...ModeloCarro3D.#quad(
                [-0.82, 0.06,-1.83],[-0.38, 0.06,-1.83],
                [-0.38, 0.30,-1.83],[-0.82, 0.30,-1.83],
                '#ff2222'),
            ...ModeloCarro3D.#quad(
                [ 0.38, 0.06,-1.83],[ 0.82, 0.06,-1.83],
                [ 0.82, 0.30,-1.83],[ 0.38, 0.30,-1.83],
                '#ff2222'),
            // Ruedas
            ...ModeloCarro3D.#wheel(-WX, WY,  WZ1, WR, WH),
            ...ModeloCarro3D.#wheel( WX, WY,  WZ1, WR, WH),
            ...ModeloCarro3D.#wheel(-WX, WY,  WZ2, WR, WH),
            ...ModeloCarro3D.#wheel( WX, WY,  WZ2, WR, WH),
        ];
    }

    static #suv(c) {
        const cl = ModeloCarro3D.#br(c, 42);
        const cd = ModeloCarro3D.#br(c, -52);
        const cs = ModeloCarro3D.#br(c, -18);
        const G  = 'rgba(140,220,255,0.55)';
        const WR = 0.34, WH = 0.20;
        return [
            // Carrocería alta y ancha
            ...ModeloCarro3D.#box(-0.92, 0, -1.90, 0.92, 0.44, 1.90,
                [cs, '#111', c, cd, cs, cs]),
            // Cabina alta y rectangular (no retrocede)
            ...ModeloCarro3D.#box(-0.86, 0.44, -1.85, 0.86, 1.10, 1.85,
                [cl, cd, G, cd, cs, cs]),
            // Portaequipajes en el techo
            ...ModeloCarro3D.#box(-0.68, 1.10, -1.30, 0.68, 1.18, 1.30,
                ['#2a2a2a', '#111', '#2a2a2a', '#2a2a2a', '#1a1a1a', '#1a1a1a']),
            // Parabrisas trasero
            ...ModeloCarro3D.#quad(
                [-0.82, 0.44,-1.82],[ 0.82, 0.44,-1.82],
                [ 0.82, 1.08,-1.82],[-0.82, 1.08,-1.82],
                G, 0.6),
            // Faros
            ...ModeloCarro3D.#quad([ 0.42,0.08,1.88],[ 0.86,0.08,1.88],[ 0.86,0.32,1.88],[ 0.42,0.32,1.88],'#ffffc0'),
            ...ModeloCarro3D.#quad([-0.86,0.08,1.88],[-0.42,0.08,1.88],[-0.42,0.32,1.88],[-0.86,0.32,1.88],'#ffffc0'),
            ...ModeloCarro3D.#quad([-0.86,0.08,-1.88],[-0.42,0.08,-1.88],[-0.42,0.36,-1.88],[-0.86,0.36,-1.88],'#ff2222'),
            ...ModeloCarro3D.#quad([ 0.42,0.08,-1.88],[ 0.86,0.08,-1.88],[ 0.86,0.36,-1.88],[ 0.42,0.36,-1.88],'#ff2222'),
            ...ModeloCarro3D.#wheel(-0.96, 0,  1.15, WR, WH),
            ...ModeloCarro3D.#wheel( 0.96, 0,  1.15, WR, WH),
            ...ModeloCarro3D.#wheel(-0.96, 0, -1.15, WR, WH),
            ...ModeloCarro3D.#wheel( 0.96, 0, -1.15, WR, WH),
        ];
    }

    static #muscle(c) {
        const cl = ModeloCarro3D.#br(c, 50);
        const cd = ModeloCarro3D.#br(c, -52);
        const cs = ModeloCarro3D.#br(c, -20);
        const G  = 'rgba(140,220,255,0.55)';
        const WR = 0.34, WH = 0.22;
        return [
            // Carrocería ancha y musculosa
            ...ModeloCarro3D.#box(-1.00, 0, -1.90, 1.00, 0.36, 1.90,
                [cs, '#111', c, cd, cs, cs]),
            // Capó con bulto central
            ...ModeloCarro3D.#box(-0.88, 0.10, 0.88, 0.88, 0.36, 1.92,
                [cs, '#111', cs, cd, cs, cs]),
            ...ModeloCarro3D.#box(-0.30, 0.36, 0.88, 0.30, 0.54, 1.90,
                [cl, cd, cl, cd, cs, cs]),
            // Cola recta (fastback)
            ...ModeloCarro3D.#box(-0.88, 0.10, -1.92, 0.88, 0.36, -0.88,
                [cs, '#111', cd, cs, cs, cs]),
            // Cabina fastback
            ...ModeloCarro3D.#box(-0.74, 0.36, -0.95, 0.74, 0.84, 0.98,
                [cl, cd, G, cd, cs, cs]),
            // Faldones anchos
            ...ModeloCarro3D.#box(-1.06, 0,  -1.7, -0.98, 0.20,  1.7,
                ['#1a1a1a','#111','#1a1a1a','#1a1a1a', cd, cs]),
            ...ModeloCarro3D.#box( 0.98, 0,  -1.7,  1.06, 0.20,  1.7,
                ['#1a1a1a','#111','#1a1a1a','#1a1a1a', cs, cd]),
            // Faros dobles
            ...ModeloCarro3D.#quad([ 0.40,0.04,1.90],[ 0.70,0.04,1.90],[ 0.70,0.24,1.90],[ 0.40,0.24,1.90],'#ffffc0'),
            ...ModeloCarro3D.#quad([ 0.72,0.04,1.90],[ 0.95,0.04,1.90],[ 0.95,0.24,1.90],[ 0.72,0.24,1.90],'#ffffee'),
            ...ModeloCarro3D.#quad([-0.95,0.04,1.90],[-0.72,0.04,1.90],[-0.72,0.24,1.90],[-0.95,0.24,1.90],'#ffffee'),
            ...ModeloCarro3D.#quad([-0.70,0.04,1.90],[-0.40,0.04,1.90],[-0.40,0.24,1.90],[-0.70,0.24,1.90],'#ffffc0'),
            ...ModeloCarro3D.#quad([-0.95,0.04,-1.90],[-0.40,0.04,-1.90],[-0.40,0.30,-1.90],[-0.95,0.30,-1.90],'#ff2222'),
            ...ModeloCarro3D.#quad([ 0.40,0.04,-1.90],[ 0.95,0.04,-1.90],[ 0.95,0.30,-1.90],[ 0.40,0.30,-1.90],'#ff2222'),
            ...ModeloCarro3D.#wheel(-1.04, 0,  1.15, WR, WH),
            ...ModeloCarro3D.#wheel( 1.04, 0,  1.15, WR, WH),
            ...ModeloCarro3D.#wheel(-1.04, 0, -1.15, WR, WH),
            ...ModeloCarro3D.#wheel( 1.04, 0, -1.15, WR, WH),
        ];
    }

    static #formula(c) {
        const cl = ModeloCarro3D.#br(c, 50);
        const cd = ModeloCarro3D.#br(c, -52);
        const cs = ModeloCarro3D.#br(c, -20);
        const G  = 'rgba(140,220,255,0.65)';
        const WR = 0.36, WH = 0.32;
        return [
            // Cuerpo muy bajo y angosto
            ...ModeloCarro3D.#box(-0.46, 0, -2.10, 0.46, 0.26, 2.10,
                [cs, '#111', c, cd, cs, cs]),
            // Morro estrecho
            ...ModeloCarro3D.#box(-0.20, 0, 1.60, 0.20, 0.18, 2.30,
                [cs, '#111', cs, cd, cs, cs]),
            // Cabina (cockpit)
            ...ModeloCarro3D.#box(-0.26, 0.26, -0.45, 0.26, 0.62, 0.82,
                [cl, cd, G, cd, cs, cs]),
            // Sidepods
            ...ModeloCarro3D.#box(-0.90, 0, -0.80, -0.48, 0.26, 1.10,
                [cs, '#111', cs, cd, cs, cd]),
            ...ModeloCarro3D.#box( 0.48, 0, -0.80,  0.90, 0.26, 1.10,
                [cs, '#111', cs, cd, cd, cs]),
            // Alerón delantero
            ...ModeloCarro3D.#box(-1.12, -0.08, 1.75, 1.12, -0.01, 2.28,
                [cl, '#111', cl, cd, cs, cs]),
            // Endplates delanteros
            ...ModeloCarro3D.#box(-1.16, -0.08, 1.75,-1.11, 0.18, 2.28,
                [cd, '#111', cd, cd, cd, cs]),
            ...ModeloCarro3D.#box( 1.11, -0.08, 1.75, 1.16, 0.18, 2.28,
                [cd, '#111', cd, cd, cs, cd]),
            // Poste alerón trasero
            ...ModeloCarro3D.#box(-0.10, 0.08, -2.12, 0.10, 0.62,-1.62,
                [cd, '#111', cd, cd, cd, cd]),
            // Alerón trasero
            ...ModeloCarro3D.#box(-1.02, 0.58, -2.18, 1.02, 0.70,-1.58,
                [cl, cd, cd, cl, cs, cs]),
            // Escape
            ...ModeloCarro3D.#box(-0.06, 0.02, -2.18, 0.06, 0.14,-1.90,
                ['#333','#111','#555','#333','#444','#444']),
            // Faros
            ...ModeloCarro3D.#quad([ 0.08,0.02,2.28],[ 0.22,0.02,2.28],[ 0.22,0.18,2.28],[ 0.08,0.18,2.28],'#ffffc0'),
            ...ModeloCarro3D.#quad([-0.22,0.02,2.28],[-0.08,0.02,2.28],[-0.08,0.18,2.28],[-0.22,0.18,2.28],'#ffffc0'),
            ...ModeloCarro3D.#wheel(-0.94, 0,  1.25, WR, WH),
            ...ModeloCarro3D.#wheel( 0.94, 0,  1.25, WR, WH),
            ...ModeloCarro3D.#wheel(-0.94, 0, -1.25, WR, WH),
            ...ModeloCarro3D.#wheel( 0.94, 0, -1.25, WR, WH),
        ];
    }

    static #pickup(c) {
        const cl = ModeloCarro3D.#br(c, 42);
        const cd = ModeloCarro3D.#br(c, -52);
        const cs = ModeloCarro3D.#br(c, -18);
        const cBed = ModeloCarro3D.#br(c, -40);
        const G    = 'rgba(140,220,255,0.55)';
        const WR = 0.34, WH = 0.20;
        return [
            // Frente del cab (sección delantera)
            ...ModeloCarro3D.#box(-0.90, 0, 0.10, 0.90, 0.46, 1.90,
                [cs, '#111', c, cd, cs, cs]),
            // Cabina
            ...ModeloCarro3D.#box(-0.84, 0.46, 0.50, 0.84, 1.05, 1.85,
                [cl, cd, G, cd, cs, cs]),
            // Caja de carga (bed)
            ...ModeloCarro3D.#box(-0.92, 0, -1.92, 0.92, 0.46, 0.10,
                [cBed, '#111', cd, cs, cs, cs]),
            // Pared trasera del bed
            ...ModeloCarro3D.#box(-0.92, 0.46, -1.92, 0.92, 0.92,-1.86,
                [cs, '#111', cd, cs, cs, cs]),
            // Pared izquierda del bed
            ...ModeloCarro3D.#box(-0.92, 0.46, -1.86,-0.84, 0.92, 0.05,
                [cs, '#111', cd, cs, cd, cs]),
            // Pared derecha del bed
            ...ModeloCarro3D.#box( 0.84, 0.46, -1.86, 0.92, 0.92, 0.05,
                [cs, '#111', cd, cs, cs, cd]),
            // Piso del bed (interior oscuro)
            ...ModeloCarro3D.#quad(
                [-0.83,0.47, 0.04],[ 0.83,0.47, 0.04],
                [ 0.83,0.47,-1.84],[-0.83,0.47,-1.84],
                cBed),
            // Faros
            ...ModeloCarro3D.#quad([ 0.42,0.08,1.88],[ 0.84,0.08,1.88],[ 0.84,0.32,1.88],[ 0.42,0.32,1.88],'#ffffc0'),
            ...ModeloCarro3D.#quad([-0.84,0.08,1.88],[-0.42,0.08,1.88],[-0.42,0.32,1.88],[-0.84,0.32,1.88],'#ffffc0'),
            ...ModeloCarro3D.#quad([-0.86,0.10,-1.90],[-0.44,0.10,-1.90],[-0.44,0.40,-1.90],[-0.86,0.40,-1.90],'#ff2222'),
            ...ModeloCarro3D.#quad([ 0.44,0.10,-1.90],[ 0.86,0.10,-1.90],[ 0.86,0.40,-1.90],[ 0.44,0.40,-1.90],'#ff2222'),
            ...ModeloCarro3D.#wheel(-0.96, 0,  1.15, WR, WH),
            ...ModeloCarro3D.#wheel( 0.96, 0,  1.15, WR, WH),
            ...ModeloCarro3D.#wheel(-0.96, 0, -1.15, WR, WH),
            ...ModeloCarro3D.#wheel( 0.96, 0, -1.15, WR, WH),
        ];
    }

    static #clasico(c) {
        const cl = ModeloCarro3D.#br(c, 50);
        const cd = ModeloCarro3D.#br(c, -52);
        const cs = ModeloCarro3D.#br(c, -18);
        const CHROME = 'rgb(195,208,218)';
        const G      = 'rgba(140,220,255,0.55)';
        const WR = 0.30, WH = 0.18;
        return [
            // Carrocería wide y redondeada (aproximada con cajas)
            ...ModeloCarro3D.#box(-0.88, 0, -1.88, 0.88, 0.40, 1.88,
                [cs, '#111', c, cd, cs, cs]),
            // Cabina inferior (baja y ancha)
            ...ModeloCarro3D.#box(-0.80, 0.40, -1.10, 0.80, 0.68, 1.10,
                [cl, cd, G, cd, cs, cs]),
            // Cabina superior (más estrecha, dome)
            ...ModeloCarro3D.#box(-0.66, 0.68, -0.78, 0.66, 0.92, 0.78,
                [cl, cd, G, cd, cs, cs]),
            // Guardafangos delanteros
            ...ModeloCarro3D.#box(-0.96, 0.12, 0.70, -0.88, 0.36, 1.80,
                [cs, '#111', cs, cs, cd, cs]),
            ...ModeloCarro3D.#box( 0.88, 0.12, 0.70,  0.96, 0.36, 1.80,
                [cs, '#111', cs, cs, cs, cd]),
            // Guardafangos traseros
            ...ModeloCarro3D.#box(-0.96, 0.12,-1.80, -0.88, 0.36,-0.70,
                [cs, '#111', cd, cs, cd, cs]),
            ...ModeloCarro3D.#box( 0.88, 0.12,-1.80,  0.96, 0.36,-0.70,
                [cs, '#111', cd, cs, cs, cd]),
            // Moldura cromada
            ...ModeloCarro3D.#box(-0.89, 0.22,-1.86, 0.89, 0.28, 1.86,
                [CHROME, CHROME, CHROME, CHROME, CHROME, CHROME]),
            // Faros redondos (simulados con cuadros)
            ...ModeloCarro3D.#quad([ 0.36,0.08,1.86],[ 0.76,0.08,1.86],[ 0.76,0.32,1.86],[ 0.36,0.32,1.86],'#ffffc0'),
            ...ModeloCarro3D.#quad([-0.76,0.08,1.86],[-0.36,0.08,1.86],[-0.36,0.32,1.86],[-0.76,0.32,1.86],'#ffffc0'),
            ...ModeloCarro3D.#quad([-0.76,0.08,-1.86],[-0.36,0.08,-1.86],[-0.36,0.34,-1.86],[-0.76,0.34,-1.86],'#ff2222'),
            ...ModeloCarro3D.#quad([ 0.36,0.08,-1.86],[ 0.76,0.08,-1.86],[ 0.76,0.34,-1.86],[ 0.36,0.34,-1.86],'#ff2222'),
            ...ModeloCarro3D.#wheel(-0.92, 0,  1.05, WR, WH),
            ...ModeloCarro3D.#wheel( 0.92, 0,  1.05, WR, WH),
            ...ModeloCarro3D.#wheel(-0.92, 0, -1.05, WR, WH),
            ...ModeloCarro3D.#wheel( 0.92, 0, -1.05, WR, WH),
        ];
    }
}
