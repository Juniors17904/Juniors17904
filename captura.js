'use strict';
/**
 * captura.js — toma capturas de pantallas del juego TurboRace
 *
 * Uso:   node captura.js <pantalla> [archivo.png]
 *
 * Pantallas:
 *   inicio, ajustes, diseno-objetos, diseno-general,
 *   garage, preview-carro, velocimetro, timon
 *
 * Ejemplos:
 *   node captura.js diseno-objetos
 *   node captura.js diseno-general resultado.png
 */

const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const http = require('http');
const fs   = require('fs');
const path = require('path');
const cp   = require('child_process');

// ─── Configuración fija ───────────────────────────────────────────────────────

const PROYECTO = __dirname;
const PUERTO   = 7654;
const CHROMIUM = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const DISPLAY  = ':99';

// pasos = botones a clicar en orden para llegar a la pantalla
// canvas = ID del canvas WebGL a esperar antes de capturar (null si no hay 3D)
// espera = ms adicionales para que WebGL termine de renderizar
const PANTALLAS = {
    'inicio':         { pasos: [],                                                      espera: 1500, canvas: null              },
    'ajustes':        { pasos: ['btn-garage'],                                          espera:  800, canvas: null              },
    'diseno-objetos': { pasos: ['btn-garage', 'btn-ir-diseno-objetos'],                 espera: 5000, canvas: 'canvas-do-visor' },
    'diseno-general': { pasos: ['btn-garage', 'btn-ir-diseno-general'],                 espera: 6000, canvas: 'canvas-dg-visor' },
    'garage':         { pasos: ['btn-garage', 'btn-ir-garage'],                         espera: 2000, canvas: null              },
    'preview-carro':  { pasos: ['btn-garage', 'btn-ir-garage', 'btn-ver-carro'],        espera: 4000, canvas: 'canvas-carro-3d' },
    'velocimetro':    { pasos: ['btn-garage', 'btn-ir-velocimetro'],                    espera: 1500, canvas: null              },
    'timon':          { pasos: ['btn-garage', 'btn-ir-controles', 'btn-disenar-timon'], espera: 1500, canvas: null              },
};

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js':   'application/javascript',
    '.css':  'text/css',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.glb':  'model/gltf-binary',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',
    '.json': 'application/json',
    '.woff2':'font/woff2',
    '.woff': 'font/woff',
};

// ─── Servidor HTTP local ──────────────────────────────────────────────────────

function iniciarServidor() {
    const srv = http.createServer((req, res) => {
        let url = req.url.split('?')[0];
        if (url === '/' || url === '') url = '/index.html';
        const ruta = path.join(PROYECTO, url);
        if (!fs.existsSync(ruta) || fs.statSync(ruta).isDirectory()) {
            res.writeHead(404); res.end(); return;
        }
        const ext = path.extname(ruta).toLowerCase();
        res.writeHead(200, {
            'Content-Type' : MIME[ext] || 'application/octet-stream',
            'Cache-Control': 'no-store',
        });
        res.end(fs.readFileSync(ruta));
    });
    srv.listen(PUERTO);
    return srv;
}

// ─── Xvfb (pantalla virtual para WebGL real) ─────────────────────────────────

function asegurarXvfb() {
    try {
        cp.execSync('pgrep Xvfb', { stdio: 'ignore' });
    } catch {
        cp.spawn('Xvfb', [DISPLAY, '-screen', '0', '1280x720x24'], {
            detached: true, stdio: 'ignore',
        }).unref();
        cp.execSync('sleep 1.2');
    }
}

// ─── Captura principal ────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function capturar(nombrePantalla, archivoSalida) {
    const cfg = PANTALLAS[nombrePantalla];
    if (!cfg) {
        console.error('Pantalla desconocida:', nombrePantalla);
        console.error('Opciones:', Object.keys(PANTALLAS).join(', '));
        process.exit(1);
    }

    console.log(`▶  Capturando "${nombrePantalla}"...`);
    asegurarXvfb();

    const srv = iniciarServidor();
    let browser;

    try {
        browser = await chromium.launch({
            executablePath: CHROMIUM,
            headless: false,
            env: { ...process.env, DISPLAY },
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--enable-webgl',
                '--use-gl=desktop',
                '--ignore-gpu-blacklist',
                '--disable-dev-shm-usage',
                '--disable-features=TranslateUI',
            ],
        });

        const ctx = await browser.newContext({
            viewport:       { width: 390, height: 844 },
            serviceWorkers: 'block',
        });

        const page = await ctx.newPage();

        // Loggear crashes JavaScript de la página
        page.on('pageerror', err => console.error('[JS]', err.message));

        // Playwright evalúa rutas en orden INVERSO (última = primera evaluada).
        // Regla general primero, específica de Three.js al último (para que gane).

        // 1) Bloquear todo externo por defecto
        await page.route(/^https:\/\//, route => route.abort());

        // 2) Three.js CDN → archivos locales (sobreescribe la regla anterior para estas URLs)
        await page.route(/cdn\.jsdelivr\.net\/npm\/three@0\.164\.1/, route => {
            const url   = route.request().url();
            const sub   = url.split('/npm/three@0.164.1/')[1];
            const local = path.join(PROYECTO, 'node_modules/three', sub);
            if (fs.existsSync(local)) {
                route.fulfill({ path: local, contentType: 'application/javascript' });
            } else {
                console.warn('⚠  No encontrado local:', sub);
                route.abort();
            }
        });

        // Cargar la app
        await page.goto(`http://localhost:${PUERTO}`, {
            waitUntil: 'domcontentloaded',
            timeout:   15000,
        });
        await sleep(800);

        // Navegar paso a paso hasta la pantalla objetivo
        for (const btnId of cfg.pasos) {
            await page.waitForSelector(`#${btnId}`, { timeout: 5000 });
            await page.click(`#${btnId}`);
            await sleep(400);
        }

        // Esperar a que el canvas WebGL tenga tamaño real (no 300×150 por defecto)
        if (cfg.canvas) {
            await page.waitForFunction(id => {
                const c = document.getElementById(id);
                return c && c.width > 300 && c.height > 150;
            }, cfg.canvas, { timeout: 10000 }).catch(() => {
                console.warn('⚠  Canvas no se redimensionó, capturando de todas formas...');
            });
        }

        // Tiempo extra para que WebGL termine de renderizar
        await sleep(cfg.espera);

        // Screenshot
        const salida = archivoSalida || `captura_${nombrePantalla}.png`;
        await page.screenshot({ path: salida });
        console.log(`✓  Guardado: ${path.resolve(salida)}`);
        return salida;

    } finally {
        if (browser) await browser.close().catch(() => {});
        srv.close();
    }
}

// ─── Entrada ──────────────────────────────────────────────────────────────────

const [,, pantalla = 'inicio', archivo] = process.argv;
capturar(pantalla, archivo).catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
