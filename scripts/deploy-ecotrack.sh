#!/bin/sh

set -eu

SCRIPT_NAME=$(basename "$0")
DEFAULT_REPO_URL="https://github.com/edm-r/ECOTRACK.git"
REPO_URL=${ECOTRACK_REPO_URL:-$DEFAULT_REPO_URL}
TARGET_DIR=${ECOTRACK_TARGET_DIR:-ECOTRACK}
BRANCH=${ECOTRACK_BRANCH:-}
WITH_SIMULATOR=${ECOTRACK_WITH_SIMULATOR:-0}
WAIT_TIMEOUT=${ECOTRACK_WAIT_TIMEOUT:-90}
DOCKER_START_TIMEOUT=${ECOTRACK_DOCKER_START_TIMEOUT:-120}

PROJECT_DIR=""
FAILED_STEP="initialisation"
COMPOSE_IMPL=""
OS_NAME=""
OS_ID=""
OS_ID_LIKE=""
DOCKER_NEEDS_SUDO=0

usage() {
    cat <<EOF
Usage: $SCRIPT_NAME [options]

Clone le projet ECOTRACK, installe automatiquement les prerequis manquants
selon le systeme, initialise .env si necessaire, deploie les conteneurs Docker
et affiche les URLs utiles a la fin.

Idempotent : relance sur un depot deja clone => git pull + redeploiement.
Les secrets (SECRET_KEY, POSTGRES_PASSWORD) sont generes aleatoirement a la
premiere creation du .env, jamais ecrits en clair dans le repo.
Mode demarrage local : les URLs exposees sont en localhost.

Options:
  --repo URL             URL Git du projet (defaut: $DEFAULT_REPO_URL)
  --dir PATH             Repertoire cible du clone (defaut: ./ECOTRACK)
  --branch NAME          Branche ou tag a cloner
  --with-simulator       Active aussi le profil Docker du simulateur IoT
  --wait-timeout SEC     Temps d'attente max pour /health (defaut: 90)
  --docker-timeout SEC   Temps d'attente max pour Docker (defaut: 120)
  -h, --help             Affiche cette aide

Variables d'environnement:
  ECOTRACK_REPO_URL
  ECOTRACK_TARGET_DIR
  ECOTRACK_BRANCH
  ECOTRACK_WITH_SIMULATOR=1
  ECOTRACK_WAIT_TIMEOUT
  ECOTRACK_DOCKER_START_TIMEOUT
EOF
}

info() {
    printf '[INFO] %s\n' "$*"
}

warn() {
    printf '[WARN] %s\n' "$*" >&2
}

error() {
    printf '[ERROR] %s\n' "$*" >&2
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

run_root() {
    if [ "$(id -u)" -eq 0 ]; then
        "$@"
        return
    fi

    if command_exists sudo; then
        sudo "$@"
        return
    fi

    error "Privileges administrateur requis pour installer les prerequis: $*"
    error "Relancez le script avec un utilisateur ayant sudo ou en root."
    exit 1
}

detect_os() {
    case "$(uname -s 2>/dev/null || echo unknown)" in
        Darwin)
            OS_NAME="macos"
            OS_ID="macos"
            OS_ID_LIKE=""
            ;;
        Linux)
            OS_NAME="linux"
            if [ -f /etc/os-release ]; then
                OS_ID=$(sed -n 's/^ID=//p' /etc/os-release | tr -d '"' | head -n 1)
                OS_ID_LIKE=$(sed -n 's/^ID_LIKE=//p' /etc/os-release | tr -d '"' | head -n 1)
            else
                OS_ID="linux"
                OS_ID_LIKE=""
            fi
            ;;
        *)
            error "Systeme d'exploitation non supporte: $(uname -s 2>/dev/null || echo unknown)"
            exit 1
            ;;
    esac
}

