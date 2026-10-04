# Ronda 7 — Producción de shorts (color/croma, Ken Burns, audio, transcript, E2E)

- **Fecha:** 2026-10-02 (noche)
- **Build:** fork bot202102 **sec/1.18.6-22** (point params arreglados)
- **Proyecto:** stress4.prproj — fixture CromaTest restaurado a canónico (`bg_grad 0–8 en V1`) y guardado; secuencia R7Short quedó vacía (residuo cero, evidencia = MP4)
- **Evidencia:** `runs/r7-*.json` + `efectos/r7-*.png` + **`export/r7short.mov`** (720×1280, h264+PCM, 25 fps)

## S1 — Color y croma productivo

| Sonda | Veredicto |
|---|---|
| `import_project_media_uxp` (ingest nativo) | honesto-falla: "host does not support UXP command 'project.import'" → fallback CEP (fixture) |
| `manage_clip_effects add` Ultra Key (nativo) | **VERDE** — componente real (27 params, visible en inspect estándar) |
| **Color de clave de Ultra Key** | **NO EXPUESTO** — los 27 params son Salida/Ajuste/Generación de mate/Limpieza/Supresión/Corrección de color (grupos); el swatch de color clave no existe como parámetro (patrón Tint-null) ⇒ no ajustable a 0x00B140 |
| **¿Ultra Key altera píxeles?** | **SÍ — VERDE**: `Salida` compuesto→alfa ⇒ PSNR 8.08 dB y **frame alfa: verde→negro (keyeado), caja blanca→blanca**. El default de Ultra Key KEYEA el verde del fixture |
| `copy_effects_between_clips` (CEP) 3 efectos → 2º segmento | VERDE (verified, 3 copiados; Ultra Key confirmado en clip 1 por inspect nativo) |

## S2 — Keyframes Ken Burns (fix -22)

| Sonda | Veredicto |
|---|---|
| `add_keyframe` con value PointF (objeto) | honesto-falla: schema exige value escalar (limitación de esquema) |
| `inspect_point_value` (roto en R6) | **VERDE — ARREGLADO en -22**: devuelve snapshot {x,y} completo |
| `set_point_value` (estático) Posición | VERDE — valor (0.55,0.45) aplicado y leído de vuelta |
| `set_time_varying` | VERDE — tv:true con triple guarda (`expected_sequence_id` + `expected_time_varying` + `expected_keyframe_times_seconds`); guard rancio funcionó ("PointF parameter changed; inspect again") |
| **Keyframes de Posición (PointF con TV on)** | honesto-falla DEFINITIVA: "PointF updates support only non-time-varying parameters; **keyframed PointF edits are not exposed**" — el pan animado no es alcanzable |
| `add_keyframe` Escala (escalar) 100@0.2 / 115@2.8 | **VERDE** — readback tv:true, kf:2, times [0.2, 2.8] |
| **¿El zoom renderiza?** | **VERDE — medición física**: caja blanca **207 px con kf vs 180 px sin kf = 1.15×** exacto; diff-image muestra solo bandas de borde (zoom), no la caja |
| `remove_keyframe` con expected rancio ([0.2,2.8,9.9]) | **MENOR**: aceptado (removed:true) — el guard solo valida que el tiempo borrado exista; la lista completa no se valida |
| `remove_keyframe` limpio ×2 + remove sin nada | VERDE (removed true/false honestos) |

## S3 — Audio (beats, ducking, loudness)

