# CLAUDE.md — Reglas del proyecto TurboRace

## Idioma
- Responder SIEMPRE en español en el texto de respuesta (lo que ve el usuario)
- El razonamiento interno (proceso de pensamiento) también en español
- Las descripciones de herramientas y comandos también en español
- Solo se permite inglés en: nombres de variables, funciones, y código fuente donde ya existe convención en inglés

## Reglas de código — CRÍTICAS
- NUNCA modificar, editar, crear ni borrar código sin que el usuario use palabras de acción explícitas:
  hazlo, impleméntalo, cámbialo, ponlo, agrégalo, modifica, arréglalo, crea, borra, actualiza, pushealo, commitea, aplícalo
- Si el usuario hace una pregunta → responder solo con texto, SIN tocar el código
- Si el usuario dice "no toques el código" → parar inmediatamente, solo texto
- Ante cualquier duda, preguntar antes de programar

## Sugerencias al final de cada respuesta
- Al terminar cada respuesta, hacer 1 a 3 preguntas cortas a modo de sugerencia sobre qué podría querer hacer el usuario a continuación
- Las preguntas deben ser relevantes al contexto actual del proyecto
- Formularlas como opciones concretas, no genéricas

- Desarrollar en la rama `claude/system-overview-Z6Zik`
- **SIEMPRE** al terminar cada cambio: hacer merge a `main` y push a `main`
- El sitio se sirve desde `main` (Vercel apunta a `main`)
- Flujo obligatorio después de cada commit: `git checkout main && git merge claude/system-overview-Z6Zik && git push origin main`
- Nunca dejar cambios solo en la rama de desarrollo sin mergear a main
