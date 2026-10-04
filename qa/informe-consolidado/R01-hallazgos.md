# Stress-test MCP Premiere Pro — Log de hallazgos

- **Fecha:** 2026-10-01
- **Host:** Premiere Pro 2026 (26.5.2), es-ES, Windows 10 (26200)
- **Server:** `premiere-pro-mcp` global (fork endurecido bot202102, upstream 1.18.6 + fixes locales)
- **Proyecto de prueba:** `C:\Users\rpach\Videos\stress-test\stress.prproj` (desechable, autogenerado)
- **Medios autogenerados (ffmpeg):** `media/testvideo.mp4` (10 s H.264 testsrc), `media/testaudio.wav` (5 s estéreo 48 kHz), `media/testimage.png`, `media/avclip.mp4` (10 s H.264+AAC), `media/test.srt`
- **Helper:** `node mcp-call.js call <tool> '<json>'` (1 proceso por llamada)

---

## H-01 (BUG NUEVO — issue #710) — Tools de nivel de audio fallan en host es-ES (matching por nombres ingleses)

**Tools:** `set_clip_volume`, `get_clip_volume`, `adjust_audio_levels`, `add_audio_keyframes` (probablemente también `set_clips_volume`)

**Contexto:** Clip de audio real (`testaudio.wav`, nodo `000f4248`, A1) con componentes built-in presentes y verificados via `list_clip_effects`:
- `Volumen` (matchName `Internal Volume Stereo`), propiedad index 1: `Nivel`
- `Volumen del canal` (matchName `Internal Channel Volume Stereo`), propiedades `Izquierda`/`Derecha`

**Pasos:**
1. `adjust_audio_levels {"node_id":"000f4248","level_db":-3}` → `Error: Could not find Volume/Level property on clip`
2. `add_audio_keyframes {"node_id":"000f4248","keyframes":[…]}` → `Error: Could not find audio Level property`
3. `set_clip_volume {"node_id":"000f4248","volume_db":-3}` → `Error: Could not set volume - is this an audio clip?`
4. `get_clip_volume {"node_id":"000f4248"}` → `Error: No volume component - is this an audio clip?`

**Esperado:** set/get de nivel -3 dB con readback (el clip ES de audio y TIENE componente de volumen).
**Obtenido:** fallo siempre, con mensajes que sugieren que el clip no es de audio (engañoso).
**Workaround probado (confirma la causa):** `set_effect_property {"node_id":"000f4248","effect_name":"Volumen","property_name":"Nivel","value":0.707945784}` → `set: true, readbackVerified: true, value: 0.70794576406479` (=-3 dB exactos). El camino genérico con nombre español funciona; los handlers dedicados buscan `"Volume"`/`"Level"` en inglés.

**Reproducible:** 100% (4 tools, host es-ES, cualquier clip de audio).
**Relacionados:** #674 (misma raíz: clasificación por display name inglés; su fix cubrió REMOVE, no SET), #265 (set_clip_pan con síntoma idéntico, cerrado en 1.13 → el patrón del fix no se replicó en las tools de volumen).
**Receipts:** completos arriba; nivel leído antes del set: 0.17782793939114 (lineal).

---

## H-02 (BUG NUEVO — issue #711) — `add_to_render_queue` falla con rutas forward-slash ("Unknown error exception")

**Tool:** `add_to_render_queue`

**Pasos (3 intentos, SecVertical activa, proyecto guardado):**
1. `{"output_path":"C:/Users/rpach/Videos/stress-test/export/stress_vertical.mov","preset_path":"C:/Program Files/Adobe/Adobe Media Encoder 2026/MediaIO/systempresets/3F3F3F3F_4D6F6F56/H264 Match Source - High bitrate.epr"}` → `Error: The requested AME output directory does not exist: ~/Videos/stress-test/export` (directorio SÍ existía; la ruta se muestra mangleada con `~/`)
2. Tras crear el dir, mismo output .mov → `Error: Error: Unknown error exception`
3. Mismo con `stressvertical` sin extensión → mismo error; y con `stress_v.mp4` → mismo error

