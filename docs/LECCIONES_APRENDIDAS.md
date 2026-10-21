# Lecciones aprendidas

Errores ya cometidos en el proyecto y la regla para que no se repitan. Léela antes de escribir un PRD (`docs/PRD_CREATOR.md`) y antes de verificar (`verificador-prd`). Si aparece un error nuevo, agrégalo aquí.

| # | Error | Dónde pasó | Cómo se detectó | Regla para que no se repita |
|---|---|---|---|---|
| 1 | PRD demasiado largo y técnico (375 líneas, 43 RF con métodos y fórmulas); cada corrección creaba contradicciones | `prd_carrera_solo_vertical.md` v1–v3 | Verificador PRD encontraba contradicciones nuevas en cada vuelta | Máximo 2 páginas y ~15 RF. Los RF describen comportamiento observable, no código |
| 2 | Decisiones D1–D10 solo en el chat, no escritas en el PRD | PRD Carrera Solo | Los revisores no podían citarlas | Toda decisión bloqueada va en la tabla "Decisiones bloqueadas" del PRD |
| 3 | Objetos literales `{x,z,angle}` guardados en una clase, aceptados como "deuda" contra `CLAUDE.md` | Muestras de la ruta | Revisión contra `CLAUDE.md` | Nunca guardar `{ }` como entidad: crear una clase (`MuestraRuta`). Nada de "deuda" contra `CLAUDE.md` |
| 4 | Listas duplicadas de archivos intocables que divergían | PRD Carrera Solo | Contradicción entre secciones | Una sola lista; las demás secciones la citan |
| 5 | Correcciones que agregaban texto en vez de reemplazar; quedaban restos de la versión anterior | PRD Carrera Solo | Frases que se contradecían dentro del mismo PRD | Al corregir, reemplazar el texto viejo, no añadir encima |
| 6 | Orden incorrecto en un RF: asignar `#carreraSolo` después de `#mostrar` redirigía a Inicio | RF de entrada a Jugar Solo / `aplicacion.js` | Prueba en navegador | Verificar el orden de pasos con una prueba real, no solo leyendo el PRD |
| 7 | Pruebas guardadas en una carpeta temporal que se perdían | Pruebas de la sesión | Pruebas desaparecidas al reiniciar | Las pruebas viven en `pruebas/` y se corren con `npm test` |
| 8 | Prueba con `check(true)` siempre verde que no fallaba con errores de consola | Pruebas de navegador | Revisión del código de la prueba | Cada prueba debe poder fallar; los errores de consola cuentan como fallo |
| 9 | Prueba de velocidad dependiente de la GPU (~15 fps en Xvfb) y una función de ayuda que no pasaba el argumento | Pruebas de física/velocidad | Resultados distintos según el entorno | Usar reloj controlado (paso fijo) y revisar que las funciones de ayuda pasen sus argumentos |
| 10 | Etiquetas de RF desactualizadas al renumerar | Pruebas y PRD | Verificador PRD (cobertura de RF) | Al renumerar RF, buscar y actualizar todas las citas en `pruebas/` y docs |
| 11 | Campos públicos (`entradaAcel`) contra el encapsulamiento | Clases de control | Revisión contra `CLAUDE.md` | Estado interno en `#privados`, con getter/setter solo si alguien lo necesita |
| 12 | Detalles de implementación: getters sin uso, método en inglés (`#tick`), controlador tocando el canvas | Controlador y visor de Carrera Solo | Revisión de código | Sin getters sin uso, nombres en español, el controlador no dibuja (MVC) |
| 13 | Layout: controles cortados y velocímetro tapando ACEL | Pantalla Jugar Solo | Solo se vio con prueba en navegador real | Probar el layout en navegador real (portrait y landscape) antes de dar por bueno |
| 14 | Límite de tiempo de carga que solo cubría el módulo y no el GLB | Carga de Carrera Solo | Prueba de carga lenta | Los límites de carga cubren todo lo que se descarga (módulos y modelos GLB) |
| 15 | `verificar_arquitectura.sh` con aviso falso en R3 | Script de arquitectura | Aviso sin causa real | Corregir el script cuando da falsos avisos; un aviso falso se ignora y oculta los reales |
| 16 | Diseño General: asfalto casi negro por luz baja y una luna roja de prueba olvidada | `VisorDisenoPista` | Captura de pantalla | Quitar elementos de prueba antes de commitear y revisar la luz con captura |
| 17 | Aviso "GIRA TU CELULAR" sin salida: `GestorOrientacion.forzar()` nunca se llama | Clásico 2D y multijugador (sigue abierto) | Prueba en celular | Todo aviso que bloquea la pantalla necesita una salida probada |
| 18 | Ir demasiado lejos del tema: muchas vueltas sobre el mismo PRD | Sesión del PRD Carrera Solo | Tiempo perdido sin avance | Cerrar cuando el Verificador PRD da verde; lo demás va a una tarea nueva |
| 19 | Un agente editó una decisión bloqueada (D7, añadir `package.json`) sin aprobación | PRD Carrera Solo | Verificador PRD | Las decisiones bloqueadas solo cambian con aprobación explícita del usuario; si hace falta, se pregunta y no se edita |
| 20 | Dos plazos de 6 s seguidos (módulo y GLB) daban un peor caso de ~12 s | Controlador de Carrera Solo | Verificador PRD | Un límite de tiempo se mide con un solo reloj desde el inicio y se prueba el peor caso combinado |

## Antes de llevar algo a main

1. `npm run test:todo` pasa completo.
2. El Verificador PRD (`/verificador-prd`) da ✅.
3. Revisar esta tabla y confirmar que no se repite ningún error.
