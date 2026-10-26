// ================================================================
// Prueba en navegador real del PRD 018 — Modos de carrera y dificultad.
//   RF-01 → "Jugar Solo" abre "Preparar carrera"; "Volver" va a Inicio; "¡Correr!" arranca
//   RF-02 → la pista elegida es la que se corre
//   RF-03/RF-11 → Contrarreloj: sin rivales, sin posición ni tabla, minimapa con un punto
//   RF-04/RF-05/RF-10 → Contra la PC con 2 rivales en Fácil: Prudente y Novato, posición "/3", tabla de 3
//   RF-09 → tras recargar aparece la última elección; Revancha repite la carrera
//   RF-12 → la pantalla se ve completa en 390×844 y 844×390
//   Sin errores de consola. Capturas en /tmp/capturas_prd018/.
// ================================================================
import { mkdirSync } from 'fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULO || '/opt/node22/lib/node_modules/playwright/index.mjs');
const URL_JUEGO = 'http://localhost:8099/';
const CARPETA = '/tmp/capturas_prd018';
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
const check = (c, texto) => { const m = 'PRD 018 ' + texto; if (c) { ok++; console.log('OK  ', m); } else { fallos++; console.log('FALLO', m); } };
const erroresReales = errores => errores.filter(t => !/ServiceWorker|sw\.js|ERR_FAILED|bad HTTP response code \(404\)|status of 404/.test(t));
const browser = await chromium.launch({ headless: false, args: ['--use-gl=angle', '--ignore-gpu-blocklist'] });
const esperar = ms => new Promise(r => setTimeout(r, ms));

// Espías: el visor que se crea (pista y elección), lo que dibuja el HUD y lo que recibe el mapa
const espiar = () => {
  const Original = window.VisorCarreraSolo;
  window.VisorCarreraSolo = class extends Original {
    constructor(canvas, pista, eleccion) { super(canvas, pista, eleccion); window.__pista = pista?.nombre; window.__visor = this; }
  };
  window.__textos = [];
  const dibujar = window.HudCarrera.prototype.dibujar;
  window.HudCarrera.prototype.dibujar = function (...a) { window.__posicion = a[5] ?? ''; return dibujar.apply(this, a); };
  window.__ubicados = [];
  const ubicar = window.MinimapaCarrera.prototype.ubicar;
  window.MinimapaCarrera.prototype.ubicar = function (i, ...r) { window.__ubicados[i] = true; return ubicar.call(this, i, ...r); };
};

