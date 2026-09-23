/**
 * Validates manifest.yaml's `llm_provider` block against the same invariants
 * the omadia core model registry enforces, so the plugin can't ship a manifest
 * that core would reject at load.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { parse } from 'yaml';

const manifestPath = fileURLToPath(new URL('../manifest.yaml', import.meta.url));
const manifest = parse(readFileSync(manifestPath, 'utf8')) as Record<
  string,
  unknown
>;

interface ModelEntry {
  id: string;
  model_id: string;
  label: string;
  class: 'fast' | 'balanced' | 'frontier';
  max_tokens: number;
  context_window: number;
  vision: boolean;
  class_default?: boolean;
  effort_levels?: string[];
  effort_default?: string;
}

interface LlmProviderBlock {
  id: string;
  label: string;
  wire_format: string;
  default_base_url: string;
  base_url_config_key?: string;
  quirks?: Record<string, unknown>;
  models: ModelEntry[];
  discovery: DiscoveryBlock;
}

function block(): LlmProviderBlock {
  return manifest['llm_provider'] as LlmProviderBlock;
}

test('manifest declares the anthropic llm_provider block', () => {
  const p = block();
  assert.equal(p.id, 'anthropic');
  assert.equal(p.wire_format, 'anthropic');
  assert.match(p.default_base_url, /^https:\/\//);
  assert.ok(Array.isArray(p.models) && p.models.length > 0);
});

test('every model id equals "<provider>:<model_id>"', () => {
  const p = block();
  for (const m of p.models) {
    assert.equal(
      m.id,
      `${p.id}:${m.model_id}`,
      `model id '${m.id}' must equal '${p.id}:${m.model_id}'`,
    );
  }
});

test('model classes are valid and ids/model_ids are not class refs', () => {
  const p = block();
  const valid = new Set(['fast', 'balanced', 'frontier']);
  for (const m of p.models) {
    assert.ok(valid.has(m.class), `invalid class '${m.class}' for ${m.id}`);
    assert.ok(!m.id.startsWith('class:'), `id may not start with class: (${m.id})`);
    assert.ok(typeof m.max_tokens === 'number' && m.max_tokens > 0);
    assert.ok(typeof m.context_window === 'number' && m.context_window > 0);
    assert.ok(m.max_tokens <= m.context_window, `${m.id}: max_tokens > context_window`);
  }
});

test('each class has exactly one default when it has >1 model', () => {
  const p = block();
  const counts = new Map<string, { total: number; defaults: number }>();
  for (const m of p.models) {
    const c = counts.get(m.class) ?? { total: 0, defaults: 0 };
    c.total += 1;
    if (m.class_default === true) c.defaults += 1;
    counts.set(m.class, c);
  }
  for (const [cls, c] of counts) {
    if (c.total > 1) {
      assert.equal(c.defaults, 1, `class '${cls}' needs exactly one class_default`);
    }
  }
});

test('model ids are unique', () => {
  const p = block();
  const ids = p.models.map((m) => m.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate model id');
});

interface DiscoveryRule {
  match: string;
  class: string;
  rest_class?: string;
  aliases?: string[];
  max_tokens?: number;
  context_window?: number;
  vision?: boolean;
  effort_levels?: string[];
  effort_default?: string;
  label?: string;
}

interface DiscoveryBlock {
  include?: string[];
  exclude?: string[];
  classify: DiscoveryRule[];
}

const VALID_CLASSES = new Set(['fast', 'balanced', 'frontier']);

function discovery(): DiscoveryBlock {
  const d = block().discovery;
  assert.ok(d && typeof d === 'object', 'llm_provider.discovery must be an object');
  assert.ok(
    Array.isArray(d.classify) && d.classify.length > 0,
    'discovery.classify must be a non-empty array',
  );
  return d;
}

test('discovery.classify is a non-empty list of compilable rules', () => {
  for (const r of discovery().classify) {
    assert.ok(
      typeof r.match === 'string' && r.match.length > 0,
      'classify.match must be a non-empty regex source string',
    );
    assert.doesNotThrow(
      () => new RegExp(r.match, 'i'),
      `classify.match does not compile: ${r.match}`,
    );
  }
});

test('discovery include/exclude patterns compile', () => {
  const d = discovery();
  for (const key of ['include', 'exclude'] as const) {
    const patterns = d[key];
    if (patterns === undefined) continue;
    assert.ok(
      Array.isArray(patterns) && patterns.length > 0,
      `discovery.${key} must be a non-empty array when present`,
    );
    for (const p of patterns) {
      assert.ok(
        typeof p === 'string' && p.length > 0,
        `discovery.${key} must contain non-empty regex source strings`,
      );
      assert.doesNotThrow(
        () => new RegExp(p, 'i'),
        `discovery.${key} does not compile: ${p}`,
      );
    }
  }
});

test('discovery classes and rest_classes are valid model classes', () => {
  for (const r of discovery().classify) {
    assert.ok(VALID_CLASSES.has(r.class), `invalid class '${r.class}' for match '${r.match}'`);
    if (r.rest_class !== undefined) {
      assert.ok(
        VALID_CLASSES.has(r.rest_class),
        `invalid rest_class '${r.rest_class}' for match '${r.match}'`,
      );
    }
  }
});

// New model generations must be discovered without a manifest edit. Strip the
// generic \d escape before checking for digits that would pin a rule to a version.
test('no classify rule hardcodes a model version', () => {
  for (const r of discovery().classify) {
    const withoutDigitEscape = r.match.replaceAll('\\d', '');
    assert.ok(
      !/\d/.test(withoutDigitEscape),
      `classify.match '${r.match}' hardcodes a version number`,
    );
  }
});

test('effort defaults belong to effort levels and max is never an effort level', () => {
  const models = block().models;
  assert.ok(Array.isArray(models) && models.length > 0, 'seed models must be a non-empty array');
  const targets: Array<{ where: string; levels?: string[]; fallback?: string }> = [
    ...models.map((m) => ({
      where: m.id,
      levels: m.effort_levels,
      fallback: m.effort_default,
    })),
    ...discovery().classify.map((r) => ({
      where: `classify ${r.match}`,
      levels: r.effort_levels,
      fallback: r.effort_default,
    })),
  ];
  for (const t of targets) {
    if (t.levels !== undefined) {
      assert.ok(Array.isArray(t.levels), `${t.where}: effort_levels must be an array`);
      assert.ok(!t.levels.includes('max'), `${t.where}: 'max' is not a valid effort level`);
    }
    if (t.fallback === undefined) continue;
    assert.ok(
      Array.isArray(t.levels) && t.levels.length > 0,
      `${t.where}: effort_default declared without effort_levels`,
    );
    assert.ok(
      t.levels.includes(t.fallback),
      `${t.where}: effort_default '${t.fallback}' is not in effort_levels`,
    );
  }
});

// omadia #1157 — Fable is discoverable, Mythos stays excluded (access-program
// only), and the Fable rule sorts after Opus: rule order is the class-default
// preference, so `Auto`/`opus` must keep resolving to Opus, not the pricier Fable.
function isDiscovered(modelId: string): boolean {
  const d = discovery();
  const included = (d.include ?? []).some((p) => new RegExp(p, 'i').test(modelId));
  const excluded = (d.exclude ?? []).some((p) => new RegExp(p, 'i').test(modelId));
  return included && !excluded;
}

test('fable is discovered, mythos and retired families are excluded', () => {
  assert.equal(isDiscovered('claude-fable-5-1'), true, 'claude-fable-* must be discoverable');
  assert.equal(isDiscovered('claude-opus-5-5'), true);
  assert.equal(isDiscovered('claude-mythos-5-1'), false, 'claude-mythos-* must stay excluded');
  assert.equal(isDiscovered('claude-3-5-sonnet-20241022'), false);
  assert.equal(isDiscovered('claude-instant-1.2'), false);
});

test('fable classifies as frontier but ranks after opus', () => {
  const rules = discovery().classify;
  const opus = rules.findIndex((r) => new RegExp(r.match, 'i').test('claude-opus-5-5'));
  const fable = rules.findIndex((r) => new RegExp(r.match, 'i').test('claude-fable-5-1'));
  assert.ok(opus >= 0 && fable >= 0, 'both opus and fable need a classify rule');
  assert.equal(rules[fable]?.class, 'frontier');
  assert.deepEqual(rules[fable]?.aliases, ['fable']);
  assert.ok(opus < fable, 'the fable rule must come after the opus rule');
});
