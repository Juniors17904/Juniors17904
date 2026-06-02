'use strict';

// ================================================================
// CLASS: GestorAlertas — notificaciones flotantes
// ================================================================
class GestorAlertas {
    static mostrar(msg, tipo = 'info') {
        const el = document.createElement('div');
        el.className = 'toast' + (tipo !== 'info' ? ' ' + tipo : '');
        el.textContent = msg;
        document.body.appendChild(el);
        requestAnimationFrame(() => el.classList.add('visible'));
        setTimeout(() => {
            el.classList.remove('visible');
            setTimeout(() => el.remove(), 400);
        }, 4000);
    }
}

window.GestorAlertas = GestorAlertas;
// Alias de compatibilidad
window.ToastManager = GestorAlertas;
// Mostrar errores acumulados antes de que GestorAlertas existiera
(window.__modelErrors || []).forEach(msg => GestorAlertas.mostrar(msg, 'error'));
window.__modelErrors = [];