ensure_homebrew() {
    if command_exists brew; then
        return
    fi

    info "Homebrew absent. Installation automatique en cours."
    NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    if [ -x /opt/homebrew/bin/brew ]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
        return
    fi

    if [ -x /usr/local/bin/brew ]; then
        eval "$(/usr/local/bin/brew shellenv)"
        return
    fi

    error "Homebrew a ete installe mais 'brew' reste introuvable dans le PATH."
    exit 1
}

install_prereqs_macos() {
    ensure_homebrew

    if ! command_exists git; then
        info "Installation de git via Homebrew."
        brew install git
    fi

    if ! command_exists curl; then
        info "Installation de curl via Homebrew."
        brew install curl
    fi

    if ! command_exists docker; then
        info "Installation de Docker Desktop via Homebrew."
        brew install --cask docker
    fi

    if ! docker compose version >/dev/null 2>&1 && ! command_exists docker-compose; then
        info "Installation de docker-compose via Homebrew."
        brew install docker-compose
    fi
}

install_prereqs_apt() {
    info "Installation des prerequis via apt-get."
    run_root apt-get update
    run_root apt-get install -y ca-certificates curl git docker.io
    if ! run_root apt-get install -y docker-compose-plugin; then
        run_root apt-get install -y docker-compose
    fi
}

install_prereqs_dnf() {
    info "Installation des prerequis via dnf."
    run_root dnf install -y ca-certificates curl git docker
    if ! run_root dnf install -y docker-compose-plugin; then
        run_root dnf install -y docker-compose
    fi
}

install_prereqs_yum() {
    info "Installation des prerequis via yum."
    run_root yum install -y ca-certificates curl git docker
    if ! run_root yum install -y docker-compose-plugin; then
        run_root yum install -y docker-compose
    fi
}

install_prereqs_pacman() {
    info "Installation des prerequis via pacman."
    run_root pacman -Sy --noconfirm --needed ca-certificates curl git docker docker-compose
}

install_prereqs_apk() {
    info "Installation des prerequis via apk."
    run_root apk add --no-cache ca-certificates curl git docker docker-cli-compose
}

install_prereqs_zypper() {
    info "Installation des prerequis via zypper."
    run_root zypper --non-interactive install ca-certificates curl git docker docker-compose
}

install_missing_prerequisites() {
    if [ "$OS_NAME" = "macos" ]; then
        install_prereqs_macos
        return
    fi

    case "$OS_ID:$OS_ID_LIKE" in
        ubuntu:*|debian:*|linuxmint:*|pop:*|elementary:*)
            install_prereqs_apt
            ;;
        fedora:*|rhel:*|centos:*|rocky:*|almalinux:*|ol:*)
            if command_exists dnf; then
                install_prereqs_dnf
            else
                install_prereqs_yum
            fi
            ;;
        arch:*|manjaro:*)
            install_prereqs_pacman
            ;;
        alpine:*)
            install_prereqs_apk
            ;;
        opensuse*:*|sles:*)
            install_prereqs_zypper
            ;;
        *)
            if printf '%s %s' "$OS_ID" "$OS_ID_LIKE" | grep -Eq 'debian|ubuntu'; then
                install_prereqs_apt
            elif printf '%s %s' "$OS_ID" "$OS_ID_LIKE" | grep -Eq 'rhel|fedora|centos|rocky|almalinux'; then
                if command_exists dnf; then
                    install_prereqs_dnf
                else
                    install_prereqs_yum
                fi
            elif printf '%s %s' "$OS_ID" "$OS_ID_LIKE" | grep -Eq 'suse'; then
                install_prereqs_zypper
            else
                error "Distribution Linux non supportee automatiquement: ID=$OS_ID ID_LIKE=$OS_ID_LIKE"
                exit 1
            fi
            ;;
    esac
}

prerequisites_missing() {
    if ! command_exists git || ! command_exists curl || ! command_exists docker; then
        return 0
    fi

    if docker compose version >/dev/null 2>&1; then
        return 1
    fi

    if command_exists docker-compose; then
        return 1
    fi

    return 0
}

