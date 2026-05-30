'use strict';

// ================================================================
// CONFIGURACIÓN GLOBAL
// ================================================================
const CFG = {
    HORIZONTE:      0.40,   // fracción vertical del canvas donde está el horizonte
    ROAD_W:         0.86,   // ancho de carretera en la parte inferior (fracción del ancho)
    STRIPS:         140,    // tiras de carretera a dibujar
    SEG_LARGO:      0.5,    // longitud de un segmento (unidades de posición)
    TOTAL_SEGS:     400,    // cuántos segmentos distintos tiene la pista (loop)
    VEL_MAX:        0.10,   // velocidad máxima (pos/frame)
    VEL_ACC:        0.0012, // aceleración
    VEL_FRENO:      0.006,  // frenado al chocar / soltar
    VEL_FRICCION:   0.0015, // desaceleración natural
    GIRO_VEL:       0.06,   // velocidad de giro de la cámara
    GIRO_RETURN:    0.05,   // velocidad de retorno al centro
    GIRO_MAX:       0.12,   // máximo offset lateral de cámara
    TURBO_DUR:      3000,   // ms que dura un turbo
    TURBO_MULT:     1.75,   // multiplicador de velocidad con turbo
    TURBO_MAX:      3,      // máx turbos en inventario
    DIST_META:      2000,   // distancia total de la carrera
    SYNC_MS:        80,     // cada cuánto ms sincronizar multijugador
};

const NIVELES = [
    { nombre: 'Ciudad',      desde: 0,    cielo: ['#0d1b2a','#1b3a4b'], cesped: ['#1a5c1a','#174d17'], asfalto: ['#484848','#3d3d3d'], borde: '#888' },
    { nombre: 'Atardecer',   desde: 400,  cielo: ['#b34700','#e8762a'], cesped: ['#8a6010','#7a5210'], asfalto: ['#585040','#4a4030'], borde: '#aa9060' },
    { nombre: 'Desierto',    desde: 800,  cielo: ['#c97d00','#f5d060'], cesped: ['#c8881a','#b07010'], asfalto: ['#b0906a','#9a7a55'], borde: '#d4b080' },
    { nombre: 'Montaña',     desde: 1200, cielo: ['#1a2c40','#253c55'], cesped: ['#255a20','#1d4a18'], asfalto: ['#404040','#353535'], borde: '#707070' },
    { nombre: 'Noche',       desde: 1600, cielo: ['#060610','#0a0a20'], cesped: ['#0a1f0a','#080f08'], asfalto: ['#282828','#202020'], borde: '#404040' },
];

// ================================================================
// DEFINICIÓN DE PISTAS
// ================================================================
const PISTAS = {
    ciudad: {
        nombre:    'Circuito Urbano',
        totalSegs: 300,
        distMeta:  1800,
        nivelFijo: { nombre:'Ciudad', cielo:['#060a14','#0d1b2a'], cesped:['#0a200a','#081808'], asfalto:['#3a3a3a','#2e2e2e'], borde:'#555' },
        // [desde, hasta, curva]  positivo=derecha, negativo=izquierda
        // 2 chicanes simétricas (pit+back) que se cancelan en X → circuito cierra exactamente
        // 4 curvas exactas a 90° (2.3271 = π/2 / (15×0.045))
        tramos: [
            [0,   25,  0      ],  // pit straight
            [25,  40,  -1.5   ],  // pit chicane izq
            [40,  55,  1.5    ],  // pit chicane der
            [55,  80,  0      ],  // pit straight 2
            [80,  95,  2.3271 ],  // curva 1 derecha (90°)
            [95,  135, 0      ],  // recta lateral
            [135, 150, 2.3271 ],  // curva 2 derecha (90°)
            [150, 175, 0      ],  // recta trasera 1
            [175, 190, -1.5   ],  // chicane izquierda
            [190, 205, 1.5    ],  // chicane derecha
            [205, 230, 0      ],  // recta trasera 2
            [230, 245, 2.3271 ],  // curva 3 derecha (90°)
            [245, 285, 0      ],  // recta lateral
            [285, 300, 2.3271 ],  // curva 4 derecha (90°)
        ],
        obstFrecuencia: 0.12,
        obstTipos: ['carro','carro','carro','bache','turbo'],
        coloresTrafico: ['#ef4444','#3b82f6','#eab308','#6b7280','#f97316'],
    },
    testdrive: {
        nombre: 'Test Drive',
        totalSegs: 80,
        distMeta: Infinity,
        nivelFijo: { nombre:'Test', cielo:['#0d1b2a','#1b3a4b'], cesped:['#1a5c1a','#174d17'], asfalto:['#484848','#3d3d3d'], borde:'#888' },
        tramos: [],
        esTestDrive: true,
    },
};

