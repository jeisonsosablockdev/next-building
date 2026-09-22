#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 3 ]]; then
  echo "Uso: ./scripts/full-cycle.sh <scope> <name> \"mensaje\" [docs]"
  echo "Uso: ./scripts/full-cycle.sh <type> <scope> <name> \"mensaje\" [docs] [options git-start]"
  echo "Ej:  ./scripts/full-cycle.sh app initial-ui \"initial UI scaffold\""
  echo "Ej:  ./scripts/full-cycle.sh feature app user-profile \"add user profile page\" app"
  echo "Ej:  ./scripts/full-cycle.sh refactor shared branch-alignment \"align git scripts\""
  echo "Scopes válidos para ramas tipadas: app | shared | docs | infra"
  echo "Tipos válidos: feature | bugfix | fix | hotfix | epic | security | refactor"
  echo "Docs opcionales: app,api"
  exit 1
fi

is_branch_type() {
  [[ "${1:-}" =~ ^(feature|bugfix|fix|hotfix|epic|security|refactor)$ ]]
}

TYPE="feature"
if [[ $# -ge 4 ]] && is_branch_type "$1"; then
  TYPE="$1"
  SCOPE="$2"
  NAME="$3"
  MSG="$4"
  shift 4
else
  SCOPE="$1"
  NAME="$2"
  MSG="$3"
  shift 3
fi

DOC_SCOPES="auto"
if [[ $# -gt 0 && "$1" != --* ]]; then
  DOC_SCOPES="$1"
  shift
fi

case "$SCOPE" in
  app) AUTO_DOCS="app" ;;
  *) AUTO_DOCS="" ;;
esac

if [[ "$DOC_SCOPES" == "auto" ]]; then
  DOC_SCOPES="$AUTO_DOCS"
fi

"$(dirname "$0")/git-start.sh" "$TYPE" "$SCOPE" "$NAME" "$@"

if [[ -n "$DOC_SCOPES" ]]; then
  "$(dirname "$0")/docs-sync.sh" "$DOC_SCOPES"
else
  echo "ℹ️ No docs-sync automático para scope '$SCOPE'"
fi

"$(dirname "$0")/git-save.sh" "$SCOPE" "$MSG"
"$(dirname "$0")/git-push.sh"

echo "✅ Flujo completo: branch + docs + commit + push"
