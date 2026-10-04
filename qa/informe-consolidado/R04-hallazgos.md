# Ronda 4 — Regresión adversarial de fixes + superficies nuevas

- **Fecha:** 2026-10-01 (tarde-noche)
- **Proyecto:** `C:\Users\rpach\Videos\stress3\stress3.prproj` (desechable, guardado e íntegro)
- **Logs crudos:** `runs/r4-*.txt`, receipts de renders en `export/`
- **Clasificación:** VERDE (fix funciona) · REGRESIÓN (issue #728) · HALLAZGO (issue #729) · MENOR (al log)

## BLOQUE R — Regresión de fixes

| # | Sonda adversarial | Veredicto |
|---|---|---|
| R1a | import array vacío | VERDE — "file_paths must contain at least one non-empty path" (fix del vago "Import failed" de r3 ✓) |
| R1b | import path inexistente | VERDE — "File(s) not found: …" instantáneo |
| R1c | import directorio | VERDE — receipt con `importedFolders` (aunque sigue listando el dir también en `files`; cosmético) |
| R1d | import mixto válido+inexistente | VERDE — all-or-nothing: falla TODO, `foto.png` no se duplicó (conteo 1) |
| R1e | path con ñ/emoji | VERDE — importado y eco verbatim en receipt |
| R2a-c | set/get_clip_volume -6dB en WAV estéreo Y mono | VERDE — receipts con `appliedLevel/appliedDb/clamped`, readback exacto |
| R2d | set_clip_volume +100 dB | **MENOR→issue candidato**: `appliedDb: 15` (Premiere clampea) pero **`clamped: false`** — el flag no se dispara |
| R2e | set_clip_volume -100 dB | VERDE — aplicado -100.0000001 dB sin clamp |
| R2f | set_clips_volume bulk | VERDE — `applied: 2, skipped: 0` |
| R2g | add_audio_keyframes mono (2 pts) | VERDE — `keyframesAdded: 2, verified: true` |
| R2h | adjust_audio_levels mono | VERDE |
| R4a | create_sequence preset fwd válido | VERDE — `presetUsed` eco |
| R4b/c | preset inexistente (ambas tools) | VERDE — "Preset file not found: C:\no\x.sqpreset" en ambas |
| R4d | ARRI 24fps + resize 720×1280 | VERDE — timebase 10584000000 = 24fps exacto, readback verificado |
| R5a | trim out=39 sobre medio 10 s | VERDE — "exceeds this clip's real media duration of **10.000s (ffprobe)**; trim was not attempted" |
| R5b | slip +5 excede | VERDE — mismo mensaje con ffprobe |
| R5c | trim in-range out=7 | VERDE — 0–7 verificado |
| R5d | still extiende sin techo (999 s) | VERDE — `isStillImage: true, verified` (luego revertido por undo) |
| R6a-c | undo/multiple_undo/redo SIN guard | VERDE — "expected_undo_stack_index is required…" / required-property (r3 #725 FIXEADO ✓) |
| R6d | undo índice incorrecto | VERDE — rechaza nombrando posición real |
| R7 | token aplicar→undo→re-aplicar | **REGRESIÓN — issue #728**: el mismo token aplica DOS veces; el 3er intento falla solo por "Clip not found" (target), no por consumo. Re-preview del mismo plan produce el MISMO token (determinista) |
| R8a | playhead -10 | VERDE — "must be a finite, non-negative number" |
| R8b | playhead 1e309 | VERDE — schema "must be number" (Infinity rechazado) |
| R8c | playhead 0 | VERDE |
| R9a/b | rename "" y "   " | VERDE — "must not be empty or whitespace-only" (r3 #725 FIXEADO ✓) |
| R9c | rename 300 chars | VERDE — renamed+verified |
| R9d | rename ñ/emoji/comillas | VERDE — readback exacto |
| R10 | render preset inexistente | VERDE — "Export preset does not exist: C:\no\fake.epr" y **AME no llegó a abrirse** (verificado con tasklist) |
| R3 | 2 jobs fwd-slashes | VERDE con asterisco: job1 (`r4main.mov`, h264 1920×1080, ffprobe OK) y job2 (`r4arri.mov`, h264+pcm) — job2 hubo de re-encolarse porque el reinicio de Premiere por el wedge de N5 mató la cola a mitad (no atribuible al server). Ambos con `queueBatchStart: "started"` |

## Sondeo de issues r2/r3 (estado actual)

- **#718 roll_edit sin guard**: SIGUE ROTO — roll +0.5 → fuente 10.5 s sobre medio 10.000 s, `verified:true` (receipt en `runs/r4-r2sweep.txt`)
- **#720 color_correct falso éxito**: SIGUE ROTO — `colorCorrected:true, changes:{}`, sin Lumetri
- **#721 batch receipts**: SIGUE ROTO — batch testvideo@0 V2 + foto@0 V3 → receipt `actualStart 0/0`, realidad testvideo@15 y raro@25
- **#722 Motion/Opacity es-ES**: SIGUE ROTO — `set_clip_opacity 60` → "Could not set opacity"
- **#725**: undo-sin-guard y rename-vacío **FIXEADOS** (ver R6a/R9a); preview-con-target-fantasma y enums-sin-listar **SIGUEN**
- #719 (slide muta al fallar): sin test limpio esta ronda (requiere la geometría exacta); issue sigue abierto

## BLOQUE N — Superficies nuevas

| # | Sonda | Veredicto |
|---|---|---|
| N1 | bins: raíz, anidado, move_item_to_bin, get_bin_contents recursive (treePath ✓), delete con contenido | VERDE — foto sobrevive al delete del bin |
| N2 | create_subsequence | VERDE-honesto — crea secuencia SEPARADA (`nested:false`) con nota de que Nest es comando de UI (limitación documentada del backend CEP) |
| N3 | ripple_delete dry_run → real; lift/extract sin marcas | VERDE — dry_run preview del gap; real `rippled:true verified`; lift/extract fallan honestos pidiendo in/out |
| N4 | set_work_area | honesto-falla (igual que r2: "did not apply, read back 0 to 26 s") — conocido |
| N5 | offline/relink | set_offline ✓, check_offline_media ✓, **relink_media CUELGA Y WEDGEA EL PUENTE** → **HALLAZGO — issue #729** (300 s sin respuesta, ping muerto, reinicio necesario). Nota: Premiere bloquea el fichero importado en disco ("Device or resource busy") — el flujo realista offline→relink es exactamente el que cuelga |
| N6 | manage_proxies toggle | VERDE — `proxiesEnabled: true, verified` (ámbito app) |
| N7 | captions: import (honesto unverified CEP), read (honesto), safe-zone rects extremos | VERDE — schema rechaza x<0/y>1/width>1 nombrando cotas; "reels" no está en el enum de plataformas (MENOR: enum no listado, #725-familia) |
| N8 | plan 101 ops | VERDE — "must NOT have more than 100 items" |
| N8b | plan 10× mismo clip | MENOR — preview acepta ops contradictorias (aplicar fallaría en la 2ª por revalidación) |
| N8c | preview target fantasma | SIGUE (#725) — emite token para nodo inexistente |
| N9 | metadata 5 campos cualificados | 2/5 escriben+verifican (Description, Comment); Scene/ShootDate/LogNote fallan honestos (MENOR: mensaje no sugiere alternativas) |
| N10 | 5 markers con colores 1-5 | VERDE — createdCount 5, list 5 (color no verificable: conocido) |
| N11 | multi-secuencia A/B | VERDE — el add fue a ARRI; R4Main no cambió por ello |
| N12 | scopes sobre PNG still | VERDE — waveform/median de still OK; contact sheet de PNG pide 2-8 ints (honesto, 1 fila no vale) |
| N13 | scratch disks (lectura) | VERDE — informe por disco desde el .prproj; no pedí set |
| N14a | node_id 300 chars | VERDE — "Clip not found: xxx…" |
| N14b | time 1e-9 | VERDE — aceptado (marker "nano") |
| N14c | 20 markers a 30 s+ (seq 26 s) | VERDE — "markers[0] at 30s is beyond the sequence end (26s)… pass allow_beyond_end" — escape hatch documentado |

## Resumen ejecutivo

- **R1-R10:** 8 de 9 fix-familias VERDE en modo adversarial. 1 REGRESIÓN (#728 tokens) + 1 flag mentiroso menor (clamped).
- **N1-N14:** 1 HALLAZGO grave (#729 relink wedge), resto VERDE u honesto-falla; menores anotados.
- **Sweep:** los 4 bugs de r2 (#718/#720/#721/#722) siguen abiertos y reproducen; 2 items de #725 fixed esta misma build.
