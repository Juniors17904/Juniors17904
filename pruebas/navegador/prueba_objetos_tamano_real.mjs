// ================================================================
// Prueba en navegador real del PRD 010 — Objetos sólidos a tamaño real.
//   RF-04 → en Diseño de Objetos el árbol, el poste y la señal se ven
//           completos al abrir (vertical y horizontal, lección 13)
//   RF-01/02/03/06 → en la escena real de Jugar Solo: alto del árbol
//           (7 m × tamaño propio), del poste (8 m) y cartel con grosor
//           apoyado encima del palo
//   RF-02 → las luces de los postes salen de la lámpara y al asfalto le
//           llega al menos la misma luz que antes del PRD
//   RF-04 → en Diseño General (Ciudad) árboles de 7 m × tamaño propio,
//           postes de 8 m y señales con palo de 2,2 m
//   RF-10 → las flechas siguen apareciendo (la baliza se borró: PRD 011, RF-10), y en Diseño
//           de Objetos aviso, meta, salida, barrera y guardarrail se ven
//   Sin errores de consola (lección 8). Capturas de cerca y de costado
//   en /tmp/capturas_prd010/ (lecciones 13 y 16).
// ================================================================
import { mkdirSync } from 'fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULO || '/opt/node22/lib/node_modules/playwright/index.mjs');
const URL_JUEGO = 'http://localhost:8099/';
const CARPETA   = '/tmp/capturas_prd010';
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
  const m = texto.startsWith('PRD 010') ? texto : 'PRD 010 ' + texto;
  if (c) { ok++; console.log('OK  ', m); } else { fallos++; console.log('FALLO', m); }
};
const cerca = (a, b, tol) => Math.abs(a - b) <= tol;
const browser = await chromium.launch({ headless: false, args: ['--use-gl=angle', '--ignore-gpu-blocklist'] });

// Abre el juego con espías: cada ObjetoEscena construido y la última escena y
// cámara dibujadas en cada lienzo (mismos módulos que usa el juego)
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
    window.__THREE = THREE;
    window.__objetos = [];
    window.__dibujos = {};
    const construir = ObjetoEscena.prototype.construir;
    ObjetoEscena.prototype.construir = function (scene) {
      window.__objetos.push(this);
      return construir.call(this, scene);
    };
    THREE.Scene.prototype.onBeforeRender = function (renderer, scene, camera) {
      window.__dibujos[renderer.domElement.id] = { scene, camera };
    };
  });
  return { page, errores };
}
const clic = (page, id) => page.evaluate(i => document.getElementById(i).click(), id);
const erroresReales = errores => errores.filter(t => !/ServiceWorker|sw\.js|ERR_FAILED|bad HTTP response code \(404\)|status of 404/.test(t));

// ── RF-04: Diseño de Objetos encuadra el objeto completo ─────────────
// Proyecta las 8 esquinas de la caja del último objeto con la cámara que se dibujó
const medirEncuadre = page => page.evaluate(() => {
  const THREE = window.__THREE;
  const obj = window.__objetos[window.__objetos.length - 1];
  const d = window.__dibujos['canvas-do-visor'];
  if (!obj?._grupo || !d) return null;
  const caja = new THREE.Box3().setFromObject(obj._grupo);
  let dentro = true, peor = 0;
  for (const x of [caja.min.x, caja.max.x]) for (const y of [caja.min.y, caja.max.y]) for (const z of [caja.min.z, caja.max.z]) {
    const p = new THREE.Vector3(x, y, z).project(d.camera);
    peor = Math.max(peor, Math.abs(p.x), Math.abs(p.y));
    if (p.z >= 1 || Math.abs(p.x) > 1 || Math.abs(p.y) > 1) dentro = false;
  }
  return { clase: obj.constructor.name, dentro, peor, alto: caja.max.y - caja.min.y };
});

