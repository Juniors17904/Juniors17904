// ================================================================
// Prueba en navegador real del PRD 021 — Estilos de pedales (parte 1 de 2).
// La parte 2 (timones, recordar lo elegido y la pista) está en
// prueba_estilos_timones.mjs. Toques reales (Input.dispatchTouchEvent).
//   RF-01 → "DISEÑAR PEDALES" abre la galería de 4 estilos y marca el elegido
//   RF-02 → el estilo elegido se ve en Jugar Solo; sin elección, Clásico;
//           en Diseño General los botones no cambian
//   RF-03 → los 4 estilos tienen forma o borde distinto y conservan texto
//   RF-04 → con cada estilo la caja que se toca mide 72 px (vertical) /
//           88 px (horizontal), en el mismo lugar y separación; el
//           velocímetro no se mueve
//   RF-05 → apretado se ilumina y se hunde; acelerar y girar a la vez
//   RF-06 → la galería de pedales se ve entera en 390×844 y 844×390
//   Sin errores de consola. Capturas en /tmp/capturas_prd021/.
// ================================================================
import { mkdirSync } from 'fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULO || '/opt/node22/lib/node_modules/playwright/index.mjs');
const URL_JUEGO = 'http://localhost:8099/';
const CARPETA = '/tmp/capturas_prd021';
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
const check = (c, texto) => { const m = 'PRD 021 ' + texto; if (c) { ok++; console.log('OK  ', m); } else { fallos++; console.log('FALLO', m); } };
const erroresReales = errores => errores.filter(t => !/ServiceWorker|sw\.js|ERR_FAILED|bad HTTP response code \(404\)|status of 404/.test(t));
const browser = await chromium.launch({ headless: false, args: ['--use-gl=angle', '--ignore-gpu-blocklist'] });
const esperar = ms => new Promise(r => setTimeout(r, ms));
const ESTILOS = ['clasicos', 'deportivos', 'f1', 'retro'];
const VISTAS = [['vertical', { width: 390, height: 844 }, 72, 85], ['horizontal', { width: 844, height: 390 }, 88, 844 / 4]];