**Éxito con backslashes (vía stdin JSON):**
```json
{"output_path":"C:\\Users\\rpach\\Videos\\stress-test\\export\\stress_vertical.mov","preset_path":"C:\\Program Files\\Adobe\\...\\H264 Match Source - High bitrate.epr"}
```
→ `{"accepted": true, "jobId": "774f95d3-e4ef-469b-b5e9-1a9113c71dfc", "queueBatchStart": "started", "outcome": "committed_unverified"}` — render completado y verificado (H-12).

**Esperado:** aceptar forward slashes (estándar POSIX-style que el resto del server acepta; p. ej. `create_sequence_from_preset` ya lo acepta tras el fix local).
**Obtenido:** fallo opaco "Unknown error exception" (sin nombre de causa ni de argumento) y un primer error con ruta tilde-mangleada.
**Reproducible:** 100% con forward slashes; 100% éxito con backslashes.
**Relacionados:** #691 (misma familia, otra tool), #687 (export directo roto; distinto: aquí el render AME sí funciona).
**Nota:** no se pudo aislar si el arg culpable es solo `output_path` o también `preset_path` (evité quemar más intentos por el circuit breaker; el render ya estaba en cola).

---

## H-03 (BUG NUEVO — issue #712) — `trim_clip` y `slip_edit` aceptan ventanas de fuente fuera del medio (sin clamp ni error)

### H-03a `trim_clip`
**Pasos:** clip `avclip.mp4` (medio real: 10.0 s, ffprobe) mitad 2 = nodo `000f4251`, timeline 36–41, fuente 5–10.
`trim_clip {"node_id":"000f4251","new_out_seconds":39,"include_linked":true}`

**Receipt (íntegro):**
```json
{"trimmed": true, "verified": true, "clipName": "avclip.mp4", "inPoint": 5, "outPoint": 39,
 "timelineStart": 36, "timelineEnd": 70, "timelineDuration": 34, "keyframePolicy": "reject",
 "keyframesOutsideVisibleRange": 0, "keyframesVerified": true, "linkedPartnersEdited": []}
```
**Obtenido (readback posterior `get_clip_properties`):** `start: 36, end: 70, inPoint: 5, outPoint: 39, duration: 34` — el clip quedó 24 s por encima del medio disponible (10 s). El receipt es internamente incoherente (`outPoint: 39` vs `timelineEnd: 70`) y dice `verified: true`.
**Además:** `include_linked: true` devolvió `linkedPartnersEdited: []` y el socio de audio (`000f4250`, 31–41) no se movió → vídeo y audio quedaron desincronizados.
**Esperado:** rechazar (o clamp a 10 s) un `new_out_seconds` mayor que la duración del medio; si se edita con `include_linked`, editar también al socio.
**Restauración:** `new_out_seconds: 10` (dentro del medio) funciona bien (36–41, fuente 5–10) — el guard solo falta fuera de rango.

### H-03b `slip_edit`
**Pasos:** mismo nodo `000f4251` (fuente 5–10, medio 10 s).
`slip_edit {"node_id":"000f4251","offset_seconds":2,"include_linked":true}`
→ `slipped: true, verified: true, after: {inTicks: 1778112000000 (=7.0 s), outTicks: 3048192000000 (=12.0 s)}` — out de fuente 2 s más allá del medio, sin error.
**Esperado:** clamp/rechazo al llegar al límite del medio (como hace el Slip de la UI).
**Reproducible:** 100%.
**Relacionados:** #126/#503/#553 (trim, cerrados, otros modos de fallo), #260/#273 (slip/slide corrupto, cerrados — aquí no hay corrupción sino ausencia de guard).

---

## H-04 (BUG NUEVO — issue #713) — `import_media` con path inexistente cuelga y deja el puente wedged

