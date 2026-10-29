// ================================================================
// Prueba en navegador real del PRD 026 — Pantallas con estilo de juego de carreras.
// En 390×844 y 844×390, con capturas en /tmp/capturas_prd026/:
//   RF-01 → fondo de asfalto, letra condensada y sin el morado de antes en las pantallas de menú
//   RF-02 → lo elegido se marca en naranja
//   RF-03/RF-04 → Inicio: carro dibujado que cambia con el color y con el carro del garaje; JUGAR SOLO grande e inclinado
//   RF-05/RF-06 → Preparar carrera: una tarjeta con color por pista, récord amarillo, ¡CORRER! amarillo e inclinado
//   RF-07 → Ajustes en dos grupos ("Tu juego" y "Taller") y cada botón abre lo de antes
//   RF-08 → botones de 44 px o más y contraste 4,5:1
//   RF-09 → sin desplazamiento de lado y nada cortado arriba
//   RF-10 → la cuenta, la barra del HUD y el resultado con la letra y los colores nuevos
//   D1/D7 → Diseño General y Diseño de Objetos quedan fuera del tema
//   Sin errores de consola.
// ================================================================
import { mkdirSync } from 'fs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULO || '/opt/node22/lib/node_modules/playwright/index.mjs');
const URL_JUEGO = 'http://localhost:8099/';
const CARPETA = '/tmp/capturas_prd026';
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
const check = (c, texto) => { const m = 'PRD 026 ' + texto; if (c) { ok++; console.log('OK  ', m); } else { fallos++; console.log('FALLO', m); } };
const erroresReales = errores => errores.filter(t => !/ServiceWorker|sw\.js|ERR_FAILED|bad HTTP response code \(404\)|status of 404/.test(t));
const browser = await chromium.launch({ headless: false, args: ['--use-gl=angle', '--ignore-gpu-blocklist'] });
const esperar = ms => new Promise(r => setTimeout(r, ms));
const NARANJA = 'rgb(255, 77, 31)', AMARILLO = 'rgb(255, 196, 0)', ASFALTO = 'rgb(14, 15, 18)';

// Pantallas de D1 y cómo llegar desde Ajustes (id del botón de ida y de vuelta)
const PANTALLAS = [
  ['pantalla-garage', 'btn-ir-garage', 'btn-volver-garage'],
  ['pantalla-controles', 'btn-ir-controles', 'btn-volver-controles'],
  ['pantalla-velocimetro-diseno', 'btn-ir-velocimetro', 'btn-volver-velocimetro-diseno'],
  ['pantalla-vista-conduccion', 'btn-ir-vista-conduccion', 'btn-volver-vista-conduccion'],
  ['pantalla-giro', 'btn-ir-giro', 'btn-volver-giro'],
  ['pantalla-pista', 'btn-ir-pista', 'btn-volver-pista'],
  ['pantalla-td3d-selector', 'btn-test-drive-3d', 'btn-volver-td3d-selector'],
];
// Pantallas que se abren desde otra (pantalla de origen, cómo se abre, id, botón de vuelta)
const SUBPANTALLAS = [
  ['pantalla-controles', '#btn-disenar-timon', 'pantalla-timon-diseno', 'btn-volver-timon-diseno'],
  ['pantalla-controles', '#btn-disenar-pedales', 'pantalla-pedales-diseno', 'btn-volver-pedales-diseno'],
  ['pantalla-pista', '.pista-card', 'pantalla-detalle-pista', 'btn-volver-detalle-pista'],
  ['pantalla-garage', '#btn-ver-carro', 'pantalla-preview', 'btn-volver-preview'],
];
// "Taller": pantallas 3D de herramientas, que quedan fuera del tema (D7)
const TALLER = [['pantalla-diseno-general', 'btn-ir-diseno-general', 'btn-volver-diseno-general'], ['pantalla-diseno-objetos', 'btn-ir-diseno-objetos', 'btn-volver-diseno-objetos']];

