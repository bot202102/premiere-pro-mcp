#!/usr/bin/env node
// SEC guard: pre-release seal check. Run BEFORE any pack/install of the fork.
// Fails loudly if the supply-chain seal is not in force. This exists because a
// stale runbook once sent a release through npm (2026-10-02) — the seal must
// be machine-checkable, not memory-checkable.
// Uso: node sec-tools/check-seal.mjs
import { existsSync, readFileSync, statSync } from "node:fs";

let failures = 0;
const ok = (cond, label) => { console.log((cond ? "  ✓ " : "  ✗ FALLO: ") + label); if (!cond) failures++; };

console.log("[check-seal] sello de supply chain del fork");

// 1. La carril pnpm es la única documentada; npm no aparece en el runbook de release.
//    El runbook vive en ESTADO-MAESTRO.md (OneDrive, fuera del repo): ruta del ambiente.
const MASTER = "C:/Users/rpach/OneDrive/Desktop/Organizado/Proyectos IA/mcp premiere/ESTADO-MAESTRO.md";
const master = existsSync(MASTER) ? readFileSync(MASTER, "utf8") : "";
const runbook = master.slice(master.indexOf("Cómo se actualiza desde upstream"));
ok(master !== "", "ESTADO-MAESTRO.md encontrado (ruta OneDrive)");
// npm SOLO como canal de ubicación global (install -g) + pineo (--no-save); jamás ci/pack/bare-install.
ok(runbook === "" || !/(?<![a-z])npm (ci|pack)\b|(?<![a-z])npm install(?! -g| --no-save)/.test(runbook), "runbook: npm solo install -g/--no-save; validación y pack = corepack pnpm");
ok(runbook === "" || /corepack pnpm (import|install)/.test(runbook), "runbook de sync usa corepack pnpm");

// 2. pnpm-workspace.yaml: la puerta de edad está activa y las exclusiones están fechadas.
const ws = readFileSync("pnpm-workspace.yaml", "utf8");
ok(/minimumReleaseAge:\s*10080/.test(ws), "minimumReleaseAge = 7 días activo");
ok(/onlyBuiltDependencies:\s*\[\]/.test(ws), "onlyBuiltDependencies vacío (ningún script de ciclo de vida)");
ok(/strictDepBuilds:\s*true/.test(ws), "strictDepBuilds tripwire activo");
const excl = ws.match(/minimumReleaseAgeExclude:\n([\s\S]*?)(?=\n[a-zA-Z@#]|\n*$)/)?.[1] ?? "";
const exclEntries = (excl.match(/^\s*-\s+/gm) ?? []).length;
if (exclEntries > 0) {
  const hasDatedJustification = /EXCEPCIÓN DOCUMENTADA \(\d{4}-\d{2}-\d{2}/.test(ws) && /Revisar:/.test(ws);
  ok(hasDatedJustification, `minimumReleaseAgeExclude (${exclEntries} entradas) con justificación fechada y revisión`);
} else {
  console.log("  ✓ minimumReleaseAgeExclude vacío (sin excepciones activas)");
}

// 3. El lockfile de pnpm existe y es más nuevo que package.json (fue regenerado tras el último cambio de deps).
const lockOk = existsSync("pnpm-lock.yaml");
ok(lockOk, "pnpm-lock.yaml existe");
if (lockOk && existsSync("package.json")) {
  ok(statSync("pnpm-lock.yaml").mtimeMs >= statSync("package.json").mtimeMs,
    "pnpm-lock.yaml regenerado después del último cambio de package.json");
}

// 4. El tarball no puede llevar el .debug del conector CEP.
const npmignore = existsSync(".npmignore") ? readFileSync(".npmignore", "utf8") : "";
ok(/\.debug/.test(npmignore) || !existsSync(".npmignore"), ".npmignore excluye .debug del conector");

// 5. SHA256SUMS.txt: existe y sus filenames apuntan a artefactos presentes (si hay).
if (existsSync("SHA256SUMS.txt")) {
  const sums = readFileSync("SHA256SUMS.txt", "utf8");
  const files = [...sums.matchAll(/^\w{64} \*(.+)$/gm)].map((m) => m[1].trim());
  ok(files.length >= 2, `SHA256SUMS.txt con ${files.length} artefactos pineados`);
  for (const f of files) ok(existsSync(f), `artefacto presente: ${f}`);
} else {
  console.log("  (SHA256SUMS.txt aún no existe — se crea en el pack)");
}

console.log(failures === 0 ? "[check-seal] SELLO OK" : `[check-seal] ${failures} FALLO(S) — NO empaquetar ni instalar hasta corregir`);
process.exit(failures === 0 ? 0 : 1);
