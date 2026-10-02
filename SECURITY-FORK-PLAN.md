# Plan de endurecimiento del fork — premiere-pro-mcp

Base auditada: `leancoderkavy/premiere-pro-mcp` v1.18.6, commit `a7ac506` (2026-09-30).
Auditoría previa: sin indicadores de compromiso. Este plan endurece los riesgos de
**diseño y confianza** detectados (PlayerDebugMode global, auto-update a `@latest`,
un solo maintainer en npm, `.debug` con puerto 8088, radio de daño del LLM).

## 1. Principios

1. **Interruptores, no borrados**: ningún flujo original se elimina. Cada
   comportamiento de riesgo queda dentro de un `if` controlado por una variable
   `PREMIERE_MCP_SEC_*` (o flag de build). Poner la variable en modo permisivo
   reproduce el comportamiento upstream exacto, para comparar mientras probamos.
2. **Default endurecido**: sin ninguna variable definida, el fork se comporta en
   modo seguro. Activar la parte riesgosa es siempre una decisión explícita.
3. **Re-auditoría en cada merge upstream**: antes de absorber commits nuevos:
   `git fetch upstream && git diff upstream-1.18.6..upstream/main -- package.json package-lock.json scripts/ cep-plugin/ installer/`
   — prohibido absorber cambios que añadan dependencias, scripts de ciclo de vida
   o ejecución de procesos sin re-auditoría. Instalar siempre con `npm ci`
   (lockfile comprometido), nunca `npm install` libre.
4. **No publicar en npm**: el fork se distribuye como tarball local firmado por
   SHA-256. Así eliminamos la confianza en la cuenta `kavykun` del upstream.

## 2. Variables de control (tabla maestra)

| # | Variable | Default (seguro) | Modo permisivo | Archivo(s) | Riesgo que mitiga |
|---|----------|------------------|----------------|------------|-------------------|
| 1 | `PREMIERE_MCP_SEC_PLAYERDEBUGMODE` | `0` → no escribe | `1` → escribe `PlayerDebugMode="1"` en `CSXS.9–14` | `scripts/install-cep.ps1`, `installer/windows/Program.cs` | Debilitamiento CEP global de la máquina |
| 2 | `PREMIERE_MCP_SEC_REVOKE_DEBUG_MODE` | `1` → desinstalar borra las claves `CSXS.9–14` que creó el fork | `0` → deja el registro intacto | `scripts/uninstall-cep.ps1` | Claves PlayerDebugMode huérfanas tras desinstalar |
| 3 | `PREMIERE_MCP_SEC_SHIP_DEBUG_FILE` | `0` → no copia/extrae `.debug` y borra el existente en destino | `1` → lo instala (solo para depurar el panel) | `scripts/install-cep.ps1` | Puerto DevTools 8088 del panel CEF |
| 4 | `PREMIERE_MCP_SEC_ALLOW_LATEST` | `0` → bloquea `npm install --global premiere-pro-mcp@latest` | `1` → comportamiento upstream | `src/index.ts` (`--update`), `cep-plugin/updater.cjs` + `main.js` | Instalación de `@latest` sin pin (compromiso del maintainer npm) |
| 5 | `PREMIERE_MCP_SEC_CHECK_UPDATE_NET` | `0` → sin llamadas de red de chequeo de versión | `1` → chequeo permitido | `src/index.ts` (`--check-update`), `cep-plugin/updater.cjs` (`checkForUpdates`) | Tráfico de red innecesario del servidor/panel |
| 6 | `PREMIERE_MCP_SEC_TELEMETRY` | `deny` → telemetría desactivada aunque exista `POSTHOG_API_KEY` | `allow` → se respeta la key | `src/telemetry.ts` | Envío de eventos a terceros |
| 7 | `PREMIERE_MCP_SEC_ALLOW_HTTP` | `0` → `http-server` aborta el arranque | `1` → arranque HTTP permitido | `src/http-server.ts` | Exposición de servidor HTTP por accidente |
| 8 | `PREMIERE_MCP_SEC_DEFAULT_PROFILE` | `1` → si no hay `PREMIERE_MCP_CAPABILITIES` explícita, fuerza `inspect,edit` y packs `essential,captions,delivery` | `0` → comportamiento upstream (perfil completo) | `src/index.ts` (`main()`) | Radio de daño del LLM (386 tools → subconjunto) |

Cambio estático (sin flag posible): añadir a `.npmignore` la línea `cep-plugin/.debug`
para que el tarball npm no lo lleve nunca; el flag 3 cubre el caso del instalador CEP.

## 3. Parches concretos (el original queda intacto dentro del `if`)

### 3.1 `scripts/install-cep.ps1` (flags 1 y 3)

```powershell
# --- SEC FORK: interruptores (defaults endurecidos) ---
$secPlayerDebugMode = (@("1","true","yes","on") -contains
  ([string]$env:PREMIERE_MCP_SEC_PLAYERDEBUGMODE).ToLower())
$secShipDebugFile   = (@("1","true","yes","on") -contains
  ([string]$env:PREMIERE_MCP_SEC_SHIP_DEBUG_FILE).ToLower())

# tras la extracción/copiado del conector, ANTES del bloque de registro:
if (-not $secShipDebugFile) {
  $debugFile = Join-Path $pluginDestination ".debug"
  if (Test-Path -LiteralPath $debugFile) { Remove-Item -LiteralPath $debugFile -Force }
}

foreach ($version in 9..14) {
  $key = "HKCU:\SOFTWARE\Adobe\CSXS.$version"
  if ($secPlayerDebugMode) {
    # --- original upstream, sin cambios ---
    New-Item -Path $key -Force | Out-Null
    New-ItemProperty -Path $key -Name "PlayerDebugMode" -PropertyType String -Value "1" -Force | Out-Null
  } else {
    Write-Warning "SEC FORK: PlayerDebugMode no se escribe (PREMIERE_MCP_SEC_PLAYERDEBUGMODE=$env:PREMIERE_MCP_SEC_PLAYERDEBUGMODE). Un conector sin firmar puede no cargar."
  }
}
```

