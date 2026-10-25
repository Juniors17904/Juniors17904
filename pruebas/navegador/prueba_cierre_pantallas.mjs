// ================================================================
// Prueba en navegador real del PRD 014 — Cierre suave de las pistas abiertas.
//   RF-05 → en Jugar Solo (Costa) se dibujan también las flechas del camino de vuelta
//   RF-06 → Jugar Solo arma la vuelta entera (con el camino de vuelta)
//   RF-07 → Diseño de Pistas muestra el mismo recorrido; su minimapa y el mapa de
//           la pantalla Pistas dibujan la vuelta entera (TrazadoVuelta)
//   Sin errores de consola (lección 8). Capturas en /tmp/capturas_prd014/
//   (lecciones 13 y 16): el camino de vuelta desde arriba y los mapas.
// ================================================================
import { mkdirSync } from 'fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULO || '/opt/node22/lib/node_modules/playwright/index.mjs');
const URL_JUEGO = 'http://localhost:8099/';
const CARPETA = '/tmp/capturas_prd014';
mkdirSync(CARPETA, { recursive: true });
const parchear = async route => {
  const url = route.request().url();
  if (url.startsWith('https://')) { await route.abort(); return; }
  try {
    const res = await route.fetch();
    const ct = res.headers()['content-type'] ?? '';
    if (!ct.includes('text/html')) { await route.fulfill({ response: res }); return; }
    let body = await res.text();
    body = body.replace('https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.min.js','/node_modules/three/build/three.module.min.js')
               .replace('https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/','/node_modules/three/examples/jsm/');
    await route.fulfill({ response: res, body });
  } catch { await route.abort(); }
};
let ok = 0, fallos = 0;
const check = (c, texto) => {
  const m = 'PRD 014 ' + texto;
  if (c) { ok++; console.log('OK  ', m); } else { fallos++; console.log('FALLO', m); }
};
const browser = await chromium.launch({ headless: false, args: ['--use-gl=angle', '--ignore-gpu-blocklist'] });
const clic = (page, id) => page.evaluate(i => document.getElementById(i).click(), id);
const erroresReales = errores => errores.filter(t => !/ServiceWorker|sw\.js|ERR_FAILED|bad HTTP response code \(404\)|status of 404/.test(t));

