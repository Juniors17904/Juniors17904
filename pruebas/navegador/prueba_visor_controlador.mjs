// Prueba de navegador: RF-03, RF-04, RF-09, RF-11, RF-12, RF-13, RF-14, RF-15 y RNF-01
// del PRD docs/prds/prd_001_carrera_solo_vertical.md y RF-01/RF-02 del PRD 008 (pasto, que
// reemplaza al RF-07 del PRD 001). Usa el visor y el controlador reales.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULO || '/opt/node22/lib/node_modules/playwright/index.mjs');

const URL_APP = 'http://localhost:8099/';
const parchear = (bloquearVisor, colgarGlb) => async route => {
  const url = route.request().url();
  if (url.startsWith('https://')) { await route.abort(); return; }
  if (bloquearVisor && url.includes('visor_carrera_solo.js')) { await route.abort(); return; }
  // GLB colgado: la petición queda abierta para siempre (ni fulfill ni abort)
  if (colgarGlb && /\.glb(\?|$)/.test(url)) return;
  try {
    const res = await route.fetch();
    const ct = res.headers()['content-type'] ?? '';
    if (!ct.includes('text/html')) { await route.fulfill({ response: res }); return; }
    const body = (await res.text())
      .replace('https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.min.js', '/node_modules/three/build/three.module.min.js')
      .replace('https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/', '/node_modules/three/examples/jsm/');
    await route.fulfill({ response: res, body });
  } catch { await route.abort(); }
};

let fallos = 0;
const check = (c, m) => { console.log(c ? 'OK   ' : 'FALLO', m); if (!c) fallos++; };

const browser = await chromium.launch({ headless: false, args: ['--use-gl=angle', '--ignore-gpu-blocklist'] });

async function abrir(viewport, { bloquearVisor = false, colgarGlb = false, movil = true } = {}) {
  const ctx  = await browser.newContext({ viewport, hasTouch: movil, isMobile: movil });
  const page = await ctx.newPage();
  const errores = [];
  // Se ignoran el ServiceWorker (ruta de GitHub Pages, no existe en local) y las URLs https bloqueadas
  const ignorar = t => /ServiceWorker|sw\.js|ERR_FAILED|bad HTTP response code \(404\)/.test(t);
  page.on('pageerror', e => { if (!ignorar(e.message)) errores.push(e.message); });
  await page.route('**', parchear(bloquearVisor, colgarGlb));
  await page.goto(URL_APP, { waitUntil: 'load' });
  await page.waitForTimeout(2500);
  return { ctx, page, errores };
}

// Crea un visor real sobre el canvas de la pantalla y registra los FOV que fija la cámara
async function crearVisor(page, clavePista = 'ciudad') {
  return page.evaluate(async clave => {
    const THREE = await import('three');
    window.__fovs = [];
    const orig = THREE.PerspectiveCamera.prototype.updateProjectionMatrix;
    THREE.PerspectiveCamera.prototype.updateProjectionMatrix = function () {
      window.__fovs.push(this.fov);
      return orig.call(this);
    };
    const canvas = document.getElementById('canvas-carrera-solo');
    window.__visor = new window.VisorCarreraSolo(canvas, window.registroPistas.obtener(clave));
    await window.__visor.cargar('deportivo', '#ef4444');
    window.__visor.iniciar();
    return true;
  }, clavePista);
}
const esperar = (page, ms) => page.waitForTimeout(ms);
const leer    = (page, fn) => page.evaluate(fn);

