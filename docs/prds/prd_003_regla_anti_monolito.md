# PRD 003 — Regla anti-monolito (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v2 — implementado y verificado (Verificador PRD ✅), con pruebas en `pruebas/` |
| Fecha | 2026-10-22 |
| Relacionado | PRD 001 y PRD 002 (no los reemplaza) |

## Decisiones bloqueadas

Estas decisiones se tomaron con el usuario y son definitivas. Si un requerimiento choca con alguna, manda la decisión.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | Ningún archivo `.js` o `.mjs` del juego (`src/` y raíz) ni de `pruebas/` puede pasar de **400 líneas**. *(v2: también `pruebas/`)* |
| D2 | Alcance | Este PRD solo crea la regla y el chequeo. Dividir los archivos grandes que ya existen es B10, en un PRD aparte. |
| D3 | Usuarios | La regla afecta al desarrollador y a los agentes. El jugador no nota nada. |
| D4 | Usuarios | **Solo los 4 archivos grandes listados en §5** pueden pasar de 400 líneas, y solo generan un aviso. **Cualquier otro archivo** que pase de 400 líneas **bloquea**, sea nuevo o existente. *(v2)* |
| D5 | Dominio | Una clase tiene una sola responsabilidad: si para describirla hay que decir "y además…", se divide. Lo revisa a mano el Verificador PRD. |
| D6 | Dominio | MVC sigue igual. **Cada pantalla tiene su propio controlador**: en `CLAUDE.md` pasa de excepción a regla. Las 4 pantallas que hoy no lo cumplen (Test Drive 3D, Diseño de Pistas, Diseño General y Diseño de Objetos) se aceptan como están hasta B10. *(v2)* |
| D7 | Técnico | La regla queda escrita en `CLAUDE.md` (sección "Anti-monolito", que reemplaza la excepción de controladores) y en el PRD CREATOR. |
| D8 | Técnico | El chequeo corre solo en cada commit (se instala con `npm install`) y también con `npm test`. De paso se corrige el aviso falso de R3 con nombres que llevan número (`ModoClasico2D`). |

## 1. Contexto y problema
Algunos archivos crecieron hasta convertirse en monolitos: `aplicacion.js` tiene 1516 líneas y maneja todas las pantallas. Cuesta entenderlos, cualquier cambio puede romper otra cosa y los agentes se equivocan más. Hoy no hay ninguna regla de tamaño, y el chequeo de arquitectura no está instalado en git, así que no bloquea ningún commit.

## 2. Objetivo
Que ningún archivo nuevo ni ninguna prueba se conviertan en monolito, que el chequeo avise y bloquee por su cuenta, y que los archivos grandes que ya existen queden identificados para dividirlos después.

## 3. Público objetivo y usuarios
- **Desarrollador:** sabe cuánto puede medir un archivo y el commit se bloquea si lo pasa.
- **Agentes de Claude:** leen la regla en `CLAUDE.md` y la cumplen al escribir código y pruebas.
- **Jugador:** no nota nada.

## 4. Alcance
**In scope:**
- La sección "Anti-monolito" en `CLAUDE.md` y en el PRD CREATOR.
- El chequeo de líneas, que se instala solo en git.
- La lista de los 4 archivos grandes que se aceptan.
- La corrección del aviso de R3.
- El Verificador PRD revisando la responsabilidad única.
- B5 a B10 en el backlog.

**Out of scope:** dividir archivos existentes o pantallas (B10); cualquier cambio en el juego.

**Lista única de lo que NO se modifica:** todo `src/`, `index.html`, `vista_conduccion.js`, `src/style.css` y los PRD 001 y 002. Solo cambian `CLAUDE.md`, `package.json`, `scripts/`, `pruebas/`, `docs/PRD_CREATOR.md`, `docs/BACKLOG.md`, `docs/LECCIONES_APRENDIDAS.md` y `.claude/skills/verificador-prd/SKILL.md`.

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Monolito | Un archivo o una clase que hace demasiadas cosas y crece sin límite. |
| Límite de líneas | 400 líneas por archivo `.js` o `.mjs` en `src/`, en la raíz y en `pruebas/`. |
| Archivo grande aceptado | Los únicos 4 que pueden pasar de 400 líneas hasta B10: `aplicacion.js` (1516), `visor_carrera_solo.js` (531), `garaje.js` (435) y `visor_diseno_pista.js` (411). |
| Responsabilidad única | Lo que hace una clase se describe sin decir "y además…". |
| Controlador por pantalla | Cada pantalla tiene su propio controlador, como `ControladorCarreraSolo`. |

