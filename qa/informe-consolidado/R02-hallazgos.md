# Stress-test MCP Premiere Pro — RONDA 2 (verificación de fixes #710–#714 + cobertura ampliada)

- **Fecha:** 2026-10-01 (tarde, tras aplicación de fixes locales)
- **Host:** Premiere Pro 2026 (26.5.2), es-ES, Windows
- **Server:** `premiere-pro-mcp` global (fork endurecido bot202102, upstream 1.18.6 + fixes locales #710–#714)
- **Proyecto:** `C:\Users\rpach\Videos\stress-test\stress2.prproj` (desechable, autogenerado; el proyecto r1 `stress.prproj` se conserva como evidencia)
- **Log de ejecución:** receipts clave en `runs/` (r2-*.txt / *.json)

---

## PARTE A — Regresiones de los bugs de ronda 1

| Issue | Resultado | Evidencia |
|---|---|---|
| **#714** create_sequence+preset | **FIXED ✓** ambas partes: preset válido + forward slashes → `created:true, verified:true, presetUsed` eco correcto; preset inexistente → `Error: Preset file not found: C:\no-existe\preset.sqpreset` (preciso) | `runs/r2-reg-714.txt` |
| **#712** trim/slip fuera de medio | **FIXED ✓**: `trim_clip new_out_seconds:39` sobre medio 10 s → `Error: The requested source out point 39s exceeds this clip's media end of 10s; trim was not attempted.`; `slip_edit +2` → rechazo idéntico, y con socio enlazado nombra al socio y sugiere `include_linked:false`; slip legal (-2) funciona (fuente 5–10→3–8, timeline intacto) | `runs/r2-reg-712-*.txt` |
| **#710** volumen es-ES | **FIXED ✓**: `set_clip_volume -3dB` → `level 0.12589` con readback; `get_clip_volume` → `-3.0000004 dB`; `adjust_audio_levels +2` → `verified:true`; `add_audio_keyframes` fade 4 puntos → `keyframesAdded:4, verified:true`. `set_clip_pan` falla HONESTO (el clip estéreo no expone Balance/Pan — verificado: solo tiene Volumen + Volumen del canal) | `runs/r2-reg-710-*.txt` |
| **#711** render forward-slashes | **FIXED ✓**: `add_to_render_queue` con forward slashes → `jobId cb428fd4…, queueBatchStart:"started"`; render completado; ffprobe: h264 1920×1080 @25fps, 27.0 s (duración = estado del timeline encolado; el pipeline renderiza). AME cerrado tras el render | `runs/r2-reg-711-render.txt` |
| **#713** import path inexistente | **FIXED ✓**: `import_media C:/no/existe_r2.mp4` → `Error: File(s) not found: C:\no\existe_r2.mp4 — nothing was imported. importFiles with a missing path opens a blocking dialog in Premiere.` (rápido, honesto, nombra la causa raíz); `ping` inmediato OK (puente sano) | `runs/r2-reg-713.txt` |

**Las 5 regresiones de ronda 1 están arregladas y verificadas.**

---

## PARTE B — Bugs NUEVOS de ronda 2

### R2-01 (issue #718) — `roll_edit` sin el guard de #712
Roll +3 s sobre corte con clip izquierdo (testvideo, medio 10 s, fuente 0–9.5):
```json
{"rolled": true, "verified": true, "offsetSeconds": 3,
 "after": {"startTicks": "0", "endTicks": "3175200000000" (=12.5s), "outPointTicks": "3175200000000"},
 "verification": "timeline_edge_and_source_in_out_readback"}
```
Readback posterior: `start 0, end 12.5, inPoint 0, outPoint 12.5` — fuente 2.5 s más allá del medio (10.0 s ffprobe). El guard nuevo cubre trim y slip pero NO roll. También observado: receipts de roll_edit sin `undoSteps`/`undoStackIndex` (menor).
**Reproducible:** 100%. Evidencia: `runs/r2-roll-beyond-media.txt`

### R2-02 (issue #719) — `slide_edit` devuelve error PERO deja el timeline mutado
Estado previo: izq 0–12.5 (src 0–12.5), centro 12.5–13.5 (src 4–5), dcho 13.5–20 (src 4.5–8).
`slide_edit {"node_id":"000f424a","offset_seconds":3}` → `Error: The slide edit left a gap or overlap at an adjacent cut.`
Estado posterior (verificado por `get_clip_properties` + `get_sequence_structure`):
- izq: **0–15.5 (src 0–15.5)** — medio 10 s
- centro: **12.5–16.5** (src sigue 4–5: 1 s de fuente en 4 s de record)
- solapamiento izq/centro en 12.5–15.5; audio enlazado sin tocar → desync A/V
Falla validando pero muta antes: "fails open". Evidencia: `runs/r2-slide-corruption.json`
**Reproducible:** observado en secuencia R2Work; estado corrupto conservado en el proyecto.

### R2-03 (issue #720) — `color_correct` falso éxito
`color_correct {"node_id":"000f424e","exposure":0.5,"contrast":10,"saturation":110}` →
`{"colorCorrected": true, "changes": {}, "errors": {}}` — y `list_clip_effects` posterior: solo Opacidad+Movimiento, **sin componente Lumetri**. Nada se aplicó y el receipt dice éxito.
**Reproducible:** 1/1 (cualquier clip, cualquier parámetro).

### R2-04 (issue #721) — `add_to_timeline_batch`: receipts verificados que no reflejan el timeline
Batch de 4 clips en secuencia nueva (testvideo@0 V1, avclip@10 V1, tiny@0 V2, wav@20 A2) → receipt `verified:true` con `actualStartSeconds` = solicitado en los 4. Estructura inmediata: testvideo en **2–10 (src 0–8)** + pieza suelta de testvideo en **25–27 (src 8–10)**; duración 27 s ≠ 25 s. Causa: el batch hace INSERTS con ripple sync-lock ENTRE sus propias colocaciones (tiny 2 s empuja V1 +2; avclip parte testvideo y suelta la cola). Audio quedó coherente; solo el vídeo mangado.
**Reproducible:** 2/2 (incluida reproducción aislada: batch como única llamada tras crear la secuencia). Evidencia: `runs/r2-batch-bug-structure.json`, `runs/r2-drift-state.json`

### R2-05 (issue #722) — familia Motion/Opacity de vídeo rota en es-ES (lado vídeo de #710)
```
set_clip_opacity 60   → Error: Could not set opacity        (¡valor válido!)
set_clip_scale 120    → Error: Motion has no Scale property; nothing was changed.
set_clip_rotation 15  → Error: Could not set rotation
set_clip_position     → Error: Could not set position
```
Las propiedades EXISTEN (get_effect_properties "Movimiento": Posición, Escala, Rotación, Punto de anclaje…) y el camino genérico funciona y verifica:
```
set_effect_property Opacidad/Opacidad 60   → set:true, readbackVerified:true
set_effect_property Movimiento/Escala 120  → set:true, readbackVerified:true
set_effect_property Movimiento/Rotación 15 → set:true, readbackVerified:true
```
Los 4 setters dedicados buscan "Opacity/Scale/Rotation/Position" en inglés — misma raíz que #710, no cubierta por ese fix (que restauró solo audio).
**Reproducible:** 100%.

---

## PARTE C — Cobertura ampliada ronda 2 (todo verificado OK salvo anotación)

- **Montaje:** roll_edit (verifica readback, bug guard aparte), slide_edit legal OK, split_clip, move_clip, add_to_timeline (sync-lock OK), add_to_timeline_batch (R2-04), select_clips_by_name/invert/deselect (conteos exactos), get_timeline_gaps.
- **Efectos:** apply_effect "Desenfoque gaussiano" + set_effect_property "Cantidad" 35 (readback) + remove_effect_by_name (remaining built-ins intactos) — **sin regresión de la zona es-ES**; add_keyframe/get_keyframes/get_value_at_time/remove_keyframe de Opacidad OK; copy_effects_between_clips OK (`copiedEffects:2`, committedUnverified:[]); color_correct **R2-03**.
- **QE honestos fail-closed:** add_transition ("QE clip addTransition returned without adding" — sin mutación; familia QE conocida), crop_clip ("legacy QE catalog does not contain Crop"), add_adjustment_layer ("No supported adjustment-layer API found"), set_clip_pan (sin Balance en el clip — honesto), attach_custom_property ("accepted but XMP does not contain the value… No success is reported" — excelente).
- **Markers:** add_markers_batch 4/4 (markerCountBefore/After verificados); get_sequence_markers_by_type OK.
- **Playhead/áreas:** set/get_playhead_position, navigate_playhead (end, clamped:true), get_next_edit_point, set_sequence_in_out_points (verified 0–25), set_work_area falla HONESTO ("did not apply the work area (read back 0 to 27 s)").
- **Análisis:** generate_media_contact_sheet (PNG verificado), analyze_video_qc (passes:true), detect_silence (segments OK), detect_beats (honesto: "No steady beat found"), read_video_scopes, inspect_media_streams.
- **EDL:** export_sequence_edl → CMX3600 coherente (3 eventos, reels TESTVIDE/AVCLIPMP, 25 fps); circuito con EDL local verificado.
- **Títulos:** add_title textChecks template_verified (limitación de lectura documentada, error honesto de get_mogrt_component).
- **Tokens F10:** preview → token exacto aplica (verified) → token alterado rechaza.
- **Undo F11:** undo/redo/multiple_undo con índice correcto verifican pila; con índice rancio/erróneo fallan a cierre con el índice real (2/2). Nota: los nodeIds cambian tras undo/redo (los clips se recrean).
- **F13 robustez:** args desconocidos SIEMPRE nombran válidos; IDs inexistentes → "Clip not found"/"Sequence not found"; tool inexistente rechazada por el helper. **Pendiente de mejora (menor, ya anotado en r1):** enums no listados en errores (set_blend_mode: 6 valores comunes + numéricos rechazados sin pista; create_caption_track action; preview_edit_plan op types).

## Matriz ronda 2

| Familia | Calls | Resultado |
|---|---|---|
| Regresión fixes | 12 | 4 FIXED + #713 FIXED |
| Montaje profundo | ~25 | R2-01, R2-02, R2-04 |
| Efectos/keyframes | ~15 | R2-03, R2-05, resto OK |
| Markers/selección/playhead | ~12 | OK |
| Análisis/EDL | ~10 | OK |
| Tokens/undo | ~10 | OK |
| Export | 3 | #711 FIXED, ffprobe OK |
| Robustez | ~12 | OK + menores persistentes |
