# PRD 005 — Archivar el motor 2D (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v5 — implementado y verificado (Verificador PRD ✅) |
| Fecha | 2026-10-24 |
| Backlog | B2 (`docs/BACKLOG.md`) |
| Reemplaza | Ver D9 |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna de ellas, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | **Se borran estas clases:** `Juego`, `Pista`, `Segmento`, `Carro2D`, `Controles`, `RenderizadorPista`, `RenderizadorAuto`, `PantallaJuego`, `VisorJuego3D`, `MinimapaConductor`, `GestorOrientacion`, `ControladorModo2D`, `ConfigPistaTestDrive` y `ConfigPistaTestDriveLibre`. **Se borran estos archivos de compatibilidad:** `app.js`, `game.js`, `garage.js` (cáscara vacía; no confundir con `garaje.js`, que se queda), `minimap.js`, `view_pista2d.js`, `viewer3d.js` y `model.js`. **Se borran estos ids de `index.html`:** `pantalla-crear`, `pantalla-unirse`, `pantalla-espera`, `pantalla-resultado`, `pantalla-rotar`, `canvas-juego`, `canvas-carro-3d`, `btn-test-drive` y `btn-clasico-2d`. **Se quedan:** `pantalla-juego`, `canvas-td3d`, `canvas-cir3d`, los botones Multijugador y Únete, `Garaje` y `visor3d.js`, que `index.html` pasa a cargar directamente. |
| D2 | Alcance | Antes de borrar se crea y se sube la rama de archivo `archivo/v-clasico-2d`, que guarda el código 2D completo. |
| D3 | Usuarios | El jugador no nota nada. Atrás, adelante o un enlace a una pantalla que no existe llevan a Inicio, nunca a una página en blanco. |
| D4 | Dominio | `PISTAS` pasa a ser `RegistroPistas`: una sola instancia, creada en su propio archivo `registro_pistas.js`, que se carga antes que las pistas. Las pistas se registran en ella, y los controladores, visores y minimapas le piden las pistas. |
| D5 | Dominio | Se borran `CFG` y `NIVELES`. También se borran los campos que solo usa el 2D. En `EstadoJuego`: `juego` y `modoSolo`. En las pistas: `nivelFijo`, `distMeta`, `esTestDrive`, `obstFrecuencia`, `obstTipos`, `coloresTrafico`, `cesped`, `asfalto` y `borde`. `nombre` y `control` se quedan para B4. |
| D6 | Dominio | "Multijugador" y "Únete" siguen visibles con "Próximamente". `MultiJugador` y Supabase se conservan sin uso hasta B3. |
| D7 | Técnico | Se borran `ModoClasico2D` y `ModoTestDrive2D`. `ModosDisponibles` registra 4 modos y conserva el estado "oculto" para modos futuros. `ControladorInicio` y `Aplicacion` dejan de usar los modos 2D y `ControladorModo2D`. `ModoMultijugador` y `ModoUnirse` quitan de sus listas solo los 4 ids de pantallas borradas y conservan `pantalla-juego`, para que la pantalla de juego sin visor siga llevando a Inicio. |
| D8 | Técnico | Se quitan las partes de las pruebas que solo comprueban el 2D, y se conserva la cobertura del 3D. Se ajustan `prueba_modos.js`, `prueba_ocultar_modo_2d.mjs`, `prueba_carrera_solo.mjs` y `prueba_visor_controlador.mjs`. |
| D9 | Dominio | **Reemplaza:** del PRD 001, su D9, y `Juego`, `GestorOrientacion` y `ConfigPista*` de su lista de lo que no se modifica. Del PRD 002, su D7; de su D8, solo `ModoClasico2D` y `ModoTestDrive2D`; y de su lista de lo que no se modifica, las clases de D1, `PISTAS`, `ConfigPista*`, la frase "Solo cambian…" y, en las clases de la carrera 3D y en los elementos dibujados en 2D, la forma de pedir una pista y los usos de `canvas-carro-3d`. Del PRD 004, `ControladorModo2D` de su D6 y RF-02, y de su lista de lo que no se modifica, el motor 2D, `Modo` y sus subclases, `ModosDisponibles` y "las decisiones de los PRD 001, 002 y 003". De `CLAUDE.md`, `ControladorModo2D` y `MinimapaConductor` de la tabla de jerarquías, y `juego.js` y `Minimapa` de la sección MVC. Los PRD llevan una nota que lo indica. |

## 1. Contexto y problema
El PRD 002 ocultó el modo 2D, pero su código sigue en `main` sin usarse. Ese código mantiene objetos `{ }` prohibidos por `CLAUDE.md` (`CFG`, `NIVELES`, `window.PISTAS`) y el aviso "GIRA TU CELULAR" sin salida (lección 17). Además, cada PRD nuevo tiene que protegerlo. Como el 2D y el 3D comparten piezas, D1 nombra una por una lo que se borra y lo que se queda.