### 3.2 `installer/windows/Program.cs` (flag 1, ruta del instalador C#)

```csharp
var secPlayerDebugMode = Environment.GetEnvironmentVariable("PREMIERE_MCP_SEC_PLAYERDEBUGMODE")
    is string v && (v == "1" || v.Equals("true", StringComparison.OrdinalIgnoreCase));
for (int version = 9; version <= 14; version++)
{
    if (!secPlayerDebugMode) { /* SEC FORK: omitido por flag */ continue; }
    using RegistryKey key = Registry.CurrentUser.CreateSubKey($@"SOFTWARE\Adobe\CSXS.{version}", true);
    key.SetValue("PlayerDebugMode", "1", RegistryValueKind.String); // original
}
```

### 3.3 `scripts/uninstall-cep.ps1` (flag 2)

```powershell
$secRevoke = (@("0","false","off") -notcontains ([string]$env:PREMIERE_MCP_SEC_REVOKE_DEBUG_MODE).ToLower())
if ($secRevoke) {
  foreach ($version in 9..14) {
    $key = "HKCU:\SOFTWARE\Adobe\CSXS.$version"
    if (Test-Path $key) { Remove-ItemProperty -Path $key -Name "PlayerDebugMode" -ErrorAction SilentlyContinue }
  }
  Write-Host "SEC FORK: PlayerDebugMode revocado en CSXS.9-14."
}
```

> Nota: revocar `PlayerDebugMode` impide que cargue CUALQUIER extensión sin firmar,
> incluida la propia MCP Bridge. Revocar solo al desinstalar, o aceptar que el
> conector deje de cargar mientras esté revocado.

### 3.4 `src/index.ts` (flags 4, 5 y 8)

```ts
const secAllowLatest = ["1","true","yes","on"].includes((process.env.PREMIERE_MCP_SEC_ALLOW_LATEST ?? "").toLowerCase());
const secCheckUpdateNet = ["1","true","yes","on"].includes((process.env.PREMIERE_MCP_SEC_CHECK_UPDATE_NET ?? "").toLowerCase());

// en runPackageUpdate(): tras calcular update.updateAvailable y antes de instalar
if (!secAllowLatest) {
  console.error("SEC FORK: actualización a @latest bloqueada (PREMIERE_MCP_SEC_ALLOW_LATEST=0). Actualiza desde un tarball verificado del fork.");
  process.exit(1);
}
// el execFileSync original queda íntegro tras el guard

// en el branch --check-update:
if (!secCheckUpdateNet) { console.log("SEC FORK: chequeo de red desactivado (PREMIERE_MCP_SEC_CHECK_UPDATE_NET=0)."); process.exit(0); }

// en main(), antes de crear el bridge/server:
if (!process.env.PREMIERE_MCP_CAPABILITIES
    && (process.env.PREMIERE_MCP_SEC_DEFAULT_PROFILE ?? "1") !== "0") {
  process.env.PREMIERE_MCP_CAPABILITIES = "inspect,edit";
  process.env.PREMIERE_MCP_TOOL_PACKS ??= "essential,captions,delivery";
}
```

### 3.5 `cep-plugin/updater.cjs` + `main.js` (flags 4 y 5)

```js
// updater.cjs — dentro de scheduleWindowsGlobalUpdate(), primera línea:
if (String(runtime.process && runtime.process.env.PREMIERE_MCP_SEC_ALLOW_LATEST || "") !== "1") {
  throw new Error("SEC FORK: auto-update a @latest bloqueado por PREMIERE_MCP_SEC_ALLOW_LATEST.");
}

// main.js — en handleUpdateClick(), añadir process al runtime:
var nodeProcess = nodeRequire("process");
// ... runtime: { fs: fs, path: path, os: os, childProcess: childProcess, crypto: nodeCrypto, process: nodeProcess }

// main.js — en checkForUpdates(), primera línea:
if (String(nodeRequire("process").env.PREMIERE_MCP_SEC_CHECK_UPDATE_NET || "") !== "1") {
  showUpdateCheckError("SEC FORK: chequeo de actualizaciones por red desactivado.");
  return;
}
```

### 3.6 `src/telemetry.ts` (flag 6)

```ts
export function getTelemetry(): Telemetry {
  if (telemetry) return telemetry;
  // SEC FORK: deny es el default; solo se permite telemetría con opt-in explícito.
  if ((process.env.PREMIERE_MCP_SEC_TELEMETRY ?? "deny") !== "allow") {
    telemetry = disabledTelemetry; return telemetry;
  }
  // ... código original sin cambios ...
}
```

### 3.7 `src/http-server.ts` (flag 7)

```ts
// primera línea del entrypoint http (antes de leer env de auth):
if (["1","true","yes","on"].includes((process.env.PREMIERE_MCP_SEC_ALLOW_HTTP ?? "").toLowerCase()) === false) {
  console.error("SEC FORK: modo HTTP deshabilitado (PREMIERE_MCP_SEC_ALLOW_HTTP=0). Usa el transporte stdio.");
  process.exit(1);
}
```

## 4. Versionado del fork

