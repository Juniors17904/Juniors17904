# PRD 005 — Archivar el motor 2D (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v2 — listo para verificar |
| Fecha | 2026-10-24 |
| Backlog | B2 (`docs/BACKLOG.md`) |
| Reemplaza | Ver D9 |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | Se borra de `main` lo que solo usa el 2D. **Clases:** `Juego`, `Pista`, `Segmento`, `Carro2D`, `Controles`, `RenderizadorPista`, `RenderizadorAuto`, `PantallaJuego`, `VisorJuego3D`, `MinimapaConductor`, `GestorOrientacion`, `ControladorModo2D`, `ConfigPistaTestDrive` y `ConfigPistaTestDriveLibre`, y los archivos vacíos de compatibilidad. **Pantallas e ids de `index.html`:** crear sala, unirse, espera, resultado 2D, "GIRA TU CELULAR", `canvas-juego` y `canvas-carro-3d`. **Se quedan:** `pantalla-juego`, `canvas-td3d`, `canvas-cir3d`, `Garaje`, `visor3d.js` y la vista previa del garaje. |
| D2 | Alcance | Antes de borrar se crea y se sube la etiqueta git `v-clasico-2d`, que guarda el motor 2D completo. |
| D3 | Usuarios | El jugador no nota nada. Atrás, adelante o un enlace a una pantalla que ya no existe llevan a Inicio, nunca a una página en blanco. |
| D4 | Dominio | `PISTAS` pasa a ser una clase registro (`RegistroPistas`) en su propio archivo. Las pistas, los visores 3D y los minimapas le piden las pistas a esa clase. |
| D5 | Dominio | `CFG` y `NIVELES` se borran, porque solo los usa el 2D. También se borra lo que las pistas y `EstadoJuego` guardan solo para el 2D, como el nivel fijo de cada pista y la partida 2D en curso. |
| D6 | Dominio | "Multijugador" y "Únete" siguen visibles con "Próximamente". `MultiJugador` y Supabase se conservan sin uso hasta B3. |
| D7 | Técnico | `ModoClasico2D` y `ModoTestDrive2D` se borran, y `ModosDisponibles` registra 4 modos. `ControladorInicio` y `Aplicacion` dejan de usar los modos 2D y `ControladorModo2D`. |
| D8 | Técnico | Las pruebas que solo comprueban el 2D se borran. Las que mezclan 2D y 3D se ajustan, para no perder la cobertura del 3D. |
| D9 | Dominio | **Reemplaza:** del PRD 001, su D9 y `Juego`, `GestorOrientacion` y `ConfigPista*` de su lista de lo que no se modifica. Del PRD 002, sus D7 y D8 y, de su lista de lo que no se modifica, las clases de D1, `PISTAS` y `ConfigPista*`, y en "las clases de la carrera 3D" solo la forma de pedir una pista. Del PRD 004, `ControladorModo2D` de su D6 y RF-02, y el motor 2D, `Modo` y sus subclases y `ModosDisponibles` de su lista. De `CLAUDE.md`, `ControladorModo2D` y `MinimapaConductor` de la tabla de jerarquías. Los PRD llevan una nota que lo indica. |

## 1. Contexto y problema
El PRD 002 ocultó el modo 2D, pero su código sigue en `main` sin usarse. Ese código mantiene objetos `{ }` prohibidos por `CLAUDE.md` (`CFG`, `NIVELES`, `window.PISTAS`) y el aviso "GIRA TU CELULAR" sin salida (lección 17). Además, cada PRD nuevo tiene que protegerlo. Algunas piezas las comparten el 2D y el 3D, por eso D1 nombra una por una lo que se borra y lo que se queda.

## 2. Objetivo
Que `main` solo tenga el juego 3D, con el motor 2D guardado en una etiqueta de git, sin que el jugador note nada.

## 3. Público objetivo y usuarios
- **Jugador:** no nota nada.
- **Desarrollador y agentes:** trabajan con menos código y sin piezas muertas que proteger.
- **Quien quiera ver el 2D:** lo recupera con la etiqueta `v-clasico-2d`.

## 4. Alcance
**In scope:**
- Crear la etiqueta.
- Borrar lo que dice D1 y quitar del 3D los usos de `canvas-carro-3d`.
- Crear `RegistroPistas` y borrar `CFG` y `NIVELES`.
- Borrar los modos 2D y ajustar `ControladorInicio` y `Aplicacion`.
- Borrar o ajustar las pruebas según D8.
- Poner las notas de D9 en los PRD 001, 002 y 004 y actualizar `CLAUDE.md`.
- Cerrar la lección 17 y marcar B2 en el backlog.

**Out of scope:** el multijugador 3D (B3), conectar el selector de control al 3D (B4), las ideas B5 a B9 y todo lo de la lista única de abajo.

