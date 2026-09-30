#!/usr/bin/env node
// SEC FORK: supply-chain audit of the audited dependency graph, grouped by family.
// Reads package-lock.json (the canonical audited graph), queries the npm registry
// for publish times, deprecation flags, licenses and latest versions, scans the
// installed node_modules for lifecycle scripts, and classifies each package into
// a layer (runtime vs dev) and family.
//
// Usage: node scripts/sec-audit-families.mjs [--md <outfile>]
// Re-run after every upstream merge and diff the output before trusting the graph.

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const lock = JSON.parse(readFileSync(new URL("../package-lock.json", import.meta.url), "utf8"));
const pkgs = lock.packages;

// --- 1. Entries (deduplicated by name@version) ----------------------------------
const seen = new Set();
const entries = [];
for (const [key, meta] of Object.entries(pkgs)) {
  const m = key.match(/node_modules\/(@[^/]+\/[^/]+|[^@/][^/]*)$/);
  if (!m || !meta.version) continue;
  const id = `${m[1]}@${meta.version}`;
  if (seen.has(id)) continue;
  seen.add(id);
  entries.push({ name: m[1], version: meta.version, key });
}

// --- 2. Runtime closure (dependencies AND peerDependencies) ---------------------
const nameIndex = new Map();
for (const e of entries) if (!nameIndex.has(e.name)) nameIndex.set(e.name, e.key);
const runtimeKeys = new Set(Object.keys(lock.packages[""]?.dependencies ?? {}).map(d => nameIndex.get(d)).filter(Boolean));
let grew = true;
while (grew) {
  grew = false;
  for (const key of [...runtimeKeys]) {
    const meta = pkgs[key];
    if (!meta) continue;
    for (const dep of Object.keys({ ...meta.dependencies, ...meta.peerDependencies })) {
      const depKey = nameIndex.get(dep);
      if (depKey && !runtimeKeys.has(depKey)) { runtimeKeys.add(depKey); grew = true; }
    }
  }
}