| Elemento | Valor |
|---|---|
| Tag espejo upstream | `upstream-1.18.6` → commit `a7ac506` (inmutable, referencia de auditoría) |
| Rama de trabajo | `sec/hardening` |
| Esquema de versión | `1.18.6-sec.N` (N incremental por iteración de parches; prerelease ⇒ nunca colisiona ni satisface `^1.18.6`) |
| Artefacto de instalación | `npm pack` → `premiere-pro-mcp-1.18.6-sec.N.tgz` + registro `SHA256SUMS.txt` comprometido en el fork |
| Changelog del fork | `SECURITY-FORK.md`: matriz flag × versión + SHA del upstream base |

Actualización upstream: `git fetch upstream && git merge --ff-only upstream-1.18.6..upstream/main` solo tras
re-auditoría (principio 3); nueva versión `1.18.X-sec.1` renombrando la base.

## 5. Cadena de instalación verificable (elimina la confianza en npm registry)

```bash
git checkout sec/hardening && git tag --verify none  # sin firmar: validar por SHA
npm ci                     # SOLO lockfile comprometido
npm run build
npm pack                   # tarball 1.18.6-sec.N
sha256sum premiere-pro-mcp-*.tgz >> SHA256SUMS.txt
npm install -g ./premiere-pro-mcp-1.18.6-sec.N.tgz
premiere-pro-mcp --version && premiere-pro-mcp --doctor
```

Verificaciones por instalación: (a) SHA-256 coincide con `SHA256SUMS.txt`;
(b) `grep -c hasInstallScript package-lock.json` solo `fsevents`;
(c) el tarball no contiene `.debug` (`tar -tzf *.tgz | grep debug`).

## 6. Plan de pruebas por fases

| Fase | Variables activas | Acción | Criterio de aceptación |
|---|---|---|---|
| A — Build limpio | todas default (seguro) | tarball + install global + `--doctor` | doctor OK; sin registro tocado; sin `.debug`; tools limitadas a `inspect,edit` |
| B — Conector | `SEC_PLAYERDEBUGMODE=1` solo para este paso | `--install-cep` | `reg query HKCU\SOFTWARE\Adobe\CSXS.11 /v PlayerDebugMode` = 1; panel "Running"; `ping` MCP OK |
| C — Proyecto desechable | flags de B + default profile | importar medio, secuencia 720×1280/24, SRT, exportar | archivo exportado verificado; `git`-style log de operaciones; sin telemetría (ver 7) |
| D — Toggle permisivo | flip `SEC_ALLOW_LATEST=1`, `SEC_CHECK_UPDATE_NET=1`, `SEC_SHIP_DEBUG_FILE=1` | reproducir rutas upstream | confirman que el interruptor repone el comportamiento original; volver a default |
| E — Cierre | defaults seguros | `--uninstall-cep` (flag 2 = 1) + reinstalar sin PlayerDebugMode | claves CSXS limpias; puerto 8088 cerrado (`netstat -ano | findstr 8088`) |

Verificación de telemetría apagada: sin `POSTHOG_API_KEY` en el entorno del MCP client
y con flag 6 en `deny`, el arranque no imprime `[premiere-pro-mcp] PostHog telemetry enabled`.

## 7. Rollback

- Comportamiento: flip de la variable → reiniciar el servidor MCP. Ningún cambio persiste.
- Registro: `Remove-ItemProperty` en `CSXS.9–14` (flag 2 lo hace al desinstalar).
- Desinstalación completa: `premiere-pro-mcp --uninstall-cep && npm uninstall -g premiere-pro-mcp`.
- El upstream nunca se modifica; todo el endurecimiento vive en la rama `sec/hardening`.

## 8. Qué NO se toca (ya está bien en upstream)

`path-guard.ts` (confinamiento de symlinks), ACLs del directorio puente
(`bridge-directory-security.cjs`), escape de cadenas ExtendScript (U+2028/2029,
metacaracteres), rechazo de argumentos desconocidos, fail-closed en export/efectos,
`-protocol_whitelist` de ffmpeg, y la tokenización de confirmación de `edit-plan`.

## 9. Registro de ejecución (2026-09-30)

Todos los parches aplicados en la rama `sec/hardening`, un commit por mitigación.

| Commit | Contenido |
|---|---|
| `b282c05` | Este plan |
| `f33d2fe` | SEC 1+3 — `install-cep.ps1`: escrituras PlayerDebugMode y `.debug` tras `PREMIERE_MCP_SEC_*` (diagnóstico también gateado) |
| `c182c39` | SEC 2 — `uninstall-cep.ps1`: revoca CSXS.9–14 al desinstalar (default ON) |
| `1ef10ba` | SEC 1 — instalador C#: escrituras de registro opt-in |
| `1989e3b` | SEC 4+5+8 — CLI: bloquea `@latest`, gatea chequeo de red, perfil reducido por defecto |
| `d44c88b` | SEC 4+5 — panel CEP: guard en updater y chequeo de red |
| `e90b2ff` | SEC 6 — telemetría opt-in (`deny` por defecto) |
| `5352bc0` | SEC 7 — transporte HTTP aborta salvo flag |
| `10714e5` + `119a8d0`/`beed6e7` | Estático `.npmignore` + decisión de versionado (ver abajo) |
| `5fd3615`, `f6f9f74` | Tests: runtime del updater lleva `process`; whitelist por archivo; SHA-256 del tarball |

**Desviación del esquema de versionado (sección 4):** el bump a `1.18.6-sec.1`
desalineaba los tests upstream de coherencia de versiones (manifiestos CEP,
plugins Claude/Codex, MCPB) — guardrail upstream intencional. El paquete mantiene
`1.18.6`; la identidad del fork vive en el tag git `sec/1.18.6-1` y en
`SHA256SUMS.txt`.

