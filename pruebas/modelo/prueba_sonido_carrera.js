// ================================================================
// CLASE: PruebaSonidoCarrera — PRD 022 (docs/prds/prd_022_sonido_jugar_solo.md)
// En Node, con un audio de mentira que anota lo que se pide (RNF-04):
//   RF-01 con "¡YA!" arranca el motor y su tono sube con la velocidad
//   RF-02 pitidos en 3, 2, 1 y uno más agudo en ¡YA!
//   RF-03 chirrido al frenar o girar a fondo yendo rápido; se calla al dejar de hacerlo
//   RF-04 un golpe por choque (rebote o frenada brusca), no al frenar, ni tras Revancha
//   RF-05 en la meta se calla todo y suena la fanfarria; la campanita solo con récord
//   RF-08 con 🔇 el volumen general es cero; se recuerda; la primera vez está prendido
//   RF-09 con la página oculta se pausa; vuelve solo con la carrera en curso
//   RF-11 sin audio en el navegador no hay errores
//   RF-12 notas en los PRD de D8, CLAUDE.md y backlog B6; RNF-03 400 líneas
// ================================================================
'use strict';
const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

class PruebaSonidoCarrera {
    static #RAIZ = path.join(__dirname, '..', '..');
    #fallos = [];
    #ctx;
    #escuchas = {};

    ejecutar() {
        this.#cargar();
        this.#probarPreferencia();
        this.#probarCarrera();
        this.#probarOido();
        this.#probarSinAudio();
        this.#probarDocumentos();
        for (const f of this.#fallos) console.log('❌ ' + f);
        console.log(this.#fallos.length ? `${this.#fallos.length} fallo(s)` : 'Todo OK');
        process.exitCode = this.#fallos.length ? 1 : 0;
    }

    #ok(condicion, mensaje) { if (!condicion) this.#fallos.push(mensaje); }
    #leer(relativo) { return fs.readFileSync(path.join(PruebaSonidoCarrera.#RAIZ, relativo), 'utf8'); }

    // Audio de mentira: anota osciladores (tipo, frecuencias, si siguen sonando), pausas y volumen general
    #audioFalso(registro) {
        const parametro = v => ({ value: v, setValueAtTime(x) { this.value = x; }, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {},
            setTargetAtTime(x) { this.value = x; } });
        return class {
            state = 'running'; currentTime = 0; destination = {};
            constructor() { registro.contextos++; }
            createGain() { const g = { gain: parametro(1), connect() {} }; registro.ganancias.push(g); return g; }
            createOscillator() {
                const o = { type: '', frequency: parametro(0), connect() {}, start() { o.sonando = true; }, stop() { o.sonando = false; } };
                registro.osciladores.push(o); return o;
            }
            resume() { registro.reanudar++; this.state = 'running'; }
            suspend() { registro.suspender++; this.state = 'suspended'; }
        };
    }

    #cargar() {
        const escuchas = this.#escuchas;
        const documento = { hidden: false, addEventListener: (t, f) => { escuchas[t] = f; }, removeEventListener: t => { delete escuchas[t]; } };
        const ctx = { console, Math, Number, Boolean, Infinity, performance, document: documento,
            addEventListener: (t, f) => { escuchas['w:' + t] = f; }, removeEventListener: t => { delete escuchas['w:' + t]; } };
        ctx.window = ctx;
        vm.createContext(ctx);
        for (const f of ['preferencia_sonido', 'audio_juego', 'efecto_sonido', 'sonido_motor', 'sonido_llantas', 'sonido_cuenta',
            'sonido_choque', 'sonido_meta', 'oido_carrera', 'sonidos_carrera']) {
            vm.runInContext(this.#leer(`src/view/sonidos/${f}.js`), ctx, { filename: f });
        }
        this.#ok(!(ctx.__modelErrors?.length), 'las clases cargan sin errores');
        this.#ctx = ctx;
    }

    #almacen() { const d = new Map(); return { d, getItem: k => d.get(k) ?? null, setItem: (k, v) => d.set(k, v) }; }

    #probarPreferencia() {
        const c = this.#ctx, almacen = this.#almacen();
        this.#ok(new c.PreferenciaSonido(almacen).prendido === true, 'RF-08 la primera vez el sonido está prendido');
        new c.PreferenciaSonido(almacen).prendido = false;
        this.#ok(new c.PreferenciaSonido(almacen).prendido === false && almacen.d.has('tr_sonido'), 'RF-08 apagarlo se recuerda (con su propia clave)');
    }

