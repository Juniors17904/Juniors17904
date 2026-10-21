---
name: verificador-prd
description: Verifica que los PRD de docs/prds/ no se contradigan entre sí y que los cambios de código (un PR, una rama o el último commit) cumplan esos PRD, y corre todas las pruebas del proyecto. Lanza 3 agentes revisores en paralelo y entrega un informe ✅/❌. Úsalo cuando el usuario diga "verificador PRD", "verifica los PRD", "revisa el PR contra el PRD", "hay contradicciones?", "/verificador-prd", o antes de mergear a main un cambio que implementa un PRD.
---

# Verificador PRD

Comprueba tres cosas a la vez: que los PRD sean coherentes entre sí, que el código cumpla los PRD y que las pruebas pasen. El objetivo es detectar contradicciones **antes** de llevar un cambio a `main`, porque `main` se publica directo en Vercel.

Responde siempre en español. Este skill **solo revisa**: no corrige nada sin que el usuario lo pida con una palabra de acción (arréglalo, corrígelo, aplícalo…), como exige `CLAUDE.md`.

## Paso 1 — Definir qué cambios revisar

Elige el rango según lo que diga el usuario:

| El usuario dice | Rango de git |
|---|---|
| "el PR #N" | Busca el PR con las herramientas de GitHub (`mcp__github__pull_request_read`) y usa su rama base y su rama head: `origin/<base>...origin/<head>` (antes haz `git fetch origin <head>`) |
| "mi rama", "lo que hice" | `origin/main...HEAD`, más los cambios sin commitear |
| "el último cambio", o no dice nada | `HEAD~1..HEAD`, más los cambios sin commitear |
| "solo los PRD" | No hay rango: no lances `revisor-codigo-prd` |

Si no hay ningún PRD en `docs/prds/`, avísalo y corre solo las pruebas.

## Paso 2 — Lanzar los 3 revisores en paralelo

Lanza en **un solo mensaje** tres llamadas al tool Agent para que corran a la vez. Cada una usa uno de estos `subagent_type` definidos en `.claude/agents/`:

1. **`revisor-contradicciones-prd`**: compara los PRD entre sí y contra `CLAUDE.md`. Prompt: "Revisa contradicciones en todos los PRD de docs/prds/."
2. **`revisor-codigo-prd`**: compara los cambios contra los PRD. Prompt: "Revisa los cambios del rango `<rango>` (más los cambios sin commitear si aplica) contra los PRD de docs/prds/."
3. **`revisor-pruebas-prd`**: corre `npm run test:todo` y revisa la cobertura de los RF. Prompt: "Corre todas las pruebas y revisa la cobertura de RF de los PRD de docs/prds/."

Si los tipos de agente no aparecen disponibles, por ejemplo en una sesión iniciada antes de crear los archivos, usa `general-purpose` y pega en el prompt el contenido del archivo `.claude/agents/<nombre>.md` correspondiente.

Mientras corren, dile al usuario en una línea qué revisa cada uno.

## Paso 3 — Verificar los hallazgos antes de informar

Los revisores pueden equivocarse. Antes de poner un ❌ en el informe, confirma tú mismo cada hallazgo grave abriendo el `archivo:línea` citado: un archivo intocable modificado, un RF roto, una contradicción entre PRD o una prueba que falla. Si no se confirma, descártalo y menciónalo como "descartado tras verificar".

## Paso 4 — Informe

Usa este formato:

```
# Verificador PRD — <rango o "solo PRD">

| Revisión | Resultado |
|---|---|
| Contradicciones entre PRD | ✅ / ❌ N |
| Código vs PRD | ✅ / ❌ N |
| Pruebas | ✅ X/Y pasan · N RF sin prueba |

## ❌ Problemas (de más grave a menos)
1. **<título corto>**: qué pasa, `archivo:línea`, PRD y RF/D afectado, cómo se arreglaría.

## ⚠️ Avisos
- RF sin prueba, cambios sin PRD, hallazgos descartados.

## Veredicto
✅ Listo para llevar a main  /  ❌ No llevar a main hasta resolver los problemas 1..N
```

Después del informe, cierra con un párrafo corto en palabras simples para alguien que no programa y una sola pregunta concreta sobre el siguiente paso. Por ejemplo: "¿Arreglo el problema 1, que rompe el RF-27?".

## Notas
- Las pruebas viven en `pruebas/`. Usa `npm test` para las rápidas, `npm run test:navegador` para Chromium y `npm run test:todo` para todo. Si una prueba nueva es necesaria, va en `pruebas/modelo/` (node, sin DOM) o en `pruebas/navegador/` (Playwright), y termina con `process.exitCode = fallos ? 1 : 0`.
- Los PRD se crean con el PRD CREATOR (`docs/PRD_CREATOR.md`). Este skill es su complemento: el PRD CREATOR define qué construir y el Verificador PRD comprueba que se cumpla.