**Pasos:** `import_media {"file_paths":["C:/no/existe.mp4"]}` → sin respuesta >5 min (timeout del helper a los 300 s). **Escalada:** el `ping` inmediatamente posterior tampoco responde (`Error: Command timed out after 5000ms`); el puente quedó inutilizable hasta reiniciar Premiere.
**Esperado:** fallo rápido con mensaje de archivo no encontrado (como hace `create_sequence_from_preset`: `Preset file not found: …`).
**Obtenido:** hang + puente wedged; se requirió `Stop-Process` + reinicio de Premiere + `open_project` para recuperar.
**Reproducible:** observado 1 vez (no se reintentó para no volver a tumbar la sesión); sospecha fuerte de diálogo modal de import bloqueando el CEP.
**Contraste:** `create_sequence` (H-06) y `create_sequence_from_preset` sí fallan rápido con presets inexistentes.

---

## H-05 (BUG NUEVO — issue #714) — `create_sequence` falla con un preset válido que `create_sequence_from_preset` crea sin problema

**Pasos:**
1. `create_sequence {"name":"SecVertical","preset_path":"C:/Program Files/Adobe/Adobe Premiere Pro 2026/Settings/SequencePresets/HD 1080p/HD 1080p 25 fps.sqpreset"}` (archivo EXISTS en disco) → `Error: Failed to create sequence from preset: <ruta>`
2. Mismo preset vía `create_sequence_from_preset {"preset_path":…,"name":"SecVertical"}` → `created: true, id: 8f404ce3-…, undoStackIndex: 3`
3. `create_sequence {"name":"SecDefault"}` (sin preset) → funciona, usa `UHD (4K) 2160p 25 fps` por defecto y `verified: true`

**Además:** con un preset que NO existe, `create_sequence` da el mismo error opaco `Failed to create sequence from preset` (no distingue "no encontrado" — a diferencia de `create_sequence_from_preset`, que sí dice `Preset file not found: …`).
**Esperado:** que `create_sequence` con `preset_path` cree la secuencia (o al menos un error preciso).
**Reproducible:** 100%.

---

## Observaciones menores (sin issue individual)

