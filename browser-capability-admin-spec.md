
# Browser Capability Tester — Local Admin Spec (with i18n & Snippet Library)
*Generated: 2025-09-06T19:49:49Z*

## 1) Goals
- CRUD for **Browsers**, **Tests**, **Solutions**.
- WYSIWYG editor for Solutions (HTML/Markdown).
- Targeting: **generic**, **browser-specific**, **version-range**.
- **i18n**: translate UI and content with fallbacks.
- **Snippet Library**: reusable, parameterized steps you can embed in Solutions.
- Export a single **DB JSON** to ship with the client-only tester.

---

## 2) Core Entities

### 2.1 Browser
```
id: string (slug)
name: string (translatable)
vendor: string (optional, translatable)
engine: "Blink" | "WebKit" | "Gecko" | string
iconUrl: string (data URL or path)
downloadUrl: string
uaMatchRules: string[] (regex or simple tokens)
notes: string (optional, translatable)
```
**Translatable fields:** `name`, `vendor`, `notes`

### 2.2 Test
Represents a capability check (e.g., WebGPU, Gamepad).
```
id: string (slug)
title: string (translatable)
category: "graphics" | "input" | "network" | string (translatable)
description: string (short, translatable)
detectorKey: string (matches client code; e.g., 'webgpu', 'webgl2')
severity: "info" | "warn" | "fail"
links: {label: string (translatable), url: string}[]
```
**Translatable fields:** `title`, `category`, `description`, `links.label`

### 2.3 Solution
Help content shown for an issue/test.
```
id: string (slug)
title: string (translatable)
issueKey: string (detectorKey or issue id)
contentFormat: "html" | "md"
content: string (default locale content)
contentLocalized: { [bcp47Locale]: { contentFormat?: "html" | "md", content: string, lastUpdated?: ISODate } }
appliesTo: 
  scope: "generic" | "browser" | "browserVersion"
  browserId?: string
  versionRange?: string  // e.g., ">=17 <18"
priority: number
tags: string[]
lastUpdated: ISODate
```
**Translatable fields:** `title`, `content` (via `contentLocalized`).

### 2.4 Snippet
Reusable how‑to steps that can be embedded into Solutions.
```
id: string (slug)
title: string (translatable)
bodyFormat: "md" | "html"
body: string  // can include {{variables}} like {{flagName}}
bodyLocalized: { [bcp47Locale]: { bodyFormat?: "md" | "html", body: string } }
variables: { key: string, label: string (translatable), type: "string" | "enum" | "url", options?: string[] }[]
targets?: {
  os?: ("windows"|"macos"|"linux"|"android"|"ios")[]
  browsers?: string[]        // browser ids
  versionRange?: string
  tags?: string[]
}
lastUpdated: ISODate
```

---

## 3) DB Envelope
```
schemaVersion: number
generatedAt: ISODate
locales: {               // Admin UI & shared strings pack (not Solutions)
  default: "en-US",
  supported: ["en-US","pt-BR","es-ES","ja-JP"],
  messages: { [bcp47Locale]: { [key: string]: string } }
}
browsers: Browser[]
tests: Test[]
solutions: Solution[]
snippets: Snippet[]
meta: {
  notes?: string
  checksum?: string // sha256 over canonical JSON
  version?: string  // human-facing
}
```

**Notes**
- `locales.messages` is for **admin/client UI** labels (e.g., button texts, headings).  
- Solution/Test/Browser content uses **in-object** localization (`*Localized` fields).

---

## 4) i18n Model

### 4.1 Locale Basics
- Use **BCP‑47 tags** (e.g., `en-US`, `pt-BR`, `es-ES`).
- `locales.default` is the fallback. `locales.supported` drives language pickers.

### 4.2 Fallback & Resolution
1. Attempt **exact locale** (e.g., `pt-BR`).
2. Try **language-only** (e.g., `pt` if provided).
3. Fall back to **default** locale (`en-US`).

### 4.3 Translatable Fields
- Browsers: `name`, `vendor`, `notes`
- Tests: `title`, `category`, `description`, `links.label`
- Solutions: `title`, and **rich** `content` via `contentLocalized`
- Snippets: `title`, `body` via `bodyLocalized`, and `variables[].label`