| Sonda | Veredicto |
|---|---|
| `detect_beats` sobre `musica_beats_r7.wav` | **VERDE PERFECTO**: BPM 120, confianza 1.0, hits exactos 0/0.5/1.0… |
| `apply_beat_markers_uxp` (11 beats) | **VERDE** — 11/11 añadidos; `list_markers_uxp` verifica por GUID |
| `setup_ducking` (CEP) | **FALLO honesto**: "Audio key storage or clock could not be read; no automation was written" — sin escribir nada |
| **Workaround ducking vía UXP** (`add_keyframe` ×4 sobre `Internal Volume Mono/Nivel`) | **VERDE** — curva 0dB→−12dB→0dB con fades 0.3 s: kf [0.7, 1.3, 11.76, 12.36], cross-verificado por `get_keyframes` CEP (valores 1.0/0.2512 exactos) |
| `analyze_loudness` voz | VERDE — −20.8 LUFS, peak −2 dBFS |

## S4 — Voz → transcript → captions 9:16

| Sonda | Veredicto |
|---|---|
| `is_language_pack_available_uxp` es-ES | **VERDE**: available:true |
| `transcribe_clip_uxp` | **FALLO (bug)**: crash "clip.getId is not a function" tras resolver el item por nombre — repro estable con `{project_item_name:"voz_es_r7.wav", language:"es-ES", confirm_destructive:true, operation_id}` |
| transcript get/search | no ejercitados (no hay transcript: la transcripción crashea) |
| `voz-texto.txt` | **AUSENTE** del fixture (ni en media-r7 ni en el repo) — la comparación ≥80% no era ejecutable |
| `build_caption_artifact` | ya no está en el perfil -22 (herramienta movida/retirada) |
| `create_caption_track` import SRT | VERDE-honesto (accepted, verified:false por límite CEP) — **y RENDERIZA** (ver S5) |
| `check_caption_safe_zone` 720×1280 TikTok | VERDE — flagió solapes reales (rail derecho 10%, franja inferior 100%) y fue honesto al rechazar un rect fuera de frame |

## S5 — E2E "short completo"

| Paso | Veredicto |
|---|---|
| Secuencia 720×1280 (CEP preset + set_sequence_settings) | VERDE |
| Montaje nativo (insert croma vía selección única) | VERDE — `croma_r7.mp4@0-6` |
| Color nativo (Ultra Key) + Ken Burns (Escala kf 100→118) | VERDE (ambos aplicados y verificados) |
| Título `add_title` + captions import | VERDE |
| Render `add_to_render_queue` | VERDE con matiz: `queueBatchStart:"requested"` (no "started") — requirió `start_batch_encode` manual + AME lanzado; preset escribe .mov (el .mp4 pedido no aparece) |
| **Verificación final** | **VERDE — `export/r7short.mov`: h264 720×1280 @25fps + PCM; frames extraídos y verificados a la vista: captions renderizadas en zona segura ("Prueba de subtitulos R7" / "Ken Burns con croma nativo"), título "SHORT R7", Ken Burns progresando (caja crece t1→t3)** |
| Residuos | CromaTest restaurado a canónico; R7Short vacío; clon F5 eliminado; guardado |

## Issues candidatos (para triage del agente)

1. **transcribe_clip_uxp crash** "clip.getId is not a function" (26.5.2) — bloquea voz→texto.
2. **Ultra Key sin swatch de color** expuesto por API nativa (patrón Tint-null) — el croma funciona con defaults pero no apunta a colores arbitrarios.
3. **Keyframes PointF no expuestos** ("keyframed PointF edits are not exposed") — Ken Burns limitado a zoom escalar (pan imposible).
4. **`remove_keyframe` no valida la lista `expected_keyframe_times_seconds` completa** (acepta listas rancias con entradas inexistentes).
5. **`export_frame_uxp`/`import_project_media_uxp`/familia interchange+encoder no implementadas** en el panel 26.5.2 (honesto, pero deja el pipeline sin ingest/export nativos).
6. Menores: `add_to_render_queue` devuelve "requested" sin auto-start en este flujo; `voz-texto.txt` ausente del fixture; colas R7 con `mediaType` camelCase y sin `wait_ms` inicial.

## Estado final

