# Ronda 5 — Regresión adversarial fixes 13/14 + superficies nuevas

- **Fecha:** 2026-10-02 (madrugada)
- **Server:** fork bot202102, **sec/1.18.6-14** (12+ fixes: tokens cross-proceso, preflights, bounds ffprobe, insert pre-razor, set_clips_volume)
- **Proyecto:** `C:\Users\rpach\Videos\stress4\stress4.prproj` — guardado e íntegro (R5Main, R5Ins con checkpoint, R5Batch 32 clips)
- **Logs crudos:** `runs/r5-*.txt/json`; registro de tokens leído en `PremiereMCPBridge\edit-plan-tokens.json`

## BLOQUE RG — regresión de fixes

| Sonda | Veredicto |
|---|---|
| RG1a apply→undo→re-apply MISMO token, procesos separados | **VERDE — fix #728 activo**: "This confirmation token has already been applied and was consumed; preview the edit again to obtain a fresh token" |
| RG1b preview×2 mismo plan | VERDE-parcial: tokens DISTINCTOS (nonces ✓), el 2º aplica ✓, pero el 1º queda inutilizable ("does not match") — la spec decía "ambos usables una vez" → **MENOR (matiz de contrato, única-viva-por-plan)** |
| RG1c apply plan B con token de plan A | VERDE — "Confirmation token does not match this edit plan" |
| RG1d token inventado 64-hex | VERDE — mismo rechazo |
| RG1e registro persistido | VERDE — `edit-plan-tokens.json` con registros `{planHash/token, issuedAt, consumed:true}`; consumos sobreviven procesos |
| RG2a relink target inexistente | **VERDE — fix anti-#729 activo**: "Relink target not found: … changeMediaPath with a missing file opens a blocking dialog" — instantáneo, ping sano después |
| RG2b import_folder inexistente | VERDE — "Folder not found: …" instantáneo |
| RG3a/b trim 39s y slip excede (medio 6s) | VERDE — "real media duration of 6.000s (ffprobe)" en ambos |
| RG3c trim en rango (out=4) | VERDE — source 0–4, timeline 10–14 |
| RG3d still extiende 500s | VERDE — `isStillImage` sin techo; revertido con set directo |
| RG4.1 insert @0 en vacía | VERDE |
| RG4.2 insert @3 con solape | **VERDE — fix #730 activo**: layout 0–3 \| 3–9 \| 9–16, receipt `targetSplitPushedRight: true` |
| RG4.3 insert @6 doble solape | VERDE — 0–3 \| 3–6 \| 6–12 \| 12–15 \| 15–22, splits correctos, max 7s |
| RG4.4 insert en pista superior | VERDE — V1 desplazado +1s (sync-lock, semántica conocida) |
| RG5 volumen mono+st+bulk+keyframes | VERDE — appliedDb exactos, bulk `applied:1`, keyframes `verified` |
| RG6 contratos (undo sin guard / playhead −10 / rename blancos / import []) | VERDE ×4 — mismos mensajes de r3/r4 |

## BLOQUE S — superficies nuevas

| Sonda | Veredicto |
|---|---|
| S1 transiciones video (3 cortes probados) | honesto-falla QE ("returned without adding") — sin mutación; conocido de r2. **Audio: NO existe tool de aplicación** (solo list_available_audio_transitions) — superficie no cubierta por el server |
| S2 keyframes video | VERDE en rango (stored+readback); **fuera de rango se ACEPTA (t=99 sobre clip 3s)** → MENOR #734-3; el trim posterior SÍ se protege con mensaje ejemplar + `keyframe_policy` |
| S3 checkpoints | VERDE — `create_sequence_checkpoint` (structureMismatch:null), `list_sequence_checkpoints`, `diff_sequence_snapshots` (added 3, moved 5) |
| S4 editorial plans | NO CUBIERTO a fondo — pipeline exige capture previo (`manage_project_context` con action/records/evidence); sondeado, esquemas honestos |
| S5 batch 10 inserts | VERDE — 10/10 posiciones exactas 0–9 (sin solapes) |
| S6 protocolo legacy (env PREMIERE_MCP_PROTOCOL_MODE=legacy) | VERDE — handshake + ping + get_project_info + list_sequences (4 seqs) |
| S7 perfil reducido | VERDE — exactamente **21 tools**, sin apply_edit_plan/trim/import; incluye render-queue y preview (solo-lectura/handoff por diseño) |
| S8 ráfaga + timeline largo | VERDE — 20 inspects en 41.4 s (≈2s/call, spawn), 0 timeouts; estructura de 32 clips en 2.1 s |
| S9 undo interactivo | **REGRESIÓN — issue #733**: markers sin undoSteps en receipt; multiple_undo(5) NO deshizo los 5 markers (siguen) sino los últimos 5 clips del batch (32→27); reparado a 32 |

## Issues de esta ronda

- **#733 [Regression]** — marker tools sin registro de undo; multiple_undo rebobina acciones ajenas (32→27 clips) mientras los markers persisten.
- **#734 [consolidado]** — get_export_file_extension sin extensión (r1+r5), set_metadata mensaje engañoso con campo no cualificado (r1+r5), add_keyframe acepta tiempos fuera de rango sin avisar (r5).

## Menores/sospechas sin issue

- RG1b: primer token de un plan queda inutilizable al emitirse un segundo preview del mismo plan ("ambos usables" no se cumple; ¿hardening intencional latest-wins?).
- S1: no hay tool de aplicación de transiciones de audio (solo listado).
- S4: editorial plans requieren pipeline de contexto; no ejercitado end-to-end.
- import de directorio sigue listando la carpeta también en `files` (además de `importedFolders`) — cosmético.

## Estado final

- Puente SANO (ping OK, stress4 activo). Proyecto guardado. AME no llegó a abrirse esta ronda (no hubo renders — no requeridos). Los 3 proyectos previos intactos.
