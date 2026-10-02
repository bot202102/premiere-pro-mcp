# Ronda 7 — Superficies de PRODUCCIÓN de shorts

> Objetivo: cubrir lo que la R6 dejó abierto y lo que ninguna ronda tocó, orientado al
> pipeline real (720×1280, diálogo + música + subtítulos + color). Base: sec/1.18.6-22
> (point params arreglados y verificados; ruta nativa renderiza efectos — PSNR 42–45 dB en R6).
> Fixtures nuevos en `C:\Users\rpach\Videos\stress4\media-r7\`:
> `croma_r7.mp4` (verde 0x00B140 + caja blanca móvil, 6s) · `musica_beats_r7.wav`
> (kick 120 BPM exactos, 30s) · `voz_es_r7.wav` (TTS es-ES Helena, frase conocida).

## S1 — Color y efectos productivos (post-fix R6)

Preguntas: ¿`set_color_value` funciona end-to-end sobre un parámetro de color real?
¿Ultra Key (croma) se aplica por nativa y RENDERIZA (PSNR)? ¿Los presets/copias de
efectos entre clips funcionan?

- Importar `croma_r7.mp4` (vía `import_project_media_uxp` — prueba además el ingest nativo).
- `manage_clip_effects_uxp add` → `AE.ADBE Ultra Key` sobre el clip croma; `automate_effect_parameters_uxp` inspecciona sus params (¿expone color key? — recordar que Tint expuso `null`: documentar la forma de Ultra Key).
- `capture_frame` (CEP, renderer vivo) antes/después → PSNR; el blanco debe seguir visible y el verde puede keyed o no (ambos resultados son hallazgo válido — lo que se mide es que el efecto ALTERA píxeles).
- `copy_effects_between_clips` (CEP) entre dos segmentos del croma → verificación por `inspect`.
- Criterio VERDE: receipts honestos + PSNR finito tras aplicar. Fail-closed honesto si el param de color del key no es legible (patrón Tint ya conocido).

## S2 — Keyframes programáticos (Ken Burns) — la superficie que R6 dio por bloqueada y el fix 1.18.6-22 abrió

Preguntas: ¿`set_point_value`/`add_keyframe` sobre Motion (Posición PointF + Escala escalar)
construye un Ken Burns verificable? ¿Los keyframes sobreviven render (frame a t0 vs t1 distinto)?

- `automate_effect_parameters_uxp` sobre Motion/Posición: `add_keyframe` en t=0 {x:0.5,y:0.5} y t=3 {x:0.55,y:0.45}; `inspect_keyframe` para readback.
- Escala (param escalar de Motion): `set_value`/`add_keyframe` 100→115.
- `capture_frame` t=0.2 y t=2.8 → PSNR > umbral (movimiento real).
- Negativo: `expected_keyframe_times_seconds` rancio → rechazo sin mutar.
- Criterio VERDE: keyframes leídos de vuelta + PSNR entre frames del zoom.

## S3 — Audio de shorts (beats, ducking, loudness)

Preguntas: ¿`detect_beats` encuentra los 120 BPM del fixture? ¿`apply_beat_markers_uxp`
los marca en la secuencia? ¿`setup_ducking` + `analyze_loudness`/`normalize_loudness_file`
cadenan sobre música+voz?

- Importar `musica_beats_r7.wav` + `voz_es_r7.wav`; secuencia con ambos (música A1, voz A2).
- `detect_beats` → anotar BPM/hits detectados (fixture = 2 Hz exactos).
- `apply_beat_markers_uxp` → `list_markers_uxp` verificación por GUID.
- `setup_ducking` (música bajo voz) → receipt + readback de keyframes de volumen en A1.
- `analyze_loudness` sobre la secuencia; `normalize_loudness_file` sobre el wav → ffprobe del archivo si toca.
- Criterio VERDE: beats ≈ 0.5 s de período, markers verificables, ducking con keyframes reales.

## S4 — Voz → transcript → captions (9:16)

Preguntas: ¿hay language pack es-ES? ¿`transcribe_clip_uxp` transcribe la frase TTS?
¿El pipeline captions (CEP) produce artefacto dentro de safe zone 9:16?

- `is_language_pack_available_uxp` (es-ES) → si no hay pack, documentar y saltar a captions manuales.
- `transcribe_clip_uxp` sobre `voz_es_r7.wav` → comparar contra la frase fuente (en `media-r7/voz-texto.txt`).
- `get_clip_transcript_uxp` + `search_clip_transcript_uxp` ("subtítulos") → hits.
- `plan_transcript_rough_cut_uxp` / `plan_filler_word_removal` (CEP plan) → solo preview, sin apply destructivo.
- Captions CEP: `create_caption_track` + `build_caption_artifact` + `check_caption_safe_zone` (720×1280).
- Criterio VERDE: transcript ≥ 80% de palabras de la frase; captions dentro de safe zone.

## S5 — E2E "short completo" (la receta de producción de punta a punta)

Preguntas: ¿la receta documentada (montaje+color nativo, render CEP) produce un MP4 válido
sin intervención manual?

- Nueva secuencia 720×1280@24 (CEP `create_sequence_from_preset` o nativa `create_empty_sequence_uxp`+settings).
- Importar 2-3 clips de `media-r7` + montaje nativo (`edit_timeline_uxp` insert/overwrite).
- Color nativo (S1) + Ken Burns (S2) sobre los clips.
- Captions (S4) si hubo transcript; si no, título (`add_text_overlay` CEP).
- Render: `add_to_render_queue` (CEP, auto-start del fork) → `encode_media_uxp wait`/AME no disponible en nativa; esperar job.
- Verificación final: ffprobe del MP4 (h264, 720×1280, duración) + `capture_frame`/extracto para ojo humano + `save_project_uxp`.
- Criterio VERDE: MP4 reproducible con color y movimiento visibles; proyecto guardado; sin residuos.

## Reglas (idénticas a R6)

Proyecto desechable stress4 únicamente · sin repo-push-issues (solo reportar) · una cola
a la vez, toda cola abre con `{"wait_ms":8000}` · sin unsafe-script · evidencia cruda en
`runs/r7-*.json` + `hallazgos-r7.md` con veredictos VERDE/honesto-falla/FALLO y repro.
`ffmpeg`/`ffprobe` en PATH para PSNR/validaciones. Ajusta fixtures si el pipeline lo pide
y documenta el ajuste.
