# PRD 004 — Dividir los monolitos (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v1 — listo para implementar |
| Fecha | 2026-10-22 |
| Backlog | B10 (`docs/BACKLOG.md`) |
| Relacionado | PRD 003 (regla anti-monolito). No reemplaza ningún PRD. |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si algún requerimiento choca con ellas, mandan las decisiones.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | Se dividen los 4 archivos grandes (`aplicacion.js`, `visor_carrera_solo.js`, `garaje.js` y `visor_diseno_pista.js`) en fases, empezando por `aplicacion.js`. |
| D2 | Alcance | No se cambia ninguna funcionalidad: solo se reorganiza el código por dentro. |
| D3 | Usuarios | El jugador no nota nada: las pantallas, los botones y el comportamiento son los mismos. |
| D4 | Usuarios | Se comprueba con las pruebas actuales en verde y con capturas de cada pantalla tomadas antes y después. |
| D5 | Dominio | `Aplicacion` solo se encarga de navegar entre pantallas y de guardar un controlador por cada una. |
| D6 | Dominio | Controladores nuevos: `ControladorTestDrive3D`, `ControladorDisenoPistas`, `ControladorDisenoGeneral` y `ControladorDisenoObjetos`. |
| D7 | Técnico | `Garaje` deja de ser todo `static`: pasa a ser una clase instanciable dividida en partes con una sola responsabilidad. |
| D8 | Técnico | B10 se cierra cuando ningún archivo pasa de 400 líneas, `scripts/archivos_grandes_aceptados.txt` queda vacío y `CLAUDE.md` ya no tiene excepciones temporales. |

## 1. Contexto y problema
El PRD 003 prohibió crear monolitos nuevos, pero dejó 4 archivos grandes con permiso temporal. `aplicacion.js` tiene 1516 líneas y maneja casi todas las pantallas. Cuatro pantallas no tienen controlador propio. Cualquier cambio en esas zonas es lento y arriesgado.

## 2. Objetivo
Que todos los archivos cumplan la regla anti-monolito sin excepciones y que cada pantalla tenga su propio controlador, sin que el jugador note ningún cambio.

## 3. Público objetivo y usuarios
- **Desarrollador y agentes:** trabajan con archivos chicos, cada uno con una sola tarea.
- **Jugador:** no nota nada.

## 4. Alcance
**In scope:**
- Dividir los 4 archivos grandes.
- Crear los 4 controladores de pantalla.
- Convertir `Garaje` en una clase instanciable.
- Vaciar la lista de archivos grandes aceptados.
- Quitar las excepciones temporales de `CLAUDE.md`.
- Agregar las pruebas y capturas necesarias.

**Out of scope:**
- Funcionalidades nuevas o cambios visuales.
- Las ideas B2 a B9 del backlog.
- Borrar el motor 2D (B2).
- Cambiar las reglas de MVC.

**Lista única de lo que NO se modifica:**
- El comportamiento del juego.
- Los PRD 001, 002 y 003.
- `src/style.css`.
- Las clases del modelo de la carrera: `CarreraVueltas`, `Cronometro` y `MuestraRuta`.
- Las clases de modo: `Modo` y `ModosDisponibles`.
- El motor 2D.

Todo lo demás puede cambiar siempre que el juego funcione igual.

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Monolito | Archivo de más de 400 líneas o clase con más de una responsabilidad. |
| Controlador de pantalla | Clase que maneja una sola pantalla. `Aplicacion` la crea al entrar y la detiene al salir. |
| Navegación | Pasar de una pantalla a otra, incluidos los botones de atrás y adelante. Es lo único que queda en `Aplicacion`. |
| Fase | Un archivo grande dividido y probado antes de pasar al siguiente. |

## 6. Requerimientos funcionales
- **RF-01 (D5):** `Aplicacion` solo navega entre pantallas y guarda un controlador por cada una.
- **RF-02 (D6):** Test Drive 3D, Diseño de Pistas, Diseño General y Diseño de Objetos tienen cada uno su propio controlador.
- **RF-03 (D3):** cada pantalla se ve igual que antes. La captura de antes y la de después coinciden.
- **RF-04 (D3):** los botones de atrás y adelante funcionan igual en todas las pantallas, incluida la redirección del PRD 002.
- **RF-05 (D1):** `visor_carrera_solo.js` y `visor_diseno_pista.js` quedan por debajo de 400 líneas, y la carrera y el Diseño General funcionan igual.
- **RF-06 (D7):** el garaje funciona igual: se puede elegir un carro y el color, y el carro se ve en 3D.
- **RF-07 (D7):** `Garaje` y sus partes no usan métodos `static` para su estado.
- **RF-08 (D8):** ningún archivo `.js` o `.mjs` pasa de 400 líneas y `scripts/archivos_grandes_aceptados.txt` queda vacío.
- **RF-09 (D8):** `CLAUDE.md` ya no tiene excepciones temporales en las secciones "Anti-monolito" y "Visores de pista".
- **RF-10 (D8):** el backlog marca B10 como hecho, con un enlace a este PRD.
- **RF-11 (D2):** no aparecen errores nuevos en la consola en ninguna pantalla.

## 7. Requerimientos no funcionales
- **RNF-01, reglas del proyecto:** todo lo nuevo cumple `CLAUDE.md`: una clase por archivo, nombres en español, campos `#privados`, MVC y la regla anti-monolito.
- **RNF-02, pruebas:** `npm run test:todo` pasa en verde después de **cada fase**, no solo al final. Se agrega una prueba de navegación que entra y sale de todas las pantallas.
- **RNF-03, entrega por fases:** cada fase se lleva a `main` solo cuando sus pruebas están en verde (lecciones 6 y 13).

## 8. Criterios de aceptación del MVP
1. Las 11 pruebas actuales y las nuevas pasan en verde.
2. Las capturas de antes y después de cada pantalla coinciden.
3. Ningún archivo pasa de 400 líneas y la lista de aceptados está vacía.
4. `CLAUDE.md` no tiene excepciones temporales.
5. El Verificador PRD da ✅.

## 9. Riesgos y supuestos
- **Romper la navegación:** `aplicacion.js` es el centro de todo, así que un error ahí afecta a varias pantallas. Por eso se trabaja por fases, con pruebas en cada una.
- **Orden al arrancar los visores:** el arranque de Test Drive 3D y de Diseño de Pistas depende del orden de los pasos (lección 6). Se prueba en un navegador real.
- **Capturas:** algunas pantallas 3D pueden verse con pequeñas diferencias de luz entre una captura y otra. Lo que se compara es la composición de la pantalla, no cada píxel.
- **Garaje:** es la pieza más vieja y menos probada. Se le agrega una prueba antes de dividirlo.

### Historial
- **v1** (2026-10-22): primera versión, sin cambios a las decisiones propuestas.
