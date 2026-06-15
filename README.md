# @omadia/plugin-llm-anthropic

Adds **Anthropic (Claude)** as an admin-selectable LLM provider for [omadia](https://github.com/byte5ai/omadia). Claude speaks the **native Anthropic Messages API** (not an OpenAI-compatible endpoint), so this is a **declarative provider plugin**: the provider and its models are described in `manifest.yaml` and registered by the omadia kernel at load time — there is no runtime provider code to maintain.

> Requires omadia core with the LLM-provider-plugin seam (the manifest-driven
> `LlmProviderCatalog`). Older cores ignore the `llm_provider` manifest block.

## Models

| Model | Class | Context | Max output | Vision | Aliases |
|-------|-------|--------:|-----------:|:------:|---------|
| `claude-opus-4-8` | frontier | 200,000 | 32,000 | yes | `opus` |
| `claude-sonnet-4-6` | balanced | 200,000 | 64,000 | yes | `sonnet` |
| `claude-haiku-4-5-20251001` | fast | 200,000 | 8,192 | yes | `haiku` |

## Install

1. Build the plugin: `npm install && npm run build` (produces `dist/plugin.js`).
2. Package `manifest.yaml` + `dist/` and install it into omadia (admin → install plugin, or via the registry).
3. On the admin **Providers** page, set the Anthropic API key — it is stored in the vault under `provider:anthropic/api_key` (same mechanism as the built-in OpenAI provider).
4. Assign Anthropic (and a model) to a plugin such as the orchestrator on the Providers page.

## Configuration

| Setup field | Required | Default | Notes |
|-------------|:--------:|---------|-------|
| `anthropic_base_url` | no | `https://api.anthropic.com` | Override only for proxy/gateway setups. |

The API key is **not** a per-plugin setup secret — it is set centrally on the Providers page so the orchestrator (which reads the key from its own vault scope) can see it.

## Wire format

This provider declares `wire_format: anthropic`: omadia core talks to it via the **native Anthropic Messages API**, not the OpenAI Chat Completions schema. There are therefore **no OpenAI-style quirks** to declare (no `quirks` block) — core's Anthropic adapter handles request/response shaping, system-prompt placement, and tool-use semantics natively.

## Development

```bash
npm install
npm run typecheck   # tsc --noEmit (needs the omadia core contract built)
npm test            # validates the manifest + model invariants
npm run build
```