- Puente UXP sano (último get_uxp_state OK), proyecto guardado.
- Fixture canónico restaurado: **CromaTest = bg_grad 0–8 en V1, 1 item** (insertado por ruta nativa).
- `export/r7short.mov` = entregable E2E verificado (720×1280 h264 + PCM, captions y título visibles, zoom Ken Burns).
- AME cerrado. R7Short vacío, "CromaTest copia" eliminada.

---

## ANEXO R8-lite (post-R7, misma sesión) — barrida de amplitud de efectos

Motivación: la pregunta "¿probaste TODOS los efectos?" — R7 cubrió el pipeline, no la amplitud. Barrida representativa:

| Efecto (nativo) | add | Render (PSNR vs baseline @2s) | Veredicto |
|---|---|---|---|
| AE.ADBE Mosaic | ok | 17.24 dB | **RENDERIZA** |
| AE.ADBE Twirl | ok | 17.24 dB | **RENDERIZA** |
| AE.ADBE Wave Warp | ok | 17.23 dB | **RENDERIZA** |
| AE.ADBE Drop Shadow | ok | 17.17 dB | **RENDERIZA** |
| AE.ADBE Replicate | ok | 17.53 dB | **RENDERIZA** |
| AE.ADBE Invert | ok | **5.89 dB** (inversión dramática) | **RENDERIZA** |

**Catálogo audio**: existe por displayName es-ES (0 matchNames): "Ecualizador paramétrico", "DeHummer", "Eliminador de chasquidos automático", "Reducción adaptativa de ruido", "Binauralizer"…

| Audio | Veredicto |
|---|---|
| add "Ecualizador paramétrico" nativo a clip de audio | VERDE (verified) |
| Params normalizados (ganancia 0.5 = 0dB; ±24dB ⇒ 0..1); params TV exigen add_keyframe (set_value rechaza con mensaje correcto) | VERDE (contrato) |
| Banda 1 activada + ganancia 0.95 (~+21dB) → **render 38s** | **VERDE — max_volume 0.0dB (clip) vs fuente −4.9dB; mean +6dB** — la cadena de audio renderiza |

### Interpolación / easing ("fade con aceleración")

| Sonda | Veredicto |
|---|---|
| add_keyframe Opacidad 100@0.5 / 0@2.5 (datos leídos de vuelta EXACTOS vía get_keyframes CEP) | VERDE (almacenamiento) |
| `set_interpolation` "linear"/"bezier" | esquema ok (enums minúsculas: linear\|hold\|bezier\|time) |
| Render: t1.25/1.5/1.75 ≈ 77–79 (brillante), **t2.45 = 81 (brillante pese a kf=0 @2.5)**, t2.6 = **0.00 (negro)** | **FALLO — la interpolación declarada NO se aplica al render**: la curva hace HOLD/snap (~100% hasta cerca del kf final y cae después), en vez de la recta 100→0. El "fade con easing" hoy NO es configurable por MCP |
| Implicación | El Ken Burns de R7 (Escala 100→118) probablemente también rinde HOLD (el 1.15× se midió EN el kf t2.8, no interpolado) |

### Hallazgos nuevos de este anexo
1. **Efectos de biblioteca: 6/6 renderizan** vía nativa (amplitud confirmada sobre muestra representativa; barrida completa de 108 pendiente pero el patrón es consistente).
2. **Interpolación de keyframes no aplicada al render** (linear/bezier declarados OK, render hace snap) — rompe fades con easing y Ken Burns suave.
3. **remove_keyframe/requiere component_index** (remove por effect_id no soportado; los índices bailan al remover en descenso — se requiere re-inspección entre removes).
4. **Audio FX**: catálogo es-ES por displayName; params normalizados; solo mutables vía add_keyframe si TV; **el render de audio sí aplica el EQ** (evidencia volumedetect).

### Limpieza
Clip canónico restaurado (Opacity+Motion solo), audio fuera, proyecto guardado, AME cerrado.
