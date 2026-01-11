#!/bin/bash

# ===========================================
# SDC-LLM 서버 실행 스크립트
# ===========================================

PROJECT_DIR="/home/ptyoung/sdc-llm"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BACKEND_DIR="$PROJECT_DIR/backend"
GRADIO_DIR="/home/ptyoung/sdc-cust-qual"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 포트 사용 확인 함수 (curl 기반)
check_port() {
    local port=$1
    if curl -s --connect-timeout 2 http://localhost:$port > /dev/null 2>&1; then
        return 0  # 사용 중
    else
        return 1  # 사용 안 함
    fi
}

# 포트 종료 함수
kill_port() {
    local port=$1
    if check_port $port; then
        log_warn "포트 $port 사용 중 - 종료 시도..."
        lsof -ti:$port | xargs kill -9 2>/dev/null
        sleep 1
    fi
}

# 관련 프로세스 강제 종료
cleanup_processes() {
    log_info "기존 프로세스 정리 중..."

    # Next.js 관련 프로세스 종료 (모든 관련 프로세스)
    pkill -9 -f "next-server" 2>/dev/null
    pkill -9 -f "next start" 2>/dev/null
    pkill -9 -f "next dev" 2>/dev/null
    pkill -9 -f "node.*next" 2>/dev/null
    pkill -9 -f "node.*\.next" 2>/dev/null

    # 백엔드 프로세스 종료
    pkill -9 -f "uvicorn app.main:app" 2>/dev/null
    pkill -9 -f "uvicorn.*8000" 2>/dev/null

    # Gradio 프로세스 종료
    pkill -9 -f "app_full.py" 2>/dev/null
    pkill -9 -f "gradio" 2>/dev/null

    # 포트 강제 정리 (여러 번 시도)
    for i in 1 2 3; do
        lsof -ti:3000 | xargs kill -9 2>/dev/null
        lsof -ti:8000 | xargs kill -9 2>/dev/null
        lsof -ti:7860 | xargs kill -9 2>/dev/null
        sleep 0.5
    done

    # Next.js lock 파일 삭제
    rm -f "$FRONTEND_DIR/.next/dev/lock" 2>/dev/null
    rm -f "$FRONTEND_DIR/.next/server/dev-lock" 2>/dev/null

    # trace 파일 삭제 (stale 프로세스 정보)
    rm -f "$FRONTEND_DIR/.next/trace" 2>/dev/null

    sleep 2
    log_success "프로세스 정리 완료"
}

# Next.js 캐시 초기화
clear_nextjs_cache() {
    log_info "Next.js 캐시 초기화 중..."

    cd "$FRONTEND_DIR"

    # 개발 캐시 삭제
    rm -rf .next/cache 2>/dev/null

    # lock 파일 삭제
    rm -f .next/dev/lock 2>/dev/null
    rm -f .next/server/dev-lock 2>/dev/null

    # trace 파일 삭제
    rm -f .next/trace 2>/dev/null

    log_success "Next.js 캐시 초기화 완료"
}

# 전체 빌드 캐시 삭제 (클린 빌드용)
clean_build() {
    log_info "전체 빌드 캐시 삭제 중..."

    cd "$FRONTEND_DIR"

    # .next 폴더 전체 삭제
    rm -rf .next 2>/dev/null

    # node_modules/.cache 삭제
    rm -rf node_modules/.cache 2>/dev/null

    log_success "빌드 캐시 삭제 완료"
    log_info "다음 시작 시 전체 빌드가 진행됩니다."
}