// Abre el juego con espías: objetos de escena, pisos de pista, la cámara de cada lienzo
// y cada TrazadoVuelta que se arma (cuántos puntos tiene)
async function abrir(ancho, alto) {
  const page = await browser.newPage({ viewport: { width: ancho, height: alto } });
  const errores = [];
  page.on('pageerror', e => errores.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
  await page.route('**/*', parchear);
  await page.goto(URL_JUEGO);
  await page.waitForTimeout(2000);
  await page.evaluate(async () => {
    const THREE = await import('three');
    const { ObjetoEscena } = await import('/src/view/objetos/objeto_escena.js');
    const { ConstructorPisoPista } = await import('/src/view/pistas/comun/constructor_piso_pista.js');
    window.__THREE = THREE; window.__objetos = []; window.__pisos = []; window.__dibujos = {}; window.__trazados = [];
    const construir = ObjetoEscena.prototype.construir;
    ObjetoEscena.prototype.construir = function (scene) { window.__objetos.push(this); return construir.call(this, scene); };
    const construirPiso = ConstructorPisoPista.prototype.construir;
    ConstructorPisoPista.prototype.construir = function () { const g = construirPiso.call(this); window.__pisos.push(g); return g; };
    THREE.Scene.prototype.onBeforeRender = function (renderer, scene, camera) { window.__dibujos[renderer.domElement.id] = { scene, camera }; };
    const Original = window.TrazadoVuelta;
    window.TrazadoVuelta = class extends Original {
      constructor(...a) { super(...a); window.__trazados.push({ puntos: this.puntos.length, pista: this.puntosPista, flechas: this.flechasCierre.length }); }
    };
  });
  return { page, errores };
}

// Elige una pista en la pantalla Pistas (queda en el estado del juego)
async function elegirPista(page, nombre) {
  await clic(page, 'btn-garage'); await page.waitForTimeout(300);
  await clic(page, 'btn-ir-pista'); await page.waitForTimeout(500);
  await page.evaluate(n => document.querySelector(`.pista-card[data-pista="${n}"]`).click(), nombre);
  await page.waitForTimeout(800);
}

// Pone la cámara de un lienzo arriba del centro del camino de vuelta y saca una captura
async function capturaDesdeArriba(page, lienzo, archivo) {
  await page.evaluate(async lienzo => {
    // La cámara del juego deja de seguir al carro y se saca la niebla para ver de lejos
    const { CamaraSeguimiento } = await import('/src/view/camaras/camara_seguimiento.js');
    CamaraSeguimiento.prototype.actualizar = function () {};
    const t = window.__trazados[window.__trazados.length - 1];
    const g = window.__pisos[window.__pisos.length - 1];
    const asfalto = g.getObjectByName('asfalto').geometry.getAttribute('position');
    // Punto del piso a mitad del camino de vuelta: el asfalto se arma en orden a lo largo de la vuelta
    const k = Math.floor(asfalto.count * (t.pista + (t.puntos - t.pista) / 2) / t.puntos);
    const { scene, camera: cam } = window.__dibujos[lienzo];
    scene.fog = null;
    cam.position.set(asfalto.getX(k) + 120, 260, asfalto.getZ(k) + 120);
    cam.lookAt(asfalto.getX(k), 0, asfalto.getZ(k));
    cam.far = Math.max(cam.far, 3000); cam.updateProjectionMatrix();
  }, lienzo);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${CARPETA}/${archivo}` });
}

// ── Pantalla Pistas y Diseño de Pistas en las 4 pistas abiertas (RF-07) ──
const puntosDisenio = {};
for (const nombre of ['costa', 'desierto', 'montana', 'volcan']) {
  const { page, errores } = await abrir(390, 844);
  await elegirPista(page, nombre);
  const mapa = await page.evaluate(() => window.__trazados[window.__trazados.length - 1]);
  check(mapa && mapa.puntos > mapa.pista, `RF-07 el mapa de la pantalla Pistas arma la vuelta entera de ${nombre} (${mapa?.puntos} puntos, la pista ${mapa?.pista})`);
  if (nombre === 'costa') await page.screenshot({ path: `${CARPETA}/pantalla_pistas_costa.png` });
  await clic(page, 'btn-seleccionar-pista');
  await page.waitForTimeout(5000);
  const trazados = await page.evaluate(() => window.__trazados.slice(1));
  puntosDisenio[nombre] = trazados[0]?.puntos;
  check(trazados.length > 0 && trazados.every(t => t.puntos === mapa.puntos),
    `RF-07 Diseño de Pistas (${nombre}) y su minimapa arman la misma vuelta que el mapa (${trazados.map(t => t.puntos).join(', ')} puntos)`);
  if (nombre === 'costa') await page.screenshot({ path: `${CARPETA}/diseno_pistas_costa.png` });
  const reales = erroresReales(errores);
  check(reales.length === 0, `pantalla Pistas y Diseño de Pistas (${nombre}) sin errores de consola ` + reales.join(' | '));
  await page.close();
}

// ── Jugar Solo en las 4 pistas abiertas (RF-05, RF-06) ────────────────
for (const nombre of ['costa', 'desierto', 'montana', 'volcan']) {
  const { page, errores } = await abrir(390, 844);
  await elegirPista(page, nombre);
  await page.evaluate(() => { window.__trazados.length = 0; window.__objetos.length = 0; });
  await page.evaluate(() => document.querySelector('.pantalla.activa .btn-volver, #btn-volver-pista')?.click());
  await page.evaluate(() => history.pushState({ pantalla: 'pantalla-inicio' }, ''));
  await clic(page, 'btn-solo');
  await page.waitForTimeout(6000);
  const r = await page.evaluate(() => {
    const t = window.__trazados[window.__trazados.length - 1];
    const flechas = window.__objetos.filter(o => o.constructor.name === 'FlechaCurvaEscena' && o._grupo?.parent).length;
    return { t, flechas, pantalla: document.querySelector('.pantalla.activa')?.id };
  });
  check(r.pantalla === 'pantalla-carrera-solo' && r.t && r.t.puntos > r.t.pista && r.t.puntos === puntosDisenio[nombre],
    `RF-06/RF-07 Jugar Solo (${nombre}) arma la vuelta entera, la misma que Diseño de Pistas: ${r.t?.puntos} puntos, ${r.t ? r.t.puntos - r.t.pista : 0} del camino de vuelta`);
  check(r.t && r.t.flechas > 0 && r.flechas >= r.t.flechas,
    `RF-05 Jugar Solo (${nombre}) dibuja las ${r.t?.flechas} flechas del camino de vuelta (${r.flechas} flechas en total)`);
  await capturaDesdeArriba(page, 'canvas-carrera-solo', `jugar_solo_${nombre}_camino_de_vuelta.png`);
  const reales = erroresReales(errores);
  check(reales.length === 0, `Jugar Solo (${nombre}) sin errores de consola ` + reales.join(' | '));
  await page.close();
}

await browser.close();
console.log(`\n${ok} OK, ${fallos} fallo(s)`);
process.exitCode = fallos ? 1 : 0;