// ── Móvil 390×844 ─────────────────────────────────────────────
{
  const { ctx, page, errores } = await abrir({ width: 390, height: 844 });

  // RNF-01
  const herencia = await leer(page, () => ({
    tipo:  typeof window.VisorCarreraSolo,
    padre: Object.getPrototypeOf(window.VisorCarreraSolo)?.name,
  }));
  check(herencia.tipo === 'function' && herencia.padre === 'VisorBase', 'RNF-01 VisorCarreraSolo extiende VisorBase ' + JSON.stringify(herencia));

  await crearVisor(page);
  await esperar(page, 800);

  // RF-14: FOV vertical
  const fovMovil = await leer(page, () => window.__fovs.at(-1));
  check(fovMovil === 78, 'RF-14 FOV 78 con aspecto < 1 (fov ' + fovMovil + ')');

  // RF-09: canvas al ancho de la columna · RF-15: máximo 5 pasos por frame
  const lienzo = await leer(page, () => {
    const c = document.getElementById('canvas-carrera-solo');
    return { ancho: c.width, esperado: Math.min(innerWidth, 480) };
  });
  check(lienzo.ancho === lienzo.esperado, 'RF-09 canvas al ancho de la columna ' + JSON.stringify(lienzo));
  const maxPasos = await leer(page, async () => {
    let max = 0;
    for (let i = 0; i < 60; i++) { await new Promise(r => requestAnimationFrame(r)); max = Math.max(max, window.__visor.pasosUltimoFrame); }
    return max;
  });
  check(maxPasos >= 1 && maxPasos <= 5, 'RF-15 entre 1 y 5 pasos por frame (máx ' + maxPasos + ')');

  // RNF-01: muestras por longitud de arco, instancias de MuestraRuta
  const muestras = await leer(page, () => {
    const m = window.__visor.muestrasRuta(400);
    const d = [];
    for (let i = 1; i < m.length; i++) d.push(Math.hypot(m[i].x - m[i - 1].x, m[i].z - m[i - 1].z));
    const media = d.reduce((a, b) => a + b, 0) / d.length;
    return {
      total: m.length,
      clase: m.every(x => x instanceof window.MuestraRuta),
      desvio: Math.max(...d.map(x => Math.abs(x - media) / media)),
      inicio: [m[0].x, m[0].z, window.__visor.px, window.__visor.pz],
    };
  });
  check(muestras.total === 400, 'RNF-01 muestrasRuta(400) devuelve 400');
  check(muestras.clase, 'RNF-01 todas las muestras son MuestraRuta');
  check(muestras.desvio <= 0.05, 'RNF-01 paso constante ±5 % (desvío ' + muestras.desvio.toFixed(3) + ')');
  check(Math.hypot(muestras.inicio[0] - muestras.inicio[2], muestras.inicio[1] - muestras.inicio[3]) < 0.5,
        'RNF-01 la muestra 0 coincide con el inicio del carro');

  // RF-04: congelado no se mueve aunque se acelere
  const congelado = await leer(page, async () => {
    const v = window.__visor;
    v.congelar(true); v.entradaAcel = 1;
    const a = [v.px, v.pz];
    await new Promise(r => setTimeout(r, 1000));
    return { movio: Math.hypot(v.px - a[0], v.pz - a[1]), pasos: v.pasosUltimoFrame };
  });
  check(congelado.movio === 0 && congelado.pasos === 0, 'RF-04 congelado no se mueve ' + JSON.stringify(congelado));

  // PRD 008 RF-01/RF-02: el pasto que aplica el modelo frena aunque se acelere
  const tope = await leer(page, async () => {
    const v = window.__visor;
    v.congelar(false); v.entradaAcel = 1;
    const esperarPasos = async (v, n) => { let p = 0; while (p < n) { await new Promise(r => requestAnimationFrame(r)); p += v.pasosUltimoFrame; } };
    await esperarPasos(v, 120);
    const libre = v.velocidad;
    v.aplicarSuperficie(new window.SuperficiePasto());
    await esperarPasos(v, 150);
    const conTope = v.velocidad;
    return { base: v.velocidadMaxBase, libre, conTope };
  });
  check(tope.libre > tope.base * 0.45, 'PRD 008 RF-01 en asfalto supera el 45 % ' + JSON.stringify(tope));
  check(tope.conTope < tope.libre && tope.conTope <= tope.base * 0.45, 'PRD 008 RF-02 en el pasto baja hacia el 40 % aunque acelere');

  // RF-11: reiniciarCarro vuelve al inicio con velocidad 0 y reaplica la superficie
  const reinicio = await leer(page, async () => {
    const v = window.__visor;
    v.reiniciarCarro();
    const tras = { vel: v.velocidad, px: v.px, pz: v.pz };
    v.congelar(false); v.entradaAcel = 1;
    const esperarPasos = async (v, n) => { let p = 0; while (p < n) { await new Promise(r => requestAnimationFrame(r)); p += v.pasosUltimoFrame; } };
    await esperarPasos(v, 180);
    return { ...tras, velDespues: v.velocidad, base: v.velocidadMaxBase };
  });
  check(reinicio.vel === 0, 'RF-11 velocidad 0 tras reiniciar');
  check(Math.hypot(reinicio.px - muestras.inicio[0], reinicio.pz - muestras.inicio[1]) < 0.5, 'RF-11 vuelve al inicio de la ruta');
  check(reinicio.velDespues <= reinicio.base * 0.45, 'RF-11 reaplica la última superficie (vel ' + reinicio.velDespues + ')');

  // RF-12: detener() libera el contexto WebGL y es idempotente
  const fin = await leer(page, () => {
    const c = document.getElementById('canvas-carrera-solo');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    window.__visor.detener();
    let doble = true;
    try { window.__visor.detener(); } catch { doble = false; }
    return { perdido: gl?.isContextLost?.() ?? null, doble };
  });
  check(fin.perdido === true, 'RF-12 detener() libera el contexto WebGL');
  check(fin.doble, 'RF-12 detener() dos veces no falla');

  // RF-03: el controlador usa la pista y el carro del estado; clave inválida → ciudad
  const usa = await leer(page, async () => {
    const Original = window.VisorCarreraSolo;
    const registro = [];
    window.VisorCarreraSolo = class extends Original {
      constructor(canvas, pista) { super(canvas, pista); registro.push({ pista }); }
      cargar(tipo, color) { registro.at(-1).tipo = tipo; registro.at(-1).color = color; return super.cargar(tipo, color); }
    };
    const probar = async estado => {
      const c = new window.ControladorCarreraSolo(estado, null, () => {});
      c.iniciar();
      await new Promise(r => setTimeout(r, 400));
      c.detener();
      return registro.at(-1);
    };
    const montana = await probar({ pista: 'montana', tipoAuto: 'suv', color: '#ff0000' });
    const errAntes = (window.__modelErrors || []).length;
    const invalida = await probar({ pista: 'no-existe', tipoAuto: 'deportivo', color: '#00ff00' });
    window.VisorCarreraSolo = Original;
    return {
      montana: montana.pista === window.registroPistas.obtener('montana') && montana.tipo === 'suv' && montana.color === '#ff0000',
      respaldo: invalida.pista === window.registroPistas.obtener('ciudad'),
      error: (window.__modelErrors || []).length > errAntes,
    };
  });
  check(usa.montana, 'RF-03 usa la pista, el carro y el color del estado');
  check(usa.respaldo, 'RF-03 con una pista inválida usa ciudad');
  check(usa.error, 'RF-03 registra la pista inválida en __modelErrors');

  check(errores.length === 0, 'sin errores de página (390×844) ' + errores.join(' | '));
  await ctx.close();
}

