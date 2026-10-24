---
name: reparador-prd
description: Repara un PRD de docs/prds/ con los hallazgos del Verificador PRD. Corrige solo los detalles de redacción y precisión, sin cambiar decisiones bloqueadas, y vuelve a verificar hasta que dé ✅ (máximo 3 vueltas). Úsalo cuando el usuario diga "reparador PRD", "repara el PRD", "corrige el PRD", "pule el PRD", "/reparador-prd", o después de un Verificador PRD con ❌ en un PRD que todavía no tiene código.
---

# Reparador PRD

Complemento del **Verificador PRD** (`.claude/skills/verificador-prd/SKILL.md`): el Verificador encuentra los problemas y el Reparador corrige los detalles, sin pasar por el usuario en cada uno.

Responde siempre en español y en pocas palabras.

## Regla de oro (lección 19)

El Reparador **nunca cambia el fondo de una decisión bloqueada** sin la aprobación del usuario.

| Tipo de hallazgo | Ejemplos | Qué hace el Reparador |
|---|---|---|
| **Detalle** (se corrige solo) | Nombrar piezas agrupadas ("los archivos de compatibilidad" → nombres reales). Completar la D9 ("Reemplaza") con choques que faltan. Pasar a RNF un RF que habla de código. Aclarar una frase ambigua sin cambiar lo que decide. Corregir citas, números de RF o de línea. Recortar a 2 páginas. Quitar repeticiones. | Lo corrige. |
| **Decisión** (pide permiso) | Agregar o quitar algo que se borra o se conserva. Cambiar el alcance. Elegir entre dos opciones de diseño. Cambiar `CLAUDE.md` o algo de la lista de lo que no se modifica. | No lo toca. Lo lista con una propuesta y pregunta. |

Si hay duda entre detalle y decisión, es **decisión**.

## Paso 1 — Hallazgos

Usa el último informe del Verificador PRD de esta conversación. Si no hay ninguno, corre el Verificador PRD primero (solo los agentes `revisor-contradicciones-prd` y `revisor-codigo-prd`, porque un PRD sin código no cambia las pruebas).

## Paso 2 — Clasificar

Antes de clasificar, confirma cada hallazgo abriendo el `archivo:línea` citado. Descarta los que no se confirman. Después clasifica cada uno como detalle o decisión con la tabla de arriba.

## Paso 3 — Decisiones pendientes

Si hay decisiones, muéstralas juntas en una tabla corta (hallazgo → propuesta) y espera la respuesta del usuario antes de seguir. Con su respuesta, aplica también esas decisiones.

## Paso 4 — Reparar

Edita el PRD siguiendo `docs/PRD_CREATOR.md`:
- **Reemplaza** el texto en vez de agregar.
- Máximo ~100 líneas y ~15 RF.
- Una sola lista de lo que no se modifica.
- Cada pieza nombrada, sin agrupar.

Sube la versión del PRD (v2 → v3…) y anota en el **Historial** qué se corrigió.

## Paso 5 — ¿Volver a verificar? (forma corta)

Según la forma corta de `CLAUDE.md`, **no se vuelve a verificar** después de corregir detalles: termina en el Paso 6.

Solo si en el Paso 3 el usuario aprobó una **decisión de fondo** (por ejemplo, cambiar medidas, alcance o una lista de lo que no se modifica), lanza una vuelta más con `revisor-contradicciones-prd` y `revisor-codigo-prd`, y diles qué se corrigió. Máximo **2 vueltas** en total. Si siguen apareciendo hallazgos, para y muéstralos al usuario.

## Paso 6 — Entregar

Commit con el PRD reparado y, si el usuario no dijo lo contrario, push a la rama de desarrollo y a `main`, como manda `CLAUDE.md`.

Informe final, corto:

```
# Reparador PRD — PRD NNN vX
| Vuelta | Detalles corregidos | Decisiones aprobadas | Resultado del Verificador |
|---|---|---|---|
| 1 | … | … | ❌ N / ✅ |
Veredicto: ✅ listo para implementar / ⚠️ quedan N hallazgos
```

Si aparece un error nuevo que se repite, agrégalo a `docs/LECCIONES_APRENDIDAS.md`.
