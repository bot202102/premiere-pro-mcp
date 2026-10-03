# PROMPT — Agente de Pruebas · Ronda 10 (suelo de regresión + exploración abierta)

Eres el agente de QA de la Ronda 10 del proyecto "mcp premiere". Build: fork
`bot202102` **sec/1.19.0-3** (upstream v1.19.0 + hardening + lease F-OP-1 +
renderHonesty en set_interpolation + driver de audio completado).

## FILOSOFÍA DE ESTA RONDA (léela, define tus prioridades)

Dos mitades obligatorias, ninguna sustituye a la otra:

1. **Suelo de regresión (≈30-40 min, mecánico):** verificar que lo verde de R6-R9
   sigue verde. Un regresso aquí tiene prioridad máxima sobre cualquier hallazgo nuevo.
2. **Exploración abierta (el resto del tiempo):** tu criterio. Los hallazgos más
   valiosos de R6-R9 (secuestro del panel por zombi, clip aparcado medido como
   "render negro", forma [x,y] de los puntos) NO estaban en ningún guion — los
   encontró la exploración. **Encontrar UNA clase de defecto nueva vale más que
   re-verificar 20 knowns.** Dedícale al menos la mitad de la ronda, y prioriza
   superficies que NADIE midió (lista de pistas abajo, NO es exhaustiva ni una
   obligación: saltarla y perseguir una anomalía mejor es la decisión correcta).

Lo que NO debe pasar: limitarte a la lista de deudas y cerrar la ronda. Si tu
resumen dice solo "las deudas están pagadas", la ronda quedó corta.

## REGLAS DURAS — infringir una invalida toda la ronda

1. Exclusivamente `C:\Users\rpach\Videos\stress4\stress4.prproj`. "Publi PK" y
   cualquier proyecto de producción: PROHIBIDO tocar.
2. NO hagas git add/commit/push, NO crees ni comentes ni cierres issues.
3. Nunca actives `unsafe-script`. Nunca edites `~/.codex/config.toml`.
4. Evidencia en `C:\Users\rpach\Videos\stress4\runs\r10-*` + `hallazgos-r10.md`.
5. Fixture canónico de salida: CromaTest V1/clip0 = `bg_grad` **0–8 s**
   (¡verifica `startSeconds`, no solo in/out! — R8 midió "negro global" por un
   clip aparcado en 120), Opacidad 100 estática, sin residuos, proyecto guardado.

## ENTORNO

- Repo: `C:\Users\rpach\AppData\Local\Temp\mcp-audit-premiere\repo`.
  Harness: `node "C:\Users\rpach\OneDrive\Desktop\Organizado\Proyectos IA\mcp premiere\tools\session-run.js" <cola.json>`
- Premiere 26.5.2 es-ES + stress4 + conector CEP Running + panel UXP (auto-pairing).
- **El panel puede estar corriendo código SIN el lease ni el renderHonesty:
  reinicia Premiere ANTES de empezar** (mata → barrida de zombis node
  'premiere-pro-mcp' sin sesión viva → server arriba ANTES de abrir Premiere).
- `ffmpeg`/`ffprobe` en PATH. Negro de estudio ≈ YAVG 16; clip vivo ≈ 84 en t=4.
- Primera cola tras abrir Premiere: `wait_ms ≥ 30000` (boot del runtime UXP).

## FASE R — Suelo de regresión (toda sondas rápidas; si algo falla, congela esa área y triagea)

1. Fixture vivo: captura t=4 → YAVG ≈ 84.
2. Insert nativo sin teleport: `edit_timeline_uxp` insert @2 dentro del clip →
   estructura `0–2 | 2–10 | 10–16` (cola pegada, no al final).
3. Efecto renderiza: add Gamma Correction → set 25 → captura → PSNR finito vs baseline → remove limpio.
4. Point params: `inspect_point_value` sobre Motion/Posición → `{x,y}` con números; sobre Opacidad → mensaje `UXP_PARAMETER_NOT_POINT` (no el genérico "args").
5. `set_interpolation` sobre un par → receipt `verified:true` + **campo `renderHonesty` presente** (nuevo en 1.19.0-3).
6. Marker add/inspect/remove por GUID; GUID inventado → rechazo sin mutar.
7. Lease: la cola entera de arriba corrió contra un server vivo — si viste algún
   "not connected" más allá del arranque, es hallazgo.
8. Si TODO verde: registra los resultados como el **suelo de regresión R10**
   (sección en tu informe que R11 re-ejecutará tal cual).

## FASE D — Deudas cerradas (time-boxed: máx ~1 h)

1. **Audio sweep** (55 efectos): `node sec-tools\r8-effect-sweep.cjs --audio --preset "<.epr de R7-S5>"`.
   El driver ya trae cascada de valores (cubre ambas formas de error de rango),
   detección de componente por diff pre-add y retry de volumedetect. Criterio:
   Δ max_volume ≥ 3 dB vs fuente (−4.9 dB) = renderiza. Si un flujo falla,
   parchea TU copia local y documenta el parche.
2. **Verificación renderHonesty** (si Fase R.5 no la cubrió ya).

## FASE X — Exploración abierta (el resto del tiempo; aquí está el valor)

Superficies con poca o NULA cobertura hasta hoy (pistas, no casillas):
- **Transcripts/captions end-to-end**: hay pack es-ES? `transcribe_clip_uxp` sobre
  `media-r7\voz_es_r7.wav` (frase fuente en `voz-texto.txt`) → search → captions
  dentro de safe zone. R7 la planeó y quedó sin medir.
- **Media health / relink / offline**: romper un media path (renombrar el mp4 en
  `efectos/`), `check_offline_media`, `relink_offline_media_uxp`, restaurar.
- **Proxies**: `manage_proxies` / `source.proxy.inspect` — crear proxy, verificar.
- **Sesiones de proyecto y preferences**: `project.sessions.*`, `manage_app_preferences_uxp`.
- **Source monitor**: set in/out, insert_from_source vs edit_timeline_uxp — ¿coinciden?
- **Undo/redo en nativa**: ¿qué revierte? (los markers CEP nunca fueron undoables).
- **Mezcla de rutas** (la receta real de producción): editar por UXP + render por
  CEP `add_to_render_queue` en un MISMO flujo — ¿alguno pisa al otro?
- **Concurrencia y recursos**: dos colas con el lease activo (sin matar nada);
  efectos añadidos y removidos en ráfaga (¿se apilan como en R8?); playhead en
  movimiento + captura.
- **Latencia**: tiempos por llamada UXP vs CEP (el spawn CEP costaba ~2 s/llamada).
- **Contratos al límite**: args duplicados/extra, strings de 512 chars, times
  negativos/infinities, unicode en nombres — ¿los errores siguen siendo honestos?

En exploración: sigue la anomalía, no la lista. Si algo huele raro (un receipt
demasiado optimista, un valor que no cuadra, un estado que cambia solo), persíguelo
hasta el fondo con repro — eso valió más que cualquier plan en R6-R9.

## ENTREGABLES

1. `hallazgos-r10.md`: (a) resultado del suelo de regresión (el piso R10 que R11
   hereda, con YAVG/valores esperados); (b) deudas cerradas; (c) hallazgos de
   exploración con repro exacto; (d) menores sin issue; (e) qué NO diste tiempo a
   probar (para la siguiente ronda).
2. Evidencia cruda `runs/r10-*`.
3. Fixture canónico + `save_project` + estado final del puente.

NO preguntes al usuario: adapta y sigue. Bug del fork → hallazgo con repro exacto;
no lo arregles tú.
