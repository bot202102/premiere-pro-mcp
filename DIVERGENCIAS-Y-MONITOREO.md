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
| `startBatch` automático tras encolar | `src/tools/export.ts` (~:1268 en export_sequence; también encode_project_item, encode_file, manage_proxies) | En 26.5.2 el job queda "Ready" en AME y nunca arranca solo; probado en vivo 3/3 | #760 lo hizo **opt-in** | **KEEP** |
| Pre-razor #730 (tail-teleport de insertClip) | `src/bridge/script-builder.ts` (~:1850-1910 detección+razor; ~:2048-2078 detector post-insert) | Upstream mergeó el REPORTE (#731, aggregate #756: receipt de colas desplazadas) pero no el fix; su draft #744 lo cerraron. Sin el fix, el layout de la UI se rompe | #731 / #756 / #744 | **KEEP** |
| Registro de tokens cross-proceso | `src/tools/edit-plans.ts` (~:28-61, `edit-plan-tokens.json`, LRU 512) | La protección anti-replay #728 sobrevive reinicios del server | #742 "atomic persisted token claims" | **PREFER-UPSTREAM** si equivale |
| Warning `undoRecordable:false` en markers | `src/tools/markers.ts` (~:100 y receipt add/update) | Los markers jamás movieron la pila QE (#733); el receipt avisa en vez de mentir | #736 reporta lo mismo upstream | **PREFER-UPSTREAM** si el receipt es equivalente |
| Bounds físicos vía ffprobe | `src/tools/media-evidence.ts` (+ consumidores timeline.ts, advanced.ts) | `getOutPoint()` es marca editable, no duración física (#712) | #760 adoptó el mismo enfoque | **PREFER-UPSTREAM** si cubre trim/slip/stills igual |
| 10 flags `PREMIERE_MCP_SEC_*` | tabla en `SECURITY-FORK-PLAN.md` §2 | Defaults endurecidos: sin auto-update, sin telemetría, sin HTTP, PlayerDebugMode opt-in, render breaker, perfil reducido | — (sin equivalente) | **SEC — permanente** |
| **SEC 10 auto-pairing + puerto dinámico** | `src/bridge/uxp-pairing.ts` + wiring en `src/index.ts` + lector en `uxp-plugin/index.cjs` | Publicación cero-fricción: sin pegar token a mano; puerto 7777→dinámico si ocupado | — (upstream pide env + pegado manual; ver su README de uxp-plugin) | **SEC — permanente** (si upstream implementa algo equivalente, PREFER-UPSTREAM) |
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
