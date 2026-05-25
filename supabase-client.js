'use strict';

// ================================================================
// CONFIGURACIÓN SUPABASE
// Reemplaza estos valores con los de tu proyecto en supabase.com
// ================================================================
const SUPABASE_URL  = 'TU_SUPABASE_URL_AQUI';
const SUPABASE_KEY  = 'TU_SUPABASE_ANON_KEY_AQUI';

// ================================================================
// CLASE: Multijugador via Supabase Realtime
// ================================================================
class MultiJugador {
    #client;
    #salaId = null;
    #jugadorNum = null;    // 1 o 2
    #canal = null;
    #onOponenteConectado = null;
    #onOponenteProgreso = null;
    #onOponenteGano = null;

    constructor() {
        this.#client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    }

    // Genera código de 4 letras aleatorio
    #generarCodigo() {
        const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        return Array.from({ length: 4 }, () => letras[Math.floor(Math.random() * letras.length)]).join('');
    }

    // Jugador 1: crea sala y devuelve el código
    async crearSala(nombre, color) {
        const codigo = this.#generarCodigo();
        const { error } = await this.#client.from('salas').insert({
            codigo,
            j1_nombre: nombre,
            j1_color: color,
            j1_progreso: 0,
            creada_en: new Date().toISOString(),
        });
        if (error) throw new Error('No se pudo crear la sala: ' + error.message);
        this.#salaId = codigo;
        this.#jugadorNum = 1;
        return codigo;
    }

    // Jugador 2: se une con el código
    async unirSala(codigo, nombre, color) {
        const codigoUp = codigo.toUpperCase();
        const { data, error } = await this.#client
            .from('salas')
            .select()
            .eq('codigo', codigoUp)
            .single();

        if (error || !data) throw new Error('Sala no encontrada');
        if (data.j2_nombre) throw new Error('Sala llena');

        await this.#client.from('salas').update({
            j2_nombre: nombre,
            j2_color: color,
            j2_progreso: 0,
        }).eq('codigo', codigoUp);

        this.#salaId = codigoUp;
        this.#jugadorNum = 2;
        return { j1_nombre: data.j1_nombre, j1_color: data.j1_color };
    }

    // Suscribirse a cambios de la sala en tiempo real
    suscribir(onOponenteConectado, onOponenteProgreso, onOponenteGano) {
        this.#onOponenteConectado = onOponenteConectado;
        this.#onOponenteProgreso = onOponenteProgreso;
        this.#onOponenteGano = onOponenteGano;

        this.#canal = this.#client
            .channel('sala:' + this.#salaId)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'salas',
                filter: `codigo=eq.${this.#salaId}`,
            }, payload => this.#manejarCambio(payload.new))
            .subscribe();
    }

    #manejarCambio(sala) {
        // Oponente se conectó (jugador 2 se unió a la sala del jugador 1)
        if (this.#jugadorNum === 1 && sala.j2_nombre && this.#onOponenteConectado) {
            this.#onOponenteConectado(sala.j2_nombre, sala.j2_color);
        }

        // Progreso del oponente
        const progOp = this.#jugadorNum === 1 ? sala.j2_progreso : sala.j1_progreso;
        if (progOp !== null && this.#onOponenteProgreso) {
            this.#onOponenteProgreso(progOp);
        }

        // Oponente ganó
        if (sala.ganador && sala.ganador !== `j${this.#jugadorNum}` && this.#onOponenteGano) {
            this.#onOponenteGano();
        }
    }

    // Publica el progreso propio
    async publicarProgreso(progreso) {
        if (!this.#salaId) return;
        const campo = `j${this.#jugadorNum}_progreso`;
        await this.#client.from('salas')
            .update({ [campo]: progreso })
            .eq('codigo', this.#salaId);
    }

    // Reporta que este jugador ganó
    async reportarGanador() {
        if (!this.#salaId) return;
        await this.#client.from('salas')
            .update({ ganador: `j${this.#jugadorNum}` })
            .eq('codigo', this.#salaId);
    }

    // Limpia la sala al terminar
    async limpiar() {
        if (this.#canal) this.#client.removeChannel(this.#canal);
        if (this.#salaId) {
            await this.#client.from('salas')
                .delete()
                .eq('codigo', this.#salaId);
        }
    }

    get jugadorNum() { return this.#jugadorNum; }
    get salaId() { return this.#salaId; }
}

window.MultiJugador = MultiJugador;
