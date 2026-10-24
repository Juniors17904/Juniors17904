// ================================================================
// Prueba en navegador real del PRD 008 — Superficie y choques en Jugar Solo.
//   RF-05 → el carro no atraviesa un árbol de la pista
//   RF-07 → al chocar de frente rebota
//   RF-09 → chocar no reinicia la carrera ni detiene el cronómetro, ni daña el carro
//   Sin errores de consola (lección 8)
// Espía el Carro real (mismo módulo que usa el visor) y el Cronometro.
// ================================================================
const { chromium } = await import(process.env.PLAYWRIGHT_MODULO || '/opt/node22/lib/node_modules/playwright/index.mjs');
const URL_JUEGO = 'http://localhost:8099/';
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
const check = (c, m) => { if (c) { ok++; console.log('OK  ', m); } else { fallos++; console.log('FALLO', m); } };
const browser = await chromium.launch({ headless: false, args: ['--use-gl=angle', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errores = [];
page.on('pageerror', e => errores.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
await page.route('**/*', parchear);
await page.goto(URL_JUEGO);
await page.waitForTimeout(2000);

// Espías: el carro que maneja el visor, sus rebotes y el último tiempo del cronómetro
await page.evaluate(async () => {
  const { Carro } = await import('/src/model/carros/carro.js');
  const actualizar = Carro.prototype.actualizar, rebotar = Carro.prototype.rebotar;
  window.__rebotes = []; window.__distMin = Infinity;
  Carro.prototype.actualizar = function (dt) {
    // Posición ya resuelta del paso anterior (la que se dibuja), antes de mover
    window.__carro = this;
    if (window.__arbol) window.__distMin = Math.min(window.__distMin, Math.hypot(this.px - window.__arbol.x, this.pz - window.__arbol.z));
    actualizar.call(this, dt);
  };
  Carro.prototype.rebotar = function (px, pz, factor) {
    window.__rebotes.push({ antes: this.velocidad, factor });
    rebotar.call(this, px, pz, factor);
    if (window.__arbol) window.__distMin = Math.min(window.__distMin, Math.hypot(this.px - window.__arbol.x, this.pz - window.__arbol.z));
  };
  const formatear = window.Cronometro.prototype.formatear;
  window.Cronometro.prototype.formatear = function (ms) { window.__tiempo = ms; return formatear.call(this, ms); };
});

await page.evaluate(() => document.getElementById('btn-solo').click());
const ya = await page.waitForFunction(() => document.getElementById('cuenta-carrera-solo')?.textContent === '¡YA!',
  null, { timeout: 15000 }).then(() => true, () => false);
check(ya, 'la carrera arranca (¡YA!)');
await page.waitForTimeout(300);

// Pone el carro 8 m antes del primer árbol, apuntando hacia él (mismo rumbo que tiene)
const arbol = await page.evaluate(async () => {
  const { Ruta } = await import('/src/model/ruta.js');
  const { DetectorChoques } = await import('/src/model/choques/detector_choques.js');
  const pista = window.registroPistas.obtener('ciudad'), ruta = new Ruta();
  ruta.construir(pista.tramos, pista.totalSegs);
  const a = new DetectorChoques(pista.decoraciones, ruta).objetos.find(o => o.tipo === 'arbol');
  const c = window.__carro;
  window.__arbol = { x: a.x, z: a.z, radio: a.radio };
  c.setPosicion(a.x - Math.sin(c.velAngle) * 8, a.z - Math.cos(c.velAngle) * 8);
  window.__distMin = Infinity;
  return window.__arbol;
});
check(!!arbol, 'hay un árbol sólido en Ciudad');

// Ficha del carro antes del choque: mismas constantes = sin daño (RF-09)
const fichaCarro = () => page.evaluate(() => {
  const c = window.__carro, k = c.constantes;
  window.__carroAntes ??= c;
  return { mismo: c === window.__carroAntes, velMaxAdelante: k.velMaxAdelante,
    aceleracion: k.aceleracion, freno: k.freno, direccion: k.direccion, agarre: k.agarre, masa: k.masa };
});
const antes = await fichaCarro();
const t0 = await page.evaluate(() => window.__tiempo);
await page.keyboard.down('ArrowUp');
await page.waitForTimeout(2500);
await page.keyboard.up('ArrowUp');
const r = await page.evaluate(() => ({
  rebotes: window.__rebotes, distMin: window.__distMin, tiempo: window.__tiempo,
  pantalla: document.querySelector('.pantalla.activa')?.id,
}));
check(r.rebotes.length > 0, `RF-05 el carro choca con el árbol (${r.rebotes.length} choques)`);
check(r.distMin >= arbol.radio + 0.8 - 1e-6, `RF-05 nunca entra en el árbol (distancia mínima ${r.distMin.toFixed(2)})`);
check(r.rebotes.some(x => x.factor < 0), 'RF-07 de frente rebota hacia atrás');
check(r.pantalla === 'pantalla-carrera-solo', 'RF-09 la carrera sigue en pantalla (sin reinicio)');
check(r.tiempo > t0 + 2000, `RF-09 el cronómetro sigue corriendo (${t0} → ${r.tiempo} ms)`);
const despues = await fichaCarro();
check(despues.mismo, 'RF-09 sigue siendo el mismo carro (no se reinicia)');
check(['velMaxAdelante','aceleracion','freno','direccion','agarre','masa'].every(k => despues[k] === antes[k]),
  `RF-09 chocar no daña el carro: tope, aceleración, freno, dirección, agarre y masa iguales (${JSON.stringify(despues)})`);

const reales = errores.filter(t => !/ServiceWorker|sw\.js|ERR_FAILED|bad HTTP response code \(404\)|status of 404/.test(t));
check(reales.length === 0, 'sin errores de consola ' + reales.join(' | '));
await page.screenshot({ path: '/tmp/choque_carrera_solo.png' });
await browser.close();
console.log(`\n${ok} OK, ${fallos} fallo(s)`);
process.exitCode = fallos ? 1 : 0;