ensure_docker_service() {
    if grep -qi microsoft /proc/version 2>/dev/null; then
        info "WSL detecte : Docker doit etre lance via Docker Desktop. Demarrage du service Linux ignore."
        return
    fi

    if [ "$OS_NAME" = "macos" ]; then
        info "Demarrage de Docker Desktop."
        open -a Docker >/dev/null 2>&1 || true
        return
    fi

    if command_exists systemctl; then
        run_root systemctl enable --now docker || warn "Impossible de demarrer docker via systemctl."
        return
    fi

    if command_exists service; then
        run_root service docker start || warn "Impossible de demarrer docker via service."
        return
    fi

    warn "Impossible de demarrer Docker automatiquement: ni systemctl ni service n'est disponible."
}

ensure_docker_access() {
    attempts=$DOCKER_START_TIMEOUT

    while [ "$attempts" -gt 0 ]; do
        if docker info >/dev/null 2>&1; then
            DOCKER_NEEDS_SUDO=0
            return 0
        fi

        if command_exists sudo && sudo docker info >/dev/null 2>&1; then
            DOCKER_NEEDS_SUDO=1
            warn "L'utilisateur courant n'a pas acces direct a Docker. Les commandes Docker seront executees via sudo."
            return 0
        fi

        attempts=$((attempts - 1))
        sleep 1
    done

    error "Docker n'est pas accessible apres ${DOCKER_START_TIMEOUT}s."
    return 1
}

docker_cli() {
    if [ "$DOCKER_NEEDS_SUDO" = "1" ]; then
        sudo docker "$@"
    else
        docker "$@"
    fi
}

detect_compose() {
    if docker_cli compose version >/dev/null 2>&1; then
        COMPOSE_IMPL="docker compose"
        return
    fi

    if command_exists docker-compose; then
        COMPOSE_IMPL="docker-compose"
        return
    fi

    error "Docker Compose est introuvable apres installation des prerequis."
    exit 1
}

compose() {
    if [ "$COMPOSE_IMPL" = "docker compose" ]; then
        docker_cli compose "$@"
    else
        if [ "$DOCKER_NEEDS_SUDO" = "1" ]; then
            sudo docker-compose "$@"
        else
            docker-compose "$@"
        fi
    fi
}

compose_up() {
    if [ "$WITH_SIMULATOR" = "1" ]; then
        info "Activation du profil Docker 'simulator'."
        COMPOSE_PROFILES=simulator compose up -d --build --remove-orphans
        return
    fi

    compose up -d --build --remove-orphans
}

show_diagnostics() {
    if [ -n "$PROJECT_DIR" ] && [ -d "$PROJECT_DIR" ] && [ -f "$PROJECT_DIR/docker-compose.yml" ]; then
        warn "Etat actuel des conteneurs :"
        (
            cd "$PROJECT_DIR"
            compose ps
        ) >&2 || true

        warn "Derniers logs Docker (120 lignes) :"
        (
            cd "$PROJECT_DIR"
            compose logs --tail=120
        ) >&2 || true
    fi
}

on_exit() {
    exit_code=$?
    if [ "$exit_code" -ne 0 ]; then
        error "Le deploiement a echoue pendant l'etape: $FAILED_STEP"
        show_diagnostics
    fi
    exit "$exit_code"
}

trap on_exit EXIT INT TERM

wait_for_backend() {
    attempts=$WAIT_TIMEOUT

    while [ "$attempts" -gt 0 ]; do
        if curl --silent --fail http://localhost:8000/health >/dev/null 2>&1; then
            info "Backend disponible sur /health."
            return 0
        fi
        attempts=$((attempts - 1))
        sleep 1
    done

    error "Le backend ne repond pas sur http://localhost:8000/health apres ${WAIT_TIMEOUT}s."
    return 1
}