// ── RF-15: mismos pasos de física a 30 Hz y a 120 Hz ──────────
// Se controla el reloj de la pantalla: el visor recibe marcas de tiempo exactas
// (como las daría una pantalla real de 30 o 120 Hz), sin depender de la GPU.
async function pasosEn2s(hz) {
  const { ctx, page } = await abrir({ width: 390, height: 844 });
  await page.evaluate(() => { window.__cuadros = []; window.requestAnimationFrame = fn => { window.__cuadros.push(fn); return window.__cuadros.length; }; });
  await crearVisor(page);
  const r = await page.evaluate(ms => {
    const v = window.__visor;
    v.congelar(false); v.entradaAcel = 1;
    let t = performance.now(), pasos = 0;
    // Se ejecuta siempre el último cuadro pedido por el visor (uno por "refresco")
    for (let transcurrido = 0; transcurrido <= 2000 + 1e-6; transcurrido += ms) {
      const fn = window.__cuadros.pop();
      window.__cuadros.length = 0;
      if (!fn) break;
      fn(t + transcurrido);
      if (transcurrido > 0) pasos += v.pasosUltimoFrame;
    }
    v.detener();
    return pasos;
  }, 1000 / hz);
  await ctx.close();
  return r;
}
{
  const p30 = await pasosEn2s(30), p120 = await pasosEn2s(120);
  check(Math.abs(p30 - 120) <= 2 && Math.abs(p120 - 120) <= 2,
        'RF-15 misma cantidad de pasos en 2 s a 30 y 120 Hz (' + p30 + ' vs ' + p120 + ', esperado ~120)');
}