    #probarCarrera() {
        const c = this.#ctx;
        const r = { contextos: 0, osciladores: [], ganancias: [], reanudar: 0, suspender: 0 };
        c.AudioContext = this.#audioFalso(r);
        const audio = new c.AudioJuego(new c.PreferenciaSonido(this.#almacen()));
        this.#ok(r.contextos === 0, 'D7 sin un toque no se crea el audio');
        const s = new c.SonidosCarrera(audio);
        const visor = { velocidad: 0, velocidadMaxBase: 1, pasosUltimoFrame: 1, entradaAcel: 0, entradaDireccion: 0 };
        s.escuchar(visor);
        this.#ok(r.osciladores.length === 0, 'RF-01 antes de la cuenta el motor no suena');
        for (const t of ['3', '2', '1']) s.cuenta(t);
        const pitidos = r.osciladores.map(o => o.frequency.value);
        this.#ok(r.contextos === 1 && pitidos.length === 3 && pitidos.every(f => f === 440), `RF-02 un pitido en 3, 2 y 1 (${pitidos})`);
        s.cuenta('¡YA!');
        const ya = r.osciladores[3], motor = r.osciladores[4];
        this.#ok(ya.frequency.value > 440, 'RF-02 "¡YA!" es más agudo');
        this.#ok(motor?.sonando && motor.type === 'sawtooth', 'RF-01 con ¡YA! arranca el motor');
        const quieto = motor.frequency.value;
        visor.velocidad = 0.8; s.escuchar(visor);
        const rapido = motor.frequency.value;
        visor.velocidad = 0.7; s.escuchar(visor);   // baja de a poco: no es un choque
        this.#ok(rapido > quieto && motor.frequency.value < rapido, `RF-01 el tono del motor sube con la velocidad y baja al frenar (${quieto} → ${rapido} → ${motor.frequency.value})`);
        // Llantas: frenar a fondo yendo rápido
        visor.velocidad = 0.6; visor.entradaAcel = -1; s.escuchar(visor);
        const llantas = r.osciladores.find(o => o.type === 'square' && o.frequency.value > 1000 && o.sonando);
        const volLlantas = () => r.ganancias.filter(g => g.gain.value === 0.07).length;
        this.#ok(llantas && volLlantas() === 1, 'RF-03 al frenar fuerte suenan las llantas');
        visor.entradaAcel = 0; visor.velocidad = 0.58; s.escuchar(visor);
        this.#ok(volLlantas() === 0, 'RF-03 al dejar de frenar se callan');
        // Choque: rebote de frente
        const antes = r.osciladores.length;
        visor.velocidad = -0.2; s.escuchar(visor);
        const golpe = r.osciladores.slice(antes).filter(o => o.frequency.value <= 90).length;
        visor.velocidad = -0.21; s.escuchar(visor);
        this.#ok(golpe === 2 && r.osciladores.length === antes + 2, 'RF-04 un choque suena una sola vez');
        // Página oculta y vuelta
        c.document.hidden = true; this.#escuchas.visibilitychange();
        c.document.hidden = false; this.#escuchas.visibilitychange();
        this.#ok(r.suspender === 1 && r.reanudar >= 1, 'RF-09 con la página oculta se pausa y con la carrera en curso vuelve');
        // Meta sin récord y con récord
        const enMeta = r.osciladores.length;
        s.meta(false);
        const fanfarria = r.osciladores.slice(enMeta);
        this.#ok(!motor.sonando && !llantas.sonando, 'RF-05 en la meta se callan el motor y las llantas');
        this.#ok(fanfarria.length === 4 && !fanfarria.some(o => o.type === 'sine'), 'RF-05 suena la fanfarria, sin campanita si no hay récord');
        const reanudas = r.reanudar;
        c.document.hidden = true; this.#escuchas.visibilitychange(); c.document.hidden = false; this.#escuchas.visibilitychange();
        this.#ok(r.reanudar === reanudas, 'RF-09 con el resultado en pantalla, volver a la página no prende nada');
        const otra = r.osciladores.length;
        s.meta(true);
        this.#ok(r.osciladores.slice(otra).filter(o => o.type === 'sine').length === 2, 'RF-05 con récord nuevo suena además la campanita');
        // Revancha: la vuelta a la salida (velocidad 0) no suena como choque
        s.reiniciar(); s.cuenta('¡YA!');
        visor.velocidad = 0.9; s.escuchar(visor);
        const tras = r.osciladores.length; visor.velocidad = 0; s.reiniciar(); s.cuenta('¡YA!'); s.escuchar(visor);
        this.#ok(!r.osciladores.slice(tras).some(o => o.frequency.value <= 90 && o.type === 'triangle'), 'RF-04 la Revancha no suena como un choque');
        // Silencio
        audio.prendido = false;
        this.#ok(r.ganancias[0].gain.value === 0, 'RF-08 con 🔇 el volumen general queda en cero');
        audio.prendido = true;
        this.#ok(r.ganancias[0].gain.value > 0 && r.ganancias[0].gain.value <= 0.4, 'D6/RF-08 con 🔊 vuelve, con volumen moderado');
        s.destruir();
        this.#ok(!this.#escuchas.visibilitychange && !this.#escuchas['w:pagehide'], 'RF-09 al salir de la carrera deja de escuchar la página');
        this.#ok(r.osciladores.every(o => !o.sonando || o.type !== 'sawtooth'), 'RF-09 al salir de la carrera el motor queda callado');
        delete c.AudioContext;
    }

    #probarOido() {
        const o = new this.#ctx.OidoCarrera();
        const v = (velocidad, pasos = 1) => ({ velocidad, pasosUltimoFrame: pasos, velocidadMaxBase: 1 });
        o.hayChoque(v(0.9), 0);
        let falso = false;
        for (let i = 1, vel = 0.9; i < 30; i++) { vel = Math.max(0, vel - 0.05); if (o.hayChoque(v(vel), i * 16)) falso = true; }
        this.#ok(!falso, 'RF-04 frenar a fondo no suena como choque');
        o.reiniciar(); o.hayChoque(v(0.9), 1000);
        this.#ok(o.hayChoque(v(0.4), 1016) === true, 'RF-04 una frenada brusca que no viene del pedal es un choque');
        this.#ok(o.hayDerrape({ velocidad: 0.9, velocidadMaxBase: 1, entradaAcel: 0, entradaDireccion: 1 }) === true
            && o.hayDerrape({ velocidad: 0.2, velocidadMaxBase: 1, entradaAcel: -1, entradaDireccion: 1 }) === false,
            'RF-03 girar a fondo yendo rápido derrapa; despacio, no');
    }

    #probarSinAudio() {
        const c = this.#ctx;
        delete c.AudioContext; delete c.webkitAudioContext;
        let error = null;
        try {
            const audio = new c.AudioJuego(new c.PreferenciaSonido(this.#almacen()));
            const s = new c.SonidosCarrera(audio);
            s.cuenta('¡YA!'); s.escuchar({ velocidad: 0.5, velocidadMaxBase: 1, pasosUltimoFrame: 1 }); s.meta(true); s.destruir();
            audio.prendido = false;
        } catch (e) { error = e; }
        this.#ok(!error, 'RF-11 sin audio en el navegador el juego sigue sin errores ' + (error?.message ?? ''));
    }

    #probarDocumentos() {
        const prds = fs.readdirSync(path.join(PruebaSonidoCarrera.#RAIZ, 'docs/prds'));
        for (const n of ['001', '002', '004', '005', '006', '008', '013', '015', '016', '017', '018', '019', '020']) {
            const f = prds.find(x => x.startsWith(`prd_${n}`));
            this.#ok(f && /según el PRD 022/.test(this.#leer(`docs/prds/${f}`)), `RF-12 el PRD ${n} tiene la nota del PRD 022`);
        }
        const claude = this.#leer('CLAUDE.md');
        this.#ok(/`EfectoSonido` \|[^\n]*SonidoMotor/.test(claude) && /src\/view\/sonidos\//.test(claude), 'RF-12 CLAUDE.md suma la jerarquía de los sonidos y su carpeta');
        this.#ok(/B6[^\n]*prd_022/.test(this.#leer('docs/BACKLOG.md')), 'RF-12 el backlog enlaza B6 con el PRD 022');
        this.#ok(!/sonido|Sonido/.test(this.#leer('src/style.css')), 'D8 src/style.css no cambia');
        const visor = this.#leer('src/view/pistas/visor_carrera_solo.js');
        this.#ok(visor.split('\n').length - 1 <= 376 && !/[Ss]onido/.test(visor), 'RNF-03 VisorCarreraSolo no se toca');
        this.#ok(!/[Ss]onido/.test(this.#leer('src/view/hud_carrera.js')), 'D8 HudCarrera no se toca');
        for (const f of ['src/controller/controlador_carrera_solo.js', 'src/controller/aplicacion.js', 'src/view/sonidos/sonidos_carrera.js']) {
            this.#ok(this.#leer(f).split('\n').length <= 400, `RNF-03 ${f} no pasa de 400 líneas`);
        }
    }
}

new PruebaSonidoCarrera().ejecutar();