### 4.4 Editorial Workflow
- Admin shows **per-locale completeness** (%, missing keys).
- Pseudo-locale option (`en-XA`) for length/RTL stress.
- **RTL support**: auto-set `dir="rtl"` for locales like `ar`, `he`.
- **Diff view**: compare default vs target locale text.
- **Untranslated marker**: render warning badge next to items with missing translations.

### 4.5 Link & Asset Localization
- Allow locale-specific URLs in content. Tip: keep links inside snippets to reduce duplication.

### 4.6 Versioning
- `lastUpdated` per content/locale; show “stale” if default locale changed after a translation’s timestamp.

---

## 5) Snippet Library

### 5.1 Purpose
Avoid rewriting common fixes (e.g., “Clear browser cache”, “Enable ANGLE in Chrome”). Snippets are inserted into Solutions with parameters.

### 5.2 Insertion Mechanisms
- **Reference with parameters** in Solution content (MD/HTML):
  - Markdown: `{{snippet:chrome-flag-enable angleBackend="D3D11"}}`
  - HTML: `<span data-snippet="chrome-flag-enable" data-angleBackend="D3D11"></span>`
- Admin provides an **Insert Snippet** button → select snippet → fill variable values.

### 5.3 Composition Strategy
- **Client-time composition (recommended)**: the tester replaces snippet references at render time. Pros: smaller DB, live snippet fixes. Cons: requires client logic.
- **Export-time inlining (toggle)**: Admin can inline snippets into the final content on export (freezes current text).

### 5.4 Variables & Validation
- Types: `string` | `enum` | `url`.  
- Validate on insert and on export; enum must be one of options.

### 5.5 Targeting
- Snippets can declare `targets` (OS, browsers, versionRange). The insert UI warns if a snippet’s targets don’t match the Solution’s appliesTo; still allow override.