// Revisión de la pantalla activa: morado, letra, botones de 44 px, contraste y desbordes
const revisar = page => page.evaluate(() => {
  const p = document.querySelector('.pantalla.activa');
  const rgb = t => (t.match(/[\d.]+/g) || []).map(Number);
  const luz = ([r, g, b]) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const fondo = el => { for (let e = el; e; e = e.parentElement) { const c = rgb(getComputedStyle(e).backgroundColor); if (c.length >= 3 && (c[3] ?? 1) > 0.5) return c; } return [14, 15, 18]; };
  const visible = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
  const morado = [], chicos = [], contraste = [], letras = [];
  const tocable = el => el.tagName === 'BUTTON' || el.matches('.color-btn, .carro-card, .timon-card, .pista-card');
  for (const el of p.querySelectorAll('*')) {
    if (!visible(el) || el.closest('.btn-dir, canvas')) continue;
    const c = getComputedStyle(el);
    // El morado y el cian de antes, y los lilas que los acompañaban (los colores del carro no cuentan)
    if (!el.matches('.color-btn')) for (const v of [c.backgroundColor, c.borderTopColor, c.color]) if (/124, 58, 237|6, 182, 212|167, 139, 250|168, 85, 247|196, 181, 253|34, 211, 238/.test(v)) morado.push((el.id || el.className) + ':' + v);
    if (tocable(el) && el.getBoundingClientRect().height < 43.5) chicos.push(el.id || el.className || el.textContent.trim().slice(0, 20));
    if (el.tagName === 'BUTTON' && !/Saira/.test(c.fontFamily) && el.textContent.trim()) letras.push(el.id || el.textContent.trim().slice(0, 20));
    const texto = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (texto) {
      const a = luz(rgb(c.color)), b = luz(fondo(el)), r = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      if (r < 4.5) contraste.push(el.textContent.trim().slice(0, 18) + ' ' + r.toFixed(2));
    }
  }
  const titulo = p.querySelector('.titulo-logo, .titulo-preparar, #detalle-pista-nombre, #preview-nombre');
  // Si no entra, se puede bajar y el último botón se alcanza (RF-09)
  const botones = [...p.querySelectorAll('button')].filter(visible);
  let alcanza = true;
  if (p.scrollHeight > p.clientHeight + 1) {
    const antes = p.scrollTop; p.scrollTop = p.scrollHeight;
    const ultimo = botones.sort((a, b) => a.getBoundingClientRect().bottom - b.getBoundingClientRect().bottom).pop();
    alcanza = /auto|scroll/.test(getComputedStyle(p).overflowY) && (!ultimo || ultimo.getBoundingClientRect().bottom <= innerHeight + 1);
    p.scrollTop = antes;
  }
  return {
    id: p.id, fondo: getComputedStyle(p).backgroundColor, letra: titulo ? getComputedStyle(titulo).fontFamily : '(sin título)',
    letras: letras.slice(0, 4), alcanza,
    morado: morado.slice(0, 4), chicos: chicos.slice(0, 4), contraste: contraste.slice(0, 4),
    deLado: p.scrollWidth > p.clientWidth + 1 || document.documentElement.scrollWidth > innerWidth + 1,
    cortado: [...p.children].some(e => visible(e) && e.getBoundingClientRect().top < -1),
  };
});
const comprobarPantalla = (r, nombre) => {
  check(r.fondo === 'rgb(14, 15, 18)' && /Saira Condensed/.test(r.letra), `RF-01 (${nombre}) ${r.id}: asfalto y título con letra condensada (${r.fondo}, ${r.letra})`);
  check(r.letras.length === 0, `RF-01 (${nombre}) ${r.id}: botones con la letra nueva ${r.letras.join(' | ')}`);
  check(r.morado.length === 0, `RF-01 (${nombre}) ${r.id}: sin el morado de antes ${r.morado.join(' | ')}`);
  check(r.chicos.length === 0, `RF-08 (${nombre}) ${r.id}: lo que se toca mide 44 px o más ${r.chicos.join(' | ')}`);
  check(r.contraste.length === 0, `RF-08 (${nombre}) ${r.id}: contraste 4,5:1 ${r.contraste.join(' | ')}`);
  check(!r.deLado && !r.cortado && r.alcanza, `RF-09 (${nombre}) ${r.id}: sin desplazamiento de lado, sin cortes y se baja hasta el último botón`);
};
const elegidoEnNaranja = async (page, selector, propiedad, texto) => {
  const v = await page.evaluate(([s, pr]) => { const e = document.querySelector(s); return e ? getComputedStyle(e)[pr] : null; }, [selector, propiedad]);
  check(v && v.includes('255, 77, 31'), `RF-02 ${texto} en naranja (${v})`);
};
const clic = (page, id) => page.evaluate(i => document.getElementById(i).click(), id);
const huellaPortada = page => page.evaluate(() => { const c = document.getElementById('canvas-portada-carro'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let h = 0, n = 0; for (let i = 0; i < d.length; i += 16) { if (d[i + 3]) n++; h = (h * 31 + d[i] * 7 + d[i + 1] * 3 + d[i + 2]) % 1e9; } return { h, n }; });

for (const [nombre, vp] of [['vertical', { width: 390, height: 844 }], ['horizontal', { width: 844, height: 390 }]]) {
  const ctx = await browser.newContext({ viewport: vp, hasTouch: true, isMobile: true });
  await ctx.addInitScript(() => {
    localStorage.setItem('vc_preferencias', JSON.stringify({ tipoCamara: 'chase', alturaCamara: 2.8, tipoControl: 'timon' }));
    // La letra con la que se dibuja "VUELTA" en la barra del HUD (RF-10)
    const fillText = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (t, ...a) { if (String(t).startsWith('VUELTA')) window.__letraHud = [this.font, this.fillStyle]; return fillText.call(this, t, ...a); };
  });
  const page = await ctx.newPage();
  const errores = [];
  page.on('pageerror', e => errores.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
  await page.route('**/*', parchear);
  await page.goto(URL_JUEGO);
  await page.waitForTimeout(2500);

  // Inicio (RF-03, RF-04)
  comprobarPantalla(await revisar(page), nombre);
  const inicio = await page.evaluate(() => {
    const solo = document.getElementById('btn-solo'), alto = solo.getBoundingClientRect().height;
    const otros = [...document.querySelectorAll('#pantalla-inicio button')].filter(b => b !== solo).map(b => b.getBoundingClientRect().height);
    return { titulo: document.querySelector('#pantalla-inicio .titulo-logo').textContent, alto, mayor: otros.every(h => h < alto), inclinado: new DOMMatrix(getComputedStyle(solo).transform).c !== 0 };
  });
  check(/TURBO\s*RACE/.test(inicio.titulo), `RF-03 (${nombre}) Inicio dice TURBO RACE`);
  check(inicio.mayor && inicio.inclinado, `RF-04 (${nombre}) JUGAR SOLO es el botón más grande e inclinado (${inicio.alto} px)`);
  const tab = await page.evaluate(() => getComputedStyle(document.querySelector('#control-tabs .tab-btn.sel')).backgroundColor);
  check(tab === NARANJA, `RF-02 (${nombre}) el control elegido en naranja (${tab})`);
  await elegidoEnNaranja(page, '#colores-grid .color-btn.sel', 'boxShadow', `(${nombre}) el color elegido`);
  const antes = await huellaPortada(page);
  await page.evaluate(() => document.querySelector('.color-btn[data-color="#3b82f6"]').click());
  await esperar(300);
  const conAzul = await huellaPortada(page);
  check(antes.n > 500 && conAzul.h !== antes.h, `RF-03 (${nombre}) el carro de Inicio se dibuja y cambia con el color (${antes.n} puntos)`);
  if (nombre === 'vertical') await page.screenshot({ path: `${CARPETA}/inicio_${nombre}.png` });

  // Otro carro en el garaje → el dibujo de Inicio cambia (RF-03)
  await clic(page, 'btn-garage'); await clic(page, 'btn-ir-garage'); await esperar(400);
  const carroSel = await page.evaluate(() => getComputedStyle(document.querySelector('.carro-card.sel')).borderTopColor);
  check(carroSel === NARANJA, `RF-02 (${nombre}) el carro elegido en naranja (${carroSel})`);
  await page.evaluate(() => document.querySelector('.carro-card[data-tipo="suv"]').click());
  await clic(page, 'btn-ver-carro'); await esperar(1500);
  await clic(page, 'btn-seleccionar-carro'); await esperar(500);
  const conSuv = await huellaPortada(page);
  check(conSuv.h !== conAzul.h, `RF-03 (${nombre}) al volver del garaje con otro carro el dibujo cambia`);

  // Preparar carrera (RF-05, RF-06)
  await clic(page, 'btn-solo'); await esperar(400);
  comprobarPantalla(await revisar(page), nombre);
  const preparar = await page.evaluate(() => {
    const pistas = [...document.querySelectorAll('#opciones-pista .opcion-carrera')];
    const correr = document.getElementById('btn-correr'), c = getComputedStyle(correr);
    return {
      colores: new Set(pistas.map(b => getComputedStyle(b).backgroundImage)).size, total: pistas.length,
      pistaSel: getComputedStyle(document.querySelector('#opciones-pista .sel')).borderTopColor,
      modoSel: getComputedStyle(document.querySelector('#opciones-modo .sel')).backgroundColor,
      record: getComputedStyle(document.getElementById('record-pista')).color,
      correr: c.backgroundColor, inclinado: new DOMMatrix(c.transform).c !== 0, alto: correr.getBoundingClientRect().height,
      mayorOpcion: Math.max(...[...document.querySelectorAll('#pantalla-preparar-carrera .opcion-carrera')].map(b => b.getBoundingClientRect().height)),
    };
  });
  check(preparar.total >= 5 && preparar.colores === preparar.total && preparar.pistaSel === NARANJA, `RF-05 (${nombre}) una tarjeta con color por pista y la elegida en naranja (${preparar.colores}/${preparar.total})`);
  check(preparar.record === AMARILLO, `RF-05 (${nombre}) el récord en amarillo (${preparar.record})`);
  check(preparar.modoSel === NARANJA, `RF-02 (${nombre}) el modo elegido en naranja`);
  await elegidoEnNaranja(page, '#opciones-rivales .sel', 'backgroundColor', `(${nombre}) los rivales elegidos`);
  await elegidoEnNaranja(page, '#opciones-dificultad .sel', 'backgroundColor', `(${nombre}) la dificultad elegida`);
  check(preparar.correr === AMARILLO && preparar.inclinado && preparar.alto > preparar.mayorOpcion, `RF-06 (${nombre}) ¡CORRER! amarillo, inclinado y más alto que las opciones (${preparar.alto} px)`);
  await page.screenshot({ path: `${CARPETA}/preparar_${nombre}.png` });

  // Ajustes (RF-07) y el resto de las pantallas de D1
  await clic(page, 'btn-volver-preparar'); await clic(page, 'btn-garage'); await esperar(300);
  comprobarPantalla(await revisar(page), nombre);
  const grupos = await page.evaluate(() => {
    const out = {}; let actual = null;
    for (const el of document.querySelector('#pantalla-ajustes .ajustes-menu').children) {
      if (el.classList.contains('ajustes-grupo')) { actual = el.textContent.trim(); out[actual] = []; } else if (actual) out[actual].push(el.id);
    }
    return out;
  });
  check(JSON.stringify(grupos) === JSON.stringify({ 'Tu juego': ['btn-ir-garage', 'btn-ir-controles', 'btn-ir-velocimetro', 'btn-ir-vista-conduccion', 'btn-ir-giro'],
    'Taller': ['btn-ir-pista', 'btn-test-drive-3d', 'btn-ir-diseno-general', 'btn-ir-diseno-objetos'] }), `RF-07 (${nombre}) Ajustes en "Tu juego" y "Taller" ${JSON.stringify(grupos)}`);
  await page.screenshot({ path: `${CARPETA}/ajustes_${nombre}.png` });
  for (const [id, ida, vuelta] of PANTALLAS) {
    await clic(page, ida); await esperar(500);
    const activa = await page.evaluate(() => document.querySelector('.pantalla.activa').id);
    check(activa === id, `RF-07 (${nombre}) ${ida} abre ${id} como antes`);
    comprobarPantalla(await revisar(page), nombre);
    await page.screenshot({ path: `${CARPETA}/${id}_${nombre}.png` });
    if (id === 'pantalla-velocimetro-diseno') await elegidoEnNaranja(page, '#pantalla-velocimetro-diseno .timon-card.sel', 'borderTopColor', `(${nombre}) el velocímetro elegido`);
    for (const [origen, abrir, sub, volver] of SUBPANTALLAS.filter(x => x[0] === id)) {
      await page.evaluate(s => document.querySelector(`#${s[0]} ${s[1]}`).click(), [origen, abrir]); await esperar(sub === 'pantalla-preview' ? 1500 : 500);
      const abierta = await page.evaluate(() => document.querySelector('.pantalla.activa').id);
      check(abierta === sub, `RF-07 (${nombre}) se abre ${sub}`);
      comprobarPantalla(await revisar(page), nombre);
      await page.screenshot({ path: `${CARPETA}/${sub}_${nombre}.png` });
      if (sub !== 'pantalla-detalle-pista' && sub !== 'pantalla-preview') await elegidoEnNaranja(page, `#${sub} .timon-card.sel`, 'borderTopColor', `(${nombre}) lo elegido en ${sub}`);
      await clic(page, volver); await esperar(400);
    }
    await clic(page, vuelta); await esperar(300);
    if (await page.evaluate(() => document.querySelector('.pantalla.activa').id) !== 'pantalla-ajustes') await clic(page, 'btn-garage');
  }

  // "Taller": abren lo de antes y quedan fuera del tema (D1, D7)
  for (const [id, ida, vuelta] of TALLER) {
    await clic(page, ida); await esperar(1500);
    const t = await page.evaluate(() => { const p = document.querySelector('.pantalla.activa'); return { id: p.id, letra: getComputedStyle(p.querySelector('.btn-tuerca')).fontFamily }; });
    check(t.id === id, `RF-07 (${nombre}) ${ida} abre ${id} como antes`);
    check(!/Saira/.test(t.letra), `D7 (${nombre}) ${id} queda fuera del tema (${t.letra})`);
    await clic(page, vuelta); await esperar(800);
    if (await page.evaluate(() => document.querySelector('.pantalla.activa').id) !== 'pantalla-ajustes') await clic(page, 'btn-garage');
  }

  // RF-10: la carrera (cuenta, barra del HUD y resultado)
  await clic(page, 'btn-volver-ajustes'); await clic(page, 'btn-solo'); await clic(page, 'btn-correr');
  const hudListo = await page.waitForFunction(() => window.__letraHud, null, { timeout: 25000 }).then(() => true, () => false);
  check(hudListo, `RF-10 (${nombre}) la barra del HUD se dibuja (antes de 25 s)`);
  const carrera = await page.evaluate(() => {
    const cuenta = getComputedStyle(document.getElementById('cuenta-carrera-solo'));
    const textos = document.querySelector('.resultado-carrera-textos');
    // El récord del resultado lo arma AvisoRecord en su línea
    const caja = document.createElement('div'); new window.AvisoRecord(caja);
    const record = caja.querySelector('.resultado-carrera-record');
    return { cuenta: cuenta.fontFamily, textos: textos && getComputedStyle(textos).fontFamily, record: record?.style.color, hud: window.__letraHud };
  });
  check(/Saira Condensed/.test(carrera.cuenta) && /Saira Condensed/.test(carrera.textos), `RF-10 (${nombre}) la cuenta y el resultado con la letra nueva`);
  check(carrera.hud && /Saira Condensed/.test(carrera.hud[0]) && /#ffc400/i.test(carrera.hud[1]), `RF-10 (${nombre}) la barra del HUD con la letra y el amarillo nuevos (${JSON.stringify(carrera.hud)})`);
  check(/255, 196, 0/.test(carrera.record ?? ''), `RF-10 (${nombre}) el récord del resultado en amarillo (${carrera.record})`);
  await page.screenshot({ path: `${CARPETA}/carrera_${nombre}.png` });

  const reales = erroresReales(errores);
  check(reales.length === 0, `(${nombre}) sin errores de consola ` + reales.join(' | '));
  await ctx.close();
}

await browser.close();
console.log(`\n${ok} OK, ${fallos} fallo(s)`);
process.exitCode = fallos ? 1 : 0;
