// ================================================================
// Prueba en navegador real del PRD 013 — Rivales de la PC en Jugar Solo.
//   RF-01 → al ¡YA! hay 5 carros (el jugador y 4 rivales con su modelo 3D),
//           sin tocarse y quietos durante la cuenta
//   RF-09 → la posición "N.º/5" se dibuja y cambia al adelantar y al ser adelantado
//   RF-11 → dos carros puestos uno encima del otro se separan
//   RF-10 → al llegar el jugador se ve la tabla de 5 filas, los rivales siguen
//           corriendo y la tabla se completa con sus tiempos; Revancha vuelve a la
//           grilla con los mismos 4 rivales y Menú vuelve a Inicio
//   RF-12 → las otras 4 pantallas 3D siguen abriendo sin errores y sin rivales
//   Sin errores de consola
// Capturas: /tmp/capturas_prd013/ (grilla, carrera con rivales cerca, tabla final)
// ================================================================
const { chromium } = await import(process.env.PLAYWRIGHT_MODULO || '/opt/node22/lib/node_modules/playwright/index.mjs');
const SP = process.env.CAPTURAS_DIR || '/tmp/capturas_prd013'; (await import('fs')).mkdirSync(SP, { recursive: true });
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

// ── Espías: la carrera de los rivales, el carro y la carrera del jugador,
//    los grupos 3D de los rivales, el texto de posición y la meta forzada ──
await page.evaluate(async () => {
  const { CarreraConRivales } = await import('/src/model/carrera_con_rivales.js');
  const { ConductorPasoFijo } = await import('/src/view/pistas/comun/conductor_paso_fijo.js');
  const { Carro } = await import('/src/model/carros/carro.js');
  const THREE = await import('/node_modules/three/build/three.module.min.js');
  window.__grupos = []; window.__posiciones = []; window.__rebotes = new Map(); window.__forzadas = new Set();

  const colocar = CarreraConRivales.prototype.colocarEnGrilla;
  CarreraConRivales.prototype.colocarEnGrilla = function (p) { window.__cr = this; return colocar.call(this, p); };
  const seguir = CarreraConRivales.prototype.seguirJugador;
  CarreraConRivales.prototype.seguirJugador = function (c) { window.__carreraJugador = c; return seguir.call(this, c); };
  const paso = CarreraConRivales.prototype.paso;
  CarreraConRivales.prototype.paso = function (carro, medida) {
    window.__pasosRivales = (window.__pasosRivales ?? 0) + 1; window.__medidaJugador = medida;
    return paso.call(this, carro, medida);
  };
  const avanzar = ConductorPasoFijo.prototype.avanzar;
  ConductorPasoFijo.prototype.avanzar = function (...a) { if (this.carro) window.__carroJugador = this.carro; return avanzar.apply(this, a); };
  const rebotar = Carro.prototype.rebotar;
  Carro.prototype.rebotar = function (...a) { window.__rebotes.set(this, (window.__rebotes.get(this) ?? 0) + 1); return rebotar.apply(this, a); };
  const agregar = THREE.Object3D.prototype.add;
  THREE.Object3D.prototype.add = function (...hijos) {
    for (const h of hijos) if (String(h?.name).startsWith('rival:')) window.__grupos.push({ grupo: h, padre: this });
    return agregar.apply(this, hijos);
  };
  const dibujar = window.HudCarrera.prototype.dibujar;
  window.HudCarrera.prototype.dibujar = function (...a) {
    const t = a[5] ?? '';
    if (window.__posiciones[window.__posiciones.length - 1] !== t) window.__posiciones.push(t);
    window.__textoPos = t;
    return dibujar.apply(this, a);
  };
  const actualizar = window.CarreraVueltas.prototype.actualizar;
  window.CarreraVueltas.prototype.actualizar = function (px, pz) {
    const ev = actualizar.call(this, px, pz);
    if (this === window.__carreraJugador) {
      if (window.__forzarMeta) { window.__forzarMeta = false; return 'meta'; }
    } else if (window.__forzarMetaRivales && !window.__forzadas.has(this)) {
      window.__forzadas.add(this); return 'meta';
    }
    return ev;
  };
  // ¿Se tocan dos carros? Usa ChoqueEntreCarros sobre copias que no se mueven
  const { ChoqueEntreCarros } = await import('/src/model/choques/choque_entre_carros.js');
  // (copia a mano: px, pz y rotY de Carro son getters, no se copian con { ...carro })
  const copia = c => ({ px: c.px, pz: c.pz, rotY: c.rotY, velocidad: 0, velAngle: 0, rebotar() {} });
  window.__seTocan = (a, ma, b, mb) => new ChoqueEntreCarros().resolver(copia(a), ma, copia(b), mb);
});

