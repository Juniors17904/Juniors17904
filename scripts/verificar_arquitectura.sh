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

# Solo archivos JS dentro de src/ que están en el staging area
ARCHIVOS=$(git diff --cached --name-only --diff-filter=ACM | grep '^src/.*\.js$')

if [ -z "$ARCHIVOS" ]; then
    echo -e "${VERDE}✓ Sin archivos JS en src/ que verificar.${NC}"
    echo ""
    exit 0
fi

for ARCHIVO in $ARCHIVOS; do

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
    CLASE_ESPERADA=$(echo "$NOMBRE_BASE" \
        | awk -F'_' '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2); OFS=""; print}')

    if ! grep -qE "class\s+${CLASE_ESPERADA}(\s|$)" "$ARCHIVO" 2>/dev/null; then
        echo -e "${AMARILLO}⚠  [R3] $ARCHIVO${NC}"
        echo "   No contiene 'class ${CLASE_ESPERADA}'. Revisa que el nombre de clase coincida con el archivo."
        # Solo advertencia — no bloquea el commit
    fi

done

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
