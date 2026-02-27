# Skills System

## Overview
51+ bundled skills that teach agents about available tools. Skills are documentation files that guide the model on how to use tools.

## Skill File Format (`SKILL.md`)
```yaml
---
name: skill-name
description: Brief description
homepage: https://example.com
user-invocable: true
disable-model-invocation: false
metadata: {"openclaw": {...}}
---

# Skill Instructions
Markdown content teaching the model how to use tools...
```

## OpenClaw Metadata
```json
{
  "openclaw": {
    "always": boolean,
    "emoji": "emoji",
    "primaryEnv": "API_KEY",
    "os": ["darwin", "linux", "win32"],
    "requires": {
      "bins": ["binary"],
      "anyBins": ["option1", "option2"],
      "env": ["ENV_VAR"],
      "config": ["config.path"]
    },
    "install": [...]
  }
}
```

## Skill Loading Precedence (Low to High)
1. **Bundled** (`/skills` in package)
2. **Managed** (`~/.openclaw/skills`)
3. **Extra** (`skills.load.extraDirs`)
4. **Plugin** skills
5. **Workspace** (`<workspace>/skills`) - highest

## Eligibility Gating
| Gate | Check | Behavior |
|------|-------|----------|
| `always` | Boolean | Bypass all gates |
| `enabled` | Config | Explicit disable |
| `os` | Platform | OS matching |
| `bins` | Binary | ALL required |
| `anyBins` | Binary | AT LEAST ONE |
| `env` | Environment | Var exists |
| `config` | Config path | Value truthy |
| `allowBundled` | Allowlist | Limit bundled |

## Environment Injection
- Per-skill env vars injected at agent run start
- Restored after agent run completes
- Scoped to agent run only
- `apiKey` → `primaryEnv` sugar

## Configuration
```json
{
  "skills": {
    "allowBundled": ["github", "notion"],
    "load": {
      "extraDirs": ["~/skills"],
      "watch": true,
      "watchDebounceMs": 250
    },
    "entries": {
      "notion": {
        "enabled": true,
        "apiKey": "secret",
        "env": { "NOTION_API_KEY": "secret" }
      }
    }
  }
}
```

## Skill-Tool Relationship
- Skills are NOT tools themselves
- Skills TEACH the model about tools
- Skills contain usage patterns and examples
- Tools are actual system interfaces (binaries, APIs)

## Skill Commands
- `user-invocable: true` → exposed as `/command`
- `disable-model-invocation: true` → hidden from model
- `command-dispatch: tool` → bypass model, invoke tool directly

## Hot Reload
- File watcher monitors skill directories
- Debounced changes bump version
- Next agent run uses new snapshot
- No gateway restart needed

## Skill Status
- `✓ ready` - All requirements met
- `⏸ disabled` - Explicitly disabled
- `🚫 blocked` - Filtered by allowlist
- `✗ missing` - Missing requirements