const activa = () => page.evaluate(() => document.querySelector('.pantalla.activa')?.id);
const cuenta = () => page.evaluate(() => document.getElementById('cuenta-carrera-solo')?.textContent ?? '');
const esperarCuenta = t => page.waitForFunction(x => document.getElementById('cuenta-carrera-solo')?.textContent === x,
  t, { timeout: 15000 }).then(() => true, () => false);
// Pose de los 5 carros: 4 rivales (en orden) y el jugador al final
const poses = () => page.evaluate(() => [...window.__cr.rivales.map(r => r.carro), window.__carroJugador]
  .map(c => ({ px: c.px, pz: c.pz, rotY: c.rotY })));
const tabla = () => page.evaluate(() => [...document.querySelectorAll('#resultado-carrera-solo .fila-tabla-final')]
  .map(f => ({ texto: f.innerText.replace(/\s+/g, ' ').trim(), jugador: f.classList.contains('es-jugador') })));

// ── RF-01: la grilla de salida ───────────────────────────────
await page.evaluate(() => (document.getElementById('btn-solo').click(), document.getElementById('btn-correr').click()));
check(await esperarCuenta('2'), 'la cuenta 3-2-1 arranca');
const grilla = await poses();
const info = await page.evaluate(() => ({
  nombres: window.__cr.rivales.map(r => r.nombre),
  tipos: window.__cr.rivales.map(r => r.piloto.tipoAuto),
  colores: window.__cr.rivales.map(r => r.piloto.color),
  grupos: window.__grupos.map(({ grupo, padre }) => {
    let mallas = 0; grupo.traverse(h => { if (h.isMesh) mallas++; });
    return { nombre: grupo.name, enEscena: !!padre.isScene && grupo.parent === padre, mallas };
  }),
  errores: window.__modelErrors ?? [],
}));
console.log('   rivales:', JSON.stringify(info.nombres), JSON.stringify(info.tipos));
check(info.nombres.length === 4 && new Set(info.nombres).size === 4 && new Set(info.tipos).size === 4 && new Set(info.colores).size === 4,
  'RF-01 / RF-02 hay 4 rivales con nombre, carro y color distintos');
check(info.grupos.length === 4 && info.grupos.every(g => g.enEscena && g.mallas > 0),
  `RF-01 los 4 rivales tienen su modelo 3D en la escena (${info.grupos.map(g => g.nombre + ':' + g.mallas).join(', ')})`);
check(info.errores.length === 0, 'RF-01 los modelos 3D cargan sin errores ' + info.errores.join(' | '));
check(await page.evaluate(() => !!window.__carroJugador), 'RF-01 el carro del jugador está en la escena');
await page.waitForTimeout(150);
check(await page.evaluate(() => window.__textoPos) === '5.º/5', `RF-09 en la grilla el jugador sale último (${await page.evaluate(() => window.__textoPos)})`);
await page.screenshot({ path: SP + '/1_grilla_salida.png' });
check(await esperarCuenta('1'), 'la cuenta llega a 1');
const grilla2 = await poses();
check(grilla.every((p, i) => Math.hypot(p.px - grilla2[i].px, p.pz - grilla2[i].pz) < 1e-6),
  'RF-01 los 5 carros esperan quietos durante la cuenta');
