<div align="center">

# @omadia/plugin-llm-anthropic

### Nutze Anthropics Claude-Modelle für jeden Agenten in deinem omadia-Team.

Ein signiertes omadia-Plugin, das Claude (Opus, Sonnet, Haiku) als Provider auf der Admin-Providers-Seite verfügbar macht. Deklarativ: kein Laufzeit-Code, der Modellkatalog steckt im Manifest.

[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](LICENSE)
[![Built for omadia](https://img.shields.io/badge/built%20for-omadia-2496ED.svg)](https://github.com/byte5ai/omadia)
[![TypeScript](https://img.shields.io/badge/built%20with-TypeScript-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[**Haupt-Repo**](https://github.com/byte5ai/omadia) · [**Website**](https://omadia.ai) · [**Plugin-Hub**](https://hub.omadia.ai) · [**Modelle**](#modelle) · [**Installation**](#installation)

> 🇬🇧 This guide is also available [in English](./README.md).

</div>

---

omadia ist ein selbst-hostbares agentisches OS: stelle Multi-Agent-Teams aus signierten Plugins zusammen, betreibe sie auf der eigenen Maschine und erhalte für jede Aktion eine nachvollziehbare Spur. Dieses Plugin macht Anthropic zu einem der LLM-Provider, auf denen diese Agenten laufen. Haupt-Repo: [byte5ai/omadia](https://github.com/byte5ai/omadia).

## Modelle

| Modell | Klasse |
| --- | --- |
| Claude Opus 4.8 | frontier |
| Claude Sonnet 4.6 | balanced |
| Claude Haiku 4.5 | fast |

Agenten fragen eine Klasse an (`fast`, `balanced`, `frontier`). omadia bildet die Klasse auf das Modell ab, ein Agent nennt also nie ein festes Modell.

## So funktioniert es in omadia

Ein deklaratives Provider-Plugin, es bringt also keinen Laufzeit-Code mit. Der omadia-Kernel liest beim Laden den `llm_provider`-Block aus `manifest.yaml` (id, Base-URL, Modelle), bevor ein Agent aktiviert wird, und registriert ihn im Provider-Katalog. Claude spricht die native Anthropic-Messages-API, also fährt omadia es über den eingebauten Anthropic-Adapter.

## Installation

1. Installiere über den [Plugin-Hub](https://hub.omadia.ai) in der omadia-Admin-UI (Store, Upload), oder lade das gebaute ZIP direkt hoch.
2. Trage auf der Admin-Providers-Seite deinen Anthropic-API-Key ein. omadia legt ihn verschlüsselt im Vault unter `provider:anthropic/api_key` ab.
3. Weise Anthropic und ein Modell einem Agenten zu: dem Orchestrator, einem Sub-Agenten oder dem Verifier.

## Konfiguration

| Setup-Feld | Pflicht | Default | Hinweis |
| --- | :---: | --- | --- |
| `anthropic_base_url` | nein | `https://api.anthropic.com` | Auf ein Anthropic-kompatibles Gateway zeigen, falls du darüber routest. |

Der Key wird zentral auf der Providers-Seite gesetzt, nicht pro Plugin, damit der Orchestrator ihn aus dem geteilten Vault-Scope liest.

## Aus dem Quellcode bauen

```bash
npm install
npm run build   # tsc, schreibt dist/
npm test        # prüft manifest.yaml gegen die Core-Invarianten
```

`@omadia/plugin-api` und `@omadia/llm-provider` stellt der omadia-Host zur Laufzeit bereit (optionale Peer-Deps). Verlinke sie aus einem lokalen omadia-Checkout zum Bauen. Aufbau siehe [byte5ai/omadia](https://github.com/byte5ai/omadia).

## Lizenz

[MIT](LICENSE), byte5 GmbH
