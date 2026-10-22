# PRD 003 — Regla anti-monolito (TURBO RACE)

| Campo | Valor |
|---|---|
| Estado | v1 — listo para implementar |
| Fecha | 2026-10-22 |
| Relacionado | PRD 001 y PRD 002 (no los reemplaza) |

## Decisiones bloqueadas

Estas decisiones se acordaron con el usuario y no se cambian. Si un requerimiento choca con ellas, mandan las decisiones.

| # | Categoría | Decisión |
|---|---|---|
| D1 | Alcance | Ningún archivo de código puede pasar de **400 líneas**. |
| D2 | Alcance | Este PRD solo crea la regla y el chequeo automático. Dividir los archivos que hoy pasan el límite queda para un PRD aparte (backlog B10). |
| D3 | Usuarios | La regla afecta al desarrollador y a los agentes. El jugador no nota ningún cambio. |
| D4 | Usuarios | Un archivo **nuevo** de más de 400 líneas **bloquea** el commit. Un archivo **existente** que ya pasaba el límite solo da **aviso**, hasta que se divida. |
| D5 | Dominio | "Una sola responsabilidad": si para describir lo que hace una clase hay que decir "y además…", esa clase se divide. Esto se revisa a mano con el Verificador PRD. |
| D6 | Dominio | MVC sigue igual. La regla nueva solo limita el tamaño y exige un controlador por pantalla. |
| D7 | Técnico | La regla queda escrita en `CLAUDE.md`, en una sección nueva "Anti-monolito", y en el PRD CREATOR. |
| D8 | Técnico | El chequeo automático (`verificar_arquitectura.sh` y `prueba_arquitectura.js`) cuenta las líneas. De paso se arregla el aviso falso de R3 con nombres que llevan número (`ModoClasico2D`). |

## 1. Contexto y problema
Algunos archivos crecieron hasta volverse monolitos: `aplicacion.js` tiene unas 1500 líneas y maneja todas las pantallas. Cuesta entenderlos, cualquier cambio puede romper otra cosa y los agentes cometen más errores en ellos. Hoy ninguna regla limita el tamaño de un archivo.

## 2. Objetivo
Que ningún archivo nuevo se convierta en monolito, que el chequeo avise solo y que los archivos grandes que ya existen queden identificados para dividirlos después.

## 3. Público objetivo y usuarios
- **Desarrollador:** sabe qué tamaño puede tener un archivo y recibe un aviso cuando se pasa.
- **Agentes de Claude:** leen la regla en `CLAUDE.md` y la cumplen al escribir código.
- **Jugador:** no nota nada; el juego funciona igual que antes.

## 4. Alcance
**In scope:**
- La sección "Anti-monolito" en `CLAUDE.md` y en el PRD CREATOR.
- El conteo de líneas en el chequeo automático: bloquea los archivos nuevos y avisa en los existentes.
- La lista de archivos existentes que pasan el límite.
- El arreglo del aviso falso de R3.
- Las ideas B10 (dividir monolitos) y B5 a B9 (top 5 de mejoras del juego) en el backlog.

**Out of scope:** dividir `aplicacion.js` u otro archivo existente (B10); cambios en el juego.

**Lista única de lo que NO se modifica:** todo `src/`, `index.html`, `vista_conduccion.js`, los PRD 001 y 002, y `src/style.css`. Solo cambian `CLAUDE.md`, `docs/PRD_CREATOR.md`, `docs/BACKLOG.md`, `docs/LECCIONES_APRENDIDAS.md`, `scripts/verificar_arquitectura.sh` y `pruebas/`.

## 5. Conceptos de dominio
| Concepto | Qué es |
|---|---|
| Monolito | Un archivo o una clase que hace demasiadas cosas y crece sin límite. |
| Límite de líneas | 400 líneas por archivo de código (`.js` en `src/` y en la raíz). |
| Archivo existente grande | Archivo que ya pasaba el límite cuando se creó esta regla: `aplicacion.js` (1516), `visor_carrera_solo.js` (531), `garaje.js` (435) y `visor_diseno_pista.js` (411). |
| Responsabilidad única | Una clase hace una sola cosa que se describe sin decir "y además…". |
| Controlador por pantalla | Cada pantalla tiene su propio controlador, como `ControladorCarreraSolo`. |

## 6. Requerimientos funcionales
- **RF-01 (D7):** `CLAUDE.md` tiene una sección "Anti-monolito" con el límite de 400 líneas, la responsabilidad única y el controlador por pantalla.
- **RF-02 (D6):** esa sección aclara que MVC sigue igual.
- **RF-03 (D7):** el PRD CREATOR pide que todo PRD nuevo respete el límite y la responsabilidad única.
- **RF-04 (D4):** un commit que agrega un archivo nuevo de más de 400 líneas se bloquea con un mensaje claro.
- **RF-05 (D4):** un commit que toca un archivo existente grande muestra un aviso, pero no se bloquea.
- **RF-06 (D4):** si un archivo existente grande crece todavía más, el aviso lo dice.
- **RF-07 (D8):** `npm test` falla si algún archivo nuevo pasa de 400 líneas.
- **RF-08 (D8):** el aviso falso de R3 desaparece: `modo_clasico_2d.js` coincide con `ModoClasico2D`.
- **RF-09 (D2):** el backlog tiene B10 (dividir los 4 archivos grandes, empezando por `aplicacion.js`) y B5 a B9 (top 5 de mejoras).
- **RF-10 (D5):** el Verificador PRD revisa la responsabilidad única de las clases nuevas o cambiadas.
- **RF-11 (D3):** el juego funciona igual que antes y las pruebas actuales siguen en verde.

## 7. Requerimientos no funcionales
- **RNF-01, reglas del proyecto:** se cumple `CLAUDE.md` en todo lo que se agrega.
- **RNF-02, pruebas:** `npm run test:todo` pasa en verde, con una prueba que confirma RF-04 a RF-08.

## 8. Criterios de aceptación del MVP
1. La regla está escrita en `CLAUDE.md` y en el PRD CREATOR.
2. Un archivo nuevo de 401 líneas no se puede commitear.
3. Los 4 archivos grandes existentes solo dan aviso.
4. Ya no aparece el aviso falso de R3.
5. Las ideas B5 a B10 están en el backlog.
6. `npm run test:todo` pasa en verde y el Verificador PRD da ✅.

## 9. Riesgos y supuestos
- **Archivos grandes que siguen ahí:** los 4 archivos existentes pasan el límite hasta B10. Se acepta por ahora.
- **El límite también vale para el PRD 001:** `visor_carrera_solo.js` (531) nació antes de la regla. Cuenta como existente.
- **Responsabilidad única:** no se puede medir con un número. Depende de la revisión del Verificador PRD.
- **Pruebas y documentación:** el límite aplica solo al código del juego (`src/` y `.js` de la raíz), no a `pruebas/` ni a `docs/`.

### Historial
- **v1** (2026-10-22): primera versión, con el límite de 400 líneas que decidió el usuario.