// ================================================================
// CLASE: Segmento de pista
// ================================================================
class Segmento {
    constructor(index, curva, nivel) {
        this.index = index;
        this.curva = curva;   // positivo = dobla derecha, negativo = izquierda
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

            const seg = new Segmento(i, curva, nivelActual);

                this.#segmentos.push(seg);
        }
    }

    obtenerSeg(pos) {
        const idx = Math.floor(pos / CFG.SEG_LARGO) % this.#totalSegs;
        return this.#segmentos[idx < 0 ? idx + this.#totalSegs : idx];
    }

    // Renderiza la carretera pseudo-3D en el canvas
    dibujar(ctx, W, H, posicion, camX) {
        const HY = H * CFG.HORIZONTE;
        const halfRoadW = (W * CFG.ROAD_W) / 2;

        // Cielo
        const seg0 = this.obtenerSeg(posicion);
        const nv = this.#nivelParaPos(posicion);
        const skyGrad = ctx.createLinearGradient(0, 0, 0, HY);
        skyGrad.addColorStop(0, nv.cielo[0]);
        skyGrad.addColorStop(1, nv.cielo[1]);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, HY);

        // Calcular posiciones de cada tira (de cerca a lejos)
        const tiras = [];
        let cx = 0, dcx = 0;

        for (let i = 0; i < CFG.STRIPS; i++) {
            const t = 1 - i / CFG.STRIPS;           // 1=cerca, 0=lejos
            const seg = this.obtenerSeg(posicion + i * CFG.SEG_LARGO * 0.6);
            dcx += seg.curva * 0.4;
            cx += dcx;
            tiras.push({ t, seg, cx: cx * t * 0.015 });
        }

        // Dibujar de lejos a cerca (reverso)
        for (let i = CFG.STRIPS - 2; i >= 0; i--) {
            const t1 = tiras[i].t;
            const t2 = tiras[i + 1].t;
            const y1 = HY + t1 * (H - HY);
            const y2 = HY + t2 * (H - HY);
            const w1 = t1 * halfRoadW;
            const w2 = t2 * halfRoadW;

            // Centro de carretera con curva y offset de cámara
            const cx1 = W / 2 + tiras[i].cx - camX * t1 * W * 0.28;
            const cx2 = W / 2 + tiras[i + 1].cx - camX * t2 * W * 0.28;

            const seg = tiras[i].seg;
            const nv = seg.nivel;
            const alt = seg.index % 2 === 0;

            // Césped (rellena todo el ancho)
            ctx.fillStyle = alt ? nv.cesped[0] : nv.cesped[1];
            ctx.fillRect(0, y1, W, y2 - y1);

            // Carretera (trapecio)
            ctx.fillStyle = alt ? nv.asfalto[0] : nv.asfalto[1];
            ctx.beginPath();
            ctx.moveTo(cx1 - w1, y1); ctx.lineTo(cx1 + w1, y1);
            ctx.lineTo(cx2 + w2, y2); ctx.lineTo(cx2 - w2, y2);
            ctx.closePath();
            ctx.fill();

            // Bordes blancos de carretera
            const bw1 = w1 * 0.07, bw2 = w2 * 0.07;
            ctx.fillStyle = nv.borde;
            // Izquierdo
            ctx.beginPath();
            ctx.moveTo(cx1 - w1, y1); ctx.lineTo(cx1 - w1 + bw1, y1);
            ctx.lineTo(cx2 - w2 + bw2, y2); ctx.lineTo(cx2 - w2, y2);
            ctx.closePath(); ctx.fill();
            // Derecho
            ctx.beginPath();
            ctx.moveTo(cx1 + w1 - bw1, y1); ctx.lineTo(cx1 + w1, y1);
            ctx.lineTo(cx2 + w2, y2); ctx.lineTo(cx2 + w2 - bw2, y2);
            ctx.closePath(); ctx.fill();

            // Línea central punteada
            if (alt) {
                const dw1 = w1 * 0.025, dw2 = w2 * 0.025;
                ctx.fillStyle = 'rgba(255,255,255,0.7)';
                ctx.beginPath();
                ctx.moveTo(cx1 - dw1, y1); ctx.lineTo(cx1 + dw1, y1);
                ctx.lineTo(cx2 + dw2, y2); ctx.lineTo(cx2 - dw2, y2);
                ctx.closePath(); ctx.fill();
            }

            // Obstáculos en esta tira
            seg.obstaculos.forEach(ob => {
                this.#dibujarObstaculo(ctx, ob, cx1, y1, w1, cx2, y2, w2, i);
            });
        }
    }

    #dibujarObstaculo(ctx, ob, cx1, y1, w1, cx2, y2, w2, stripIdx) {
        if (stripIdx > CFG.STRIPS - 5) return; // demasiado cerca, no dibujar
        const scale = (1 - stripIdx / CFG.STRIPS);
        const carW = w1 * 0.38;
        const carH = carW * 1.6;
        const offX = ob.carril * w1 * 0.55;
        const x = cx1 + offX - carW / 2;
        const y = y1 - carH;

        if (ob.tipo === 'turbo') {
            // Turbo: llama / pickup
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(cx1 + offX, y1 - carH * 0.3, carW * 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${Math.max(8, carW * 0.7)}px Orbitron`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚡', cx1 + offX, y1 - carH * 0.3);
            return;
        }

        if (ob.tipo === 'bache') {
            // Bache: óvalo oscuro en la carretera
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.beginPath();
            ctx.ellipse(cx1 + offX, y1, carW * 0.7, carH * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.stroke();
            return;
        }

        // Carro de tráfico
        // Carrocería
        ctx.fillStyle = ob.color;
        ctx.beginPath();
        ctx.roundRect(x, y, carW, carH, [4, 4, 0, 0]);
        ctx.fill();

        // Techo
        ctx.fillStyle = this.#colorMasBrillante(ob.color, 20);
        const roofPad = carW * 0.15;
        ctx.beginPath();
        ctx.roundRect(x + roofPad, y - carH * 0.28, carW - roofPad * 2, carH * 0.32, [4, 4, 2, 2]);
        ctx.fill();

        // Vidrio trasero
        ctx.fillStyle = 'rgba(150,220,255,0.5)';
        ctx.beginPath();
        ctx.roundRect(x + roofPad + 2, y - carH * 0.24, carW - roofPad * 2 - 4, carH * 0.2, 2);
        ctx.fill();

        // Luces traseras
        ctx.fillStyle = '#ff3333';
        ctx.fillRect(x + 2, y + carH - 6, carW * 0.22, 4);
        ctx.fillRect(x + carW - carW * 0.22 - 2, y + carH - 6, carW * 0.22, 4);

        // Ruedas
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

    // Detecta colisiones cerca de la cámara
    detectarColision(posicion, camX) {
        for (let i = 0; i < 8; i++) {
            const seg = this.obtenerSeg(posicion + i * CFG.SEG_LARGO * 0.3);
            for (const ob of seg.obstaculos) {
                const obX = ob.carril * 0.33; // -0.33, 0, 0.33 en espacio normalizado
                if (Math.abs(camX - obX) < 0.18) {
                    const hit = ob.tipo;
                    if (hit !== 'turbo') seg.obstaculos = seg.obstaculos.filter(o => o !== ob);
                    return hit;
                }
            }
        }
        return null;
    }

    // Devuelve si la cámara está fuera de la carretera
    fueraDePista(camX) {
        return Math.abs(camX) > 0.55;
    }
}

// ================================================================
// CLASE: Carro del jugador (dibujado desde atrás)
// ================================================================
class Carro {
    #tilt = 0; // inclinación visual al girar

    constructor(color, distMeta = CFG.DIST_META) {
        this.color = color;
        this.distMeta = distMeta;
        this.velocidad = 0;
        this.posicion = 0;
        this.camX = 0;
        this.giro = 0;
        this.accelInput = 1;  // 1=adelante, 0=neutro, -1=reversa
        this.turbosLeft = CFG.TURBO_MAX;
        this.turboActivo = false;
        this.turboTimer = 0;
        this.velMax = 0;
        this.tiempoFin = null;
    }

    activarTurbo() {
        if (this.turbosLeft <= 0) return;
        this.turbosLeft--;
        this.turboActivo = true;
        this.turboTimer = CFG.TURBO_DUR;
    }

    update(dt, fuera) {
        // Turbo timer
        if (this.turboActivo) {
            this.turboTimer -= dt;
            if (this.turboTimer <= 0) {
                this.turboActivo = false;
                this.turboTimer = 0;
            }
        }

        const velLimite = this.turboActivo ? CFG.VEL_MAX * CFG.TURBO_MULT : CFG.VEL_MAX;
        const freno = fuera ? CFG.VEL_FRENO * 3 : CFG.VEL_FRENO;

        if (this.accelInput > 0) {
            if (this.velocidad < velLimite)
                this.velocidad = Math.min(velLimite, this.velocidad + CFG.VEL_ACC * dt * 0.06);
            else
                this.velocidad += (velLimite - this.velocidad) * 0.05;
            if (fuera) this.velocidad = Math.max(0, this.velocidad - freno * dt * 0.06);
        } else if (this.accelInput < 0) {
            const velRev = CFG.VEL_MAX * 0.45;
            this.velocidad = Math.max(-velRev, this.velocidad - CFG.VEL_ACC * dt * 0.05);
        } else {
            this.velocidad *= Math.pow(0.97, dt * 0.06 * 10);
            if (Math.abs(this.velocidad) < 0.001) this.velocidad = 0;
        }

        // Giro de cámara
        this.camX += this.giro * CFG.GIRO_VEL * Math.abs(this.velocidad) * 8;
        if (this.giro === 0) {
            this.camX *= (1 - CFG.GIRO_RETURN);
        }
        this.camX = Math.max(-CFG.GIRO_MAX * 4, Math.min(CFG.GIRO_MAX * 4, this.camX));

        // Tilt visual
        this.#tilt += (this.giro * 0.3 - this.#tilt) * 0.12;

        // Avanzar
        this.posicion += this.velocidad * dt * 0.06;
        if (this.velocidad > this.velMax) this.velMax = this.velocidad;
    }

    get progreso() {
        return Math.min(1, this.posicion / this.distMeta);
    }

    get tilt() { return this.#tilt; }

    dibujar(ctx, W, H) {
        const cx  = W / 2;
        const by  = H * 0.93;
        const carW = W * 0.12;
        const carH = carW * 1.7;

        ctx.save();
        ctx.translate(cx, by - carH / 2);
        ctx.rotate(this.#tilt * 0.15);

        // Sombra (siempre visible debajo del carro 3D)
        ctx.fillStyle = 'rgba(0,0,0,0.30)';
        ctx.beginPath();
        ctx.ellipse(0, carH * 0.52, carW * 0.7, carH * 0.10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Turbo glow
        if (this.turboActivo) {
            ctx.fillStyle = `rgba(251,191,36,${0.5 + Math.sin(Date.now() * 0.015) * 0.3})`;
            ctx.beginPath();
            ctx.ellipse(0, carH * 0.52, carW * 0.4, carH * 0.22, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    #colorMasBrillante(hex, amount) {
        const isRgb = hex.startsWith('rgb');
        if (isRgb) return hex;
        const num = parseInt(hex.replace('#',''), 16);
        const r = Math.min(255, (num >> 16) + amount);
        const g = Math.min(255, ((num >> 8) & 0xff) + amount);
        const b = Math.min(255, (num & 0xff) + amount);
        return `rgb(${r},${g},${b})`;
    }
}

// ================================================================
// CLASE: HUD (velocímetro, turbos, progreso, minimapa)
// ================================================================
class HUD {
    #mmPts = null; #mmSegs = null; #mmLen = 0; #mmNivel = '';

    dibujar(ctx, W, H, carro, oponenteProgreso, nombreOponente, nivel) {
        this.#dibujarVelocimetro(ctx, W, H, carro.velocidad / CFG.VEL_MAX);
        this.#dibujarTurbos(ctx, W, H, carro.turbosLeft, carro.turboActivo);
        this.#dibujarProgreso(ctx, W, H, carro.progreso, oponenteProgreso, nombreOponente);
        if (carro.turboActivo) this.#dibujarTurboFX(ctx, W, H);
        this.#dibujarMinimap(ctx, carro, oponenteProgreso, nivel);
    }

    #dibujarVelocimetro(ctx, W, H, fraccion) {
        const cx = W - 70, cy = H - 70, r = 50;

        // Fondo
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#0a0a1e';
        ctx.beginPath();
        ctx.arc(cx, cy, r + 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#7c3aed';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Arco de fondo
        ctx.strokeStyle = '#1e1e40';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(cx, cy, r - 8, Math.PI * 0.75, Math.PI * 2.25);
        ctx.stroke();

        // Arco de velocidad
        const velColor = fraccion > 0.8 ? '#ef4444' : fraccion > 0.5 ? '#f59e0b' : '#10b981';
        ctx.strokeStyle = velColor;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(cx, cy, r - 8, Math.PI * 0.75, Math.PI * 0.75 + fraccion * Math.PI * 1.5);
        ctx.stroke();

        // Aguja
        const angle = Math.PI * 0.75 + fraccion * Math.PI * 1.5;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * (r - 14), cy + Math.sin(angle) * (r - 14));
        ctx.stroke();

        // Centro
        ctx.fillStyle = '#7c3aed';
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fill();

        // Texto velocidad
        const kmh = Math.round(fraccion * 220);
        ctx.fillStyle = '#fff';
        ctx.font = `bold 13px Orbitron`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
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
            if (activo && tiene) {
                ctx.shadowColor = '#fbbf24';
                ctx.shadowBlur = 15;
            } else {
                ctx.shadowBlur = 0;
            }
            ctx.font = '22px serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚡', startX + i * 28, y);
        }
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px Orbitron';
        ctx.fillText('TURBO', startX, y - 18);

        ctx.restore();
    }

    #dibujarProgreso(ctx, W, H, propio, oponente, nombreOp) {
        const barW = W * 0.36, barH = 8, barX = W / 2 - barW / 2, barY = 12;

        ctx.save();
        ctx.globalAlpha = 0.85;

        // Fondo barra
        ctx.fillStyle = '#0a0a1e';
        ctx.beginPath();
        ctx.roundRect(barX - 4, barY - 14, barW + 8, barH + 22, 8);
        ctx.fill();
        ctx.globalAlpha = 1;

        // Pista base
        ctx.fillStyle = '#1e1e40';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 4);
        ctx.fill();

        // Progreso propio
        ctx.fillStyle = '#7c3aed';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW * propio, barH, 4);
        ctx.fill();

        // Marcador propio
        ctx.fillStyle = '#a78bfa';
        ctx.beginPath();
        ctx.arc(barX + barW * propio, barY + barH / 2, 6, 0, Math.PI * 2);
        ctx.fill();

        // Marcador oponente (si hay)
        if (oponente !== null) {
            ctx.fillStyle = '#06b6d4';
            ctx.beginPath();
            ctx.arc(barX + barW * oponente, barY + barH / 2, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Bandera de meta
        ctx.fillStyle = '#fff';
        ctx.font = '14px serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏁', barX + barW + 4, barY + barH / 2);

        // % texto
        ctx.fillStyle = '#a78bfa';
        ctx.font = '9px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText(Math.round(propio * 100) + '%', barX + barW * propio, barY - 6);

        ctx.restore();
    }

    #dibujarTurboFX(ctx, W, H) {
        ctx.save();
        const alpha = 0.06 + Math.sin(Date.now() * 0.02) * 0.04;
        ctx.globalAlpha = alpha;

        // Líneas de velocidad
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1;
        for (let i = 0; i < 14; i++) {
            const x = Math.random() * W;
            const y1 = Math.random() * H;
            const len = 30 + Math.random() * 80;
            ctx.beginPath();
            ctx.moveTo(x, y1);
            ctx.lineTo(x + 4, y1 + len);
            ctx.stroke();
        }

        ctx.globalAlpha = 1;
        ctx.restore();
    }

    #buildMinimap(nivel) {
        if (this.#mmPts && this.#mmNivel === nivel) return;
        this.#mmNivel = nivel;
        const pista = window.PISTAS?.[nivel];
        const x0 = 11, y0 = 20, w = 100, h = 63;

        // Generar puntos desde tramos (misma fórmula que el minimapa de debug)
        const raw = [];
        let px = 0, py = 0, angle = -Math.PI / 2;
        if (pista?.tramos?.length) {
            for (let i = 0; i < pista.totalSegs; i++) {
                const tr = pista.tramos.find(([d, hh]) => i >= d && i < hh);
                angle += (tr ? tr[2] : 0) * 0.045;
                px -= Math.cos(angle) * 1.5;
                py += Math.sin(angle) * 1.5;
                raw.push([px, py]);
            }
        }

        // Escalar al panel del minimapa
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
                return {
                    x: this.#mmPts[i].x + f * (this.#mmPts[i+1].x - this.#mmPts[i].x),
                    y: this.#mmPts[i].y + f * (this.#mmPts[i+1].y - this.#mmPts[i].y),
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
            const mx = (pts[i].x + pts[i+1].x) / 2;
            const my = (pts[i].y + pts[i+1].y) / 2;
            ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
        }
        ctx.quadraticCurveTo(pts[N].x, pts[N].y,
            (pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2);
        ctx.stroke();
    }

    #dibujarMinimap(ctx, carro, oponenteProgreso, nivel) {
        this.#buildMinimap(nivel);
        if (!this.#mmPts?.length) return;
        const pts = this.#mmPts;

        ctx.save();

        // Panel
        ctx.globalAlpha = 0.88;
        ctx.fillStyle = '#0a0a1e';
        ctx.beginPath(); ctx.roundRect(6, 4, 116, 88, 8); ctx.fill();
        ctx.strokeStyle = '#7c3aed'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.globalAlpha = 1;

        // Nombre del nivel
        ctx.fillStyle = '#06b6d4'; ctx.font = '8px Orbitron';
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText((nivel || '').toUpperCase(), 12, 8);

        // Circuito: capa sombra + capa visible
        ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 7;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        this.#drawCircuit(ctx, pts);

        ctx.strokeStyle = '#c8d0e0'; ctx.lineWidth = 3;
        this.#drawCircuit(ctx, pts);

        // Línea de salida/meta
        const sf = pts[0];
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(sf.x - 5, sf.y); ctx.lineTo(sf.x + 5, sf.y);
        ctx.stroke();

        // Punto del jugador
        const pp = this.#posOnPath(carro.progreso);
        ctx.shadowColor = carro.color; ctx.shadowBlur = 10;
        ctx.fillStyle = carro.color;
        ctx.beginPath(); ctx.arc(pp.x, pp.y, 5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;

        // Punto del oponente
        if (oponenteProgreso !== null) {
            const op = this.#posOnPath(oponenteProgreso);
            ctx.shadowColor = '#06b6d4'; ctx.shadowBlur = 7;
            ctx.fillStyle = '#06b6d4';
            ctx.beginPath(); ctx.arc(op.x, op.y, 4, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }
}

// ================================================================
// CLASE: Controles (teclado, botones, timón, giroscopio)
// ================================================================
class Controles {
    #izq = false;
    #der = false;
    #gas = false;
    #rev = false;
    #giroRaw = 0;

    constructor(modo, carro) {
        this.modo = modo;
        this.carro = carro;

        if (modo === 'botones') this.#initBotones();
        if (modo === 'timon') this.#initTimon();
        if (modo === 'giro') this.#initGiroscopio();
        this.#initTeclado();
    }

    #initTeclado() {
        document.addEventListener('keydown', e => {
            if (e.key === 'ArrowLeft')  this.#izq = true;
            if (e.key === 'ArrowRight') this.#der = true;
            if (e.key === 'ArrowUp'   || e.key === 'w') this.#gas = true;
            if (e.key === 'ArrowDown' || e.key === 's') this.#rev = true;
            if (e.key === ' ') this.carro.activarTurbo();
        });
        document.addEventListener('keyup', e => {
            if (e.key === 'ArrowUp'   || e.key === 'w') this.#gas = false;
            if (e.key === 'ArrowDown' || e.key === 's') this.#rev = false;
            if (e.key === 'ArrowLeft')  this.#izq = false;
            if (e.key === 'ArrowRight') this.#der = false;
        });
    }

    #initBotones() {
        const izqEl = document.getElementById('btn-izq');
        const derEl = document.getElementById('btn-der');
        const ctrlEl = document.getElementById('ctrl-botones');
        ctrlEl.style.display = 'flex';

        ['touchstart','mousedown'].forEach(ev => {
            izqEl.addEventListener(ev, e => { e.preventDefault(); this.#izq = true; });
            derEl.addEventListener(ev, e => { e.preventDefault(); this.#der = true; });
        });
        ['touchend','mouseup','touchcancel'].forEach(ev => {
            izqEl.addEventListener(ev, e => { e.preventDefault(); this.#izq = false; });
            derEl.addEventListener(ev, e => { e.preventDefault(); this.#der = false; });
        });

        // Doble tap = turbo
        izqEl.addEventListener('dblclick', () => this.carro.activarTurbo());
        derEl.addEventListener('dblclick', () => this.carro.activarTurbo());

        const gasEl = document.getElementById('btn-gas');
        const revEl = document.getElementById('btn-rev');
        if (gasEl && revEl) {
            ['touchstart','mousedown'].forEach(ev => {
                gasEl.addEventListener(ev, e => { e.preventDefault(); this.#gas = true; });
                revEl.addEventListener(ev, e => { e.preventDefault(); this.#rev = true; });
            });
            ['touchend','mouseup','touchcancel'].forEach(ev => {
                gasEl.addEventListener(ev, e => { e.preventDefault(); this.#gas = false; });
                revEl.addEventListener(ev, e => { e.preventDefault(); this.#rev = false; });
            });
        }
    }

    #initTimon() {
        const wrap = document.getElementById('ctrl-timon');
        wrap.style.display = 'block';
        const canvas = document.getElementById('canvas-timon');
        const ctx = canvas.getContext('2d');
        let startX = null, curX = null;

        const dibujarTimon = (angle = 0) => {
            const cx = 80, cy = 80, r = 68;
            ctx.clearRect(0, 0, 160, 160);
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle);
            ctx.strokeStyle = '#7c3aed';
            ctx.lineWidth = 10;
            ctx.globalAlpha = 0.9;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.stroke();
            // radios
            for (let a = 0; a < Math.PI * 2; a += Math.PI * 2 / 3) {
                ctx.beginPath();
                ctx.moveTo(0,0);
                ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
                ctx.stroke();
            }
            ctx.restore();
        };
        dibujarTimon();

        canvas.addEventListener('touchstart', e => { startX = e.touches[0].clientX; });
        canvas.addEventListener('touchmove', e => {
            e.preventDefault();
            if (startX === null) return;
            const diff = e.touches[0].clientX - startX;
            this.#giroRaw = Math.max(-1, Math.min(1, diff / 50));
            dibujarTimon(this.#giroRaw * 0.5);
        }, { passive: false });
        canvas.addEventListener('touchend', () => {
            this.#giroRaw *= 0.5;
            startX = null;
            dibujarTimon(0);
        });
        // Tap centro = turbo
        canvas.addEventListener('dblclick', () => this.carro.activarTurbo());
    }

    #initGiroscopio() {
        if (!window.DeviceOrientationEvent) {
            ToastManager.mostrar('Tu dispositivo no soporta giroscopio', 'warn');
            return;
        }
        const h = e => {
            const angle = screen.orientation?.angle ?? 0;
            const gamma = e.gamma ?? 0;
            const beta  = e.beta  ?? 0;

            // En landscape los ejes rotan con el celular
            let valor;
            if (angle === 90)                  valor = -beta / 30;  // landscape derecha
            else if (angle === 270 || angle === -90) valor =  beta / 30;  // landscape izquierda
            else                               valor =  gamma / 30; // portrait

            this.#giroRaw = Math.max(-1, Math.min(1, valor));
        };
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(p => { if (p === 'granted') window.addEventListener('deviceorientation', h); })
                .catch(e => ToastManager.mostrar('Giroscopio: ' + e.message, 'error'));
        } else {
            window.addEventListener('deviceorientation', h);
        }
    }

    leerGiro() {
        if (this.#izq) return -1;
        if (this.#der) return  1;
        return this.#giroRaw;
    }

    leerAcel() {
        if (this.#gas) return  1;
        if (this.#rev) return -1;
        return 0;
    }
}

// ================================================================
// CLASE: Juego principal
// ================================================================
class Juego {
    #carretera;
    #carro;
    #hud;
    #controles;
    #canvas;
    #ctx;
    #ultimoTiempo = 0;
    #animFrame = null;
    #esTestDrive = false;
    #syncTimer = 0;
    #oponenteProgreso = null;
    #oponenteNombre = '';
    #nivel = NIVELES[0];
    #enCurso = false;
    #tiempoInicio = 0;
    #visor3d = null;
    #distMeta = CFG.DIST_META;

    constructor(color, tipoControl, tipoAuto = 'deportivo', tipoPista = null) {
        this.#canvas = document.getElementById('canvas-juego');
        this.#ctx = this.#canvas.getContext('2d');
        this.#carretera = new Carretera(tipoPista);
        const pistaCfg = PISTAS[tipoPista];
        this.#distMeta = pistaCfg ? pistaCfg.distMeta : CFG.DIST_META;
        this.#esTestDrive = pistaCfg?.esTestDrive ?? false;
        this.#carro = new Carro(color, this.#distMeta);
        this.#hud = new HUD();
        this.#controles = new Controles(tipoControl, this.#carro);

        const c3d = document.getElementById('canvas-carro-3d');
        if (c3d && window.VisorJuego3D) {
            this.#visor3d = new window.VisorJuego3D(c3d);
            this.#visor3d.cargar(tipoAuto, color);
            c3d.style.display = 'block';
        }

        window.addEventListener('resize', () => this.#ajustarCanvas());
        this.#ajustarCanvas();
    }

    #ajustarCanvas() {
        this.#canvas.width = window.innerWidth;
        this.#canvas.height = window.innerHeight;
    }

    iniciar(oponenteNombre) {
        this.#oponenteNombre = oponenteNombre;
        this.#enCurso = true;
        this.#tiempoInicio = Date.now();
        this.#ultimoTiempo = performance.now();
        this.#loop(performance.now());
    }

    #loop(now) {
        if (!this.#enCurso) return;
        const dt = Math.min(now - this.#ultimoTiempo, 50);
        this.#ultimoTiempo = now;

        this.#actualizar(dt);
        this.#dibujar();

        this.#animFrame = requestAnimationFrame(t => this.#loop(t));
    }

    #actualizar(dt) {
        const c = this.#carro;
        c.giro = this.#controles.leerGiro();
        if (this.#esTestDrive) c.accelInput = this.#controles.leerAcel();

        const fuera = this.#carretera.fueraDePista(c.camX / (CFG.GIRO_MAX * 4));
        c.update(dt, fuera);

        // Colisiones
        const hit = this.#carretera.detectarColision(c.posicion, c.camX / (CFG.GIRO_MAX * 3));
        if (hit === 'carro' || hit === 'bache') {
            c.velocidad = Math.max(0, c.velocidad - 0.03);
        } else if (hit === 'turbo') {
            c.activarTurbo();
            if (c.turbosLeft < CFG.TURBO_MAX) c.turbosLeft = Math.min(CFG.TURBO_MAX, c.turbosLeft + 1);
        }

        // Cambio de nivel
        const dist = c.posicion * CFG.SEG_LARGO;
        this.#nivel = NIVELES.reduce((prev, nv) => (dist >= nv.desde ? nv : prev), NIVELES[0]);

        // Sync multiplayer
        this.#syncTimer += dt;
        if (this.#syncTimer >= CFG.SYNC_MS) {
            this.#syncTimer = 0;
            if (window.multiJugador) {
                window.multiJugador.publicarProgreso(c.progreso);
            }
        }

        // Fin de carrera
        if (!this.#esTestDrive && c.progreso >= 1 && !c.tiempoFin) {
            c.tiempoFin = Date.now();
            this.#enCurso = false;
            cancelAnimationFrame(this.#animFrame);
            if (window.onCarreraTerminada) {
                window.onCarreraTerminada(c.tiempoFin - this.#tiempoInicio, c.velMax);
            }
        }
    }

    #dibujar() {
        const ctx = this.#ctx;
        const W = this.#canvas.width;
        const H = this.#canvas.height;
        const c = this.#carro;

        ctx.clearRect(0, 0, W, H);
        this.#carretera.dibujar(ctx, W, H, c.posicion, c.camX / (CFG.GIRO_MAX * 4.5));
        c.dibujar(ctx, W, H);
        if (this.#visor3d) {
            this.#visor3d.setTilt(c.tilt);
            this.#visor3d.render();
        }
        this.#hud.dibujar(ctx, W, H, c, this.#oponenteProgreso, this.#oponenteNombre, this.#nivel.nombre);
    }

    actualizarOponente(progreso) {
        this.#oponenteProgreso = progreso;
    }

    detener() {
        this.#enCurso = false;
        if (this.#animFrame) cancelAnimationFrame(this.#animFrame);
        if (this.#visor3d) {
            this.#visor3d.detener();
            this.#visor3d = null;
            const c3d = document.getElementById('canvas-carro-3d');
            if (c3d) c3d.style.display = 'none';
        }
    }

    get carro() { return this.#carro; }
}

// Exponer para uso desde app.js
window.Juego   = Juego;
window.PISTAS  = PISTAS;
