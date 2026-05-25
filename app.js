'use strict';

// ================================================================
// FORZAR LANDSCAPE AL INICIAR JUEGO
// ================================================================
function forzarLandscape() {
    // API moderna
    if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('landscape').catch(() => {});
    }
    // Fallback para Safari/otros
    if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
    }
}

function liberarOrientacion() {
    if (screen.orientation && screen.orientation.unlock) {
        screen.orientation.unlock();
    }
    if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
    }
}

// ================================================================
// ESTADO DE LA APP
// ================================================================
const estado = {
    nombre: 'Jugador',
    color: '#ef4444',
    control: 'botones',
    juego: null,
};

// ================================================================
// UTILIDADES DE PANTALLA
// ================================================================
function mostrar(id) {
    document.querySelectorAll('.pantalla').forEach(p => {
        p.classList.remove('activa');
        p.style.display = 'none';
    });
    const el = document.getElementById(id);
    if (el) {
        el.style.display = 'flex';
        el.classList.add('activa');
    }
}

function formatearTiempo(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const seg = s % 60;
    const cent = Math.floor((ms % 1000) / 10);
    return `${m}:${seg.toString().padStart(2,'0')}.${cent.toString().padStart(2,'0')}`;
}

// ================================================================
// DETECTOR DE ORIENTACIÓN
// ================================================================
const PANTALLAS_QUE_REQUIEREN_LANDSCAPE = ['pantalla-juego', 'pantalla-espera'];

function verificarOrientacion() {
    const esMovil = 'ontouchstart' in window;
    const esVertical = window.innerHeight > window.innerWidth;

    const pantallaActiva = [...document.querySelectorAll('.pantalla.activa')]
        .map(p => p.id);

    const necesitaLandscape = pantallaActiva.some(id =>
        PANTALLAS_QUE_REQUIEREN_LANDSCAPE.includes(id)
    );

    const aviso = document.getElementById('aviso-rotar');
    if (esMovil && esVertical && necesitaLandscape) {
        aviso.classList.add('visible');
        // Intentar forzar orientación cada vez que se detecta vertical
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(() => {});
        }
    } else {
        aviso.classList.remove('visible');
    }
}
window.addEventListener('resize', verificarOrientacion);
window.addEventListener('orientationchange', verificarOrientacion);

// ================================================================
// GARAGE — botón tuerca
// ================================================================
document.getElementById('btn-garage').addEventListener('click', () => {
    mostrar('pantalla-ajustes');
});
document.getElementById('btn-volver-ajustes').addEventListener('click', () => mostrar('pantalla-inicio'));
document.getElementById('btn-ir-garage').addEventListener('click', () => {
    mostrar('pantalla-garage');
    iniciarGarage();
});

// ================================================================
// PANTALLA: INICIO — selectores de color y control
// ================================================================
document.getElementById('colores-grid').addEventListener('click', e => {
    const btn = e.target.closest('.color-btn');
    if (!btn) return;
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('sel'));
    btn.classList.add('sel');
    estado.color = btn.dataset.color;
});

document.getElementById('control-tabs').addEventListener('click', e => {
    const btn = e.target.closest('.tab-btn');
    if (!btn) return;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('sel'));
    btn.classList.add('sel');
    estado.control = btn.dataset.ctrl;
});

// Botón: Jugar solo
document.getElementById('btn-solo').addEventListener('click', () => {
    estado.nombre = document.getElementById('inp-nombre').value.trim() || 'Jugador';
    estado.modoSolo = true;
    forzarLandscape();
    iniciarCuentaRegresiva();
});

// Botón: Crear sala
document.getElementById('btn-crear').addEventListener('click', async () => {
    estado.nombre = document.getElementById('inp-nombre').value.trim() || 'Jugador';
    estado.modoSolo = false;
    forzarLandscape();
    mostrar('pantalla-crear');
    await iniciarCrearSala();
});

// Botón: Unirse
document.getElementById('btn-unirse').addEventListener('click', () => {
    estado.nombre = document.getElementById('inp-nombre').value.trim() || 'Jugador';
    mostrar('pantalla-unirse');
});

// Volver
document.getElementById('btn-volver-1').addEventListener('click', () => mostrar('pantalla-inicio'));
document.getElementById('btn-volver-2').addEventListener('click', () => mostrar('pantalla-inicio'));

// ================================================================
// CREAR SALA
// ================================================================
async function iniciarCrearSala() {
    window.multiJugador = new MultiJugador();

    const codigo = await window.multiJugador.crearSala(estado.nombre, estado.color);
    document.getElementById('codigo-display').textContent = codigo;

    document.getElementById('btn-copiar').addEventListener('click', () => {
        navigator.clipboard.writeText(codigo).catch(() => {});
    });

    // Escuchar cuando el oponente se una
    window.multiJugador.suscribir(
        (nombreOp, colorOp) => {
            // Oponente conectado → ir a sala de espera
            prepararSalaEspera(estado.nombre, estado.color, nombreOp, colorOp);
            iniciarCuentaRegresiva();
        },
        progreso => {
            if (estado.juego) estado.juego.actualizarOponente(progreso);
        },
        () => {
            // Oponente llegó primero
            mostrarResultado(false);
        }
    );
}