**Hallazgo de empaquetado:** con un array `files` en package.json, npm ignora
`.npmignore` dentro de los directorios incluidos, por lo que `cep-plugin/.debug`
seguía en el tarball. Solución: whitelist por archivo de `cep-plugin/` y
`after-effects-cep-plugin/` en `files` (verificado: 0 archivos `.debug`).

**Validación:**
- `tsc` limpio; smoke tests de flags 5 y 7 (bloqueo default + ruta upstream con flag).
- Suite completa en modo permisivo (`SEC_*`=1/allow): **4055 passed / 0 failed** (1 skipped upstream).
- Tarball: `premiere-pro-mcp-1.18.6.tgz` —
  `6d6af9fdb90acfc6b3a6c889a2711d3f271b3918a856126d3a3bd4cebc4b293c`
  ( registrado en `SHA256SUMS.txt` ).
- Instalador C# (`Program.cs`): parcheado pero sin build .NET local (no hay SDK
  verificado en esta máquina); no forma parte del camino de instalación npm.

## 10. Vía pnpm (validada 2026-09-30, opcional)

Evaluación con pnpm 12.8.1 (vía `corepack pnpm`, incluido en Node 24) sobre `sec/hardening`.

**Hallazgos de la migración (probados, no supuestos):**
1. `pnpm import` **descarta el bloque `overrides` de npm** sin avisar: `@hono/node-server`
   bajó de 2.0.11 a 1.19.17 (major). Corregido con `pnpm-workspace.yaml` (nuevo hogar de
   la configuración en pnpm 12 — el campo `pnpm` de package.json ya no se lee) fijando
   las versiones exactas auditadas. Grafo resultante: **213 = 213, cero diferencias**.
2. El layout estricto de pnpm **cazó un phantom dependency upstream**: el test
   `extendscript-es3-syntax.test.ts` importa `acorn` sin declararlo (npm lo tolera por
   hoisting plano). Declarado como devDependency exacta `acorn@8.18.0` (misma versión
   que ya había en el grafo) — pasa bajo pnpm y bajo npm.

**Ganancia de seguridad principal:** pnpm 10+ **no ejecuta scripts de ciclo de vida de
dependencias salvo allowlist**. Hoy la única dep con install script es `fsevents`
(macOS); el valor real es como tripwire en futuros merges upstream.

**Reglas de la vía pnpm:**
- Local: `corepack pnpm install --frozen-lockfile` (instalación), `corepack pnpm vitest run`.
- El tarball de release se sigue construyendo con `npm pack` (SHA único en SHA256SUMS.txt);
  verificado que `pnpm pack` produce contenidos idénticos.
- `package-lock.json` permanece como referencia del grafo auditado; `pnpm-lock.yaml` se
  regenera con `corepack pnpm import && corepack pnpm install --frozen-lockfile` tras cada
  sincronización upstream, y se re-ejecuta el diff de grafos (213 paquetes) antes de confiar.
- En el merge checklist: si upstream cambia su bloque `overrides`, actualizar los pins de
  `pnpm-workspace.yaml`.

## 11. Configuración de seguridad de pnpm + auditoría por familias (2026-09-30)

**Settings en `pnpm-workspace.yaml`** (verificados contra pnpm 12.8.1; unidad de
`minimumReleaseAge`: **minutos**):

| Setting | Valor | Efecto |
|---|---|---|
| `minimumReleaseAge` | `10080` (7 días) | No resuelve versiones publicadas hace menos de 7 días — periodo de curado para que la comunidad las pruebe. Knobs: 30 d = 43200, 60 d = 86400 |
| `minimumReleaseAgeExclude` | `[]` | Escape solo para parches de seguridad urgentes |
| `onlyBuiltDependencies` | `[]` | **Ninguna** dependencia puede ejecutar scripts de ciclo de vida |
| `strictDepBuilds` | `true` | El install FALLA si una dep nueva trae scripts bloqueados (tripwire, no warning) |
| `verifyDepsBeforeRun` | `error` | Falla cualquier script npm si node_modules no coincide con el lockfile |
| `engineStrict` | `true` | Exige engines.node (>=20.19) |
| `saveExact` | `true` | Dependencias nuevas se fijan exactas (audit-friendly) |

pnpm 12 verifica **todo el lockfile contra estas políticas en cada install**
("Lockfile passes supply-chain policies"). Con 60 días fallaban 45 entradas del
grafo actual; el gate de 7 días pasa porque la versión más joven tiene 9 días
(`@typescript-eslint@8.70.1`, `@posthog/core@1.55.1`, ambas del 2026-09-21).

**Parche aplicado**: `brace-expansion` (transitiva dev-only de la cadena eslint,
advisories high/moderate de clase DoS) 1.1.18→1.1.21 y 5.0.9→5.0.12 — único drift
del lockfile auditado, verificado con git diff. Tras el parche: **npm audit 0,
pnpm audit 0**.

**Auditoría por familias** (`sec-tools/sec-audit-families.mjs`, informe:
`AUDIT-FAMILIAS-2026-09-30.md`): 213 paquetes únicos — **11 runtime** (MCP core ×4,
telemetría PostHog ×3, puente hono/jose/ws ×3... +zod), 202 dev. Resultados:
0 deprecated en runtime (solo `eslint@9.39.5`, dev), 0 scripts de instalación en
disco, todas las runtime son MIT, edad 9–71 días, 1 maintainer en jose/ws/hono/zod
(bus-factor bajo a conocer). Re-ejecutar tras cada merge upstream y comparar.

