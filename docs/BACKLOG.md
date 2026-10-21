# Backlog — TurboRace

Ideas y tareas pendientes que todavía no tienen PRD. Cuando una idea se vaya a construir, se crea su PRD con el PRD CREATOR (`docs/PRD_CREATOR.md`) y aquí se marca con un enlace al PRD.

| # | Idea | Estado | Notas |
|---|---|---|---|
| B1 | **Ocultar el modo 2D sin afectar el juego.** La versión 2D no se quiere dentro del juego. Se ocultan "Clásico 2D", "Test Drive" (2D) y los flujos que dependen del motor 2D. Lo que comparte con el 3D se conserva y se sigue usando: `PISTAS`, timones, velocímetros y `GestorOrientacion`. | 🟡 PRD listo: [`prd_002_ocultar_modo_2d.md`](prds/prd_002_ocultar_modo_2d.md) | Cambia la decisión D1 del PRD 001 (Carrera Solo) ("la 2D se conserva intacta"), así que va en un **PRD nuevo**, sin editar el anterior (lección 19). |
| B2 | **Archivar el motor 2D.** Guardarlo con una etiqueta de git (por ejemplo `v-clasico-2d`) y quitarlo de `main` cuando ya esté oculto. | ⚪ Idea | Depende de B1. Antes hay que sacar `PISTAS` de `model.js`, porque el 3D lo usa. Elimina `CFG` y `NIVELES` como `{ }` y cierra la lección 17 (aviso "GIRA TU CELULAR" sin salida). |
| B4 | **Conectar el selector Botones / Timón / Giroscopio a la carrera 3D.** Hoy el selector de Inicio solo lo respeta el 2D, y la carrera 3D usa la "Vista de conducción". Botones y Timón ya existen en 3D, pero el giroscopio 3D hay que construirlo. | ⚪ Idea | Sale del PRD 002 (D4). El selector se queda visible mientras tanto. |
| B3 | **Multijugador en 3D vertical.** Hoy el multijugador solo existe en 2D y no funciona, porque faltan las claves de Supabase. | ⚪ Idea | **Decidido: se rehace en 3D**, porque la idea siempre fue jugar en 3D. Mientras tanto, el botón queda visible con "Próximamente" (B1). Se puede reutilizar `MultiJugador` (sala, progreso y ganador) y `CarreraVueltas` (progreso de cada jugador). Falta: claves de Supabase, mostrar al rival en la pista 3D y conectar las pantallas de sala con la carrera vertical. |
