# PRD CREATOR

Secuencia de 3 prompts para convertir un requerimiento de negocio ambiguo en un PRD claro e implementable.

---

## Prompt 1 — Encuadre

Actúa como un Product Manager senior.

Voy a darte un requerimiento de negocio ambiguo y quiero que me ayudes a convertirlo en un PRD claro y suficientemente implementable. No escribas el PRD todavía. Primero quiero que identifiques las decisiones de producto que faltan por definir.

Requerimiento: «( ....... )»

Lístame las 6-8 decisiones clave que debemos resolver antes de escribir el PRD, con su propuesta de resolución y agrupadas por categoría (alcance, usuarios, dominio, técnico). Sé conciso.

---

## Prompt 2 — Resolver ambigüedad

Acepto casi todo. Cambia esto: ( ....... ). Ahora bloquea estas decisiones como definitivas.

---

## Prompt 3 — Generar el PRD

Ahora escribe el PRD completo en Markdown con esta estructura exacta: 1) Contexto y problema, 2) Objetivo, 3) Público objetivo y usuarios, 4) Alcance (In scope / Out of scope explícito), 5) Conceptos de dominio, 6) Requerimientos funcionales numerados, 7) Requerimientos no funcionales, 8) Criterios de aceptación del MVP, 9) Riesgos y supuestos.

Usa lenguaje claro y conciso. Que cada requerimiento funcional sea verificable. Guarda el PRD en `docs/prds`.