check(await page.evaluate(() => (window.__pasosRivales ?? 0) === 0), 'RF-01 los rivales no avanzan antes del ¡YA!');

// ── ¡YA! ─────────────────────────────────────────────────────
check(await esperarCuenta('¡YA!'), 'la carrera arranca (¡YA!)');
await page.keyboard.down('ArrowUp');
await page.waitForTimeout(300);
const tocan = await page.evaluate(g => {
  const medidas = [...window.__cr.rivales.map(r => r.medida), window.__medidaJugador];
  const pares = [];
  for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++)
    if (window.__seTocan(g[i], medidas[i], g[j], medidas[j])) pares.push(i + '-' + j);
  return { pares, conMedida: medidas.every(m => m && m.largo > 0) };
}, grilla);
check(tocan.conMedida && tocan.pares.length === 0, `RF-01 en la grilla ningún carro toca a otro (${tocan.pares.join(', ') || 'ninguno'})`);
await page.waitForTimeout(1200);
await page.screenshot({ path: SP + '/2_carrera_con_rivales.png' });
await page.keyboard.up('ArrowUp');
const enCarrera = await poses();
check(enCarrera.slice(0, 4).every((p, i) => Math.hypot(p.px - grilla[i].px, p.pz - grilla[i].pz) > 3),
  'RF-03 los 4 rivales arrancan en el ¡YA!');

// ── RF-09: adelantar (se lleva al jugador por la pista delante de todos) y ser adelantado ──
await page.evaluate(async () => {
  const { Ruta } = await import('/src/model/ruta.js');
  const pista = window.registroPistas.obtener('ciudad'), ruta = new Ruta();
  ruta.construir(pista.tramos, pista.totalSegs);
  const m = ruta.muestras(1000), n = m.length;
  const cercano = c => { let mejor = 0, d = Infinity;
    m.forEach((p, i) => { const e = (p.x - c.px) ** 2 + (p.z - c.pz) ** 2; if (e < d) { d = e; mejor = i; } }); return mejor; };
  const lider = window.__cr.rivales.reduce((a, b) => (b.avance > a.avance ? b : a));
  const desde = cercano(window.__carroJugador), hasta = cercano(lider.carro) + 30;
  const pasos = ((hasta - desde) % n + n) % n;
  for (let k = 2; k <= pasos; k += 2) {
    const p = m[(desde + k) % n];
    window.__carroJugador.setPosicion(p.x, p.z);
    await new Promise(r => setTimeout(r, 35));
  }
  const p = m[(desde + pasos) % n];
  window.__carroJugador.setPosicion(p.x, p.z);
});
await page.waitForTimeout(200);
const adelante = await page.evaluate(() => window.__textoPos);
check(adelante === '1.º/5', `RF-09 al adelantar a todos la posición sube a 1.º/5 (${adelante})`);
const adelantado = await page.waitForFunction(() => window.__textoPos !== '1.º/5', null, { timeout: 10000 }).then(() => true, () => false);
const historia = await page.evaluate(() => window.__posiciones);
console.log('   posiciones vistas:', JSON.stringify(historia));
check(adelantado, `RF-09 al ser adelantado la posición baja (${await page.evaluate(() => window.__textoPos)})`);
check(historia.every(t => /^[1-5]\.º\/5$/.test(t)), 'RF-09 la posición siempre se dibuja como "N.º/5"');