### 5.6 Examples
**Snippet (md):**
```
id: "chrome-flags-open"
title: "Open Chrome Flags"
bodyFormat: "md"
body: "Type `chrome://flags` in the address bar and press Enter."
variables: []
targets: { browsers: ["chrome"] }
```
**Snippet (md with param):**
```
id: "chrome-flags-set-angle"
title: "Set ANGLE Backend"
bodyFormat: "md"
body: "In **Search flags**, type `ANGLE`. Set *Choose ANGLE graphics backend* to **{{backend}}**. Restart Chrome."
variables: [{{"key":"backend","label":"Backend","type":"enum","options":["D3D11","OpenGL","Vulkan"]}}]
targets: { browsers: ["chrome"], os: ["windows"] }
```

---

## 6) Targeting & Merge Rules (Client)
When displaying guidance for a failing `issueKey`:
1. Collect Solutions where `issueKey` matches.
2. Filter by `appliesTo.scope`:
   - `generic`: eligible.
   - `browser`: eligible if `browserId` matches detected browser.
   - `browserVersion`: eligible if `browserId` matches **and** browser version matches `versionRange`.
3. Sort by **specificity** (`browserVersion` > `browser` > `generic`), then by `priority` desc, then `lastUpdated` desc.
4. Compose content by resolving snippet references (client-time or inlined at export).

---

## 7) Admin UI

### 7.1 Navigation
- **Browsers**, **Tests**, **Solutions**, **Snippets**, **i18n**, **Settings**, **Validate & Export**.

### 7.2 Browsers
- Table + search; Add/Edit: icon upload, names (per locale), vendor, engine, download URL, UA rules, notes.

### 7.3 Tests
- Grid list; Add/Edit: title, category, description (per locale), `detectorKey`, severity, links.

### 7.4 Solutions
- Table view with filters (issueKey, scope, browser, tags, locale status).
- Editor: title (per locale), scope selector (shows conditional fields), WYSIWYG with **Insert Snippet**, tags, priority.
- Side panel: **Locale status** and missing translations indicators.

### 7.5 Snippets
- Library list with tags/targets filters.
- Editor: title (per locale), body (per locale), variables, targets preview.

### 7.6 i18n
- Locale management: default + supported list.
- Translation dashboard: completion %, stale flags, pseudo-locale preview.
- Bulk operations: export/import locale CSV/JSON; find & replace.

### 7.7 Validate & Export
- Validate ids, references, version ranges, missing required translations (warning only, not blocker).
- Option: **Inline snippets**.
- Option: **Embed icons as data URLs**.
- Option: **Write checksum**.
- Export: `capability-admin-db.json` (pretty/minified).

---

## 8) Validation Rules
- Unique `id` across entity types.
- Solutions’ `issueKey` must match a Test `detectorKey` or whitelisted issue.
- When `scope = browser|browserVersion`, require valid `browserId`.
- When `scope = browserVersion`, validate `versionRange`.
- Warn on orphaned items; broken links checker (optional).
- i18n: warn if default-locale content exists but target-locale content is missing for **UI strings**; solutions can be partially translated.

---

## 9) Example DB (trimmed)
```json
{
  "schemaVersion": 1,
  "generatedAt": "2025-09-06T15:10:00Z",
  "locales": {
    "default": "en-US",
    "supported": ["en-US","pt-BR"],
    "messages": {
      "en-US": {"ui.save":"Save","ui.export":"Export"},
      "pt-BR": {"ui.save":"Salvar","ui.export":"Exportar"}
    }
  },
  "browsers": [{"id":"chrome","name":"Google Chrome","engine":"Blink","downloadUrl":"https://google.com/chrome","uaMatchRules":["Chrome/"]}],
  "tests": [{"id":"webgpu","title":"WebGPU Support","category":"graphics","detectorKey":"webgpu","severity":"fail"}],
  "snippets": [{"id":"chrome-flags-open","title":"Open Chrome Flags","bodyFormat":"md","body":"Type `chrome://flags` in the address bar and press Enter."}],
  "solutions": [{"id":"webgpu-chrome-angle","title":"Enable ANGLE in Chrome","issueKey":"webgpu","contentFormat":"md","content":"{{snippet:chrome-flags-open}}\nSearch for ANGLE and set backend to **D3D11**.","appliesTo":{"scope":"browser","browserId":"chrome"},"priority":8}]
}
```

---

## 10) JSON Schema (abridged)
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["schemaVersion","browsers","tests","solutions"],
  "properties": {
    "schemaVersion": {"type":"integer","minimum":1},
    "locales": {
      "type":"object",
      "required": ["default","supported","messages"],
      "properties": {
        "default": {"type":"string"},
        "supported": {"type":"array","items":{"type":"string"}},
        "messages": {"type":"object"}
      }
    },
    "snippets": {
      "type":"array",
      "items": {
        "type":"object",
        "required": ["id","title","bodyFormat","body"],
        "properties": {
          "id": {"type":"string"},
          "title": {"type":"string"},
          "bodyFormat": {"enum":["md","html"]},
          "body": {"type":"string"},
          "bodyLocalized": {"type":"object"},
          "variables": {"type":"array","items":{"type":"object","properties":{"key":{"type":"string"},"label":{"type":"string"},"type":{"enum":["string","enum","url"]},"options":{"type":"array","items":{"type":"string"}}}}},
          "targets": {"type":"object"}
        }
      }
    },
    "solutions": {
      "type":"array",
      "items": {
        "type":"object",
        "required":["id","title","issueKey","content","contentFormat","appliesTo"],
        "properties": {
          "contentLocalized": {"type":"object"},
          "appliesTo": {
            "type":"object",
            "required":["scope"],
            "properties": {
              "scope": {"enum":["generic","browser","browserVersion"]},
              "browserId": {"type":"string"},
              "versionRange": {"type":"string"}
            }
          }
        }
      }
    }
  }
}
```

---

## 11) Client Composition Pseudocode
```ts
function renderSolutionContent(solution, locale, detected, db) {
  const text = pickLocaleText(solution, locale); // contentLocalized -> default
  let html = toHTML(text, solution.contentFormat);
  if (hasSnippetRefs(html)) {
    html = composeSnippets(html, locale, db.snippets);
  }
  return html;
}
```

---

## 12) Implementation Notes
- Use **TipTap or Quill** for WYSIWYG; store as `md` or `html`.
- Use **semver**-like range parser; for non-semver (Safari), parse major.minor.
- File I/O: **File System Access API**; autosave to IndexedDB.
- Keep the client lightweight; a single **DB JSON** powers everything.