parse_args() {
    while [ "$#" -gt 0 ]; do
        case "$1" in
            --repo)
                [ "$#" -ge 2 ] || {
                    error "Option --repo incomplete."
                    exit 1
                }
                REPO_URL=$2
                shift 2
                ;;
            --dir)
                [ "$#" -ge 2 ] || {
                    error "Option --dir incomplete."
                    exit 1
                }
                TARGET_DIR=$2
                shift 2
                ;;
            --branch)
                [ "$#" -ge 2 ] || {
                    error "Option --branch incomplete."
                    exit 1
                }
                BRANCH=$2
                shift 2
                ;;
            --with-simulator)
                WITH_SIMULATOR=1
                shift
                ;;
            --wait-timeout)
                [ "$#" -ge 2 ] || {
                    error "Option --wait-timeout incomplete."
                    exit 1
                }
                WAIT_TIMEOUT=$2
                shift 2
                ;;
            --docker-timeout)
                [ "$#" -ge 2 ] || {
                    error "Option --docker-timeout incomplete."
                    exit 1
                }
                DOCKER_START_TIMEOUT=$2
                shift 2
                ;;
            -h|--help)
                usage
                exit 0
                ;;
            *)
                error "Option inconnue: $1"
                usage >&2
                exit 1
                ;;
        esac
    done
}

