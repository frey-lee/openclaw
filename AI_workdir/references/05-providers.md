# LLM Provider Integration

## Supported Providers

| Provider | API Type | Key Features |
|----------|----------|--------------|
| **Anthropic** | anthropic-messages | Claude models, 200K+ context, vision, reasoning |
| **OpenAI** | openai-completions | GPT models, vision |
| **Google** | google-generative-ai | Gemini models, reasoning |
| **AWS Bedrock** | bedrock-converse-stream | Dynamic discovery, multi-region |
| **GitHub Copilot** | github-copilot | Token exchange, proxy detection |
| **MiniMax** | - | Reasoning models, 200K context |
| **Moonshot** | openai-compatible | Kimi K2.5, 256K context |
| **Qwen Portal** | - | OAuth-based auth |
| **Ollama** | - | Local models, discovery |
| **Venice** | - | Dynamic model discovery |

## Key Files
- `src/agents/model-catalog.ts` - Model discovery
- `src/agents/model-selection.ts` - Model resolution
- `src/agents/model-fallback.ts` - Failover orchestration
- `src/agents/models-config.ts` - Provider config generation
- `src/agents/bedrock-discovery.ts` - AWS Bedrock discovery
- `src/providers/github-copilot-token.ts` - Copilot token exchange

## Configuration Structure
```typescript
ModelProvider {
  id: string;
  baseUrl?: string;
  apiKey?: string;
  auth?: "api-key" | "aws-sdk" | "oauth" | "token";
  api?: "openai-completions" | "anthropic-messages" | ...;
  headers?: Record<string, string>;
  models?: ModelDefinition[];
}
```

## Model Discovery
- **Static**: Configured in config.yaml
- **Implicit**: Discovered from environment
  - Bedrock: AWS SDK discovery
  - Copilot: Token-based detection
  - Ollama: Local endpoint discovery
  - Venice: API-based discovery

## Failover Mechanism
1. Try primary model with current auth profile
2. Classify failure reason:
   - `auth` (401/403)
   - `rate_limit` (429)
   - `context_overflow`
   - `timeout`
   - `billing` (402)
3. Apply recovery strategy:
   - Auth failures → next profile
   - Rate limits → profile cooldown
   - Context overflow → session compaction
   - Timeout → next fallback model

## Streaming Architecture
```
Provider Response
  → subscribeEmbeddedPiSession()
    → Text delta handling
    → Reasoning block processing
    → Tool call aggregation
    → Block chunking
  → Client
```

## Defaults
- Default provider: `anthropic`
- Default model: `claude-opus-4-5`
- Default context: 200,000 tokens

## Provider-Specific Handling
- **Google**: Turn ordering fixes for function calls
- **Bedrock**: Multi-region, lifecycle status checking
- **Copilot**: Token exchange with proxy extraction
- **Z.ai**: Disable supportsDeveloperRole
