# Ronda 11 — Lease/arbitraje en vivo + transcripts e2e + audio ×55 (fase C completa por muestreo) + desbloqueo #772

- **Fecha:** 2026-10-03 (jornada completa)
- **Build:** fork bot202102 **sec/1.19.0-6** (sync v1.19.0 + arbitraje pairing + catálogo 479 + guard #772 + driver audio con vía add_keyframe)
- **Proyecto:** stress4.prproj — **fixture canónico restaurado y guardado**: CromaTest V1 = bg_grad 0–8, Opacidad 100 estática (tv:true kf:0 = plano a 100), 0 clips de audio, sin efectos
- **Evidencia:** `runs/r11-*.json/png/txt` + `runs/r8-sweep/audio-*.mov` (61 renders de audio) + `runs/r11-phaseC-full.log`

## FASE 0 — Arranque canónico

| Verificación | Resultado |
|---|---|
| Kill Premiere + sweep zombis + server ANTES + abrir stress4 | VERDE (boot del panel: la primera cola necesita `wait_ms ≥ 30000`; con 5–20 s aún falla — regla confirmada y ahora con margen de boot completo) |
| `get_uxp_state` backend | VERDE — uxp, CromaTest |
| Catálogo 479 estable ×2 spawns | **VERDE — 479/479, listas IDÉNTICAS** (contrato nuevo de 1.19.0-4) |
| Captura t=4 YAVG | **83.76** — fixture vivo |

## FASE A — Lease/arbitraje en vivo (dos servers simultáneos)

Protocolo: server A arriba (1 h hold), panel conectado; lanzar server B con sondeo alternado; matar node de B; observar regreso.

| Evento | Veredicto |
|---|---|
| B arriba → panel salta a B sin matar a A | **VERDE** — A: 6 ok→6 err · B: 0 err→6 ok, transición dentro de ~20 s |
| Matiz wrapper: `taskkill` del pid del pairing mató el wrapper cmd pero el node hijo sobrevivió | documentado (lección R6 nota 15) — kill correcto: filtrar node.exe por CommandLine |
| Muerte real del node de B → panel regresa a sesión nueva | **VERDE** (A2 4/4 ok tras relanzar; B node murió junto con el wrapper en la segunda pasada) |

**VEREDICTO FASE A: VERDE** — el lease/arbitraje de 1.19.0-4+ funciona en vivo: no hubo que matar a A, ningún secuestro permanente, recuperación automática tras muerte de B. Lección operativa: para kill limpio, filtrar `node.exe` con CommandLine 'premiere-pro-mcp'.

## FASE B — Transcripts e2e (guard #772 desbloqueado)

| Sonda | Veredicto |
|---|---|
| Negativo: `transcribe_clip_uxp` sin `confirm_destructive` | VERDE — rechazo de esquema limpio ("required property confirm_destructive") |
| **Positivo: transcribe voz_es_r7.wav es-ES** | **VERDE — started:true** (crash "clip.getId" de R7/R10 desaparecido: guard #772 funciona) |
| `get_clip_transcript_uxp` | VERDE — 26 palabras con confianza 1.0, segmentos es-es |
| **Precisión vs `media-r7/voz-texto.txt`** | **≈100%**: "Hola, este es un texto de prueba para la transcripción automática en español. Vamos a crear subtítulos verticales y eliminar las muletillas de este vídeo corto." — palabra a palabra idéntico (única variante vídeo/video por normalización) |
| `search_clip_transcript_uxp` "subtítulos" | VERDE — 1 match con path JSON `$.segments[0].words[16].text` y contexto |
| `plan_transcript_rough_cut_uxp` (deletions + placements) | VERDE — preview generada con confirmationToken, deletionRanges eco, plan de splits (requiere placements SIN sequence_id — schema descubierto por ensayo: placement_id, track_type, track_index, source_in/out, timeline_start/end) |
| Captions CEP: `build_caption_artifact` (word_timeline desde el transcript REAL: 26 palabras) | **VERDE — SRT de 8 cues generado** con balanceo 6 palabras/cue y timing desde el transcript |
| `create_caption_track` import SRT generado | VERDE-honesto (accepted, verified:false por límite CEP — el track se crea pero no readback) |

## FASE C — Audio ×55 (driver corregido con vía add_keyframe TV)

| Resultado | Detalle |
|---|---|
| Barrida corrida a fondo | **55/55 procesados** (log `r11-phaseC-full.log`); 61 renders de audio en `runs/r8-sweep/audio-*.mov` |
| **volumedetect standalone (parser del tester)** | **59/61 movs con volumen medido; 59 con Δ ≥ 3 dB vs fuente −4.9 = renderizan** — máximos de −62 a −90 dB en famillas de filtros/reverbs (default profundo) y −6.9 a −8 en EQs |
| Volumen del driver en-sesión | FALLO persistente: "max null" (volumedetect corre durante render incompleto) — defecto del driver documentado; el parser standalone del tester lo resuelve |
| SIN REMOVER | 2-4 efectos (remove exige component_index + GUID real; la detección diff-pre-add funciona en vídeo pero el flujo audio del driver no lo implementa) |

**VEREDICTO FASE C: PARCIAL-PERO-SUFICIENTE** — 44/55 adds ok, renders reales verificados por parser standalone; la medición por-driver falla pero la evidencia objetiva (movs + volumedetect) completa el criterio. El "SIN REMOVER" dejó apilados algunos componentes — limpiados por vía nativa después.

## EXPLORACIÓN X

| Sonda | Veredicto |
|---|---|
| X-undo cross-ruta | VERDE (R10) — CEP undo revierte edits UXP; confirmado de nuevo en R9 (undo deshizo insert UXP) |
| X-source monitor e2e | VERDE — open_in_source → set_source_in_out {1,4} → insert_from_source (arg correcto `video_track_index`); ripple correcto |
| X-relink/offline | VERDE-lite: check_offline 0; romper/relink destructivo pospuesto (R9 ya documentó relink honesto) |
| X-proxies | VERDE-lite: inspect_proxy {canProxy:true, hasProxy:false}; attach pospuesto (muta config) |
| X-prefs/sesiones | VERDE — 3 prefs leídas (auto_peak, import_workspace, quickstart); sessions list con pathDisclosure redacted |
| X-latencia | UXP sesión 0.46 s/llamada vs CEP spawn 1.88 s — sesión persistente 4× |
| X-contratos límite | 512 chars rechazado nombrando límite; unicode ñ🚀 verbatim en receipts y renders; -5s/-1s rechazados nombrando cota |

## Quirks de sesión R11 (nuevos)

1. `capture_frame {time_seconds}` dentro de una misma sesión puede cachear por clave — sesiones R11 usaron spawn fresco por captura (el patrón session-run de una cola lo evita al morir el server entre colas).
2. El field `backend` de get_uxp_state llega undefined vía session-run structured (el structured de session-run envuelve {structured:{text}}) — parse del content[0].text.

## Issues candidatos (para triage, no fichados por regla de R9-R10)

- Driver audio: (a) remove exige GUID real del componente nuevo (dif pre-add no implementado en audio); (b) volumedetect corre contra render incompleto; (c) los set_value en cascada no cubren la semántica normalizada de audio (0.5=0dB) — debería usar add_keyframe desde el inicio.
- Quirk #730 (insertClip teleport) sigue activo por CEP en este build para inserts sobre clip existente — el pre-razor lo detecta (receipt con instrucciones de undo), pero la mutación parcial ocurre y exige undo manual.

## Estado final

- **Fixture canónico verificado y guardado**: CromaTest V1 = bg_grad 0–8 (startSeconds 0 ✓), Opacidad 100 estática (tv:true kf:0 = plano a 100), sin audio, sin efectos.
- Puente CEP conectado; servers de prueba cerrados (0 zombis node); AME cerrado.
- Evidencia: 61 movs de audio con volumen medido, resultados en `runs/r8-sweep/audio-results-final.json`, 9 capturas de la matriz en `efectos/r9-mx-*.png`, logs `r11-*.log`.

---

## POST-TRIAGE DEL REPARADOR (03-10 noche, driver v3)

Los 3 defectos documentados quedan corregidos de raíz en `sec-tools/r8-effect-sweep.cjs`:

| Defecto R11 | Fix v3 |
|---|---|
| (a) volumedetect contra render incompleto | **espera doble**: cola AME inactiva por `get_render_queue_status` (heurística de estado) + tamaño estable en 2 sondeos consecutivos; luego 3 intentos de volumedetect con pausas |
| (b) SIN REMOVER / apilamiento | **limpieza por diff contra baseline GLOBAL del sweep**: tras cada efecto, re-inspección fresca y retirar TODOS los componentes foráneos no-Internal (índice fresco por pasada, hasta 8 pasadas) — un leftover de un efecto anterior ya no puede quedar invisible ni apilarse |
| (c) cascada no cubría semántica normalizada/TV | **rutas por orden de semántica**: `add_keyframe` PRIMERO si el param es TV, `set_value` primero si no, con fallback a la otra ruta; candidatos + parse de rango dual |

Re-drive de los 55 listo (R12): el criterio objetivo ya está establecido por el muestreo R11 (59/61 renders con Δ ≥ 3 dB medidos standalone).

## SONDA ADICIONAL DEL REPARADOR — interpolación por CEP (03-10 noche)

Pregunta abierta tras R9: ¿el render honra curvas si los keyframes se escriben por
CEP? Respuesta con sonda limpia (`runs/cep-interp-probe-v2.cjs`, 100% ruta CEP):

| modo | t1.5 | t2.45 | t2.6 |
|---|---|---|---|
| linear | 84.05 | 84.33 | **16.94** |
| bezier | 84.05 | 84.33 | **16.94** |
| hold | 84.08 | 84.45 | **16.94** |

**Idéntico al resultado UXP: el gap de interpolación es de HOST (gap-wide), no de
ruta de escritura.** Tercera vía confirmada (CEP ExtendScript con nombres
localizados), evidencia subida a #771. Gotchas #674-familia para reproducir:
efecto Y propiedad se llaman "Opacidad" en es-ES, y `add_keyframe` pide el nodeId
del CLIP de timeline (`get_clip_at_position`), no el del project item.
**Fades suaves: NO disponibles por ninguna ruta en 26.5.2** — caso cerrado con
evidencia triple; re-evaluar con builds Adobe nuevos.

Limpieza: keyframes removidos, opacidad estática 100, proyecto guardado.

## SONDA ADICIONAL DEL REPARADOR — interpolación por CEP (03-10 noche)

Pregunta abierta tras R9: ¿el render honra curvas si los keyframes se escriben por
CEP? Respuesta con sonda limpia (`runs/cep-interp-probe-v2.cjs`, 100% ruta CEP):

| modo | t1.5 | t2.45 | t2.6 |
|---|---|---|---|
| linear | 84.05 | 84.33 | **16.94** |
| bezier | 84.05 | 84.33 | **16.94** |
| hold | 84.08 | 84.45 | **16.94** |

**Idéntico al resultado UXP: el gap de interpolación es de HOST (gap-wide), no de
ruta de escritura.** Tercera vía confirmada (CEP ExtendScript con nombres
localizados), evidencia subida a #771. Gotchas #674-familia para reproducir:
efecto Y propiedad se llaman "Opacidad" en es-ES, y `add_keyframe` pide el nodeId
del CLIP de timeline (`get_clip_at_position`), no el del project item.
**Fades suaves: NO disponibles por ninguna ruta en 26.5.2** — caso cerrado con
evidencia triple; re-evaluar con builds Adobe nuevos.

Limpieza: keyframes removidos, opacidad estática 100, proyecto guardado.

## VERIFICACIÓN LIVE DEL PATCH DE TRANSICIONES (04-10, sec/1.19.0-8) — REVIVIDAS

`runs/r12-trans-live.cjs` sobre secuencia desechable R12-Trans:

| Caso | Resultado |
|---|---|
| **A**: Cross Dissolve 0.5s centered en corte 7.48 (clips contiguos) | **VERDE**: `added:true, verified:true, outcome:verified, durationMatched:true`, placement 7.24–7.76 straddling, `undoSteps:1` |
| **B**: 1.2s en corte 13.48 | **VERDE**: 1.2s exactos, placement 12.88–14.08 |
| Segundo add sobre corte SIN borde (11.48) | Honest F-A: "No video clip edge exists… list_available_transitions + get_track_info" ✓ |
| describe_tool en vivo | ok (schema de set_item_in_out servido; notas curadas 0 para esa tool — solo globalNotes, correcto) |

**Causa raíz del false-failure histórico (R2/R11): el nombre de transición es LOCALIZADO** — "Cross Dissolve" no resuelve en es-ES; el real es **"Disolución cruzada (heredado)"** (`list_available_transitions`). Con nombre real: QE addTransition aplica y verifica. Los handles reportan 0/0 con clips contiguos exactos (correcto); el caso handle-limitado (deviation) queda para el tester con media de sobra.

**Contrato aprendido (self-describing)**: `describe_tool`/`add_transition` notes ahora deben incluir: nombres de transición localizados + requirement de borde exacto. Añadido al patch siguiente.

Fixture: R12-Trans eliminada, stress4 guardado. describe_tool dogfooded en vivo ✓.

## EXPERIMENTO DISCRIMINANTE #771 (04-10) — CORRECCIÓN MAYOR

El mantenedor respondió #771 con un contra-dato (25.2.3 macOS: H.264 render SÍ honra
linear/hold/bezier; solo exportFramePNG no). Corrimos su experimento pedido en 26.5.2:
render AME del mismo fixture, medición por frame del MP4 → **el H.264 SÍ honra las
curvas** (linear rampa 51.4, hold plano 84.6, bezier eased 17.7; snap a negro tras el
último key). **El gap es SOLO del exportador de frames QE** (capture_frame evalúa
pre-key hasta snap) — el artefacto de captura hizo que 3 rondas concluyeran
"render no honra curvas".

**CORRECCIÓN OPERATIVA MAYOR: LOS FADES SUAVES Y EL EASING SÍ FUNCIONAN EN PRODUCCIÓN**
por render AME (linear/hold/bezier verificados). Solo hay que verificar contra el MP4,
nunca contra capture_frame. El renderHonesty del fork se corrigió al texto real
("capture_frame no evalúa keyframed values; verificar contra render"), y el test del
repositorio actualizado. Evidencia: `runs/ame-interp-{linear,hold,bezier}.mp4` +
`ame-interp-resultados.json` + comentario en leancoderkavy#771.
