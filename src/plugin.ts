/**
 * @omadia/plugin-llm-anthropic — entry point.
 *
 * Anthropic (Claude) speaks the native Anthropic Messages API, so it needs NO
 * runtime provider code: the kernel reads the `llm_provider` block from this
 * plugin's `manifest.yaml` at manifest-load time and registers Anthropic (id,
 * baseURL, models) into the kernel-owned `LlmProviderCatalog` BEFORE any plugin
 * activates. That ordering is what lets the orchestrator resolve an Anthropic
 * provider at its own activation regardless of plugin load order.
 *
 * `activate()` therefore only performs an optional sanity log — the provider is
 * already live by the time we get here. The operator supplies the API key via
 * the admin Providers page (vault key `provider:anthropic/api_key`).
 */
import type { PluginContext } from '@omadia/plugin-api';

export interface AnthropicPluginHandle {
  close(): Promise<void>;
}

export async function activate(
  ctx: PluginContext,
): Promise<AnthropicPluginHandle> {
  ctx.log(
    '[plugin-llm-anthropic] active — Anthropic provider declared in manifest; ' +
      'set the API key on the admin Providers page (provider:anthropic/api_key).',
  );
  return {
    async close(): Promise<void> {
      ctx.log('[plugin-llm-anthropic] deactivating');
    },
  };
}