## 2. Objetivo
Que `main` solo tenga el juego 3D, con el código 2D guardado en una rama de archivo, sin que el jugador note nada.

## 3. Público objetivo y usuarios
- **Jugador:** no nota nada.
- **Desarrollador y agentes:** trabajan con menos código y sin piezas muertas que proteger.
- **Quien quiera ver el 2D:** recupera el código con la rama `archivo/v-clasico-2d`.

## 4. Alcance
**In scope:**
- Crear la rama de archivo.
- Borrar lo que dice D1 y quitar del 3D los usos de `canvas-carro-3d`.
- Crear `RegistroPistas` y borrar lo que dice D5.
- Borrar los modos 2D y ajustar `ControladorInicio`, `Aplicacion`, `ModoMultijugador` y `ModoUnirse`.
- Ajustar las pruebas de D8.
- Poner las notas de D9 en los PRD 001, 002 y 004 y actualizar `CLAUDE.md`.
- Cerrar la lección 17 y marcar B2 en el backlog.

**Out of scope:** el multijugador 3D (B3), conectar el selector de control al 3D (B4), las ideas B5 a B9 y todo lo de la lista única.

**Lista única de lo que NO se modifica:**
- El comportamiento y el aspecto del juego 3D. *(El manejo cambia según el PRD 006, D8; el manejo y el garaje según el PRD 007, D8; el pasto y los choques según el PRD 008, D8.)* *(El tamaño del carro, la cámara y el piano de la recta cambian según el PRD 009, D12.)* *(El aspecto del árbol, el poste y la señal cambia según el PRD 010, D9.)* *(La señalética cambia según el PRD 011, D11.)*
- `MultiJugador`, los timones y los velocímetros.
- Los datos de cada pista que usa el 3D: forma, tramos, nombre y colores de la escena 3D.
- `CarreraVueltas`, `Cronometro` y `MuestraRuta`. *(`CarreraVueltas` sale de esta lista según el PRD 008, D8.)*
- `model_fisica.js` y `movimiento_libre.js`. *(Salen de esta lista según el PRD 006, D8.)*
- `src/style.css`. Sus reglas del 2D quedan sin uso y se aceptan. *(Solo agregar estilos de las barras del garaje, según el PRD 007, D8.)*
- En los visores 3D, los minimapas y los controladores que se conservan, solo cambia cómo piden una pista (D4) y, donde está, el uso de `canvas-carro-3d`. En `ControladorInicio`, `Aplicacion`, `ModoMultijugador` y `ModoUnirse` cambia solo lo que piden D3, D5 y D7. *(`VisorCarreraSolo`, `VisorTestdriveRecto`, `VisorTestdriveRuta`, `VisorCarreraUrbana` y `VisorDisenoPista` también cambian según los PRD 006 y 007, D8; `VisorCarreraSolo` y `ControladorCarreraSolo` según el PRD 008, D8; `ControladorCarreraSolo`, `ControladorTestDrive3D`, `ControladorDisenoPistas`, `ControladorDisenoGeneral` y `ControladorGaraje` según el PRD 007, D8; `ControlesCircuito3D`, solo el renombre, según el PRD 006, D8.)* *(Los 5 visores, `Visor3D` y `RecorridoTestDriveRecto` cambian también según el PRD 009, D12.)* *(`VisorDisenoObjetos` cambia su encuadre según el PRD 010, D9.)*

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Motor 2D | La carrera clásica antigua y lo que solo ella usa (lista en D1 y D5). |
| Pieza compartida | Algo que usan el 2D y el 3D, como `pantalla-juego` o las pistas. Se queda. |
| Archivar | Guardar el código en una rama de archivo y quitarlo de `main`. |
| `RegistroPistas` | Clase que guarda las pistas y las entrega por su nombre. |