// ── RF-11: un rival encima del jugador se separa ─────────────
const separacion = await page.evaluate(async () => {
  const j = window.__carroJugador;
  const r = window.__cr.rivales.filter(x => !x.terminado)
    .reduce((a, b) => (Math.hypot(b.carro.px - j.px, b.carro.pz - j.pz) < Math.hypot(a.carro.px - j.px, a.carro.pz - j.pz) ? b : a));
  const antes = [window.__rebotes.get(j) ?? 0, window.__rebotes.get(r.carro) ?? 0];
  r.carro.setPosicion(j.px + 0.2, j.pz + 0.1);
  await new Promise(res => setTimeout(res, 300));
  return {
    distancia: Math.hypot(r.carro.px - j.px, r.carro.pz - j.pz),
    tocan: window.__seTocan(j, window.__medidaJugador, r.carro, r.medida),
    rebotes: [(window.__rebotes.get(j) ?? 0) - antes[0], (window.__rebotes.get(r.carro) ?? 0) - antes[1]],
  };
});
check(separacion.distancia > 1 && !separacion.tocan,
  `RF-11 dos carros puestos uno encima del otro se separan (distancia ${separacion.distancia.toFixed(2)} m)`);
check(separacion.rebotes.every(n => n > 0), `RF-11 los dos rebotan (${separacion.rebotes.join(', ')})`);

// ── RF-10: llega el jugador; los rivales siguen y la tabla se completa ──
await page.evaluate(() => { window.__forzarMeta = true; });
const panel = await page.waitForFunction(() => getComputedStyle(document.getElementById('resultado-carrera-solo')).display === 'flex',
  null, { timeout: 3000 }).then(() => true, () => false);
check(panel, 'RF-10 al llegar el jugador se ve el panel de resultado');
const t1 = await tabla();
console.log('   tabla al llegar:', JSON.stringify(t1.map(f => f.texto)));
check(t1.length === 5, `RF-10 la tabla tiene 5 filas (${t1.length})`);
check(info.nombres.every(n => t1.some(f => f.texto.includes(n))) && t1.filter(f => f.jugador).length === 1,
  'RF-02 / RF-10 la tabla muestra los nombres de los 4 rivales y resalta al jugador');
check(t1.some(f => /en carrera/.test(f.texto)), 'RF-10 los rivales que no llegaron dicen "en carrera"');
const mejor = await page.evaluate(() => document.querySelector('#resultado-carrera-solo .resultado-carrera-mejor')?.textContent ?? '');
check(/MEJOR VUELTA/i.test(mejor), `RF-10 se ve la mejor vuelta del jugador (${mejor})`);
const alLlegar = await poses();
await page.waitForTimeout(1000);
const despues = await poses();
check(despues.slice(0, 4).some((p, i) => Math.hypot(p.px - alLlegar[i].px, p.pz - alLlegar[i].pz) > 2),
  'RF-10 los rivales siguen corriendo después de que llega el jugador');
check(Math.hypot(despues[4].px - alLlegar[4].px, despues[4].pz - alLlegar[4].pz) < 0.5, 'RF-10 el carro del jugador queda quieto');
await page.evaluate(() => { window.__forzarMetaRivales = true; });
const completa = await page.waitForFunction(() => {
  const filas = [...document.querySelectorAll('#resultado-carrera-solo .fila-tabla-final')];
  return filas.length === 5 && filas.every(f => !/en carrera/.test(f.innerText) && /\d+:[0-5]\d\.\d{2}/.test(f.innerText));
}, null, { timeout: 5000 }).then(() => true, () => false);
const t2 = await tabla();
console.log('   tabla final:', JSON.stringify(t2.map(f => f.texto)));
check(completa, 'RF-10 al llegar los rivales la tabla se completa con los 5 tiempos');
check(t2.every((f, i) => f.texto.startsWith((i + 1) + '.º')), 'RF-10 la tabla va del 1.º al 5.º');
await page.evaluate(() => { window.__forzarMetaRivales = false; });
await page.screenshot({ path: SP + '/3_tabla_final.png' });