## 12. Revisión post-integración (2026-09-30) — qué se rompió y estado final

Revisión de regresión sobre `sec/hardening` tras las 3 iteraciones:

1. **Roto: el tarball llevaba la herramienta de auditoría** (`scripts/` está en la
   whitelist `files`), por lo que el SHA-256 de `SHA256SUMS.txt` ya no describía lo
   que produce un rebuild. **Arreglo:** herramienta movida a `sec-tools/` (fuera de
   la whitelist); tarball regenerado y SHA actualizado.
   SHA vigente: `d36b77d94ce5cb09e18dbf624d06a923b721c3ab450c9488b8b83833eeeb2b71`.
2. **Incompleto:** las exclusiones `.debug` de `.npmignore` del experimento de
   empaquetado no se habían commiteado. Commiteadas (redundantes con la whitelist,
   pero documentan la intención).
3. Ya capturado en iteraciones anteriores (y arreglado entonces): desalineación de
   versiones por el bump `-sec.1` y el contrato `process` del runtime del updater.

**Verificación final en HEAD (todo verde):**
- Suite completa bajo npm: **232/232 archivos, 4055/4055 tests** (modo permisivo).
- Suite completa bajo pnpm: **232/232 archivos, 4055/4055 tests** + "✓ Lockfile
  passes supply-chain policies" (gate 7 días activo).
- `npm run lint` ✓ · `npm run pack:check` ✓ (incluye install aislado del tarball).
- Smoke en vivo: `--version`=1.18.6; `--check-update` bloqueado por defecto;
  http-server aborta por defecto; `install-cep.ps1 -Diagnose` ejecutado de verdad
  e imprimiendo el mensaje del gate SEC (solo lectura, sin tocar registro).
- Program.cs sigue sin build .NET local (sin SDK en esta máquina; documentado).

## 13. Despliegue en la máquina del usuario (2026-09-30)

- **Fase A completada**: SHA verificado (`sha256sum -c` OK), `npm install -g ./premiere-pro-mcp-1.18.6.tgz`, `--version` 1.18.6, `--doctor` correcto. Handshake MCP real contra el binario instalado: protocolo 2025-06-18, **21 tools** (perfil reducido activo), **cero unsafe-script**.
- **Fase B completada** (Premiere 2026 instalado y cerrado): demostración en vivo del interruptor — install con flag OFF dejó el registro intacto y sin `.debug`; con `PREMIERE_MCP_SEC_PLAYERDEBUGMODE=1` escribió CSXS.9–14 = "1" REG_SZ; `--diagnose-cep` = "Connector installation looks ready". El conector es el dev bundle (sin ZXP firmado en el tarball, como avisa el script).
- **Program.cs validado por fin** (subagente): .NET SDK 10.0.401 user-local en carpeta temporal; build con `-p:ConnectorPackage=artifacts\MCPBridgeCEP.zxp` (generado por `build-signed-cep.ps1`) → **0 warnings / 0 errores**; `--verify-only` → exit 0.
- **Pendiente del usuario**: pegar el TOML de `--print-client-config codex` en su config de Codex, abrir Premiere, confirmar panel Window > Extensions > MCP Bridge = Running, y ejecutar `verify_premiere_connection` desde Codex con proyecto desechable (Fase C).

## 14. Lanzamiento (2026-09-30) — PUENTE EN VIVO

**Prueba end-to-end superada**: `ping` vía MCP stdio → puente → panel CEP → Premiere 26.5.2 respondió
`{"connected": true, "premiereVersion": "26.5.2", "projectName": "No project open"}`.
`verify_premiere_connection` respondió con su esquema first-run (safeCheck readOnly); `get_project_info`
falló de forma honesta porque no hay proyecto abierto (esperado).

**Hallazgo de interacción (dos sistemas de seguridad chocando):** el grupo `CodexSandboxUsers`
(dueno de la sandbox del Codex CLI) tiene Modify heredado en `%TEMP%`. El guard del puente de
premiere-mcp detecta "identidad no confiable con derechos de reemplazo" y **se niega a arrancar
(fail-closed correcto)** — primero por ACL del propio dir, luego por ancestro. El escape correcto
ya existía en el proyecto: `PREMIERE_TEMP_DIR`.

**Solución aplicada en esta máquina:**
1. Puente reubicado a `C:\Users\rpach\AppData\Local\PremiereMCPBridge` (cadena de ancestros limpia:
   CodexSandboxUsers solo tiene RX allí; ACL propia protegida: rpach + SYSTEM + Admins).
2. `setx PREMIERE_TEMP_DIR` (env de usuario) + bloque `[mcp_servers.premiere-pro-leancoderkavy.env]`
   en `~/.codex/config.toml` (TOML validado con @iarna/toml; backup previo en
   `config.toml.bak-premiere-20260930`).
3. Premiere reiniciado con el nuevo entorno; el panel CEP usa el mismo dir que el servidor.

**Pendiente del usuario:** reiniciar Codex para que cargue el server nuevo; abrir el panel
(Window > Extensions > MCP Bridge = Running); abrir proyecto desechable y ejecutar
`verify_premiere_connection` desde Codex (debe pasar a "ready"); Fase C.

## 15. SEC 9 — Render circuit breaker (2026-09-30, issue #687)