- **`get_export_file_extension`** no devuelve la extensión que promete: con el preset H264 Match Source y SecVertical activa respondió solo `{"sequenceName","presetPath"}` — sin campo de extensión. (Relacionado lejano: #275 mencionaba otro fallo de esta tool, cerrado.)
- **Color de marcador no verificable:** `add_marker`/`update_marker` aceptan `color` numérico, pero ni el readback del update ni `list_markers` devuelven el color → imposible verificar por API.
- **`set_metadata` con nombre de campo sin cualificar:** `field_name:"Description"` → `Error: Premiere did not return the requested field value after the write` (confuso, no sugiere el nombre cualificado). Con `field_name:"Column.PropertyText.Description"` funciona y verifica (`field_value_readback`).
- **Rangos no documentados en errores:** `set_clip_opacity 150` / `-10` → `Error: Could not set opacity` (no nombra el rango válido 0–100).
- **Enums no listados en errores de validación:** `create_caption_track` (`data/action must be equal to one of the allowed values`) y `preview_edit_plan` (`operations/0/type must be equal…`) no enumeran los valores válidos — tuve que sondear (`action:"import"`, `type:"remove_clip"`). Violación del criterio F13 "mensaje que nombre los argumentos válidos".
- **`duplicate_clip` reporta `undoSteps: 5`** para una sola operación (cosmético).
- **Stills con timecode base 1 h:** el PNG importa con `inPointSeconds: 3600 / outPointSeconds: 3605` (cosmético, comportamiento de Premiere).

---

## Verificado SIN hallazgo (comportamiento correcto o explicado)

- **Insert en pista superior desplaza material de V1/A1:** insertar PNG en V2 @0 desplazó el vídeo (0–10 → 5–15) y el audio (10–15 → 15–20). NO es bug: es semántica de insert con sync-lock, que la doc de `add_to_timeline` declara explícitamente ("ripple QE sync-locked tracks to match Premiere's insert"). Verificado en 2 secuencias distintas y aislado por adición incremental.
- **F4 efectos es-ES (zona arreglada):** `apply_effect "Desenfoque gaussiano"` (QE byName, matchName `AE.Impact_Blur_FX`) → `remove_effect_by_name` → `verified: true`, remaining `[Opacidad, Movimiento]`. Audio: `apply_audio_effect "DeEsser"` → `remove_all_effects` → remaining `[Volumen, Volumen del canal]`. Sin regresiones.
- **F5 títulos:** `add_title` con `textChecks` `template_verified` (texto verificado contra el .mogrt importado); el texto NO es legible de vuelta desde el clip — `get_mogrt_component` falla honesto nombrando los built-ins (`Opacidad, Movimiento, Movimiento del vector, Texto`).
- **F10 tokens:** token alterado rechazado (`Confirmation token does not match this edit plan`); token exacto aplicado y verificado.
- **F11 undo/redo:** undo/redo/multiple_undo con índice correcto verifican pila (32→31→32→29); con índice erróneo fallan a cierre con mensaje preciso (`Premiere's undo stack is at 31, not the expected 99`). Los receipts declaran honestamente que solo verifican posición de pila, no timeline (verifiqué la timeline por mi cuenta: el undo restauró el clip).
- **F12 render:** con backslashes: jobId + `queueBatchStart: "started"`; archivo renderizado en ~10 s; ffprobe: h264, 720×1280, 25/1 fps, 20.0 s exactos (coincide con SecVertical). Audio PCM 24-bit.
- **F13 correctos:** ID de clip inexistente (`Clip not found: deadbeef`), secuencia inexistente (`Sequence not found`), argumentos desconocidos SIEMPRE nombran los válidos, tool inexistente falla a nivel helper.
- **Metadata/XMP/marcadores/loudness/scopes:** `normalize_loudness_file` -21.75 → -16.0 LUFS verificado con remeasure; `inspect_media_streams` y `read_video_scopes` correctos; `add_marker`/`update_marker`/`list_markers` con readback de nombre/comentarios OK.

## Matriz de cobertura por familia

| Familia | Tools probadas (principales) | Resultado |
|---|---|---|
| Proyecto | ping, create_project, open_project, save_project, list_project_items, find_project_item_by_name, get_project_info | OK |
| Import | import_media (4), find_items_by_media_path no | OK / **H-04 hang** |
| Secuencias | create_sequence_from_preset (3), create_sequence (3), set_sequence_settings, get_sequence_settings, set_active_sequence | OK / **H-05** |
| Montaje | add_to_timeline (5), move_clip, trim_clip, split_clip, slip_edit, set_clip_duration, duplicate_clip, remove_from_timeline, get_sequence_structure, get_clip_properties | OK / **H-03** |
| Efectos es-ES | apply_effect, apply_audio_effect, remove_effect_by_name, remove_all_effects, list_clip_effects | OK (sin regresión) |
| Títulos | list_stock_titles, add_title, get_mogrt_component | OK (limitación documentada) |
| Marcadores/metadata | add_marker, update_marker, list_markers, set_metadata, get_metadata, get_xmp_metadata | OK (menores) |
| Captions | create_caption_track, read_sequence_captions, check_caption_safe_zone | OK (honesto fail-closed) |
| Audio | adjust_audio_levels, add_audio_keyframes, set_clip_volume, get_clip_volume, set_effect_property, normalize_loudness_file | **H-01** / resto OK |
| Análisis | inspect_media_streams, read_video_scopes, ffprobe externo | OK |
| Edición compuesta | preview_edit_plan, apply_edit_plan (token OK/alterado) | OK |
| Undo/redo | undo, redo, multiple_undo (índice OK/erróneo) | OK |
| Export | get_encoder_presets, get_export_file_extension, add_to_render_queue, verify por ffprobe | **H-02** / render OK |
| Robustez | 10+ sondas malformadas | **H-04** + menores |
