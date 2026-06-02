'use strict';

// ================================================================
// CLASS: GestorOrientacion — forzar/detectar landscape
// ================================================================
class GestorOrientacion {
    static #PANTALLAS_LANDSCAPE = ['pantalla-juego', 'pantalla-espera'];
    static #toastTimer = 0;
    static saltarCheck = false;

    static async forzar() {
        if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
            try {
                await document.documentElement.requestFullscreen();
            } catch (e) {
                GestorAlertas.mostrar('Fullscreen: ' + e.message, 'error');
            }
        }
        if (screen.orientation && screen.orientation.lock) {
            try {
                await screen.orientation.lock('landscape');
            } catch (e) {
                GestorAlertas.mostrar('Orientación: ' + e.message, 'error');
            }
        } else {
            GestorAlertas.mostrar('Tu navegador no soporta orientation lock', 'warn');
        }
    }

    static liberar() {
        if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
        }
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
        }
    }

    static verificar() {
        if (GestorOrientacion.saltarCheck) return;
        const esMovil = 'ontouchstart' in window;
        const tipo = screen.orientation?.type ?? '';
        const esVertical = tipo ? tipo.startsWith('portrait') : window.innerHeight > window.innerWidth;
        const pantallaActiva = [...document.querySelectorAll('.pantalla.activa')].map(p => p.id);
        const necesitaLandscape = pantallaActiva.some(
            id => GestorOrientacion.#PANTALLAS_LANDSCAPE.includes(id)
        );
        const aviso = document.getElementById('pantalla-rotar');

        if (esMovil && esVertical && necesitaLandscape) {
            aviso.style.display = 'flex';
            aviso.classList.add('activa');
            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').catch(e => {
                    const ahora = Date.now();
                    if (ahora - GestorOrientacion.#toastTimer > 5000) {
                        GestorOrientacion.#toastTimer = ahora;
                        GestorAlertas.mostrar('Activa la rotación automática del sistema', 'warn');
                    }
                });
            }
        } else {
            aviso.style.display = 'none';
            aviso.classList.remove('activa');
        }
    }

    static iniciarListeners() {
        window.addEventListener('resize', () => GestorOrientacion.verificar());
        window.addEventListener('orientationchange', () => GestorOrientacion.verificar());
    }
}

window.GestorOrientacion = GestorOrientacion;
// Alias de compatibilidad
window.OrientacionManager = GestorOrientacion;
