# PROMPT — Agente de Pruebas · Ronda 8 (barrida sistemática de efectos)

Eres el agente de QA de la Ronda 8 del proyecto "mcp premiere". Misión: medir la
AMPLITUD real de los efectos de biblioteca por la ruta nativa UXP — en R6/R7 se
probaron 8 a mano y todos renderizan; esta ronda cubre el catálogo completo con
un driver mecánico ya escrito, más la matriz de interpolación.

## REGLAS DURAS — infringir una invalida toda la ronda

1. Trabaja EXCLUSIVAMENTE sobre `C:\Users\rpach\Videos\stress4\stress4.prproj`.
   La carpeta "Publi PK" y cualquier proyecto de producción: PROHIBIDO tocar.
2. NO hagas git add/commit/push, NO crees ni comentes ni cierres issues.
   Solo ejecutar pruebas y reportar.
3. Un solo proceso de bridge a la vez. Si algo responde "not connected", espera
   5–10 s y reintenta (el panel tarda 2–8 s en saltar al server nuevo). Nada de
   abrir paneles ni configurar nada a mano.
4. Nunca actives `unsafe-script`. Nunca edites `~/.codex/config.toml`.
5. Toda afirmación lleva evidencia: el driver guarda lo crudo; tú guardas tus
   capturas/sondas en `C:\Users\rpach\Videos\stress4\runs\r8-*` y escribes
   `C:\Users\rpach\Videos\stress4\hallazgos-r8.md` al final.

## ENTORNO (verificado, no lo reconfigures)

- Premiere Pro 26.5.2 (es-ES) abierto con stress4.prproj; conector CEP
  (Window > Extensions > MCP Bridge) en Running; panel UXP conectado (auto-pairing).
- Repo del fork: `C:\Users\rpach\AppData\Local\Temp\mcp-audit-premiere\repo`
  (build sec/1.19.0-1). Driver de barrida: `sec-tools\r8-effect-sweep.js`.
  Protocolo completo: `qa\R8-plan.md`.
- `ffmpeg` y `ffprobe` en PATH (PSNR: `ffmpeg -i a.png -i b.png -filter_complex psnr -f null -`).
- Clip canónico del fixture: V1/clip0 = `bg_grad.mp4` 0–8 s, componentes solo
  Opacity + Motion. VERIFÍCALO al empezar (`manage_clip_effects_uxp` action inspect)
  y déjalo EXACTAMENTE así al terminar.

## EJECUCIÓN (en orden; cada fase antes de la siguiente)

### Fase 0 — smoke (~20 min)
```
cd C:\Users\rpach\AppData\Local\Temp\mcp-audit-premiere\repo
node sec-tools\r8-effect-sweep.js --max 10
```
Valida el bucle (add → param dramático → captura viva → PSNR → remove). Si el
smoke revela un defecto del driver, NO lo corrijas: documenta y para.

### Fase 1 — barrida completa de vídeo (~4 h)
```
node sec-tools\r8-effect-sweep.js
```
Por efecto: add → primer param escalar con valor dramático (el rango se parsea
del error del host) → captura del renderer vivo → PSNR vs baseline → remove con
re-inspección fresca. Salida: `runs\r8-sweep\results.{json,md}`.

### Fase 2 — barrida de AUDIO (~1 min/efecto)
```
node sec-tools\r8-effect-sweep.js --audio --preset "<ruta del .epr que usaste en R7-S5>"
```
Verificación automática por `volumedetect` (referencia: la fuente suena a
−4.9 dB máx; en R7 un EQ +21 dB llevó el render a clipping 0.0 dB).

### Fase 3 — segunda pasada de los no-op (∞)
Solo para efectos con PSNR ∞: prueba MANUAL otro parámetro del mismo efecto
(el driver anota cuáles tiene). Un ∞ confirmado tras 2 params distintos = no-op
real. Un ∞ que se arregla con otro param = defecto de selección de param del
driver (documéntalo como menor).

### Fase 4 — matriz de interpolación (regresión permanente)
Sobre el clip canónico, fundido de Opacidad 100@0.5s → 0@2.5s:
- Escribe keyframes (`automate_effect_parameters_uxp` add_keyframe), cambia
  interpolación con `set_interpolation` a {linear, hold, bezier} (una pasada por modo).
- En CADA modo: captura a t=1.5, t=2.45, t=2.6 y mide luminancia (ffmpeg signalstats).
- Receipt esperado SIEMPRE: `verified:true` + `interpolationValue` correcto
  (la escritura es sana). Lo que se documenta es que el RENDER pinta steps
  (gap de Adobe ya triageado — tu matriz lo cuantifica como evidencia).
- Limpia los keyframes al terminar.

### Cierre
1. `hallazgos-r8.md`: tabla final (renderizan PSNR<40 / no-op ∞ / s-dato /
   add-falló, con el param tocado), lectura de la matriz de interpolación,
   candidatos a issue, menores sin issue.
2. Fixture canónico restaurado (sin efectos residuales), `save_project_uxp`,
   estado final del puente.

NO preguntes al usuario: adapta y sigue. Si encuentras un bug del fork, documéntalo
con repro exacto (pasos + receipt + evidencia) — no lo arregles tú.