async function abrir(ctx) {
  const page = await ctx.newPage();
  const errores = [];
  page.on('pageerror', e => errores.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
  await page.route('**/*', parchear);
  await page.goto(URL_JUEGO);
  await page.waitForTimeout(2000);
  await page.evaluate(espiar);
  return { page, errores };
}
const clic = (page, id) => page.evaluate(i => document.getElementById(i).click(), id);
const elegir = (page, contenedor, clave) => page.evaluate(([c, k]) => document.querySelector(`#${c} .opcion-carrera[data-clave="${k}"]`).click(), [contenedor, clave]);
const activa = page => page.evaluate(() => document.querySelector('.pantalla.activa')?.id);
const marcada = (page, contenedor) => page.evaluate(c => document.querySelector(`#${c} .opcion-carrera.sel`)?.dataset.clave, contenedor);
const visible = (page, id) => page.evaluate(i => { const e = document.getElementById(i); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; }, id);
const esperarCarrera = page => page.waitForFunction(() => window.__visor && document.getElementById('cuenta-carrera-solo')?.style.display === 'none', null, { timeout: 25000 }).then(() => true, () => false);
const forzarMeta = page => page.evaluate(() => { const o = window.CarreraVueltas.prototype.actualizar; window.__original = o; window.CarreraVueltas.prototype.actualizar = function (...a) { o.apply(this, a); return 'meta'; }; });
const quitarMeta = page => page.evaluate(() => { window.CarreraVueltas.prototype.actualizar = window.__original; });

for (const [nombre, vp] of [['vertical', { width: 390, height: 844 }], ['horizontal', { width: 844, height: 390 }]]) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: true, isMobile: true });
  await ctx.addInitScript(() => localStorage.setItem('vc_preferencias', JSON.stringify({ tipoCamara: 'chase', alturaCamara: 2.8, tipoControl: 'timon' })));
  let { page, errores } = await abrir(ctx);

  // RF-01: Jugar Solo abre "Preparar carrera", no la carrera
  await clic(page, 'btn-solo'); await esperar(400);
  check(await activa(page) === 'pantalla-preparar-carrera' && !(await page.evaluate(() => !!window.__visor)), `RF-01 (${nombre}) "Jugar Solo" abre "Preparar carrera"`);
  check(await marcada(page, 'opciones-modo') === 'contra-pc' && await marcada(page, 'opciones-rivales') === '4' && await marcada(page, 'opciones-dificultad') === 'normal',
    `RF-04 (${nombre}) por omisión: Contra la PC, 4 rivales, Normal`);
  // RF-12: todo se ve y entra en la pantalla
  const caja = await page.evaluate(() => {
    const ids = ['opciones-modo', 'opciones-pista', 'opciones-rivales', 'opciones-dificultad', 'btn-correr', 'btn-volver-preparar'];
    return ids.map(i => { const b = document.getElementById(i).getBoundingClientRect(); return { i, x: b.left, y: b.top, r: b.right, b: b.bottom, w: b.width }; });
  });
  const dentro = caja.every(b => b.w > 0 && b.x >= 0 && b.r <= vp.width + 0.5 && b.y >= 0 && b.b <= vp.height + 0.5);
  check(dentro, `RF-12 (${nombre}) la pantalla se ve completa, sin cortes (${JSON.stringify(caja.filter(b => !(b.x >= 0 && b.r <= vp.width + 0.5 && b.y >= 0 && b.b <= vp.height + 0.5)))})`);
  const botonesChicos = await page.evaluate(() => [...document.querySelectorAll('#pantalla-preparar-carrera .opcion-carrera')].filter(b => b.getBoundingClientRect().height < 32).length);
  check(botonesChicos === 0, `RF-12 (${nombre}) las opciones se pueden tocar (alto de 32 px o más)`);
  await page.screenshot({ path: `${CARPETA}/preparar_${nombre}.png` });
  // Volver
  await clic(page, 'btn-volver-preparar'); await esperar(300);
  check(await activa(page) === 'pantalla-inicio', `RF-01 (${nombre}) "Volver" regresa a Inicio`);

  // RF-03/RF-11/RF-02: Contrarreloj en Costa
  await clic(page, 'btn-solo'); await esperar(300);
  await elegir(page, 'opciones-modo', 'contrarreloj');
  await elegir(page, 'opciones-pista', 'costa');
  check(!(await visible(page, 'campo-rivales')) && !(await visible(page, 'campo-dificultad')), `D6 (${nombre}) en Contrarreloj no se muestran rivales ni dificultad`);
  if (nombre === 'vertical') await page.screenshot({ path: `${CARPETA}/preparar_contrarreloj.png` });
  await clic(page, 'btn-correr');
  check(await esperarCarrera(page), `RF-01 (${nombre}) "¡Correr!" arranca la carrera`);
  await esperar(800);
  const solo = await page.evaluate(() => ({ rivales: window.__visor.rivales, pista: window.__pista, posicion: window.__posicion, puntos: window.__ubicados.filter(Boolean).length }));
  check(solo.rivales === null, `RF-03 (${nombre}) en Contrarreloj no hay rivales en la pista`);
  check(solo.pista === 'Costa Neón', `RF-02 (${nombre}) se corre la pista elegida (${solo.pista})`);
  check(solo.posicion === '' && solo.puntos === 1, `RF-11 (${nombre}) sin posición y con un solo punto en el mapa (${JSON.stringify(solo.posicion)}, ${solo.puntos})`);
  await page.screenshot({ path: `${CARPETA}/contrarreloj_${nombre}.png` });
  await forzarMeta(page); await esperar(900);
  const resultado = await page.evaluate(() => {
    const panel = document.getElementById('resultado-carrera-solo'), tabla = panel.querySelector('.resultado-carrera-tabla');
    return { visible: getComputedStyle(panel).display !== 'none', tabla: tabla ? getComputedStyle(tabla).display !== 'none' && tabla.children.length > 0 : false, texto: panel.textContent };
  });
  check(resultado.visible && !resultado.tabla && /mejor/i.test(resultado.texto), `RF-11 (${nombre}) el resultado muestra tiempo y mejor vuelta, sin tabla de puestos`);
  await quitarMeta(page);

  // RF-09: tras recargar aparece la última elección
  await page.close();
  ({ page, errores } = await abrir(ctx));
  await clic(page, 'btn-solo'); await esperar(300);
  check(await marcada(page, 'opciones-modo') === 'contrarreloj' && await marcada(page, 'opciones-pista') === 'costa', `RF-09 (${nombre}) tras recargar aparece la última elección`);

  // RF-04/RF-05/RF-10: Contra la PC, 2 rivales, Fácil
  await elegir(page, 'opciones-modo', 'contra-pc');
  await elegir(page, 'opciones-rivales', '2');
  await elegir(page, 'opciones-dificultad', 'facil');
  await elegir(page, 'opciones-pista', 'ciudad');
  await clic(page, 'btn-correr');
  check(await esperarCarrera(page), `(${nombre}) Contra la PC arranca`);
  await esperar(800);
  const contra = await page.evaluate(() => ({ nombres: window.__visor.rivales?.rivales.map(r => r.nombre.split(' · ')[1]), posicion: window.__posicion, puntos: window.__ubicados.filter(Boolean).length }));
  check(contra.nombres?.join() === 'Prudente,Novato', `RF-04/RF-05 (${nombre}) 2 rivales en Fácil: Prudente y Novato (${contra.nombres})`);
  check(/^\d\.º\/3$/.test(contra.posicion) && contra.puntos === 3, `RF-10 (${nombre}) la posición dice "/3" y el mapa tiene 3 puntos (${contra.posicion})`);
  await forzarMeta(page); await esperar(900);
  const filas = await page.evaluate(() => document.querySelector('#resultado-carrera-solo .resultado-carrera-tabla')?.children.length ?? 0);
  check(filas === 3, `RF-10 (${nombre}) la tabla final tiene 3 puestos (${filas})`);
  await quitarMeta(page);
  // Revancha repite la misma carrera
  await clic(page, 'btn-revancha-solo');
  await esperar(1500);
  const revancha = await page.evaluate(() => ({ n: window.__visor.rivales?.rivales.length, pantalla: document.querySelector('.pantalla.activa')?.id }));
  check(revancha.n === 2 && revancha.pantalla === 'pantalla-carrera-solo', `RF-09 (${nombre}) Revancha repite la carrera con los mismos 2 rivales`);
  const reales = erroresReales(errores);
  check(reales.length === 0, `(${nombre}) sin errores de consola ` + reales.join(' | '));
  await ctx.close();
}

await browser.close();
console.log(`\n${ok} OK, ${fallos} fallo(s)`);
process.exitCode = fallos ? 1 : 0;