## 6. Requerimientos funcionales
- **RF-01 (D7):** `CLAUDE.md` tiene una sección "Anti-monolito" con el límite de 400 líneas, la responsabilidad única y el controlador por pantalla. La sección nombra los 4 archivos grandes y las 4 pantallas sin controlador propio como **excepciones temporales hasta B10**, así no quedan como deuda (lección 3).
- **RF-02 (D6):** esa sección dice que MVC sigue igual, y la sección "Visores de pista" de `CLAUDE.md` deja de presentar el controlador por pantalla como excepción y remite a las excepciones temporales de RF-01.
- **RF-03 (D7):** el PRD CREATOR pide que todo PRD nuevo respete el límite y la responsabilidad única.
- **RF-04 (D8):** después de `npm install`, el chequeo se ejecuta solo en cada commit.
- **RF-05 (D4):** un commit que deja un archivo de más de 400 líneas fuera de la lista de §5 se bloquea con un mensaje que nombra el archivo y el límite. Vale para archivos nuevos y existentes, incluidas las pruebas.
- **RF-06 (D4):** un commit que toca uno de los 4 archivos aceptados muestra un aviso, pero no se bloquea. Si el archivo creció, el aviso lo dice.
- **RF-07 (D8):** `npm test` falla si algún archivo fuera de la lista pasa de 400 líneas.
- **RF-08 (D8):** desaparece el aviso falso de R3: `modo_clasico_2d.js` coincide con `ModoClasico2D`.
- **RF-09 (D5):** el Verificador PRD revisa la responsabilidad única de las clases nuevas o cambiadas.
- **RF-10 (D2):** el backlog tiene B10 (dividir los 4 archivos grandes y las 4 pantallas sin controlador propio, empezando por `aplicacion.js`) y B5 a B9 (el top 5 de mejoras).
- **RF-11 (D3):** el juego funciona igual que antes.

## 7. Requerimientos no funcionales
- **RNF-01, reglas del proyecto:** todo lo que se agrega cumple `CLAUDE.md`, incluido el límite de 400 líneas.
- **RNF-02, pruebas:** `npm run test:todo` termina en verde con una prueba nueva para RF-04 a RF-08, que usa un repo temporal en `/tmp` y no toca el repo real. Las 10 pruebas actuales siguen en verde.

## 8. Criterios de aceptación del MVP
1. La regla está escrita en `CLAUDE.md` y en el PRD CREATOR, y el controlador por pantalla ya no figura como excepción.
2. Después de `npm install`, un archivo nuevo de 401 líneas, de juego o de prueba, no se puede commitear.
3. Un archivo existente que crece de 380 a 420 líneas también se bloquea.
4. Los 4 archivos aceptados solo dan aviso.
5. Ya no sale el aviso falso de R3.
6. B5 a B10 están en el backlog.
7. `npm run test:todo` termina en verde y el Verificador PRD da ✅.

## 9. Riesgos y supuestos
- **Archivos y pantallas aceptados:** los 4 archivos grandes y las 4 pantallas sin controlador propio siguen así hasta B10. Se acepta.
- **Instalación del chequeo:** quien clone el repo y no corra `npm install` no tendrá el chequeo en sus commits. `npm test` lo revisa igual.
- **Responsabilidad única:** no se puede medir con un número; depende de la revisión del Verificador PRD.
- **Documentación:** el límite no aplica a `docs/`, porque los PRD ya tienen su propio límite de 2 páginas.

### Historial
- **v1** (2026-10-22): primera versión, con límite de 400 líneas.
- **v2** (2026-10-22): correcciones de 3 agentes revisores, aprobadas por el usuario. D1 incluye `pruebas/`. D4: solo los 4 archivos listados pueden pasar el límite y cualquier otro bloquea. D6: el controlador por pantalla pasa a ser regla y reemplaza la excepción de `CLAUDE.md`. D8: el chequeo se instala solo. Se agregan `package.json` y el Verificador PRD a la lista de lo que cambia.
- **Cierre** (2026-10-22): pasada final del Verificador PRD. RF-01 y RF-02 piden que `CLAUDE.md` nombre las excepciones temporales (lección 3); no cambia ninguna decisión.
