# PRD 005 — Archivar el motor 2D (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v1 — listo para verificar |
| Fecha | 2026-10-24 |
| Backlog | B2 (`docs/BACKLOG.md`) |
| Reemplaza | Ver D9 |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | Se borra de `main` todo lo que solo usa el 2D: `Juego`, `Pista`, `Carro2D`, sus renderizadores, `PantallaJuego`, `GestorOrientacion`, el aviso "GIRA TU CELULAR" y las pantallas 2D. |
| D2 | Alcance | Antes de borrar se crea la etiqueta git `v-clasico-2d`, que guarda el motor 2D completo. |
| D3 | Usuarios | El jugador no nota nada. Las pantallas ocultas desaparecen, pero atrás, adelante y los enlaces siguen llevando a Inicio. |
| D4 | Dominio | `PISTAS` pasa a ser una clase registro (`RegistroPistas`) en su propio archivo y deja de ser `window.PISTAS = {}`. |
| D5 | Dominio | `CFG` y `NIVELES` se borran, porque solo los usa el 2D. Si el 3D necesitara algún valor, ese valor pasa a una clase. |
| D6 | Dominio | "Multijugador" y "Únete" siguen visibles con "Próximamente". `MultiJugador` se conserva para B3. |
| D7 | Técnico | `ModoClasico2D` y `ModoTestDrive2D` se borran y `ModosDisponibles` deja de registrarlos. |
| D8 | Técnico | Se borran las pruebas que solo comprueban el 2D. Las demás siguen en verde. |
| D9 | Dominio | **Reemplaza:** del PRD 001, la D9 ("`GestorOrientacion` no se modifica"). Del PRD 002, la D7 (el aviso queda en la página), la D8 (lista de 6 modos, quedan 4) y el motor 2D, `GestorOrientacion`, `PISTAS` y `ConfigPista*` de su lista de lo que no se modifica. Del PRD 004, el motor 2D, `Modo` y sus subclases y `ModosDisponibles` de su lista de lo que no se modifica. Esos PRD llevan una nota que lo indica. |

## 1. Contexto y problema
El PRD 002 ocultó el modo 2D, pero su código sigue en `main` sin usarse. Ese código mantiene objetos `{ }` prohibidos por `CLAUDE.md` (`CFG`, `NIVELES`, `window.PISTAS`) y el aviso "GIRA TU CELULAR" sin salida (lección 17). Además, cada PRD nuevo tiene que protegerlo en su lista de lo que no se modifica.

## 2. Objetivo
Que `main` solo tenga el juego 3D, con el motor 2D guardado en una etiqueta de git, sin que el jugador note nada.

## 3. Público objetivo y usuarios
- **Jugador:** no nota nada.
- **Desarrollador y agentes:** trabajan con menos código y sin piezas muertas que proteger.
- **Quien quiera ver el 2D:** lo recupera con la etiqueta `v-clasico-2d`.

## 4. Alcance
**In scope:**
- Crear la etiqueta `v-clasico-2d`.
- Borrar el motor 2D, sus pantallas, el aviso y `GestorOrientacion`.
- Crear `RegistroPistas` y borrar `CFG` y `NIVELES`.
- Borrar los modos 2D y sus pruebas.
- Poner las notas de D9 en los PRD 001, 002 y 004.
- Cerrar la lección 17 y marcar B2 en el backlog.

**Out of scope:** el multijugador 3D (B3), conectar el selector de control al 3D (B4), las ideas B5 a B9 y todo lo de la lista única de abajo.