// pedales: lo guardado en tr_controles al abrir (null = nunca se eligió)
async function abrir(vp, pedales = null) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: true, isMobile: true });
  await ctx.addInitScript(p => {
    localStorage.setItem('vc_preferencias', JSON.stringify({ tipoCamara: 'chase', alturaCamara: 2.8, tipoControl: 'timon' }));
    if (p && !sessionStorage.getItem('__prd021')) {
      localStorage.setItem('tr_controles', JSON.stringify({ timon: 'clasico', pedales: p }));
      sessionStorage.setItem('__prd021', '1');
    }
  }, pedales);
  const page = await ctx.newPage();
  const errores = [];
  page.on('pageerror', e => errores.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
  await page.route('**/*', parchear);
  await page.goto(URL_JUEGO);
  await page.waitForTimeout(2000);
  await espiar(page);
  const cdp = await ctx.newCDPSession(page);
  return { ctx, page, errores, cdp };
}
// Espías: el visor de Jugar Solo y dónde se dibuja el velocímetro
const espiar = page => page.evaluate(() => {
  const iniciar = window.VisorCarreraSolo.prototype.iniciar;
  window.VisorCarreraSolo.prototype.iniciar = function (...a) { window.__visor = this; return iniciar.apply(this, a); };
  const dibujar = window.RenderizadorVelocimetro.dibujar.bind(window.RenderizadorVelocimetro);
  window.RenderizadorVelocimetro.dibujar = (c, cx, cy, r, ...resto) => { window.__velocimetro = { x: cx - r, y: cy - r, r: cx + r, b: cy + r }; return dibujar(c, cx, cy, r, ...resto); };
});
const clic = (page, id) => page.evaluate(i => document.getElementById(i).click(), id);
const tocar = (cdp, tipo, dedos) => cdp.send('Input.dispatchTouchEvent', { type: tipo, touchPoints: dedos.map(d => ({ x: d.x, y: d.y, id: d.id, radiusX: 4, radiusY: 4, force: 1 })) });
const entradas = page => page.evaluate(() => ({ giro: window.__visor.entradaDireccion, acel: window.__visor.entradaAcel }));
async function entrarJugarSolo(page) {
  await clic(page, 'btn-solo'); await clic(page, 'btn-correr');
  await page.waitForFunction(() => window.__visor && document.getElementById('cuenta-carrera-solo')?.style.display === 'none', null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(800);
}
const medir = page => page.evaluate(() => {
  const caja = id => { const b = document.getElementById(id).getBoundingClientRect(); return { x: b.left, y: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }; };
  const pedal = id => { const e = document.getElementById(id), c = getComputedStyle(e), a = getComputedStyle(e, '::before');
    return { clases: [...e.classList].filter(k => k.startsWith('pedales-')), texto: (e.textContent || e.getAttribute('aria-label') || '').trim(),
      firma: [c.borderTopWidth, c.borderRadius, c.backgroundImage, a.content, a.width, a.height, a.borderRadius, a.borderTopColor].join('|') }; };
  return { acel: caja('btn-acelerar'), freno: caja('btn-freno'), zona: caja('zona-giro'), vel: window.__velocimetro, pa: pedal('btn-acelerar'), pf: pedal('btn-freno') };
});
// Aspecto de la luz: lo que puede cambiar al apretar en cualquier estilo
const aspecto = (page, id) => page.evaluate(i => { const e = document.getElementById(i), c = getComputedStyle(e), a = getComputedStyle(e, '::before');
  return { clase: e.classList.contains('apretado'), escala: new DOMMatrix(c.transform).a, luz: [c.backgroundColor, c.backgroundImage, c.boxShadow, c.filter, a.boxShadow, a.filter].join('|') }; }, id);
// Espera a que ACEL termine de hundirse (hundido = true) o de volver (false)
const escalaACEL = (page, hundido) => page.waitForFunction(h => { const a = new DOMMatrix(getComputedStyle(document.getElementById('btn-acelerar')).transform).a;
  return h ? a < 0.95 : a > 0.999; }, hundido, { timeout: 3000 }).catch(() => {});
const igual = (a, b) => ['x', 'y', 'w', 'h'].every(k => Math.abs(a[k] - b[k]) < 0.6);

// Comprueba que cada tarjeta del selector se ve entera (desplazando si hace falta)
async function galeriaEntera(page, selector) {
  return page.evaluate(sel => {
    const W = innerWidth, H = innerHeight, malas = [];
    const tarjetas = [...document.querySelectorAll(sel)];
    for (const t of tarjetas) {
      t.scrollIntoView({ block: 'nearest' });
      const b = t.getBoundingClientRect();
      const encima = document.elementFromPoint((b.left + b.right) / 2, (b.top + b.bottom) / 2);
      if (b.left < -0.5 || b.top < -0.5 || b.right > W + 0.5 || b.bottom > H + 0.5 || !t.contains(encima)) malas.push(t.textContent.trim());
    }
    return { cantidad: tarjetas.length, malas, anchoPagina: document.documentElement.scrollWidth <= W + 0.5 };
  }, selector);
}

// ── RF-01 / RF-06 / RF-02: galería de pedales en los dos tamaños; elegir F1 la lleva a Jugar Solo ──
for (const [nombre, vp] of VISTAS) {
  const { ctx, page, errores } = await abrir(vp);
  await clic(page, 'btn-garage'); await clic(page, 'btn-ir-controles'); await page.waitForTimeout(300);
  // Acceso real: el botón se puede tocar (Playwright desplaza y revisa que nada lo tape)
  await page.locator('#btn-disenar-pedales').click({ timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(400);
  const enGaleria = await page.evaluate(() => document.getElementById('pantalla-pedales-diseno').classList.contains('activa'));
  check(enGaleria, `RF-01 (${nombre}) "DISEÑAR PEDALES ›" en Diseño de botones y pedales abre la galería`);
  const tarjetas = await page.evaluate(() => [...document.querySelectorAll('#pantalla-pedales-diseno .pedales-card')].map(t => ({
    clave: t.dataset.pedales, nombre: t.querySelector('.timon-nombre')?.textContent.trim(), sel: t.classList.contains('sel'),
    muestras: [...t.querySelectorAll('.pedal-muestra')].map(m => m.className + '|' + m.textContent.trim()) })));
  check(tarjetas.length === 4 && tarjetas.map(t => t.clave).join() === ESTILOS.join(), `RF-01 (${nombre}) la galería muestra los 4 estilos (${tarjetas.map(t => t.nombre).join(', ')})`);
  check(tarjetas.every(t => t.nombre && t.muestras.length === 2 && t.muestras.every(m => m.includes('pedales-' + t.clave))),
    `RF-01 (${nombre}) cada tarjeta tiene su nombre y una muestra de FRENO y ACEL con su estilo`);
  check(tarjetas.filter(t => t.sel).map(t => t.clave).join() === 'clasicos', `RF-01 (${nombre}) sin elección previa marca el Clásico`);
  const entera = await galeriaEntera(page, '#pantalla-pedales-diseno .pedales-card');
  check(entera.cantidad === 4 && !entera.malas.length && entera.anchoPagina, `RF-06 (${nombre}) la galería de pedales se ve entera ${JSON.stringify(entera)}`);
  await page.evaluate(() => document.getElementById('pantalla-pedales-diseno').scrollTo(0, 0));
  await page.screenshot({ path: `${CARPETA}/galeria_pedales_${nombre}.png` });

  if (nombre === 'vertical') {
    // Se elige F1: queda marcada y llega a Jugar Solo
    await page.locator('#pantalla-pedales-diseno .pedales-card[data-pedales="f1"]').click();
    await page.waitForTimeout(200);
    const marcadas = await page.evaluate(() => [...document.querySelectorAll('#pantalla-pedales-diseno .pedales-card.sel')].map(t => t.dataset.pedales));
    check(marcadas.join() === 'f1', `RF-01 al tocar F1 queda marcada solo F1 (${marcadas})`);
    await clic(page, 'btn-volver-pedales-diseno'); await clic(page, 'btn-volver-controles');
    await clic(page, 'btn-volver-ajustes');
    await entrarJugarSolo(page);
    const m = await medir(page);
    check(m.pa.clases.join() === 'pedales-f1' && m.pf.clases.join() === 'pedales-f1', `RF-02 el estilo elegido (F1) se ve en ACEL y FRENO de Jugar Solo (${m.pa.clases}/${m.pf.clases})`);
  }
  const reales = erroresReales(errores);
  check(reales.length === 0, `(${nombre}) galería sin errores de consola ` + reales.join(' | '));
  await ctx.close();
}

// ── RF-02 / RF-03 / RF-04 / RF-05: cada estilo en Jugar Solo, en los dos tamaños ──
for (const [nombre, vp, lado, recorrido] of VISTAS) {
  let base = null;
  const firmas = {};
  for (const estilo of [null, ...ESTILOS]) {
    const etiqueta = estilo ?? 'sin elección';
    const { ctx, page, errores, cdp } = await abrir(vp, estilo);
    await entrarJugarSolo(page);
    const m = await medir(page);
    if (!estilo) {
      check(m.pa.clases.join() === 'pedales-clasicos' && m.pf.clases.join() === 'pedales-clasicos', `RF-02 (${nombre}) sin elección previa se ve el Clásico (${m.pa.clases})`);
      base = m;
    } else {
      firmas[estilo] = m.pa.firma + '#' + m.pf.firma;
      check(m.pa.clases.join() === 'pedales-' + estilo && m.pf.clases.join() === 'pedales-' + estilo, `RF-02 (${nombre}) ${estilo}: ACEL y FRENO llevan su estilo`);
      check(m.pa.texto === 'ACEL' && m.pf.texto === 'FRENO', `RF-03 (${nombre}) ${estilo}: ACEL y FRENO conservan su nombre (${m.pa.texto}/${m.pf.texto})`);
    }
    // RF-04: la caja que se toca es la del PRD 016 y queda donde estaba
    const separacion = nombre === 'vertical' ? m.freno.y - m.acel.b : m.acel.x - m.freno.r;
    check(Math.abs(m.acel.w - lado) < 0.6 && Math.abs(m.acel.h - lado) < 0.6 && Math.abs(m.freno.w - lado) < 0.6 && Math.abs(m.freno.h - lado) < 0.6,
      `RF-04 (${nombre}) ${etiqueta}: ACEL ${m.acel.w}×${m.acel.h} y FRENO ${m.freno.w}×${m.freno.h} miden ${lado} px`);
    check(igual(m.acel, base.acel) && igual(m.freno, base.freno) && separacion >= 16, `RF-04 (${nombre}) ${etiqueta}: mismo lugar que el Clásico, separación ${separacion.toFixed(0)} px`);
    check(m.vel && base.vel && Math.abs(m.vel.x - base.vel.x) < 1 && Math.abs(m.vel.y - base.vel.y) < 1, `RF-04 (${nombre}) ${etiqueta}: el velocímetro queda donde estaba`);
    if (estilo) await page.screenshot({ path: `${CARPETA}/pedales_${estilo}_${nombre}.png` });

    // RF-05: un dedo gira en la zona y otro aprieta ACEL; luego FRENO
    if (estilo) {
      const suelto = await aspecto(page, 'btn-acelerar');
      const gira = { id: 1, x: m.zona.x + 8, y: m.zona.y + 20 };
      const acel = { id: 2, x: (m.acel.x + m.acel.r) / 2, y: (m.acel.y + m.acel.b) / 2 };
      await tocar(cdp, 'touchStart', [gira]);
      await tocar(cdp, 'touchMove', [{ ...gira, x: gira.x + recorrido }]);
      const girando = { ...gira, x: gira.x + recorrido };
      await tocar(cdp, 'touchStart', [girando, acel]);
      await esperar(250);
      const ambos = await entradas(page);
      // Se espera a que termine la transición: hundido es una escala menor a 1
      await escalaACEL(page, true);
      const apretado = await aspecto(page, 'btn-acelerar');
      check(ambos.acel === 1 && Math.abs(ambos.giro - 1) < 0.02, `RF-05 (${nombre}) ${estilo}: gira y acelera a la vez (${JSON.stringify(ambos)})`);
      check(apretado.clase && apretado.escala < 0.95, `RF-05 (${nombre}) ${estilo}: ACEL apretado se hunde (escala ${apretado.escala.toFixed(2)})`);
      check(apretado.luz !== suelto.luz, `RF-05 (${nombre}) ${estilo}: ACEL apretado se ilumina`);
      if (nombre === 'vertical') await page.screenshot({ path: `${CARPETA}/pedales_${estilo}_apretado.png` });
      await tocar(cdp, 'touchEnd', [acel]);
      await escalaACEL(page, false);
      await esperar(300);
      const solto = await aspecto(page, 'btn-acelerar');
      check(!solto.clase && solto.luz === suelto.luz, `RF-05 (${nombre}) ${estilo}: al soltar ACEL vuelve a su aspecto`);
      const freno = { id: 3, x: (m.freno.x + m.freno.r) / 2, y: (m.freno.y + m.freno.b) / 2 };
      await tocar(cdp, 'touchStart', [freno]);
      await esperar(250);
      const frenando = await entradas(page);
      const fr = await aspecto(page, 'btn-freno');
      check(frenando.acel === -1 && Math.abs(frenando.giro - 1) < 0.02 && fr.clase, `RF-05 (${nombre}) ${estilo}: gira y frena a la vez, FRENO apretado (${JSON.stringify(frenando)})`);
      await tocar(cdp, 'touchEnd', [freno]);
      await tocar(cdp, 'touchEnd', [girando]);
    }
    const reales = erroresReales(errores);
    check(reales.length === 0, `(${nombre}) ${etiqueta}: sin errores de consola ` + reales.join(' | '));
    await ctx.close();
  }
  const distintas = new Set(Object.values(firmas)).size;
  check(distintas === 4, `RF-03 (${nombre}) los 4 estilos se distinguen por su forma o su borde (${distintas} distintos)`);
}

// ── RF-02 / D1: en Diseño General los botones no llevan estilo de pedales ──
{
  const { ctx, page, errores } = await abrir({ width: 390, height: 844 }, 'retro');
  await clic(page, 'btn-garage'); await clic(page, 'btn-ir-diseno-general');
  await page.waitForTimeout(5000);
  const clases = await page.evaluate(() => ['btn-acelerar', 'btn-freno'].map(id => [...document.getElementById(id).classList].filter(k => k.startsWith('pedales-')).join()).join('/'));
  check(clases === '/', `RF-02 con Retro elegido, en Diseño General ACEL y FRENO no cambian (${clases})`);
  const reales = erroresReales(errores);
  check(reales.length === 0, 'Diseño General sin errores de consola ' + reales.join(' | '));
  await ctx.close();
}

await browser.close();
console.log(`\n${ok} OK, ${fallos} fallo(s)`);
process.exitCode = fallos ? 1 : 0;
