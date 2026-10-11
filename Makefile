# =============================================================================
# DyingStar Launcher - Makefile
# =============================================================================
# Thin wrapper over the pnpm scripts of package.json, run on the host (ADR 0002):
# Electron needs a native window and per-OS packaging, so no Docker here.

# Colors for output
CYAN := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m

# `make pnpm <args>`: the words after `pnpm` are pnpm arguments, not make targets.
# They get a no-op rule so make does not try to build them; any other unknown target
# still fails with make's usual "No rule to make target" error.
# Arguments starting with `-` are read by make itself: pass them with ARGS="...".
ifeq (pnpm,$(firstword $(MAKECMDGOALS)))
PNPM_WORDS := $(wordlist 2,$(words $(MAKECMDGOALS)),$(MAKECMDGOALS))
PNPM_ARGS := $(strip $(PNPM_WORDS) $(ARGS))
$(foreach word,$(PNPM_WORDS),$(eval $(subst :,\:,$(word)):;@:))
else
PNPM_ARGS := $(ARGS)
endif

# pnpm is pinned by `packageManager` in package.json (corepack).
PNPM := pnpm

# Linux display backend for `make dev` / `make start`: PLATFORM=x11 or PLATFORM=wayland.
# Empty keeps Electron's auto-detection (what users get); passed to Electron after `--`.
ifneq (,$(filter-out x11 wayland,$(PLATFORM)))
$(error PLATFORM must be x11 or wayland, got "$(PLATFORM)")
endif
ELECTRON_ARGS := $(if $(PLATFORM),-- --ozone-platform=$(PLATFORM))

# WSLg keeps its Wayland socket outside $XDG_RUNTIME_DIR: point Electron at it directly.
ifeq ($(PLATFORM),wayland)
ifeq (,$(wildcard $(XDG_RUNTIME_DIR)/$(WAYLAND_DISPLAY)))
ifneq (,$(wildcard /mnt/wslg/runtime-dir/wayland-0))
export WAYLAND_DISPLAY := /mnt/wslg/runtime-dir/wayland-0
endif
endif
endif

# =============================================================================
# Testers profile - Try the launcher
# =============================================================================

.PHONY: start
start: .env node_modules ## Build and run the launcher in production preview mode (PLATFORM=x11|wayland on Linux)
	@echo "$(CYAN)🚀 Starting DyingStar Launcher (production preview)...$(RESET)"
	@$(PNPM) start $(ELECTRON_ARGS)

# =============================================================================
# Dev profile - Development commands
# =============================================================================

.PHONY: install
install: .env ## Install dependencies and the headless Chromium of the rendering tests
	@echo "$(CYAN)📦 Installing dependencies...$(RESET)"
	@$(PNPM) install
	@$(PNPM) test:browser:install

.PHONY: dev
dev: .env node_modules ## Run the launcher with hot reload (PLATFORM=x11|wayland on Linux)
	@echo "$(CYAN)🔧 Starting development mode...$(RESET)"
	@$(PNPM) dev $(ELECTRON_ARGS)

# Generic pnpm command runner
.PHONY: pnpm
pnpm: ## Run any pnpm command (usage: make pnpm typecheck:web, make pnpm add zod ARGS="-D")
	@if [ -z "$(PNPM_ARGS)" ]; then \
		echo "$(RED)❌ Please provide a pnpm command. Usage: make pnpm <command>$(RESET)"; \
		echo "$(YELLOW)Examples: make pnpm typecheck:web, make pnpm lint:fix$(RESET)"; \
		exit 1; \
	fi
	@echo "$(CYAN)📦 Running: pnpm $(PNPM_ARGS)$(RESET)"
	@$(PNPM) $(PNPM_ARGS)

.PHONY: check
check: node_modules ## Format, then lint, typecheck, test and check formatting (run before every commit)
	@echo "$(CYAN)🔎 Format, lint, typecheck, test, format check...$(RESET)"
	@$(PNPM) format
	@$(PNPM) lint
	@$(PNPM) typecheck
	@$(PNPM) test
	@$(PNPM) format:check
	@echo "$(GREEN)✅ All checks passed$(RESET)"

# =============================================================================
# Build & packaging
# =============================================================================

.PHONY: build
build: .env node_modules ## Typecheck and build to out/
	@echo "$(CYAN)🏗️  Building...$(RESET)"
	@$(PNPM) build

.PHONY: package
package: .env node_modules ## Package for the current OS into release/ (AppImage/deb/rpm, NSIS or .app)
	@echo "$(CYAN)📦 Packaging for the current OS...$(RESET)"
	@case "$$(uname -s)" in \
		Linux) $(PNPM) build:linux ;; \
		Darwin) $(PNPM) build:mac ;; \
		MINGW*|MSYS*|CYGWIN*) $(PNPM) build:win ;; \
		*) echo "$(RED)❌ Unsupported OS: $$(uname -s)$(RESET)"; exit 1 ;; \
	esac

.PHONY: package-dir
package-dir: .env node_modules ## Package unpacked (no installer) into release/, for a quick check
	@$(PNPM) build:unpack

# =============================================================================
# Utility commands
# =============================================================================

.PHONY: clean
clean: ## Remove build outputs (out/, release/) and the ESLint cache
	@echo "$(CYAN)🧹 Removing out/, release/ and .eslintcache...$(RESET)"
	@rm -rf out release .eslintcache
	@echo "$(GREEN)✅ Clean$(RESET)"

# Install dependencies when missing (first run).
node_modules:
	@$(MAKE) --no-print-directory install

# Create the local env file from the example on first run.
.env:
	@cp .env.example .env
	@echo "$(YELLOW)Created .env from .env.example — edit it to configure API / ZIP URLs$(RESET)"

# =============================================================================
# Help
# =============================================================================

.PHONY: help
help: ## Show this help message
	@echo "$(CYAN)DyingStar Launcher - Available Commands:$(RESET)"
	@echo ""
	@echo "$(YELLOW)Testers Profile:$(RESET)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(CYAN)%-15s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST) | grep -E "^  .{5}(start) "
	@echo ""
	@echo "$(YELLOW)Dev Profile:$(RESET)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(CYAN)%-15s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST) | grep -E "^  .{5}(install|dev|pnpm|check) "
	@echo ""
	@echo "$(YELLOW)Build & Packaging:$(RESET)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(CYAN)%-15s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST) | grep -E "^  .{5}(build|package|package-dir) "
	@echo ""
	@echo "$(YELLOW)Utilities:$(RESET)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(CYAN)%-15s$(RESET) %s\n", $$1, $$2}' $(MAKEFILE_LIST) | grep -E "^  .{5}(clean) "
	@echo ""
	@echo "$(YELLOW)Examples:$(RESET)"
	@echo "  $(CYAN)make start$(RESET)               # Try the launcher (testers)"
	@echo "  $(CYAN)make dev$(RESET)                 # Hot-reload development"
	@echo "  $(CYAN)make dev PLATFORM=wayland$(RESET) # Force the Linux display backend (x11|wayland)"
	@echo "  $(CYAN)make check$(RESET)               # Every check before a commit"
	@echo "  $(CYAN)make pnpm typecheck:web$(RESET)  # Typecheck the renderer only"
	@echo "  $(CYAN)make pnpm test$(RESET)           # Run the unit tests"
	@echo "  $(CYAN)make package$(RESET)             # Installer for the current OS"

# Default target
.DEFAULT_GOAL := help