// ── Revancha: misma grilla y mismos 4 rivales ────────────────
await page.click('#btn-revancha-solo');
await page.waitForTimeout(300);
check(await cuenta() === '3', 'RF-10 Revancha vuelve a la cuenta 3-2-1');
const otra = await poses();
const nombres2 = await page.evaluate(() => window.__cr.rivales.map(r => r.nombre));
check(otra.every((p, i) => Math.hypot(p.px - grilla[i].px, p.pz - grilla[i].pz) < 0.01),
  'RF-10 Revancha pone a los 5 carros en la grilla de salida');
check(JSON.stringify(nombres2) === JSON.stringify(info.nombres), 'RF-10 Revancha usa los mismos 4 rivales');
check(await page.evaluate(() => getComputedStyle(document.getElementById('resultado-carrera-solo')).display) === 'none',
  'RF-10 Revancha oculta la tabla');
check(await page.evaluate(() => window.__grupos.length) === 4, 'Revancha no crea modelos 3D nuevos');
await page.waitForTimeout(200);
check(await page.evaluate(() => window.__textoPos) === '5.º/5', 'RF-09 en la Revancha el jugador vuelve a salir 5.º/5');
check(await esperarCuenta('¡YA!'), 'la Revancha arranca (¡YA!)');
await page.waitForTimeout(500);
await page.evaluate(() => { window.__forzarMeta = true; });
await page.waitForTimeout(500);
await page.click('#btn-menu-solo');
await page.waitForTimeout(400);
check(await activa() === 'pantalla-inicio', 'RF-10 Menú vuelve a Inicio');
const pasosMenu = await page.evaluate(() => window.__pasosRivales);
await page.waitForTimeout(400);
check(await page.evaluate(() => window.__pasosRivales) === pasosMenu, 'al salir los rivales dejan de moverse');

// ── RF-12: las otras 4 pantallas 3D abren sin errores y sin rivales ──
const clic = id => page.evaluate(i => document.getElementById(i).click(), id);
const otras = [];
const abrir = async (nombre, pasos, lienzo, salir) => {
  for (const p of pasos) { if (typeof p === 'function') await p(); else await clic(p); await page.waitForTimeout(400); }
  await page.waitForTimeout(3000);
  const r = await page.evaluate(l => ({ pantalla: document.querySelector('.pantalla.activa')?.id,
    lienzo: !!document.getElementById(l) && document.getElementById(l).getBoundingClientRect().width > 0 }), lienzo);
  otras.push(nombre);
  check(r.lienzo && !['pantalla-inicio', 'pantalla-carrera-solo'].includes(r.pantalla), `RF-12 ${nombre} abre (${r.pantalla})`);
  for (const s of salir) { await clic(s); await page.waitForTimeout(400); }
};
await abrir('Test Drive 3D Simple', ['btn-garage', 'btn-test-drive-3d', 'btn-td3d-simple'], 'canvas-td3d', ['btn-exit-td3d']);
await abrir('Test Drive 3D Con Ruta', ['btn-test-drive-3d', 'btn-td3d-con-ruta'], 'canvas-cir3d', ['btn-exit-cir3d', 'btn-volver-td3d-selector']);
await abrir('Diseño de Pistas → Entrar', ['btn-ir-pista', () => page.evaluate(() => document.querySelector('.pista-card[data-pista="ciudad"]').click()),
  'btn-seleccionar-pista'], 'canvas-cir3d', ['btn-exit-cir3d', 'btn-volver-detalle-pista', 'btn-volver-pista']);
await abrir('Diseño General', ['btn-ir-diseno-general'], 'canvas-dg-visor', ['btn-volver-diseno-general']);
check(await page.evaluate(() => window.__grupos.length) === 4, 'RF-12 las otras pantallas no tienen rivales');

const reales = errores.filter(t => !/ServiceWorker|sw\.js|ERR_FAILED|bad HTTP response code \(404\)|status of 404/.test(t));
check(reales.length === 0, 'sin errores de consola ' + reales.join(' | '));
await browser.close();
console.log(`\n${ok} OK, ${fallos} fallo(s)`);
process.exitCode = fallos ? 1 : 0;