// --- 3. Families ----------------------------------------------------------------
const FAMILIES = [
  ["MCP core", /^@modelcontextprotocol\//],
  ["Telemetría", /posthog/],
  ["Puente HTTP/UXP", /^@?hono|^ws$|^jose$/],
  ["Validación", /^zod$|^@standard-schema\//],
  ["Adobe", /^@adobe\//],
  ["Tests", /^vitest|^@vitest\/|^vite$|^rolldown|^@rolldown\/|^@oxc-project\/|^tinypool$|^vite-node$|^std-env$|^tinyexec$|^tinyglobby$|^fdir$|^magic-string$|^why-is-node-running$|^pathe$|^ufo$|^exsolve$|^sourcemap-codec$|^hookable$|^perfect-debounce$/],
  ["Lint", /^eslint|^@eslint|^acorn|^@humanwhocodes\/|^@typescript-eslint\/|^ts-api-utils$|^espree$|^esquery$|^esrecurse$|^estraverse$|^esutils$|^natural-compare|^optionator$|^levn$|^prelude-ls$|^type-check$|^deep-is$|^fast-levenshtein$|^word-wrap$|^minimatch$|^brace-expansion$|^balanced-match$|^cross-spawn$|^path-key$|^shebang|^which$|^onetime$|^mimic-fn$|^isexe$|^lru-cache$|^foreground-child$|^signal-exit$|^jackspeak$|^package-json-from-dist$|^minipass$|^path-scurry$|^got$|^@sec-ant\/|^debug$|^ms$|^supports-color$|^chalk$|^has-flag$|^ansi-styles$|^wrap-ansi$|^ansi-regex$|^emoji-regex$|^strip-ansi$|^string-width$|^get-east-asian-width$|^ansi-styles$|^color-convert$|^color-name$|^is-fullwidth-code-point$|^find-up$|^locate-path$|^p-locate$|^p-limit$|^p-try$|^yocto-queue$|^yaml$/],
  ["Tipos TS", /^@types\//],
  ["Compilación TS", /^typescript$|^@babel\/|^@jridgewell\//],
];
function familyOf(name) {
  for (const [fam, re] of FAMILIES) if (re.test(name)) return fam;
  return "Otras (transitivas)";
}

// --- 4. Registry metadata (unique names, full documents) ------------------------
const names = [...new Set(entries.map(e => e.name))];
const meta = new Map(); // name -> { time, latest, versions: {v: {deprecated, license}} }
async function fetchMeta(name, attempt = 0) {
  if (meta.has(name)) return;
  try {
    const res = await fetch(`https://registry.npmjs.org/${name}`, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const doc = await res.json();
    const versions = {};
    for (const [v, vm] of Object.entries(doc.versions ?? {})) {
      versions[v] = { deprecated: Boolean(vm.deprecated), license: vm.license ?? "?" };
    }
    meta.set(name, { time: doc.time ?? {}, latest: doc["dist-tags"]?.latest ?? null, versions, maintainers: (doc.maintainers ?? []).length });
  } catch (err) {
    if (attempt < 2) { await new Promise(r => setTimeout(r, 800 * (attempt + 1))); return fetchMeta(name, attempt + 1); }
    meta.set(name, { error: String(err) });
  }
}
let cursor = 0;
async function worker() { while (cursor < names.length) await fetchMeta(names[cursor++]); }
await Promise.all(Array.from({ length: 8 }, worker));

// --- 5. Lifecycle scripts present on disk (npm-installed tree) ------------------
const scriptOwners = new Set();
function scanDir(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith("@")) { scanDir(join(dir, entry.name)); continue; }
    const pkgFile = join(dir, entry.name, "package.json");
    if (existsSync(pkgFile)) {
      try {
        const p = JSON.parse(readFileSync(pkgFile, "utf8"));
        const s = p.scripts ?? {};
        if (["preinstall", "install", "postinstall"].some(k => s[k])) scriptOwners.add(`${p.name}@${p.version}`);
      } catch { /* malformed third-party package.json is not our concern here */ }
    }
    scanDir(join(dir, entry.name, "node_modules"));
  }
}
scanDir("node_modules");

// --- 6. Per-package rows --------------------------------------------------------
const now = Date.now();
const DAY = 86_400_000;
const rows = entries.map(e => {
  const doc = meta.get(e.name) ?? {};
  const time = doc.time?.[e.version];
  return {
    name: e.name,
    version: e.version,
    layer: runtimeKeys.has(e.key) ? "runtime" : "dev",
    family: familyOf(e.name),
    ageDays: time ? Math.floor((now - Date.parse(time)) / DAY) : null,
    published: time ? time.slice(0, 10) : null,
    deprecated: doc.versions?.[e.version]?.deprecated ?? false,
    license: doc.versions?.[e.version]?.license ?? "?",
    latest: doc.latest ?? null,
    behindLatest: doc.latest != null && doc.latest !== e.version,
    maintainers: doc.maintainers ?? 0,
    hasScripts: scriptOwners.has(`${e.name}@${e.version}`),
    error: doc.error ?? null,
  };
});
rows.sort((a, b) => (a.family + a.name).localeCompare(b.family + b.name));

// --- 7. Report -------------------------------------------------------------------
const lines = [];
lines.push(`# Auditoría de dependencias por familias — ${new Date().toISOString().slice(0, 10)}`);
lines.push("");
const uniq = rows.length;
const runtimeCount = rows.filter(r => r.layer === "runtime").length;
lines.push(`Grafo auditado: **${uniq} paquetes únicos** (${runtimeCount} runtime / ${uniq - runtimeCount} dev). Paquetes con scripts de instalación en disco: ${scriptOwners.size ? [...scriptOwners].map(s => `\`${s}\``).join(", ") : "ninguno"}.`);
lines.push("");
const deprecated = rows.filter(r => r.deprecated);
lines.push(`## Resumen global`);
lines.push("");
lines.push(`- Deprecadas: ${deprecated.length === 0 ? "ninguna" : deprecated.map(r => `\`${r.name}@${r.version}\` — ${String(r.deprecated).slice(0, 90)}`).join("; ")}`);
lines.push(`- Errores de consulta: ${rows.filter(r => r.error).length === 0 ? "ninguno" : rows.filter(r => r.error).map(r => `\`${r.name}\``).join(", ")}`);
lines.push(`- Con scripts de ciclo de vida: ${rows.filter(r => r.hasScripts).length === 0 ? "ninguno" : rows.filter(r => r.hasScripts).map(r => `\`${r.name}@${r.version}\``).join(", ")}`);
lines.push("");
const youngest = rows.filter(r => r.ageDays !== null).sort((a, b) => a.ageDays - b.ageDays).slice(0, 8);
lines.push("### Las 8 versiones más jóvenes del grafo (definen el `minimumReleaseAge` viable)");
lines.push("");
lines.push("| Paquete | Versión | Capa | Publicada | Edad (días) |");
lines.push("|---|---|---|---|---|");
for (const r of youngest) lines.push(`| ${r.name} | ${r.version} | ${r.layer} | ${r.published} | ${r.ageDays} |`);
lines.push("");

for (const fam of [...new Set(rows.map(r => r.family))].sort()) {
  const rs = rows.filter(r => r.family === fam);
  const ages = rs.map(r => r.ageDays).filter(a => a !== null);
  const behind = rs.filter(r => r.behindLatest);
  lines.push(`## Familia: ${fam} (${rs.length})`);
  lines.push("");
  lines.push(`Detrás de latest: ${behind.length === 0 ? "ninguno" : behind.length}. Edad mín/máx: ${ages.length ? Math.min(...ages) : "?"}/${ages.length ? Math.max(...ages) : "?"} días.`);
  lines.push("");
  lines.push("| Paquete | Fijada | Capa | Publicada | Edad (d) | Deprecated | Scripts | Licencia | Latest | Maint. |");
  lines.push("|---|---|---|---|---|---|---|---|---|---|");
  for (const r of rs) {
    lines.push(`| ${r.name} | ${r.version} | ${r.layer === "runtime" ? "**runtime**" : "dev"} | ${r.published ?? "?"} | ${r.ageDays ?? "?"} | ${r.deprecated ? "⚠️" : "no"} | ${r.hasScripts ? "⚠️ sí" : "no"} | ${String(r.license).slice(0, 20)} | ${r.behindLatest ? r.latest : "—"} | ${r.maintainers} |`);
  }
  lines.push("");
}

const md = lines.join("\n");
if (process.argv.includes("--md")) {
  const out = process.argv[process.argv.indexOf("--md") + 1];
  writeFileSync(out, md);
  console.log(`Informe escrito en ${out} (${rows.length} paquetes, runtime=${runtimeCount}, scripts=${[...scriptOwners].join(",") || "ninguno"})`);
} else {
  console.log(md);
}
