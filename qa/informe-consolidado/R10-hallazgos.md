# Ronda 10 — Suelo de regresión + deudas + exploración abierta

- **Fecha:** 2026-10-03
- **Build:** fork bot202102 **sec/1.19.0-3** (lease F-OP-1 + renderHonesty + driver "audio completado")
- **Proyecto:** stress4.prproj — fixture canónico final: **CromaTest V1 = bg_grad 0–8, Opacidad 100 estática, sin efectos/audio** (los markers heredados de rondas previas persisten fuera de 8 s; el campo duration de get_sequence_structure los cuenta — nota menor). Guardado.
- **Evidencia:** `runs/r10-*`

---

## (a) SUELO DE REGRESIÓN R10 (piso que R11 hereda — re-ejecutar tal cual)

| # | Sonda | Esperado | Obtenido | Veredicto |
|---|---|---|---|---|
| R.1 | Captura t=4 del fixture | YAVG ≈ 84 | **84.01** | VERDE |
| R.2 | `edit_timeline_uxp` insert @2 en clip 0–8 | 0–2 \| 2–10 \| 10–16, cola pegada | **exacto** | VERDE |
| R.3 | Gamma add → set 25 → captura → PSNR | finito | **5.55 dB** (dramático) | VERDE |
| R.4a | `inspect_point_value` Motion/Posición | {x,y} numéricos | **{x:0.5, y:0.5}** | VERDE |
| R.4b | ídem sobre Opacidad | error ESPECÍFICO | **"Premiere parameter does not expose a point value"** (ya no el genérico "args must be an object") | VERDE (mejora vs R6) |
| R.5 | `set_interpolation` receipt | verified + renderHonesty | **campo `renderHonesty` presente** (ver sección D) | VERDE |
| R.6 | markers add + GUID inventado | add ok / rechazo sin mutar | **ambos** ("markerGuid was not found") | VERDE |
| R.7 | lease: sesión completa contra server vivo | sin "not connected" salvo arranque | 1 episodio (ver F-X.8, hallazgo operativo) | VERDE con nota |

**Piso R10 para R11:** YAVG 84.01 @t4 · insert layout 0–2|2–10|10–16 · Gamma PSNR ≈5.5 dB · Posición point {0.5,0.5} · Opacidad point error específico · renderHonesty string presente · marker GUID inventado → "markerGuid was not found".

## (b) Deudas cerradas

**D.1 Audio sweep (55): INTENTO FALLIDO — driver roto, deuda NO cerrada.**
- Repo-driver v"corregida": corre pero produce basura contra este host: 55/55 "clipIndex out of range" (fixture sin clip de audio — corregido recolocando música), luego con música: 2 adds, "set agotado p1..p24" (los params de audio no aceptan NINGUNO de los valores candidatos del driver: semántica normalizada 0.5=0dB + params TV exigen add_keyframe, conocido de R8-lite), "volumedetect sin dato tras retry" (mide mientras AME sigue escribiendo), "SIN REMOVER" (remove sin GUID real del componente).
- Parches aplicados a copia del tester (4): captura de pre-ids, remove por GUID real, volumedetect con estabilización por tamaño, loop continue+24. Suficientes para el flujo vídeo (R8), **insuficientes para audio** — el param-touch necesita vía add_keyframe y el remove necesita el GUID del componente nuevo (diff pre/post add), que el driver actual no hace.
- **Evidencia consolidada de que la cadena de audio SÍ rinde: 3/3 efectos medidos audibles** (manual, fuera del driver):
  - Ecualizador paramétrico +21 dB → max 0.0 dB clipping (R8-lite)
  - Agudos (add solo) → Δmax −3.0 dB (R9)
  - **Amplificación ganancia 0.95 (kf @1s) → max 0.0 dB clipping, mean −2.1 dB** (R10, `export/r10-amp.mov`)
- Cierre recomendado para R11: barrida audio manual semiautomática (add→add_keyframe 0.95→render→volumedetect→remove por GUID), ~90 s/efecto.

**D.2 renderHonesty: CERRADA.** `set_interpolation` devuelve `verified:false` + `interpolationValue:null` + campo `renderHonesty` con la explicación honesta completa: *"the interpolation mode is stored and readback-verified, but this Premiere build's render has been measured NOT honoring temporal keyframe interpolation"*. Exactamente el contrato pedido.

## (c) Exploración abierta (hallazgos con repro)