resolve_project_dir() {
    case "$TARGET_DIR" in
        /*)
            PROJECT_DIR=$TARGET_DIR
            ;;
        *)
            PROJECT_DIR=$(pwd)/$TARGET_DIR
            ;;
    esac
}

ensure_prerequisites() {
    detect_os
    info "Systeme detecte: $OS_NAME ${OS_ID:-}"

    if prerequisites_missing; then
        info "Des prerequis sont manquants. Installation automatique en cours."
        install_missing_prerequisites
    else
        info "Les prerequis principaux sont deja presents."
    fi

    if ! command_exists git || ! command_exists curl || ! command_exists docker; then
        error "Tous les prerequis n'ont pas pu etre installes correctement."
        exit 1
    fi

    FAILED_STEP="demarrage du moteur Docker"
    ensure_docker_service
    ensure_docker_access
    detect_compose
}

clone_or_update_project() {
    # Depot deja clone => mise a jour (idempotent : permet de relancer le script).
    if [ -d "$PROJECT_DIR/.git" ]; then
        info "Depot deja present — mise a jour via git pull."
        if [ -n "$BRANCH" ]; then
            ( cd "$PROJECT_DIR" && git checkout "$BRANCH" && git pull --ff-only ) \
                || warn "Mise a jour git impossible — poursuite avec la version locale."
        else
            ( cd "$PROJECT_DIR" && git pull --ff-only ) \
                || warn "Mise a jour git impossible — poursuite avec la version locale."
        fi
        return
    fi

    if [ -e "$PROJECT_DIR" ]; then
        error "Le repertoire cible existe mais n'est pas un depot git: $PROJECT_DIR"
        error "Choisissez un autre chemin avec --dir, ou supprimez ce repertoire."
        exit 1
    fi

    if [ -n "$BRANCH" ]; then
        git clone --branch "$BRANCH" --single-branch "$REPO_URL" "$PROJECT_DIR"
    else
        git clone "$REPO_URL" "$PROJECT_DIR"
    fi
}

# Genere une cle aleatoire >= 32 caracteres (SECRET_KEY).
gen_secret() {
    if command_exists openssl; then
        openssl rand -hex 32
    else
        LC_ALL=C tr -dc 'a-f0-9' < /dev/urandom | head -c 64
        printf '\n'
    fi
}

# Genere un mot de passe alphanumerique (24 caracteres).
gen_password() {
    if command_exists openssl; then
        openssl rand -base64 24 | LC_ALL=C tr -dc 'A-Za-z0-9' | head -c 24
    else
        LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c 24
    fi
    printf '\n'
}

# Definit (ou remplace) une variable KEY=VALUE dans le fichier .env courant.
# Portable macOS/Linux (pas de sed -i, pas de mangling de lignes multi-=).
set_env_var() {
    _key=$1
    _val=$2
    _tmp=$(mktemp)
    grep -v "^${_key}=" .env > "$_tmp" 2>/dev/null || true
    printf '%s=%s\n' "$_key" "$_val" >> "$_tmp"
    mv "$_tmp" .env
}

write_default_env() {
    cat > .env <<'EOF'
# ── Database ──────────────────────────────────────────────
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=ecotrack
POSTGRES_USER=ecotrack
POSTGRES_PASSWORD=__set_at_deploy__

# ── Backend ───────────────────────────────────────────────
SECRET_KEY=__set_at_deploy__
ACCESS_TOKEN_EXPIRE_MINUTES=60
BACKEND_CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]

# ── MQTT / IoT Simulator ──────────────────────────────────
MQTT_BROKER_HOST=mosquitto
MQTT_BROKER_PORT=1883
MQTT_USERNAME=ecotrack
MQTT_PASSWORD=Admin001@
IOT_SIMULATE_INTERVAL_SECONDS=15
IOT_CONTAINERS_COUNT=100

# ── Frontend ──────────────────────────────────────────────
VITE_API_BASE_URL=http://localhost:8000/api/v1
EOF
}

prepare_env() {
    if [ -f .env ]; then
        info "Fichier .env deja present — conserve tel quel (secrets inchanges)."
        return
    fi

    if [ -f .env.example ]; then
        cp .env.example .env
        info "Fichier .env initialise depuis .env.example."
    else
        write_default_env
        warn "Fichier .env.example introuvable. .env genere depuis le modele integre."
    fi

    # Remplace les secrets par des valeurs aleatoires — jamais de secret en clair
    # versionne. Genere uniquement a la creation : un .env existant n'est pas touche
    # (le volume PostgreSQL conserve le mot de passe initial).
    set_env_var SECRET_KEY "$(gen_secret)"
    set_env_var POSTGRES_PASSWORD "$(gen_password)"
    if grep -q '^MQTT_PASSWORD=' .env; then
        set_env_var MQTT_PASSWORD "$(gen_password)"
    fi
    info "Secrets generes aleatoirement (SECRET_KEY, POSTGRES_PASSWORD)."
}

print_summary() {
    printf '\n'
    printf 'ECOTRACK deployee avec succes.\n'
    printf '\n'
    printf 'Repertoire du projet : %s\n' "$PROJECT_DIR"
    printf 'Frontend           : http://localhost:5173\n'
    printf 'API                : http://localhost:8000/api/v1\n'
    printf 'Documentation API  : http://localhost:8000/docs\n'
    printf 'OpenAPI JSON       : http://localhost:8000/openapi.json\n'
    printf 'Healthcheck        : http://localhost:8000/health\n'
    printf 'PostgreSQL         : localhost:5433\n'
    printf 'MQTT broker        : localhost:1883\n'
    if [ "$WITH_SIMULATOR" = "1" ]; then
        printf 'Profil active      : simulator\n'
    fi
    if [ "$DOCKER_NEEDS_SUDO" = "1" ]; then
        printf 'Docker access      : sudo\n'
    fi
    printf '\n'
    printf 'Verification Docker :\n'
    (
        cd "$PROJECT_DIR"
        compose ps
    )
}

main() {
    parse_args "$@"
    resolve_project_dir

    FAILED_STEP="verification et installation des prerequis"
    ensure_prerequisites

    FAILED_STEP="clonage ou mise a jour du depot"
    clone_or_update_project

    cd "$PROJECT_DIR"

    FAILED_STEP="initialisation du fichier .env"
    prepare_env

    FAILED_STEP="deploiement des conteneurs Docker"
    compose_up

    FAILED_STEP="verification de la disponibilite du backend"
    wait_for_backend

    FAILED_STEP="finalisation"
    print_summary
}

main "$@"
