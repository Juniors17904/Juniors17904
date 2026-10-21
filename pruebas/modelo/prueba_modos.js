// ================================================================
// PRUEBA: modos de juego — PRD 002 (docs/prds/prd_002_ocultar_modo_2d.md)
// Node, sin DOM (vm). Verifica D8/RNF-01 (jerarquía), D1/D2 (estados),
// D3 (pertenencia de pantallas, RF-08/RF-09) y RF-01/RF-04/RF-05 sobre
// un documento falso.
// ================================================================
'use strict';
const vm = require('vm'), fs = require('fs'), path = require('path');

const DIR = path.join(__dirname, '../../src/controller/modos/');
const ARCHIVOS = [
    ['modo.js',               'Modo'],
    ['modo_jugar_solo.js',    'ModoJugarSolo'],
    ['modo_test_drive_3d.js', 'ModoTestDrive3D'],
    ['modo_clasico_2d.js',    'ModoClasico2D'],
    ['modo_test_drive_2d.js', 'ModoTestDrive2D'],
    ['modo_multijugador.js',  'ModoMultijugador'],
    ['modo_unirse.js',        'ModoUnirse'],
    ['modos_disponibles.js',  'ModosDisponibles'],
];

let fallos = 0;
function comprobar(cond, msg) { console.log(cond ? 'OK   ' : 'FALLO', msg); if (!cond) fallos++; }

const ctx = { console }; ctx.window = ctx; vm.createContext(ctx);
for (const [archivo] of ARCHIVOS) vm.runInContext(fs.readFileSync(DIR + archivo, 'utf8'), ctx, { filename: archivo });
comprobar(!ctx.__modelErrors, 'PRD 002 RNF-01 sin errores de carga ' + (ctx.__modelErrors || []).join(', '));