// ── PC 1280×960: FOV horizontal ───────────────────────────────
{
  const { ctx, page } = await abrir({ width: 1280, height: 960 }, { movil: false });
  await crearVisor(page);
  await esperar(page, 800);
  const fovPc = await leer(page, () => window.__fovs.at(-1));
  check(fovPc === 78 || fovPc === 55, 'RF-14 FOV válido en PC (fov ' + fovPc + ')');
  // la columna es ≤ 480 px de ancho, así que el aspecto sigue siendo < 1 → 78
  const aspecto = await leer(page, () => { const c = document.getElementById('canvas-carrera-solo'); return c.width / c.height; });
  check(aspecto < 1 ? fovPc === 78 : fovPc === 55, 'RF-14 FOV coherente con el aspecto ' + aspecto.toFixed(2));
  await leer(page, () => window.__visor.detener());
  await ctx.close();
}

// ── RF-13: si el módulo del visor no carga, avisa y vuelve a Inicio ──
{
  const { ctx, page } = await abrir({ width: 390, height: 844 }, { bloquearVisor: true });
  await page.click('#btn-solo');
  await esperar(page, 7000);
  const estado = await leer(page, () => ({
    activa: document.querySelector('.pantalla.activa')?.id,
    error:  (window.__modelErrors || []).some(e => /VisorCarreraSolo/.test(e)),
  }));
  check(estado.activa === 'pantalla-inicio', 'RF-13 vuelve a Inicio si el visor no carga (' + estado.activa + ')');
  check(estado.error, 'RF-13 registra el error en __modelErrors');
  await ctx.close();
}

// ── RF-13: si el GLB del carro se cuelga, a los 6 s avisa y vuelve a Inicio ──
{
  const { ctx, page } = await abrir({ width: 390, height: 844 }, { colgarGlb: true });
  const errAntes = await leer(page, () => (window.__modelErrors || []).length);
  await page.click('#btn-solo');
  const enCarrera = await leer(page, () => document.querySelector('.pantalla.activa')?.id);
  await esperar(page, 7000);
  const estado = await leer(page, () => ({
    activa:  document.querySelector('.pantalla.activa')?.id,
    errores: (window.__modelErrors || []).slice(),
  }));
  const nuevos = estado.errores.slice(errAntes);
  check(enCarrera === 'pantalla-carrera-solo', 'RF-13 entra a la carrera mientras el GLB carga (' + enCarrera + ')');
  check(estado.activa === 'pantalla-inicio', 'RF-13 GLB colgado: vuelve a Inicio en ~7 s (' + estado.activa + ')');
  check(nuevos.length > 0, 'RF-13 GLB colgado: registra el error en __modelErrors ' + JSON.stringify(nuevos));
  await ctx.close();
}

// ── RF-13: módulo del visor lento + GLB colgado → un solo plazo de 6 s, no 6 + 6 ──
{
  const { ctx, page } = await abrir({ width: 390, height: 844 }, { colgarGlb: true });
  // Simula un módulo lento: se quita VisorCarreraSolo y vuelve 4 s después del clic
  await leer(page, () => {
    const Visor = window.VisorCarreraSolo;
    delete window.VisorCarreraSolo;
    document.getElementById('btn-solo').addEventListener('click',
      () => setTimeout(() => { window.VisorCarreraSolo = Visor; }, 4000), { once: true, capture: true });
  });
  await page.click('#btn-solo');
  await esperar(page, 7000);
  const activa = await leer(page, () => document.querySelector('.pantalla.activa')?.id);
  check(activa === 'pantalla-inicio', 'RF-13 plazo único: módulo lento (4 s) + GLB colgado vuelve a Inicio en ~7 s (' + activa + ')');
  await ctx.close();
}

await browser.close();
console.log(fallos ? `\n${fallos} fallo(s)` : '\nTodo OK');
process.exitCode = fallos ? 1 : 0;
