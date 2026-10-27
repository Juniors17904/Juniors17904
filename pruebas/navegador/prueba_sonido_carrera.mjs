// ================================================================
// Prueba en navegador real del PRD 022 — Sonido en Jugar Solo.
// No se puede escuchar: se espía el audio del navegador (qué tonos se piden).
//   RF-01/D7 → el audio nace con el toque en "¡Correr!" y con ¡YA! arranca el motor
//   RF-02 → pitidos de la cuenta (tres iguales y ¡YA! más agudo)
//   RF-07 → el botón 🔊/🔇 se ve en la carrera y en "Preparar carrera", sin tapar nada
//   RF-08 → 🔇 deja el volumen en cero y se recuerda al recargar
//   RF-09 → con la página oculta se pausa; al salir de la carrera el motor se calla
//   RF-10 → en Diseño de Pistas no se crea audio
//   Sin errores de consola. Capturas en /tmp/capturas_prd022/.
// ================================================================
import { mkdirSync } from 'fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULO || '/opt/node22/lib/node_modules/playwright/index.mjs');
const URL_JUEGO = 'http://localhost:8099/';
const CARPETA = '/tmp/capturas_prd022';
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
const check = (c, texto) => { const m = 'PRD 022 ' + texto; if (c) { ok++; console.log('OK  ', m); } else { fallos++; console.log('FALLO', m); } };
const erroresReales = errores => errores.filter(t => !/ServiceWorker|sw\.js|ERR_FAILED|bad HTTP response code \(404\)|status of 404/.test(t));
const browser = await chromium.launch({ headless: false, args: ['--use-gl=angle', '--ignore-gpu-blocklist'] });
const esperar = ms => new Promise(r => setTimeout(r, ms));

// Espía del audio: cada contexto, cada oscilador (tipo, frecuencia, si sigue sonando) y el volumen general
const espiarAudio = () => {
  window.__audio = { contextos: [], osciladores: [], enClic: false };
  const Original = window.AudioContext;
  window.AudioContext = class extends Original {
    constructor(...a) {
      super(...a);
      window.__audio.contextos.push(this);
      window.__audio.creadoEnClic = window.__audio.enClic;
      const crearGain = this.createGain.bind(this), crearOsc = this.createOscillator.bind(this);
      this.createGain = () => { const g = crearGain(); (window.__audio.ganancias ??= []).push(g); return g; };
      this.createOscillator = () => {
        const o = crearOsc(), registro = { tipo: '', freq: 0, sonando: false };
        window.__audio.osciladores.push(registro);
        const start = o.start.bind(o), stop = o.stop.bind(o), fijar = o.frequency.setValueAtTime.bind(o.frequency);
        o.frequency.setValueAtTime = (v, t) => { registro.freq = v; return fijar(v, t); };   // la frecuencia pedida (value no la muestra aún)
        o.start = (...x) => { registro.tipo = o.type; registro.freq ||= o.frequency.value; registro.sonando = true; return start(...x); };
        o.stop = (...x) => { if (!x.length || x[0] <= this.currentTime + 0.001) registro.sonando = false; return stop(...x); };
        return o;
      };
    }
  };
  document.addEventListener('click', e => { if (e.target?.id === 'btn-correr') window.__audio.enClic = true; }, true);
  document.addEventListener('click', e => { if (e.target?.id === 'btn-correr') setTimeout(() => { window.__audio.enClic = false; }); }, false);
};

