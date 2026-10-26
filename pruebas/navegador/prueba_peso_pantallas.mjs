// ================================================================
// Prueba en navegador real del PRD 019 — Peso del carro al girar.
//   RF-09 → en las 5 pantallas 3D (Test Drive Simple, Test Drive Con Ruta,
//           Diseño de Pistas → Entrar, Diseño General y Jugar Solo) el carro
//           que se maneja usa la misma regla: acelerando, factorPeso baja de 1
//           (gira un poco más abierto) y al soltar el acelerador con el volante
//           girado sube por encima de 1 (gira más cerrado)
//   RF-09 → en Jugar Solo los rivales (otros Carro, distintos del jugador)
//           también usan la regla: su factorPeso cambia mientras corren
//   Sin errores de consola (lección 8)
// Espía Carro.prototype.actualizar (mismo módulo que usan los visores) para
// guardar cada carro activo y el rango de su factorPeso, y
// ConductorPasoFijo.prototype.avanzar para saber cuál es el del jugador.
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
const clic = (page, id) => page.evaluate(i => document.getElementById(i).click(), id);
const reales = errores => errores.filter(t => !/ServiceWorker|sw\.js|ERR_FAILED|bad HTTP response code \(404\)|status of 404/.test(t));

const PANTALLAS = [
  { nombre: 'Test Drive Simple',   pasos: ['btn-garage', 'btn-test-drive-3d', 'btn-td3d-simple'], espera: 4500 },
  { nombre: 'Test Drive Con Ruta', pasos: ['btn-garage', 'btn-test-drive-3d', 'btn-td3d-con-ruta'], espera: 4500 },
  { nombre: 'Diseño de Pistas',    pasos: ['btn-garage', 'btn-ir-pista', '.pista-card[data-pista="ciudad"]', 'btn-seleccionar-pista'], espera: 4500 },
  { nombre: 'Diseño General',      pasos: ['btn-garage', 'btn-ir-diseno-general'], espera: 5000 },
  { nombre: 'Jugar Solo',          pasos: ['btn-solo', 'btn-correr'], espera: 7000, vertical: true, rivales: true },
];

// Espías: cada Carro que avanza queda en __carros con el rango de su factorPeso
async function espiar(page) {
  await page.evaluate(async () => {
    const { Carro } = await import('/src/model/carros/carro.js');
    const { ConductorPasoFijo } = await import('/src/view/pistas/comun/conductor_paso_fijo.js');
    window.__carros = new Map();
    window.__jugador = null;
    const actualizar = Carro.prototype.actualizar;
    Carro.prototype.actualizar = function (...a) {
      const r = actualizar.apply(this, a);
      const f = this.factorPeso, d = window.__carros.get(this);
      if (d) { d.min = Math.min(d.min, f); d.max = Math.max(d.max, f); d.pasos++; }
      else window.__carros.set(this, { min: f, max: f, pasos: 1 });
      return r;
    };
    const avanzar = ConductorPasoFijo.prototype.avanzar;
    ConductorPasoFijo.prototype.avanzar = function (...a) { if (this.carro) window.__jugador = this.carro; return avanzar.apply(this, a); };
  });
}

// El carro del jugador: el del ConductorPasoFijo o, si la pantalla no lo usa, el único que avanza
const leerJugador = page => page.evaluate(() => {
  const carros = [...window.__carros.keys()];
  const j = window.__jugador ?? (carros.length === 1 ? carros[0] : null);
  return j ? { factor: j.factorPeso, vel: j.velocidad, acel: j.entradaAcel, dir: j.entradaDireccion, total: carros.length } : null;
});

// Gira el volante a la izquierda con todo lo que lo mueve: la flecha (ControlTeclado)
// y un arrastre del mouse sobre el timón o la zona de giro de Jugar Solo (ControlTimon)
async function girar(page, activo) {
  if (activo) await page.keyboard.down('ArrowLeft'); else await page.keyboard.up('ArrowLeft');
  await page.evaluate(activo => {
    const visible = el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none';
    const zona = document.getElementById('zona-giro');
    const el = visible(zona) ? zona : [...document.querySelectorAll('#ctrl-timon canvas')].find(visible);
    if (!el) return;
    if (!activo) { window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true })); return; }
    const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: x, clientY: y }));
    window.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: x - 400, clientY: y }));
  }, activo);
}

for (const p of PANTALLAS) {
  const page = await browser.newPage({ viewport: p.vertical ? { width: 390, height: 844 } : { width: 844, height: 390 } });
  const errores = [];
  page.on('pageerror', e => errores.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
  await page.route('**/*', parchear);
  await page.goto(URL_JUEGO);
  await page.waitForTimeout(1500);
  await espiar(page);
  for (const paso of p.pasos) {
    if (paso.startsWith('.')) await page.evaluate(s => document.querySelector(s).click(), paso);
    else await clic(page, paso);
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(p.espera);

  // Acelera un momento: el peso va atrás y factorPeso baja de 1
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(1500);
  const acelerando = await leerJugador(page);
  check(acelerando !== null && acelerando.vel > 0 && acelerando.factor < 1,
    `PRD 019 RF-09 ${p.nombre}: acelerando, factorPeso baja de 1 (${acelerando?.factor?.toFixed(4)}, vel ${acelerando?.vel?.toFixed(3)})`);

  // Suelta el acelerador con el volante girado: el peso va adelante y factorPeso sube de 1
  await girar(page, true);
  await page.keyboard.up('ArrowUp');
  await page.waitForTimeout(700);
  const soltado = await leerJugador(page);
  await girar(page, false);
  check(soltado !== null && soltado.acel === 0 && soltado.dir !== 0 && soltado.factor > 1,
    `PRD 019 RF-09 ${p.nombre}: al soltar con el volante girado, factorPeso sube de 1 (${soltado?.factor?.toFixed(4)}, dirección ${soltado?.dir})`);

  if (p.rivales) {
    // Los rivales corren con el mismo Carro: su factorPeso cambia mientras corren
    await page.waitForTimeout(2000);
    const rivales = await page.evaluate(() => [...window.__carros].filter(([c]) => c !== window.__jugador)
      .map(([, d]) => ({ min: d.min, max: d.max, pasos: d.pasos })));
    check(rivales.length >= 1, `PRD 019 RF-09 Jugar Solo: hay rivales que son Carro distintos del jugador (${rivales.length})`);
    check(rivales.length >= 1 && rivales.every(r => r.pasos > 60 && r.max - r.min > 0.01),
      `PRD 019 RF-09 Jugar Solo: el factorPeso de cada rival cambia (${rivales.map(r => `${r.min.toFixed(3)}..${r.max.toFixed(3)}`).join(' · ')})`);
  }
  check(reales(errores).length === 0, `PRD 019 RF-09 ${p.nombre}: sin errores de consola ${reales(errores).join(' | ')}`);
  await page.close();
}

await browser.close();
console.log(`\n${ok} OK, ${fallos} fallo(s)`);
process.exitCode = fallos ? 1 : 0;
