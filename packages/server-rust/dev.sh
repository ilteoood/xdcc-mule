#!/bin/bash

# Development helper script for XDCC Mule Rust Server

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  check     - Run cargo check"
    echo "  build     - Build the project"
    echo "  run       - Run the development server"
    echo "  test      - Run tests"
    echo "  watch     - Run with hot reload (requires cargo-watch)"
    echo "  docker    - Build and run Docker container"
    echo "  clean     - Clean build artifacts"
    echo "  setup     - Install development dependencies"
    echo ""
}

check_env() {
    if [ ! -f ".env" ] && [ -z "$DATABASE_URL" ]; then
        echo -e "${YELLOW}Warning: No .env file found and DATABASE_URL not set${NC}"
        echo "Copy .env.example to .env and set DATABASE_URL"
    fi
}

case "${1:-}" in
    "check")
        echo -e "${BLUE}Running cargo check...${NC}"
        check_env
        cargo check
        echo -e "${GREEN}✅ Check completed${NC}"
        ;;

    "build")
        echo -e "${BLUE}Building project...${NC}"
        check_env
        cargo build --release
        echo -e "${GREEN}✅ Build completed${NC}"
        ;;

    "run")
        echo -e "${BLUE}Starting development server...${NC}"
        check_env
        if [ -f ".env" ]; then
            set -a
            source .env
            set +a
        fi
        cargo run
        ;;

    "test")
        echo -e "${BLUE}Running tests...${NC}"
        export DATABASE_URL="test_url"
        cargo test
        echo -e "${GREEN}✅ Tests completed${NC}"
        ;;

    "watch")
        echo -e "${BLUE}Starting development server with hot reload...${NC}"
        if ! command -v cargo-watch &> /dev/null; then
            echo -e "${RED}cargo-watch not found. Installing...${NC}"
            cargo install cargo-watch
        fi
        check_env
        if [ -f ".env" ]; then
            set -a
            source .env
            set +a
        fi
        cargo watch -x run
        ;;

    "docker")
        echo -e "${BLUE}Building and running Docker container...${NC}"
        docker build -t xdcc-mule-rust .
        echo -e "${GREEN}✅ Docker build completed${NC}"
        echo -e "${BLUE}Starting container on port 3000...${NC}"
        if [ -f ".env" ]; then
            docker run --env-file .env -p 3000:3000 xdcc-mule-rust
        else
            echo -e "${YELLOW}No .env file found. Please set DATABASE_URL manually:${NC}"
            echo "docker run -e DATABASE_URL='your_url_here' -p 3000:3000 xdcc-mule-rust"
        fi
        ;;

    "clean")
        echo -e "${BLUE}Cleaning build artifacts...${NC}"
        cargo clean
        echo -e "${GREEN}✅ Clean completed${NC}"
        ;;

    "setup")
        echo -e "${BLUE}Installing development dependencies...${NC}"
        cargo install cargo-watch
        if [ ! -f ".env" ] && [ -f ".env.example" ]; then
            cp .env.example .env
            echo -e "${GREEN}✅ Created .env from .env.example${NC}"
            echo -e "${YELLOW}Please edit .env and set DATABASE_URL${NC}"
        fi
        echo -e "${GREEN}✅ Setup completed${NC}"
        ;;

    "help"|"-h"|"--help")
        usage
        ;;

    "")
        usage
        ;;

    *)
        echo -e "${RED}Unknown command: $1${NC}"
        usage
        exit 1
        ;;
esac
