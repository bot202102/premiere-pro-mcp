# Ronda 8 — Barrida sistemática de efectos (protocolo mecánico)

> Dispara el veredicto de amplitud que R6/R7 dejaron como muestra (8/8 efectos probados
> a mano renderizan). Driver mecánico: `sec-tools/r8-effect-sweep.js` — evita de raíz el
> hazard de R7 (índices que bailan al remover: el driver re-inspecciona antes de cada
> remove y siempre limpia el efecto que acaba de probar).

## Triage previo: el "HOLD" de interpolación es gap de Adobe (con prueba)

El hallazgo negativo de R7/R8-lite quedó triageado con evidencia del propio tester:
`r8-fade-ease1.json` muestra `interpolation: "bezier"`, `interpolationValue: 5`,
**`verified: true`** — el panel escribe el modo y lo LEE DE VUELTA correctamente
(`getTemporalInterpolationMode`). El renderizador ignora la curva temporal (frames
intermedios constantes ≈ valor del keyframe anterior). **No es bug del panel ni del
server: gap de Adobe**, misma familia que `hasVideoTransition`. La matriz de
interpolación de esta ronda lo cuantifica como suite de regresión permanente.

## S-VID — barrida de los 108 matchNames de vídeo

```
node sec-tools/r8-effect-sweep.js                       # todo el catálogo (~4 h)
node sec-tools/r8-effect-sweep.js --max 10              # smoke primero (recomendado)
node sec-tools/r8-effect-sweep.js --out C:/Users/rpach/Videos/stress4/runs/r8-sweep
```

Por efecto: add → primer param escalar tocado con valor dramático (el rango se parsea
del propio error del host "must be from A to B") → captura del renderer vivo → PSNR vs
baseline → remove (con re-inspección fresca). Salida: `results.json` + `results.md`
(tabla con PSNR por efecto, no-ops separados como ∞). Efectos con PSNR ∞ tras tocar un
param: segunda pasada manual con otro param (el driver anota cuál tocó).

## S-AUD — barrida de efectos de audio (volumedetect)

```
node sec-tools/r8-effect-sweep.js --audio --preset "<epr 720x1280 usado en R7-S5>"
```

Por efecto displayName: add → param escalar dramático (patrón EQ: normalizado 0.5=0dB)
→ render mp4 → `ffmpeg volumedetect` → max_volume vs fuente (−4.9 dB) → remove.
~1 min/efecto por el render. R7 ya probó la mecánica con Ecualizador paramétrico (+21 dB
→ clipping 0.0 dB): el driver automatiza exactamente eso.

## S-INT — matriz de interpolación (regresión del gap)

Cola manual corta (el tester la hace con el harness): Opacidad y Escala × {linear, hold,
bezier} × captura a 3 puntos intermedios + post-key. Verificación esperada: receipts
`verified:true` con `interpolationValue` correcto (escritura sana) mientras el render
mantiene steps — la tabla resultante es la evidencia para el issue Adobe-side.

## Criterios de salida

- Tabla completa de 108 con tasa de render por efecto (VERDE = pipeline confirmado en amplitud).
- Lista de no-ops reales (∞) separada de "param no encontrado" (s/dato) — distintas causas.
- Audio: efectos con Δ max_volume ≥ 3 dB marcados como renderizan.
- Matriz S-INT archivada como regresión permanente en `qa/`.

## Reglas (sin cambios)

Solo stress4 · sin repo-push-issues · una cola/proceso a la vez · wait_ms 8000 al abrir ·
sin unsafe-script · evidencia `runs/r8-sweep/` + anexo en `hallazgos-r7.md`.
El driver mata su server al salir (tree-kill spawnSync). Al terminar: fixture canónico
(Opacity+Motion en V1/clip0) + `save_project_uxp`.