# 이전 세션 확인 및 정리
check_stale_sessions() {
    log_info "이전 세션 확인 중..."

    local stale_found=false

    # 포트 사용 중인지 확인
    if lsof -ti:3000 > /dev/null 2>&1; then
        log_warn "포트 3000에서 이전 프론트엔드 세션 발견"
        stale_found=true
    fi

    if lsof -ti:8000 > /dev/null 2>&1; then
        log_warn "포트 8000에서 이전 백엔드 세션 발견"
        stale_found=true
    fi

    # lock 파일 확인
    if [ -f "$FRONTEND_DIR/.next/dev/lock" ]; then
        log_warn "Next.js lock 파일 발견 (이전 세션 잔존)"
        stale_found=true
    fi

    if [ "$stale_found" = true ]; then
        log_info "이전 세션 정리 진행..."
        cleanup_processes
        clear_nextjs_cache
    else
        log_success "이전 세션 없음"
    fi
}

# Ollama 확인
check_ollama() {
    log_info "Ollama 상태 확인..."
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        log_success "Ollama 실행 중 (localhost:11434)"
        return 0
    else
        log_error "Ollama가 실행되지 않았습니다. 먼저 Ollama를 시작하세요."
        return 1
    fi
}

# PostgreSQL 확인
check_postgres() {
    log_info "PostgreSQL 상태 확인..."
    if pg_isready -q 2>/dev/null; then
        log_success "PostgreSQL 실행 중"
        return 0
    else
        log_warn "PostgreSQL 상태를 확인할 수 없습니다."
        return 1
    fi
}

# 백엔드 서버 시작 (포트 8000)
start_backend() {
    log_info "백엔드 서버 시작 중..."

    if check_port 8000; then
        log_warn "백엔드 서버가 이미 실행 중입니다 (localhost:8000)"
        return 0
    fi

    cd "$BACKEND_DIR"
    source venv/bin/activate
    nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &

    sleep 2
    if check_port 8000; then
        log_success "백엔드 서버 시작됨 (localhost:8000)"
    else
        log_error "백엔드 서버 시작 실패"
        return 1
    fi
}

# 프론트엔드 서버 시작 (포트 3000)
start_frontend() {
    local mode="${1:-prod}"  # prod 또는 dev
    log_info "프론트엔드 서버 시작 중... (모드: $mode)"

    if check_port 3000; then
        log_warn "프론트엔드 서버가 이미 실행 중입니다 (localhost:3000)"
        return 0
    fi

    cd "$FRONTEND_DIR"

    # Next.js lock 파일 삭제 (충돌 방지)
    if [ -f ".next/dev/lock" ]; then
        rm -f ".next/dev/lock"
        log_info "Next.js lock 파일 삭제됨"
    fi

    if [ "$mode" = "dev" ]; then
        # 개발 모드
        nohup npm run dev > /tmp/frontend.log 2>&1 &
    else
        # 프로덕션 모드
        # 프로덕션 빌드 확인
        if [ ! -d ".next" ] || [ ! -f ".next/BUILD_ID" ]; then
            log_info "프로덕션 빌드 실행 중..."
            npm run build
        fi
        nohup npm run start > /tmp/frontend.log 2>&1 &
    fi

    sleep 5
    if check_port 3000; then
        log_success "프론트엔드 서버 시작됨 (localhost:3000)"
    else
        log_error "프론트엔드 서버 시작 실패 - 로그: /tmp/frontend.log"
        return 1
    fi
}

# Gradio 서버 시작 (포트 7860)
start_gradio() {
    log_info "Gradio 서버 시작 중..."

    if check_port 7860; then
        log_warn "Gradio 서버가 이미 실행 중입니다 (localhost:7860)"
        return 0
    fi

    cd "$GRADIO_DIR"

    # 가상환경 활성화
    if [ -d ".venv" ]; then
        source .venv/bin/activate
    fi

    nohup python demo/app_full.py > /tmp/gradio.log 2>&1 &

    sleep 5
    if check_port 7860; then
        log_success "Gradio 서버 시작됨 (localhost:7860)"
    else
        log_error "Gradio 서버 시작 실패 - 로그: /tmp/gradio.log"
        return 1
    fi
}

# 모든 서버 종료
stop_all() {
    log_info "모든 서버 종료 중..."
    cleanup_processes
    log_success "모든 서버가 종료되었습니다."
}