Tras dejar Premiere medio colgado martillando 4 rutas de render que fallaban en
una sesión automatizada (ver issue upstream #687), se añade el noveno
interruptor: **`PREMIERE_MCP_SEC_RENDER_GUARD`** (default `1` = activado).

- `RenderAttemptGuard` (`src/security/render-guard.ts`, integrado en
  `server.ts` junto a `guardToolHandler`): cuenta intentos fallidos por sesión
  de las tools que invocan el renderizador/AME (`export_sequence`,
  `export_frame`, `export_sequence_review_frames`, `export_sequence_marker_review_frames`,
  `export_sequence_clip_review_frames`, `add_to_render_queue`,
  `encode_project_item`, `encode_file`).
- Tras **2 fallos** (`PREMIERE_MCP_SEC_MAX_RENDER_ATTEMPTS`, default 2) las
  siguientes llamadas se rechazan localmente con mensaje honesto: "NOT sent to
  Premiere". Cualquier render exitoso resetea el contador.
- `PREMIERE_MCP_SEC_RENDER_GUARD=0` lo desactiva (modo upstream).
- Tests: 5 nuevos (`tests/security/render-guard.test.ts`); suite completa
  **233 archivos / 4060 passed** en modo permisivo.

## 16. SEC-FIX: eliminación de efectos en hosts es-ES (#674) — 2026-09-30

**Fix implementado y probado EN VIVO contra el caso de reproducción real.**

- **Causa raíz:** `__BUILT_IN_COMPONENTS` (tabla de display names de built-ins en
  `script-builder.ts`) solo contenía inglés; al ver `AE.ADBE Motion` con displayName
  "Movimiento", `__componentClassificationProblem` concluía "host localizado" y
  rechazaba TODA eliminación.
- **Fix:** tabla ampliada con los nombres es-ES **medidos en vivo** (Opacidad,
  Movimiento, Movimiento del vector, Volumen, Volumen del canal) + vocabulario UI
  español de las familias no vistas (Tiempo de reconfiguración, Paneo de balance,
  Texto, Forma). Dirección estrictamente fail-safe: añadir un nombre solo puede
  PREVENIR una eliminación, nunca habilitar un borrado peligroso. Sin flag SEC
  necesario: es datos de evidencia, igual que la tabla inglesa de upstream.
- **Tests:** 4 nuevos en `tests/tools/regressions.test.ts` (es-ES video, es-ES mono
  audio, gráfico es-ES con Movimiento del vector/Texto, e italiano SIGUE rechazando —
  el guardia por-locale se preserva). Regresiones 105/105; suite completa
  **233 archivos / 4064 passed**.
- **Prueba en vivo (Premiere 26.5.2 es-ES, el repro real):**
  `remove_effect_by_name("Desenfoque gaussiano")` → `{removed: 1, verified: true,
  remaining: ["Opacidad","Movimiento"], undoSteps: 1}` — la misma llamada que
  devolvía el refusal.
- Tarball SHA `906d2c35d6951109d24e57f5c0398aa4dc66d73a1e27b5b9988f68b347a95ae7`.

## 17. Follow-up #674 (Equilibrio) + re-test controlado #687 — 2026-09-30

- **Agujero cazado en vivo por la fase de audio:** un Balance tocado (QE/UI) crea un
  componente "Equilibrio" con matchName `Internal Audio Balance`; al ser `Internal *`,
  el clasificador lo cuenta como built-in confirmado, y su displayName fuera de la
  tabla disparaba de nuevo el refusal de host localizado — en cualquier clip español
  donde el usuario hubiera tocado el Balance. **Fix:** "Equilibrio" añadido a la tabla
  (medido en vivo) + test que verifica remoción con Equilibrio presente y protección
  por nombre. Regresiones 106/106; suite 233 archivos / 4065 passed.
- **Re-test controlado QuickTime (#687):** JSON válido con backslashes literales,
  cliente con timeout 300 s, `PREMIERE_TIMEOUT_MS=180000`, monitoreo del proceso →
  mismo "Unable to initialize export!" con el host vivo y respondiendo durante todo
  el intento. La conclusión del issue SE CONSOLIDA (export por scripting roto para
  H.264 y QuickTime por igual); el crash original queda aislado como efecto de
  matar el cliente a mitad de render.
- Config de Codex completada (env: capabilities, tool packs, timeout 120 s).
- Lección de escaping: la capa de herramienta se come un nivel de backslashes;
  en heredocs usar `\\`; args JSON largos vía stdin (`mcp-call.js` ahora acepta `-`).

## 18. SEC-FIX #687: AME queue start — el render por scripting FUNCIONA (2026-09-30)

**Causa raíz del estancamiento AME encontrada con el screenshot del usuario:** el
trabajo quedaba en estado "Preparado" — la cola de AME no arranca sola en 26.5.2.
El propio upstream documenta `app.encoder.startBatch()` como workaround CEP
(#641/#323) pero `add_to_render_queue` nunca lo llamaba.

**Fix:** `add_to_render_queue` ahora llama `app.encoder.startBatch()` tras encolar y
reporta `queueBatchStart` en el receipt ("started" / "unavailable: ..."). Test #238
actualizado al contrato nuevo (jamás presentar encolado como render completo).
Suite: 233 archivos / 4065 passed.

**Prueba en vivo:** ambos trabajos (el "Preparado" viejo y el nuevo) se procesaron y
renderizaron (~3.0 MB c/u). **El render por scripting funciona vía AME handoff.**
`export_sequence`/`exportAsMediaDirect` sigue roto (Adobe-side, documentado en #687).
Tarball SHA en SHA256SUMS.txt; workaround upstreamable como follow-up de #692.

## 19. SEC-FIX #691: preset_path con forward slashes — 2026-10-01

`create_sequence_from_preset` pasaba el path verbatim a `qe.project.newSequence`,
que en Windows ignora silenciosamente los paths con `/` (la secuencia activa no
cambia → error pelado). **Fix:** `path.resolve()` a separadores nativos en el lado
Node + `existsSync` con error propio ("Preset file not found: …") en vez del genérico.
Tests: normalización (script contiene el path nativo) + missing-file preciso.
Suite: 233 archivos / 4067 passed. **Live:** la llamada con `C:/Program Files/…`
del issue ahora crea la secuencia (`created: true, name: SlashTest`).

## 20. Fixes del stress-test (#710–#714) — 2026-10-01

Stress-test por agente nuevo (13 familias, ~60 calls, log en
`C:\Users\rpach\Videos\stress-test\hallazgos.md`): 5 bugs nuevos, todos arreglados
y verificados en vivo aquí:

| Issue | Defecto | Fix | Live |
|---|---|---|---|
| #713 | `import_media` con path inexistente abre modal y wedged el puente | existsSync + error preciso por archivo | fallo instantáneo, sin colgar |
| #710 | Tools de volumen buscan "Volume"/"Level" ingleses | lookup por matchName `Internal Volume*` + displayName dual + propiedad `Level\|Nivel` (4 lookups en audio.ts + track-targeting.ts) | set/get -3 dB verificado |
| #711 | `add_to_render_queue` falla con forward slashes | resolve() de ambos paths + missing-preset preciso | la llamada exacta del stress-test rinde 24 MB |
| #714 | `create_sequence` falla con preset válido forward-slash | mismo patrón #691 (resolve + existsSync) | preset HD 1080p del stress-test crea |
| #712 | trim/slip aceptan fuente fuera del medio | guard de media-end vía projectItem.getOutPoint() en ambos | trim 39s y slip→12s rechazados nombrando el límite (10s) |

Pendiente documentado en #712: el socio enlazado no se editó en el trim original
(`linkedPartnersEdited: []` con include_linked:true) — defecto separado que requiere
decisión de semántica; los bounds ya no permiten llegar a ese estado corrupto.
Suite: 233 archivos / 4067 passed.

## 21. Ronda 3 del stress-test: endurecimiento de contrato (#725) — 2026-10-01

Matriz de 10 familias × 72 sondas del agente (familias-errores.md): 63 fallos
honestos, 9 hallazgos de contrato → consolidados upstream en #725. Arreglados
en el fork (7 de 9; los 2 restantes son de diseño y quedan recomendados):

- **FAM-1**: `expected_undo_stack_index` ahora REQUERIDO en undo/redo/multiple_undo
  (3 handlers; sin él, no se puede probar qué acción se revierte). Los hosts sin
  undoStackIndex tienen rama de error propia. Tests upstream actualizados con los
  índices de sus propios fakes (+ rama de no-index y umbral del fake de lecturas).
- **FAM-10**: tokens de `apply_edit_plan` de un solo uso por sesión de servidor:
  consumidos al aplicar con éxito; `preview_edit_plan` re-arma (única vía de vuelta).
  Alineado con la regla propia del repo: "never blindly replay a confirmation token".
- **FAM-3a**: `set_playhead_position` rechaza no-finito/negativo.
- **FAM-3b**: `set_clip_volume` lee de vuelta y reporta `appliedLevel/appliedDb/clamped`
  (el receipt ya no ecoa lo pedido cuando Premiere clampea).
- **FAM-5a**: `import_media` rechaza array vacío con mensaje propio.
- **FAM-5b**: importar un directorio reporta `importedFolders` (el campo `files` ya no miente).
- **FAM-7**: `rename_clip` rechaza nombres vacíos/solo-blancos.
- Recomendados upstream (sin fix local): FAM-6 (enums en errores de validación,
  capa de esquema transversal) y preview-con-nodos-inexistentes (validación host-side).

Suite: 233 archivos / 4067 passed.

## 22. Rework #712 tras review del owner (2026-10-01)

El owner revisó #717 con razón: `ProjectItem.getOutPoint()` es una **marca
editable**, no la duración física — el guard original rechazaría edits legítimos
tras una marca de usuario. **Rework:** two-phase con evidencia real — fase 1 lee
`getMediaPath()` del clip, Node hace ffprobe de la duración, fase 2 embebe el
bound exacto. Inyectable en tests (sin ffmpeg). Stills (sin duración) quedan sin
techo — su semántica real. `set_clips_volume` (bulk) suma el lookup localizado
que el owner señaló en #710. Suite: 233 archivos / 4070 passed.
Live: trim 39s y slip→6s rechazados nombrando "5.000s (ffprobe)".

## 23. #728 v2 — registro de tokens cross-proceso (2026-10-01, ronda 4)

El stress-test r4 encontró la regresión: el Set en-factory de la v1 era por
PROCESO — el harness per-call (y cualquier cliente de un-proceso-por-llamada)
nace con registro vacío. **v2**: registro persistente en
`<bridge-temp>/edit-plan-tokens.json` + tokens con **nonce por preview**
(sha256(planHash:uuid)) — cada preview emite token fresco; apply lo consume;
re-preview re-arma con token NUEVO. Cap 512 entradas. Live verificado
cross-proceso: preview(A) → apply(B) ✓ → re-apply(C) → "already been applied
and was consumed". Además **#729 preflight**: relink_media e import_folder
rechazan paths inexistentes antes de abrir diálogos bloqueantes (el hang de
ruta válida bloqueada por Premiere queda documentado Adobe-side en #729).
Suite: 233 archivos / 4070 passed.

## 24. SEC-FIX #730 — tail-teleport de insertClip (2026-10-02)

`add_to_timeline` con el insert DENTRO de un clip existente: Premiere's
`Sequence.insertClip` parte el clip pero **mueve la cola al final del timeline**
en vez de empujarla tras el insert (live repro del agente: 10 colas de 2.2s en
22–44s, música +44s), y el receipt decía verified:true.

**Fix (en `__insertClipHonoringSyncLock`):** pre-razor QE de los straddlers de
las pistas DESTINO (el motor ya razor-eaba solo las sync-locked otras), con
verificación de split y refusal fail-closed si QE no está disponible; detector
post-insert de colas teleportadas (fail-closed); flag `targetSplitPushedRight`
en el receipt. **Live verificado**: insert B @3 dentro de A (0–10) → V1 =
A' 0–3, B 3–7, cola A 7–14 — sin teleport, exactamente la semántica de la UI.
Suite: 233 archivos / 4070 passed (incluye los tests #562 upstream con el
pre-razor integrado).

## 25. Ronda 5: endurecimiento de contrato (#733/#734) — 2026-10-02

Stress-test r5 (regresión de fixes 13/14 + superficies): 8/9 fixes verdes
adversariales (incluido el replay cross-proceso del #728 verificado contra el
registro persistido). Hallazgos procesados:

- **#733**: los markers NUNCA movieron la pila de undo en ninguna versión
  (git-verified: sin "undoSteps" en markers.ts histórico; la descripción upstream
  ya lo decía) — NO es regresión. **Fork**: receipts de add/update_marker ahora
  reportan `undoRecordable: false` + warning explícito. Arquitectónico (journal
  de markers client-side) recomendado upstream.
- **#734-1** get_export_file_extension: resolve()+existsSync del preset y error
  honesto cuando el host no devuelve extensión (la llamada con forward slashes
  del agente encaja en la familia #691/#711).
- **#734-2** set_metadata: mensaje ahora sugiere el nombre cualificado
  (Column.PropertyText.Description).
- **#734-3** add_keyframe: rechaza tiempos fuera del rango visible del clip
  nombrando la duración (live: t=99 → "outside this clip's visible range
  (duration 8.000s)"); en-rango + remove verificados en vivo.
- **RG1b**: latest-wins documentado en la descripción de preview_edit_plan.
- **FAM-5** import_folder/import_media: receipt `files` ya no lista carpetas
  (solo realFiles; folders van en importedFolders).

## 26. Inventario de divergencias y monitoreo upstream (2026-10-02)

El 02-10 upstream cerró nuestros 8 PRs re-implementándolos en PRs propios mergeados
(atribución conservada) y cerró los 16 issues. El estado post-absorción del fork:

- **Divergencias KEEP** (defenderlas en cada merge): startBatch automático
  (upstream #760 lo hizo opt-in) y pre-razor #730 (upstream mergeó el reporte
  #731/#756, no el fix).
- **Divergencias PREFER-UPSTREAM** (tomar la de upstream si equivale): tokens
  cross-proceso (#742), warning undoRecordable de markers (#736), bounds ffprobe
  (#760).
- **Divergencias SEC permanentes**: los 10 flags PREMIERE_MCP_SEC_*, pnpm
  supply-chain, tarball pin.

Inventario completo con file:line, motivación, refs upstream, puntos de quiebre a
monitorear y runbook de sync: **`DIVERGENCIAS-Y-MONITOREO.md`** (raíz del repo).
Los sitios de código llevan comentarios `[FORK-DIVERGENCE]` que referencia este
contrato; ningún merge de upstream debe eliminarlos sin resolver su columna
"Disposición" primero.

## 27. SEC 10 — Auto-pairing UXP + puerto dinámico (2026-10-02)

Problema: publicar el plugin exigía pasos manuales (pegar URL/token en el panel) y el
puerto fijo 7777 colisiona cuando hay dos servers (p.ej. Codex vivo + sesión propia).

Solución (cero envs para el usuario, cero pasos en el panel):

- **Puerto dinámico** (`src/index.ts`): default 7777; si está ocupado y el usuario no
  fijó `PREMIERE_UXP_PORT`, el bridge re-intenta con puerto 0 (asignado por el OS).
  Con puerto explícito, un conflicto sigue siendo error honesto (CEP-only).
- **Fichero de emparejamiento** (`src/bridge/uxp-pairing.ts`, nuevo): tras bind, el
  server escribe `uxp-pairing.json` (schema `premiere-mcp.uxp-pairing.v1`: url, token,
  pid, issuedAt) en TODA carpeta de datos del plugin existente
  (`%APPDATA%\Adobe\UXP\PluginsStorage\PPRO\<major>\{External,Internal}\com.ppmcp.premiere.uxp[\PluginData]`)
  + el temp dir del bridge. En shutdown borra solo los ficheros con SU pid (un segundo
  server vivo conserva el suyo: last-writer-wins documentado).
- **Lector en el panel** (`uxp-plugin/index.cjs`, marcado FORK): al abrir, el panel
  prefiere el fichero de emparejamiento → sesión persistida (localStorage) → manual.
  Si el pairing apuntaba a un server muerto, al primer fallo de conexión cae a la
  sesión persistida en vez de reintentar eternamente.
- **Flag**: `PREMIERE_MCP_SEC_AUTO_PAIRING` (default ON; `0` restaura el flujo manual).
- Superficie de exposición: el token queda en disco en el perfil del usuario — misma
  exposición que config.toml del cliente, que ya lo contiene.

Tests: `tests/uxp-pairing.test.ts` (4) + 3 contratos nuevos de puerto en
`tests/entrypoints-unit.test.ts` (fallback dinámico escribe pairing; doble-fallo y
puerto-explícito-ocupado → CEP-only). Suite 4077/0. Publicación: QUICKSTART.md +
ccx determinista con SHA256.