**Lista única de lo que NO se modifica:**
- El comportamiento y el aspecto del juego 3D.
- `MultiJugador`, los timones, los velocímetros y los elementos dibujados en 2D del juego 3D.
- Los datos de cada pista (`ConfigPista*`): solo cambia cómo se registran.
- `CarreraVueltas`, `Cronometro`, `MuestraRuta` y los visores 3D. *(Los visores 3D salen de esta lista según el PRD 007, D8, y `CarreraVueltas` y los visores 3D según el PRD 008, D8.)*
- `src/style.css`.

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Motor 2D | La carrera clásica antigua y todo lo que solo ella usa. |
| Archivar | Guardar el código en una etiqueta de git y quitarlo de `main`. |
| Etiqueta `v-clasico-2d` | Marca en git que permite volver a ver el motor 2D completo. |
| `RegistroPistas` | Clase que guarda las pistas y las entrega por su nombre. |

## 6. Requerimientos funcionales
- **RF-01 (D2):** existe la etiqueta `v-clasico-2d` y en ella el motor 2D está completo.
- **RF-02 (D1):** en `main` no quedan archivos del motor 2D, de `GestorOrientacion` ni del aviso "GIRA TU CELULAR".
- **RF-03 (D1, D3):** `index.html` ya no tiene las pantallas 2D ni el aviso.
- **RF-04 (D3):** atrás, adelante o un enlace a una pantalla que ya no existe lleva a Inicio.
- **RF-05 (D3):** Jugar Solo, Test Drive 3D, Diseño de Pistas, Diseño General, Diseño de Objetos, el garaje y los ajustes funcionan igual que antes.
- **RF-06 (D4):** las pistas se ven y se eligen igual que antes, y se registran en `RegistroPistas`.
- **RF-07 (D5):** en el proyecto no quedan `CFG`, `NIVELES` ni `window.PISTAS`.
- **RF-08 (D6):** "Multijugador" y "Únete" se ven con "Próximamente" y al tocarlos no pasa nada.
- **RF-09 (D7):** ⚙ no muestra modos 2D y `ModosDisponibles` registra solo los 4 modos que quedan.
- **RF-10 (D8):** `npm run test:todo` termina en verde sin pruebas del 2D.
- **RF-11 (D3):** no aparecen errores nuevos en la consola en ninguna pantalla, en vertical ni en horizontal.
- **RF-12 (D9):** los PRD 001, 002 y 004 tienen la nota de D9, el backlog marca B2 como hecho y la lección 17 queda cerrada.

## 7. Requerimientos no funcionales
- **RNF-01 (D4, D5), reglas del proyecto:** todo lo nuevo cumple `CLAUDE.md`: una clase por archivo, español, `#privados`, sin `{ }` como entidad, MVC y la regla anti-monolito.
- **RNF-02 (D3, D8), pruebas:** la prueba de navegación entra y sale de todas las pantallas en un navegador real, en vertical y en horizontal, y los errores de consola cuentan como fallo.
- **RNF-03 (D2), entrega:** la etiqueta se sube antes de borrar nada, y el cambio llega a `main` solo cuando cumple la lista "Antes de llevar algo a main" de `docs/LECCIONES_APRENDIDAS.md`.

## 8. Criterios de aceptación del MVP
1. La etiqueta `v-clasico-2d` existe y tiene el motor 2D.
2. `main` no tiene el motor 2D, `CFG`, `NIVELES`, `window.PISTAS` ni "GIRA TU CELULAR".
3. El juego 3D funciona igual y sin errores nuevos en la consola.
4. `npm run test:todo` pasa en verde y el Verificador PRD da ✅.

## 9. Riesgos y supuestos
- **Algo del 3D usa piezas del 2D sin que se note:** antes de borrar cada archivo se busca quién lo usa, y la prueba de navegación lo confirma.
- **`MultiJugador` depende del 2D:** se conserva tal cual (D6). Si deja de cargar, se anota en B3, pero el botón sigue en "Próximamente".
- **Service worker:** puede servir archivos viejos hasta que se actualice la caché. Se acepta.
- **Orden de los `<script>`:** `RegistroPistas` debe cargarse antes que las pistas.

### Historial
- **v1** (2026-10-24): primera versión, con las 8 decisiones aceptadas por el usuario y los choques con PRD anteriores resueltos en D9.
