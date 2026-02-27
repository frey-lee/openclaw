# OpenClaw Repository Overview

## Project Identity
- **Name**: OpenClaw
- **Version**: 2026.1.29
- **License**: MIT
- **Package**: `openclaw` (npm)

## What is OpenClaw?
OpenClaw is a sophisticated personal AI assistant platform that runs on your own devices. It serves as a unified gateway for AI-powered conversations across multiple messaging platforms.

## Core Capabilities
1. **Multi-Channel Messaging** - Integrates with 20+ platforms including WhatsApp, Telegram, Discord, Slack, Signal, iMessage, LINE, Matrix, Microsoft Teams, Google Chat, and more
2. **AI Agent Framework** - Manages AI agent sessions, memory, and context
3. **Plugin Architecture** - Extensible through plugins and extensions
4. **Skills System** - 50+ modular skills (1password, github, notion, spotify, etc.)
5. **Cross-Platform Apps** - Native iOS, Android, and macOS applications
6. **Gateway Server** - Central HTTP/WebSocket server for managing all communications

## Repository Structure

### Root Level
```
openclaw/
├── src/                 # Main TypeScript source (48+ directories)
├── extensions/          # 29+ platform integrations
├── skills/              # 50+ agent skills
├── apps/                # iOS, Android, macOS native apps
├── packages/            # Additional packages
├── ui/                  # Web-based UI
├── vendor/              # Third-party code (a2ui)
├── docs/                # Documentation
├── test/                # Integration tests
├── assets/              # Static assets
├── scripts/             # Build scripts
└── patches/             # Dependency patches
```

### Source Directory (`src/`)
Key subdirectories:
- `agents/` - Agent core logic (640+ files)
- `gateway/` - Gateway server (1100+ files)
- `config/` - Configuration system (880+ files)
- `plugins/` - Plugin system (280+ files)
- `channels/` - Channel abstractions
- `cli/` - Command-line interface
- `providers/` - LLM provider integrations
- `sessions/` - Session management
- `memory/` - Context/memory management
- `hooks/` - Event-driven hooks

### Channel Integrations
Both in `src/` and `extensions/`:
- Discord, Telegram, Slack, Signal
- WhatsApp, iMessage, LINE
- Matrix, Mattermost, Microsoft Teams
- Google Chat, Nextcloud Talk
- Nostr, Tlon, Twitch, Zalo

## Technology Stack
| Component | Technology |
|-----------|------------|
| Language | TypeScript (ES2022) |
| Runtime | Node.js >= 22.12.0 |
| Package Manager | pnpm 10.23.0 |
| Testing | Vitest |
| Linting | oxlint, shellcheck, swiftlint |
| Formatting | oxfmt |
| Deployment | Docker, Fly.io |
| Mobile | Swift (iOS/macOS), Gradle (Android) |

## Entry Points
- **CLI**: `openclaw.mjs` (wrapper)
- **Library**: `dist/index.js`
- **Plugin SDK**: `dist/plugin-sdk/index.js`
- **Gateway**: `src/gateway/`

## Key Scripts (from package.json)
- `pnpm build` - Compile TypeScript
- `pnpm gateway:watch` - Development mode
- `pnpm openclaw onboard` - Setup wizard
- `pnpm test` - Run tests
- `pnpm lint` / `pnpm format` - Code quality

## Configuration Files
- `package.json` - Project manifest
- `tsconfig.json` - TypeScript config
- `pnpm-workspace.yaml` - Monorepo workspaces
- `docker-compose.yml` - Container services
- `fly.toml` - Fly.io deployment
- `.env.example` - Environment template
