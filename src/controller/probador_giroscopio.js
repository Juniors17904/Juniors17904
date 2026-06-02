'use strict';

// ================================================================
// CLASS: ProbadorGiroscopio — verifica y muestra datos del giroscopio
// ================================================================
class ProbadorGiroscopio {
    #handler = null;

    iniciar() {
        const bola    = document.getElementById('burbuja-bola');
        const estado  = document.getElementById('giro-estado');
        const valG    = document.getElementById('val-gamma');
        const valB    = document.getElementById('val-beta');
        const RADIO   = 80;

        if (!window.DeviceOrientationEvent) {
            estado.textContent = '❌ No soportado en este dispositivo';
            estado.style.color = 'var(--neon-r)';
            return;
        }

        this.#handler = e => {
            const gamma = e.gamma ?? 0;
            const beta  = e.beta  ?? 0;

            valG.textContent = gamma.toFixed(1) + '°';
            valB.textContent = beta.toFixed(1)  + '°';

            const x = Math.max(-RADIO, Math.min(RADIO, (gamma / 90) * RADIO));
            const y = Math.max(-RADIO, Math.min(RADIO, (beta  / 90) * RADIO));

            bola.style.left = `calc(50% + ${x}px)`;
            bola.style.top  = `calc(50% + ${y}px)`;

            estado.textContent = '✓ Giroscopio activo';
            estado.style.color = 'var(--neon-g)';
        };

        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(p => {
                    if (p === 'granted') {
                        window.addEventListener('deviceorientation', this.#handler);
                    } else {
                        estado.textContent = '❌ Permiso denegado';
                        estado.style.color = 'var(--neon-r)';
                    }
                })
                .catch(e => {
                    estado.textContent = '❌ ' + e.message;
                    estado.style.color = 'var(--neon-r)';
                });
        } else {
            window.addEventListener('deviceorientation', this.#handler);
        }
    }

    detener() {
        if (this.#handler) {
            window.removeEventListener('deviceorientation', this.#handler);
            this.#handler = null;
        }
        // Resetear UI
        const bola = document.getElementById('burbuja-bola');
        if (bola) { bola.style.left = '50%'; bola.style.top = '50%'; }
        const estado = document.getElementById('giro-estado');
        if (estado) { estado.textContent = 'Esperando datos...'; estado.style.color = ''; }
    }
}

window.ProbadorGiroscopio = ProbadorGiroscopio;
