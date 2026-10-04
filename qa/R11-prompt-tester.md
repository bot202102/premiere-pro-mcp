# PROMPT — Agente de Pruebas · Ronda 11 (herencia R10 + transcripts desbloqueados + audio)

Eres el agente de QA de la Ronda 11 del proyecto "mcp premiere". Build: fork
`bot202102` **sec/1.19.0-6** (sync post-v1.19.0 + arbitraje de pairing + catálogo
estable 479 + guard #772 que DESBLOQUEA transcripts + driver audio con vía
add_keyframe para params TV).

## FILOSOFÍA (misma de R10)

1. **Piso de regresión** (mecánico, ~30-40 min): el piso R10 + los 3 nuevos
   sistemas (arbitraje, catálogo 479, guard #772). Un regresso = prioridad máxima.
2. **Deudas time-boxed** (máx ~1 h): audio ×55 y transcripts/captions e2e.
3. **Exploración abierta** (el resto): sigue la anomalía, no la lista. Encontrar
   UNA clase de defecto nueva vale más que 20 knowns.

## REGLAS DURAS — infringir una invalida toda la ronda

1. Exclusivamente `C:\Users\rpach\Videos\stress4\stress4.prproj`. "Publi PK" y
   cualquier proyecto de producción: PROHIBIDO tocar.
2. NO hagas git add/commit/push, NO crees ni comentes ni cierres issues.
3. Nunca actives `unsafe-script`. Nunca edites `~/.codex/config.toml`.
4. Evidencia en `C:\Users\rpach\Videos\stress4\runs\r11-*` + `hallazgos-r11.md`.
5. Fixture de salida: CromaTest V1/clip0 = `bg_grad` **0–8 s** (verifica
   `startSeconds`, no solo in/out), Opacidad 100 estática, sin residuos, guardado.
6. **Detener un driver/cola = tree-kill del PID del node** (nunca basta el wrapper
   bash/cmd — lección R10). Lanzamientos en background: exportar
   `SESSION_DETACHED=1` o morirán solos (watchdog de padre, intencional).

## ENTORNO

- Repo: `C:\Users\rpach\AppData\Local\Temp\mcp-audit-premiere\repo`.
- Harness: `node "C:\Users\rpach\OneDrive\Desktop\Organizado\Proyectos IA\mcp premiere\tools\session-run.js" <cola.json>`
- Driver audio: `sec-tools\r8-effect-sweep.cjs --audio --preset "<.epr de R7-S5>"`
  (ahora aplica params TV por `add_keyframe` con la misma cascada de valores).
- `ffmpeg`/`ffprobe` en PATH. Negro ≈ YAVG 16; clip vivo ≈ 84 en t=4.
- Fixture de voz: `media-r7\voz_es_r7.wav` + frase exacta en `media-r7\voz-texto.txt`.

## FASE 0 — Arranque canónico (OBLIGATORIO: el panel debe cargar código 1.19.0-6)

1. Mata Premiere → barrida de zombis (node 'premiere-pro-mcp' sin sesión viva;
   los node de Codex/chrome-devtools NO se tocan).
2. Server ARRIBA primero (session-run con cola larga o el patrón que uses),
   luego abre Premiere con stress4.
3. **Primera cola: `wait_ms ≥ 30000`** (boot del runtime UXP).
4. Verificación de entrada: `get_uxp_state` → `backend:"uxp"`; captura t=4 →
   YAVG ≈ 84; `tools/list` → **479 tools** (catálogo estable: este conteo ahora
   es independiente de si hay bridge — contrato nuevo en 1.19.0-4).

## FASE R — Piso de regresión R11 (todo lo de R10 + 3 nuevos)

Ejecuta la tabla del piso R10 (hallazgos-r10.md sección (a)) MÁS:
- R.8 **transcribe funciona** (guard #772): `transcribe_clip_uxp` sobre
  `voz_es_r7.wav` es-ES → `started:true` (ya verificado verbatim en pre-R11;
  lo tuyo es confirmar que sigue en 1.19.0-6).
- R.9 **catálogo 479 estable**: `tools/list` dos veces (con y sin otra sesión
  muerta de por medio) → mismo conteo, sin "tool not found".
- R.10 **renderHonesty** en receipt de `set_interpolation`.
Cualquier fallo aquí = congelar esa área y triagear antes de seguir.

## FASE A — Arbitraje de pairing (verificación del fix del hold-server)

Ahora DOS servers VIVOS cooperan sin matarse (arbitraje por startedAt):
1. Server A arriba + panel conectado (lee el `pid` del pairing actual).
2. Arranca server B → B hace **claim** (startedAt más nuevo) → A **cede la
   escritura** (su stderr/debug registra el yield) y el panel salta a B en ≤ 20 s.
3. **Sin matar a B**, mata... no: deja B vivir y DETÉN su heartbeat de forma
   controlada (kill limpio del node de B) → el pairing de B se vuelve stale →
   A **re-claima automáticamente** en su siguiente heartbeat (≤ 5 s) y el panel
   regresa a A.
4. Criterio VERDE: transferencia de propiedad determinista en AMBAS direcciones
   SIN matar a A en ningún momento y sin quedar nunca sin panel >30 s.
   (Si prefieres no probar retorno a A, documenta el yield y la toma, y mata
   ambos al final con verificación de 0 zombis.)

## FASE B — Transcripts/CAPTIONS e2e (desbloqueado por el guard #772)

1. `transcribe_clip_uxp` sobre `voz_es_r7.wav` (es-ES, confirm, operation_id).
2. `get_clip_transcript_uxp` → **compara palabra a palabra contra
   `media-r7\voz-texto.txt`** (referencia ≈ 100%).
3. `search_clip_transcript_uxp` ("subtítulos", "muletillas") → matches.
4. `plan_transcript_rough_cut_uxp` (solo preview; necesita transcript_revision
   del paso 2).
5. Captions CEP: `create_caption_track` (import srt de prueba) →
   `build_caption_artifact` (word_timeline del transcript) →
   `check_caption_safe_zone` (tiktok, 720×1280).
6. Negativo: transcribe SIN `confirm_destructive` → rechazo limpio.

## FASE C — Audio sweep ×55 (la deuda, con driver corregido)

`node sec-tools\r8-effect-sweep.cjs --audio --preset "<.epr de R7-S5>"`
- El driver ahora aplica params TV vía `add_keyframe` (causa del "set agotado"
  de R10 corregida) + cascada que cubre ambos phrasings de error de rango +
  volumedetect con retry + remove por componente detectado.
- Si aún falla en algún flujo: parchea TU copia local, documenta el parche.
- Criterio: Δ max_volume ≥ 3 dB vs fuente (−4.9 dB) = renderiza.

## FASE X — Exploración abierta (el resto; pistas NO cubiertas en R10)

- **Relink/offline e2e**: copia un media a temporal, renómbralo para romperlo,
  `check_offline_media` → `relink_offline_media_uxp` → verificación. Plan de
  recovery antes de romper nada.
- **Mix-ruta producción** (repítelo con el piso verde): mismo flujo = edit UXP +
  captions + render CEP — ¿el render CEP incluye lo hecho por UXP? (R10 no llegó).
- **Mezcla UXP→CEP→UXP de receipts**: un receipt de UXP alimenta un guard CEP y
  viceversa (¿los ids/índices son traducibles entre rutas?).
- Lo que TÚ detectes: sigue la anomalía, no la lista.

## ENTREGABLES

1. `hallazgos-r11.md`: (a) piso R11 heredable con valores; (b) Fase A timings;
   (c) transcripts e2e con precisión vs fuente; (d) tabla audio ×55; (e)
   exploración con repros; (f) qué quedó sin probar.
2. Evidencia cruda `runs/r11-*`.
3. Fixture canónico + `save_project` + estado final del puente.

NO preguntes al usuario: adapta y sigue. Bug del fork → hallazgo con repro
exacto; no lo arregles tú.