const OBJETOS_DO = [
  ['arbol',       'ArbolEscena',      null,          9.8],   // abre con el árbol de tamaño propio 1,4
  ['poste',       'PosteEscena',      'do-sel-poste', 8],
  ['senal_curva', 'SenalCurvaEscena', 'do-sel-senal-curva', 2.9],
];
for (const [nombreVista, ancho, alto] of [['vertical', 390, 844], ['horizontal', 844, 390]]) {
  const { page, errores } = await abrir(ancho, alto);
  await clic(page, 'btn-garage'); await page.waitForTimeout(300);
  await clic(page, 'btn-ir-diseno-objetos');
  await page.waitForTimeout(1500);
  for (const [tipo, clase, boton, altoEsperado] of OBJETOS_DO) {
    if (boton) { await clic(page, boton); await page.waitForTimeout(800); }
    const r = await medirEncuadre(page);
    check(r?.clase === clase, `RF-04 (${nombreVista}) se muestra ${clase} (${r?.clase})`);
    check(r && cerca(r.alto, altoEsperado, 0.05), `RF-04 (${nombreVista}) ${tipo} con su tamaño nuevo: ${r?.alto.toFixed(2)} m (esperado ${altoEsperado})`);
    check(r?.dentro, `RF-04 (${nombreVista}) ${tipo} se ve completo al abrir (borde más lejano ${r?.peor.toFixed(2)} ≤ 1)`);
    if (nombreVista === 'vertical' && tipo !== 'senal_curva') await page.screenshot({ path: `${CARPETA}/diseno_objetos_${tipo}.png` });
  }
  if (nombreVista === 'vertical') {
    // Señal de cerca y de costado: la cámara se acerca y se pone de lado al cartel
    for (const [nombre, x, z] of [['senal_cerca', 1.2, 3.2], ['senal_costado', 3.5, 0.15]]) {
      await page.evaluate(([px, pz]) => {
        const cam = window.__dibujos['canvas-do-visor'].camera;
        cam.position.set(px, 2.4, pz);
      }, [x, z]);
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${CARPETA}/diseno_objetos_${nombre}.png` });
    }
  }
  // RF-10: la flecha sigue apareciendo (la baliza chevron se borró, PRD 011 RF-10)
  await clic(page, 'do-sel-flecha'); await page.waitForTimeout(600);
  const flecha = await medirEncuadre(page);
  check(flecha?.clase === 'FlechaCurvaEscena', `RF-10 (${nombreVista}) la flecha de curva sigue apareciendo (${flecha?.clase})`);
  // RF-10: los demás objetos (no sólidos) siguen apareciendo con su caja
  for (const [boton, clase] of [['do-sel-aviso', 'AvisoEscena'], ['do-sel-meta', 'MetaEscena'],
    ['do-sel-salida', 'SalidaEscena'], ['do-sel-barrera', 'BarreraEscena'], ['do-sel-guardarrail', 'GuardarrailEscena']]) {
    await clic(page, boton); await page.waitForTimeout(600);
    const r = await page.evaluate(() => {
      const obj = window.__objetos[window.__objetos.length - 1];
      if (!obj?._grupo) return null;
      const t = new window.__THREE.Box3().setFromObject(obj._grupo).getSize(new window.__THREE.Vector3());
      return { clase: obj.constructor.name, enEscena: !!obj._grupo.parent, x: t.x, y: t.y, z: t.z };
    });
    check(r?.clase === clase && r.enEscena && r.x > 0 && r.y > 0 && r.z > 0,
      `RF-10 (${nombreVista}) ${boton.slice(7)} aparece en la escena (${r?.clase}, caja ${r?.x.toFixed(2)} × ${r?.y.toFixed(2)} × ${r?.z.toFixed(2)} m)`);
  }
  const reales = erroresReales(errores);
  check(reales.length === 0, `RF-04 (${nombreVista}) sin errores de consola en Diseño de Objetos ` + reales.join(' | '));
  await page.close();
}

// Mide con THREE.Box3 los árboles, postes y señales de Ciudad que construyó la
// pantalla abierta (mismo orden que las decoraciones de la pista)
const medirDecoraciones = page => page.evaluate(() => {
  const THREE = window.__THREE;
  const decs = window.registroPistas.obtener('ciudad').decoraciones;
  const de = clase => window.__objetos.filter(o => o.constructor.name === clase && o._grupo);
  const caja = g => new THREE.Box3().setFromObject(g);
  const escalas = decs.filter(d => d.tipo === 'arbol').map(d => d.escala ?? 1);
  const arboles = de('ArbolEscena').map((o, i) => {
    const c = caja(o._grupo), tronco = o._grupo.children[0];
    return { alto: c.max.y - c.min.y, piso: c.min.y, escala: escalas[i],
      radioTronco: tronco.geometry.parameters.radiusBottom,
      bajoCopa: Math.min(...o._grupo.children.slice(1).map(h => h.position.y - h.geometry.parameters.radius)) };
  });
  const postes = de('PosteEscena').map(o => {
    const c = caja(o._grupo), palo = o._grupo.children[0];
    return { alto: c.max.y - c.min.y, radio: palo.geometry.parameters.radiusBottom };
  });
  const senales = de('SenalCurvaEscena').map(o => {
    const hijos = o._grupo.children;
    const palo = hijos.find(h => h.geometry.type === 'CylinderGeometry');
    const cartel = hijos.find(h => h.geometry.type === 'BoxGeometry');
    const pp = palo.geometry.parameters, cp = cartel?.geometry.parameters;
    const cajaPalo = caja(palo);
    return { altoPalo: pp.height, altoCajaPalo: cajaPalo.max.y - cajaPalo.min.y, radioPalo: pp.radiusBottom,
      topePalo: palo.position.y + pp.height / 2, ancho: cp?.width, altoCartel: cp?.height, grosor: cp?.depth,
      bordeInferior: cartel ? cartel.position.y - cp.height / 2 : null };
  });
  return { arboles, postes, senales, decsArbol: escalas.length,
    decsPoste: decs.filter(d => d.tipo === 'poste').length, decsSenal: decs.filter(d => d.tipo === 'senal_curva').length };
});

// ── RF-01/02/03/06 y luces en la escena real de Jugar Solo ──────────
{
  const { page, errores } = await abrir(390, 844);
  await clic(page, 'btn-solo');
  const ya = await page.waitForFunction(() => document.getElementById('cuenta-carrera-solo')?.textContent === '¡YA!',
    null, { timeout: 15000 }).then(() => true, () => false);
  check(ya, 'la carrera de Jugar Solo arranca (¡YA!)');
  await page.waitForTimeout(500);

  const m = await medirDecoraciones(page);
  Object.assign(m, await page.evaluate(() => {
    const escena = window.__dibujos['canvas-carrera-solo']?.scene
      ?? Object.values(window.__dibujos).map(d => d.scene).find(s => s.children.some(h => h.isPointLight));
    const luces = (escena?.children ?? []).filter(h => h.isPointLight).map(l => ({ y: l.position.y, intensidad: l.intensity, decay: l.decay }));
    const decs = window.registroPistas.obtener('ciudad').decoraciones;
    return { luces, decsFlecha: decs.filter(d => d.tipo === 'flecha').length,
      flechas: window.__objetos.filter(o => o.constructor.name === 'FlechaCurvaEscena' && o._grupo).length,
      altoSuv: new window.MedidasEscena().medidaCarro('suv').alto };
  }));

  check(m.arboles.length === m.decsArbol && m.arboles.length > 0, `RF-04 Jugar Solo dibuja los ${m.decsArbol} árboles de Ciudad (${m.arboles.length})`);
  check(m.arboles.every(a => cerca(a.alto, 7 * a.escala, 0.05)), `RF-01/RF-06 cada árbol mide 7 m × su tamaño propio (${m.arboles.map(a => `${a.alto.toFixed(2)}/${(7 * a.escala).toFixed(2)}`).join(', ')})`);
  check(m.arboles.every(a => cerca(a.radioTronco, 0.3 * a.escala, 1e-6)), `RF-01/RF-06 tronco de 0,3 m × tamaño propio en la base (${m.arboles.map(a => a.radioTronco.toFixed(3)).join(', ')})`);
  check(m.arboles.every(a => cerca(a.piso, 0, 0.01)), 'RF-01 ninguna raíz ni esfera baja del piso (la caja empieza en 0)');
  check(m.arboles.every(a => a.bajoCopa >= 2.3 - 1e-6 && a.bajoCopa > m.altoSuv), `RF-07 la copa empieza por encima de 2,3 m y del carro más alto (${m.arboles.map(a => a.bajoCopa.toFixed(2)).join(', ')})`);

  // El poste de alumbrado que cae dentro de un poste del arco de meta no se dibuja (PRD 011, opción A)
  check(m.postes.length === m.decsPoste - 1 && m.postes.length > 0, `RF-04 Jugar Solo dibuja los ${m.decsPoste} postes de Ciudad menos el que tapa el arco de meta (${m.postes.length})`);
  check(m.postes.every(p => cerca(p.alto, 8, 0.02) && cerca(p.radio, 0.15, 1e-6)), `RF-02 cada poste mide 8 m de alto y 0,15 m de radio (${m.postes[0]?.alto.toFixed(2)} m, ${m.postes[0]?.radio})`);

  check(m.senales.length === m.decsSenal && m.senales.length > 0, `RF-04 Jugar Solo dibuja las ${m.decsSenal} señales de Ciudad (${m.senales.length})`);
  check(m.senales.every(s => cerca(s.altoPalo, 2.2, 1e-6) && cerca(s.radioPalo, 0.05, 1e-6)), 'RF-03 palo de 2,2 m y 0,05 m de radio');
  check(m.senales.every(s => cerca(s.ancho, 0.7, 1e-6) && cerca(s.altoCartel, 0.7, 1e-6)), 'RF-03 cartel de 0,7 × 0,7 m');
  check(m.senales.every(s => s.grosor > 0 && cerca(s.grosor, 0.03, 1e-6)), `RF-03 el cartel tiene grosor (${m.senales[0]?.grosor} m)`);
  check(m.senales.every(s => cerca(s.bordeInferior, s.topePalo, 0.01)), `RF-03 el cartel se apoya encima del palo (borde ${m.senales[0]?.bordeInferior?.toFixed(2)} m, palo ${m.senales[0]?.topePalo?.toFixed(2)} m)`);

  // RF-02 luz: con decaimiento físico (1/d²), al asfalto bajo la lámpara le llega I/y²;
  // antes del PRD era 300 a 4,8 m de alto
  const luzAntes = 300 / 4.8 ** 2;
  check(m.luces.length > 0, `RF-02 hay luces (PointLight) en los postes (${m.luces.length})`);
  check(m.luces.every(l => l.y > 7 && l.y < 8), `RF-02 la luz sale de la lámpara, arriba del poste (y = ${m.luces[0]?.y.toFixed(2)} m)`);
  check(m.luces.every(l => l.intensidad > 300 && l.decay === 2 && l.intensidad / l.y ** 2 >= luzAntes - 1e-6),
    `RF-02 el asfalto bajo el poste sigue iluminado: ${(m.luces[0]?.intensidad / m.luces[0]?.y ** 2).toFixed(2)} ≥ ${luzAntes.toFixed(2)} (intensidad ${m.luces[0]?.intensidad.toFixed(0)} > 300)`);

  check(m.flechas === m.decsFlecha && m.flechas > 0, `RF-10 las flechas de curva siguen apareciendo (${m.flechas} de ${m.decsFlecha})`);

  // Captura junto a una señal: pone el carro en la pista unos metros antes de una
  // señal, en un punto donde la pista va en el mismo rumbo que el carro
  const ubicado = await page.evaluate(async () => {
    const { Ruta } = await import('/src/model/ruta.js');
    const { Carro } = await import('/src/model/carros/carro.js');
    const pista = window.registroPistas.obtener('ciudad'), ruta = new Ruta();
    ruta.construir(pista.tramos, pista.totalSegs);
    // El carro del visor: se captura en su próximo paso de física
    const actualizar = Carro.prototype.actualizar;
    const carro = await new Promise(r => { Carro.prototype.actualizar = function (dt) { r(this); return actualizar.call(this, dt); }; });
    Carro.prototype.actualizar = actualizar;
    const dif = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
    let mejor = null;
    for (const s of pista.decoraciones.filter(d => d.tipo === 'senal_curva')) {
      for (let d = 0.005; d <= 0.06; d += 0.0025) {
        const p = ruta.posicionEn(((s.prog - d) % 1 + 1) % 1);
        const e = dif(p.angle, carro.velAngle);
        if (!mejor || e < mejor.e) mejor = { e, x: p.x, z: p.z };
      }
    }
    carro.setPosicion(mejor.x, mejor.z);
    return mejor.e;
  });
  check(ubicado < 0.35, `el carro se pone en la pista mirando una señal (desvío ${ubicado.toFixed(2)} rad)`);
  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(700);
  await page.keyboard.up('ArrowUp');
  await page.screenshot({ path: `${CARPETA}/jugar_solo_senal.png` });

  const reales = erroresReales(errores);
  check(reales.length === 0, 'sin errores de consola en Jugar Solo ' + reales.join(' | '));
  await page.close();
}

// ── RF-04: Diseño General (⚙ → Diseño general, pista Ciudad) ─────────
{
  const { page, errores } = await abrir(390, 844);
  await clic(page, 'btn-garage'); await page.waitForTimeout(300);
  await clic(page, 'btn-ir-diseno-general');
  await page.waitForFunction(() => window.__objetos.some(o => o.constructor.name === 'SenalCurvaEscena' && o._grupo),
    null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1000);
  const m = await medirDecoraciones(page);
  check(m.arboles.length === m.decsArbol && m.arboles.length > 0, `RF-04 Diseño General dibuja los ${m.decsArbol} árboles de Ciudad (${m.arboles.length})`);
  check(m.arboles.every(a => cerca(a.alto, 7 * a.escala, 0.05)), `RF-04 Diseño General: cada árbol mide 7 m × su tamaño propio (${m.arboles.map(a => `${a.alto.toFixed(2)}/${(7 * a.escala).toFixed(2)}`).join(', ')})`);
  check(m.postes.length === m.decsPoste && m.postes.length > 0, `RF-04 Diseño General dibuja los ${m.decsPoste} postes de Ciudad (${m.postes.length})`);
  check(m.postes.every(p => cerca(p.alto, 8, 0.02)), `RF-04 Diseño General: cada poste mide 8 m (${m.postes.map(p => p.alto.toFixed(2)).join(', ')})`);
  check(m.senales.length === m.decsSenal && m.senales.length > 0, `RF-04 Diseño General dibuja las ${m.decsSenal} señales de Ciudad (${m.senales.length})`);
  check(m.senales.every(s => cerca(s.altoCajaPalo, 2.2, 0.01)), `RF-04 Diseño General: palo de la señal de 2,2 m (${m.senales[0]?.altoCajaPalo.toFixed(2)} m)`);
  await page.screenshot({ path: `${CARPETA}/diseno_general.png` });
  const reales = erroresReales(errores);
  check(reales.length === 0, 'RF-04 sin errores de consola en Diseño General ' + reales.join(' | '));
  await page.close();
}

await browser.close();
console.log(`\nCapturas en ${CARPETA}/`);
console.log(`\n${ok} OK, ${fallos} fallo(s)`);
process.exitCode = fallos ? 1 : 0;
