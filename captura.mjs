#!/usr/bin/env node
/**
 * captura.mjs — toma capturas de TurboRace en portrait y landscape
 *
 * Uso:
 *   xvfb-run --auto-servernum --server-args="-screen 0 1280x960x24" node captura.mjs
 *   xvfb-run --auto-servernum --server-args="-screen 0 1280x960x24" node captura.mjs diseno-general
 *   xvfb-run --auto-servernum --server-args="-screen 0 1280x960x24" node captura.mjs diseno-objetos
 *
 * Requisitos:
 *   - xvfb-run instalado (apt install xvfb)
 *   - Playwright: /opt/node22/lib/node_modules/playwright
 *   - Three.js local: node_modules/three (npm install)
 *   - Servidor HTTP corriendo en :8099 (python3 -m http.server 8099)
 */

import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

// ── Configuración ──────────────────────────────────────────────────────────
const PANTALLAS = {
    'diseno-general':  { btn: 'btn-ir-diseno-general',  salida: '/tmp/dg' },
    'diseno-objetos':  { btn: 'btn-ir-diseno-objetos',  salida: '/tmp/do' },
};

const pantalla = process.argv[2] ?? 'diseno-general';
const cfg      = PANTALLAS[pantalla];
if (!cfg) {
    console.error('Pantalla desconocida. Opciones:', Object.keys(PANTALLAS).join(', '));
    process.exit(1);
}

const URL_APP  = 'http://localhost:8099/';
const ESPERA   = 7000;  // ms para que Three.js renderice

// ── Parche de importmap (Three.js local en vez de CDN) ─────────────────────
const parchearRuta = async route => {
    const url = route.request().url();
    if (url.startsWith('https://')) { await route.abort(); return; }
    try {
        const res = await route.fetch();
        const ct  = res.headers()['content-type'] ?? '';
        if (!ct.includes('text/html')) { await route.fulfill({ response: res }); return; }
        let body = await res.text();
        body = body
            .replace(
                '"three": "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.min.js"',
                '"three": "/node_modules/three/build/three.module.min.js"'
            )
            .replace(
                '"three/addons/": "https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/"',
                '"three/addons/": "/node_modules/three/examples/jsm/"'
            );
        await route.fulfill({ response: res, body });
    } catch { await route.abort(); }
};

// ── Navegar y capturar ─────────────────────────────────────────────────────
async function capturar(browser, ancho, alto, nombreArchivo) {
    const ctx  = await browser.newContext({ viewport: { width: ancho, height: alto } });
    const page = await ctx.newPage();
    await page.route('**', parchearRuta);

    await page.goto(URL_APP, { waitUntil: 'load', timeout: 20000 });
    await page.waitForTimeout(2000);

    // Navegar: Garage → pantalla destino
    await page.click('#btn-garage');
    await page.waitForTimeout(1000);

    // Algunos botones quedan fuera del viewport en landscape → clic por JS
    try {
        await page.click(`#${cfg.btn}`, { timeout: 3000 });
    } catch {
        await page.evaluate(id => document.getElementById(id)?.click(), cfg.btn);
    }

    await page.waitForTimeout(ESPERA);
    await page.screenshot({ path: nombreArchivo });
    await ctx.close();
    console.log('Guardado:', nombreArchivo);
}

// ── Main ───────────────────────────────────────────────────────────────────
const browser = await chromium.launch({ headless: false });

await capturar(browser,  390,  844, `${cfg.salida}_portrait.png`);
await capturar(browser,  844,  390, `${cfg.salida}_landscape.png`);

await browser.close();
console.log('Listo.');
