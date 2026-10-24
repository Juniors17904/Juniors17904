# PRD CREATOR

Secuencia de 3 prompts para convertir un requerimiento de negocio ambiguo en un PRD claro e implementable.

---

## Prompt 1 — Encuadre

Actúa como un Product Manager senior.

Voy a darte un requerimiento de negocio ambiguo y quiero que me ayudes a convertirlo en un PRD claro y suficientemente implementable. No escribas el PRD todavía. Primero quiero que identifiques las decisiones de producto que faltan por definir.

Requerimiento: «( ....... )»

Lístame las 6-8 decisiones clave que debemos resolver antes de escribir el PRD, con su propuesta de resolución y agrupadas por categoría (alcance, usuarios, dominio, técnico). Sé conciso.

Antes de proponer las decisiones, lee los PRD vigentes de `docs/prds/` (sus decisiones bloqueadas y sus listas de lo que NO se modifica). Al final, lista los **choques con PRD anteriores**: qué decisión, RF o elemento protegido de qué PRD cambiaría este requerimiento. Cada choque se resuelve en el Prompt 2 con una decisión "Reemplaza", y el PRD anterior lleva una nota que lo indica (sin reescribirlo). Revisa **todas** las listas protegidas: decisiones, RF y listas de lo que no se modifica de cada PRD, y las tablas de jerarquías de `CLAUDE.md`.

Si el requerimiento **borra, mueve o renombra código**, antes del Prompt 2 un agente revisa en el código quién usa cada pieza afectada (archivos, clases, ids del HTML, globales `window.*` y pruebas). Lista las **piezas compartidas** con lo que se conserva y nombra cada pieza que se borra, sin agruparlas en frases como "las pantallas 2D".

---

## Prompt 2 — Resolver ambigüedad

Acepto casi todo. Cambia esto: ( ....... ). Ahora bloquea estas decisiones como definitivas.

---

## Prompt 3 — Generar el PRD

Ahora escribe el PRD completo en Markdown con esta estructura exacta: 1) Contexto y problema, 2) Objetivo, 3) Público objetivo y usuarios, 4) Alcance (In scope / Out of scope explícito), 5) Conceptos de dominio, 6) Requerimientos funcionales numerados, 7) Requerimientos no funcionales, 8) Criterios de aceptación del MVP, 9) Riesgos y supuestos.

Usa lenguaje claro y conciso. Que cada requerimiento funcional sea verificable. Guarda el PRD en `docs/prds`.

Nombre del archivo: `prd_NNN_tema_corto.md`, con número correlativo de 3 dígitos (`prd_001_…`, `prd_002_…`). El título empieza igual: `# PRD NNN — Tema`.

Además (v2):
- Antes de la sección 1, incluye una tabla **"Decisiones bloqueadas"** con todas las decisiones del Prompt 2 (D1, D2, …: número, categoría y texto completo). Los RF y RNF deben citarlas, y si alguno las contradice, mandan las decisiones.
- Incluye un **Historial** (v1, v2, …) que diga qué cambió en cada versión.
- Escribe **una sola lista** de archivos y clases que NO se modifican, y haz que las demás secciones la citen en vez de repetirla.
- **Máximo 2 páginas (unas 100 líneas) y unos 15 requerimientos funcionales.** El PRD dice **qué** hace el producto y **por qué**, no **cómo** se programa. Escribe cada RF como un comportamiento que se puede observar (por ejemplo, "en el pasto la velocidad máxima baja al 40 %"), sin nombres de métodos, campos, fórmulas, milisegundos internos ni números de línea. Ese detalle vive en el código y en `pruebas/`.
- No escribas pasos de verificación por cada RF. Las pruebas de `pruebas/` son la verificación y citan el número de RF que cubren.
- Al corregir un PRD, **reemplaza** el texto en vez de agregar. Si al corregirlo pasa de 2 páginas, recórtalo.
- Todo PRD nuevo respeta la **regla anti-monolito** de `CLAUDE.md`: máximo 400 líneas por archivo, responsabilidad única por clase y un controlador por pantalla.
- Antes de guardar, revisa el PRD contra `CLAUDE.md`: ningún RF puede pedir objetos literales `{ }` guardados, funciones sueltas, más de una clase por archivo ni nombres en inglés. Si el diseño necesita una excepción, decláralo explícitamente en el RNF correspondiente; no la dejes solo como "deuda" en los riesgos.

---

## Después del PRD

Cuando el PRD esté implementado, verifícalo con el **Verificador PRD** (skill `verificador-prd`: "verifica los PRD" o `/verificador-prd`). Revisa que los PRD no se contradigan, que el código los cumpla y que las pruebas de `pruebas/` pasen.

Antes de escribir o corregir un PRD, lee `docs/LECCIONES_APRENDIDAS.md` y, si aparece un error nuevo, agrégalo a esa tabla.
