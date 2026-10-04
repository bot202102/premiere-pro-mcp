# PROMPT — Agente de Pruebas · Ronda 12 (audio v3 + transiciones + Higgsfield round-trip)

Eres el agente de QA de la Ronda 12 del proyecto "mcp premiere". Build: fork
`bot202102` **sec/1.19.0-8** (describe_tool + transiciones con alignment/handles +
renderHonesty corregido + driver audio v3 + guard #772).

## FILOSOFÍA (misma de R10/R11)

1. **Piso de regresión** (mecánico): piso R11 (hallazgos-r11.md (a)) + 3 nuevos
   (describe_tool, transiciones alignment/handles, renderHonesty texto corregido).
2. **Deudas time-boxed**: audio ×55 con driver v3 (cierre esperado).
3. **Round-trip Higgsfield + exploración** (el resto). El hallazgo mayor de R11
   (fades no honrados) fue CORREGIDO POR DIAGNÓSTICO: era el exportador de frames
   QE, no el render — el H.264 SÍ honra las curvas (verificado por frame en R11
   post-triage). Esta ronda lo confirma por render y lo ejercita en producción.

## REGLAS DURAS — infringir una invalida toda la ronda

1. Exclusivamente `C:\Users\rpach\Videos\stress4\stress4.prproj`. "Publi PK" y
   cualquier proyecto de producción: PROHIBIDO tocar.
2. NO hagas git add/commit/push, NO crees ni comentes ni cierres issues.
3. Nunca actives `unsafe-script`. Nunca edites `~/.codex/config.toml`.
4. Evidencia en `C:\Users\rpach\Videos\stress4\runs\r12-*` + `hallazgos-r12.md`.
5. Fixture de salida: CromaTest V1/clip0 = `bg_grad` **0–8 s** (verifica
   `startSeconds`), Opacidad 100 estática, sin residuos, guardado.
6. Detener driver/cola = tree-kill del PID del node; background = `SESSION_DETACHED=1`.
7. **REGLA DE VERIFICACIÓN DE VALORES ANIMADOS: NUNCA uses capture_frame** —
   evalúa keyframes mal (pre-key hasta snap). Verifica SIEMPRE contra el MP4
   renderizado (ffmpeg por frame). capture_frame solo sirve para estados estáticos.

## ENTORNO

- Repo: `C:\Users\rpach\AppData\Local\Temp\mcp-audit-premiere\repo`.
- Harness: `node "C:\Users\rpach\OneDrive\Desktop\Organizado\Proyectos IA\mcp premiere\tools\session-run.js" <cola.json>`
- **NUEVO**: `describe_tool {tool_name}` devuelve descripción + schema + resumen de
  campos + contractNotes curadas (semántica aprendida R1-R11: audio 0.5=0dB,
  TV→add_keyframe, caché de capture_frame, nombres localizados es-ES, ids de
  timeline vs projectItem, formas de placements/word_timeline) + globalNotes.
  **ÚSALO ANTES DE TANTEAR** cualquier tool con forma no verificada.
- **NUEVO**: `add_transition` acepta `alignment` (center|start|end) y el receipt
  lleva `handles {outgoingTailFrames, incomingHeadFrames}` + outcome
  `verified_with_deviation` si los handles recortan.
- `ffmpeg`/`ffprobe` en PATH. **En MP4 renderizado: negro ≈ YAVG 16-17, clip vivo
  ≈ 75-84. En PNG de capture_frame: los valores animados SON INVISIBLES.**
- Fixture de voz: `media-r7\voz_es_r7.wav` + frase exacta en `voz-texto.txt`.
- Fixture Higgsfield: el paquete de efectos/transiciones instalado en el host es
  100% Adobe es-ES — si el usuario instala un paquete de terceros durante la ronda,
  se abre la línea "terceros" (ver Fase X).

## FASE 0 — Arranque canónico (OBLIGATORIO: panel debe cargar 1.19.0-8)

1. Mata Premiere → barrida de zombis (node 'premiere-pro-mcp' sin sesión viva).
2. Server ARRIBA primero → abre Premiere con stress4.
3. Primera cola `wait_ms ≥ 30000`.
4. Verificación de entrada: `get_uxp_state` backend uxp; captura t=4 → YAVG ≈ 84;
   `tools/list` → **480** (479 + describe_tool); `describe_tool
   {tool_name:"add_transition"}` → contractNotes presentes.

## FASE R — Piso de regresión R12 (piso R11 + 3 nuevos)

Ejecuta el piso R11 (hallazgos-r11.md (a)) MÁS:
- R.11 **describe_tool**: schema + contractNotes de `automate_effect_parameters_uxp`
  (debe mencionar "0.5 = 0 dB"); nombre erróneo → error con sugerencias.
- R.12 **transiciones**: `add_transition` acepta `alignment`; receipt con `handles`.
- R.13 **renderHonesty texto corregido**: el receipt de `set_interpolation` dice
  "capture_frame (QE exportFramePNG) does NOT evaluate keyframed values" (el texto
  viejo decía "render has a reported render gap" — INCORRECTO, el render SÍ honra).

## FASE A — Audio ×55 con driver v3 (cierre de la deuda D.1)

`node sec-tools\r8-effect-sweep.cjs --audio --preset "C:/Program Files/Adobe/Adobe Media Encoder 2026/MediaIO/systempresets/3F3F3F3F_574D5620/HD 720p 24.epr"`
- v3: espera cola AME inactiva + tamaño estable ×2 antes de volumedetect; limpieza
  por diff contra baseline GLOBAL; rutas set_value→add_keyframe por semántica TV.
- Criterio: Δ max_volume ≥ 3 dB vs fuente (−4.9 dB) = renderiza.
- Referencia R11: 59/61 movs standalone (EQ −6.9/−8, filtros −44/−62, reverbs −73/−85).
- Si un flujo falla: parchea TU copia local y documenta.

## FASE B — Transiciones (verificación live completa)

Necesitas 2 clips con handles de sobra (deja 2+ s de media extra por lado):
1. `add_transition` Cross Dissolve localizado →
   **"Disolución cruzada (heredado)"** (nombre LOCALIZADO, #674-family) 0.5s center
   → `verified:true` + `handles` + `durationMatched:true`.
2. `alignment:"start"` y `"end"` (en CORTOS DISTINTOS o tras limpiar) → receipt
   `alignment` refleja el valor; posición verificable por get_track_info.
3. **Caso handle-limitado**: quita media de un lado → transición 1.2s → esperado
   `outcome:"verified_with_deviation"` + `deviation` explicando los handles.
4. Negativos F-A: nombre en inglés "Cross Dissolve" → error honesto; cut sin borde →
   error que enseña get_track_info.
5. `add_transition_to_clip` con nombre localizado (start/end/both).

## FASE C — Higgsfield round-trip (IA genera → fork termina)

Higgsfield es una extensión CEP instalada (`ai.higgsfield.cep`) que importa sus
generaciones DIRECTO al proyecto activo. Tu parte:
1. Pide al usuario (una sola vez, por el canal de la sesión) que genere UN clip
   desde su panel Higgsfield — o usa el último generado si ya hay uno en el bin
   (busca items creados recientemente: `list_project_items` / get_project_info).
2. Cuando el clip de Higgsfield esté en el proyecto: móntalo por UXP
   (`edit_timeline_uxp`), aplica color nativo, y síguele el flujo del mix-ruta.
3. Verifica: el clip generado por IA se comporta como cualquier media
   (inspect, timeline, render).
4. Documenta: nombre del item, duración, qué tools aplicaron limpio.

## FASE D — Mix-ruta producción completa (la receta final medida)

Un flujo SOLO, cronometrado por tramo:
1. Secuencia 720×1280 → 2 clips de `media-r7` por UXP.
2. Color nativo + transición (Fase B) + markers por beats (`musica_beats_r7.wav`).
3. Captions del transcript es-ES (voz TTS ya transcrita — R11; si el fixture
   persiste, usa `get_clip_transcript_uxp`; si no, re-transcribe).
4. Render por CEP `add_to_render_queue` (auto-start del fork) → ffprobe (h264
   720×1280, duración) + 2 frames del MP4 (¿color, transición, caption visibles?).
5. Cronometra: ingest / edición UXP / color / captions / render / verificación.
6. **Veredicto**: ¿la receta de producción funciona de punta a punta sin UI?

## ENTREGABLES

1. `hallazgos-r12.md`: piso R12 heredable; audio ×55 tabla; transiciones con
   receipts; Higgsfield round-trip; mix-ruta con el MP4; menores; sin-probar.
2. Evidencia `runs/r12-*` + MP4 de producción.
3. Fixture canónico + guardado + estado final del puente.

NO preguntes al usuario: adapta y sigue. Bug del fork → hallazgo con repro;
no lo arregles tú.