**Lista única de lo que NO se modifica:**
- El comportamiento y el aspecto del juego 3D.
- `MultiJugador`, los timones y los velocímetros.
- Los datos de cada pista: forma, tramos, colores y nombre.
- `CarreraVueltas`, `Cronometro` y `MuestraRuta`.
- `src/style.css`. Sus reglas del 2D quedan sin uso y se aceptan.
- En los visores 3D y en los minimapas que se conservan, solo cambia cómo piden una pista (D4).

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Motor 2D | La carrera clásica antigua y todo lo que solo ella usa (lista en D1). |
| Pieza compartida | Algo que usan el 2D y el 3D, como `pantalla-juego` o las pistas. Se queda. |
| Archivar | Guardar el código en una etiqueta de git y quitarlo de `main`. |
| `RegistroPistas` | Clase que guarda las pistas y las entrega por su nombre. |

## 6. Requerimientos funcionales
- **RF-01 (D2):** la etiqueta `v-clasico-2d` existe en GitHub y con ella se puede abrir el juego con el modo 2D completo.
- **RF-02 (D1, D3):** en ninguna pantalla aparecen "GIRA TU CELULAR", crear sala, unirse, espera ni el resultado 2D.
- **RF-03 (D3):** atrás, adelante o un enlace a una pantalla borrada muestra Inicio, nunca una página en blanco.
- **RF-04 (D1, D3):** Test Drive 3D (Simple y Con Ruta) y Diseño de Pistas → Entrar se abren, se juegan y se salen igual que antes.
- **RF-05 (D3):** Jugar Solo, Diseño General, Diseño de Objetos, el garaje con su vista previa y los ajustes funcionan igual que antes.
- **RF-06 (D4):** la lista de pistas muestra las mismas pistas y al elegir una se abre igual que antes.
- **RF-07 (D6):** "Multijugador" y "Únete" se ven con "Próximamente" y al tocarlos no pasa nada.
- **RF-08 (D7):** ⚙ no muestra modos 2D y el selector de Inicio sigue igual.
- **RF-09 (D3):** no aparecen errores nuevos en la consola en ninguna pantalla, en vertical ni en horizontal.
- **RF-10 (D9):** los PRD 001, 002 y 004 tienen la nota de D9, `CLAUDE.md` ya no nombra las clases borradas, el backlog marca B2 como hecho y la lección 17 queda cerrada.

## 7. Requerimientos no funcionales
- **RNF-01 (D1, D4, D5, D7), código:** en `src/`, `index.html` y `pruebas/` no quedan las clases de D1, `CFG`, `NIVELES`, `window.PISTAS` ni los modos 2D. `RegistroPistas` es una clase en su propio archivo y se carga antes que las pistas. Todo cumple `CLAUDE.md`: una clase por archivo, nombres en español, campos `#privados`, sin `{ }` como entidad, MVC y la regla anti-monolito.
- **RNF-02 (D8), pruebas:** `npm run test:todo` termina en verde. Las pruebas ajustadas siguen cubriendo el 3D, y hay pruebas nuevas para la etiqueta, el registro de pistas, las pantallas borradas y las notas. La prueba de navegación recorre todas las pantallas en vertical y en horizontal, y los errores de consola cuentan como fallo.
- **RNF-03 (D2), entrega:** la etiqueta se sube antes del primer borrado, y el cambio llega a `main` solo cuando cumple la lista "Antes de llevar algo a main" de `docs/LECCIONES_APRENDIDAS.md`.

## 8. Criterios de aceptación del MVP
1. La etiqueta `v-clasico-2d` existe y tiene el motor 2D.
2. `main` no tiene el motor 2D ni "GIRA TU CELULAR", y el 3D funciona igual sin errores nuevos.
3. `npm run test:todo` pasa en verde y el Verificador PRD da ✅.

## 9. Riesgos y supuestos
- **Una pieza compartida que nadie vio:** antes de borrar cada archivo o id se busca quién lo usa, y la prueba de navegación lo confirma.
- **Pistas que desaparecen sin aviso:** si `RegistroPistas` carga tarde, las pistas no se registran y no salta ningún error. RNF-01 exige el orden de carga y una prueba lo comprueba.
- **Código sin uso aceptado:** `MultiJugador`, Supabase y las reglas del 2D en `src/style.css` quedan sin uso hasta B3 o hasta otro PRD.
- **Service worker:** puede servir archivos viejos hasta que se actualice la caché. Se acepta.

### Historial
- **v1** (2026-10-24): primera versión.
- **v2** (2026-10-24): correcciones del Verificador PRD aprobadas por el usuario.
  - D1 nombra una por una las piezas que se borran y las que se quedan.
  - D3 pide volver a Inicio en lugar de mostrar una página en blanco.
  - D5 y D7 incluyen lo que el 2D deja en las pistas, en `EstadoJuego` y en `ControladorInicio`.
  - D8 pide ajustar las pruebas mixtas.
  - D9 suma la lista del PRD 001, `ControladorModo2D` y `CLAUDE.md`.
  - La lista única ya no choca con el registro de pistas.
  - Los RF de código pasan a RNF-01.