## 6. Requerimientos funcionales
- **RF-01 (D2):** la rama `archivo/v-clasico-2d` existe en GitHub y guarda el código 2D completo.
- **RF-02 (D1, D3):** en ninguna pantalla aparecen "GIRA TU CELULAR", las pantallas de crear sala, unirse a sala, espera ni resultado 2D, ni los botones 2D de ⚙.
- **RF-03 (D3):** atrás, adelante o un enlace a una pantalla que no existe muestra Inicio, nunca una página en blanco.
- **RF-04 (D1, D3):** Test Drive 3D (Simple y Con Ruta) y Diseño de Pistas → Entrar se abren, se juegan y se salen igual que antes.
- **RF-05 (D1, D3):** Jugar Solo, Diseño General, Diseño de Objetos, el garaje con su vista previa 3D y los ajustes funcionan igual que antes.
- **RF-06 (D4):** la lista de pistas muestra las mismas pistas y al elegir una se abre igual que antes.
- **RF-07 (D6):** "Multijugador" y "Únete" se ven con "Próximamente" y al tocarlos no pasa nada.
- **RF-08 (D7):** ⚙ no muestra modos 2D y el selector de Inicio sigue igual.
- **RF-09 (D3):** no aparecen errores nuevos en la consola en ninguna pantalla, en vertical ni en horizontal.
- **RF-10 (D9):** los PRD 001, 002 y 004 tienen la nota de D9, `CLAUDE.md` ya no nombra las clases borradas, el backlog marca B2 como hecho y la lección 17 queda cerrada.

## 7. Requerimientos no funcionales
- **RNF-01 (D1, D4, D5, D7), código:** en `src/`, `index.html` y `pruebas/` no quedan las clases, los archivos ni los ids de D1, ni `CFG`, `NIVELES`, `window.PISTAS` o los campos de D5. Los nombres que aparecen solo como texto de ejemplo en pruebas de reglas (por ejemplo `ModoClasico2D`) pueden quedar. Todo lo nuevo o modificado cumple `CLAUDE.md` (`MultiJugador` en `supabase-client.js` queda como está, por D6): una clase por archivo, nombres en español, campos `#privados`, sin `{ }` como entidad, MVC y la regla anti-monolito.
- **RNF-02 (D8), pruebas:** `npm run test:todo` termina en verde. Hay pruebas nuevas para la rama de archivo, `RegistroPistas` y su orden de carga, las pantallas borradas y las notas. La prueba de navegación recorre todas las pantallas en vertical y en horizontal, y los errores de consola cuentan como fallo.
- **RNF-03 (D2), entrega:** la rama de archivo se sube antes del primer borrado, y el cambio llega a `main` solo cuando cumple la lista "Antes de llevar algo a main" de `docs/LECCIONES_APRENDIDAS.md`.

## 8. Criterios de aceptación del MVP
1. La rama `archivo/v-clasico-2d` existe y guarda el código 2D.
2. `main` no tiene el motor 2D ni "GIRA TU CELULAR", y el 3D funciona igual sin errores nuevos.
3. `npm run test:todo` pasa en verde y el Verificador PRD da ✅.

## 9. Riesgos y supuestos
- **Una pieza compartida que nadie vio:** antes de borrar cada archivo o id se busca quién lo usa, y la prueba de navegación lo confirma.
- **Pistas que desaparecen sin aviso:** si `RegistroPistas` carga tarde, las pistas no se registran y no salta ningún error. Por eso hay una prueba del orden de carga (RNF-02).
- **Código sin uso aceptado:** `MultiJugador`, Supabase, el estado "oculto" de los modos y las reglas del 2D en `src/style.css`.
- **Service worker:** puede servir archivos viejos hasta que se actualice la caché. Se acepta.

### Historial
- **v1** (2026-10-24): primera versión.
- **v2** (2026-10-24): correcciones del Verificador PRD, aprobadas por el usuario. Se nombran las piezas, se pide volver a Inicio en lugar de mostrar una página en blanco y se amplía D9.
- **v3** (2026-10-24): Reparador PRD, vuelta 1.
  - Detalles: RF-01 habla del código guardado; D9 completa con los PRD 002 y 004 y `CLAUDE.md`; se nombran los archivos de compatibilidad y las pruebas; se aclara RNF-01.
  - Decisiones aprobadas por el usuario: borrar `viewer3d.js` y los botones 2D; los campos de D5; `RegistroPistas` como instancia única; conservar el estado "oculto"; limpiar MVC en `CLAUDE.md`; no tocar `model_fisica.js`.
- **v4** (2026-10-24): Reparador PRD, vuelta 2 (solo detalles). D7 nombra `ModoMultijugador` y `ModoUnirse` y conserva `pantalla-juego` en sus listas. D9 libera también los elementos dibujados en 2D del PRD 002. La lista única permite los cambios de D3, D5 y D7. RNF-01 se limita a lo nuevo o modificado. Vuelta 3: se aclara que se borra `garage.js` y no `garaje.js`; Verificador ✅.
- **v5** (2026-10-24): D2 pasa de etiqueta a rama de archivo `archivo/v-clasico-2d`, porque GitHub rechaza subir etiquetas desde la sesión (403). Aprobado por el usuario.
- **Cierre** (2026-10-24): implementado en 3 fases (commits a4357f8, 37a8d30 y 77948bd). Verificador PRD ✅; nota en la D7 del PRD 001, que solo limitaba su propia entrega.