**X.1 `transcribe_clip_uxp` SIGUE CRASHEANDO en 1.19.0-3** — mismo error que R7: `clip.getId is not a function` con `{project_item_name:"voz_es_r7.wav", language:"es-ES", confirm_destructive:true, operation_id}` (pack es-ES available:true confirmado de nuevo). Regresión NO regresada: el fix de R7 no llegó o nunca existió. Issue vigente.
**X.2 Undo CROSS-RUTA funciona** — CEP `undo {expected_undo_stack_index:36}` revirtió un edit hecho por UXP (`manage_markers_uxp`): el marker desapareció (16→15). Las dos rutas comparten la pila de undo de Premiere. Nota: los markers UXP SÍ participan del undo (a diferencia de los markers CEP, undoRecordable:false). Repro: add marker vía UXP → CEP undo con índice del receipt → list_markers_uxp.
**X.3 Source monitor end-to-end VERDE** — `open_in_source` → `set_source_in_out {1,4}` (verified, undoSteps:2) → `get_source_monitor_info` (in 1, out 4) → `insert_from_source {video_track_index:0, audio_track_index:0}` (inserted, verified, sync-lock) → layout `0–1.28 | clipA 1.28–4.28 | bg-rest 4.28–11` = insert semantics correctos. Arg correcto: `video_track_index` (no `track_index`).
**X.4 Latencia medida:** UXP sesión persistente ≈ **0.46 s/llamada** (5 llamadas en 2.3 s + 15 s arranque); CEP con spawn ≈ **1.88 s/llamada**. UXP ~4× más rápido — para barridas grandes usar siempre session-run.
**X.5 Contratos al límite VERDE:** nombre 512 chars → rechazo "max 255" (nombra el límite real); unicode `ñ🚀unicode-clip` → ok y readback verbatim; start_seconds −5 → "must be >= 0"; playhead −1 → "must be >= 0". Errores honestos con límites concretos.
**X.6 Proxy inspect VERDE:** `manage_proxy_ingest_uxp inspect_proxy` → `{canProxy:true, hasProxy:false, offline:false}` honesto. (attach no ejercitado: muta config global de media, riesgo/beneficio bajo.)
**X.7 Prefs y sesiones VERDE:** `manage_app_preferences_uxp inspect` (3 prefs con readback nativo) y `manage_project_sessions_uxp list` (1 proyecto activo, paths redacted).

## (d) Menores / operativos

1. **Server-hold anti-patrón**: un server persistente con heartbeat reescribe el pairing continuamente y bloquea la adopción de TODOS los servers nuevos (Fase R falló completa hasta matarlo). El lease resuelve el caso "server muerto", no "server vivo-idle". Regla operativa: nunca convivir con un server-hold; una cola viva = un server.
2. **Registro de tools UXP dependiente del timing**: un server sin panel conectado registra solo ~2 stubs `_uxp`; con panel, ~92. Desde el caller se ve como "tool not found" no determinista. Recomendación: registar stubs siempre y fallar con "panel not connected" por llamada.
3. `remove_effect` CEP se niega en es-ES con el guard #674 (built-ins localizados) — los apilados de audio solo salen por la ruta nativa (remove por GUID). Correcto pero lento en limpieza.
4. Duración de secuencia (get_sequence_structure) cuenta markers fuera del contenido (dur 16 con contenido 8) — cosmético, confunde lecturas automáticas.
5. `capture_frame` con `time_seconds` cachea por clave — los drivers DEBEN usar claves únicas (lección R8, volvió a costar).

## (e) Sin tiempo de probar (para R11)

- Relink/offline end-to-end (solo probe de esquema; el flujo destructivo exige copia del media y recovery plan).
- Transcripts: bloqueado por X.1 (crash). Re-intentar en build nuevo.
- attach_proxy real y reproducción vía proxy.
- Barrida audio manual semiautomática ×55 (cierre D.1).
- `export_interchange_uxp`/`encode_media_uxp` (no implementados en panel 26.5.2, conocido).

## Estado final

Fixture canónico guardado (bg_grad 0–8 en V1, Opacidad 100 estática, 0 audio, markers heredados ≤8 s) · proyecto guardado · AME cerrado · servers de prueba cerrados · puente sano al cierre (CEP ping ok; el panel queda sin server tras cierre ordenado).

---

## APÉNDICE — Incidente post-cierre: el sweep "parado" se autocompletó (TaskStop ≠ tree-kill)

