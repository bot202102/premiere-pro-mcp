# DIVERGENCIAS DEL FORK Y MONITOREO UPSTREAM

> Qué diverge de `leancoderkavy/premiere-pro-mcp`, por qué, y qué vigilar allí para
> decidir cuándo cada divergencia se resuelve. Se actualiza en cada sync.
> Complemento de `SECURITY-FORK-PLAN.md` (§26) — este doc es el contrato del merge.

## 1. Estado de la absorción (cierre 2026-10-02)

Upstream cerró nuestros 8 PRs re-implementándolos en PRs propios mergeados (atribución
conservada) y cerró los 16 issues. Mapeo: ver `ESTADO-MAESTRO.md` §2. La release npm
de upstream seguía siendo v1.18.6 (2026-09-29) al momento de este documento: los fixes
nuevos NO están publicados en npm; el fork sigue siendo el único canal completo.

## 2. Inventario de divergencias (al sync, resolver cada una según su disposición)

Los sitios llevan comentarios `[FORK-DIVERGENCE]` en el código. Regla: **KEEP** = el
fork conserva su versión ante conflicto de merge; **PREFER-UPSTREAM** = si la versión
de upstream es equivalente, tomar la de upstream y borrar la nuestra (menos divergencia
que mantener); **SEC** = divergencia estructural permanente (flags/defaults endurecidos,
sin equivalente upstream).

| Divergencia | Sitio (file:line aproximado) | Motivo | Ref upstream | Disposición |
|---|---|---|---|---|
| `startBatch` automático tras encolar | `src/tools/export.ts` (export_sequence: auto salvo `start_batch:false` explícito; también encode_project_item, encode_file, manage_proxies) | En 26.5.2 el job queda "Ready" en AME y nunca arranca solo; probado en vivo 3/3. El merge 1.18.6-20 conserva el opt-out explícito de upstream | #760 (opt-in puro) | **KEEP** (semántica híbrida) |
| Pre-razor #730 (tail-teleport de insertClip) | `src/bridge/script-builder.ts` (detección+razor dentro de `__insertClipHonoringSyncLock`; detector post-insert ARMADO SOLO si el insert cae dentro del material) | Upstream mergeó el REPORTE (#731/#756) y su verificación #746 no el fix. **El sync 1.18.6-20 arregló un falso positivo del detector** (appends con hueco se marcaban como teleport — lo descubrió el test #746 de upstream) | #731 / #746 / #756 | **KEEP** (mejorado en sync) |
| ~~Registro de tokens cross-proceso~~ | — | **ABSORBIDO en sync 1.18.6-20**: el store de upstream (`edit-plan-token-store.ts`, claims atómicos por fichero wx + binding de host con ticks + expiry 30min) es superior al nuestro | #742 | **RESUELTA — PREFER-UPSTREAM ejecutado** |
| ~~Warning undoRecordable en markers~~ | — | **ABSORBIDO**: la barrera de undo de upstream (#736/#753) cubre más (markerUndoWarning, undoTracked) | #736 | **RESUELTA — PREFER-UPSTREAM ejecutado** |
| ~~Bounds físicos vía ffprobe~~ | — | **ABSORBIDO**: los bounds exactos por stream en ticks de upstream (#760) superan nuestro float de format.duration | #760 | **RESUELTA — PREFER-UPSTREAM ejecutado** |
| 10 flags `PREMIERE_MCP_SEC_*` | tabla en `SECURITY-FORK-PLAN.md` §2 | Defaults endurecidos: sin auto-update, sin telemetría, sin HTTP, PlayerDebugMode opt-in, render breaker, perfil reducido | — (sin equivalente) | **SEC — permanente** |
| **SEC 10 auto-pairing + puerto dinámico + anti-zombi** | `src/bridge/uxp-pairing.ts` + `src/index.ts` (watchdog stdin, heartbeat 5s, cleanup en exit) + `uxp-plugin/index.cjs` (staleness 3x heartbeat) | Publicación cero-fricción; el transporte stdio del SDK NO ve el cierre de stdin (zombis ante clientes muertos — verificado en vivo) | — | **SEC — permanente** |
| Tests autocontenidos (entrypoints/telemetry sin env de shell) | `tests/entrypoints-unit.test.ts`, `tests/telemetry*.test.ts` | `npm test` debe pasar sin provisionar flags SEC en la shell | — | **SEC — permanente** |
| pnpm supply-chain (minimumReleaseAge 7d, no-build-scripts, overrides) | `pnpm-workspace.yaml` | Cadena de suministro | — | **SEC — permanente** |
| .npmignore per-file + tarball pin SHA256 | `.npmignore`, `SHA256SUMS.txt` | El .debug CEP no puede salir jamás en el paquete | — | **SEC — permanente** |

## 3. QUÉ MONITOREAR EN UPSTREAM (puntos de quiebre)

Al inicio de cada sesión de trabajo, revisar en este orden. Un cambio en cualquiera
dispara la acción indicada:

1. **Release npm > v1.18.6** → los fixes absorbidos se vuelven públicos. Acción: evaluar
   sync inmediato (Fase 5 del plan) y re-pesar el valor del fork (queda SEC + KEEP).
2. **Cambio de protocolo UXP (v2→v3), esquema de auth del bridge o puerto default** →
   rompe nuestro panel side-loaded, el token de config.toml y el auto-pairing SEC 10.
   Acción: portar panel/token ANTES de tocar nada más; probar conexión con el runbook.
3. **Adopción real del pre-razor** (fix en insertClip, no solo receipts) → deprecar
   nuestra divergencia #730 (PREFER-UPSTREAM) y borrar el bloque KEEP.
4. **Cambio de semántica startBatch** (si upstream algún día auto-arranca o demuestra
   que el opt-in basta en hosts reales) → re-evaluar nuestra KEEP con evidencia nueva.
5. **Cambio de disposition en #687/#735** (Adobe arregla export directo o efectos
   scripting en 26.6+) → actualizar matriz de ESTADO-MAESTRO §5 y quitar workarounds.
6. **Actividad del maintainer > 2 semanas sin respuesta ante hallazgos graves** →
   bus factor 1 confirmado; el fork pasa a desarrollo primario (subir cadencia de
   QA propia, documentar en este archivo).
7. **Posture de supply-chain upstream** (si publican pnpm settings / audit propio) →
   deduplicar: adoptar lo suyo si equivale, mantener el minimumReleaseAge nuestro.

## 4. Runbook de sync (resumen; checklist completo en ESTADO-MAESTRO §2)

1. `git fetch upstream` y `git log upstream/main --oneline` contra este archivo:
   ¿toca alguno de los sitios de la tabla §2?
2. Merge; en cada conflicto decidir por la columna **Disposición** de §2.
3. Los tests que prueban las divergencias KEEP (pre-razor, startBatch) DEBEN seguir
   verdes tras el merge: son el detector de "upstream borró nuestra divergencia".
4. Suite completa + `npm pack` + SHA256SUMS + reinstall + tag `sec/1.18.6-N+1`.
