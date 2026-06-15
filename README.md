# @omadia/plugin-llm-anthropic

Adds Anthropic's Claude models as an LLM you can assign to any agent in omadia.

omadia is a self-hostable agentic OS: you build, run, and audit multi-agent AI teams from signed plugins, and you bring your own LLM key. Main repo: [byte5ai/omadia](https://github.com/byte5ai/omadia). This plugin makes Claude one of the providers an operator can pick on the admin Providers page.

## Models

| Model | Class |
|-------|-------|
| Claude Opus 4.8 | frontier |
| Claude Sonnet 4.6 | balanced |
| Claude Haiku 4.5 | fast |

Agents request a class (`fast` / `balanced` / `frontier`). omadia resolves the class to the concrete model, so an agent never has to name a specific model.

## How it works in omadia

This is a declarative provider, so it ships no runtime provider code. The `llm_provider` block in `manifest.yaml` (id, base URL, models) is read by the omadia kernel when the plugin loads, before any agent activates, and registered into the kernel's provider catalog. Claude uses the native Anthropic Messages API, so omadia drives it through its built-in Anthropic adapter, not an OpenAI-compatibility shim.

## Install

Install from the omadia hub at [hub.omadia.ai](https://hub.omadia.ai) (omadia admin, plugins, install), or upload the built ZIP directly.

After install:

1. Open the admin Providers page and paste your Anthropic API key. It is stored encrypted in the vault under `provider:anthropic/api_key`.
2. Assign Anthropic and a model to an agent: the orchestrator, a sub-agent, or the verifier.

## Configuration

| Setup field | Required | Default | Notes |
|-------------|:--------:|---------|-------|
| `anthropic_base_url` | no | `https://api.anthropic.com` | Override to route through an Anthropic-compatible gateway. |

The API key is not a per-plugin secret. It is set centrally on the Providers page so the orchestrator reads it from the shared vault scope.

## Build from source

```bash
npm install
npm run build   # tsc, emits dist/
npm test        # validates manifest.yaml against core's invariants
```

The plugin compiles against omadia workspace packages (`@omadia/plugin-api`, `@omadia/llm-provider`), declared as optional peer deps with no registry package. Link them from a local omadia checkout before building. See [byte5ai/omadia](https://github.com/byte5ai/omadia) for the package layout.

## License

MIT, byte5 GmbH