- El `TaskStop` de la Fase D mató el wrapper bash pero **no el node del sweep**: el barrido corrió los 55/55 efectos DESPUÉS de mi limpieza y guardado final (log completo en `runs/r10-phaseD-audio.log`, [51/55]…[55/55]).
- Autolimitación: al haber eliminado yo el clip de música durante la limpieza, 51/55 adds fallaron con "clipIndex out of range" (sin mutación). Los 4 adds tempranos (Agudos, Ajustador de fase, Amplificación, +1) quedaron en los clips de música que posteriormente ELIMINÉ — la polución se fue con ellos.
- **Estado verificado tras el incidente: V1 = bg_grad 0–8, 0 clips de audio, AME cerrado, proyecto re-guardado.** Fixture canónico intacto.
- Lección operativa reforzada (misma familia de R6 nota 15 y F-OP-1): `TaskStop`/`child.kill()` con `shell:true` solo mata el wrapper — para detener un driver hay que tree-kill del PID node (el driver ya lo hace a su propia salida, pero un TaskStop externo no pasa por ahí). Los 4 adds con éxito + 51 fallos del log son además un medidor incidental: **la tasa add-fallido por falta de clip es 100% detectable**, útil como canario en futuros sweeps.

---

## POST-TRIAGE DEL REPARADOR (03-10, fork sec/1.19.0-4)

### d.1 Server-hold anti-patrón → **ARBITRAJE DETERMINISTA implementado**
`claimPairing()` (uxp-pairing.ts): toda escritura del pairing se puerta al claim
existente — un claim VIVO (issuedAt fresco) con `startedAt` MÁS NUEVO gana; el server
viejo Cede la propiedad del fichero (deja de escribir) pero mantiene su listener, y su
heartbeat hace de watchdog: si el fichero del ganador se vuelve stale (murió), re-claim
automático. Empates por pid mayor. **Ningún proceso se mata.** Los docs del pairing
llevan `startedAt`. Catalog estable: los tools UXP se registran SIEMPRE (upstream los
omitía sin bridge → "tool not found" no determinista); una llamada sin bridge falla
honesta por llamada. Catálogo default: 384 → **479**.
Tests: 4 casos de arbitraje con aislamiento APPDATA total (lección: la primera versión
escribía en pares reales — corregido antes de pushear). Suite 4696/0, SELLO OK.

### D.1 Audio → **driver completado con la vía TV**: los params timeVarying (causa de
"set agotado") ahora aplican por `add_keyframe` con la misma cascada de valores. El
re-drive de los 55 queda listo (R11 puede usar el driver o el manual semiautomático).

### X.1 transcribe crash → **issue upstream [#772](…/772)**: `clip.getId()` sin guard
en `commands.cjs:916` — ProjectItem no expone `getId()` en 26.5.2; fix sugerido con
guard + identidad alternativa (el `transcribeClipProjectItem` no depende del id).

### Floor R10 → adoptado. La R11 hereda además: catálogo 479 (verificar conteo),
arbitraje (salto de propiedad entre 2 servers vivos sin matar nada — el caso que el
lease no cubría), y el driver audio con vía TV.

### Incidente (apéndice del tester) → **hueco estructural cerrado en las tools (sec/1.19.0-4 + tools)**

El TaskStop mató al bash lanzador pero no al node del driver — nuestro tree-kill vive
en el `exit handler` del PROPIO proceso, y un kill externo no pasa por ahí. Fix
estructural (watchdog de padre, mecanismo probado: padre muerto → exit 2):

- `tools/session-run.js` y `sec-tools/r8-effect-sweep.cjs`: vigilan `process.ppid`
  cada 5 s; si el lanzador muere → salida limpia que arrastra al server hijo
  (killTree). Escape hatch para lanzamientos en background legítimos:
  `SESSION_DETACHED=1`.
- Contrato actualizado: **detener un driver = tree-kill del PID del node**; un
  TaskStop del bash ya no deja huérfanos (el driver se autodestruye).
- Verificación post-incidente: V1 = bg_grad 0–8, 0 audio, 0 zombis (confirmado).

### #772 → **FIX EN NUESTRO FORK + VERIFICADO EN VIVO (sin esperar upstream)**

`uxp-plugin/commands.cjs` `transcribeClip`: guard en `getId()` (FORK-DIVERGENCE KEEP,
sec/1.19.0-5). Verificación en vivo tras reinicio canónico:

- `transcribe_clip_uxp` → `started:true, committed_unverified` ✓
- `has_transcript_uxp` → `hasTranscript:true, method:"native"` ✓
- `get_clip_transcript_uxp` → JSON real es-es con timeline de palabras ✓
- `search_clip_transcript_uxp "subtítulos"` → match en `segments[0].words[16]` ✓
- Transcript vs frase fuente (TTS Helena): **verbatim, ~100%** — "Hola. Este es un
  texto de prueba para la transcripción automática en español. Vamos a crear
  subtítulos verticales y eliminar las muletillas de este vídeo corto."

**La superficie de transcripts está desbloqueada en 26.5.2 con nuestro fork** — el
pipeline captions (transcribe → search → build_caption_artifact) queda disponible.
Issue upstream #772 queda como documentación; disposition: KEEP hasta que upstream
publique versión con guard, entonces PREFER-UPSTREAM.
