#!/bin/bash

# ================================================================
# verificar_arquitectura.sh
# Verifica reglas de arquitectura POO definidas en CLAUDE.md.
# Se ejecuta automáticamente como pre-commit hook de git.
# ================================================================

ERRORES=0
ROJO='\033[0;31m'
VERDE='\033[0;32m'
AMARILLO='\033[1;33m'
NC='\033[0m'

echo ""
echo "Verificando arquitectura POO (CLAUDE.md)..."

# ── Regla 4: anti-monolito, máximo 400 líneas (PRD 003) ─────────
# Revisa TODOS los .js/.mjs de src/, la raíz y pruebas/ tal como quedan en el
# commit (el índice), así cubre archivos nuevos, modificados, renombrados,
# copiados y no tocados. Los aceptados solo avisan si están en staging.
# Se evalúa antes de la salida temprana de R1-R3.
LIMITE_LINEAS=400
RAIZ_REPO=$(git rev-parse --show-toplevel)
LISTA_ACEPTADOS="$RAIZ_REPO/scripts/archivos_grandes_aceptados.txt"
PATRON_LINEAS='^(src/.+|pruebas/.+|[^/]+)\.(js|mjs)$'
EN_STAGING=$(git -c core.quotePath=false diff --cached --name-only --diff-filter=ACMR)

while IFS= read -r ARCHIVO; do
    [ -z "$ARCHIVO" ] && continue
    # Se cuentan las líneas de la versión en el índice (lo que se commitea)
    LINEAS=$(git show ":$ARCHIVO" 2>/dev/null | wc -l | tr -d ' ')
    [ "$LINEAS" -le "$LIMITE_LINEAS" ] && continue

    LINEAS_LISTA=""
    if [ -f "$LISTA_ACEPTADOS" ]; then
        LINEAS_LISTA=$(awk -v r="$ARCHIVO" '$1 == r { print $2; exit }' "$LISTA_ACEPTADOS")
    fi

    if [ -z "$LINEAS_LISTA" ]; then
        echo -e "${ROJO}❌ [R4] $ARCHIVO${NC}"
        echo "   Tiene $LINEAS líneas. El límite es $LIMITE_LINEAS líneas por archivo (CLAUDE.md, anti-monolito)."
        ERRORES=$((ERRORES + 1))
    elif ! printf '%s\n' "$EN_STAGING" | grep -qxF "$ARCHIVO"; then
        continue   # aceptado y no tocado en este commit: sin aviso
    elif [ "$LINEAS" -gt "$LINEAS_LISTA" ]; then
        echo -e "${AMARILLO}⚠  [R4] $ARCHIVO${NC}"
        echo "   Archivo grande aceptado hasta B10: creció de $LINEAS_LISTA a $LINEAS líneas (límite $LIMITE_LINEAS)."
        # Solo advertencia — no bloquea el commit
    else
        echo -e "${AMARILLO}⚠  [R4] $ARCHIVO${NC}"
        echo "   Archivo grande aceptado hasta B10: tiene $LINEAS líneas (límite $LIMITE_LINEAS)."
        # Solo advertencia — no bloquea el commit
    fi
done < <(git -c core.quotePath=false ls-files | grep -E "$PATRON_LINEAS")

# Solo archivos JS dentro de src/ que están en el staging area
ARCHIVOS=$(git -c core.quotePath=false diff --cached --name-only --diff-filter=ACMR | grep '^src/.*\.js$')

if [ -z "$ARCHIVOS" ]; then
    echo -e "${VERDE}✓ Sin archivos JS en src/ para R1-R3.${NC}"
    if [ "$ERRORES" -gt 0 ]; then
        echo ""
        echo -e "${ROJO}Commit BLOQUEADO — $ERRORES error(es) de arquitectura.${NC}"
        echo "Corrige los errores y vuelve a hacer commit."
        echo ""
        exit 1
    fi
    echo ""
    exit 0
fi

while IFS= read -r ARCHIVO; do

    # ── Regla 1: máximo 1 clase por archivo ──────────────────────
    NUM_CLASES=$(grep -cE '^\s*(export\s+)?class\s+' "$ARCHIVO" 2>/dev/null || echo 0)
    if [ "$NUM_CLASES" -gt 1 ]; then
        echo -e "${ROJO}❌ [R1] $ARCHIVO${NC}"
        echo "   Tiene $NUM_CLASES clases. Solo se permite 1 por archivo (CLAUDE.md)."
        ERRORES=$((ERRORES + 1))
    fi

    # ── Regla 2: sin objetos literales asignados a window ────────
    # Detecta: window.ALGO = {   o   window.ALGO.sub = {
    if grep -qE 'window\.[A-Za-z]+(\.[A-Za-z]+)?\s*=\s*\{' "$ARCHIVO" 2>/dev/null; then
        echo -e "${ROJO}❌ [R2] $ARCHIVO${NC}"
        echo "   Contiene objeto literal como entidad (window.X = {}). Debe ser una clase."
        ERRORES=$((ERRORES + 1))
    fi

    # ── Regla 3: nombre del archivo coincide con nombre de clase ─
    NOMBRE_BASE=$(basename "$ARCHIVO" .js)
    # snake_case → PascalCase:  config_pista_ciudad → ConfigPistaCiudad
    # La letra que sigue a un número también va en mayúscula:
    # modo_clasico_2d → ModoClasico2D, modo_test_drive_3d → ModoTestDrive3D
    CLASE_ESPERADA=$(echo "$NOMBRE_BASE" \
        | awk -F'_' '{
            s = ""
            for (i = 1; i <= NF; i++) {
                p = toupper(substr($i, 1, 1))
                for (j = 2; j <= length($i); j++) {
                    c = substr($i, j, 1); a = substr($i, j - 1, 1)
                    p = p ((a ~ /[0-9]/) ? toupper(c) : c)
                }
                s = s p
            }
            print s
        }')

    if ! grep -qE "class\s+${CLASE_ESPERADA}(\s|$)" "$ARCHIVO" 2>/dev/null; then
        echo -e "${AMARILLO}⚠  [R3] $ARCHIVO${NC}"
        echo "   No contiene 'class ${CLASE_ESPERADA}'. Revisa que el nombre de clase coincida con el archivo."
        # Solo advertencia — no bloquea el commit
    fi

done <<< "$ARCHIVOS"

echo ""
if [ "$ERRORES" -gt 0 ]; then
    echo -e "${ROJO}Commit BLOQUEADO — $ERRORES error(es) de arquitectura.${NC}"
    echo "Corrige los errores y vuelve a hacer commit."
    echo ""
    exit 1
else
    echo -e "${VERDE}✓ Arquitectura OK — commit permitido.${NC}"
    echo ""
    exit 0
fi