// ================================================================
// UNIRSE A SALA
// ================================================================
document.getElementById('btn-confirmar-unirse').addEventListener('click', async () => {
    const codigo = document.getElementById('inp-codigo').value.trim().toUpperCase();
    const errEl = document.getElementById('error-unirse');
    errEl.textContent = '';

    if (codigo.length !== 4) {
        errEl.textContent = 'El código debe tener 4 letras';
        return;
    }

    try {
        window.multiJugador = new MultiJugador();
        const datos = await window.multiJugador.unirSala(codigo, estado.nombre, estado.color);

        // Suscribirse a cambios
        window.multiJugador.suscribir(
            null,
            progreso => {
                if (estado.juego) estado.juego.actualizarOponente(progreso);
            },
            () => mostrarResultado(false)
        );

        prepararSalaEspera(datos.j1_nombre, datos.j1_color, estado.nombre, estado.color);
        iniciarCuentaRegresiva();
    } catch (err) {
        errEl.textContent = err.message;
    }
});

// ================================================================
// SALA DE ESPERA Y CUENTA REGRESIVA
// ================================================================
function prepararSalaEspera(nombre1, color1, nombre2, color2) {
    mostrar('pantalla-espera');

    document.getElementById('nombre-j1').textContent = nombre1;
    document.getElementById('dot-j1').style.background = color1;
    document.getElementById('dot-j1').style.boxShadow = `0 0 8px ${color1}`;

    document.getElementById('nombre-j2').textContent = nombre2;
    document.getElementById('dot-j2').style.background = color2;
    document.getElementById('dot-j2').style.boxShadow = `0 0 8px ${color2}`;
}

function iniciarCuentaRegresiva() {
    if (estado.modoSolo) {
        // En modo solo: mostrar cuenta directamente sobre fondo negro
        mostrar('pantalla-espera');
        document.getElementById('nombre-j1').textContent = estado.nombre;
        document.getElementById('dot-j1').style.background = estado.color;
        document.getElementById('nombre-j2').textContent = 'CPU / Sin oponente';
        document.getElementById('dot-j2').style.background = '#475569';
        document.querySelectorAll('.vs-sep').forEach(el => el.textContent = '');
    }

    const el = document.getElementById('cuenta-regresiva');
    const pasos = ['3', '2', '1', '¡YA!'];
    let i = 0;

    mostrar('pantalla-espera');
    const intervalo = setInterval(() => {
        el.textContent = pasos[i];
        i++;
        if (i >= pasos.length) {
            clearInterval(intervalo);
            setTimeout(iniciarJuego, 300);
        }
    }, 900);
}

// ================================================================
// INICIAR JUEGO
// ================================================================
function iniciarJuego() {
    mostrar('pantalla-juego');
    verificarOrientacion();

    // Determinar nombre del oponente
    const oponenteNombre = estado.modoSolo
        ? null
        : (window.multiJugador?.jugadorNum === 1
            ? document.getElementById('nombre-j2').textContent
            : document.getElementById('nombre-j1').textContent);

    estado.juego = new Juego(estado.color, estado.control);

    // Callback cuando termina la carrera
    window.onCarreraTerminada = (tiempoMs, velMax) => {
        if (!estado.modoSolo && window.multiJugador) window.multiJugador.reportarGanador();
        mostrarResultado(true, tiempoMs, velMax);
    };

    estado.juego.iniciar(oponenteNombre);
}

// ================================================================
// RESULTADO
// ================================================================
function mostrarResultado(gane, tiempoMs = null, velMax = 0) {
    if (estado.juego) estado.juego.detener();
    mostrar('pantalla-resultado');

    const tituloEl = document.getElementById('titulo-resultado');
    tituloEl.textContent = gane ? '¡GANASTE! 🏆' : '¡PERDISTE! 💨';
    tituloEl.className = 'resultado-titulo ' + (gane ? 'gane' : 'perdi');

    document.getElementById('stat-tutiempo').textContent = tiempoMs ? formatearTiempo(tiempoMs) : '--';
    document.getElementById('stat-eltiempo').textContent = '--';
    document.getElementById('stat-velmax').textContent = Math.round((velMax / CFG.VEL_MAX) * 220) + ' km/h';
}

// ================================================================
// BOTONES DE RESULTADO
// ================================================================
document.getElementById('btn-revancha').addEventListener('click', () => {
    if (window.multiJugador?.salaId) {
        // Volver a sala de espera con el mismo código
        mostrar('pantalla-crear');
        document.getElementById('codigo-display').textContent = window.multiJugador.salaId;
    } else {
        mostrar('pantalla-inicio');
    }
});

document.getElementById('btn-menu').addEventListener('click', async () => {
    liberarOrientacion();
    if (window.multiJugador) await window.multiJugador.limpiar();
    window.multiJugador = null;
    estado.juego = null;
    mostrar('pantalla-inicio');
});

// ================================================================
// INICIALIZACIÓN
// ================================================================
mostrar('pantalla-inicio');
