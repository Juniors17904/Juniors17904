'use strict';

// ================================================================
// CLASS: Aplicacion  (antes App) — controlador principal de la aplicación
// ================================================================
class Aplicacion {
    #estado = {
        nombre: 'Jugador',
        color: '#ef4444',
        control: 'botones',
        timonModelo: 0,
        velocimetroModelo: 0,
        modoSolo: true,
        tipoAuto: 'deportivo',
        pista: 'ciudad',
        juego: null,
    };

    #backNav            = false;
    #vistaConduccion    = new VistaConduccion().cargar();
    #visorDG            = null;
    #dgTouchHandlers    = [];
    #visorDO            = null;
    #carreraSolo        = null;
    #modos              = new ModosDisponibles();   // PRD 002 D8: decide qué modos se ven y se abren

    // PRD 004 D5/D6: un controlador por pantalla
    #inicio                     = null;
    #ajustes                    = null;
    #giroscopio                 = null;
    #pistas                     = null;
    #controles                  = null;
    #velocimetro                = null;
    #controladorVistaConduccion = null;
    #modo2D                     = null;

    constructor() {
        // PRD 002 D7: ya no se usa GestorOrientacion → "GIRA TU CELULAR" nunca se muestra
        this.#modos.aplicarA(document);   // RF-01, RF-04, RF-05
        this.#inicializarEventos();
        history.replaceState({ pantalla: 'pantalla-inicio' }, '');
        this.#mostrar('pantalla-inicio');
        window.addEventListener('popstate', e => {
            const id = e.state?.pantalla;
            if (id) {
                this.#backNav = true;
                this.#mostrar(id);
                this.#backNav = false;
            } else {
                history.pushState({ pantalla: 'pantalla-inicio' }, '');
                this.#backNav = true;
                this.#mostrar('pantalla-inicio');
                this.#backNav = false;
            }
        });
    }

    // ── Navegación ──────────────────────────────────────────────
    #mostrar(id) {
        // PRD 002 D3 / RF-08 / RF-09: pantallas de modos ocultos o "Próximamente" → Inicio.
        // Se evalúa antes de limpiar nada: el visor 3D (o su arranque) ya debe estar marcado.
        if (this.#modos.debeRedirigirAInicio(id, this.#hayVisor3D())) {
            id = 'pantalla-inicio';
            if (this.#backNav) history.replaceState({ pantalla: id }, '');
        }

        // Carrera Solo 3D: liberar al salir y no mostrar la pantalla vacía sin controlador
        if (this.#carreraSolo && id !== 'pantalla-carrera-solo') {
            this.#carreraSolo.detener();
            this.#carreraSolo = null;
        }
        if (id === 'pantalla-carrera-solo' && !this.#carreraSolo) {
            id = 'pantalla-inicio';
            if (this.#backNav) history.replaceState({ pantalla: id }, '');
        }

        if (id !== 'pantalla-juego') {
            this.#td3dPending      = false;
            this.#cir3dArrancando  = false;
        }

        // Ocultar overlays globales al salir del juego
        if (id !== 'pantalla-juego') {
            document.getElementById('ctrl-botones').style.display = 'none';
            document.getElementById('ctrl-accel').style.display   = 'none';
        }

        // Limpiar circuito 3D si está activo y navegamos fuera
        if (this.#cir3d) {
            this.#limpiarCircuito3D();
            this.#vistaConduccion.ocultarOverlay();
        }

        // Limpiar visores al salir de sus pantallas (funciona con botón atrás del SO también)
        const pantallaActual = document.querySelector('.pantalla.activa')?.id;
        if (pantallaActual === 'pantalla-diseno-general' && id !== 'pantalla-diseno-general') {
            this.#detenerVisorDG();
        }
        if (pantallaActual === 'pantalla-diseno-objetos' && id !== 'pantalla-diseno-objetos') {
            this.#detenerVisorDO();
        }

        document.querySelectorAll('.pantalla').forEach(p => {
            p.classList.remove('activa');
            p.style.display = 'none';
        });
        const el = document.getElementById(id);
        if (el) {
            el.style.display = 'flex';
            el.classList.add('activa');
        }
        if (!this.#backNav) {
            history.pushState({ pantalla: id }, '');
        }
    }

    // Hay un visor 3D cargado o arrancando en la pantalla de juego (RF-09)
    #hayVisor3D() {
        return Boolean(this.#td3d || this.#td3dPending || this.#cir3d || this.#cir3dArrancando);
    }

    // ── Eventos ─────────────────────────────────────────────────
    #inicializarEventos() {
        this.#crearControladoresDePantalla();

        document.getElementById('btn-test-drive-3d').addEventListener('click', () => {
            this.#estado.nombre = document.getElementById('inp-nombre').value.trim() || 'Jugador';
            this.#mostrar('pantalla-td3d-selector');
        });
        document.getElementById('btn-volver-td3d-selector').addEventListener('click', () => {
            this.#mostrar('pantalla-ajustes');
        });
        document.getElementById('btn-td3d-simple').addEventListener('click', () => {
            this.#iniciarTestDrive3D();
        });
        document.getElementById('btn-td3d-con-ruta').addEventListener('click', () => {
            this.#entrarCircuito3D('ciudad', 'pantalla-td3d-selector');
        });

        document.getElementById('btn-exit-td3d').addEventListener('click', () => {
            this.#limpiarTestDrive3D();
            this.#mostrar('pantalla-ajustes');
        });
        document.getElementById('btn-exit-cir3d').addEventListener('click', () => {
            this.#limpiarCircuito3D();
            this.#mostrar(this.#cir3dOrigen);
        });

        document.getElementById('btn-ir-garage').addEventListener('click', () => {
            this.#mostrar('pantalla-garage');
            Garaje.iniciar(this.#estado, id => this.#mostrar(id));
        });

        document.getElementById('btn-ir-diseno-general').addEventListener('click', () => {
            this.#mostrar('pantalla-diseno-general');
            this.#iniciarVisorDG();
        });

        document.getElementById('btn-ir-diseno-objetos').addEventListener('click', () => {
            this.#mostrar('pantalla-diseno-objetos');
            this.#iniciarVisorDO();
        });
        document.getElementById('btn-volver-diseno-objetos').addEventListener('click', () => {
            this.#detenerVisorDO();
            this.#mostrar('pantalla-ajustes');
        });
        document.getElementById('btn-volver-diseno-general').addEventListener('click', () => {
            this.#detenerVisorDG();
            document.getElementById('tog-pasto').checked   = true;
            document.getElementById('tog-pista').checked   = true;
            document.getElementById('tog-auto').checked    = true;
            document.getElementById('tog-botones').checked = true;
            document.getElementById('tog-objetos').checked = true;
            document.getElementById('tog-postes').checked  = true;
            document.getElementById('tog-senales').checked = true;
            document.getElementById('tog-flechas').checked = true;
            document.getElementById('tog-montanas').checked = true;
            document.getElementById('tog-cielo').checked   = false;
            this.#mostrar('pantalla-ajustes');
        });
        document.getElementById('btn-recargar-diseno-general').addEventListener('click', () => {
            this.#detenerVisorDG();
            setTimeout(() => this.#iniciarVisorDG(), 150);
        });
        document.getElementById('btn-dg-hamburgesa').addEventListener('click', e => {
            e.stopPropagation();
            document.getElementById('dg-dropdown').classList.toggle('abierto');
        });
        document.addEventListener('click', () => {
            document.getElementById('dg-dropdown').classList.remove('abierto');
        });

        document.getElementById('tog-pasto').addEventListener('change', e => {
            if (this.#visorDG) this.#visorDG.mostrarPasto = e.target.checked;
        });
        document.getElementById('tog-pista').addEventListener('change', e => {
            if (this.#visorDG) this.#visorDG.mostrarPista = e.target.checked;
        });
        document.getElementById('tog-auto').addEventListener('change', e => {
            if (this.#visorDG) this.#visorDG.mostrarAuto = e.target.checked;
        });
        document.getElementById('tog-botones').addEventListener('change', e => {
            if (e.target.checked) this.#vistaConduccion.mostrarOverlay();
            else                  this.#vistaConduccion.ocultarOverlay();
        });
        document.getElementById('tog-objetos').addEventListener('change', e => {
            if (this.#visorDG) this.#visorDG.mostrarObjetos = e.target.checked;
        });
        document.getElementById('tog-postes').addEventListener('change', e => {
            if (this.#visorDG) this.#visorDG.mostrarPostes = e.target.checked;
        });
        document.getElementById('tog-senales').addEventListener('change', e => {
            if (this.#visorDG) this.#visorDG.mostrarSenales = e.target.checked;
        });
        document.getElementById('tog-flechas').addEventListener('change', e => {
            if (this.#visorDG) this.#visorDG.mostrarFlechas = e.target.checked;
        });
        document.getElementById('tog-montanas').addEventListener('change', e => {
            if (this.#visorDG) this.#visorDG.mostrarMontanas = e.target.checked;
        });
        document.getElementById('tog-cielo').addEventListener('change', e => {
            if (this.#visorDG) this.#visorDG.mostrarCielo = e.target.checked;
        });
    }

    // PRD 004 D6: cada pantalla simple tiene su controlador; registran
    // sus eventos en iniciar() y piden navegar con el callback
    #crearControladoresDePantalla() {
        const navegar = id => this.#mostrar(id);
        this.#controles   = new ControladorControles(this.#estado, navegar);
        this.#modo2D      = new ControladorModo2D(this.#estado, navegar, () => this.#limpiarTestDrive3D());
        this.#inicio      = new ControladorInicio(this.#estado, navegar, this.#modos,
            this.#controles, this.#modo2D, () => this.#iniciarCarreraSolo());
        this.#ajustes     = new ControladorAjustes(navegar);
        this.#velocimetro = new ControladorVelocimetro(this.#estado, navegar);
        this.#giroscopio  = new ControladorGiroscopio(navegar);
        this.#controladorVistaConduccion = new ControladorVistaConduccion(this.#vistaConduccion, navegar);
        this.#pistas      = new ControladorPistas(this.#estado, navegar,
            (tipoPista, origen) => this.#entrarCircuito3D(tipoPista, origen));

        this.#inicio.iniciar();
        this.#controles.iniciar();
        this.#velocimetro.iniciar();
        this.#modo2D.iniciar();
        this.#ajustes.iniciar();
        this.#giroscopio.iniciar();
        this.#controladorVistaConduccion.iniciar();
        this.#pistas.iniciar();
    }

    // ── Jugar Solo ───────────────────────────────────────────────
    #iniciarCarreraSolo() {
        this.#carreraSolo?.detener();
        // Se crea antes de #mostrar para que la pantalla no se redirija a Inicio;
        // el constructor no toca el DOM: todo arranca en iniciar()
        const carrera = new ControladorCarreraSolo(
            this.#estado, this.#vistaConduccion, () => this.#mostrar('pantalla-inicio'));
        this.#carreraSolo = carrera;
        this.#mostrar('pantalla-carrera-solo');
        carrera.iniciar();
    }

    // ── Test Drive 3D ────────────────────────────────────────────
    #td3d = null;
    #td3dKeyDown = null;
    #td3dKeyUp = null;
    #td3dTouchHandlers = [];
    #td3dPista = 'ciudad';
    #td3dPending = false;

    #iniciarTestDrive3D(tipoPista = 'ciudad') {
        this.#td3dPending = true;
        if (!window.VisorTestdriveRecto) {
            setTimeout(() => { if (this.#td3dPending) this.#iniciarTestDrive3D(tipoPista); }, 200);
            return;
        }
        this.#td3dPista = tipoPista;
        this.#limpiarPantallaJuego();
        // Lección 6: el arranque queda marcado ANTES de #mostrar para que no redirija a Inicio
        this.#td3dPending = true;
        this.#mostrar('pantalla-juego');

        document.getElementById('canvas-td3d').style.display = 'block';
        document.getElementById('titulo-td3d').style.display = 'block';
        document.getElementById('ctrl-botones').style.display = 'flex';
        document.getElementById('ctrl-accel').style.display = 'flex';
        document.getElementById('btn-exit-td3d').style.display = 'flex';

        const canvas = document.getElementById('canvas-td3d');
        const td = new window.VisorTestdriveRecto(canvas);
        this.#td3d = td;
        this.#td3dPending = false;
        td.cargar(this.#estado.tipoAuto, this.#estado.color);
        td.iniciar();
        const td3dInitRotY = td.rotY;

        this.#td3dKeyDown = e => {
            if (e.key === 'ArrowUp'    || e.key === 'w') td.entradaAcel =  1;
            if (e.key === 'ArrowDown'  || e.key === 's') td.entradaAcel = -1;
            if (e.key === 'ArrowLeft'  || e.key === 'a') td.entradaDireccion = -1;
            if (e.key === 'ArrowRight' || e.key === 'd') td.entradaDireccion =  1;
        };
        this.#td3dKeyUp = e => {
            if (e.key === 'ArrowUp'   || e.key === 'w' ||
                e.key === 'ArrowDown' || e.key === 's') td.entradaAcel = 0;
            if (e.key === 'ArrowLeft' || e.key === 'a' ||
                e.key === 'ArrowRight'|| e.key === 'd') td.entradaDireccion = 0;
        };
        window.addEventListener('keydown', this.#td3dKeyDown);
        window.addEventListener('keyup',   this.#td3dKeyUp);

        this.#td3dTouchHandlers = [];
        const addTouch = (id, onStart, onEnd) => {
            const el = document.getElementById(id);
            el.addEventListener('touchstart', onStart, { passive: true });
            el.addEventListener('touchend',   onEnd);
            this.#td3dTouchHandlers.push({ el, onStart, onEnd });
        };
        addTouch('btn-gas', () => { td.entradaAcel =  1; }, () => { td.entradaAcel = 0; });
        addTouch('btn-rev', () => { td.entradaAcel = -1; }, () => { td.entradaAcel = 0; });
        addTouch('btn-izq', () => { td.entradaDireccion = -1; }, () => { td.entradaDireccion = 0; });
        addTouch('btn-der', () => { td.entradaDireccion =  1; }, () => { td.entradaDireccion = 0; });

        // Slider altura de cámara
        const sliderCam = document.getElementById('slider-cam-height');
        const ctrlCam   = document.getElementById('ctrl-cam-height');
        sliderCam.value = '2.8';
        ctrlCam.style.display = 'flex';
        sliderCam.addEventListener('input', e => { td.alturaCamara = parseFloat(e.target.value); });

        // Minimapa
        const mmCanvas = document.getElementById('minimap-td3d');
        const mmBtn    = document.getElementById('btn-toggle-minimap');
        let   mmVisible = true;
        mmCanvas.style.display = 'block';
        mmBtn.style.display = 'block';
        mmBtn.addEventListener('click', () => {
            mmVisible = !mmVisible;
            mmCanvas.style.display = mmVisible ? 'block' : 'none';
            mmBtn.textContent = mmVisible ? 'MAPA' : 'MAPA ✕';
        });
        const mmCtx = mmCanvas.getContext('2d');
        const MM_W = 90, MM_H = 120;
        const MM_CX = MM_W / 2;
        const MM_PAD = 10;

        // Recorrido (trail) del test drive
        const trailCanvas = document.getElementById('trail-map');
        const trailBtn    = document.getElementById('btn-toggle-trail');
        const trailCtx    = trailCanvas.getContext('2d');
        let trailVisible  = true;
        let trailPts      = [];
        trailCanvas.style.display = 'block';
        trailBtn.style.display    = 'block';
        trailBtn.textContent = 'RECORRIDO';
        trailBtn.onclick = () => {
            trailVisible = !trailVisible;
            trailCanvas.style.display = trailVisible ? 'block' : 'none';
            trailBtn.textContent = trailVisible ? 'RECORRIDO' : 'RECORRIDO ✕';
        };

        // Debug overlay
        document.getElementById('debug-td3d').style.display = 'flex';
        let _dbgLast = performance.now(), _dbgFrames = 0, _dbgFps = 60;
        const _dbgLoop = () => {
            if (!this.#td3d) return;
            _dbgFrames++;
            const now = performance.now();
            if (now - _dbgLast >= 500) {
                _dbgFps = Math.round(_dbgFrames * 1000 / (now - _dbgLast));
                _dbgFrames = 0; _dbgLast = now;
            }
            const s = td.velocidad, a = td.aceleracion;
            const kmh = Math.round(Math.abs(s) * 216);
            document.getElementById('dbg-vel').textContent    = Math.abs(s).toFixed(3);
            document.getElementById('dbg-kmh').textContent    = kmh;
            document.getElementById('dbg-acel').textContent   = (a >= 0 ? '+' : '') + a.toFixed(4);
            document.getElementById('dbg-vmax').textContent   = td.velocidadMax.toFixed(3);
            document.getElementById('dbg-iacel').textContent  = td.entradaAcel ===  1 ? '⬆ GAS'
                                                              : td.entradaAcel === -1 ? '⬇ REVERSA' : 'NEUTRO';
            document.getElementById('dbg-idir').textContent   = td.entradaDireccion < -0.1 ? '◀ IZQ'
                                                              : td.entradaDireccion >  0.1 ? 'DER ▶' : 'RECTO';
            document.getElementById('dbg-px').textContent     = td.px.toFixed(2);
            document.getElementById('dbg-pz').textContent     = td.pz.toFixed(2);
            document.getElementById('dbg-rotx').textContent   = (0).toFixed(1);
            document.getElementById('dbg-rumbo').textContent  = (((td.rotY - td3dInitRotY) * 180 / Math.PI % 360 + 360) % 360).toFixed(1);
            document.getElementById('dbg-rotz').textContent   = (td.rotZ * 180 / Math.PI).toFixed(1);
            document.getElementById('dbg-fps').textContent    = _dbgFps;
            document.getElementById('dbg-camh').textContent   = td.alturaCamara.toFixed(2);
            document.getElementById('dbg-cam-roty').textContent = (td.camRotY * 180 / Math.PI).toFixed(1);
            document.getElementById('dbg-cam-dist').textContent = td.physics.camDist;
            const ph = td.physics;
            document.getElementById('dbg-f-accel').textContent  = ph.constAceleracion;
            document.getElementById('dbg-f-brake').textContent  = ph.constFreno;
            document.getElementById('dbg-f-drag').textContent   = ph.constArrastre;
            document.getElementById('dbg-f-steer').textContent  = ph.constDireccion;
            document.getElementById('dbg-f-maxfwd').textContent = ph.velMaxAdelante;
            document.getElementById('dbg-f-maxrev').textContent = ph.velMaxReversa;

            if (mmVisible) {
                mmCtx.clearRect(0, 0, MM_W, MM_H);
                mmCtx.fillStyle = 'rgba(0,0,0,0.70)';
                mmCtx.roundRect(0, 0, MM_W, MM_H, 8); mmCtx.fill();
                mmCtx.strokeStyle = '#6b7280'; mmCtx.lineWidth = 3; mmCtx.lineCap = 'round';
                mmCtx.beginPath(); mmCtx.moveTo(MM_CX, MM_PAD); mmCtx.lineTo(MM_CX, MM_H - MM_PAD); mmCtx.stroke();
                const mmPy = MM_H - MM_PAD - (td.pz / 950) * (MM_H - MM_PAD * 2);
                const mmPx = MM_CX;
                mmCtx.shadowColor = '#ef4444'; mmCtx.shadowBlur = 8;
                mmCtx.fillStyle = '#ef4444';
                mmCtx.beginPath(); mmCtx.arc(mmPx, mmPy, 4, 0, Math.PI * 2); mmCtx.fill();
                mmCtx.shadowBlur = 0;
            }

            if (trailVisible) {
                const lastTp = trailPts[trailPts.length - 1];
                const ddx = lastTp ? td.px - lastTp[0] : 999;
                const ddz = lastTp ? td.pz - lastTp[1] : 999;
                if (ddx*ddx + ddz*ddz > 0.04) trailPts.push([td.px, td.pz]);
                if (trailPts.length > 3000) trailPts.shift();

                trailCtx.clearRect(0, 0, MM_W, MM_H);
                trailCtx.fillStyle = 'rgba(0,0,0,0.70)';
                trailCtx.roundRect(0, 0, MM_W, MM_H, 8); trailCtx.fill();
                if (trailPts.length > 1) {
                    trailCtx.strokeStyle = '#06b6d4'; trailCtx.lineWidth = 1.5; trailCtx.lineCap = 'round'; trailCtx.lineJoin = 'round';
                    trailCtx.beginPath();
                    trailPts.forEach(([wx, wz], i) => {
                        const tx = MM_CX + (-wx / 3.8) * (MM_W * 0.15);
                        const ty = MM_H - MM_PAD - (wz / 950) * (MM_H - MM_PAD * 2);
                        i === 0 ? trailCtx.moveTo(tx, ty) : trailCtx.lineTo(tx, ty);
                    });
                    trailCtx.stroke();
                }
                const tpx = MM_CX + (-td.px / 3.8) * (MM_W * 0.15);
                const tpy = MM_H - MM_PAD - (td.pz / 950) * (MM_H - MM_PAD * 2);
                trailCtx.shadowColor = '#ef4444'; trailCtx.shadowBlur = 8;
                trailCtx.fillStyle = '#ef4444';
                trailCtx.beginPath(); trailCtx.arc(tpx, tpy, 4, 0, Math.PI * 2); trailCtx.fill();
                trailCtx.shadowBlur = 0;
                trailCtx.fillStyle = 'rgba(255,255,255,0.5)';
                trailCtx.font = '7px monospace';
                trailCtx.fillText('RUTA', 3, 8);
            }

            requestAnimationFrame(_dbgLoop);
        };
        requestAnimationFrame(_dbgLoop);
    }

    #limpiarPantallaJuego() {
        this.#limpiarTestDrive3D();
        this.#limpiarCircuito3D();
        const hide = id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; };
        hide('canvas-td3d');
        hide('canvas-cir3d');
        hide('titulo-td3d');
        hide('titulo-cir3d');
        hide('btn-exit-td3d');
        hide('btn-exit-cir3d');
        hide('ctrl-botones');
        hide('ctrl-accel');
        hide('ctrl-cam-height');
        hide('debug-td3d');
        hide('debug-path');
        hide('minimap-td3d');
        hide('trail-map');
        hide('btn-toggle-minimap');
        hide('btn-toggle-trail');
        hide('btn-toggle-datos');
        hide('btn-toggle-mapas');
        hide('btn-cam-aerea');
        document.getElementById('canvas-carro-3d').style.display = '';
    }

    #limpiarTestDrive3D() {
        this.#td3dPending = false;
        if (!this.#td3d) return;
        this.#td3d.detener();
        this.#td3d = null;
        if (this.#td3dKeyDown) window.removeEventListener('keydown', this.#td3dKeyDown);
        if (this.#td3dKeyUp)   window.removeEventListener('keyup',   this.#td3dKeyUp);
        this.#td3dKeyDown = null;
        this.#td3dKeyUp   = null;
        for (const { el, onStart, onEnd } of this.#td3dTouchHandlers) {
            el.removeEventListener('touchstart', onStart);
            el.removeEventListener('touchend',   onEnd);
        }
        this.#td3dTouchHandlers = [];
        document.getElementById('canvas-td3d').style.display = 'none';
        document.getElementById('titulo-td3d').style.display = 'none';
        document.getElementById('canvas-carro-3d').style.display = '';
        document.getElementById('ctrl-botones').style.display = 'none';
        document.getElementById('ctrl-accel').style.display = 'none';
        document.getElementById('btn-exit-td3d').style.display = 'none';
        document.getElementById('debug-td3d').style.display = 'none';
        document.getElementById('minimap-td3d').style.display = 'none';
        document.getElementById('trail-map').style.display = 'none';
        document.getElementById('btn-toggle-minimap').style.display = 'none';
        document.getElementById('btn-toggle-trail').style.display = 'none';
        document.getElementById('ctrl-cam-height').style.display = 'none';
    }

    // ── Circuito 3D (pista con curvas) ──────────────────────────
    #cir3d = null;
    #cir3dTipoPista = 'ciudad';
    #cir3dOrigen = 'pantalla-detalle-pista';
    #cir3dVisibilityHandler = null;
    #cir3dKeyDown = null;
    #cir3dKeyUp   = null;
    #cir3dTouchHandlers = [];
    #cir3dCanvasTouchStart = null;
    #cir3dCanvasTouchMove  = null;
    #cir3dArrancando       = false;   // PRD 002 RF-09: visor de circuito pedido pero aún no creado

    // Entrada normal a un circuito 3D (Test Drive 3D con ruta y Diseño de Pistas → Entrar).
    // Lección 6: se marca el arranque ANTES de #mostrar para que nunca redirija a Inicio.
    #entrarCircuito3D(tipoPista, origen) {
        this.#cir3dArrancando = true;
        this.#mostrar('pantalla-juego');
        this.#iniciarCircuito3D(tipoPista, origen);
    }

    #iniciarCircuito3D(tipoPista = 'ciudad', origen = 'pantalla-detalle-pista') {
        this.#cir3dArrancando = true;
        const ClaseVisor = origen === 'pantalla-td3d-selector'
            ? window.VisorTestdriveRuta
            : window.VisorCarreraUrbana;
        if (!ClaseVisor) {
            // Si el jugador salió de la pantalla mientras cargaba, #mostrar apaga el arranque
            setTimeout(() => { if (this.#cir3dArrancando) this.#iniciarCircuito3D(tipoPista, origen); }, 150);
            return;
        }
        this.#cir3dTipoPista = tipoPista;
        this.#cir3dOrigen    = origen;
        this.#limpiarPantallaJuego();

        this.#cir3dVisibilityHandler = () => {
            if (!document.hidden && this.#cir3d?.contextLost) {
                GestorAlertas.mostrar('Contexto GPU perdido — recuperando...', 'warn');
                const pista = this.#cir3dTipoPista;
                setTimeout(() => {
                    if (!this.#cir3d || this.#cir3d.contextLost) {
                        this.#limpiarCircuito3D();
                        setTimeout(() => {
                            GestorAlertas.mostrar('Reiniciando circuito...', 'warn');
                            this.#iniciarCircuito3D(pista);
                        }, 500);
                    }
                }, 1000);
            }
        };
        document.addEventListener('visibilitychange', this.#cir3dVisibilityHandler);

        const canvas = document.getElementById('canvas-cir3d');
        canvas.style.display = 'block';
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        const hudCir = document.getElementById('canvas-hud-cir3d');
        hudCir.style.display = 'block';
        hudCir.width  = window.innerWidth;
        hudCir.height = window.innerHeight;
        document.getElementById('canvas-carro-3d').style.display = 'none';
        const tituloCir = document.getElementById('titulo-cir3d');
        tituloCir.textContent = origen === 'pantalla-td3d-selector'
            ? 'TEST DRIVE 3D · CON RUTA'
            : 'CIRCUITO URBANO';
        tituloCir.style.display = 'block';
        document.getElementById('btn-exit-cir3d').style.display = 'block';

        const cir = new ClaseVisor(canvas, tipoPista);
        this.#cir3d = cir;
        this.#cir3dArrancando = false;
        this.#vistaConduccion.aplicarA(cir, this.#estado.timonModelo);
        this.#vistaConduccion.mostrarOverlay();
        cir.cargar(this.#estado.tipoAuto, this.#estado.color);
        cir.setVelocimetroModelo(this.#estado.velocimetroModelo);
        cir.iniciar();
        const cirInitRotY = cir.rotY;

        // Solo 'm' queda aquí — las teclas de conducción las maneja el ControlEntrada activo
        this.#cir3dKeyDown = e => {
            if (e.key === 'm' || e.key === 'M') {
                const libre = cir.toggleMovimientoLibre();
                btnMovLibre.textContent = libre ? 'LIBRE' : 'PATH';
                btnMovLibre.style.color = libre ? '#34d399' : '#a78bfa';
            }
        };
        window.addEventListener('keydown', this.#cir3dKeyDown);

        {
            let prevX = 0, prevY = 0;
            let pinchDist = 0, pinchH = 0, wasPinching = false;
            const getDist = t => {
                const dx = t[0].clientX - t[1].clientX;
                const dy = t[0].clientY - t[1].clientY;
                return Math.sqrt(dx * dx + dy * dy);
            };
            this.#cir3dCanvasTouchStart = e => {
                if (!cir.camAereaActiva) return;
                if (e.touches.length === 2) {
                    pinchDist = getDist(e.touches);
                    pinchH    = cir.camAerea.h;
                } else {
                    prevX = e.touches[0].clientX;
                    prevY = e.touches[0].clientY;
                }
            };
            this.#cir3dCanvasTouchMove = e => {
                if (!cir.camAereaActiva || !cir.camAerea) return;
                e.preventDefault();
                if (e.touches.length === 2) {
                    wasPinching = true;
                    cir.camAerea.h = pinchH * (pinchDist / getDist(e.touches));
                } else if (e.touches.length === 1) {
                    const t = e.touches[0];
                    if (wasPinching) {
                        wasPinching = false;
                        prevX = t.clientX; prevY = t.clientY;
                    } else {
                        const scale = cir.camAerea.h / 300;
                        cir.camAerea.pan((prevX - t.clientX) * scale, (prevY - t.clientY) * scale);
                        prevX = t.clientX; prevY = t.clientY;
                    }
                }
            };
            canvas.addEventListener('touchstart', this.#cir3dCanvasTouchStart, {passive: true});
            canvas.addEventListener('touchmove',  this.#cir3dCanvasTouchMove,  {passive: false});
        }

        const sliderCam = document.getElementById('slider-cam-height');
        sliderCam.value = '2.8';
        document.getElementById('ctrl-cam-height').style.display = 'flex';
        sliderCam.addEventListener('input', e => {
            if (cir.camAereaActiva) cir.setCamAereaAltura(parseFloat(e.target.value));
            else cir.alturaCamara = parseFloat(e.target.value);
        });

        const btnCamAerea = document.getElementById('btn-cam-aerea');
        btnCamAerea.style.display = 'block';
        btnCamAerea.textContent = 'CAM↑';
        btnCamAerea.onclick = () => {
            const activa = cir.toggleCamaraAerea();
            btnCamAerea.textContent = activa ? 'CHASE' : 'CAM↑';
            document.getElementById('ctrl-botones').style.display         = 'none';
            document.getElementById('btn-toggle-datos').style.display     = activa ? 'none'  : 'block';
            document.getElementById('btn-toggle-mapas').style.display     = activa ? 'none'  : 'block';
            document.getElementById('ctrl-cam-height').style.display      = activa ? 'none'  : 'flex';
            cir.entradaAcel = 0; cir.entradaDireccion = 0;
        };

        const btnMovLibre = document.getElementById('btn-mov-libre');
        btnMovLibre.style.display = 'block';
        btnMovLibre.onclick = () => {
            const libre = cir.toggleMovimientoLibre();
            btnMovLibre.textContent = libre ? 'LIBRE' : 'PATH';
            btnMovLibre.style.color = libre ? '#34d399' : '#a78bfa';
        };

        const btnToggleDatos = document.getElementById('btn-toggle-datos');
        btnToggleDatos.style.display = 'block';
        let datosVisible = true;
        btnToggleDatos.onclick = () => {
            datosVisible = !datosVisible;
            document.getElementById('debug-td3d').style.display = datosVisible ? 'flex' : 'none';
            document.getElementById('debug-path').style.display = datosVisible ? 'block' : 'none';
            btnToggleDatos.textContent = datosVisible ? 'DATOS' : 'DATOS ✕';
        };

        const btnToggleMapas = document.getElementById('btn-toggle-mapas');
        btnToggleMapas.style.display = 'block';
        let mapasAreaVisible = true;
        btnToggleMapas.onclick = () => {
            mapasAreaVisible = !mapasAreaVisible;
            mmVisible    = mapasAreaVisible;
            trailVisible = mapasAreaVisible;
            mmCanvas.style.display    = mapasAreaVisible ? 'block' : 'none';
            trailCanvas.style.display = mapasAreaVisible ? 'block' : 'none';
            btnToggleMapas.textContent = mapasAreaVisible ? 'MAPAS' : 'MAPAS ✕';
        };

        document.getElementById('debug-td3d').style.display = 'flex';
        document.getElementById('debug-path').style.display = 'block';

        const mmCanvas = document.getElementById('minimap-td3d');
        mmCanvas.style.display = 'block';
        mmCanvas.style.pointerEvents = 'auto';
        mmCanvas.style.cursor = 'grab';
        {
            let sx, sy, ox, oy;
            mmCanvas.addEventListener('touchstart', e => {
                const t = e.touches[0];
                sx = t.clientX; sy = t.clientY;
                ox = mmCanvas.offsetLeft; oy = mmCanvas.offsetTop;
                e.stopPropagation();
            }, {passive:true});
            mmCanvas.addEventListener('touchmove', e => {
                e.preventDefault(); e.stopPropagation();
                const t = e.touches[0];
                mmCanvas.style.left   = (ox + t.clientX - sx) + 'px';
                mmCanvas.style.top    = (oy + t.clientY - sy) + 'px';
                mmCanvas.style.right  = 'auto';
                mmCanvas.style.bottom = 'auto';
            }, {passive:false});
        }
        const mmCtx = mmCanvas.getContext('2d');
        const MM_W=90, MM_H=120, MM_PAD=10;
        const pistaCfg = window.PISTAS?.[tipoPista];
        let _mmScl=1, _mmOx=0, _mmOy=0;
        const mmCircuit = (() => {
            if (!pistaCfg?.tramos?.length) return null;
            const pts=[];
            let x=0,y=0,angle=-Math.PI/2;
            for (let i=0; i<pistaCfg.totalSegs; i++) {
                const tr=pistaCfg.tramos.find(([d,h])=>i>=d&&i<h);
                angle+=(tr?tr[2]:0)*0.045;
                x-=Math.cos(angle)*1.5; y+=Math.sin(angle)*1.5; pts.push([x,y]);
            }
            const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
            const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
            const scl=Math.min((MM_W-MM_PAD*2)/(maxX-minX||1),(MM_H-MM_PAD*2)/(maxY-minY||1));
            const ox=(MM_W-(maxX-minX)*scl)/2-minX*scl, oy=(MM_H-(maxY-minY)*scl)/2-minY*scl;
            _mmScl=scl; _mmOx=ox; _mmOy=oy;
            return pts.map(([px,py])=>({x:px*scl+ox, y:py*scl+oy}));
        })();
        const RATIO = 1.5/4;
        const wToC = (wx,wz) => ({ x: -wx*RATIO*_mmScl+_mmOx, y: -wz*RATIO*_mmScl+_mmOy });

        const trailCanvas = document.getElementById('trail-map');
        const trailCtx = trailCanvas.getContext('2d');
        trailCanvas.style.display = 'block';
        trailCanvas.style.pointerEvents = 'auto';
        trailCanvas.style.cursor = 'grab';
        {
            let sx, sy, ox, oy;
            trailCanvas.addEventListener('touchstart', e => {
                const t = e.touches[0];
                sx = t.clientX; sy = t.clientY;
                ox = trailCanvas.offsetLeft; oy = trailCanvas.offsetTop;
                e.stopPropagation();
            }, {passive:true});
            trailCanvas.addEventListener('touchmove', e => {
                e.preventDefault(); e.stopPropagation();
                const t = e.touches[0];
                trailCanvas.style.left   = (ox + t.clientX - sx) + 'px';
                trailCanvas.style.top    = (oy + t.clientY - sy) + 'px';
                trailCanvas.style.right  = 'auto';
                trailCanvas.style.bottom = 'auto';
            }, {passive:false});
        }
        const trailPts = [];

        const worldCircuit = cir.pathSamples(300).map(p => [p.x, p.z]);
        const _buildTrailScale = () => {
            if (!worldCircuit) return null;
            const wxs=worldCircuit.map(p=>p[0]), wzs=worldCircuit.map(p=>p[1]);
            const minX=Math.min(...wxs)-8, maxX=Math.max(...wxs)+8;
            const minZ=Math.min(...wzs)-8, maxZ=Math.max(...wzs)+8;
            const scl=Math.min((MM_W-MM_PAD*2)/(maxX-minX),(MM_H-MM_PAD*2)/(maxZ-minZ));
            const ox=(MM_W-(maxX-minX)*scl)/2+maxX*scl;
            const oz=(MM_H-(maxZ-minZ)*scl)/2+maxZ*scl;
            return { scl, ox, oz };
        };
        const _ts = _buildTrailScale();
        const wToT = _ts ? (wx,wz) => ({ x: -wx*_ts.scl+_ts.ox, y: -wz*_ts.scl+_ts.oz }) : null;

        let mmVisible = true;
        let trailVisible = true;
        let _dbgLast=performance.now(), _dbgFrames=0, _dbgFps=60;
        const _dbgLoop = () => {
            if (!this.#cir3d) return;
            _dbgFrames++;
            const now=performance.now();
            if (now-_dbgLast>=500) { _dbgFps=Math.round(_dbgFrames*1000/(now-_dbgLast)); _dbgFrames=0; _dbgLast=now; }
            const s=cir.velocidad, a=cir.aceleracion, kmh=Math.round(Math.abs(s)*216);
            document.getElementById('dbg-vel').textContent   = Math.abs(s).toFixed(3);
            document.getElementById('dbg-kmh').textContent   = kmh;
            document.getElementById('dbg-acel').textContent  = (a>=0?'+':'')+a.toFixed(4);
            document.getElementById('dbg-vmax').textContent  = cir.velocidadMax.toFixed(3);
            document.getElementById('dbg-iacel').textContent = cir.entradaAcel===1?'⬆ GAS':cir.entradaAcel===-1?'⬇ REVERSA':'NEUTRO';
            document.getElementById('dbg-idir').textContent  = cir.entradaDireccion<-0.1?'◀ IZQ':cir.entradaDireccion>0.1?'DER ▶':'RECTO';
            document.getElementById('dbg-rotx').textContent  = (0).toFixed(1);
            document.getElementById('dbg-rumbo').textContent = (((cir.rotY-cirInitRotY)*180/Math.PI%360)+360)%360 |0;
            document.getElementById('dbg-rotz').textContent  = (cir.rotZ*180/Math.PI).toFixed(1);
            document.getElementById('dbg-px').textContent    = cir.px.toFixed(1);
            document.getElementById('dbg-pz').textContent    = cir.pz.toFixed(1);
            document.getElementById('dbg-fps').textContent   = _dbgFps;
            document.getElementById('dbg-camh').textContent      = cir.alturaCamara.toFixed(2);
            document.getElementById('dbg-cam-rotx').textContent  = (cir.camRotX*180/Math.PI).toFixed(1);
            document.getElementById('dbg-cam-roty').textContent  = (cir.camRotY*180/Math.PI|0);
            document.getElementById('dbg-cam-rotz').textContent  = (cir.camRotZ*180/Math.PI).toFixed(1);
            document.getElementById('dbg-cam-dist').textContent  = cir.physics.camDist;
            const ph=cir.physics;
            document.getElementById('dbg-f-accel').textContent = ph.constAceleracion;
            document.getElementById('dbg-f-brake').textContent = ph.constFreno;
            document.getElementById('dbg-f-drag').textContent  = ph.constArrastre;
            document.getElementById('dbg-f-steer').textContent = ph.constDireccion;
            document.getElementById('dbg-f-maxfwd').textContent= ph.velMaxAdelante;
            document.getElementById('dbg-f-maxrev').textContent= ph.velMaxReversa;
            const totalKm = (cir.pathLen / 1000).toFixed(2);
            document.getElementById('dbg-total').textContent = totalKm;
            document.getElementById('dbg-recor').textContent = (cir.progress * cir.pathLen / 1000).toFixed(3);
            const pp  = cir.pathPos;
            const off = Math.sqrt((cir.px-pp.x)**2 + (cir.pz-pp.z)**2);
            const seg = (cir.progress * pistaCfg.totalSegs) | 0;
            const trP = pistaCfg.tramos.find(([d,h]) => seg>=d && seg<h);
            document.getElementById('dbg-seg').textContent    = seg;
            document.getElementById('dbg-curva').textContent  = trP ? trP[2].toFixed(1) : '0.0';
            document.getElementById('dbg-path-x').textContent = pp.x.toFixed(1);
            document.getElementById('dbg-path-z').textContent = pp.z.toFixed(1);
            document.getElementById('dbg-off').textContent    = off.toFixed(2);
            document.getElementById('dbg-lat').textContent    = cir.lateral.toFixed(2);

            if (mmVisible && mmCircuit) {
                mmCtx.clearRect(0,0,MM_W,MM_H);
                mmCtx.fillStyle='rgba(0,0,0,0.70)';
                mmCtx.roundRect(0,0,MM_W,MM_H,8); mmCtx.fill();
                mmCtx.strokeStyle='#6b7280'; mmCtx.lineWidth=2.5; mmCtx.lineCap='round'; mmCtx.lineJoin='round';
                mmCtx.beginPath();
                mmCircuit.forEach((p,i)=>i===0?mmCtx.moveTo(p.x,p.y):mmCtx.lineTo(p.x,p.y));
                mmCtx.closePath(); mmCtx.stroke();
                mmCtx.fillStyle='#f59e0b';
                mmCtx.fillRect(mmCircuit[0].x-5,mmCircuit[0].y-1,10,2);
                const idx=(cir.progress*mmCircuit.length)|0;
                const cp=mmCircuit[Math.min(idx,mmCircuit.length-1)];
                mmCtx.shadowColor='#ef4444'; mmCtx.shadowBlur=8;
                mmCtx.fillStyle='#ef4444';
                mmCtx.beginPath(); mmCtx.arc(cp.x,cp.y,4,0,Math.PI*2); mmCtx.fill();
                mmCtx.shadowBlur=0;
            }

            if (trailVisible) {
                const lastPt = trailPts[trailPts.length-1];
                const ddx = lastPt ? cir.px-lastPt[0] : 999, ddz = lastPt ? cir.pz-lastPt[1] : 999;
                if (ddx*ddx+ddz*ddz > 0.25) trailPts.push([cir.px, cir.pz]);
                if (trailPts.length > 4000) trailPts.shift();

                trailCtx.clearRect(0,0,MM_W,MM_H);
                trailCtx.fillStyle='rgba(0,0,0,0.70)';
                trailCtx.roundRect(0,0,MM_W,MM_H,8); trailCtx.fill();

                if (worldCircuit && wToT) {
                    trailCtx.strokeStyle='#374151'; trailCtx.lineWidth=2.5;
                    trailCtx.lineCap='round'; trailCtx.lineJoin='round';
                    trailCtx.beginPath();
                    worldCircuit.forEach(([wx,wz],i)=>{ const p=wToT(wx,wz); i===0?trailCtx.moveTo(p.x,p.y):trailCtx.lineTo(p.x,p.y); });
                    trailCtx.closePath(); trailCtx.stroke();
                }

                if (wToT && trailPts.length > 1) {
                    trailCtx.strokeStyle='#06b6d4'; trailCtx.lineWidth=1.5;
                    trailCtx.lineCap='round'; trailCtx.lineJoin='round';
                    trailCtx.beginPath();
                    trailPts.forEach(([wx,wz],i)=>{ const p=wToT(wx,wz); i===0?trailCtx.moveTo(p.x,p.y):trailCtx.lineTo(p.x,p.y); });
                    trailCtx.stroke();
                }

                const tc = wToT ? wToT(cir.px, cir.pz) : {x:MM_W/2,y:MM_H/2};
                trailCtx.shadowColor='#ef4444'; trailCtx.shadowBlur=8;
                trailCtx.fillStyle='#ef4444';
                trailCtx.beginPath(); trailCtx.arc(tc.x,tc.y,4,0,Math.PI*2); trailCtx.fill();
                trailCtx.shadowBlur=0;

                if (cir.camAereaActiva && cir.camAerea && wToT) {
                    const zona = cir.camAerea.zonaVisible;
                    const c = wToT(zona.x, zona.z);
                    const r = zona.radio * _ts.scl;
                    trailCtx.strokeStyle='rgba(255,255,255,0.6)'; trailCtx.lineWidth=1.5;
                    trailCtx.setLineDash([3,2]);
                    trailCtx.beginPath(); trailCtx.rect(c.x-r, c.y-r, r*2, r*2); trailCtx.stroke();
                    trailCtx.setLineDash([]);
                }

                trailCtx.fillStyle='rgba(255,255,255,0.5)';
                trailCtx.font='7px monospace';
                trailCtx.fillText('RUTA',3,8);
            }

            requestAnimationFrame(_dbgLoop);
        };
        requestAnimationFrame(_dbgLoop);
    }

    #limpiarCircuito3D() {
        if (!this.#cir3d) return;
        if (this.#cir3dVisibilityHandler) {
            document.removeEventListener('visibilitychange', this.#cir3dVisibilityHandler);
            this.#cir3dVisibilityHandler = null;
        }
        this.#cir3d.detener(); this.#cir3d=null;
        this.#vistaConduccion.destruirControl();
        if (this.#cir3dKeyDown) window.removeEventListener('keydown',this.#cir3dKeyDown);
        this.#cir3dKeyDown=null; this.#cir3dKeyUp=null;
        for (const {el,onStart,onEnd} of this.#cir3dTouchHandlers) {
            el.removeEventListener('touchstart',onStart);
            el.removeEventListener('touchend',onEnd);
        }
        this.#cir3dTouchHandlers=[];
        if (this.#cir3dCanvasTouchStart) {
            const _c = document.getElementById('canvas-cir3d');
            _c.removeEventListener('touchstart', this.#cir3dCanvasTouchStart);
            _c.removeEventListener('touchmove',  this.#cir3dCanvasTouchMove);
            this.#cir3dCanvasTouchStart = null;
            this.#cir3dCanvasTouchMove  = null;
        }
        const _mmC = document.getElementById('minimap-td3d');
        const _trC = document.getElementById('trail-map');
        if (_mmC) { _mmC.style.pointerEvents='none'; _mmC.style.cursor=''; }
        if (_trC) { _trC.style.pointerEvents='none'; _trC.style.cursor=''; }
        document.getElementById('canvas-cir3d').style.display='none';
        document.getElementById('canvas-hud-cir3d').style.display='none';
        document.getElementById('canvas-carro-3d').style.display='';
        document.getElementById('titulo-cir3d').style.display='none';
        document.getElementById('ctrl-accel').style.display='none';
        document.getElementById('btn-exit-cir3d').style.display='none';
        document.getElementById('btn-cam-aerea').style.display='none';
        document.getElementById('btn-toggle-datos').style.display='none';
        document.getElementById('btn-toggle-mapas').style.display='none';
        document.getElementById('btn-mov-libre').style.display='none';
        document.getElementById('ctrl-timon').style.display='none';
        document.getElementById('debug-td3d').style.display='none';
        document.getElementById('debug-path').style.display='none';
        document.getElementById('minimap-td3d').style.display='none';
        document.getElementById('trail-map').style.display='none';
        document.getElementById('btn-toggle-minimap').style.display='none';
        document.getElementById('btn-toggle-trail').style.display='none';
        document.getElementById('ctrl-cam-height').style.display='none';
    }

    // ── Visor 3D de Diseño General ───────────────────────────────
    #iniciarVisorDG() {
        if (!window.VisorDisenoPista) {
            setTimeout(() => this.#iniciarVisorDG(), 200);
            return;
        }
        if (this.#visorDG) return;

        const canvas  = document.getElementById('canvas-dg-visor');
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;

        this.#visorDG = new window.VisorDisenoPista(canvas, window.PISTAS['ciudad']);
        this.#visorDG.cargar(this.#estado.tipoAuto, this.#estado.color);
        this.#visorDG.iniciar();

        document.getElementById('tog-cielo').checked = true;

        // Sincronizar estado real de los toggles (evita bug de timing)
        this.#visorDG.mostrarPasto   = document.getElementById('tog-pasto').checked;
        this.#visorDG.mostrarPista   = document.getElementById('tog-pista').checked;
        this.#visorDG.mostrarAuto    = document.getElementById('tog-auto').checked;
        this.#visorDG.mostrarObjetos = document.getElementById('tog-objetos').checked;
        this.#visorDG.mostrarPostes  = document.getElementById('tog-postes').checked;
        this.#visorDG.mostrarSenales = document.getElementById('tog-senales').checked;
        this.#visorDG.mostrarFlechas = document.getElementById('tog-flechas').checked;
        this.#visorDG.mostrarMontanas = document.getElementById('tog-montanas').checked;
        this.#visorDG.mostrarCielo   = document.getElementById('tog-cielo').checked;

        // Panel de debug — loop RAF que actualiza datos si el panel está visible
        let _dgFps = 60, _dgFrames = 0, _dgFpsLast = performance.now();
        const _dgDbgLoop = () => {
            if (!this.#visorDG) return;
            _dgFrames++;
            const now = performance.now();
            if (now - _dgFpsLast >= 500) {
                _dgFps = Math.round(_dgFrames * 1000 / (now - _dgFpsLast));
                _dgFrames = 0; _dgFpsLast = now;
            }
            const panel = document.getElementById('debug-dg');
            if (panel?.style.display !== 'none') {
                const dg  = this.#visorDG;
                const kmh = Math.round(Math.abs(dg.velocidad) * 216);
                document.getElementById('dgd-kmh').textContent   = kmh;
                document.getElementById('dgd-vmax').textContent  = Math.round(dg.velocidadMax * 216);
                document.getElementById('dgd-gas').textContent   = dg.entradaAcel ===  1 ? '⬆ GAS'
                                                                 : dg.entradaAcel === -1 ? '⬇ FREN' : 'NEUTRO';
                document.getElementById('dgd-steer').textContent = dg.entradaDireccion < -0.1 ? '◀ IZQ'
                                                                 : dg.entradaDireccion >  0.1 ? 'DER ▶' : 'RECTO';
                document.getElementById('dgd-px').textContent    = dg.px.toFixed(1);
                document.getElementById('dgd-pz').textContent    = dg.pz.toFixed(1);
                document.getElementById('dgd-fps').textContent   = _dgFps;
            }
            requestAnimationFrame(_dgDbgLoop);
        };
        requestAnimationFrame(_dgDbgLoop);

        document.getElementById('tog-datos-dg').addEventListener('change', e => {
            document.getElementById('debug-dg').style.display = e.target.checked ? 'flex' : 'none';
        });

        // Activar control (teclado o timón según preferencia)
        this.#vistaConduccion.aplicarA(this.#visorDG, this.#estado.timonModelo);

        // Controles táctiles — activar toggle y mostrar el overlay correcto
        document.getElementById('tog-botones').checked = true;
        this.#vistaConduccion.mostrarOverlay();
        this.#dgTouchHandlers = [];
        const addTouch = (id, onStart, onEnd) => {
            const el = document.getElementById(id);
            el.addEventListener('touchstart', onStart, { passive: true });
            el.addEventListener('touchend',   onEnd);
            this.#dgTouchHandlers.push({ el, onStart, onEnd });
        };
        const dg = this.#visorDG;
        addTouch('btn-gas', () => { dg.entradaAcel =  1; }, () => { dg.entradaAcel = 0; });
        addTouch('btn-rev', () => { dg.entradaAcel = -1; }, () => { dg.entradaAcel = 0; });
        addTouch('btn-izq', () => { dg.entradaDireccion = -1; }, () => { dg.entradaDireccion = 0; });
        addTouch('btn-der', () => { dg.entradaDireccion =  1; }, () => { dg.entradaDireccion = 0; });
    }

    #detenerVisorDG() {
        if (!this.#visorDG) return;
        this.#vistaConduccion.destruirControl();
        for (const { el, onStart, onEnd } of this.#dgTouchHandlers) {
            el.removeEventListener('touchstart', onStart);
            el.removeEventListener('touchend',   onEnd);
        }
        this.#dgTouchHandlers = [];
        this.#visorDG.detener();
        this.#visorDG = null;
    }

    // ── Visor 3D de Diseño de Objetos ────────────────────────────
    #iniciarVisorDO() {
        if (!window.VisorDisenoObjetos) {
            setTimeout(() => this.#iniciarVisorDO(), 200);
            return;
        }
        if (this.#visorDO) return;

        const canvas  = document.getElementById('canvas-do-visor');
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;

        this.#visorDO = new window.VisorDisenoObjetos(canvas);
        this.#visorDO.iniciar();

        const panelCielo   = document.getElementById('do-panel-cielo');
        const inputCielo   = document.getElementById('do-color-cielo');
        const panelMontana = document.getElementById('do-panel-montana');

        document.querySelectorAll('.do-obj-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tipo = btn.dataset.tipo;
                if (tipo === 'cielo') {
                    panelCielo.style.display   = 'block';
                    panelMontana.style.display  = 'none';
                    this.#visorDO?.mostrarCielo(inputCielo.value);
                } else if (tipo === 'montana') {
                    panelCielo.style.display   = 'none';
                    panelMontana.style.display  = 'block';
                    this.#dibujarPreviewMontana();
                } else {
                    panelCielo.style.display   = 'none';
                    panelMontana.style.display  = 'none';
                    this.#visorDO?.mostrar(tipo);
                }
            });
        });

        inputCielo.addEventListener('input', e => {
            this.#visorDO?.mostrarCielo(e.target.value);
        });
    }

    #detenerVisorDO() {
        if (!this.#visorDO) return;
        document.getElementById('do-panel-cielo').style.display  = 'none';
        document.getElementById('do-panel-montana').style.display = 'none';
        this.#visorDO.detener();
        this.#visorDO = null;
    }

    #dibujarPreviewMontana() {
        const canvas = document.getElementById('do-canvas-montana');
        if (!canvas) return;
        if (!window.Cordillera) { setTimeout(() => this.#dibujarPreviewMontana(), 200); return; }
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#040d1e';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(new window.Cordillera().generarCanvas(), 0, 0, canvas.width, canvas.height);
    }
}

// ================================================================
// ARRANCAR
// ================================================================
new Aplicacion();