async function abrir(ctx) {
  const page = await ctx.newPage();
  const errores = [];
  page.on('pageerror', e => errores.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
  await page.route('**/*', parchear);
  await page.goto(URL_JUEGO);
  await page.waitForTimeout(2000);
  return { page, errores };
}
const clic = (page, id) => page.evaluate(i => document.getElementById(i).click(), id);
const caja = (page, id) => page.evaluate(i => { const e = document.getElementById(i); if (!e || getComputedStyle(e).display === 'none') return null;
  const b = e.getBoundingClientRect(); return b.width > 0 ? { x: b.left, y: b.top, r: b.right, b: b.bottom } : null; }, id);
const solapa = (a, b) => a && b && a.x < b.r && b.x < a.r && a.y < b.b && b.y < a.b;
const esperarCarrera = page => page.waitForFunction(() => document.querySelector('.pantalla.activa')?.id === 'pantalla-carrera-solo'
  && document.getElementById('cuenta-carrera-solo')?.style.display === 'none', null, { timeout: 25000 }).then(() => true, () => false);

for (const [nombre, vp] of [['vertical', { width: 390, height: 844 }], ['horizontal', { width: 844, height: 390 }]]) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: true, isMobile: true });
  await ctx.addInitScript(() => {
    localStorage.setItem('vc_preferencias', JSON.stringify({ tipoCamara: 'chase', alturaCamara: 2.8, tipoControl: 'timon' }));
    if (!localStorage.getItem('__prueba_limpia')) { localStorage.removeItem('tr_sonido'); localStorage.setItem('__prueba_limpia', '1'); }
  });
  await ctx.addInitScript(espiarAudio);
  let { page, errores } = await abrir(ctx);
  await clic(page, 'btn-solo'); await esperar(300);
  check((await page.evaluate(() => window.__audio.contextos.length)) === 0, `D7 (${nombre}) sin tocar "¡Correr!" no hay audio`);
  const enPreparar = await caja(page, 'btn-sonido-preparar');
  const botonPrep = await page.evaluate(() => document.getElementById('btn-sonido-preparar').textContent);
  check(enPreparar && enPreparar.r <= vp.width && enPreparar.b <= vp.height && botonPrep === '🔊', `RF-07/RF-08 (${nombre}) en "Preparar carrera" se ve el botón, prendido la primera vez`);
  await page.click('#btn-correr');
  check(await page.evaluate(() => window.__audio.contextos.length === 1 && window.__audio.creadoEnClic), `RF-01/D7 (${nombre}) el audio nace con el toque en "¡Correr!"`);
  check(await esperarCarrera(page), `(${nombre}) la carrera arranca`);
  await esperar(400);
  const sonidos = await page.evaluate(() => window.__audio.osciladores.map(o => ({ tipo: o.tipo, freq: o.freq, sonando: o.sonando })));
  const pitidos = sonidos.filter(o => o.tipo === 'square' && (o.freq === 440 || o.freq === 880));
  check(pitidos.filter(o => o.freq === 440).length === 3 && pitidos.filter(o => o.freq === 880).length === 1, `RF-02 (${nombre}) tres pitidos y uno más agudo en ¡YA! (${pitidos.map(o => o.freq)})`);
  check(sonidos.some(o => o.tipo === 'sawtooth' && o.sonando), `RF-01 (${nombre}) con ¡YA! suena el motor`);
  // RF-07: el botón de la carrera no tapa nada
  const m = { boton: await caja(page, 'btn-sonido-carrera'), mapa: await caja(page, 'minimapa-carrera-solo'), acel: await caja(page, 'btn-acelerar'),
    freno: await caja(page, 'btn-freno'), timon: await caja(page, 'canvas-timon') };
  check(m.boton && m.boton.y >= 52 && m.boton.x >= 0 && ![m.mapa, m.acel, m.freno, m.timon].some(b => solapa(m.boton, b)),
    `RF-07 (${nombre}) el botón de la carrera queda bajo la barra y no tapa el mapa ni los controles (${JSON.stringify(m.boton)})`);
  await page.screenshot({ path: `${CARPETA}/carrera_${nombre}.png` });
  // RF-08: 🔇 deja el volumen general en cero
  await page.click('#btn-sonido-carrera');
  const silencio = await page.evaluate(() => ({ texto: document.getElementById('btn-sonido-carrera').textContent, otro: document.getElementById('btn-sonido-preparar').textContent,
    volumen: window.__audio.ganancias[0].gain.value }));
  check(silencio.texto === '🔇' && silencio.otro === '🔇' && silencio.volumen === 0, `RF-08 (${nombre}) con 🔇 el volumen queda en cero y los dos botones lo muestran (${JSON.stringify(silencio)})`);
  // RF-09: página oculta → pausa
  const pausa = await page.evaluate(async () => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise(r => setTimeout(r, 300));
    const oculto = window.__audio.contextos[0].state;
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise(r => setTimeout(r, 300));
    return { oculto, visible: window.__audio.contextos[0].state };
  });
  check(pausa.oculto === 'suspended' && pausa.visible === 'running', `RF-09 (${nombre}) con la página oculta se pausa y vuelve con la carrera en curso (${JSON.stringify(pausa)})`);
  // RF-09: al salir de la carrera el motor se calla
  await page.goBack(); await esperar(600);
  check(await page.evaluate(() => !window.__audio.osciladores.some(o => o.tipo === 'sawtooth' && o.sonando)), `RF-09 (${nombre}) al salir de la carrera el motor se calla`);
  // RF-08: se recuerda al recargar
  await page.close();
  ({ page, errores } = await abrir(ctx));
  await clic(page, 'btn-solo'); await esperar(300);
  check(await page.evaluate(() => document.getElementById('btn-sonido-preparar').textContent) === '🔇', `RF-08 (${nombre}) 🔇 se recuerda al recargar`);
  await page.click('#btn-sonido-preparar');
  check(await page.evaluate(() => document.getElementById('btn-sonido-preparar').textContent) === '🔊', `RF-08 (${nombre}) se vuelve a prender con un toque`);
  await page.screenshot({ path: `${CARPETA}/preparar_${nombre}.png` });
  const reales = erroresReales(errores);
  check(reales.length === 0, `(${nombre}) sin errores de consola ` + reales.join(' | '));
  await ctx.close();
}

// ── RF-10: en Diseño de Pistas no se crea audio ──
{
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 } });
  await ctx.addInitScript(espiarAudio);
  const { page, errores } = await abrir(ctx);
  await clic(page, 'btn-garage'); await esperar(300);
  await clic(page, 'btn-ir-pista'); await esperar(500);
  await clic(page, 'btn-seleccionar-pista'); await esperar(4000);
  const activa = await page.evaluate(() => document.querySelector('.pantalla.activa')?.id);
  check(activa === 'pantalla-juego' && await page.evaluate(() => window.__audio.contextos.length === 0), `RF-10 en Diseño de Pistas no suena nada (${activa})`);
  const reales = erroresReales(errores);
  check(reales.length === 0, 'Diseño de Pistas sin errores de consola ' + reales.join(' | '));
  await ctx.close();
}

await browser.close();
console.log(`\n${ok} OK, ${fallos} fallo(s)`);
process.exitCode = fallos ? 1 : 0;
