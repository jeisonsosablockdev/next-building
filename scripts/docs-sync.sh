#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Uso: ./scripts/docs-sync.sh <scope-list>"
  echo "Ej:  ./scripts/docs-sync.sh app"
  echo "Ej:  ./scripts/docs-sync.sh app,api"
  echo "Scopes válidos: app, api"
  exit 1
fi

DOCS_DIR="knowledge/architecture"
SCOPES_RAW="$1"
IFS=',' read -r -a SCOPES <<< "$SCOPES_RAW"

ensure_last_updated() {
  local file="$1"
  local now
  now="$(date -u +"%Y-%m-%d %H:%M:%S UTC")"

  if grep -q '^Last Updated:' "$file"; then
    awk -v now="$now" '
      BEGIN { done = 0 }
      {
        if (!done && $0 ~ /^Last Updated:/) {
          print "Last Updated: " now
          done = 1
        } else {
          print $0
        }
      }
    ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
  else
    printf "\nLast Updated: %s\n" "$now" >> "$file"
  fi
}

ensure_file() {
  local file="$1"
  local title="$2"

  if [[ ! -f "$file" ]]; then
    mkdir -p "$(dirname "$file")"
    printf '# %s\n' "$title" > "$file"
  fi

  ensure_last_updated "$file"
  git add "$file"
  echo "📄 synced: $file"
}

for scope in "${SCOPES[@]}"; do
  case "$scope" in
    app)
      ensure_file "$DOCS_DIR/auth-flow.md" "Auth Flow"
      ensure_file "$DOCS_DIR/session-model.md" "Session Model"
      ;;
    api)
      ensure_file "$DOCS_DIR/architecture-overview.md" "Architecture"
      ensure_file "$DOCS_DIR/threat-model.md" "Threat Model"
      ;;
    *)
      echo "Scope inválido: $scope"
      echo "Scopes válidos: app, api"
      exit 1
      ;;
  esac
done

"$(dirname "$0")/readme-sync.sh"

echo "✅ Documentación sincronizada para: $SCOPES_RAW"