# 상태 확인
status() {
    echo ""
    echo "=========================================="
    echo "        SDC-LLM 서버 상태"
    echo "=========================================="
    echo ""

    if check_port 3000; then
        log_success "프론트엔드  : http://localhost:3000"
    else
        log_error "프론트엔드  : 중지됨"
    fi

    if check_port 8000; then
        log_success "백엔드      : http://localhost:8000"
    else
        log_error "백엔드      : 중지됨"
    fi

    if check_port 7860; then
        log_success "Gradio     : http://localhost:7860"
    else
        log_warn "Gradio     : 중지됨"
    fi

    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        log_success "Ollama      : http://localhost:11434"
    else
        log_error "Ollama      : 중지됨"
    fi

    echo ""
}

# 브라우저 캐시 초기화 안내
show_browser_cache_info() {
    echo ""
    echo "=========================================="
    echo "     브라우저 캐시 초기화 안내"
    echo "=========================================="
    echo ""
    echo "브라우저 캐시는 서버에서 직접 삭제할 수 없습니다."
    echo "아래 방법으로 브라우저 캐시를 초기화하세요:"
    echo ""
    echo "  [Chrome/Edge]"
    echo "    - 강력 새로고침: Ctrl + Shift + R (Windows) / Cmd + Shift + R (Mac)"
    echo "    - 캐시 삭제: Ctrl + Shift + Delete → '캐시된 이미지 및 파일' 선택"
    echo ""
    echo "  [Firefox]"
    echo "    - 강력 새로고침: Ctrl + Shift + R"
    echo "    - 캐시 삭제: Ctrl + Shift + Delete → '캐시' 선택"
    echo ""
    echo "  [개발자 도구에서]"
    echo "    - F12 → Network 탭 → 'Disable cache' 체크"
    echo ""
}

# 메인 함수
main() {
    echo ""
    echo "=========================================="
    echo "     SDC-LLM 서버 시작 스크립트"
    echo "=========================================="
    echo ""

    case "${1:-start}" in
        start)
            check_stale_sessions
            check_ollama || exit 1
            start_backend
            start_frontend "prod"
            start_gradio
            echo ""
            status
            ;;
        dev)
            check_stale_sessions
            clear_nextjs_cache
            check_ollama || exit 1
            start_backend
            start_frontend "dev"
            start_gradio
            echo ""
            log_info "개발 모드로 실행 중 (Hot Reload 활성화)"
            status
            ;;
        clean)
            log_info "클린 시작 모드..."
            cleanup_processes
            clean_build
            check_ollama || exit 1
            start_backend
            start_frontend "prod"
            start_gradio
            echo ""
            log_success "클린 빌드 완료"
            status
            show_browser_cache_info
            ;;
        clean-dev)
            log_info "클린 개발 모드 시작..."
            cleanup_processes
            clean_build
            check_ollama || exit 1
            start_backend
            start_frontend "dev"
            start_gradio
            echo ""
            log_success "클린 개발 모드 시작 완료"
            status
            show_browser_cache_info
            ;;
        stop)
            stop_all
            ;;
        restart)
            stop_all
            sleep 2
            main start
            ;;
        status)
            status
            ;;
        cache-info)
            show_browser_cache_info
            ;;
        *)
            echo "사용법: $0 {start|dev|clean|clean-dev|stop|restart|status|cache-info}"
            echo ""
            echo "  start     - 프로덕션 모드로 서버 시작"
            echo "  dev       - 개발 모드로 서버 시작 (Hot Reload)"
            echo "  clean     - 캐시 삭제 후 프로덕션 모드 시작"
            echo "  clean-dev - 캐시 삭제 후 개발 모드 시작"
            echo "  stop      - 모든 서버 종료"
            echo "  restart   - 서버 재시작"
            echo "  status    - 서버 상태 확인"
            echo "  cache-info - 브라우저 캐시 초기화 안내"
            exit 1
            ;;
    esac
}

main "$@"