// ── RNF-01: una clase por archivo, nombre = clase en snake_case, #privados ──
for (const [archivo, clase] of ARCHIVOS) {
    const codigo = fs.readFileSync(DIR + archivo, 'utf8').replace(/\/\/.*$/gm, '');
    const clases = codigo.match(/^\s*class\s+\w+/gm) || [];
    comprobar(clases.length === 1 && clases[0].trim() === 'class ' + clase, `PRD 002 RNF-01 ${archivo} define solo ${clase}`);
    comprobar(typeof ctx[clase] === 'function', `PRD 002 RNF-01 window.${clase} expuesto`);
    comprobar(!/\bif\s*\([^)]*(===|!==|==)\s*['"]/.test(codigo) && !/\bswitch\s*\(/.test(codigo),
        `PRD 002 RNF-01 ${archivo} sin if/switch por textos`);
}

// ── D8: jerarquía ───────────────────────────────────────────────
const SUBCLASES = ['ModoJugarSolo', 'ModoTestDrive3D', 'ModoClasico2D', 'ModoTestDrive2D', 'ModoMultijugador', 'ModoUnirse'];
for (const nombre of SUBCLASES) {
    const C = ctx[nombre];
    comprobar(Object.getPrototypeOf(C) === ctx.Modo, `PRD 002 D8 ${nombre} extiende Modo`);
    const m = new C();
    comprobar(m instanceof ctx.Modo && typeof m.tienePantalla === 'function', `PRD 002 D8 ${nombre} es un Modo`);
    comprobar(Object.keys(m).length === 0, `PRD 002 RNF-01 ${nombre} sin campos públicos`);
}

// ── D1/D2: estados ──────────────────────────────────────────────
const md = new ctx.ModosDisponibles();
// Disponibles: solo Jugar Solo y Test Drive 3D. Oculto y "Próximamente" se comprueban
// más abajo por su efecto sobre los botones (aplicarA).
for (const [nombre, disponible, d] of [
    ['ModoJugarSolo', true, 'D1'], ['ModoTestDrive3D', true, 'D1'],
    ['ModoClasico2D', false, 'D1'], ['ModoTestDrive2D', false, 'D1'],
    ['ModoMultijugador', false, 'D2'], ['ModoUnirse', false, 'D2'],
]) {
    comprobar(md.estaDisponible(ctx[nombre]) === disponible, `PRD 002 ${d} ${nombre} ${disponible ? 'disponible' : 'no disponible'}`);
}
// RNF-01: sin getters ni métodos públicos sin uso
for (const [obj, permitidos] of [
    [ctx.Modo.prototype, ['constructor', 'tienePantalla', 'ocultarBotones', 'marcarProximamente']],
    [ctx.ModosDisponibles.prototype, ['constructor', 'estaDisponible', 'aplicarA', 'debeRedirigirAInicio']],
]) {
    const extra = Object.getOwnPropertyNames(obj).filter(n => !permitidos.includes(n));
    comprobar(extra.length === 0, `PRD 002 RNF-01 ${obj.constructor.name} sin API pública sin uso ${extra.join(',')}`);
}

// ── D3: pertenencia de pantallas (RF-08 / RF-09) ────────────────
for (const id of ['pantalla-crear', 'pantalla-unirse', 'pantalla-espera', 'pantalla-resultado']) {
    comprobar(md.debeRedirigirAInicio(id, false) && md.debeRedirigirAInicio(id, true), `PRD 002 RF-08 ${id} → Inicio`);
}
comprobar(md.debeRedirigirAInicio('pantalla-juego', false), 'PRD 002 RF-09 pantalla-juego sin visor 3D → Inicio');
comprobar(!md.debeRedirigirAInicio('pantalla-juego', true), 'PRD 002 RF-09 pantalla-juego con visor 3D no redirige');
for (const id of ['pantalla-inicio', 'pantalla-carrera-solo', 'pantalla-td3d-selector', 'pantalla-ajustes',
                  'pantalla-detalle-pista', 'pantalla-diseno-general', 'pantalla-garage', 'pantalla-controles']) {
    comprobar(!md.debeRedirigirAInicio(id, false), `PRD 002 RF-09 ${id} no redirige`);
}

// ── RF-01 / RF-04 / RF-05: aplicar a un documento falso ─────────
class BotonFalso {
    constructor(texto) {
        this.textContent = texto; this.hidden = false; this.disabled = false;
        this.dataset = {}; this.atributos = new Map(); this.clases = new Set();
        this.classList = { add: c => this.clases.add(c) };
        this.style = new Proxy({}, { set: () => { throw new Error('el controlador no toca style (MVC)'); } });
    }
    setAttribute(n, v) { this.atributos.set(n, v); }
}
class DocumentoFalso {
    constructor(botones) { this.botones = botones; }
    getElementById(id) { return this.botones.get(id) || null; }
}
const botones = new Map([
    ['btn-solo',          new BotonFalso('Jugar Solo')],
    ['btn-test-drive-3d', new BotonFalso('Test Drive 3D')],
    ['btn-clasico-2d',    new BotonFalso('Clásico 2D')],
    ['btn-test-drive',    new BotonFalso('Test Drive')],
    ['btn-crear',         new BotonFalso('Multijugador')],
    ['btn-unirse',        new BotonFalso('¿Tienes un código? Únete →')],
]);
const doc = new DocumentoFalso(botones);
md.aplicarA(doc);
md.aplicarA(doc); // idempotente
for (const id of ['btn-clasico-2d', 'btn-test-drive']) {
    const b = botones.get(id);
    comprobar(b.clases.has('modo-oculto') && b.hidden && b.disabled, `PRD 002 RF-01 ${id} oculto`);
}
for (const id of ['btn-solo', 'btn-test-drive-3d']) {
    const b = botones.get(id);
    comprobar(b.clases.size === 0 && !b.hidden && !b.disabled && !/Próximamente/.test(b.textContent), `PRD 002 RF-02/RF-03 ${id} intacto`);
}
for (const [id, rf] of [['btn-crear', 'RF-04'], ['btn-unirse', 'RF-05']]) {
    const b = botones.get(id);
    const veces = (b.textContent.match(/Próximamente/g) || []).length;
    comprobar(veces === 1 && b.disabled && !b.hidden && b.clases.has('modo-proximamente') && !b.clases.has('modo-oculto')
        && b.atributos.get('aria-disabled') === 'true' && !b.textContent.includes('→'),
        `PRD 002 ${rf} ${id} visible, desactivado y "Próximamente" (${b.textContent})`);
}
// Un documento sin esos botones no rompe
let errorSinBotones = null;
try { md.aplicarA(new DocumentoFalso(new Map())); } catch (e) { errorSinBotones = e; }
comprobar(errorSinBotones === null, 'PRD 002 RF-11 aplicar sin botones no lanza error');

console.log(fallos ? `\n${fallos} fallo(s)` : '\nTodo OK');
process.exitCode = fallos ? 1 : 0;
